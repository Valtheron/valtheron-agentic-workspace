#!/usr/bin/env node
// Syncs the canonical Forseti Power Framework sources into the workspaces that
// consume them.
//
// Canonical sources (single source of truth):
//   the-290-agent-database/forseti/power_framework.json
//   the-290-agent-database/forseti/layer_taxonomy.json
//   the-290-agent-database/forseti/category_mapping.json
//
// Usage:
//   node scripts/sync-forseti.mjs
//
// Outputs (verbatim byte-for-byte copies):
//   frontend/src/data/forseti/*.json
//   backend/src/data/forseti/*.json
//
// Invariants checked BEFORE writing (fail fast on drift):
//   - power_framework.json has 5 dimensions, each with exactly 6 sub-dimensions
//   - every referenced sub-dimension has a matching label entry with exactly 10 levels
//   - every category_base_scores entry covers all 5 dimensions
//   - layer_taxonomy.json has exactly 5 layers
//   - category_mapping.json entries either name a category present in
//     power_framework.category_base_scores, or set forseti_category = null
//     with a pending_reason.
// Post-write:
//   - each derivative MD5 matches canonical MD5.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const SRC_DIR = path.join(REPO_ROOT, 'the-290-agent-database', 'forseti');
const DST_DIRS = [
  path.join(REPO_ROOT, 'frontend', 'src', 'data', 'forseti'),
  path.join(REPO_ROOT, 'backend', 'src', 'data', 'forseti'),
];

const FILES = ['power_framework.json', 'layer_taxonomy.json', 'category_mapping.json'];

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

function validatePowerFramework(pf) {
  const dims = Object.keys(pf.dimensions ?? {});
  if (dims.length !== 5) {
    throw new Error(`power_framework: expected 5 dimensions, got ${dims.length}`);
  }

  const allSubs = [];
  for (const [dimKey, dim] of Object.entries(pf.dimensions)) {
    if (!Array.isArray(dim.sub_dimensions) || dim.sub_dimensions.length !== 6) {
      throw new Error(`power_framework.${dimKey}: expected 6 sub-dimensions, got ${dim.sub_dimensions?.length}`);
    }
    allSubs.push(...dim.sub_dimensions);
  }
  if (allSubs.length !== 30) {
    throw new Error(`power_framework: expected 30 sub-dimensions total, got ${allSubs.length}`);
  }

  const labels = pf.sub_dimension_labels ?? {};
  for (const sub of allSubs) {
    const entry = labels[sub];
    if (!entry) throw new Error(`power_framework.sub_dimension_labels missing "${sub}"`);
    if (!Array.isArray(entry) || entry.length !== 10) {
      throw new Error(`power_framework.sub_dimension_labels["${sub}"]: expected 10 levels, got ${entry?.length}`);
    }
  }

  for (const [cat, scores] of Object.entries(pf.category_base_scores ?? {})) {
    for (const dim of dims) {
      if (typeof scores[dim] !== 'number') {
        throw new Error(`power_framework.category_base_scores.${cat} missing dimension "${dim}"`);
      }
    }
  }
}

function validateLayerTaxonomy(lt) {
  const layers = Object.keys(lt.layers ?? {});
  if (layers.length !== 5) {
    throw new Error(`layer_taxonomy: expected 5 layers, got ${layers.length}`);
  }
  const expected = ['TECHNICAL', 'EMERGENT', 'COLLECTIVE', 'FIELD_BASED', 'LIMINAL'];
  for (const k of expected) {
    if (!lt.layers[k]) throw new Error(`layer_taxonomy: missing layer "${k}"`);
  }
  const allowedMeasurability = new Set(Object.keys(lt.measurability_scores ?? {}));
  for (const [layerKey, layer] of Object.entries(lt.layers)) {
    for (const [elemKey, elem] of Object.entries(layer.elements ?? {})) {
      if (!allowedMeasurability.has(elem.measurability)) {
        throw new Error(
          `layer_taxonomy.${layerKey}.${elemKey} has unknown measurability "${elem.measurability}"`,
        );
      }
    }
  }
}

function validateCategoryMapping(cm, pfCategorySet) {
  const mappings = cm.mappings ?? {};
  let mapped = 0;
  let pending = 0;
  for (const [key, entry] of Object.entries(mappings)) {
    if (entry.forseti_category === null) {
      if (!entry.pending_reason) {
        throw new Error(`category_mapping.${key}: null mapping requires pending_reason`);
      }
      pending++;
    } else if (typeof entry.forseti_category === 'string') {
      if (!pfCategorySet.has(entry.forseti_category)) {
        throw new Error(
          `category_mapping.${key}: forseti_category "${entry.forseti_category}" not found in power_framework.category_base_scores`,
        );
      }
      if (!entry.rationale) {
        throw new Error(`category_mapping.${key}: mapped category requires rationale`);
      }
      mapped++;
    } else {
      throw new Error(`category_mapping.${key}: forseti_category must be string or null`);
    }
  }
  return { mapped, pending };
}

async function main() {
  const parsed = {};
  for (const filename of FILES) {
    const buf = await fs.readFile(path.join(SRC_DIR, filename));
    parsed[filename] = { buf, json: JSON.parse(buf.toString('utf8')) };
  }

  validatePowerFramework(parsed['power_framework.json'].json);
  validateLayerTaxonomy(parsed['layer_taxonomy.json'].json);
  const pfCategorySet = new Set(
    Object.keys(parsed['power_framework.json'].json.category_base_scores ?? {}),
  );
  const { mapped, pending } = validateCategoryMapping(
    parsed['category_mapping.json'].json,
    pfCategorySet,
  );

  for (const dir of DST_DIRS) {
    await fs.mkdir(dir, { recursive: true });
  }

  for (const filename of FILES) {
    const { buf } = parsed[filename];
    const srcHash = md5(buf);
    for (const dir of DST_DIRS) {
      const dst = path.join(dir, filename);
      await fs.writeFile(dst, buf);
      const dstHash = md5(await fs.readFile(dst));
      if (dstHash !== srcHash) {
        throw new Error(`hash mismatch for ${dst}: ${dstHash} ≠ ${srcHash}`);
      }
      console.log(
        `  ${path.relative(REPO_ROOT, path.join(SRC_DIR, filename))} → ${path.relative(REPO_ROOT, dst)}  (md5 ${srcHash.slice(0, 8)})`,
      );
    }
  }

  console.log(
    `Forseti sync complete: 5 dims × 6 sub-dim = 30 metrics, ` +
      `${mapped} Valtheron categories mapped, ${pending} pending.`,
  );
}

main().catch((err) => {
  console.error('Forseti sync failed:', err);
  process.exit(1);
});
