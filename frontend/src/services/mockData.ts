import type { Agent, Task, CollaborationSession, Certification, SecurityEvent, KillSwitch, AuditEntry, ProjektBaumNode, SecurityConfig, AnalyticsData, AgentCategory } from '../types';

const categories: AgentCategory[] = ['trading', 'security', 'development', 'qa', 'documentation', 'deployment', 'analyst', 'support', 'integration', 'monitoring'];
const roles: Record<AgentCategory, string[]> = {
  trading: ['Market Analyzer', 'Risk Calculator', 'Portfolio Manager', 'Signal Generator', 'Arbitrage Hunter'],
  security: ['Threat Detector', 'Vulnerability Scanner', 'Incident Responder', 'Compliance Auditor', 'Penetration Tester'],
  development: ['Code Generator', 'Bug Fixer', 'Architecture Planner', 'API Designer', 'Database Optimizer'],
  qa: ['Test Runner', 'Quality Checker', 'Regression Detector', 'Performance Tester', 'Coverage Analyzer'],
  documentation: ['Doc Writer', 'API Documenter', 'Tutorial Creator', 'Changelog Manager', 'Knowledge Base Builder'],
  deployment: ['CI/CD Manager', 'Container Orchestrator', 'Infrastructure Builder', 'Release Manager', 'Rollback Coordinator'],
  analyst: ['Data Analyst', 'Trend Spotter', 'Pattern Recognizer', 'Metrics Collector', 'Report Generator'],
  support: ['Ticket Handler', 'Escalation Manager', 'FAQ Responder', 'User Guide Creator', 'Feedback Processor'],
  integration: ['API Connector', 'Webhook Manager', 'Data Transformer', 'Protocol Adapter', 'Sync Coordinator'],
  monitoring: ['System Watcher', 'Alert Manager', 'Log Analyzer', 'Health Checker', 'SLA Tracker'],
};

const statuses: Agent['status'][] = ['active', 'idle', 'working', 'blocked'];
const archetypes: Agent['personality']['archetype'][] = ['analytiker', 'kreativer', 'diplomat', 'commander'];
const commStyles: Agent['personality']['communicationStyle'][] = ['formal', 'casual', 'technical', 'diplomatic'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateAgents(count: number = 200): Agent[] {
  const agents: Agent[] = [];
  for (let i = 1; i <= count; i++) {
    const cat = categories[Math.floor((i - 1) / 20)];
    const roleList = roles[cat];
    const roleIdx = (i - 1) % roleList.length;
    const num = Math.floor((i - 1) / roleList.length / categories.length) + 1;
    agents.push({
      id: `agent_${String(i).padStart(3, '0')}`,
      name: `${roleList[roleIdx]} ${String(num).padStart(2, '0')}`,
      role: roleList[roleIdx],
      category: cat,
      status: randomFrom(statuses),
      successRate: 75 + Math.floor(Math.random() * 25),
      tasksCompleted: Math.floor(Math.random() * 500),
      failedTasks: Math.floor(Math.random() * 20),
      avgTaskDuration: 10 + Math.floor(Math.random() * 120),
      currentTask: Math.random() > 0.4 ? `Task-${Math.floor(Math.random() * 999)}` : null,
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
      systemPrompt: `Du bist ein spezialisierter ${roleList[roleIdx]}-Agent im Bereich ${cat}. Dein Fokus liegt auf präziser Analyse und autonomer Aufgabenausführung.`,
      personality: {
        creativity: 30 + Math.floor(Math.random() * 60),
        analyticalDepth: 40 + Math.floor(Math.random() * 55),
        riskTolerance: 10 + Math.floor(Math.random() * 70),
        communicationStyle: randomFrom(commStyles),
        archetype: randomFrom(archetypes),
        domainFocus: cat,
      },
      parameters: {
        temperature: +(0.3 + Math.random() * 0.7).toFixed(2),
        maxTokens: [1024, 2048, 4096, 8192][Math.floor(Math.random() * 4)],
        topP: +(0.8 + Math.random() * 0.2).toFixed(2),
        frequencyPenalty: +(Math.random() * 0.5).toFixed(2),
        presencePenalty: +(Math.random() * 0.5).toFixed(2),
      },
      certificationId: Math.random() > 0.3 ? `cert_${String(i).padStart(3, '0')}` : undefined,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString(),
      certifiedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 15 * 86400000)).toISOString() : undefined,
      hooks: [
        { id: `h${i}_1`, type: 'on_complete', action: 'log_result', enabled: true },
        { id: `h${i}_2`, type: 'on_error', action: 'notify_admin', enabled: true },
        { id: `h${i}_3`, type: 'on_timeout', action: 'escalate', enabled: Math.random() > 0.5 },
        { id: `h${i}_4`, type: 'on_handoff', action: 'transfer_context', enabled: Math.random() > 0.5 },
      ],
      testResults: [
        { id: `t${i}_1`, category: 'DOM', name: 'Domain Knowledge Test', passed: Math.random() > 0.1, duration: 2 + Math.random() * 5, timestamp: new Date().toISOString() },
        { id: `t${i}_2`, category: 'EDGE', name: 'Edge Case Handling', passed: Math.random() > 0.15, duration: 3 + Math.random() * 8, timestamp: new Date().toISOString() },
        { id: `t${i}_3`, category: 'PERS', name: 'Personality Consistency', passed: Math.random() > 0.1, duration: 1 + Math.random() * 3, timestamp: new Date().toISOString() },
        { id: `t${i}_4`, category: 'KB', name: 'Knowledge Base Accuracy', passed: Math.random() > 0.12, duration: 4 + Math.random() * 6, timestamp: new Date().toISOString() },
        { id: `t${i}_5`, category: 'GEN', name: 'General Capability', passed: Math.random() > 0.08, duration: 2 + Math.random() * 4, timestamp: new Date().toISOString() },
      ],
    });
  }
  return agents;
}

export function generateTasks(agents: Agent[]): Task[] {
  const tasks: Task[] = [];
  const priorities: Task['priority'][] = ['critical', 'high', 'medium', 'low'];
  const kanbanCols: Task['kanbanColumn'][] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
  for (let i = 1; i <= 80; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    tasks.push({
      id: `task_${String(i).padStart(3, '0')}`,
      title: `Task ${i}: ${agent.role} Operation`,
      description: `Automated task for ${agent.role} in ${agent.category} domain.`,
      status: randomFrom(['pending', 'in_progress', 'completed', 'failed'] as TaskStatus[]),
      priority: randomFrom(priorities),
      assignedAgentId: Math.random() > 0.2 ? agent.id : null,
      category: agent.category,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)).toISOString(),
      completedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      dependencies: i > 3 && Math.random() > 0.7 ? [`task_${String(i - 1).padStart(3, '0')}`] : [],
      kanbanColumn: randomFrom(kanbanCols),
      tags: [agent.category, randomFrom(['urgent', 'auto', 'manual', 'recurring'])],
    });
  }
  return tasks;
}

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export function generateCollaborations(agents: Agent[]): CollaborationSession[] {
  return [
    { id: 'collab_001', name: 'Market Risk Analysis', agents: [agents[0].id, agents[1].id, agents[20].id], status: 'active', sharedFiles: ['risk_model.py', 'market_data.csv'], messageCount: 47, startedAt: new Date(Date.now() - 3600000).toISOString(), maxIterations: 10, coordinatorPrompt: 'Koordiniere die Marktanalyse zwischen Trading- und Security-Agenten.', delegationStrategy: 'capability-based', redundancyScore: 12, conflictResolution: 'voting', consensusThreshold: 75, synthesis: 'Market risk is elevated. Recommend hedging positions.' },
    { id: 'collab_002', name: 'Code Review Pipeline', agents: [agents[40].id, agents[41].id, agents[60].id, agents[61].id], status: 'active', sharedFiles: ['app.ts', 'tests.spec.ts', 'review.md'], messageCount: 124, startedAt: new Date(Date.now() - 7200000).toISOString(), maxIterations: 20, coordinatorPrompt: 'Leite das Code-Review zwischen Dev und QA Teams.', delegationStrategy: 'round-robin', redundancyScore: 8, conflictResolution: 'coordinator-decides', consensusThreshold: 80, synthesis: 'Code quality improved by 23%. 3 critical bugs found.' },
    { id: 'collab_003', name: 'Security Audit Sprint', agents: [agents[20].id, agents[21].id, agents[22].id], status: 'completed', sharedFiles: ['audit_report.md', 'vulnerabilities.json'], messageCount: 89, startedAt: new Date(Date.now() - 86400000).toISOString(), maxIterations: 15, coordinatorPrompt: 'Führe ein umfassendes Security-Audit durch.', delegationStrategy: 'priority', redundancyScore: 5, conflictResolution: 'merge', consensusThreshold: 90, synthesis: 'All critical vulnerabilities addressed. 2 medium issues remaining.' },
  ];
}

export function generateCertifications(agents: Agent[]): Certification[] {
  const levels: Certification['level'][] = ['bronze', 'silver', 'gold', 'platinum'];
  const certs: Certification[] = [];
  agents.filter(a => a.certificationId).forEach((a, i) => {
    const level = levels[Math.min(3, Math.floor(a.successRate / 25))];
    const status: Certification['status'] = a.status === 'suspended' ? 'suspended' : Math.random() > 0.15 ? 'valid' : 'expiring';
    certs.push({
      id: a.certificationId!,
      agentId: a.id,
      agentName: a.name,
      level,
      status,
      score: a.successRate,
      issuedAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 86400000)).toISOString(),
      expiresAt: new Date(Date.now() + Math.floor(Math.random() * 90 * 86400000)).toISOString(),
      tests: [
        { name: 'Domain Knowledge', passed: true, score: 85 + Math.floor(Math.random() * 15) },
        { name: 'Edge Cases', passed: Math.random() > 0.2, score: 70 + Math.floor(Math.random() * 30) },
        { name: 'Performance', passed: true, score: 80 + Math.floor(Math.random() * 20) },
        { name: 'Security Compliance', passed: Math.random() > 0.1, score: 75 + Math.floor(Math.random() * 25) },
      ],
      monitoringAlerts: i % 5 === 0 ? [
        { id: `ma_${i}_1`, type: 'performance', severity: 'medium', message: 'Response time increased by 15%', timestamp: new Date().toISOString(), resolved: false },
        { id: `ma_${i}_2`, type: 'compliance', severity: 'low', message: 'Minor policy deviation detected', timestamp: new Date().toISOString(), resolved: true },
      ] : [],
    });
  });
  return certs;
}

export function generateSecurityEvents(): SecurityEvent[] {
  return [
    { id: 'sec_001', type: 'injection', severity: 'critical', message: 'Prompt injection attempt detected on Agent 045', agentId: 'agent_045', timestamp: new Date(Date.now() - 600000).toISOString(), resolved: false },
    { id: 'sec_002', type: 'auth', severity: 'high', message: 'Multiple failed auth attempts from IP 192.168.1.105', timestamp: new Date(Date.now() - 1200000).toISOString(), resolved: false },
    { id: 'sec_003', type: 'access', severity: 'medium', message: 'Agent 012 accessed restricted resource /admin/config', agentId: 'agent_012', timestamp: new Date(Date.now() - 1800000).toISOString(), resolved: true },
    { id: 'sec_004', type: 'anomaly', severity: 'high', message: 'Unusual data exfiltration pattern from Agent 078', agentId: 'agent_078', timestamp: new Date(Date.now() - 3600000).toISOString(), resolved: false },
    { id: 'sec_005', type: 'policy', severity: 'low', message: 'Agent 156 exceeded token limit policy', agentId: 'agent_156', timestamp: new Date(Date.now() - 7200000).toISOString(), resolved: true },
    { id: 'sec_006', type: 'injection', severity: 'critical', message: 'Jailbreak attempt blocked on Agent 033', agentId: 'agent_033', timestamp: new Date(Date.now() - 300000).toISOString(), resolved: true },
    { id: 'sec_007', type: 'anomaly', severity: 'medium', message: 'Agent 091 behavior deviation score: 0.78', agentId: 'agent_091', timestamp: new Date(Date.now() - 5400000).toISOString(), resolved: false },
  ];
}

export function generateKillSwitch(): KillSwitch {
  return {
    aktiv: true,
    affectedAgents: [],
    autoTriggerRules: [
      { id: 'ks_001', name: 'High Error Rate', condition: 'errorRate > 25%', enabled: true },
      { id: 'ks_002', name: 'Data Exfiltration', condition: 'dataOutbound > 100MB/min', enabled: true },
      { id: 'ks_003', name: 'Auth Breach', condition: 'failedAuth > 10/min', enabled: true },
      { id: 'ks_004', name: 'Cost Overrun', condition: 'tokenCost > $500/hour', enabled: true },
      { id: 'ks_005', name: 'Agent Rebellion', condition: 'policyViolation > 3/agent', enabled: false },
    ],
  };
}

export function generateAuditLog(): AuditEntry[] {
  const entries: AuditEntry[] = [];
  for (let i = 1; i <= 50; i++) {
    entries.push({
      id: `audit_${i}`,
      agentId: `agent_${String(Math.floor(Math.random() * 200) + 1).padStart(3, '0')}`,
      action: randomFrom(['task_started', 'task_completed', 'file_accessed', 'api_call', 'config_changed', 'error_logged']),
      details: `Audit entry ${i} - automated operation log`,
      timestamp: new Date(Date.now() - i * 120000).toISOString(),
      riskLevel: randomFrom(['info', 'low', 'medium', 'high', 'critical'] as AuditEntry['riskLevel'][]),
    });
  }
  return entries;
}

export function generateProjektBaum(): ProjektBaumNode {
  return {
    id: 'root', name: 'Valtheron Agentic Workspace', type: 'project', status: 'active', progress: 72, children: [
      { id: 'mod_trading', name: 'Trading Operations', type: 'module', status: 'active', progress: 85, children: [
        { id: 'task_market', name: 'Market Analysis', type: 'task', status: 'active', progress: 90, children: [], agentId: 'agent_001' },
        { id: 'task_risk', name: 'Risk Management', type: 'task', status: 'active', progress: 78, children: [], agentId: 'agent_002' },
        { id: 'task_portfolio', name: 'Portfolio Optimization', type: 'task', status: 'completed', progress: 100, children: [], agentId: 'agent_003' },
      ]},
      { id: 'mod_security', name: 'Security Operations', type: 'module', status: 'active', progress: 65, children: [
        { id: 'task_threat', name: 'Threat Detection', type: 'task', status: 'active', progress: 70, children: [], agentId: 'agent_021' },
        { id: 'task_vuln', name: 'Vulnerability Scanning', type: 'task', status: 'active', progress: 55, children: [], agentId: 'agent_022' },
        { id: 'task_incident', name: 'Incident Response', type: 'task', status: 'blocked', progress: 30, children: [], agentId: 'agent_023' },
      ]},
      { id: 'mod_dev', name: 'Development Pipeline', type: 'module', status: 'active', progress: 78, children: [
        { id: 'task_codegen', name: 'Code Generation', type: 'task', status: 'completed', progress: 100, children: [], agentId: 'agent_041' },
        { id: 'task_review', name: 'Code Review', type: 'task', status: 'active', progress: 60, children: [], agentId: 'agent_042' },
        { id: 'task_test', name: 'Automated Testing', type: 'task', status: 'active', progress: 72, children: [], agentId: 'agent_061' },
      ]},
      { id: 'mod_ops', name: 'Operations & Monitoring', type: 'module', status: 'active', progress: 60, children: [
        { id: 'task_deploy', name: 'Deployment Automation', type: 'task', status: 'active', progress: 65, children: [], agentId: 'agent_101' },
        { id: 'task_monitor', name: 'System Monitoring', type: 'task', status: 'active', progress: 58, children: [], agentId: 'agent_181' },
        { id: 'task_support', name: 'Support Automation', type: 'task', status: 'active', progress: 45, children: [], agentId: 'agent_141' },
      ]},
    ],
  };
}

export const defaultSecurityConfig: SecurityConfig = {
  promptInjectionDefense: true,
  piiDetection: { email: true, phone: true, ssn: true, creditCard: true, address: false, name: false },
  gdpr: { exportEnabled: true, deletionEnabled: true, anonymizationEnabled: false },
  zeroTrust: { networkSegmentation: true, mfa: true, leastPrivilege: true, continuousVerification: false, microSegmentation: false },
  threatModel: { injection: true, dataLeak: true, privilegeEscalation: true, dos: false, supplyChain: false, insiderThreat: false },
  rbac: { roles: ['admin', 'operator', 'viewer', 'auditor'], activeRole: 'admin' },
  encryption: { jwt: true, tls: true, aes256: true, securityHeaders: true },
};

export function generateAnalytics(agents: Agent[], tasks: Task[]): AnalyticsData {
  const activeCount = agents.filter(a => a.status === 'active' || a.status === 'working').length;
  const completedToday = tasks.filter(t => t.status === 'completed').length;
  const categories: AgentCategory[] = ['trading', 'security', 'development', 'qa', 'documentation', 'deployment', 'analyst', 'support', 'integration', 'monitoring'];
  return {
    totalAgents: agents.length,
    activeAgents: activeCount,
    tasksToday: completedToday,
    successRate: +(agents.reduce((s, a) => s + a.successRate, 0) / agents.length).toFixed(1),
    avgResponseTime: 45 + Math.floor(Math.random() * 30),
    tasksTrend: Array.from({ length: 7 }, (_, i) => ({ date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0], count: 20 + Math.floor(Math.random() * 40) })),
    categoryDistribution: categories.map(c => ({ category: c, count: agents.filter(a => a.category === c).length })),
    topPerformers: agents.sort((a, b) => b.successRate - a.successRate).slice(0, 5).map(a => ({ agentId: a.id, name: a.name, score: a.successRate })),
    errorRate: +(agents.reduce((s, a) => s + a.failedTasks, 0) / Math.max(1, agents.reduce((s, a) => s + a.tasksCompleted, 0)) * 100).toFixed(1),
    uptime: 99.97,
  };
}
