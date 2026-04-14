import { describe, it, expect } from 'vitest';
import type { AgentCategory } from '../types';
import {
  AGENT_CATEGORY_KB_MAP,
  enrichSystemPromptWithKB,
  getKnowledgeScopeForAgent,
  getSummaryContent,
  isDocScopeEligible,
  loadKBManifest,
} from '../services/knowledgeBase';
import { loadValtheronAgents } from '../services/valtheronAgents';

const ALL_AGENT_CATEGORIES: AgentCategory[] = [
  'trading',
  'security',
  'development',
  'qa',
  'documentation',
  'deployment',
  'analyst',
  'support',
  'integration',
  'monitoring',
  'hybrid',
  'meta',
  'fintech',
  'ai-native',
  'human-centric',
  'specialized-data',
];

describe('loadKBManifest', () => {
  it('exposes at least 200 documents across 14 KB categories', () => {
    const manifest = loadKBManifest();
    expect(manifest.totalDocuments).toBeGreaterThanOrEqual(200);
    expect(manifest.documents.length).toBeGreaterThanOrEqual(200);
    expect(Object.keys(manifest.categories).length).toBe(14);
  });

  it('includes the core KB categories', () => {
    const manifest = loadKBManifest();
    for (const key of ['offensive', 'defensive', 'appsec', 'cloud', 'fintech', 'ai-native', 'trading']) {
      expect(manifest.categories[key]).toBeDefined();
    }
  });

  it('every doc has a non-empty id, title and summaryPath', () => {
    const manifest = loadKBManifest();
    for (const doc of manifest.documents.slice(0, 50)) {
      expect(doc.id).toMatch(/^doc-/);
      expect(doc.title.length).toBeGreaterThan(0);
      expect(doc.summaryPath).toMatch(/^summaries\//);
    }
  });
});

describe('AGENT_CATEGORY_KB_MAP', () => {
  it('maps every agent category to at least one KB category', () => {
    for (const cat of ALL_AGENT_CATEGORIES) {
      const mapped = AGENT_CATEGORY_KB_MAP[cat];
      expect(mapped, `mapping for ${cat}`).toBeDefined();
      expect(mapped.length).toBeGreaterThan(0);
    }
  });
});

describe('getKnowledgeScopeForAgent', () => {
  it('returns at most 5 docs per agent', () => {
    const scope = getKnowledgeScopeForAgent({
      category: 'security',
      name: 'Penetration Tester',
      description: 'Web and network penetration testing',
    });
    expect(scope.docs.length).toBeLessThanOrEqual(5);
  });

  it('routes a security agent to offensive/defensive categories', () => {
    const scope = getKnowledgeScopeForAgent({
      category: 'security',
      name: 'Penetration Tester',
      description: 'Web and network penetration testing',
    });
    expect(scope.primaryCategories).toContain('offensive');
    expect(scope.docs.length).toBeGreaterThan(0);
    expect(scope.docs.some(d => d.category === 'offensive')).toBe(true);
  });

  it('ranks tag-matching docs first (Market Data Harvester → trading/market)', () => {
    const scope = getKnowledgeScopeForAgent({
      category: 'trading',
      name: 'Market Data Harvester',
      description: 'Collects market data for trading strategies',
    });
    expect(scope.primaryCategories[0]).toBe('trading');
    expect(scope.docs.length).toBeGreaterThan(0);
    // Top-ranked doc should touch trading or market terminology.
    const top = scope.docs[0];
    const hay = (top.tags.join(' ') + ' ' + top.title + ' ' + top.subcategory).toLowerCase();
    expect(hay).toMatch(/trading|market|fintech/);
  });

  it('returns deterministic results across repeated calls', () => {
    const input = {
      category: 'ai-native' as AgentCategory,
      name: 'LLM Security Analyst',
      description: 'Monitors LLM-based systems',
    };
    const a = getKnowledgeScopeForAgent(input);
    const b = getKnowledgeScopeForAgent(input);
    expect(a.docs.map(d => d.id)).toEqual(b.docs.map(d => d.id));
  });

  it('returns empty docs when the target categories have no content', () => {
    // specialized-data currently has 0 documents, ai-native is the fallback.
    // We still expect at most 5 docs, and all from the mapped categories.
    const scope = getKnowledgeScopeForAgent({
      category: 'specialized-data',
      name: 'Synthetic Data Engineer',
      description: 'Generates synthetic datasets',
    });
    for (const doc of scope.docs) {
      expect(['specialized-data', 'ai-native']).toContain(doc.category);
    }
  });
});

describe('integrity filtering', () => {
  it('every doc carries an integrityStatus after sync', () => {
    const manifest = loadKBManifest();
    const missingStatus = manifest.documents.filter(d => !d.integrityStatus);
    expect(missingStatus.length).toBe(0);
  });

  it('flags the known-bad Manus uploads', () => {
    const manifest = loadKBManifest();
    const expectBad: Record<string, string> = {
      'doc-222': 'zero-pages',
      'doc-228': 'wrong-format-html',
      'doc-230': 'wrong-format-html',
      'doc-232': 'empty',
      'doc-238': 'wrong-format-other',
    };
    for (const [id, expected] of Object.entries(expectBad)) {
      const doc = manifest.documents.find(d => d.id === id);
      expect(doc, `manifest must still contain ${id}`).toBeDefined();
      expect(doc!.integrityStatus).toBe(expected);
    }
  });

  it('broken docs are excluded from agent scopes', () => {
    const brokenIds = new Set(['doc-222', 'doc-228', 'doc-230', 'doc-232', 'doc-238']);
    const agents = loadValtheronAgents();
    for (const a of agents) {
      for (const doc of a.knowledgeScope?.docs ?? []) {
        expect(brokenIds.has(doc.id)).toBe(false);
        expect(isDocScopeEligible(doc)).toBe(true);
      }
    }
  });

  it('placeholder catalog entries (missing files) are still scope-eligible', () => {
    const manifest = loadKBManifest();
    const catalog = manifest.documents.filter(d => d.integrityStatus === 'missing');
    expect(catalog.length).toBeGreaterThan(100); // ~218 catalog placeholders
    expect(isDocScopeEligible(catalog[0])).toBe(true);
  });
});

describe('enrichSystemPromptWithKB', () => {
  it('leaves the prompt untouched when no docs are in scope', () => {
    const out = enrichSystemPromptWithKB('BASE', { primaryCategories: [], docs: [] });
    expect(out).toBe('BASE');
  });

  it('appends a Wissensbasis section with doc ids when scope is non-empty', () => {
    const scope = getKnowledgeScopeForAgent({
      category: 'security',
      name: 'Penetration Tester',
      description: 'Web pentesting',
    });
    const out = enrichSystemPromptWithKB('BASE PROMPT', scope);
    expect(out.startsWith('BASE PROMPT')).toBe(true);
    expect(out).toContain('## Wissensbasis');
    expect(out).toContain(scope.docs[0].id);
    expect(out).toContain(scope.docs[0].title);
  });
});

describe('getSummaryContent', () => {
  it('returns markdown text for a known summary path', () => {
    const manifest = loadKBManifest();
    const firstDoc = manifest.documents.find(d => d.summaryPath);
    expect(firstDoc).toBeDefined();
    const content = getSummaryContent(firstDoc!.summaryPath);
    expect(typeof content).toBe('string');
    expect((content ?? '').length).toBeGreaterThan(0);
  });

  it('returns undefined for unknown paths', () => {
    expect(getSummaryContent('summaries/does-not-exist.md')).toBeUndefined();
  });
});

describe('loadValtheronAgents integration', () => {
  const agents = loadValtheronAgents();

  it('produces 290 agents with a knowledgeScope on each', () => {
    expect(agents).toHaveLength(290);
    for (const a of agents) {
      expect(a.knowledgeScope).toBeDefined();
      expect(Array.isArray(a.knowledgeScope!.primaryCategories)).toBe(true);
      expect(Array.isArray(a.knowledgeScope!.docs)).toBe(true);
    }
  });

  it('enriches the system prompt with Wissensbasis for agents with docs', () => {
    const withDocs = agents.find(a => (a.knowledgeScope?.docs.length ?? 0) > 0);
    expect(withDocs).toBeDefined();
    expect(withDocs!.systemPrompt).toContain('## Wissensbasis');
  });

  it('caps the doc count at 5 per agent', () => {
    for (const a of agents) {
      expect((a.knowledgeScope?.docs.length ?? 0)).toBeLessThanOrEqual(5);
    }
  });
});
