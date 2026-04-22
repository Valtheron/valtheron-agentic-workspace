import { describe, it, expect } from 'vitest';
import { computeForsetiProfile, isForsetiPending, type ForsetiProfile } from '../services/forsetiScoring.js';

describe('Forseti Power Framework scoring', () => {
  describe('computeForsetiProfile — mapped categories', () => {
    it('computes a deterministic profile for trading → Analytiker', () => {
      const result = computeForsetiProfile({
        valtheronCategory: 'trading',
        agentName: 'Market Data Harvester',
        agentDescription: 'Sammelt Daten von globalen Finanzmärkten in Echtzeit.',
        modelName: 'claude-sonnet-4-5-20250929',
      });

      expect(isForsetiPending(result)).toBe(false);
      const p = result as ForsetiProfile;

      // Determinism: same inputs → same outputs
      const again = computeForsetiProfile({
        valtheronCategory: 'trading',
        agentName: 'Market Data Harvester',
        agentDescription: 'Sammelt Daten von globalen Finanzmärkten in Echtzeit.',
        modelName: 'claude-sonnet-4-5-20250929',
      });
      expect(again).toEqual(result);

      // Source fully populated for audit
      expect(p.source.valtheron_category).toBe('trading');
      expect(p.source.forseti_category).toBe('Analytiker');
      expect(p.source.model_modifier_applied).toBe('claude-sonnet-4-5-20250929');
      expect(p.source.base_scores).toEqual({
        information_access: 6,
        resource_control: 4,
        authority_permission: 5,
        network_position: 4,
        synthesis_application: 6,
      });

      // "daten" keyword → +0.5 on information_access
      expect(p.source.keyword_modifiers_applied).toContainEqual({
        keyword: 'daten',
        dimension: 'information_access',
        delta: 0.5,
      });

      // Shape: 5 dimensions × 6 sub-dimensions = 30
      expect(Object.keys(p.dimensions)).toHaveLength(5);
      const subCount = Object.values(p.dimensions).reduce((acc, d) => acc + Object.keys(d.sub_dimensions).length, 0);
      expect(subCount).toBe(30);

      // Every sub-dim has a label drawn from the 10-level tables (not "Level N")
      for (const dim of Object.values(p.dimensions)) {
        for (const sd of Object.values(dim.sub_dimensions)) {
          expect(sd.label).not.toMatch(/^Level \d+$/);
          expect(sd.score).toBeGreaterThanOrEqual(0);
          expect(sd.score).toBeLessThanOrEqual(9);
        }
      }

      // Unified level is within 0-9
      expect(p.unified_level).toBeGreaterThanOrEqual(0);
      expect(p.unified_level).toBeLessThanOrEqual(9);
    });

    it('applies Opus model modifier only on synthesis_application', () => {
      const sonnet = computeForsetiProfile({
        valtheronCategory: 'development',
        agentName: 'Code Architect',
        agentDescription: 'Designs systems.',
        modelName: 'claude-sonnet-4-5-20250929',
      }) as ForsetiProfile;

      const opus = computeForsetiProfile({
        valtheronCategory: 'development',
        agentName: 'Code Architect',
        agentDescription: 'Designs systems.',
        modelName: 'claude-opus-4-5-20251101',
      }) as ForsetiProfile;

      // Opus gives +1.0, Sonnet gives +0.5 → Opus synthesis_application > Sonnet's
      expect(opus.dimensions.synthesis_application.score).toBeGreaterThan(
        sonnet.dimensions.synthesis_application.score,
      );
      // Information_access is not a modifier target → identical between the two
      expect(opus.dimensions.information_access.score).toBe(sonnet.dimensions.information_access.score);
    });

    it('clamps scores at 9.0 (no overflow from stacked modifiers)', () => {
      const result = computeForsetiProfile({
        valtheronCategory: 'development',
        agentName: 'CEO Director Chef Innovation Strategist',
        agentDescription: 'Community influencer with design and analyse focus.',
        modelName: 'claude-opus-4-5-20251101',
      }) as ForsetiProfile;

      for (const dim of Object.values(result.dimensions)) {
        for (const sd of Object.values(dim.sub_dimensions)) {
          expect(sd.score).toBeLessThanOrEqual(9);
          expect(sd.score).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('computeForsetiProfile — pending categories', () => {
    it('returns pending for security with authored reason', () => {
      const result = computeForsetiProfile({
        valtheronCategory: 'security',
        agentName: 'Firewall Guard',
        agentDescription: 'Monitors network traffic.',
        modelName: 'claude-sonnet-4-5-20250929',
      });

      expect(isForsetiPending(result)).toBe(true);
      if (!isForsetiPending(result)) throw new Error('type narrowing');
      expect(result.valtheron_category).toBe('security');
      expect(result.reason).toMatch(/Sicherheits-Domäne/);
    });

    it('returns pending for extension categories (e.g. fintech)', () => {
      const result = computeForsetiProfile({
        valtheronCategory: 'fintech',
        agentName: 'Payment Gateway',
        agentDescription: 'Processes payments.',
        modelName: 'claude-sonnet-4-5-20250929',
      });

      expect(isForsetiPending(result)).toBe(true);
    });

    it('returns pending for unknown category with diagnostic reason', () => {
      const result = computeForsetiProfile({
        valtheronCategory: 'nonexistent-category',
        agentName: 'X',
        agentDescription: '',
        modelName: '',
      });

      expect(isForsetiPending(result)).toBe(true);
      if (!isForsetiPending(result)) throw new Error('type narrowing');
      expect(result.reason).toMatch(/Unknown Valtheron category/);
    });
  });

  describe('ethical invariants', () => {
    it('never invents scores when the category has no mapping', () => {
      const result = computeForsetiProfile({
        valtheronCategory: 'support',
        agentName: 'Help Desk',
        agentDescription: '',
        modelName: 'claude-opus-4-5-20251101',
      });
      // Even with the strongest model, an unmapped category stays pending.
      expect(isForsetiPending(result)).toBe(true);
    });

    it('source block contains every input needed to reproduce the score', () => {
      const result = computeForsetiProfile({
        valtheronCategory: 'trading',
        agentName: 'Forschung Analyst',
        agentDescription: 'Betreibt Recherche und Analyse.',
        modelName: 'claude-haiku-4-5-20251001',
      }) as ForsetiProfile;

      // Required fields for auditability
      expect(result.source).toHaveProperty('valtheron_category');
      expect(result.source).toHaveProperty('forseti_category');
      expect(result.source).toHaveProperty('base_scores');
      expect(result.source).toHaveProperty('model_modifier_applied');
      expect(result.source).toHaveProperty('keyword_modifiers_applied');

      // Keywords "forschung", "recherche", "analyse" all hit information_access
      const hits = result.source.keyword_modifiers_applied.map((k) => k.keyword);
      expect(hits).toContain('forschung');
      expect(hits).toContain('recherche');
      expect(hits).toContain('analyse');
    });
  });
});
