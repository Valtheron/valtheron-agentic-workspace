#!/usr/bin/env node
// Syncs the root knowledge-base/ into the Vite-bundled frontend at
// frontend/src/data/kb/. Run manually after updating knowledge-base/:
//
//   node scripts/sync-kb-to-frontend.mjs
//
// Outputs:
//   frontend/src/data/kb/manifest.json  — enriched copy of the root manifest,
//     each document annotated with integrityStatus / detectedFormat / pageCount
//     based on the actual file on disk (root manifest stays untouched).
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

// Lightweight PDF page counter: grep-matches "/Type /Page" occurrences in the
// raw PDF bytes. Not 100 % accurate for obfuscated or object-stream PDFs, but
// reliable enough to distinguish 0-page shells from real documents.
function countPdfPages(buf) {
  const text = buf.toString('latin1');
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 0;
}

function detectFormat(buf) {
  if (buf.length === 0) return 'empty';
  const head5 = buf.slice(0, 5).toString('binary');
  if (head5.startsWith('%PDF-')) return 'pdf';
  const head8Lower = buf.slice(0, 8).toString('utf8').toLowerCase();
  if (
    head8Lower.startsWith('<!doctyp') ||
    head8Lower.startsWith('<html') ||
    head8Lower.startsWith('<?xml') ||
    head8Lower.startsWith('<!--')
  ) {
    return 'html';
  }
  if (head5.startsWith('# ') || head5.startsWith('## ')) return 'markdown';
  return 'other';
}

async function analyseDocFile(doc) {
  const abs = path.join(KB_SRC, doc.path ?? '', doc.filename ?? '');
  let stat;
  try {
    stat = await fs.stat(abs);
  } catch {
    return { integrityStatus: 'missing', detectedFormat: 'missing', fileSize: 0, pageCount: 0 };
  }
  if (!stat.isFile()) {
    return { integrityStatus: 'missing', detectedFormat: 'missing', fileSize: 0, pageCount: 0 };
  }
  if (stat.size === 0) {
    return { integrityStatus: 'empty', detectedFormat: 'empty', fileSize: 0, pageCount: 0 };
  }
  const buf = await fs.readFile(abs);
  const detected = detectFormat(buf);
  let pageCount = 0;
  if (detected === 'pdf') pageCount = countPdfPages(buf);

  let status = 'valid';
  if (detected !== (doc.format ?? 'pdf') && doc.format === 'pdf') {
    status = detected === 'html' ? 'wrong-format-html' : 'wrong-format-other';
  } else if (detected === 'pdf' && pageCount === 0) {
    status = 'zero-pages';
  }
  return { integrityStatus: status, detectedFormat: detected, fileSize: stat.size, pageCount };
}

async function main() {
  const manifestSrc = path.join(KB_SRC, 'manifest.json');
  const summariesDir = path.join(KB_SRC, 'summaries');

  await fs.mkdir(KB_DST, { recursive: true });

  const manifest = JSON.parse(await fs.readFile(manifestSrc, 'utf8'));

  const tallies = { valid: 0, empty: 0, 'zero-pages': 0, 'wrong-format-html': 0, 'wrong-format-other': 0, missing: 0 };
  const annotated = [];
  for (const doc of manifest.documents ?? []) {
    const info = await analyseDocFile(doc);
    tallies[info.integrityStatus] = (tallies[info.integrityStatus] ?? 0) + 1;
    annotated.push({ ...doc, ...info });
  }

  const enriched = { ...manifest, documents: annotated };
  await fs.writeFile(
    path.join(KB_DST, 'manifest.json'),
    JSON.stringify(enriched, null, 2) + '\n',
    'utf8',
  );

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
    `KB sync complete: ${annotated.length} docs, ` +
      `${Object.keys(manifest.categories ?? {}).length} categories, ` +
      `${files.length} summary files.`,
  );
  console.log('Integrity tally:');
  for (const [k, v] of Object.entries(tallies)) {
    if (v > 0) console.log(`  ${k.padEnd(20)} ${v}`);
  }
  const nonValid = annotated.filter(d => d.integrityStatus !== 'valid');
  if (nonValid.length) {
    console.log(`\nFlagged (${nonValid.length}):`);
    for (const d of nonValid) {
      console.log(`  ${d.id}  ${d.integrityStatus.padEnd(18)} ${d.category}/${d.filename}`);
    }
  }
}

main().catch(err => {
  console.error('KB sync failed:', err);
  process.exit(1);
});
