import { describe, it, expect } from 'vitest';
import {
  computePersonalityProfile,
  validatePersonality,
  classifyArchetype,
  PERSONALITY_PARAMETERS,
  type PersonalityParameters,
} from '../services/personalityFramework.js';

const baseInput = {
  creativity: 80,
  analyticalDepth: 70,
  riskTolerance: 60,
  communicationStyle: 'formal',
  archetype: 'analytiker',
};

describe('personality framework', () => {
  it('is deterministic: identical input → identical profile', () => {
    const a = computePersonalityProfile(baseInput);
    const b = computePersonalityProfile(baseInput);
    expect(a).toEqual(b);
  });

  it('produces all 12 parameters within [0,1]', () => {
    const p = computePersonalityProfile(baseInput);
    expect(Object.keys(p.parameters).sort()).toEqual([...PERSONALITY_PARAMETERS].sort());
    for (const key of PERSONALITY_PARAMETERS) {
      expect(p.parameters[key]).toBeGreaterThanOrEqual(0);
      expect(p.parameters[key]).toBeLessThanOrEqual(1);
    }
  });

  it('maps stored base params straight through', () => {
    const p = computePersonalityProfile(baseInput);
    expect(p.parameters.creativity).toBeCloseTo(0.8, 2);
    expect(p.parameters.risk_tolerance).toBeCloseTo(0.6, 2);
    expect(p.parameters.depth).toBeCloseTo(0.7, 2);
  });

  it('formality follows communication style', () => {
    expect(
      computePersonalityProfile({ ...baseInput, communicationStyle: 'formal' }).parameters.formality,
    ).toBeGreaterThan(computePersonalityProfile({ ...baseInput, communicationStyle: 'casual' }).parameters.formality);
  });

  it('layer metrics stay within [0,1]', () => {
    const { layerMetrics } = computePersonalityProfile(baseInput);
    for (const v of [layerMetrics.lds, layerMetrics.mi, layerMetrics.ep]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('classifies one of the 8 archetypes', () => {
    const keys = new Set([
      'analyst',
      'kreativer',
      'mentor',
      'umsetzer',
      'innovator',
      'spezialist',
      'kommunikator',
      'hueter',
    ]);
    expect(keys.has(computePersonalityProfile(baseInput).archetype.key)).toBe(true);
  });

  it('a highly creative/curious profile classifies as kreativer or innovator', () => {
    const p = computePersonalityProfile({
      creativity: 98,
      analyticalDepth: 40,
      riskTolerance: 80,
      communicationStyle: 'casual',
      archetype: 'kreativer',
    });
    expect(['kreativer', 'innovator']).toContain(p.archetype.key);
  });

  it('validation flags out-of-range params', () => {
    const bad = { creativity: 2 } as unknown as PersonalityParameters;
    expect(validatePersonality(bad).valid).toBe(false);
  });

  it('validation passes a normal computed profile', () => {
    expect(computePersonalityProfile(baseInput).validation.valid).toBe(true);
  });

  it('classifyArchetype is stable for a prototype-like vector', () => {
    const analystish: PersonalityParameters = {
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
    };
    expect(classifyArchetype(analystish).key).toBe('analyst');
  });
});
