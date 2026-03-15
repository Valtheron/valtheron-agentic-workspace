import { describe, it, expect } from 'vitest';
import {
  generateAgents,
  generateTasks,
  generateCollaborations,
  generateCertifications,
  generateSecurityEvents,
  generateKillSwitch,
  generateAuditLog,
  generateProjektBaum,
  generateAnalytics,
  defaultSecurityConfig,
} from '../services/mockData';

// ── generateAgents ────────────────────────────────────────────────────

describe('generateAgents', () => {
  it('generates the requested number of agents', () => {
    expect(generateAgents(10)).toHaveLength(10);
    expect(generateAgents(50)).toHaveLength(50);
    expect(generateAgents(200)).toHaveLength(200);
  });

  it('generates 200 agents by default', () => {
    expect(generateAgents()).toHaveLength(200);
  });

  it('each agent has required fields', () => {
    const agents = generateAgents(5);
    for (const agent of agents) {
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBeTruthy();
      expect(agent.role).toBeTruthy();
      expect(agent.category).toBeTruthy();
      expect(agent.status).toBeTruthy();
      expect(typeof agent.successRate).toBe('number');
      expect(typeof agent.tasksCompleted).toBe('number');
      expect(typeof agent.failedTasks).toBe('number');
      expect(typeof agent.avgTaskDuration).toBe('number');
      expect(agent.systemPrompt).toBeTruthy();
      expect(agent.personality).toBeTruthy();
      expect(agent.parameters).toBeTruthy();
      expect(Array.isArray(agent.hooks)).toBe(true);
      expect(Array.isArray(agent.testResults)).toBe(true);
    }
  });

  it('agent IDs are unique', () => {
    const agents = generateAgents(20);
    const ids = agents.map((a) => a.id);
    expect(new Set(ids).size).toBe(agents.length);
  });

  it('agent successRate is between 75 and 100', () => {
    const agents = generateAgents(30);
    for (const agent of agents) {
      expect(agent.successRate).toBeGreaterThanOrEqual(75);
      expect(agent.successRate).toBeLessThanOrEqual(100);
    }
  });

  it('agent personality has required fields', () => {
    const agents = generateAgents(3);
    for (const agent of agents) {
      const p = agent.personality;
      expect(typeof p.creativity).toBe('number');
      expect(typeof p.analyticalDepth).toBe('number');
      expect(typeof p.riskTolerance).toBe('number');
      expect(p.communicationStyle).toBeTruthy();
      expect(p.archetype).toBeTruthy();
    }
  });

  it('agent parameters have required fields', () => {
    const agents = generateAgents(3);
    for (const agent of agents) {
      const p = agent.parameters;
      expect(typeof p.temperature).toBe('number');
      expect(typeof p.maxTokens).toBe('number');
      expect(typeof p.topP).toBe('number');
      expect(typeof p.frequencyPenalty).toBe('number');
      expect(typeof p.presencePenalty).toBe('number');
    }
  });

  it('each agent has exactly 4 hooks', () => {
    const agents = generateAgents(5);
    for (const agent of agents) {
      expect(agent.hooks).toHaveLength(4);
    }
  });

  it('each agent has exactly 5 testResults', () => {
    const agents = generateAgents(5);
    for (const agent of agents) {
      expect(agent.testResults).toHaveLength(5);
    }
  });

  it('covers all 10 categories across 200 agents', () => {
    const agents = generateAgents(200);
    const categories = new Set(agents.map((a) => a.category));
    expect(categories.size).toBe(10);
  });

  it('status is one of the valid values', () => {
    const validStatuses = ['active', 'idle', 'working', 'blocked'];
    const agents = generateAgents(20);
    for (const agent of agents) {
      expect(validStatuses).toContain(agent.status);
    }
  });

  it('generates 0 agents when count is 0', () => {
    expect(generateAgents(0)).toHaveLength(0);
  });
});

// ── generateTasks ─────────────────────────────────────────────────────

describe('generateTasks', () => {
  const agents = generateAgents(10);

  it('generates exactly 80 tasks', () => {
    expect(generateTasks(agents)).toHaveLength(80);
  });

  it('each task has required fields', () => {
    const tasks = generateTasks(agents);
    for (const task of tasks) {
      expect(task.id).toBeTruthy();
      expect(task.title).toBeTruthy();
      expect(task.description).toBeTruthy();
      expect(task.status).toBeTruthy();
      expect(task.priority).toBeTruthy();
      expect(task.category).toBeTruthy();
      expect(task.createdAt).toBeTruthy();
      expect(Array.isArray(task.dependencies)).toBe(true);
      expect(task.kanbanColumn).toBeTruthy();
      expect(Array.isArray(task.tags)).toBe(true);
    }
  });

  it('task IDs are unique', () => {
    const tasks = generateTasks(agents);
    const ids = tasks.map((t) => t.id);
    expect(new Set(ids).size).toBe(tasks.length);
  });

  it('task priority is one of the valid values', () => {
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    const tasks = generateTasks(agents);
    for (const task of tasks) {
      expect(validPriorities).toContain(task.priority);
    }
  });
});

// ── generateCollaborations ────────────────────────────────────────────

describe('generateCollaborations', () => {
  const agents = generateAgents(100);

  it('generates 3 collaboration sessions', () => {
    expect(generateCollaborations(agents)).toHaveLength(3);
  });

  it('each session has required fields', () => {
    const sessions = generateCollaborations(agents);
    for (const session of sessions) {
      expect(session.id).toBeTruthy();
      expect(session.name).toBeTruthy();
      expect(Array.isArray(session.agents)).toBe(true);
      expect(session.agents.length).toBeGreaterThan(0);
      expect(session.status).toBeTruthy();
      expect(Array.isArray(session.sharedFiles)).toBe(true);
    }
  });
});

// ── generateCertifications ────────────────────────────────────────────

describe('generateCertifications', () => {
  const agents = generateAgents(50);

  it('returns a certification for each agent that has a certificationId', () => {
    const certs = generateCertifications(agents);
    const agentsWithCerts = agents.filter((a) => a.certificationId);
    expect(certs).toHaveLength(agentsWithCerts.length);
  });

  it('certification has required fields', () => {
    const certs = generateCertifications(agents);
    if (certs.length > 0) {
      const cert = certs[0];
      expect(cert.id).toBeTruthy();
      expect(cert.agentId).toBeTruthy();
      expect(cert.agentName).toBeTruthy();
      expect(cert.level).toBeTruthy();
      expect(cert.status).toBeTruthy();
      expect(typeof cert.score).toBe('number');
      expect(Array.isArray(cert.tests)).toBe(true);
      expect(Array.isArray(cert.monitoringAlerts)).toBe(true);
    }
  });

  it('certification level is valid', () => {
    const validLevels = ['bronze', 'silver', 'gold', 'platinum'];
    const certs = generateCertifications(agents);
    for (const cert of certs) {
      expect(validLevels).toContain(cert.level);
    }
  });
});

// ── generateSecurityEvents ────────────────────────────────────────────

describe('generateSecurityEvents', () => {
  it('generates exactly 7 security events', () => {
    expect(generateSecurityEvents()).toHaveLength(7);
  });

  it('each event has required fields', () => {
    const events = generateSecurityEvents();
    for (const event of events) {
      expect(event.id).toBeTruthy();
      expect(event.type).toBeTruthy();
      expect(event.severity).toBeTruthy();
      expect(event.message).toBeTruthy();
      expect(event.timestamp).toBeTruthy();
      expect(typeof event.resolved).toBe('boolean');
    }
  });

  it('has at least one critical event', () => {
    const events = generateSecurityEvents();
    expect(events.some((e) => e.severity === 'critical')).toBe(true);
  });

  it('has both resolved and unresolved events', () => {
    const events = generateSecurityEvents();
    expect(events.some((e) => e.resolved)).toBe(true);
    expect(events.some((e) => !e.resolved)).toBe(true);
  });
});

// ── generateKillSwitch ────────────────────────────────────────────────

describe('generateKillSwitch', () => {
  it('returns a kill switch object', () => {
    const ks = generateKillSwitch();
    expect(ks).toBeTruthy();
    expect(typeof ks.aktiv).toBe('boolean');
    expect(Array.isArray(ks.affectedAgents)).toBe(true);
    expect(Array.isArray(ks.autoTriggerRules)).toBe(true);
  });

  it('has 5 auto-trigger rules', () => {
    const ks = generateKillSwitch();
    expect(ks.autoTriggerRules).toHaveLength(5);
  });

  it('each rule has id, name, condition, enabled', () => {
    const ks = generateKillSwitch();
    for (const rule of ks.autoTriggerRules) {
      expect(rule.id).toBeTruthy();
      expect(rule.name).toBeTruthy();
      expect(rule.condition).toBeTruthy();
      expect(typeof rule.enabled).toBe('boolean');
    }
  });
});

// ── generateAuditLog ──────────────────────────────────────────────────

describe('generateAuditLog', () => {
  it('generates exactly 50 audit entries', () => {
    expect(generateAuditLog()).toHaveLength(50);
  });

  it('each entry has required fields', () => {
    const log = generateAuditLog();
    for (const entry of log) {
      expect(entry.id).toBeTruthy();
      expect(entry.agentId).toBeTruthy();
      expect(entry.action).toBeTruthy();
      expect(entry.details).toBeTruthy();
      expect(entry.timestamp).toBeTruthy();
      expect(entry.riskLevel).toBeTruthy();
    }
  });

  it('entry IDs are unique', () => {
    const log = generateAuditLog();
    const ids = log.map((e) => e.id);
    expect(new Set(ids).size).toBe(log.length);
  });
});

// ── generateProjektBaum ───────────────────────────────────────────────

describe('generateProjektBaum', () => {
  it('returns a root node', () => {
    const root = generateProjektBaum();
    expect(root.id).toBe('root');
    expect(root.name).toBeTruthy();
    expect(root.type).toBe('project');
    expect(Array.isArray(root.children)).toBe(true);
  });

  it('root has 4 module children', () => {
    const root = generateProjektBaum();
    expect(root.children).toHaveLength(4);
    expect(root.children.every((c) => c.type === 'module')).toBe(true);
  });

  it('each module has task children', () => {
    const root = generateProjektBaum();
    for (const module of root.children) {
      expect(module.children.length).toBeGreaterThan(0);
    }
  });

  it('root progress is a number', () => {
    const root = generateProjektBaum();
    expect(typeof root.progress).toBe('number');
    expect(root.progress).toBeGreaterThanOrEqual(0);
    expect(root.progress).toBeLessThanOrEqual(100);
  });
});

// ── generateAnalytics ─────────────────────────────────────────────────

describe('generateAnalytics', () => {
  const agents = generateAgents(20);
  const tasks = generateTasks(agents);

  it('returns analytics object with required fields', () => {
    const analytics = generateAnalytics(agents, tasks);
    expect(typeof analytics.totalAgents).toBe('number');
    expect(typeof analytics.activeAgents).toBe('number');
    expect(typeof analytics.tasksToday).toBe('number');
    expect(typeof analytics.successRate).toBe('number');
    expect(typeof analytics.avgResponseTime).toBe('number');
    expect(Array.isArray(analytics.tasksTrend)).toBe(true);
    expect(Array.isArray(analytics.categoryDistribution)).toBe(true);
    expect(Array.isArray(analytics.topPerformers)).toBe(true);
    expect(typeof analytics.errorRate).toBe('number');
    expect(typeof analytics.uptime).toBe('number');
  });

  it('totalAgents matches agent count', () => {
    const analytics = generateAnalytics(agents, tasks);
    expect(analytics.totalAgents).toBe(agents.length);
  });

  it('tasksTrend has 7 entries', () => {
    const analytics = generateAnalytics(agents, tasks);
    expect(analytics.tasksTrend).toHaveLength(7);
  });

  it('categoryDistribution covers all categories', () => {
    const analytics = generateAnalytics(agents, tasks);
    expect(analytics.categoryDistribution).toHaveLength(10);
  });

  it('uptime is 99.97', () => {
    const analytics = generateAnalytics(agents, tasks);
    expect(analytics.uptime).toBe(99.97);
  });
});

// ── defaultSecurityConfig ─────────────────────────────────────────────

describe('defaultSecurityConfig', () => {
  it('has promptInjectionDefense', () => {
    expect(typeof defaultSecurityConfig.promptInjectionDefense).toBe('boolean');
    expect(defaultSecurityConfig.promptInjectionDefense).toBe(true);
  });

  it('has piiDetection with all fields', () => {
    const pii = defaultSecurityConfig.piiDetection;
    expect(typeof pii.email).toBe('boolean');
    expect(typeof pii.phone).toBe('boolean');
    expect(typeof pii.ssn).toBe('boolean');
    expect(typeof pii.creditCard).toBe('boolean');
  });

  it('has rbac with roles array', () => {
    expect(Array.isArray(defaultSecurityConfig.rbac.roles)).toBe(true);
    expect(defaultSecurityConfig.rbac.roles.length).toBeGreaterThan(0);
    expect(defaultSecurityConfig.rbac.activeRole).toBeTruthy();
  });

  it('has encryption settings', () => {
    const enc = defaultSecurityConfig.encryption;
    expect(typeof enc.jwt).toBe('boolean');
    expect(typeof enc.tls).toBe('boolean');
    expect(typeof enc.aes256).toBe('boolean');
  });
});
