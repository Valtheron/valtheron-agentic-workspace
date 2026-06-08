import { describe, it, expect } from 'vitest';
import {
  computeCapabilityProfile,
  wrapAsCapabilityState,
  pendingCapabilityState,
  assertCapabilityState,
  type AgentForScoring,
  type CapabilityState,
} from '../services/capabilityScoring.js';

const sampleAgent: AgentForScoring = {
  personality: {
    creativity: 70,
    analyticalDepth: 85,
    archetype: 'analytiker',
    communicationStyle: 'technical',
  },
  successRate: 90,
  tasksCompleted: 220,
  failedTasks: 5,
  testResults: [
    {
      id: 't1',
      category: 'DOM',
      name: 'Domain Knowledge Test',
      passed: true,
      duration: 3.2,
      timestamp: '2026-04-22T00:00:00Z',
    },
    {
      id: 't2',
      category: 'EDGE',
      name: 'Edge Case Handling',
      passed: false,
      duration: 5.1,
      timestamp: '2026-04-22T00:00:00Z',
    },
  ],
};

describe('Capability model scoring', () => {
  describe('computeCapabilityProfile — shape invariants', () => {
    it('returns 5 layers × 6 sub-dimensions = 30 metrics', () => {
      const p = computeCapabilityProfile(sampleAgent);
      expect(p.layers).toHaveLength(5);
      const subs = p.layers.flatMap((l) => l.sub_dimensions);
      expect(subs).toHaveLength(30);
    });

    it('every sub-dimension value is in [0, 9] with one decimal precision', () => {
      const p = computeCapabilityProfile(sampleAgent);
      for (const layer of p.layers) {
        for (const sub of layer.sub_dimensions) {
          expect(sub.value).toBeGreaterThanOrEqual(0);
          expect(sub.value).toBeLessThanOrEqual(9);
          // One decimal: value * 10 is integer
          expect(Number.isInteger(sub.value * 10)).toBe(true);
        }
      }
    });

    it('every layer has key, name, cssClass, color, and integer score', () => {
      const p = computeCapabilityProfile(sampleAgent);
      for (const layer of p.layers) {
        expect(layer.key).toBeTruthy();
        expect(layer.name).toBeTruthy();
        expect(layer.cssClass).toBeTruthy();
        expect(layer.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(Number.isInteger(layer.score)).toBe(true);
      }
    });

    it('exposes source.inputs so every score is reproducible', () => {
      const p = computeCapabilityProfile(sampleAgent);
      expect(p.source.inputs.rate).toBeCloseTo(0.9);
      expect(p.source.inputs.depth).toBeCloseTo(0.85);
      expect(p.source.inputs.creativity).toBeCloseTo(0.7);
    });
  });

  describe('computeCapabilityProfile — determinism', () => {
    it('same inputs yield same outputs (no random, no Math.sin)', () => {
      const a = computeCapabilityProfile(sampleAgent);
      const b = computeCapabilityProfile(sampleAgent);
      expect(a).toEqual(b);
    });

    it('sub-dimension variation is deterministic per index: offset = (i % 3 - 1) * 0.3', async () => {
      // Each layer's 6 sub-dimensions can carry different base_formulas. We
      // therefore evaluate the canonical model.json's formula for each sub
      // and verify the runtime value equals base + index-offset, clamped.
      const { default: model } = await import('../data/capability-model/model.json', { with: { type: 'json' } });
      const m = model as {
        layers: Array<{ key: string; sub_dimensions: Array<{ key: string; base_formula: string }> }>;
      };
      const rate = sampleAgent.successRate / 100;
      const depth = sampleAgent.personality.analyticalDepth / 100;
      const creativity = sampleAgent.personality.creativity / 100;
      const evalSafe = (formula: string) => {
        if (!/^[a-z0-9\s+\-*/().]+$/.test(formula)) throw new Error('unsafe formula');
        return new Function('rate', 'depth', 'creativity', `return ${formula};`)(rate, depth, creativity) as number;
      };
      const clamp = (x: number) => Math.min(9, Math.max(0, x));
      const round1 = (x: number) => Math.round(x * 10) / 10;

      const p = computeCapabilityProfile(sampleAgent);
      // Pick Resource Control as a representative layer (any of the 5 works).
      const rcDef = m.layers.find((l) => l.key === 'resource_control')!;
      const rc = p.layers.find((l) => l.key === 'resource_control')!;
      rcDef.sub_dimensions.forEach((subDef, index) => {
        const base = evalSafe(subDef.base_formula);
        const offset = ((index % 3) - 1) * 0.3;
        const expected = clamp(round1(base + offset));
        expect(rc.sub_dimensions[index].value).toBeCloseTo(expected, 1);
      });
    });
  });

  describe('computeCapabilityProfile — modifiers', () => {
    it('personality_influence carries the authored formulas verbatim', () => {
      const p = computeCapabilityProfile(sampleAgent);
      const pi = p.modifiers.find((m) => m.key === 'personality_influence');
      expect(pi).toMatchObject({
        archetype: 'analytiker',
        communication_style: 'technical',
        creativity_impact: Math.round(70 * 0.15), // 11 (not 10.5 — author spec uses round)
        depth_impact: Math.round(85 * 0.12), // 10
      });
    });

    it('performance_history reliability_index respects the tasks > 200 boost', () => {
      const p = computeCapabilityProfile(sampleAgent);
      const ph = p.modifiers.find((m) => m.key === 'performance_history');
      // 90 * 0.95 + 5 (tasksCompleted=220 > 200) = 90.5
      expect(ph).toMatchObject({
        success_rate: 90,
        tasks_total: 225,
        reliability_index: 90.5,
      });
    });

    it('performance_history reliability_index skips the boost when tasksCompleted ≤ 200', () => {
      const modest = { ...sampleAgent, tasksCompleted: 150 };
      const p = computeCapabilityProfile(modest);
      const ph = p.modifiers.find((m) => m.key === 'performance_history');
      // 90 * 0.95 + 0 = 85.5
      expect(ph).toMatchObject({ reliability_index: 85.5 });
    });

    it('test_results are passed through verbatim', () => {
      const p = computeCapabilityProfile(sampleAgent);
      const tr = p.modifiers.find((m) => m.key === 'test_results');
      expect(tr).toMatchObject({
        tests: sampleAgent.testResults,
      });
    });
  });

  describe('clamping behaviour', () => {
    it('caps sub-dimensions at 9 when base_formula would exceed', () => {
      const maxed: AgentForScoring = {
        ...sampleAgent,
        personality: { ...sampleAgent.personality, creativity: 100, analyticalDepth: 100 },
        successRate: 100,
      };
      const p = computeCapabilityProfile(maxed);
      for (const layer of p.layers) {
        for (const sub of layer.sub_dimensions) {
          expect(sub.value).toBeLessThanOrEqual(9);
        }
      }
    });

    it('floors sub-dimensions at 0 when inputs are minimal', () => {
      const zeroed: AgentForScoring = {
        ...sampleAgent,
        personality: { ...sampleAgent.personality, creativity: 0, analyticalDepth: 0 },
        successRate: 0,
      };
      const p = computeCapabilityProfile(zeroed);
      for (const layer of p.layers) {
        for (const sub of layer.sub_dimensions) {
          expect(sub.value).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('State wrapper — b ≠ 1 invariant', () => {
    const now = '2026-04-22T12:00:00.000Z';

    it('wraps a computed profile with value=false, status=computed', () => {
      const p = computeCapabilityProfile(sampleAgent);
      const state = wrapAsCapabilityState(p, now);
      expect(state.value).toBe(false);
      expect(state.status).toBe('computed');
      expect(state.timestamp).toBe(now);
      expect(state.pendingReason).toBeNull();
      expect(state.profile).not.toBeNull();
    });

    it('pendingCapabilityState builds value=false, status=pending, profile=null', () => {
      const state = pendingCapabilityState('input missing: knowledge scope', now);
      expect(state.value).toBe(false);
      expect(state.status).toBe('pending');
      expect(state.profile).toBeNull();
      expect(state.pendingReason).toBe('input missing: knowledge scope');
    });

    it('assertCapabilityState rejects value=true (b = 1 is forbidden)', () => {
      const tampered = {
        value: true as unknown as false,
        status: 'computed' as const,
        timestamp: now,
        pendingReason: null,
        profile: null,
      };
      expect(() => assertCapabilityState(tampered as CapabilityState)).toThrow(/value must be false/);
    });

    it('assertCapabilityState rejects value=1 (numeric truthy form of b = 1)', () => {
      const tampered = {
        value: 1 as unknown as false,
        status: 'computed' as const,
        timestamp: now,
        pendingReason: null,
        profile: null,
      };
      expect(() => assertCapabilityState(tampered as CapabilityState)).toThrow(/value must be false/);
    });

    it('assertCapabilityState rejects computed without profile', () => {
      const broken = {
        value: false as const,
        status: 'computed' as const,
        timestamp: now,
        pendingReason: null,
        profile: null,
      };
      expect(() => assertCapabilityState(broken)).toThrow(/requires profile ≠ null/);
    });

    it('assertCapabilityState rejects pending with profile attached', () => {
      const p = computeCapabilityProfile(sampleAgent);
      const broken = {
        value: false as const,
        status: 'pending' as const,
        timestamp: now,
        pendingReason: 'x',
        profile: p,
      };
      expect(() => assertCapabilityState(broken)).toThrow(/requires profile === null/);
    });

    it('assertCapabilityState rejects pending without reason', () => {
      const broken = {
        value: false as const,
        status: 'pending' as const,
        timestamp: now,
        pendingReason: null,
        profile: null,
      };
      expect(() => assertCapabilityState(broken)).toThrow(/requires pendingReason/);
    });
  });

  describe('formula safety', () => {
    it('canonical formulas use only the whitelisted character set', async () => {
      const { default: model } = await import('../data/capability-model/model.json', { with: { type: 'json' } });
      const SAFE = /^[a-z0-9\s+\-*/().]+$/;
      for (const layer of (
        model as { layers: Array<{ score_formula: string; sub_dimensions: Array<{ base_formula: string }> }> }
      ).layers) {
        expect(SAFE.test(layer.score_formula)).toBe(true);
        for (const sub of layer.sub_dimensions) {
          expect(SAFE.test(sub.base_formula)).toBe(true);
        }
      }
    });
  });
});
