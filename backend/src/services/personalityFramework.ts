// Personality Framework (Handbuch Kapitel 6).
//
// The agent catalog stores a compact personality (creativity, analyticalDepth,
// riskTolerance + communicationStyle + archetype). The handbook describes a
// richer 12-parameter framework, 8 base archetypes and 3 layer metrics
// (LDS, MI, EP). This module derives the full framework DETERMINISTICALLY from
// the agent's real stored attributes — no Math.random, no fabricated base
// data. Identical inputs always yield an identical profile (same contract as
// forsetiScoring.ts / capabilityScoring.ts).
//
// "Generation" in the handbook == this deterministic derivation; "validation"
// == range + consistency checks; "comparison" == the per-parameter vectors
// the API exposes so the UI can diff two agents.

export const PERSONALITY_PARAMETERS = [
  'formality',
  'verbosity',
  'warmth',
  'creativity',
  'structure',
  'risk_tolerance',
  'proactivity',
  'curiosity',
  'collaboration',
  'depth',
  'confidence',
  'adaptability',
] as const;

export type PersonalityParameterKey = (typeof PERSONALITY_PARAMETERS)[number];
export type PersonalityParameters = Record<PersonalityParameterKey, number>;

export interface LayerMetrics {
  lds: number; // Layer Depth Score — breadth↔depth of knowledge
  mi: number; // Measurability Index — objectivity of the work
  ep: number; // Emergence Potential — capacity for unexpected results
}

export interface PersonalityArchetypeInfo {
  key: string;
  name: string;
  description: string;
}

export interface PersonalityProfile {
  parameters: PersonalityParameters;
  layerMetrics: LayerMetrics;
  archetype: PersonalityArchetypeInfo;
  validation: { valid: boolean; issues: string[] };
  source: {
    creativity: number;
    analyticalDepth: number;
    riskTolerance: number;
    communicationStyle: string;
    storedArchetype: string;
  };
}

export interface PersonalityInput {
  creativity: number; // 0–100
  analyticalDepth: number; // 0–100
  riskTolerance: number; // 0–100
  communicationStyle: string;
  archetype: string;
}

// Bilingual labels for the parameter poles (low ↔ high), used by the UI.
export const PARAMETER_POLES: Record<PersonalityParameterKey, [string, string]> = {
  formality: ['Locker', 'Formell'],
  verbosity: ['Knapp', 'Ausführlich'],
  warmth: ['Sachlich', 'Warmherzig'],
  creativity: ['Konventionell', 'Kreativ'],
  structure: ['Fließend', 'Strukturiert'],
  risk_tolerance: ['Vorsichtig', 'Mutig'],
  proactivity: ['Reaktiv', 'Proaktiv'],
  curiosity: ['Fokussiert', 'Neugierig'],
  collaboration: ['Autonom', 'Kollaborativ'],
  depth: ['Breit', 'Tief'],
  confidence: ['Abwägend', 'Bestimmt'],
  adaptability: ['Konsistent', 'Flexibel'],
};

// The 8 base archetypes (handbook Kap. 6), each with a prototype vector over
// the 12 parameters. Classification picks the nearest prototype (Euclidean).
const ARCHETYPES: Array<{ info: PersonalityArchetypeInfo; prototype: PersonalityParameters }> = [
  {
    info: { key: 'analyst', name: 'Der Analyst', description: 'systematisch, präzise, datengetrieben' },
    prototype: vec({
      formality: 0.7,
      verbosity: 0.6,
      warmth: 0.3,
      creativity: 0.35,
      structure: 0.9,
      risk_tolerance: 0.3,
      proactivity: 0.5,
      curiosity: 0.6,
      collaboration: 0.4,
      depth: 0.85,
      confidence: 0.7,
      adaptability: 0.35,
    }),
  },
  {
    info: { key: 'kreativer', name: 'Der Kreative', description: 'innovativ, experimentell, inspirierend' },
    prototype: vec({
      formality: 0.3,
      verbosity: 0.6,
      warmth: 0.6,
      creativity: 0.95,
      structure: 0.35,
      risk_tolerance: 0.7,
      proactivity: 0.7,
      curiosity: 0.9,
      collaboration: 0.6,
      depth: 0.5,
      confidence: 0.6,
      adaptability: 0.85,
    }),
  },
  {
    info: { key: 'mentor', name: 'Der Mentor', description: 'unterstützend, geduldig, ermutigend' },
    prototype: vec({
      formality: 0.4,
      verbosity: 0.7,
      warmth: 0.95,
      creativity: 0.5,
      structure: 0.55,
      risk_tolerance: 0.35,
      proactivity: 0.55,
      curiosity: 0.6,
      collaboration: 0.9,
      depth: 0.6,
      confidence: 0.6,
      adaptability: 0.7,
    }),
  },
  {
    info: { key: 'umsetzer', name: 'Der Umsetzer', description: 'effizient, zielorientiert, pragmatisch' },
    prototype: vec({
      formality: 0.55,
      verbosity: 0.35,
      warmth: 0.4,
      creativity: 0.4,
      structure: 0.7,
      risk_tolerance: 0.55,
      proactivity: 0.9,
      curiosity: 0.45,
      collaboration: 0.55,
      depth: 0.5,
      confidence: 0.85,
      adaptability: 0.55,
    }),
  },
  {
    info: { key: 'innovator', name: 'Der Innovator', description: 'visionär, mutig, zukunftsorientiert' },
    prototype: vec({
      formality: 0.4,
      verbosity: 0.55,
      warmth: 0.5,
      creativity: 0.9,
      structure: 0.45,
      risk_tolerance: 0.9,
      proactivity: 0.85,
      curiosity: 0.85,
      collaboration: 0.55,
      depth: 0.6,
      confidence: 0.8,
      adaptability: 0.8,
    }),
  },
  {
    info: { key: 'spezialist', name: 'Der Spezialist', description: 'tiefgründig, fokussiert, detailorientiert' },
    prototype: vec({
      formality: 0.65,
      verbosity: 0.6,
      warmth: 0.35,
      creativity: 0.4,
      structure: 0.8,
      risk_tolerance: 0.35,
      proactivity: 0.5,
      curiosity: 0.55,
      collaboration: 0.4,
      depth: 0.95,
      confidence: 0.75,
      adaptability: 0.3,
    }),
  },
  {
    info: { key: 'kommunikator', name: 'Der Kommunikator', description: 'vermittelnd, klar, verbindend' },
    prototype: vec({
      formality: 0.5,
      verbosity: 0.75,
      warmth: 0.8,
      creativity: 0.6,
      structure: 0.55,
      risk_tolerance: 0.45,
      proactivity: 0.65,
      curiosity: 0.65,
      collaboration: 0.9,
      depth: 0.5,
      confidence: 0.7,
      adaptability: 0.75,
    }),
  },
  {
    info: { key: 'hueter', name: 'Der Hüter', description: 'sorgfältig, verlässlich, schützend' },
    prototype: vec({
      formality: 0.8,
      verbosity: 0.5,
      warmth: 0.45,
      creativity: 0.3,
      structure: 0.85,
      risk_tolerance: 0.2,
      proactivity: 0.45,
      curiosity: 0.4,
      collaboration: 0.5,
      depth: 0.7,
      confidence: 0.65,
      adaptability: 0.3,
    }),
  },
];

function vec(p: PersonalityParameters): PersonalityParameters {
  return p;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

const STYLE_FORMALITY: Record<string, number> = { formal: 0.85, technical: 0.7, diplomatic: 0.55, casual: 0.25 };
const STYLE_WARMTH: Record<string, number> = { diplomatic: 0.8, casual: 0.7, formal: 0.4, technical: 0.3 };
const STYLE_COLLAB: Record<string, number> = { diplomatic: 0.85, casual: 0.6, formal: 0.5, technical: 0.45 };

/**
 * Derive the full 12-parameter personality + layer metrics + archetype from
 * the agent's stored attributes. Deterministic; documented formulas below.
 */
export function computePersonalityProfile(input: PersonalityInput): PersonalityProfile {
  const c = clamp01(input.creativity / 100);
  const d = clamp01(input.analyticalDepth / 100);
  const r = clamp01(input.riskTolerance / 100);
  const style = (input.communicationStyle || '').toLowerCase();

  const structure = round2(clamp01(0.35 + d * 0.5));
  const creativity = round2(c);

  const parameters: PersonalityParameters = {
    formality: round2(STYLE_FORMALITY[style] ?? 0.5),
    verbosity: round2(clamp01(0.3 + d * 0.5)),
    warmth: round2(STYLE_WARMTH[style] ?? 0.5),
    creativity,
    structure,
    risk_tolerance: round2(r),
    proactivity: round2(clamp01(0.3 + r * 0.5)),
    curiosity: round2(clamp01(0.3 + c * 0.6)),
    collaboration: round2(STYLE_COLLAB[style] ?? 0.5),
    depth: round2(d),
    confidence: round2(clamp01(0.4 + r * 0.4 + d * 0.1)),
    adaptability: round2(clamp01(0.3 + c * 0.4 + (1 - structure) * 0.2)),
  };

  // Layer metrics (handbook ranges: LDS 0.3–0.6+, MI 0.4–0.8+, EP 0.5–0.7+).
  const layerMetrics: LayerMetrics = {
    lds: round2(clamp01(0.3 + parameters.depth * 0.4)),
    mi: round2(clamp01(0.4 + parameters.structure * 0.3 + parameters.formality * 0.1)),
    ep: round2(clamp01(0.4 + parameters.creativity * 0.3 + parameters.curiosity * 0.1)),
  };

  const archetype = classifyArchetype(parameters);
  const validation = validatePersonality(parameters);

  return {
    parameters,
    layerMetrics,
    archetype,
    validation,
    source: {
      creativity: input.creativity,
      analyticalDepth: input.analyticalDepth,
      riskTolerance: input.riskTolerance,
      communicationStyle: input.communicationStyle,
      storedArchetype: input.archetype,
    },
  };
}

/** Nearest-prototype classification across the 8 base archetypes. */
export function classifyArchetype(p: PersonalityParameters): PersonalityArchetypeInfo {
  let best = ARCHETYPES[0];
  let bestDist = Infinity;
  for (const a of ARCHETYPES) {
    let sum = 0;
    for (const key of PERSONALITY_PARAMETERS) {
      const diff = p[key] - a.prototype[key];
      sum += diff * diff;
    }
    if (sum < bestDist) {
      bestDist = sum;
      best = a;
    }
  }
  return best.info;
}

/** Range + light consistency validation. */
export function validatePersonality(p: PersonalityParameters): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  for (const key of PERSONALITY_PARAMETERS) {
    const v = p[key];
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 1) {
      issues.push(`Parameter "${key}" außerhalb [0,1]: ${v}`);
    }
  }
  // Consistency: very high structure should not coexist with very high adaptability.
  if (p.structure > 0.85 && p.adaptability > 0.85) {
    issues.push('Inkonsistenz: sehr hohe Struktur und sehr hohe Flexibilität zugleich.');
  }
  return { valid: issues.length === 0, issues };
}
