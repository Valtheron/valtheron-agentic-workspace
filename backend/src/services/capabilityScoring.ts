// Agent Capability Scoring — TypeScript implementation of the canonical
// capability model at the-290-agent-database/capability-model/model.json.
//
// This module is the ONLY place where capability profiles are computed.
// Deterministic: identical inputs always yield identical profiles.
// No Math.random(), no Math.sin() — every value is traceable to
// (creativity, analyticalDepth, successRate, layer/sub base_formula,
//  index-based variation (i % 3 - 1) * 0.3).
//
// State invariant: State = { value: b ∈ ℬ, status, timestamp, pendingReason }
//                  mit b ≠ 1. `value` is typed as the literal `false` —
//                  no cell ever claims absolute authority.

import model from '../data/capability-model/model.json' with { type: 'json' };

// ───────── Types (canonical mirrors of model.json) ─────────

export interface SubDimensionScore {
  key: string;
  label: string;
  desc: string;
  value: number;
}

export interface LayerScore {
  key: string;
  name: string;
  cssClass: string;
  color: string;
  score: number;
  sub_dimensions: SubDimensionScore[];
}

export interface PersonalityInfluenceModifier {
  key: 'personality_influence';
  name: string;
  archetype: string;
  communication_style: string;
  creativity_impact: number;
  depth_impact: number;
}

export interface PerformanceHistoryModifier {
  key: 'performance_history';
  name: string;
  success_rate: number;
  tasks_total: number;
  reliability_index: number;
}

export interface TestResultsModifier {
  key: 'test_results';
  name: string;
  tests: Array<{
    id: string;
    category: string;
    name: string;
    passed: boolean;
    duration: number;
    timestamp: string;
  }>;
}

export type CapabilityModifier = PersonalityInfluenceModifier | PerformanceHistoryModifier | TestResultsModifier;

export interface CapabilityProfile {
  layers: LayerScore[];
  modifiers: CapabilityModifier[];
  source: {
    inputs: { rate: number; depth: number; creativity: number };
    model_version: string;
  };
}

/**
 * Formal state wrapper for an agent_capabilities row.
 *
 *   State = { value: b ∈ ℬ, status: S, timestamp: t, pendingReason: r }
 *   mit b ≠ 1
 *
 * `value` is typed as the literal `false` (= 0). The `true` branch is
 * excluded by the TypeScript type. No capability row, computed or
 * pending, claims absolute authority. `assertCapabilityState()` enforces
 * the invariant at API boundaries.
 */
export interface CapabilityState {
  value: false;
  status: 'computed' | 'pending';
  timestamp: string;
  pendingReason: string | null;
  profile: CapabilityProfile | null;
}

// ───────── Inputs ─────────

export interface AgentForScoring {
  personality: {
    creativity: number; // 0-100
    analyticalDepth: number; // 0-100
    archetype: string;
    communicationStyle: string;
  };
  successRate: number; // 0-100
  tasksCompleted: number;
  failedTasks: number;
  testResults: TestResultsModifier['tests'];
}

// ───────── Compiled formula functions ─────────
// The canonical model.json carries formulas as strings like "5 + depth * 3".
// We validate them at module load time against a safe regex (only
// lowercase letters, digits, dot, plus, minus, star, parentheses,
// whitespace) and compile them once into functions. No user input ever
// reaches these strings — they come from the repo-owned JSON.

type FormulaInputs = { rate: number; depth: number; creativity: number };
type CompiledFormula = (i: FormulaInputs) => number;

const FORMULA_SAFE = /^[a-z0-9\s+\-*/().]+$/;

function compileFormula(formula: string): CompiledFormula {
  if (!FORMULA_SAFE.test(formula)) {
    throw new Error(`Refusing to compile unsafe capability formula: "${formula}"`);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function('rate', 'depth', 'creativity', `return ${formula};`) as (
    rate: number,
    depth: number,
    creativity: number,
  ) => number;
  return ({ rate, depth, creativity }: FormulaInputs) => fn(rate, depth, creativity);
}

interface CompiledSub {
  key: string;
  label: string;
  desc: string;
  compute: CompiledFormula;
}

interface CompiledLayer {
  key: string;
  name: string;
  cssClass: string;
  color: string;
  scoreCompute: CompiledFormula;
  subs: CompiledSub[];
}

interface ModelShape {
  layers: Array<{
    key: string;
    name: string;
    cssClass: string;
    color: string;
    score_formula: string;
    sub_dimensions: Array<{
      key: string;
      label: string;
      desc: string;
      base_formula: string;
      range: number;
    }>;
  }>;
  sub_dimension_variation_formula: { formula: string };
}

const MODEL = model as unknown as ModelShape;

const COMPILED_LAYERS: CompiledLayer[] = MODEL.layers.map((layer) => ({
  key: layer.key,
  name: layer.name,
  cssClass: layer.cssClass,
  color: layer.color,
  scoreCompute: compileFormula(layer.score_formula),
  subs: layer.sub_dimensions.map((sub) => ({
    key: sub.key,
    label: sub.label,
    desc: sub.desc,
    compute: compileFormula(sub.base_formula),
  })),
}));

function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

function roundOne(x: number): number {
  return Math.round(x * 10) / 10;
}

// ───────── Compute ─────────

export function computeCapabilityProfile(agent: AgentForScoring): CapabilityProfile {
  const rate = agent.successRate / 100;
  const depth = agent.personality.analyticalDepth / 100;
  const creativity = agent.personality.creativity / 100;
  const inputs: FormulaInputs = { rate, depth, creativity };

  const layers: LayerScore[] = COMPILED_LAYERS.map((layer) => {
    const score = Math.round(layer.scoreCompute(inputs));
    const subs: SubDimensionScore[] = layer.subs.map((sub, index) => {
      const base = sub.compute(inputs);
      const offset = ((index % 3) - 1) * 0.3;
      const value = clamp(roundOne(base + offset), 0, 9);
      return { key: sub.key, label: sub.label, desc: sub.desc, value };
    });
    return {
      key: layer.key,
      name: layer.name,
      cssClass: layer.cssClass,
      color: layer.color,
      score,
      sub_dimensions: subs,
    };
  });

  const modifiers: CapabilityModifier[] = [
    {
      key: 'personality_influence',
      name: 'Personality Influence',
      archetype: agent.personality.archetype,
      communication_style: agent.personality.communicationStyle,
      creativity_impact: Math.round(agent.personality.creativity * 0.15),
      depth_impact: Math.round(agent.personality.analyticalDepth * 0.12),
    },
    {
      key: 'performance_history',
      name: 'Performance History',
      success_rate: agent.successRate,
      tasks_total: agent.tasksCompleted + agent.failedTasks,
      reliability_index: Number((agent.successRate * 0.95 + (agent.tasksCompleted > 200 ? 5 : 0)).toFixed(1)),
    },
    {
      key: 'test_results',
      name: 'Test Results',
      tests: agent.testResults,
    },
  ];

  return {
    layers,
    modifiers,
    source: {
      inputs,
      model_version: '1.0.0',
    },
  };
}

// ───────── State wrapper ─────────

export function wrapAsCapabilityState(profile: CapabilityProfile, timestamp: string): CapabilityState {
  return {
    value: false,
    status: 'computed',
    timestamp,
    pendingReason: null,
    profile,
  };
}

export function pendingCapabilityState(reason: string, timestamp: string): CapabilityState {
  return {
    value: false,
    status: 'pending',
    timestamp,
    pendingReason: reason,
    profile: null,
  };
}

export function assertCapabilityState(s: CapabilityState): void {
  if ((s.value as unknown) !== false) {
    throw new Error('CapabilityState invariant violated: value must be false (b ≠ 1)');
  }
  if (s.status !== 'computed' && s.status !== 'pending') {
    throw new Error(`CapabilityState invariant violated: status "${s.status}" not in {computed, pending}`);
  }
  if (s.status === 'computed' && s.profile === null) {
    throw new Error('CapabilityState invariant violated: status=computed requires profile ≠ null');
  }
  if (s.status === 'pending' && s.profile !== null) {
    throw new Error('CapabilityState invariant violated: status=pending requires profile === null');
  }
  if (s.status === 'pending' && !s.pendingReason) {
    throw new Error('CapabilityState invariant violated: status=pending requires pendingReason');
  }
}
