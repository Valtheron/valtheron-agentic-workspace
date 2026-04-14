#!/usr/bin/env node
// Syncs the root knowledge-base/ into the Vite-bundled frontend at
// frontend/src/data/kb/. Run manually after updating knowledge-base/:
//
//   node scripts/sync-kb-to-frontend.mjs
//
// Outputs:
//   frontend/src/data/kb/manifest.json  — 1:1 copy of knowledge-base/manifest.json
//   frontend/src/data/kb/summaries.json — { "summaries/<cat>/<file>.md": "<md>", ... }
//
// PDFs and other large assets stay in knowledge-base/ — they are not bundled.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const KB_SRC = path.join(REPO_ROOT, 'knowledge-base');
const KB_DST = path.join(REPO_ROOT, 'frontend', 'src', 'data', 'kb');

async function walkMd(dir, baseRel) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.posix.join(baseRel, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMd(full, rel)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      out.push({ full, rel });
    }
  }
  return out;
}

async function main() {
  const manifestSrc = path.join(KB_SRC, 'manifest.json');
  const summariesDir = path.join(KB_SRC, 'summaries');

  await fs.mkdir(KB_DST, { recursive: true });

  // Copy manifest.
  const manifestRaw = await fs.readFile(manifestSrc, 'utf8');
  const manifest = JSON.parse(manifestRaw);
  await fs.writeFile(
    path.join(KB_DST, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8',
  );

  // Walk summaries/ and bundle into a single JSON map keyed by the
  // "summaries/..." path (matches manifest.documents[].summary_path).
  const files = await walkMd(summariesDir, 'summaries');
  files.sort((a, b) => a.rel.localeCompare(b.rel));
  const summaries = {};
  for (const f of files) {
    summaries[f.rel] = await fs.readFile(f.full, 'utf8');
  }
  await fs.writeFile(
    path.join(KB_DST, 'summaries.json'),
    JSON.stringify(summaries, null, 2) + '\n',
    'utf8',
  );

  console.log(
    `KB sync complete: manifest (${manifest.documents?.length ?? 0} docs, ` +
      `${Object.keys(manifest.categories ?? {}).length} categories), ` +
      `${files.length} summary files bundled.`,
  );
}

main().catch(err => {
  console.error('KB sync failed:', err);
  process.exit(1);
});
