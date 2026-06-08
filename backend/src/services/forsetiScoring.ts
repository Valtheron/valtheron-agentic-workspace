// Forseti Power Framework — TypeScript port of evaluate_agent() from the
// canonical Python source at the-290-agent-database/forseti/.
//
// This module is the ONLY place where Forseti scores are computed. It is
// deterministic: identical inputs always yield identical profiles. No
// Math.random(), no Math.sin() decoration — every score is traceable to
// (category base) + (model modifier) + (keyword modifier) + (index variation).
//
// Ethical invariant:
//   Agents whose Valtheron category has no authored mapping to a Forseti
//   category return null. Null means "profile pending" — visible emptiness,
//   not fabricated authority.

import powerFramework from '../data/forseti/power_framework.json' with { type: 'json' };
import categoryMapping from '../data/forseti/category_mapping.json' with { type: 'json' };

export interface ForsetiSubDimension {
  name: string;
  score: number;
  label: string;
}

export interface ForsetiDimension {
  name: string;
  score: number;
  sub_dimensions: Record<string, ForsetiSubDimension>;
}

export interface ForsetiProfile {
  unified_level: number;
  power_level: string;
  power_level_value: number;
  dimensions: Record<string, ForsetiDimension>;
  source: {
    valtheron_category: string;
    forseti_category: string;
    base_scores: Record<string, number>;
    model_modifier_applied: string | null;
    keyword_modifiers_applied: Array<{ keyword: string; dimension: string; delta: number }>;
  };
}

export interface ForsetiPending {
  status: 'pending';
  valtheron_category: string;
  reason: string;
}

export type ForsetiResult = ForsetiProfile | ForsetiPending;

/**
 * Formal state wrapper for an agent_forseti_profiles row.
 *
 *   State = { value: b ∈ ℬ, status: S, timestamp: t, pendingReason: r }
 *   mit b ≠ 1
 *
 * `value` is boolean and constitutionally `false` (= 0). The value `true`
 * (= 1) is excluded by type — no profile, computed or pending, claims
 * absolute authority. The measurable 5 %-layer is always accompanied by
 * the unmeasured 19-fold substrate; therefore b ≠ 1 holds across the
 * union. Any future refactor must preserve this invariant: do not widen
 * `value` to `boolean`, and do not remove the `assertForsetiState()`
 * runtime check in the API layer.
 */
export interface ForsetiState {
  value: false;
  status: 'computed' | 'pending';
  timestamp: string;
  pendingReason: string | null;
  profile: ForsetiProfile | null;
}

export function wrapAsForsetiState(result: ForsetiResult, computedAt: string): ForsetiState {
  if (isForsetiPending(result)) {
    return {
      value: false,
      status: 'pending',
      timestamp: computedAt,
      pendingReason: result.reason,
      profile: null,
    };
  }
  return {
    value: false,
    status: 'computed',
    timestamp: computedAt,
    pendingReason: null,
    profile: result,
  };
}

export function assertForsetiState(s: ForsetiState): void {
  // Type-level guarantees (`value: false`) are stripped at runtime. This
  // assertion is the last line of defence before the state crosses an
  // API boundary.
  if ((s.value as unknown) !== false) {
    throw new Error('ForsetiState invariant violated: value must be false (b ≠ 1)');
  }
  if (s.status !== 'computed' && s.status !== 'pending') {
    throw new Error(`ForsetiState invariant violated: status "${s.status}" not in {computed, pending}`);
  }
  if (s.status === 'computed' && s.profile === null) {
    throw new Error('ForsetiState invariant violated: status=computed requires profile ≠ null');
  }
  if (s.status === 'pending' && s.profile !== null) {
    throw new Error('ForsetiState invariant violated: status=pending requires profile === null');
  }
  if (s.status === 'pending' && !s.pendingReason) {
    throw new Error('ForsetiState invariant violated: status=pending requires pendingReason');
  }
}

interface ScoringInput {
  valtheronCategory: string;
  agentName: string;
  agentDescription: string;
  modelName: string;
}

type DimensionKey =
  | 'information_access'
  | 'resource_control'
  | 'authority_permission'
  | 'network_position'
  | 'synthesis_application';

interface PowerFrameworkShape {
  dimensions: Record<DimensionKey, { label: string; sub_dimensions: string[] }>;
  sub_dimension_labels: Record<string, string[]>;
  scale: { interpretation: Record<string, string> };
  category_base_scores: Record<string, Record<DimensionKey, number>>;
  model_modifiers: Record<string, Partial<Record<DimensionKey, number>>>;
  keyword_modifiers: Record<string, Partial<Record<DimensionKey, number>>>;
  default_base_score: Record<DimensionKey, number>;
}

interface CategoryMappingShape {
  mappings: Record<
    string,
    { forseti_category: null; pending_reason: string } | { forseti_category: string; rationale: string }
  >;
}

const PF = powerFramework as unknown as PowerFrameworkShape;
const CM = categoryMapping as unknown as CategoryMappingShape;

const DIMENSION_KEYS: DimensionKey[] = [
  'information_access',
  'resource_control',
  'authority_permission',
  'network_position',
  'synthesis_application',
];

function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

function labelFor(subKey: string, score: number): string {
  const labels = PF.sub_dimension_labels[subKey];
  if (!labels) return `Level ${Math.round(score)}`;
  const rounded = clamp(Math.round(score), 0, 9);
  return labels[rounded] ?? `Level ${rounded}`;
}

function powerLevelNameFor(unifiedLevel: number): { name: string; value: number } {
  const rounded = clamp(Math.round(unifiedLevel), 0, 9);
  const name = PF.scale.interpretation[String(rounded)] ?? `LEVEL_${rounded}`;
  return { name, value: rounded };
}

/**
 * Compute a Forseti profile for a single agent. Returns `null`-shaped
 * ForsetiPending when the agent's Valtheron category has no authored mapping.
 */
export function computeForsetiProfile(input: ScoringInput): ForsetiResult {
  const mapping = CM.mappings[input.valtheronCategory];
  if (!mapping) {
    return {
      status: 'pending',
      valtheron_category: input.valtheronCategory,
      reason: `Unknown Valtheron category "${input.valtheronCategory}" — no entry in category_mapping.json`,
    };
  }
  if (mapping.forseti_category === null) {
    return {
      status: 'pending',
      valtheron_category: input.valtheronCategory,
      reason: mapping.pending_reason,
    };
  }

  const forsetiCategory = mapping.forseti_category;
  const base = PF.category_base_scores[forsetiCategory] ?? PF.default_base_score;

  // Start from category base, apply model modifier, then keyword modifiers.
  const scores: Record<DimensionKey, number> = {
    information_access: base.information_access,
    resource_control: base.resource_control,
    authority_permission: base.authority_permission,
    network_position: base.network_position,
    synthesis_application: base.synthesis_application,
  };

  let modelModifierApplied: string | null = null;
  for (const [modelKey, modifiers] of Object.entries(PF.model_modifiers)) {
    if (input.modelName.includes(modelKey)) {
      for (const [dim, delta] of Object.entries(modifiers)) {
        scores[dim as DimensionKey] += delta as number;
      }
      modelModifierApplied = modelKey;
      break;
    }
  }

  const keywordModifiersApplied: Array<{ keyword: string; dimension: string; delta: number }> = [];
  const combinedText = `${input.agentName} ${input.agentDescription}`.toLowerCase();
  for (const [keyword, modifiers] of Object.entries(PF.keyword_modifiers)) {
    if (combinedText.includes(keyword)) {
      for (const [dim, delta] of Object.entries(modifiers)) {
        scores[dim as DimensionKey] += delta as number;
        keywordModifiersApplied.push({ keyword, dimension: dim, delta: delta as number });
      }
    }
  }

  // Clamp to 0-9.
  for (const dim of DIMENSION_KEYS) {
    scores[dim] = clamp(scores[dim], 0, 9);
  }

  // Derive the 30 sub-dimensions. Variation is deterministic by index — NOT
  // random, NOT sin-based. Formula verbatim from power_framework.py.
  const dimensions: Record<string, ForsetiDimension> = {};
  let totalAverage = 0;

  for (const dimKey of DIMENSION_KEYS) {
    const dimDef = PF.dimensions[dimKey];
    const baseScore = scores[dimKey];
    const subs: Record<string, ForsetiSubDimension> = {};
    let subSum = 0;

    dimDef.sub_dimensions.forEach((subKey, index) => {
      const variation = ((index % 3) - 1) * 0.3;
      const score = clamp(baseScore + variation, 0, 9);
      const rounded = Math.round(score * 10) / 10;
      subs[subKey] = {
        name: subKey,
        score: rounded,
        label: labelFor(subKey, rounded),
      };
      subSum += rounded;
    });

    const avg = subSum / dimDef.sub_dimensions.length;
    dimensions[dimKey] = {
      name: dimDef.label,
      score: Math.round(avg * 100) / 100,
      sub_dimensions: subs,
    };
    totalAverage += avg;
  }

  const unified = totalAverage / DIMENSION_KEYS.length;
  const { name: plName, value: plValue } = powerLevelNameFor(unified);

  return {
    unified_level: Math.round(unified * 100) / 100,
    power_level: plName,
    power_level_value: plValue,
    dimensions,
    source: {
      valtheron_category: input.valtheronCategory,
      forseti_category: forsetiCategory,
      base_scores: { ...base },
      model_modifier_applied: modelModifierApplied,
      keyword_modifiers_applied: keywordModifiersApplied,
    },
  };
}

export function isForsetiPending(r: ForsetiResult): r is ForsetiPending {
  return (r as ForsetiPending).status === 'pending';
}
