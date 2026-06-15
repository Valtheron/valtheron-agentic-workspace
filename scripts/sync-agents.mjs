#!/usr/bin/env node
// Syncs the canonical 290-agent catalog into the workspaces that bundle them.
//
// Canonical sources (single source of truth):
//   the-290-agent-database/valtheron-spezialisierte-ki-agenten-entwicklung/
//       valtheron_prompts/valtheron_system_prompts.json             (IDs 1-200)
//   the-290-agent-database/valtheron-spezialisierte-ki-agenten-entwicklung_from_200_to_290/
//       valtheron_extension_v2/valtheron_extended_agents.json       (IDs 201-290)
//
// Usage:
//   node scripts/sync-agents.mjs
//
// Outputs (verbatim byte-for-byte copies of canonical):
//   frontend/src/data/valtheron_agents_1_200.json
//   frontend/src/data/valtheron_agents_201_290.json
//   backend/src/data/valtheron_agents_1_200.json
//   backend/src/data/valtheron_agents_201_290.json
//
// The backend copies exist so the production Docker image (which only COPYs
// backend/src/) can seed from the canonical catalog without mounting extra
// volumes. The seed loader reads these JSONs directly at startup.
//
// Invariants checked before writing:
//   - Canonical file parses as { metadata: {...}, agents: [...] }.
//   - metadata.total_agents matches agents.length (200 and 90 respectively).
//   - Agent ids are contiguous within each file (1..200, 201..290).
// Post-write:
//   - Each derivative MD5 matches canonical MD5.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const SOURCES = [
  {
    src: path.join(
      REPO_ROOT,
      'the-290-agent-database',
      'valtheron-spezialisierte-ki-agenten-entwicklung',
      'valtheron_prompts',
      'valtheron_system_prompts.json',
    ),
    dstFilename: 'valtheron_agents_1_200.json',
    expectedCount: 200,
    firstId: 1,
    lastId: 200,
  },
  {
    src: path.join(
      REPO_ROOT,
      'the-290-agent-database',
      'valtheron-spezialisierte-ki-agenten-entwicklung_from_200_to_290',
      'valtheron_extension_v2',
      'valtheron_extended_agents.json',
    ),
    dstFilename: 'valtheron_agents_201_290.json',
    expectedCount: 90,
    firstId: 201,
    lastId: 290,
  },
];

const DST_DIRS = [
  path.join(REPO_ROOT, 'frontend', 'src', 'data'),
  path.join(REPO_ROOT, 'backend', 'src', 'data'),
];

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

function validate({ src, expectedCount, firstId, lastId }, json) {
  if (!json || typeof json !== 'object') throw new Error(`${src}: root is not an object`);
  if (!Array.isArray(json.agents)) throw new Error(`${src}: missing "agents" array`);
  if (json.agents.length !== expectedCount) {
    throw new Error(`${src}: expected ${expectedCount} agents, got ${json.agents.length}`);
  }
  const declared = json.metadata?.total_agents;
  if (typeof declared === 'number' && declared !== expectedCount) {
    throw new Error(`${src}: metadata.total_agents=${declared} disagrees with array length`);
  }
  const ids = json.agents.map((a) => a.id);
  const min = Math.min(...ids);
  const max = Math.max(...ids);
  if (min !== firstId || max !== lastId) {
    throw new Error(`${src}: id range ${min}..${max}, expected ${firstId}..${lastId}`);
  }
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    throw new Error(`${src}: duplicate agent ids detected`);
  }
  for (const a of json.agents) {
    for (const field of ['id', 'category', 'name', 'description', 'system_prompt']) {
      if (a[field] === undefined || a[field] === null) {
        throw new Error(`${src}: agent ${a.id} missing required field "${field}"`);
      }
    }
  }
}

async function main() {
  let totalAgents = 0;
  const categoriesSeen = new Set();

  for (const dir of DST_DIRS) {
    await fs.mkdir(dir, { recursive: true });
  }

  for (const source of SOURCES) {
    const raw = await fs.readFile(source.src);
    const json = JSON.parse(raw.toString('utf8'));
    validate(source, json);

    for (const a of json.agents) categoriesSeen.add(a.category);
    totalAgents += json.agents.length;

    const srcHash = md5(raw);
    const srcRel = path.relative(REPO_ROOT, source.src);

    for (const dir of DST_DIRS) {
      const dst = path.join(dir, source.dstFilename);
      await fs.writeFile(dst, raw);
      const dstHash = md5(await fs.readFile(dst));
      if (dstHash !== srcHash) {
        throw new Error(`hash mismatch for ${dst}: ${dstHash} ≠ ${srcHash}`);
      }
      console.log(`  ${srcRel} → ${path.relative(REPO_ROOT, dst)}  (md5 ${srcHash.slice(0, 8)})`);
    }
  }

  console.log(
    `Agent sync complete: ${totalAgents} agents, ${categoriesSeen.size} categories ` +
      `(${[...categoriesSeen].sort().join(', ')}).`,
  );
}

main().catch((err) => {
  console.error('Agent sync failed:', err);
  process.exit(1);
});
