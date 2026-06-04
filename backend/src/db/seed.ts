import { getDb } from './schema.js';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import agents1to200 from '../data/valtheron_agents_1_200.json' with { type: 'json' };
import agents201to290 from '../data/valtheron_agents_201_290.json' with { type: 'json' };
import { computeForsetiProfile, isForsetiPending } from '../services/forsetiScoring.js';
import { computeCapabilityProfile } from '../services/capabilityScoring.js';

// Loader for the canonical 290-agent catalog maintained under
// the-290-agent-database/ at the repo root. The JSON files in src/data/ are
// build artifacts kept in sync by scripts/sync-agents.mjs — never edit them
// directly; edit the canonical sources and re-run the sync.
//
// The raw JSON carries metadata only (id, category, name, description,
// system_prompt). Runtime attributes (status, successRate, personality,
// parameters, hooks, test results) are deterministically derived from the
// agent id so reseeds produce stable values across restarts while preserving
// compatibility with the existing frontend Agent type.

interface RawAgent {
  id: number;
  category: string;
  name: string;
  description: string;
  system_prompt: string;
}

interface RawAgentsFile {
  metadata: unknown;
  agents: RawAgent[];
}

// Maps the German JSON category labels to the frontend AgentCategory union.
// Must stay in sync with frontend/src/services/valtheronAgents.ts CATEGORY_MAP.
const CATEGORY_MAP: Record<string, string> = {
  'Trading Agents': 'trading',
  'Development Agents': 'development',
  'Security Agents': 'security',
  'QA Agents': 'qa',
  'Documentation Agents': 'documentation',
  'Deployment Agents': 'deployment',
  'Analyst Agents': 'analyst',
  'Support Agents': 'support',
  'Integration Agents': 'integration',
  'Monitoring Agents': 'monitoring',
  'Hybrid Agents (Cross-Functional)': 'hybrid',
  'Meta Agents (Orchestration Layer)': 'meta',
  'FinTech Agents': 'fintech',
  'AI-Native Agents': 'ai-native',
  'Human-Centric Agents': 'human-centric',
  'Specialized Data Agents': 'specialized-data',
};

const ARCHETYPES = ['analytiker', 'kreativer', 'diplomat', 'commander'] as const;
const COMM_STYLES = ['formal', 'casual', 'technical', 'diplomatic'] as const;

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function deriveRole(rawCategory: string, name: string): string {
  const short = rawCategory
    .replace(/ Agents?/gi, '')
    .replace(/\s*\(.*\)\s*/g, '')
    .trim();
  return short ? `${short} Specialist` : name;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function loadCanonicalAgents(): RawAgent[] {
  return [...(agents1to200 as RawAgentsFile).agents, ...(agents201to290 as RawAgentsFile).agents].sort(
    (a, b) => a.id - b.id,
  );
}

export function seedAgentCatalog() {
  const db = getDb();

  const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  if (agentCount.count > 0) {
    return { seeded: 0, skipped: agentCount.count };
  }

  const insertAgent = db.prepare(`
    INSERT INTO agents (id, name, role, category, status, successRate, tasksCompleted, failedTasks, avgTaskDuration, lastActivity, systemPrompt, personality, parameters, hooks, testResults, llmProvider, llmModel, riskProfile)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const rawAgents = loadCanonicalAgents();

  const seedAgents = db.transaction(() => {
    for (const raw of rawAgents) {
      const category = CATEGORY_MAP[raw.category] ?? 'development';
      const rng = seededRandom(raw.id * 7919 + 13);

      const id = uuid();
      const role = deriveRole(raw.category, raw.name);
      // Runtime fields start in their neutral, never-executed state. The
      // executionEngine/workflowEngine flip them when real tasks run; the
      // dashboard's "144 aktiv" / "72 working" / 88.5 % success / Top-Performer
      // values that were previously visible on a fresh install came from
      // deterministic id-derived seed values, which is exactly the kind of
      // demo theatre the beta cleanup is meant to remove.
      const status = 'idle';
      const successRate = 0;
      const tasksCompleted = 0;
      const failedTasks = 0;
      const avgTaskDuration = 0;

      const personality = JSON.stringify({
        creativity: 30 + Math.floor(rng() * 60),
        analyticalDepth: 45 + Math.floor(rng() * 50),
        riskTolerance: 10 + Math.floor(rng() * 70),
        communicationStyle: pick(rng, COMM_STYLES),
        archetype: pick(rng, ARCHETYPES),
        domainFocus: category,
      });

      const parameters = JSON.stringify({
        temperature: +(0.3 + rng() * 0.7).toFixed(2),
        maxTokens: [1024, 2048, 4096, 8192][Math.floor(rng() * 4)],
        topP: +(0.8 + rng() * 0.2).toFixed(2),
        frequencyPenalty: +(rng() * 0.5).toFixed(2),
        presencePenalty: +(rng() * 0.5).toFixed(2),
      });

      const riskProfile = JSON.stringify({
        riskLevel: ['low', 'medium', 'high'][Math.floor(rng() * 3)],
        maxConcurrentTasks: 3 + Math.floor(rng() * 7),
        maxTokenBudget: 50000 + Math.floor(rng() * 450000),
        autoSuspendOnFailure: rng() > 0.5,
        failureThreshold: 3 + Math.floor(rng() * 7),
        cooldownPeriod: 60 + Math.floor(rng() * 240),
        requiresApproval: rng() > 0.7,
      });

      const hooks = JSON.stringify([
        { id: `h${raw.id}_1`, type: 'on_complete', action: 'log_result', enabled: true },
        { id: `h${raw.id}_2`, type: 'on_error', action: 'notify_admin', enabled: true },
        { id: `h${raw.id}_3`, type: 'on_timeout', action: 'escalate', enabled: rng() > 0.5 },
        { id: `h${raw.id}_4`, type: 'on_handoff', action: 'transfer_context', enabled: rng() > 0.5 },
      ]);

      const testResults = JSON.stringify([
        {
          id: `t${raw.id}_1`,
          category: 'DOM',
          name: 'Domain Knowledge Test',
          passed: rng() > 0.08,
          duration: +(2 + rng() * 5).toFixed(2),
          timestamp: new Date().toISOString(),
        },
        {
          id: `t${raw.id}_2`,
          category: 'EDGE',
          name: 'Edge Case Handling',
          passed: rng() > 0.15,
          duration: +(3 + rng() * 8).toFixed(2),
          timestamp: new Date().toISOString(),
        },
        {
          id: `t${raw.id}_3`,
          category: 'PERS',
          name: 'Personality Consistency',
          passed: rng() > 0.1,
          duration: +(1 + rng() * 3).toFixed(2),
          timestamp: new Date().toISOString(),
        },
        {
          id: `t${raw.id}_4`,
          category: 'KB',
          name: 'Knowledge Base Accuracy',
          passed: rng() > 0.12,
          duration: +(4 + rng() * 6).toFixed(2),
          timestamp: new Date().toISOString(),
        },
        {
          id: `t${raw.id}_5`,
          category: 'GEN',
          name: 'General Capability',
          passed: rng() > 0.07,
          duration: +(2 + rng() * 4).toFixed(2),
          timestamp: new Date().toISOString(),
        },
      ]);

      insertAgent.run(
        id,
        raw.name,
        role,
        category,
        status,
        successRate,
        tasksCompleted,
        failedTasks,
        avgTaskDuration,
        new Date(Date.now() - Math.floor(rng() * 86400000)).toISOString(),
        raw.system_prompt,
        personality,
        parameters,
        hooks,
        testResults,
        'anthropic',
        'claude-sonnet-4-5-20250929',
        riskProfile,
      );
    }
  });
  seedAgents();

  // Forseti profiles: compute + persist per agent. Categories without an
  // authored mapping produce a 'pending' row — no invented profile.
  const insertForseti = db.prepare(`
    INSERT OR REPLACE INTO agent_forseti_profiles (agentId, status, profile, pendingReason, computedAt)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);
  const persistedForForseti = db.prepare('SELECT id, name, category FROM agents').all() as {
    id: string;
    name: string;
    category: string;
  }[];
  const byName = new Map<string, RawAgent>();
  for (const r of rawAgents) byName.set(r.name, r);

  let forsetiMapped = 0;
  let forsetiPending = 0;

  const seedForseti = db.transaction(() => {
    for (const persisted of persistedForForseti) {
      // Match persisted agent → canonical RawAgent by name (stable because
      // names are unique within the 290-catalog).
      const raw = byName.get(persisted.name);
      const description = raw?.description ?? '';
      const result = computeForsetiProfile({
        valtheronCategory: persisted.category,
        agentName: persisted.name,
        agentDescription: description,
        modelName: 'claude-sonnet-4-5-20250929',
      });
      if (isForsetiPending(result)) {
        insertForseti.run(persisted.id, 'pending', null, result.reason);
        forsetiPending++;
      } else {
        insertForseti.run(persisted.id, 'computed', JSON.stringify(result), null);
        forsetiMapped++;
      }
    }
  });
  seedForseti();

  // Capability profiles: compute deterministically from the persisted
  // agent row's personality + performance inputs, using the canonical
  // formulas in the-290-agent-database/capability-model/model.json.
  // Every agent gets a computed profile — unlike the Forseti pathway,
  // the generic capability model covers all 16 categories without
  // authored category mapping.
  const insertCapability = db.prepare(`
    INSERT OR REPLACE INTO agent_capabilities (agentId, status, profile, pendingReason, computedAt)
    VALUES (?, 'computed', ?, NULL, datetime('now'))
  `);
  const persistedForCap = db
    .prepare('SELECT id, personality, successRate, tasksCompleted, failedTasks, testResults FROM agents')
    .all() as Array<{
    id: string;
    personality: string;
    successRate: number;
    tasksCompleted: number;
    failedTasks: number;
    testResults: string;
  }>;

  let capComputed = 0;
  const seedCapabilities = db.transaction(() => {
    for (const row of persistedForCap) {
      const personality = JSON.parse(row.personality) as {
        creativity: number;
        analyticalDepth: number;
        archetype: string;
        communicationStyle: string;
      };
      const testResults = JSON.parse(row.testResults) as Array<{
        id: string;
        category: string;
        name: string;
        passed: boolean;
        duration: number;
        timestamp: string;
      }>;
      const profile = computeCapabilityProfile({
        personality: {
          creativity: personality.creativity,
          analyticalDepth: personality.analyticalDepth,
          archetype: personality.archetype,
          communicationStyle: personality.communicationStyle,
        },
        successRate: row.successRate,
        tasksCompleted: row.tasksCompleted,
        failedTasks: row.failedTasks,
        testResults,
      });
      insertCapability.run(row.id, JSON.stringify(profile));
      capComputed++;
    }
  });
  seedCapabilities();

  const count = (db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number }).count;
  const categoryCount = new Set(rawAgents.map((a) => CATEGORY_MAP[a.category] ?? 'development')).size;
  console.log(
    `Agent catalog loaded: ${count} agents across ${categoryCount} categories. ` +
      `Forseti: ${forsetiMapped} computed, ${forsetiPending} pending. ` +
      `Capabilities: ${capComputed} computed.`,
  );
  return { seeded: count, skipped: 0 };
}

export function seedDatabase() {
  const db = getDb();

  const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  if (agentCount.count > 0) {
    console.log(`Database already seeded with ${agentCount.count} agents.`);
    return;
  }

  console.log('Seeding database...');

  const adminId = uuid();
  db.prepare('INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)').run(
    adminId,
    'demo_admin',
    hashPassword('demo_only_not_for_production'),
    'admin',
  );
  db.prepare('INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)').run(
    uuid(),
    'demo_operator',
    hashPassword('demo_only_not_for_production'),
    'operator',
  );

  seedAgentCatalog();

  const agents = db.prepare('SELECT id, category FROM agents').all() as { id: string; category: string }[];
  const categoriesInDb = [...new Set(agents.map((a) => a.category))];

  // Generic task seeds — one set per derived category. Kept intentionally small
  // because this is demo-only data; real workloads flow through the API.
  const TASK_TYPES = ['feature', 'bug', 'improvement', 'research', 'documentation', 'testing', 'deployment', 'review'];
  const PRIORITIES = ['critical', 'high', 'medium', 'low'];
  const TASK_TITLES: Record<string, string[]> = {
    trading: [
      'Implement moving average crossover',
      'Fix order execution latency',
      'Add risk limit alerts',
      'Backtest momentum strategy',
    ],
    security: [
      'Run vulnerability scan',
      'Update firewall rules',
      'Audit access permissions',
      'Implement rate limiting',
    ],
    development: [
      'Build REST API endpoints',
      'Refactor auth module',
      'Add WebSocket support',
      'Optimize database queries',
    ],
    qa: ['Write E2E tests for checkout', 'Load test API endpoints', 'Fix flaky unit tests', 'Add accessibility tests'],
    documentation: [
      'Update API documentation',
      'Write deployment guide',
      'Create onboarding tutorial',
      'Generate changelog',
    ],
    deployment: [
      'Set up Kubernetes cluster',
      'Configure CI/CD pipeline',
      'Implement blue-green deploy',
      'Add health checks',
    ],
    analyst: [
      'Create revenue dashboard',
      'Analyze user retention',
      'Build churn prediction model',
      'Generate monthly report',
    ],
    support: [
      'Set up ticket routing',
      'Create FAQ knowledge base',
      'Implement chatbot flow',
      'Design escalation rules',
    ],
    integration: ['Connect Slack webhook', 'Build ETL pipeline', 'Implement SSO login', 'Add payment gateway'],
    monitoring: [
      'Set up Prometheus alerts',
      'Configure log aggregation',
      'Build status dashboard',
      'Add latency tracking',
    ],
    hybrid: [
      'Coordinate cross-team delivery',
      'Broker trading/security conflict',
      'Bridge dev and ops workflows',
      'Compose hybrid playbook',
    ],
    meta: [
      'Schedule agent rotation',
      'Balance workload across squads',
      'Arbitrate consensus conflict',
      'Publish orchestration report',
    ],
    fintech: ['Onboard new payment rail', 'Reconcile trading ledger', 'Validate KYC flow', 'Audit settlement pipeline'],
    'ai-native': [
      'Tune retrieval pipeline',
      'Evaluate new LLM provider',
      'Ship prompt-cache optimization',
      'Benchmark context window usage',
    ],
    'human-centric': [
      'Run user-research interviews',
      'Refine onboarding copy',
      'Draft empathy playbook',
      'Review accessibility audit',
    ],
    'specialized-data': [
      'Ingest alternative dataset',
      'Clean sensor data stream',
      'Build feature store table',
      'Profile data quality',
    ],
  };

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, assignedAgentId, category, kanbanColumn, tags, taskType, progress, estimatedHours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTasks = db.transaction(() => {
    for (const category of categoriesInDb) {
      const titles = TASK_TITLES[category] ?? TASK_TITLES.development;
      const categoryAgents = agents.filter((a) => a.category === category);
      if (categoryAgents.length === 0) continue;
      for (let i = 0; i < 8; i++) {
        const title = titles[i % titles.length] + (i >= titles.length ? ` v${Math.floor(i / titles.length) + 1}` : '');
        const status = (['pending', 'in_progress', 'completed', 'failed'] as const)[Math.floor(Math.random() * 4)];
        const kanban =
          status === 'completed'
            ? 'done'
            : status === 'in_progress'
              ? (['in_progress', 'review'] as const)[Math.floor(Math.random() * 2)]
              : status === 'failed'
                ? (['backlog', 'todo', 'in_progress'] as const)[Math.floor(Math.random() * 3)]
                : (['backlog', 'todo'] as const)[Math.floor(Math.random() * 2)];
        const agent = categoryAgents[Math.floor(Math.random() * categoryAgents.length)];

        insertTask.run(
          uuid(),
          title,
          `${title} - Automatisch generierte Aufgabe für ${category}`,
          status,
          PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
          agent.id,
          category,
          kanban,
          JSON.stringify([category, TASK_TYPES[i % TASK_TYPES.length]]),
          TASK_TYPES[i % TASK_TYPES.length],
          status === 'completed' ? 100 : Math.floor(Math.random() * 80),
          +(2 + Math.random() * 20).toFixed(1),
        );
      }
    }
  });
  seedTasks();

  const insertWorkflow = db.prepare(`
    INSERT INTO workflows (id, name, description, status, steps, createdBy, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleWorkflows = [
    {
      name: 'Full Deployment Pipeline',
      description: 'Kompletter CI/CD-Prozess von Build bis Production',
      status: 'draft',
      steps: [
        {
          id: uuid(),
          name: 'Code Review',
          description: 'Automatische Code-Analyse',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 120,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Unit Tests',
          description: 'Alle Unit-Tests ausführen',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 300,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Build',
          description: 'Production Build erstellen',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 180,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Security Scan',
          description: 'Vulnerability Scan durchführen',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 240,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Deploy Staging',
          description: 'Auf Staging deployen',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 60,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'E2E Tests',
          description: 'End-to-End Tests auf Staging',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 600,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Deploy Production',
          description: 'Blue-Green Deployment in Production',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 120,
          retries: 0,
        },
      ],
      tags: ['deployment', 'ci-cd', 'production'],
    },
    {
      name: 'Security Audit Pipeline',
      description: 'Umfassender Sicherheits-Audit-Workflow',
      status: 'draft',
      steps: [
        {
          id: uuid(),
          name: 'Threat Assessment',
          description: 'Bedrohungsanalyse durchführen',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 300,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Vulnerability Scan',
          description: 'Automatischer Vulnerability Scan',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 600,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Penetration Test',
          description: 'Simulierter Angriff',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 1200,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Compliance Check',
          description: 'GDPR & SOC2 Compliance prüfen',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 300,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Report Generation',
          description: 'Sicherheitsbericht erstellen',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 180,
          retries: 0,
        },
      ],
      tags: ['security', 'audit', 'compliance'],
    },
    {
      name: 'Data Analysis Pipeline',
      description: 'End-to-End Datenanalyse-Workflow',
      status: 'draft',
      steps: [
        {
          id: uuid(),
          name: 'Data Collection',
          description: 'Daten aus allen Quellen sammeln',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 180,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Data Cleaning',
          description: 'Datenbereinigung und Normalisierung',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 300,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Analysis',
          description: 'Statistische Analyse durchführen',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 600,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Visualization',
          description: 'Dashboards und Charts erstellen',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 240,
          retries: 0,
        },
        {
          id: uuid(),
          name: 'Report',
          description: 'Ergebnisbericht generieren',
          assignedAgentId: null,
          status: 'pending',
          dependsOn: [],
          output: null,
          progress: 0,
          estimatedDuration: 120,
          retries: 0,
        },
      ],
      tags: ['analytics', 'data', 'reporting'],
    },
  ];

  const seedWorkflows = db.transaction(() => {
    for (const wf of sampleWorkflows) {
      for (let i = 1; i < wf.steps.length; i++) {
        (wf.steps[i].dependsOn as string[]) = [wf.steps[i - 1].id];
      }
      insertWorkflow.run(
        uuid(),
        wf.name,
        wf.description,
        wf.status,
        JSON.stringify(wf.steps),
        'system',
        JSON.stringify(wf.tags),
      );
    }
  });
  seedWorkflows();

  const insertSecEvent = db.prepare(`
    INSERT INTO security_events (id, type, severity, message, agentId, timestamp, resolved)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const secEvents = [
    { type: 'auth', severity: 'medium', message: 'Failed login attempt from unknown IP', resolved: 0 },
    {
      type: 'injection',
      severity: 'critical',
      message: 'Prompt injection attempt detected in Agent input',
      resolved: 1,
    },
    { type: 'anomaly', severity: 'high', message: 'Unusual API call pattern from trading agent', resolved: 0 },
    { type: 'access', severity: 'low', message: 'Permission upgrade requested by development agent', resolved: 1 },
    {
      type: 'policy',
      severity: 'medium',
      message: 'Data retention policy violation in analytics pipeline',
      resolved: 0,
    },
  ];

  const seedEvents = db.transaction(() => {
    for (const ev of secEvents) {
      insertSecEvent.run(
        uuid(),
        ev.type,
        ev.severity,
        ev.message,
        null,
        new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        ev.resolved,
      );
    }
  });
  seedEvents();

  console.log(
    `Database seeded: ${agents.length} agents, ${categoriesInDb.length * 8} tasks, 3 workflows, 5 security events, 2 demo users`,
  );
}
