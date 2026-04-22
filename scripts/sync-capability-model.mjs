#!/usr/bin/env node
// Syncs the canonical Agent Capability Model into the workspaces that consume it.
//
// Canonical source:
//   the-290-agent-database/capability-model/model.json
//
// Usage:
//   node scripts/sync-capability-model.mjs
//
// Outputs (verbatim byte-for-byte copies):
//   frontend/src/data/capability-model/model.json
//   backend/src/data/capability-model/model.json
//
// Invariants checked BEFORE writing:
//   - Exactly 5 layers, each with exactly 6 sub_dimensions (30 total).
//   - Each layer has key, name, cssClass, color, score_formula.
//   - Each sub_dimension has key, label, desc, base_formula, range (number).
//   - Exactly 3 modifiers with keys personality_influence, performance_history, test_results.
//   - state_invariant.expression contains "b ∈ ℬ" AND "b ≠ 1".
// Post-write:
//   - derivative MD5 matches canonical MD5.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const SRC = path.join(REPO_ROOT, 'the-290-agent-database', 'capability-model', 'model.json');
const DST_DIRS = [
  path.join(REPO_ROOT, 'frontend', 'src', 'data', 'capability-model'),
  path.join(REPO_ROOT, 'backend', 'src', 'data', 'capability-model'),
];

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

function validateModel(m) {
  if (!Array.isArray(m.layers) || m.layers.length !== 5) {
    throw new Error(`model.json: expected exactly 5 layers, got ${m.layers?.length}`);
  }
  const expectedLayerKeys = [
    'information_access',
    'resource_control',
    'network_position',
    'authority_permission',
    'synthesis_application',
  ];
  let totalSub = 0;
  for (const layer of m.layers) {
    for (const field of ['key', 'name', 'cssClass', 'color', 'score_formula']) {
      if (!layer[field]) {
        throw new Error(`model.json: layer "${layer.key ?? '?'}" missing field "${field}"`);
      }
    }
    if (!expectedLayerKeys.includes(layer.key)) {
      throw new Error(`model.json: unexpected layer key "${layer.key}"`);
    }
    if (!Array.isArray(layer.sub_dimensions) || layer.sub_dimensions.length !== 6) {
      throw new Error(
        `model.json: layer "${layer.key}" needs exactly 6 sub_dimensions, got ${layer.sub_dimensions?.length}`,
      );
    }
    for (const sub of layer.sub_dimensions) {
      for (const field of ['key', 'label', 'desc', 'base_formula']) {
        if (!sub[field]) {
          throw new Error(
            `model.json: layer "${layer.key}" sub "${sub.key ?? '?'}" missing field "${field}"`,
          );
        }
      }
      if (typeof sub.range !== 'number') {
        throw new Error(`model.json: layer "${layer.key}" sub "${sub.key}" range must be number`);
      }
    }
    totalSub += layer.sub_dimensions.length;
  }
  if (totalSub !== 30) {
    throw new Error(`model.json: expected 30 sub-dimensions total, got ${totalSub}`);
  }

  if (!Array.isArray(m.modifiers) || m.modifiers.length !== 3) {
    throw new Error(`model.json: expected exactly 3 modifiers, got ${m.modifiers?.length}`);
  }
  const expectedModifierKeys = ['personality_influence', 'performance_history', 'test_results'];
  for (const mod of m.modifiers) {
    if (!expectedModifierKeys.includes(mod.key)) {
      throw new Error(`model.json: unexpected modifier key "${mod.key}"`);
    }
    if (!Array.isArray(mod.fields) || mod.fields.length === 0) {
      throw new Error(`model.json: modifier "${mod.key}" has no fields`);
    }
  }

  const inv = m.state_invariant?.expression ?? '';
  if (!inv.includes('b ∈ ℬ') || !inv.includes('b ≠ 1')) {
    throw new Error(
      `model.json: state_invariant.expression must contain "b ∈ ℬ" and "b ≠ 1"`,
    );
  }

  return { layers: m.layers.length, subDimensions: totalSub, modifiers: m.modifiers.length };
}

async function main() {
  const buf = await fs.readFile(SRC);
  const model = JSON.parse(buf.toString('utf8'));
  const stats = validateModel(model);

  for (const dir of DST_DIRS) {
    await fs.mkdir(dir, { recursive: true });
  }

  const srcHash = md5(buf);
  for (const dir of DST_DIRS) {
    const dst = path.join(dir, 'model.json');
    await fs.writeFile(dst, buf);
    const dstHash = md5(await fs.readFile(dst));
    if (dstHash !== srcHash) {
      throw new Error(`hash mismatch for ${dst}: ${dstHash} ≠ ${srcHash}`);
    }
    console.log(
      `  ${path.relative(REPO_ROOT, SRC)} → ${path.relative(REPO_ROOT, dst)}  (md5 ${srcHash.slice(0, 8)})`,
    );
  }

  console.log(
    `Capability model sync complete: ${stats.layers} layers × 6 sub-dim = ${stats.subDimensions} metrics, ` +
      `${stats.modifiers} modifier axes, invariant "b ≠ 1" preserved.`,
  );
}

main().catch((err) => {
  console.error('Capability model sync failed:', err);
  process.exit(1);
});
