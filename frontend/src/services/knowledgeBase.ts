// Knowledge-Base service: maps Valtheron agents to curated documents from the
// bundled manifest and exposes helpers for UI rendering and system-prompt
// enrichment.
//
// Data flow:
//   knowledge-base/manifest.json  →  frontend/src/data/kb/manifest.json
//   knowledge-base/summaries/**   →  frontend/src/data/kb/summaries.json
// (sync via scripts/sync-kb-to-frontend.mjs)
//
// Public API:
//   loadKBManifest()               — typed access to the bundled manifest
//   getSummaryContent(summaryPath) — markdown text for a KnowledgeDoc
//   getKnowledgeScopeForAgent(...) — deterministic scope (top-5 docs + primary categories)
//   enrichSystemPromptWithKB(...)  — appends "## Wissensbasis" section

import type {
  AgentCategory,
  KnowledgeDoc,
  KnowledgeDocIntegrityStatus,
  KnowledgeScope,
} from '../types';
import manifestJson from '../data/kb/manifest.json';
import summariesJson from '../data/kb/summaries.json';

interface RawManifestDoc {
  id: string;
  filename: string;
  path: string;
  title: string;
  category: string;
  subcategory: string;
  difficulty: string;
  language: string;
  format: string;
  tags: string[];
  summary_path: string;
  integrityStatus?: KnowledgeDocIntegrityStatus;
  detectedFormat?: string;
  pageCount?: number;
  fileSize?: number;
}

// Integrity states considered usable for agent scoping. "missing" covers the
// 218 original catalog entries whose PDFs are placeholders — the summary is
// still valuable context. "valid" covers all binary-complete PDFs.
const SCOPE_ELIGIBLE_STATUSES: ReadonlySet<KnowledgeDocIntegrityStatus> = new Set([
  'valid',
  'missing',
]);

export function isDocScopeEligible(doc: KnowledgeDoc): boolean {
  if (!doc.integrityStatus) return true; // fallback when not annotated
  return SCOPE_ELIGIBLE_STATUSES.has(doc.integrityStatus);
}

interface RawManifest {
  version: string;
  generated: string;
  total_documents: number;
  schema_version: string;
  categories: Record<string, { label: string; document_count: number }>;
  documents: RawManifestDoc[];
}

export interface KBManifest {
  version: string;
  generated: string;
  totalDocuments: number;
  categories: Record<string, { label: string; documentCount: number }>;
  documents: KnowledgeDoc[];
}

const SUMMARIES = summariesJson as Record<string, string>;

function normaliseDoc(raw: RawManifestDoc): KnowledgeDoc {
  return {
    id: raw.id,
    title: raw.title,
    category: raw.category,
    subcategory: raw.subcategory,
    difficulty: raw.difficulty,
    language: raw.language,
    format: raw.format,
    tags: raw.tags ?? [],
    summaryPath: raw.summary_path,
    integrityStatus: raw.integrityStatus,
    detectedFormat: raw.detectedFormat,
    pageCount: raw.pageCount,
    fileSize: raw.fileSize,
  };
}

let cachedManifest: KBManifest | null = null;

export function loadKBManifest(): KBManifest {
  if (cachedManifest) return cachedManifest;
  const raw = manifestJson as RawManifest;
  cachedManifest = {
    version: raw.version,
    generated: raw.generated,
    totalDocuments: raw.total_documents,
    categories: Object.fromEntries(
      Object.entries(raw.categories).map(([key, meta]) => [
        key,
        { label: meta.label, documentCount: meta.document_count },
      ]),
    ),
    documents: raw.documents.map(normaliseDoc),
  };
  return cachedManifest;
}

export function getSummaryContent(summaryPath: string): string | undefined {
  return SUMMARIES[summaryPath];
}

// Agent-category → ordered list of KB-category keys. Order matters: the first
// entry is treated as "primary" for tag-ranking tie-breaks.
export const AGENT_CATEGORY_KB_MAP: Record<AgentCategory, string[]> = {
  trading: ['trading', 'fintech'],
  fintech: ['fintech', 'trading'],
  security: ['offensive', 'defensive', 'appsec', 'cloud', 'osint', 'iot-ot'],
  'ai-native': ['ai-native', 'meta'],
  meta: ['meta', 'education'],
  'specialized-data': ['specialized-data', 'ai-native'],
  development: ['appsec', 'cloud', 'education'],
  qa: ['appsec', 'offensive', 'education'],
  documentation: ['education', 'certifications'],
  deployment: ['cloud', 'defensive'],
  analyst: ['osint', 'defensive', 'education'],
  support: ['education', 'certifications'],
  integration: ['cloud', 'appsec'],
  monitoring: ['defensive', 'cloud'],
  hybrid: ['meta', 'education', 'ai-native'],
  'human-centric': ['education', 'certifications'],
};

const MAX_DOCS_PER_AGENT = 5;

function tokenise(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2);
}

// Scores how well a doc matches a set of agent tokens. Tags weigh more than
// subcategory/title hits; ties fall back to doc-id order for determinism.
function scoreDoc(doc: KnowledgeDoc, tokens: Set<string>): number {
  if (tokens.size === 0) return 0;
  let score = 0;
  for (const tag of doc.tags) {
    if (tokens.has(tag.toLowerCase())) score += 3;
  }
  for (const t of tokenise(doc.subcategory)) {
    if (tokens.has(t)) score += 2;
  }
  for (const t of tokenise(doc.title)) {
    if (tokens.has(t)) score += 1;
  }
  return score;
}

export interface ScopeInput {
  category: AgentCategory;
  name: string;
  description?: string;
}

export function getKnowledgeScopeForAgent(agent: ScopeInput): KnowledgeScope {
  const manifest = loadKBManifest();
  const primaryCategories = AGENT_CATEGORY_KB_MAP[agent.category] ?? [];

  if (primaryCategories.length === 0) {
    return { primaryCategories: [], docs: [] };
  }

  const tokens = new Set<string>([
    ...tokenise(agent.name),
    ...tokenise(agent.description ?? ''),
  ]);

  const candidates = manifest.documents.filter(
    d => primaryCategories.includes(d.category) && isDocScopeEligible(d),
  );

  // Category-priority index: earlier → better.
  const catPriority = new Map(primaryCategories.map((c, i) => [c, i]));

  const ranked = [...candidates].sort((a, b) => {
    const sa = scoreDoc(a, tokens);
    const sb = scoreDoc(b, tokens);
    if (sa !== sb) return sb - sa;
    const pa = catPriority.get(a.category) ?? 999;
    const pb = catPriority.get(b.category) ?? 999;
    if (pa !== pb) return pa - pb;
    return a.id.localeCompare(b.id);
  });

  return {
    primaryCategories,
    docs: ranked.slice(0, MAX_DOCS_PER_AGENT),
  };
}

export function enrichSystemPromptWithKB(
  basePrompt: string,
  scope: KnowledgeScope,
): string {
  if (!scope.docs.length) return basePrompt;
  const manifest = loadKBManifest();
  const categoryLabels = scope.primaryCategories
    .map(c => manifest.categories[c]?.label ?? c)
    .join(', ');
  const bullets = scope.docs
    .map(d => `- [${d.id}] ${d.title} (${d.category}/${d.subcategory})`)
    .join('\n');
  return `${basePrompt.trimEnd()}

## Wissensbasis
Scope: ${categoryLabels}
Relevante Dokumente:
${bullets}`;
}
