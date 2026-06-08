import type { SecurityConfig, KillSwitch, ProjektBaumNode, AnalyticsData } from '../types';

export const defaultSecurityConfig: SecurityConfig = {
  promptInjectionDefense: true,
  piiDetection: { email: true, phone: true, ssn: true, creditCard: true, address: false, name: false },
  gdpr: { exportEnabled: true, deletionEnabled: true, anonymizationEnabled: false },
  zeroTrust: {
    networkSegmentation: true,
    mfa: true,
    leastPrivilege: true,
    continuousVerification: false,
    microSegmentation: false,
  },
  threatModel: {
    injection: true,
    dataLeak: true,
    privilegeEscalation: true,
    dos: false,
    supplyChain: false,
    insiderThreat: false,
  },
  rbac: { roles: ['admin', 'operator', 'viewer', 'auditor'], activeRole: 'admin' },
  encryption: { jwt: true, tls: true, aes256: true, securityHeaders: true },
};

export const defaultKillSwitch: KillSwitch = {
  aktiv: false,
  affectedAgents: [],
  autoTriggerRules: [],
};

export const defaultProjektBaum: ProjektBaumNode = {
  id: 'root',
  name: 'Valtheron Agentic Workspace',
  type: 'project',
  status: 'active',
  progress: 0,
  children: [],
};

export const defaultAnalytics: AnalyticsData = {
  totalAgents: 0,
  activeAgents: 0,
  tasksToday: 0,
  tasksTotal: 0,
  successRate: 0,
  avgResponseTime: 0,
  tasksTrend: [],
  categoryDistribution: [],
  topPerformers: [],
  errorRate: 0,
  uptimeSeconds: 0,
};
