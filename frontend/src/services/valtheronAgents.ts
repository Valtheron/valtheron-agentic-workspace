// Loader for the 290 specialized Valtheron agents.
//
// Data sources:
//   frontend/src/data/valtheron_agents_1_200.json   (IDs 1-200, 10 categories x 20 agents)
//   frontend/src/data/valtheron_agents_201_290.json (IDs 201-290, 6 extension categories)
//
// The raw JSON only carries metadata (id, category, name, description, system_prompt).
// This loader deterministically derives the remaining runtime attributes (status,
// successRate, parameters, personality, hooks, test results, ...) that the frontend
// `Agent` type requires, so the 290 entries render stable, non-random values across
// reloads while staying compatible with the existing UI.

import type {
  Agent,
  AgentCategory,
  AgentStatus,
  PersonalityConfig,
  TestResult,
} from '../types';
import agents1to200 from '../data/valtheron_agents_1_200.json';
import agents201to290 from '../data/valtheron_agents_201_290.json';
import {
  enrichSystemPromptWithKB,
  getKnowledgeScopeForAgent,
} from './knowledgeBase';

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

// Maps the German JSON category labels to the frontend `AgentCategory` union.
const CATEGORY_MAP: Record<string, AgentCategory> = {
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

const STATUSES: AgentStatus[] = ['active', 'idle', 'working', 'blocked'];
const ARCHETYPES: PersonalityConfig['archetype'][] = [
  'analytiker',
  'kreativer',
  'diplomat',
  'commander',
];
const COMM_STYLES: PersonalityConfig['communicationStyle'][] = [
  'formal',
  'casual',
  'technical',
  'diplomatic',
];

// Simple deterministic pseudo-random generator so every agent has stable values.
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

// Builds a human-readable `role` label from the JSON category (e.g. "Trading Agents" -> "Trading").
function deriveRole(category: string, name: string): string {
  const short = category
    .replace(/ Agents?/gi, '')
    .replace(/\s*\(.*\)\s*/g, '')
    .trim();
  return short ? `${short} Specialist` : name;
}

function toAgent(raw: RawAgent): Agent {
  const mappedCategory = CATEGORY_MAP[raw.category] ?? 'development';
  const rng = seededRandom(raw.id * 7919 + 13);

  const successRate = 78 + Math.floor(rng() * 22); // 78-99
  const tasksCompleted = 40 + Math.floor(rng() * 460);
  const failedTasks = Math.floor(rng() * 18);
  const avgTaskDuration = 10 + Math.floor(rng() * 120);
  const certified = rng() > 0.25;
  const hasCurrentTask = rng() > 0.4;

  const personality: PersonalityConfig = {
    creativity: 30 + Math.floor(rng() * 60),
    analyticalDepth: 45 + Math.floor(rng() * 50),
    riskTolerance: 10 + Math.floor(rng() * 70),
    communicationStyle: pick(rng, COMM_STYLES),
    archetype: pick(rng, ARCHETYPES),
    domainFocus: mappedCategory,
  };

  const testResults: TestResult[] = [
    { id: `t${raw.id}_1`, category: 'DOM', name: 'Domain Knowledge Test', passed: rng() > 0.08, duration: 2 + rng() * 5, timestamp: new Date().toISOString() },
    { id: `t${raw.id}_2`, category: 'EDGE', name: 'Edge Case Handling', passed: rng() > 0.15, duration: 3 + rng() * 8, timestamp: new Date().toISOString() },
    { id: `t${raw.id}_3`, category: 'PERS', name: 'Personality Consistency', passed: rng() > 0.1, duration: 1 + rng() * 3, timestamp: new Date().toISOString() },
    { id: `t${raw.id}_4`, category: 'KB', name: 'Knowledge Base Accuracy', passed: rng() > 0.12, duration: 4 + rng() * 6, timestamp: new Date().toISOString() },
    { id: `t${raw.id}_5`, category: 'GEN', name: 'General Capability', passed: rng() > 0.07, duration: 2 + rng() * 4, timestamp: new Date().toISOString() },
  ];

  const id = `agent_${String(raw.id).padStart(3, '0')}`;

  const knowledgeScope = getKnowledgeScopeForAgent({
    category: mappedCategory,
    name: raw.name,
    description: raw.description,
  });
  const systemPrompt = enrichSystemPromptWithKB(raw.system_prompt, knowledgeScope);

  return {
    id,
    name: raw.name,
    role: deriveRole(raw.category, raw.name),
    category: mappedCategory,
    status: pick(rng, STATUSES),
    successRate,
    tasksCompleted,
    failedTasks,
    avgTaskDuration,
    currentTask: hasCurrentTask ? `Task-${Math.floor(rng() * 999)}` : null,
    lastActivity: new Date(Date.now() - Math.floor(rng() * 86400000)).toISOString(),
    systemPrompt,
    personality,
    parameters: {
      temperature: +(0.3 + rng() * 0.7).toFixed(2),
      maxTokens: [1024, 2048, 4096, 8192][Math.floor(rng() * 4)],
      topP: +(0.8 + rng() * 0.2).toFixed(2),
      frequencyPenalty: +(rng() * 0.5).toFixed(2),
      presencePenalty: +(rng() * 0.5).toFixed(2),
    },
    certificationId: certified ? `cert_${String(raw.id).padStart(3, '0')}` : undefined,
    createdAt: new Date(Date.now() - Math.floor(rng() * 30 * 86400000)).toISOString(),
    certifiedAt: certified ? new Date(Date.now() - Math.floor(rng() * 15 * 86400000)).toISOString() : undefined,
    hooks: [
      { id: `h${raw.id}_1`, type: 'on_complete', action: 'log_result', enabled: true },
      { id: `h${raw.id}_2`, type: 'on_error', action: 'notify_admin', enabled: true },
      { id: `h${raw.id}_3`, type: 'on_timeout', action: 'escalate', enabled: rng() > 0.5 },
      { id: `h${raw.id}_4`, type: 'on_handoff', action: 'transfer_context', enabled: rng() > 0.5 },
    ],
    testResults,
    knowledgeScope,
  };
}

/**
 * Loads the full 290-agent catalog from the bundled JSON files.
 * Returned agents are sorted by numeric id ascending.
 */
export function loadValtheronAgents(): Agent[] {
  const raw: RawAgent[] = [
    ...(agents1to200 as RawAgentsFile).agents,
    ...(agents201to290 as RawAgentsFile).agents,
  ];
  return raw
    .slice()
    .sort((a, b) => a.id - b.id)
    .map(toAgent);
}

/**
 * Mapping from the German JSON category labels to our frontend category keys.
 * Exported for tests and debugging.
 */
export const VALTHERON_CATEGORY_MAP = CATEGORY_MAP;
