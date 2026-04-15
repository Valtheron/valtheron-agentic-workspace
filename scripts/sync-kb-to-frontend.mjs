#!/usr/bin/env node
// Syncs the Valtheron knowledge sources into the Vite-bundled frontend at
// frontend/src/data/kb/. Run manually after updating either:
//   - knowledge-base/          (curated catalog + summaries, Manus uploads)
//   - valtheron-cybersec-database/  (flat directory of ~216 real PDFs)
//
//   node scripts/sync-kb-to-frontend.mjs
//
// Outputs:
//   frontend/src/data/kb/manifest.json  — enriched union of both sources.
//       Every entry is annotated with integrityStatus / detectedFormat /
//       pageCount / fileSize / source. Root manifests stay untouched.
//   frontend/src/data/kb/summaries.json — { "summaries/<cat>/<file>.md": "<md>", ... }
//
// PDFs and other large assets are not bundled into the frontend.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const KB_SRC = path.join(REPO_ROOT, 'knowledge-base');
const DB_SRC = path.join(REPO_ROOT, 'valtheron-cybersec-database');
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

async function analyseDocFile(abs, declaredFormat = 'pdf') {
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
  const pageCount = detected === 'pdf' ? countPdfPages(buf) : 0;

  let status = 'valid';
  if (detected !== declaredFormat && declaredFormat === 'pdf') {
    status = detected === 'html' ? 'wrong-format-html' : 'wrong-format-other';
  } else if (detected === 'pdf' && pageCount === 0) {
    status = 'zero-pages';
  }
  return { integrityStatus: status, detectedFormat: detected, fileSize: stat.size, pageCount };
}

// ── Heuristics for the flat cybersec-database/ folder ──────────────────────
// The files there carry no structured metadata, so we derive category + tags
// + language from the filename alone. Order matters: the first matching rule
// wins. Subcategory stays "general" unless a specific rule overrides it.

const CATEGORY_RULES = [
  { re: /\b(fintech|bank|financ|payment)\b/i, cat: 'fintech' },
  { re: /\b(trading|market|algorithmic)\b/i, cat: 'trading' },
  { re: /\b(metaverse|metaverso)\b/i, cat: 'meta' },
  { re: /\b(chatgpt|llm|ai.?native|generative|artificial.intelligence)\b/i, cat: 'ai-native' },
  { re: /\b(kids?|crianças|cyberbullying|awareness|phishing|parent|teen|internet.?safety|school.?(shoot|attack)|family|sexual.?predator|stalk|golpe|perfil.?falso|internet.?para|seguran[cç]a.?na.?internet)\b/i, cat: 'education' },
  { re: /\b(oscp|cissp|ceh|comptia|elearns|ecppt|ecptx|ewpt|ecir|cert|career|roadmap|interview|tech.?recruiter|pentest\+|security\+|crto|carreira|cert.?preparation)\b/i, cat: 'certifications' },
  { re: /\b(iot|scada|ics|firmware|jtag|uart|hardware|embedded|ot\/it|ot.?it)\b/i, cat: 'iot-ot' },
  { re: /\b(osint|maltego|shodan|dark.?web|reconnaissance|human.?trafficking|investigation|ransomware.?investigation)\b/i, cat: 'osint' },
  { re: /\b(cloud|aws|azure|gcp|google.?cloud|kubernetes|docker|container|k8s|aks|eks|gke|office365|o365|multi.?cloud)\b/i, cat: 'cloud' },
  { re: /\b(web|owasp|xss|sql.?injection|api|graphql|smart.?contract|blockchain|devsecops|appsec|mobile|android|ios|frida|oswa|wstg|roadsec|apostila.?ataques.?web|web.?exploitation|web.?pentest|vulnerabilidades.?em.?aplica[cç]|game.?hacking)\b/i, cat: 'appsec' },
  { re: /\b(soc|incident.?response|malware|forensic|threat.?hunt|blue.?team|sentinel|splunk|siem|yara|mitre|ransomware|edr\b|dfir|firewall|defender|antivirus|purple.?team|wazuh|cyber.?kill.?chain|reverse.?engineering)\b/i, cat: 'defensive' },
  { re: /\b(pentest|penetration|red.?team|exploit|metasploit|burp|buffer.?overflow|shellcode|privilege.?esc|persistence|lateral|ad\b|active.?directory|nmap|powershell|kali|oscp.?lab|crto\b|msfconsole|post.?explora|offensive|adversary|caldera|cobalt|red.?teaming|bug.?bounty|evasion|bypass|wireless|reverse.?shell|python.?for.?hackers|c#.?for.?pentest|java.?script|reverse.?engineering)\b/i, cat: 'offensive' },
];

function categorise(filename) {
  for (const rule of CATEGORY_RULES) if (rule.re.test(filename)) return rule.cat;
  return 'misc';
}

const PT_MARKERS = /\b(para|com|como|sobre|ao|ei|ção|carreira|segurança|introdução|apostila|ataques|básico|curso|conceitos|estudos|plano|cyberseg|seguran[cç]a|crian[cç]as|dicas|enumera[cç]ão|fundamentos|inicia(ndo|n)|investiga[cç]ão|metavers|pentest.?mobile|overview.?pt|pt.?br|versao|português|análise|redes.?sociais|gerenciar|ingressar|reportar|overview.?pt|notes|exam)\b/i;

function detectLanguage(filename) {
  const lower = filename.toLowerCase();
  if (/\bpt[.\-_ ]?br\b/.test(lower)) return 'pt';
  if (/\bpt\s*\d/.test(lower) && /ç|ã|õ|é|í|ó|ú|â/.test(filename)) return 'pt';
  if (/ç|ã|õ/.test(filename)) return 'pt';
  if (PT_MARKERS.test(filename)) return 'pt';
  return 'en';
}

const TAG_VOCABULARY = [
  'pentest','pentesting','red-team','blue-team','purple-team','oscp','ceh','comptia','crto',
  'osint','recon','shodan','maltego','dark-web',
  'web','owasp','xss','sql-injection','api','graphql','smart-contract','blockchain','mobile','android','ios','frida',
  'cloud','aws','azure','gcp','kubernetes','docker','container','o365',
  'malware','forensics','threat-hunting','soc','siem','splunk','sentinel','edr','dfir','ransomware','yara','mitre',
  'exploit','metasploit','burp','nmap','buffer-overflow','shellcode','privilege-escalation','persistence','lateral-movement','active-directory','powershell','kali','windows','linux','reverse-engineering','fuzzing',
  'iot','ot','scada','ics','hardware','embedded','firmware',
  'career','interview','roadmap','certification',
  'kids','awareness','phishing','cyberbullying','internet-safety','family',
  'ai','llm','chatgpt','generative',
  'fintech','trading','market','algorithmic','metaverse',
  'bug-bounty','evasion','bypass','wireless','game-hacking','adversary-emulation','caldera','cobalt-strike',
];

function extractTags(filename) {
  const lower = filename.toLowerCase();
  const hits = [];
  for (const tag of TAG_VOCABULARY) {
    const needle = tag.replace(/-/g, '[ \\-_/.]?');
    const re = new RegExp(`\\b${needle}\\b`);
    if (re.test(lower)) hits.push(tag);
    if (hits.length >= 6) break;
  }
  return hits;
}

function titleFromFilename(filename) {
  return filename
    .replace(/\.(pdf|pptx|ppt|docx|doc|md|html?)$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^\[.*?\]\s*/, '')
    .trim();
}

function formatFromFilename(filename) {
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : 'unknown';
}

async function buildDbEntries(summarySet) {
  let entries;
  try {
    entries = await fs.readdir(DB_SRC, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = entries.filter(e => e.isFile()).map(e => e.name).sort();

  const out = [];
  let counter = 0;
  for (const name of files) {
    counter++;
    const abs = path.join(DB_SRC, name);
    const declaredFormat = formatFromFilename(name) === 'pptx' ? 'pptx' : 'pdf';
    const info = await analyseDocFile(abs, declaredFormat);
    const category = categorise(name);
    const summaryCandidate = `summaries/${category}/overview.md`;
    const summaryPath = summarySet.has(summaryCandidate) ? summaryCandidate : '';

    out.push({
      id: `doc-db-${String(counter).padStart(3, '0')}`,
      filename: name,
      path: 'valtheron-cybersec-database/',
      title: titleFromFilename(name),
      category,
      subcategory: 'general',
      difficulty: 'intermediate',
      language: detectLanguage(name),
      format: declaredFormat,
      tags: extractTags(name),
      summary_path: summaryPath,
      source: 'cybersec-database',
      ...info,
    });
  }
  return out;
}

function recomputeCategories(documents, existing = {}) {
  const counts = {};
  for (const d of documents) counts[d.category] = (counts[d.category] ?? 0) + 1;
  const out = {};
  // Keep original labels where available; add auto-label for new categories.
  const ensure = (key) => {
    if (existing[key]) return { label: existing[key].label, document_count: counts[key] ?? 0 };
    return { label: key.replace(/(^|-)\w/g, m => m.toUpperCase()).replace(/-/g, ' '), document_count: counts[key] ?? 0 };
  };
  for (const key of new Set([...Object.keys(existing), ...Object.keys(counts)])) {
    out[key] = ensure(key);
  }
  return out;
}

async function main() {
  const manifestSrc = path.join(KB_SRC, 'manifest.json');
  const summariesDir = path.join(KB_SRC, 'summaries');

  await fs.mkdir(KB_DST, { recursive: true });

  const manifest = JSON.parse(await fs.readFile(manifestSrc, 'utf8'));

  const summaryFiles = await walkMd(summariesDir, 'summaries');
  summaryFiles.sort((a, b) => a.rel.localeCompare(b.rel));
  const summaries = {};
  for (const f of summaryFiles) {
    summaries[f.rel] = await fs.readFile(f.full, 'utf8');
  }
  const summarySet = new Set(Object.keys(summaries));

  // 1) Annotate original manifest entries (Manus + synthetic catalog rows).
  const tallies = {};
  const annotatedKb = [];
  for (const doc of manifest.documents ?? []) {
    const abs = path.join(KB_SRC, doc.path ?? '', doc.filename ?? '');
    const info = await analyseDocFile(abs, doc.format ?? 'pdf');
    tallies[info.integrityStatus] = (tallies[info.integrityStatus] ?? 0) + 1;
    annotatedKb.push({ ...doc, source: 'knowledge-base', ...info });
  }

  // 2) Ingest the flat cybersec-database/.
  const dbEntries = await buildDbEntries(summarySet);
  for (const d of dbEntries) {
    tallies[d.integrityStatus] = (tallies[d.integrityStatus] ?? 0) + 1;
  }

  const allDocs = [...annotatedKb, ...dbEntries];
  const enriched = {
    ...manifest,
    total_documents: allDocs.length,
    categories: recomputeCategories(allDocs, manifest.categories ?? {}),
    documents: allDocs,
  };

  await fs.writeFile(
    path.join(KB_DST, 'manifest.json'),
    JSON.stringify(enriched, null, 2) + '\n',
    'utf8',
  );
  await fs.writeFile(
    path.join(KB_DST, 'summaries.json'),
    JSON.stringify(summaries, null, 2) + '\n',
    'utf8',
  );

  console.log(
    `KB sync complete: ${allDocs.length} docs ` +
      `(${annotatedKb.length} from knowledge-base, ${dbEntries.length} from cybersec-database), ` +
      `${Object.keys(enriched.categories).length} categories, ${summaryFiles.length} summary files.`,
  );
  console.log('Integrity tally:');
  for (const [k, v] of Object.entries(tallies)) {
    if (v > 0) console.log(`  ${k.padEnd(20)} ${v}`);
  }
  const kbNonValid = annotatedKb.filter(d => d.integrityStatus !== 'valid' && d.integrityStatus !== 'missing');
  const dbNonValid = dbEntries.filter(d => d.integrityStatus !== 'valid');
  if (kbNonValid.length || dbNonValid.length) {
    console.log(`\nBroken files (${kbNonValid.length + dbNonValid.length}):`);
    for (const d of [...kbNonValid, ...dbNonValid]) {
      console.log(`  ${d.id}  ${d.integrityStatus.padEnd(18)} ${d.source}/${d.filename}`);
    }
  }
}

main().catch(err => {
  console.error('KB sync failed:', err);
  process.exit(1);
});
