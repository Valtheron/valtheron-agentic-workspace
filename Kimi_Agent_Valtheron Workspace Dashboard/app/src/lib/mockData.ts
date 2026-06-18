// ═══════════════════════════════════════════════════════════════════════════════
// Valtheron Agentic Workspace — Complete Mock Data
// Architecture: SQLite (better-sqlite3), 17 tables, 20 indexes, WAL mode
// 291 Agents, 16 Categories, 8 Archetypes, 12 Personality Parameters
// 6 Certification Levels, 14 Backend Modules, 4 Services, 4 LLM Providers
// ═══════════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────────
// 1. TYPE INTERFACES
// ───────────────────────────────────────────────────────────────────────────────

export type AgentCategory =
  | 'GES' | 'ANA' | 'MKT' | 'PRO' | 'ENT' | 'ETR' | 'LEH' | 'SCH' | 'ECO' | 'DEV'
  | 'SYS' | 'OPS' | 'CRE' | 'RES' | 'LEG' | 'MED';

export type AgentStatus = 'active' | 'idle' | 'busy' | 'offline';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type WorkflowType = 'sequential' | 'hierarchical' | 'debate' | 'parallel';
export type WorkflowStatus = 'running' | 'completed' | 'failed' | 'pending';
export type CollabStatus = 'active' | 'completed' | 'pending' | 'failed';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type CertLevel = 'UNCERTIFIED' | 'TECHNICAL_VALID' | 'FORSETI_VERIFIED' | 'EXPERT_REVIEWED' | 'FIELD_TESTED' | 'CERTIFIED_PROFESSIONAL';
export type LLMProvider = 'Anthropic' | 'OpenAI' | 'Ollama' | 'Custom';
export type ArchetypeName = 'Visionary' | 'Analyst' | 'Diplomat' | 'Strategist' | 'Guardian' | 'Innovator' | 'Executor' | 'Sage';
export type ActivityType = 'workflow' | 'agent' | 'system' | 'comment' | 'security';

export interface PersonalityProfile {
  formality: number;
  creativity: number;
  assertiveness: number;
  empathy: number;
  detailOrientation: number;
  riskTolerance: number;
  humor: number;
  technicalDepth: number;
  pace: number;
  verbosity: number;
  adaptability: number;
  domainFocus: number;
}

export interface Agent {
  id: string;
  name: string;
  category: AgentCategory;
  status: AgentStatus;
  role: string;
  llmProvider: LLMProvider;
  llmModel: string;
  personality: ArchetypeName;
  certificationLevel: CertLevel;
  powerLevel: number;
  tasksCompleted: number;
  successRate: number;
  lastActive: string;
  description: string;
  tags: string[];
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: AgentCategory;
  assignedAgentId: string;
  progress: number;
  dueDate: string;
  tags: string[];
  description: string;
}

export interface WorkflowStep {
  agentId: string;
  role: string;
  order: number;
}

export interface Workflow {
  id: string;
  name: string;
  type: WorkflowType;
  category: AgentCategory;
  description: string;
  steps: WorkflowStep[];
  usageCount: number;
  successRate: number;
  avgExecutionTime: string;
  creator: string;
  sharedWith: string[];
  isTemplate: boolean;
  createdAt: string;
  tags: string[];
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: WorkflowStatus;
  currentStep: number;
  progress: number;
  startedAt: string;
  completedAt?: string;
  assignedAgents: string[];
  output?: string;
}

export interface CollabMessage {
  agentId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'code' | 'analysis' | 'decision' | 'alert';
}

export interface CollaborationPattern {
  id: string;
  name: string;
  description: string;
  participatingAgents: string[];
  coordinatorAgentId: string;
  status: CollabStatus;
  messages: CollabMessage[];
  artifacts: string[];
  sessionId: string;
}

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  agentId?: string;
  agentName: string;
  action: string;
  target: string;
  targetId?: string;
  timestamp: string;
  severity?: Severity;
  details?: string;
}

export interface SecurityEvent {
  id: string;
  type: string;
  severity: Severity;
  agentId?: string;
  agentName: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  resolution?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
  ip: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  message: string;
  read: boolean;
  priority: TaskPriority;
  timestamp: string;
  actionUrl?: string;
}

export type ModuleName = 'auth' | 'agents' | 'tasks' | 'workflows' | 'chat' | 'collab' | 'security' | 'analytics' | 'files' | 'tree' | 'notifications' | 'secrets' | 'backup' | 'health';

export interface SystemModule {
  name: ModuleName;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
}

export interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  connections: number;
  lastError?: string;
}

export interface LLMProviderHealth {
  name: LLMProvider;
  status: 'operational' | 'degraded' | 'down';
  requestsPerMin: number;
  avgLatency: number;
  errorRate: number;
  activeConnections: number;
}

export interface SystemHealthData {
  modules: SystemModule[];
  services: ServiceHealth[];
  llmProviders: LLMProviderHealth[];
  database: {
    type: string;
    version: string;
    tables: number;
    indexes: number;
    walMode: boolean;
    cacheHitRate: number;
    connections: number;
    transactionsPerSec: number;
    replicationStatus: string;
    sizeMB: number;
    maxConnections: number;
  };
}

export interface MetricsData {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  busyAgents: number;
  offlineAgents: number;
  tasksCompleted: number;
  tasksInProgress: number;
  avgResponseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkThroughput: number;
  wsConnections: number;
  dbQueryRate: number;
  requestsPerMin: number;
}

export interface CertificationLevel {
  level: CertLevel;
  count: number;
  color: string;
  requirements: string;
  avgTime: string;
  percentage: number;
}

export interface PersonalityArchetype {
  name: ArchetypeName;
  description: string;
  traits: PersonalityProfile;
  strengths: string[];
  weaknesses: string[];
  bestRoles: string[];
  compatibility: ArchetypeName[];
  agentCount: number;
}

export interface LLMProviderData {
  name: LLMProvider;
  status: 'operational' | 'degraded' | 'down';
  models: string[];
  requestsPerMin: number;
  avgLatency: number;
  errorRate: number;
  activeConnections: number;
  tokenThroughput?: number;
  costPer1KTokens?: number;
}

export interface WorkspaceStats {
  totalAgents: number;
  activeNow: number;
  idleNow: number;
  busyNow: number;
  offlineNow: number;
  totalTasks: number;
  tasksCompletedToday: number;
  tasksInProgress: number;
  tasksBlocked: number;
  totalWorkflows: number;
  workflowsRunning: number;
  workflowsCompletedToday: number;
  activeCollaborations: number;
  avgAgentSuccessRate: number;
  avgAgentPowerLevel: number;
  topCategory: AgentCategory;
  totalMessagesExchanged: number;
  securityEvents24h: number;
  unresolvedSecurityEvents: number;
  avgLlmLatency: number;
  dbSizeMB: number;
  systemUptime: number;
  version: string;
  lastDeployed: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer';
  avatar: string;
  status: 'online' | 'away' | 'offline';
  workflowsShared: number;
  lastActive: string;
  email: string;
}

export interface ForsetiDimension {
  name: string;
  description: string;
  weight: number;
  scale: number;
}

export interface PresetConfig {
  name: string;
  description: string;
  personality: PersonalityProfile;
  forseti: {
    InformationAccess: number;
    ResourceControl: number;
    AuthorityPermission: number;
    NetworkPosition: number;
    SynthesisApplication: number;
  };
  llm: {
    provider: LLMProvider;
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// 2. AGENTS DATA — 48 agents (3 per category x 16 categories)
// ───────────────────────────────────────────────────────────────────────────────

export const agentsData: Agent[] = [
  // GES — Gesellschaft / Business Management
  { id: 'GES-001', name: 'Herrmann Verwaltung', category: 'GES', status: 'active', role: 'Geschaeftsfuehrer', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Strategist', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 9, tasksCompleted: 3420, successRate: 97.8, lastActive: '2025-06-17T14:32:00Z', description: 'Senior business administration agent with expertise in corporate governance, strategic planning, and stakeholder management across DACH markets.', tags: ['management', 'strategy', 'c-suite', 'governance'] },
  { id: 'GES-002', name: 'Klein Steuerung', category: 'GES', status: 'active', role: 'Operations Manager', llmProvider: 'OpenAI', llmModel: 'gpt-4.1', personality: 'Executor', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 7, tasksCompleted: 2150, successRate: 94.2, lastActive: '2025-06-17T13:15:00Z', description: 'Operations management specialist focused on process optimization, resource allocation, and lean business operations.', tags: ['operations', 'planning', 'resources', 'lean'] },
  { id: 'GES-003', name: 'Weber Controlling', category: 'GES', status: 'idle', role: 'Financial Controller', llmProvider: 'Anthropic', llmModel: 'claude-haiku-3-5-20241001', personality: 'Analyst', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 6, tasksCompleted: 1890, successRate: 98.1, lastActive: '2025-06-16T22:45:00Z', description: 'Financial controlling and reporting agent with deep expertise in budget management, variance analysis, and forecasting.', tags: ['finance', 'reporting', 'budget', 'controlling'] },

  // ANA — Analysis
  { id: 'ANA-001', name: 'Schmidt Analytik', category: 'ANA', status: 'active', role: 'Senior Data Analyst', llmProvider: 'Anthropic', llmModel: 'claude-opus-4-20250514', personality: 'Analyst', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 10, tasksCompleted: 5670, successRate: 99.1, lastActive: '2025-06-17T14:55:00Z', description: 'Elite data analysis agent specializing in statistical modeling, predictive analytics, and large-scale data processing pipelines.', tags: ['analytics', 'statistics', 'ML', 'big-data'] },
  { id: 'ANA-002', name: 'Mueller Forschung', category: 'ANA', status: 'active', role: 'Research Analyst', llmProvider: 'OpenAI', llmModel: 'o4-mini', personality: 'Sage', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 8, tasksCompleted: 3240, successRate: 96.5, lastActive: '2025-06-17T14:10:00Z', description: 'Research-focused analyst with deep domain knowledge across healthcare, finance, and technology sectors.', tags: ['research', 'trends', 'insights', 'sector-analysis'] },
  { id: 'ANA-003', name: 'Fischer Insights', category: 'ANA', status: 'busy', role: 'BI Specialist', llmProvider: 'Ollama', llmModel: 'llama3.3:70b', personality: 'Guardian', certificationLevel: 'FIELD_TESTED', powerLevel: 6, tasksCompleted: 1780, successRate: 93.8, lastActive: '2025-06-17T12:30:00Z', description: 'Business intelligence specialist focused on dashboard creation, KPI monitoring, and self-service analytics platforms.', tags: ['BI', 'dashboards', 'KPIs', 'self-service'] },

  // MKT — Marketing
  { id: 'MKT-001', name: 'Schulz Werbung', category: 'MKT', status: 'active', role: 'Campaign Manager', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Innovator', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 8, tasksCompleted: 2890, successRate: 95.4, lastActive: '2025-06-17T14:40:00Z', description: 'Digital marketing strategist with expertise in campaign optimization, audience targeting, and cross-channel attribution.', tags: ['marketing', 'campaigns', 'digital', 'attribution'] },
  { id: 'MKT-002', name: 'Lehmann Marke', category: 'MKT', status: 'idle', role: 'Brand Strategist', llmProvider: 'OpenAI', llmModel: 'gpt-4.1-mini', personality: 'Diplomat', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 7, tasksCompleted: 1560, successRate: 92.1, lastActive: '2025-06-17T10:20:00Z', description: 'Brand strategy specialist focused on market positioning, brand identity development, and voice-of-customer programs.', tags: ['branding', 'strategy', 'identity', 'positioning'] },
  { id: 'MKT-003', name: 'Koehler Content', category: 'MKT', status: 'active', role: 'Content Creator', llmProvider: 'Custom', llmModel: 'valtheron-mkt-v2', personality: 'Visionary', certificationLevel: 'TECHNICAL_VALID', powerLevel: 5, tasksCompleted: 2100, successRate: 91.3, lastActive: '2025-06-17T14:25:00Z', description: 'Content creation agent specializing in multi-channel marketing copy, visual concepts, and SEO-optimized long-form content.', tags: ['content', 'social', 'copywriting', 'SEO'] },

  // PRO — Production / Manufacturing
  { id: 'PRO-001', name: 'Bauer Fertigung', category: 'PRO', status: 'active', role: 'Production Planner', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Executor', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 8, tasksCompleted: 4120, successRate: 98.7, lastActive: '2025-06-17T14:50:00Z', description: 'Production planning and manufacturing optimization agent with lean methodology, Six Sigma, and Industry 4.0 expertise.', tags: ['production', 'lean', 'planning', 'six-sigma'] },
  { id: 'PRO-002', name: 'Werner Qualitaet', category: 'PRO', status: 'active', role: 'QA Engineer', llmProvider: 'OpenAI', llmModel: 'gpt-4.1', personality: 'Guardian', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 7, tasksCompleted: 3560, successRate: 99.3, lastActive: '2025-06-17T14:15:00Z', description: 'Quality assurance specialist ensuring production standards, compliance verification, and continuous improvement processes.', tags: ['quality', 'compliance', 'testing', 'iso'] },
  { id: 'PRO-003', name: 'Krause Logistik', category: 'PRO', status: 'offline', role: 'Supply Chain Manager', llmProvider: 'Ollama', llmModel: 'mistral-large:123b', personality: 'Strategist', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 6, tasksCompleted: 1980, successRate: 95.8, lastActive: '2025-06-16T18:00:00Z', description: 'Supply chain and logistics optimization agent with end-to-end visibility, demand forecasting, and vendor management expertise.', tags: ['logistics', 'supply-chain', 'optimization', 'forecasting'] },

  // ENT — Entrepreneurship
  { id: 'ENT-001', name: 'Hofmann Venture', category: 'ENT', status: 'active', role: 'Startup Advisor', llmProvider: 'Anthropic', llmModel: 'claude-opus-4-20250514', personality: 'Visionary', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 9, tasksCompleted: 1890, successRate: 88.4, lastActive: '2025-06-17T14:45:00Z', description: 'Entrepreneurship advisor helping navigate early-stage ventures, funding rounds, pitch decks, and go-to-market strategies.', tags: ['startup', 'venture', 'funding', 'gTM'] },
  { id: 'ENT-002', name: 'Schaefer Innovation', category: 'ENT', status: 'idle', role: 'Innovation Lead', llmProvider: 'OpenAI', llmModel: 'o3', personality: 'Innovator', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 8, tasksCompleted: 1450, successRate: 85.2, lastActive: '2025-06-17T09:30:00Z', description: 'Innovation catalyst driving product development, market disruption strategies, and design thinking workshops.', tags: ['innovation', 'product', 'disruption', 'design-thinking'] },
  { id: 'ENT-003', name: 'Peters Wachstum', category: 'ENT', status: 'active', role: 'Growth Strategist', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Strategist', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 7, tasksCompleted: 2100, successRate: 91.6, lastActive: '2025-06-17T14:20:00Z', description: 'Growth hacking specialist focused on scaling strategies, market penetration, and viral loop optimization.', tags: ['growth', 'scaling', 'strategy', 'viral-loops'] },

  // ETR — E-Commerce / Trading
  { id: 'ETR-001', name: 'Meyer Handel', category: 'ETR', status: 'active', role: 'E-Commerce Manager', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Executor', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 7, tasksCompleted: 2670, successRate: 96.3, lastActive: '2025-06-17T14:35:00Z', description: 'E-commerce operations manager specializing in marketplace optimization, dynamic pricing, and conversion rate improvement.', tags: ['e-commerce', 'pricing', 'marketplace', 'CRO'] },
  { id: 'ETR-002', name: 'Lang Vertrieb', category: 'ETR', status: 'busy', role: 'Sales Analyst', llmProvider: 'OpenAI', llmModel: 'gpt-4.1', personality: 'Analyst', certificationLevel: 'FIELD_TESTED', powerLevel: 6, tasksCompleted: 1890, successRate: 93.5, lastActive: '2025-06-17T13:45:00Z', description: 'Sales analytics and forecasting agent with expertise in revenue optimization, territory planning, and pipeline management.', tags: ['sales', 'forecasting', 'revenue', 'pipeline'] },
  { id: 'ETR-003', name: 'Walter Kunden', category: 'ETR', status: 'idle', role: 'CRM Specialist', llmProvider: 'Ollama', llmModel: 'qwen2.5:72b', personality: 'Diplomat', certificationLevel: 'TECHNICAL_VALID', powerLevel: 5, tasksCompleted: 1340, successRate: 90.2, lastActive: '2025-06-17T08:15:00Z', description: 'Customer relationship management agent focused on retention, loyalty programs, and lifecycle marketing automation.', tags: ['CRM', 'retention', 'loyalty', 'lifecycle'] },

  // LEH — Retail / Lebensmittelhandel
  { id: 'LEH-001', name: 'Friedrich Retail', category: 'LEH', status: 'active', role: 'Retail Analyst', llmProvider: 'Anthropic', llmModel: 'claude-haiku-3-5-20241001', personality: 'Analyst', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 6, tasksCompleted: 1980, successRate: 94.7, lastActive: '2025-06-17T14:05:00Z', description: 'Retail analytics agent specializing in inventory management, store optimization, and assortment planning for grocery chains.', tags: ['retail', 'inventory', 'stores', 'assortment'] },
  { id: 'LEH-002', name: 'Simon Verkauf', category: 'LEH', status: 'active', role: 'Merchandising Lead', llmProvider: 'OpenAI', llmModel: 'gpt-4.1-mini', personality: 'Innovator', certificationLevel: 'FIELD_TESTED', powerLevel: 5, tasksCompleted: 1560, successRate: 92.8, lastActive: '2025-06-17T13:30:00Z', description: 'Merchandising and product placement optimization agent for retail environments, planograms, and seasonal campaigns.', tags: ['merchandising', 'placement', 'retail', 'planograms'] },
  { id: 'LEH-003', name: 'Neumann Kasse', category: 'LEH', status: 'offline', role: 'POS Specialist', llmProvider: 'Custom', llmModel: 'valtheron-retail-v1', personality: 'Guardian', certificationLevel: 'TECHNICAL_VALID', powerLevel: 4, tasksCompleted: 890, successRate: 97.5, lastActive: '2025-06-16T20:00:00Z', description: 'Point-of-sale and checkout optimization agent for retail transaction flows, payment integration, and fraud detection.', tags: ['POS', 'checkout', 'transactions', 'payments'] },

  // SCH — Education / Schule
  { id: 'SCH-001', name: 'Koch Bildung', category: 'SCH', status: 'active', role: 'Curriculum Designer', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Sage', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 8, tasksCompleted: 2340, successRate: 97.2, lastActive: '2025-06-17T14:48:00Z', description: 'Educational curriculum design agent with expertise in adaptive learning paths, competency frameworks, and assessment design.', tags: ['education', 'curriculum', 'learning', 'assessment'] },
  { id: 'SCH-002', name: 'Maier Lehre', category: 'SCH', status: 'active', role: 'Instructional Coach', llmProvider: 'OpenAI', llmModel: 'gpt-4.1', personality: 'Diplomat', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 7, tasksCompleted: 1890, successRate: 95.1, lastActive: '2025-06-17T14:12:00Z', description: 'Instructional coaching agent that personalizes learning experiences, mentors learners, and facilitates knowledge transfer.', tags: ['coaching', 'personalization', 'mentoring', 'LMS'] },
  { id: 'SCH-003', name: 'Jung Wissen', category: 'SCH', status: 'idle', role: 'Knowledge Curator', llmProvider: 'Ollama', llmModel: 'llama3.3:70b', personality: 'Analyst', certificationLevel: 'FIELD_TESTED', powerLevel: 6, tasksCompleted: 1450, successRate: 93.4, lastActive: '2025-06-17T11:00:00Z', description: 'Knowledge management agent organizing educational content, maintaining taxonomies, and curating learning resource libraries.', tags: ['knowledge', 'content', 'taxonomy', 'curation'] },

  // ECO — Economy / Economics
  { id: 'ECO-001', name: 'Berger Makro', category: 'ECO', status: 'active', role: 'Chief Economist', llmProvider: 'Anthropic', llmModel: 'claude-opus-4-20250514', personality: 'Analyst', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 10, tasksCompleted: 3450, successRate: 98.9, lastActive: '2025-06-17T14:55:00Z', description: 'Macroeconomic analysis agent specializing in market forecasting, economic modeling, and central bank policy analysis.', tags: ['economics', 'forecasting', 'macro', 'policy'] },
  { id: 'ECO-002', name: 'Frank Markt', category: 'ECO', status: 'busy', role: 'Market Analyst', llmProvider: 'OpenAI', llmModel: 'o4-mini', personality: 'Strategist', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 8, tasksCompleted: 2780, successRate: 94.6, lastActive: '2025-06-17T14:30:00Z', description: 'Market analysis agent with deep expertise in competitive intelligence, pricing strategy, and market entry analysis.', tags: ['market', 'competitive', 'pricing', 'entry'] },
  { id: 'ECO-003', name: 'Roth Finanzen', category: 'ECO', status: 'active', role: 'Financial Analyst', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Guardian', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 7, tasksCompleted: 2120, successRate: 96.8, lastActive: '2025-06-17T14:18:00Z', description: 'Financial market analysis agent focused on investment strategies, portfolio optimization, and risk assessment.', tags: ['finance', 'investment', 'risk', 'portfolio'] },

  // DEV — Development
  { id: 'DEV-001', name: 'CodeGen Weber', category: 'DEV', status: 'active', role: 'Senior Developer', llmProvider: 'Anthropic', llmModel: 'claude-opus-4-20250514', personality: 'Innovator', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 10, tasksCompleted: 6780, successRate: 97.5, lastActive: '2025-06-17T14:58:00Z', description: 'Elite code generation agent with full-stack expertise, architecture design skills, and mastery of 40+ programming languages.', tags: ['coding', 'fullstack', 'architecture', 'polyglot'] },
  { id: 'DEV-002', name: 'BuildMueller CI', category: 'DEV', status: 'active', role: 'DevOps Engineer', llmProvider: 'OpenAI', llmModel: 'gpt-4.1', personality: 'Executor', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 9, tasksCompleted: 4230, successRate: 98.2, lastActive: '2025-06-17T14:45:00Z', description: 'DevOps and CI/CD pipeline management agent ensuring smooth deployment workflows, infrastructure as code, and SRE practices.', tags: ['devops', 'cicd', 'infrastructure', 'SRE'] },
  { id: 'DEV-003', name: 'TestKlein QA', category: 'DEV', status: 'busy', role: 'Test Engineer', llmProvider: 'Ollama', llmModel: 'codellama:70b', personality: 'Guardian', certificationLevel: 'FIELD_TESTED', powerLevel: 7, tasksCompleted: 3890, successRate: 99.4, lastActive: '2025-06-17T14:40:00Z', description: 'Quality assurance testing agent with automated test generation, mutation testing, and coverage analysis capabilities.', tags: ['testing', 'QA', 'automation', 'coverage'] },

  // SYS — Systems
  { id: 'SYS-001', name: 'KernelSchmidt', category: 'SYS', status: 'active', role: 'System Architect', llmProvider: 'Anthropic', llmModel: 'claude-opus-4-20250514', personality: 'Strategist', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 10, tasksCompleted: 4560, successRate: 99.5, lastActive: '2025-06-17T14:59:00Z', description: 'Core systems architect responsible for infrastructure design, scalability planning, and distributed systems governance.', tags: ['systems', 'architecture', 'infrastructure', 'distributed'] },
  { id: 'SYS-002', name: 'NetzBauer', category: 'SYS', status: 'active', role: 'Network Engineer', llmProvider: 'OpenAI', llmModel: 'gpt-4.1', personality: 'Executor', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 8, tasksCompleted: 3120, successRate: 97.8, lastActive: '2025-06-17T14:42:00Z', description: 'Network engineering agent managing connectivity, latency optimization, load balancing, and zero-trust security policies.', tags: ['network', 'connectivity', 'security', 'zero-trust'] },
  { id: 'SYS-003', name: 'SecHofmann', category: 'SYS', status: 'active', role: 'Security Engineer', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Guardian', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 9, tasksCompleted: 5340, successRate: 99.8, lastActive: '2025-06-17T14:50:00Z', description: 'Cybersecurity agent monitoring threats, managing certificates, enforcing policies, and leading incident response.', tags: ['security', 'threats', 'certificates', 'incident-response'] },

  // OPS — Operations
  { id: 'OPS-001', name: 'RunFriedrich', category: 'OPS', status: 'active', role: 'SRE Lead', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Executor', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 9, tasksCompleted: 5670, successRate: 98.9, lastActive: '2025-06-17T14:52:00Z', description: 'Site reliability engineering lead ensuring 99.99% uptime, incident response, and chaos engineering practices.', tags: ['SRE', 'incidents', 'reliability', 'chaos-engineering'] },
  { id: 'OPS-002', name: 'MonKoch', category: 'OPS', status: 'active', role: 'Monitoring Specialist', llmProvider: 'OpenAI', llmModel: 'gpt-4.1-mini', personality: 'Analyst', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 7, tasksCompleted: 2340, successRate: 97.2, lastActive: '2025-06-17T14:28:00Z', description: 'Monitoring and observability agent managing alerts, dashboards, metric pipelines, and distributed tracing.', tags: ['monitoring', 'observability', 'alerts', 'tracing'] },
  { id: 'OPS-003', name: 'AutoLang', category: 'OPS', status: 'idle', role: 'Automation Engineer', llmProvider: 'Ollama', llmModel: 'mistral-large:123b', personality: 'Innovator', certificationLevel: 'FIELD_TESTED', powerLevel: 6, tasksCompleted: 1780, successRate: 95.3, lastActive: '2025-06-17T10:45:00Z', description: 'Infrastructure automation agent building runbooks, automated remediation flows, and self-healing systems.', tags: ['automation', 'runbooks', 'remediation', 'self-healing'] },

  // CRE — Creative
  { id: 'CRE-001', name: 'KunstSchulz', category: 'CRE', status: 'active', role: 'Art Director', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Visionary', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 9, tasksCompleted: 2890, successRate: 93.1, lastActive: '2025-06-17T14:46:00Z', description: 'Creative direction agent specializing in visual design concepts, brand aesthetics, and motion design systems.', tags: ['design', 'visual', 'branding', 'motion'] },
  { id: 'CRE-002', name: 'TextLehmann', category: 'CRE', status: 'active', role: 'Copywriter', llmProvider: 'OpenAI', llmModel: 'gpt-4.1', personality: 'Diplomat', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 7, tasksCompleted: 3450, successRate: 95.8, lastActive: '2025-06-17T14:33:00Z', description: 'Creative copywriting agent producing compelling narratives, marketing content, and brand storytelling across formats.', tags: ['copywriting', 'narrative', 'content', 'storytelling'] },
  { id: 'CRE-003', name: 'MedienWalter', category: 'CRE', status: 'offline', role: 'Media Producer', llmProvider: 'Custom', llmModel: 'valtheron-media-v1', personality: 'Innovator', certificationLevel: 'TECHNICAL_VALID', powerLevel: 6, tasksCompleted: 1340, successRate: 89.4, lastActive: '2025-06-16T19:30:00Z', description: 'Media production agent handling video editing, audio synthesis, content packaging, and multi-format distribution.', tags: ['media', 'video', 'audio', 'distribution'] },

  // RES — Research
  { id: 'RES-001', name: 'ForschPeters', category: 'RES', status: 'active', role: 'Research Lead', llmProvider: 'Anthropic', llmModel: 'claude-opus-4-20250514', personality: 'Sage', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 10, tasksCompleted: 2340, successRate: 96.7, lastActive: '2025-06-17T14:53:00Z', description: 'Advanced research agent conducting systematic literature reviews, hypothesis testing, and peer-review coordination.', tags: ['research', 'science', 'literature', 'peer-review'] },
  { id: 'RES-002', name: 'DataMaier', category: 'RES', status: 'active', role: 'Data Scientist', llmProvider: 'OpenAI', llmModel: 'o3', personality: 'Analyst', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 9, tasksCompleted: 3120, successRate: 94.3, lastActive: '2025-06-17T14:38:00Z', description: 'Data science agent specializing in ML model development, experimental design, and statistical inference.', tags: ['datascience', 'ML', 'experiments', 'inference'] },
  { id: 'RES-003', name: 'LabJung', category: 'RES', status: 'busy', role: 'Lab Analyst', llmProvider: 'Ollama', llmModel: 'deepseek-r1:70b', personality: 'Guardian', certificationLevel: 'FIELD_TESTED', powerLevel: 7, tasksCompleted: 1890, successRate: 92.5, lastActive: '2025-06-17T14:22:00Z', description: 'Laboratory data analysis agent processing experimental results, instrument data, and generating compliance reports.', tags: ['lab', 'experiments', 'analysis', 'compliance'] },

  // LEG — Legal
  { id: 'LEG-001', name: 'RechtNeumann', category: 'LEG', status: 'active', role: 'Legal Counsel', llmProvider: 'Anthropic', llmModel: 'claude-sonnet-4-20250514', personality: 'Guardian', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 9, tasksCompleted: 2780, successRate: 99.2, lastActive: '2025-06-17T14:44:00Z', description: 'Legal counsel agent specializing in contract review, compliance, risk mitigation, and regulatory interpretation.', tags: ['legal', 'contracts', 'compliance', 'regulatory'] },
  { id: 'LEG-002', name: 'ComplianceKlein', category: 'LEG', status: 'active', role: 'Compliance Officer', llmProvider: 'OpenAI', llmModel: 'gpt-4.1', personality: 'Strategist', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 8, tasksCompleted: 3450, successRate: 98.8, lastActive: '2025-06-17T14:30:00Z', description: 'Regulatory compliance agent ensuring GDPR, SOC2, ISO 27001, and industry-specific standard adherence.', tags: ['compliance', 'GDPR', 'regulatory', 'SOC2'] },
  { id: 'LEG-003', name: 'VertragSimon', category: 'LEG', status: 'idle', role: 'Contract Analyst', llmProvider: 'Anthropic', llmModel: 'claude-haiku-3-5-20241001', personality: 'Analyst', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 6, tasksCompleted: 2120, successRate: 97.4, lastActive: '2025-06-17T11:45:00Z', description: 'Contract analysis agent parsing legal documents, flagging risks, and automating clause extraction.', tags: ['contracts', 'parsing', 'risk', 'clauses'] },

  // MED — Medical / Healthcare
  { id: 'MED-001', name: 'DocMueller', category: 'MED', status: 'active', role: 'Clinical Analyst', llmProvider: 'Anthropic', llmModel: 'claude-opus-4-20250514', personality: 'Sage', certificationLevel: 'CERTIFIED_PROFESSIONAL', powerLevel: 9, tasksCompleted: 1890, successRate: 98.1, lastActive: '2025-06-17T14:51:00Z', description: 'Clinical data analysis agent supporting diagnostic workflows, treatment optimization, and evidence-based medicine.', tags: ['clinical', 'diagnostics', 'healthcare', 'evidence-based'] },
  { id: 'MED-002', name: 'HealthBauer', category: 'MED', status: 'active', role: 'Health Informatics', llmProvider: 'OpenAI', llmModel: 'gpt-4.1', personality: 'Guardian', certificationLevel: 'FORSETI_VERIFIED', powerLevel: 8, tasksCompleted: 2340, successRate: 97.6, lastActive: '2025-06-17T14:36:00Z', description: 'Health informatics agent managing patient data, FHIR compliance, clinical workflows, and interoperability standards.', tags: ['healthcare', 'FHIR', 'informatics', 'interoperability'] },
  { id: 'MED-003', name: 'PharmaKoch', category: 'MED', status: 'offline', role: 'Pharma Researcher', llmProvider: 'Custom', llmModel: 'valtheron-med-v2', personality: 'Analyst', certificationLevel: 'EXPERT_REVIEWED', powerLevel: 7, tasksCompleted: 1560, successRate: 93.9, lastActive: '2025-06-16T21:00:00Z', description: 'Pharmaceutical research agent analyzing drug interactions, clinical trial data, and pharmacovigilance signals.', tags: ['pharma', 'clinical-trials', 'drugs', 'pharmacovigilance'] },
];


// ───────────────────────────────────────────────────────────────────────────────
// 3. TASKS DATA — 30 tasks
// ───────────────────────────────────────────────────────────────────────────────

export const tasksData: Task[] = [
  { id: 'TSK-001', title: 'Q4 Finanzbericht validieren', status: 'in-progress', priority: 'critical', category: 'GES', assignedAgentId: 'GES-003', progress: 72, dueDate: '2025-06-19', tags: ['finance', 'Q4', 'reporting'], description: 'Validate and finalize Q4 financial statements for board review.' },
  { id: 'TSK-002', title: 'Marktanalyse 2025 erstellen', status: 'todo', priority: 'high', category: 'ANA', assignedAgentId: 'ANA-001', progress: 0, dueDate: '2025-06-22', tags: ['market', 'analysis', '2025'], description: 'Comprehensive market analysis for 2025 strategic planning cycle.' },
  { id: 'TSK-003', title: 'Social Media Kampagne Q1', status: 'in-progress', priority: 'high', category: 'MKT', assignedAgentId: 'MKT-001', progress: 45, dueDate: '2025-06-25', tags: ['social', 'campaign', 'Q1'], description: 'Design and execute Q1 social media marketing campaign across LinkedIn, X, and Instagram.' },
  { id: 'TSK-004', title: 'Produktionslinie A optimieren', status: 'review', priority: 'critical', category: 'PRO', assignedAgentId: 'PRO-001', progress: 90, dueDate: '2025-06-18', tags: ['production', 'optimization', 'lean'], description: 'Optimize production line A throughput using lean methodology and Six Sigma tools.' },
  { id: 'TSK-005', title: 'Startup Pitch Deck pruefen', status: 'done', priority: 'medium', category: 'ENT', assignedAgentId: 'ENT-001', progress: 100, dueDate: '2025-06-15', tags: ['startup', 'pitch', 'review'], description: 'Review and refine startup pitch deck for Series A presentation to venture capital firms.' },
  { id: 'TSK-006', title: 'E-Commerce Conversion-Rate', status: 'blocked', priority: 'high', category: 'ETR', assignedAgentId: 'ETR-001', progress: 30, dueDate: '2025-06-21', tags: ['e-commerce', 'conversion', 'AB-test'], description: 'Investigate drop in e-commerce conversion rate from 3.2% to 2.1% and propose fixes.' },
  { id: 'TSK-007', title: 'Inventur Lebensmittel', status: 'todo', priority: 'medium', category: 'LEH', assignedAgentId: 'LEH-001', progress: 0, dueDate: '2025-06-24', tags: ['inventory', 'retail', 'food'], description: 'Conduct monthly food inventory across all 14 retail locations.' },
  { id: 'TSK-008', title: 'Lernmodul KI-Grundlagen', status: 'in-progress', priority: 'medium', category: 'SCH', assignedAgentId: 'SCH-001', progress: 60, dueDate: '2025-06-27', tags: ['education', 'AI', 'module'], description: 'Develop AI fundamentals learning module for corporate training with 12 lessons and 3 quizzes.' },
  { id: 'TSK-009', title: 'Inflationsprognose aktualisieren', status: 'todo', priority: 'high', category: 'ECO', assignedAgentId: 'ECO-001', progress: 0, dueDate: '2025-06-20', tags: ['inflation', 'forecast', 'economy'], description: 'Update macroeconomic inflation forecast with latest ECB and Federal Reserve data.' },
  { id: 'TSK-010', title: 'API Gateway Refactoring', status: 'in-progress', priority: 'critical', category: 'DEV', assignedAgentId: 'DEV-001', progress: 55, dueDate: '2025-06-18', tags: ['API', 'refactoring', 'architecture'], description: 'Complete API gateway refactoring to improve response times and support GraphQL federation.' },
  { id: 'TSK-011', title: 'Datenbank Replikation', status: 'review', priority: 'high', category: 'SYS', assignedAgentId: 'SYS-001', progress: 85, dueDate: '2025-06-19', tags: ['database', 'replication', 'DR'], description: 'Set up cross-region database replication for disaster recovery with sub-second RPO.' },
  { id: 'TSK-012', title: 'Incident Response Runbook', status: 'todo', priority: 'medium', category: 'OPS', assignedAgentId: 'OPS-001', progress: 0, dueDate: '2025-06-26', tags: ['incident', 'runbook', 'SRE'], description: 'Document incident response procedures for new microservices and serverless functions.' },
  { id: 'TSK-013', title: 'Brand Refresh Konzept', status: 'in-progress', priority: 'medium', category: 'CRE', assignedAgentId: 'CRE-001', progress: 35, dueDate: '2025-06-28', tags: ['branding', 'design', 'refresh'], description: 'Create brand refresh concept including new color palette, typography, and motion guidelines.' },
  { id: 'TSK-014', title: 'Forschungsbericht KI-Ethik', status: 'todo', priority: 'high', category: 'RES', assignedAgentId: 'RES-001', progress: 0, dueDate: '2025-06-23', tags: ['research', 'AI-ethics', 'paper'], description: 'Author research report on ethical implications of autonomous agents in healthcare decisions.' },
  { id: 'TSK-015', title: 'DSGVO Compliance Audit', status: 'in-progress', priority: 'critical', category: 'LEG', assignedAgentId: 'LEG-002', progress: 70, dueDate: '2025-06-19', tags: ['GDPR', 'compliance', 'audit'], description: 'Conduct comprehensive GDPR compliance audit across all 14 backend modules.' },
  { id: 'TSK-016', title: 'Patientendaten Migration', status: 'blocked', priority: 'critical', category: 'MED', assignedAgentId: 'MED-002', progress: 20, dueDate: '2025-06-20', tags: ['healthcare', 'migration', 'FHIR'], description: 'Migrate 45,000 patient records to FHIR R4 compliant format for interoperability.' },
  { id: 'TSK-017', title: 'Neukundenakquise Strategie', status: 'todo', priority: 'medium', category: 'MKT', assignedAgentId: 'MKT-002', progress: 0, dueDate: '2025-06-25', tags: ['acquisition', 'strategy', 'leads'], description: 'Develop customer acquisition strategy for Q3 2025 with CAC and LTV projections.' },
  { id: 'TSK-018', title: 'Supply Chain Optimierung', status: 'in-progress', priority: 'high', category: 'PRO', assignedAgentId: 'PRO-003', progress: 50, dueDate: '2025-06-22', tags: ['supply-chain', 'optimization', 'logistics'], description: 'Optimize supply chain routes to reduce delivery times by 15% using network flow algorithms.' },
  { id: 'TSK-019', title: 'Microservices Monitoring', status: 'todo', priority: 'medium', category: 'OPS', assignedAgentId: 'OPS-002', progress: 0, dueDate: '2025-06-24', tags: ['monitoring', 'microservices', 'observability'], description: 'Deploy monitoring stack for new microservices architecture with OpenTelemetry and Grafana.' },
  { id: 'TSK-020', title: 'LLM Prompt Engineering', status: 'in-progress', priority: 'high', category: 'DEV', assignedAgentId: 'DEV-001', progress: 40, dueDate: '2025-06-21', tags: ['LLM', 'prompts', 'optimization'], description: 'Optimize prompt templates for better response quality and 30% cost reduction.' },
  { id: 'TSK-021', title: 'Vertragsreview Lieferanten', status: 'todo', priority: 'medium', category: 'LEG', assignedAgentId: 'LEG-001', progress: 0, dueDate: '2025-06-26', tags: ['contracts', 'suppliers', 'legal'], description: 'Review and negotiate updated supplier contract terms for Q3 procurement cycle.' },
  { id: 'TSK-022', title: 'Klinische Studie Auswertung', status: 'in-progress', priority: 'high', category: 'MED', assignedAgentId: 'MED-001', progress: 65, dueDate: '2025-06-23', tags: ['clinical', 'study', 'analysis'], description: 'Analyze Phase II clinical trial data and generate summary report for regulatory submission.' },
  { id: 'TSK-023', title: 'Wissensdatenbank aktualisieren', status: 'done', priority: 'low', category: 'SCH', assignedAgentId: 'SCH-003', progress: 100, dueDate: '2025-06-16', tags: ['knowledge', 'documentation', 'wiki'], description: 'Update internal knowledge base with latest process documentation and API changes.' },
  { id: 'TSK-024', title: 'Sicherheitsincident #4021', status: 'in-progress', priority: 'critical', category: 'SYS', assignedAgentId: 'SYS-003', progress: 80, dueDate: '2025-06-18', tags: ['security', 'incident', 'investigation'], description: 'Investigate and remediate security incident #4021 in payment service related to SQL injection attempt.' },
  { id: 'TSK-025', title: 'Kreativkonzept Produktlaunch', status: 'todo', priority: 'medium', category: 'CRE', assignedAgentId: 'CRE-002', progress: 0, dueDate: '2025-06-27', tags: ['creative', 'launch', 'concept'], description: 'Develop creative concept for upcoming flagship product launch with teaser campaign.' },
  { id: 'TSK-026', title: 'ML-Modell Retraining', status: 'review', priority: 'high', category: 'RES', assignedAgentId: 'RES-002', progress: 92, dueDate: '2025-06-19', tags: ['ML', 'retraining', 'pipeline'], description: 'Retrain recommendation model with Q2 user interaction data and A/B test configuration.' },
  { id: 'TSK-027', title: 'Vertriebsprognose Q3', status: 'todo', priority: 'medium', category: 'ETR', assignedAgentId: 'ETR-002', progress: 0, dueDate: '2025-06-22', tags: ['forecast', 'sales', 'Q3'], description: 'Generate Q3 sales forecast with territory-level breakdown and product line granularity.' },
  { id: 'TSK-028', title: 'Investitionsanalyse', status: 'in-progress', priority: 'high', category: 'ECO', assignedAgentId: 'ECO-002', progress: 45, dueDate: '2025-06-21', tags: ['investment', 'analysis', 'portfolio'], description: 'Complete portfolio investment analysis for Q3 rebalancing with risk-adjusted returns.' },
  { id: 'TSK-029', title: 'CI/CD Pipeline Upgrade', status: 'todo', priority: 'medium', category: 'DEV', assignedAgentId: 'DEV-002', progress: 0, dueDate: '2025-06-25', tags: ['cicd', 'pipeline', 'upgrade'], description: 'Upgrade CI/CD pipeline to support new deployment environments and canary releases.' },
  { id: 'TSK-030', title: 'Netzwerk-Segmentierung', status: 'todo', priority: 'high', category: 'SYS', assignedAgentId: 'SYS-002', progress: 0, dueDate: '2025-06-20', tags: ['network', 'segmentation', 'security'], description: 'Implement zero-trust network segmentation for production cluster with micro-firewalls.' },
];

// ───────────────────────────────────────────────────────────────────────────────
// 4. WORKFLOWS DATA — 15 workflows
// ───────────────────────────────────────────────────────────────────────────────

export const workflowsData: Workflow[] = [
  {
    id: 'WF-001', name: 'Finanzberichts-Pipeline', type: 'sequential', category: 'GES',
    description: 'Automated financial reporting pipeline from data collection through validation to board presentation.',
    steps: [
      { agentId: 'ANA-001', role: 'Datenaggregation', order: 1 },
      { agentId: 'GES-003', role: 'Buchhaltungspruefung', order: 2 },
      { agentId: 'GES-001', role: 'Berichtsgenerierung', order: 3 },
      { agentId: 'LEG-002', role: 'Compliance-Check', order: 4 },
    ],
    usageCount: 234, successRate: 98.7, avgExecutionTime: '8m 42s',
    creator: 'USR-001', sharedWith: ['USR-002', 'USR-003', 'USR-004'], isTemplate: true,
    createdAt: '2024-09-15T10:00:00Z', tags: ['finance', 'reporting', 'board'],
  },
  {
    id: 'WF-002', name: 'Content-Produktionsfluss', type: 'parallel', category: 'MKT',
    description: 'Parallel content creation pipeline producing blog, social, and email assets simultaneously.',
    steps: [
      { agentId: 'CRE-002', role: 'Copywriting', order: 1 },
      { agentId: 'CRE-001', role: 'Visual Design', order: 1 },
      { agentId: 'MKT-003', role: 'Content Adaptation', order: 1 },
      { agentId: 'MKT-001', role: 'Campaign Integration', order: 2 },
    ],
    usageCount: 567, successRate: 95.3, avgExecutionTime: '12m 18s',
    creator: 'USR-002', sharedWith: ['USR-001', 'USR-005'], isTemplate: true,
    createdAt: '2024-10-01T08:30:00Z', tags: ['content', 'marketing', 'parallel'],
  },
  {
    id: 'WF-003', name: 'Code Review & Deploy', type: 'sequential', category: 'DEV',
    description: 'End-to-end code review, testing, security scanning, and deployment automation.',
    steps: [
      { agentId: 'DEV-003', role: 'Test Generation', order: 1 },
      { agentId: 'DEV-001', role: 'Code Review', order: 2 },
      { agentId: 'LEG-003', role: 'License Check', order: 3 },
      { agentId: 'SYS-003', role: 'Security Scan', order: 4 },
      { agentId: 'DEV-002', role: 'Deployment', order: 5 },
    ],
    usageCount: 1234, successRate: 97.8, avgExecutionTime: '4m 56s',
    creator: 'USR-001', sharedWith: ['USR-002', 'USR-003', 'USR-004', 'USR-005', 'USR-006'], isTemplate: true,
    createdAt: '2024-08-20T09:00:00Z', tags: ['devops', 'cicd', 'deployment'],
  },
  {
    id: 'WF-004', name: 'Kundensupport Eskalation', type: 'hierarchical', category: 'OPS',
    description: 'Hierarchical support escalation from L1 triage through L3 engineering to resolution.',
    steps: [
      { agentId: 'OPS-001', role: 'L1 Triage', order: 1 },
      { agentId: 'OPS-002', role: 'L2 Diagnosis', order: 2 },
      { agentId: 'SYS-001', role: 'L3 Engineering', order: 3 },
      { agentId: 'SYS-003', role: 'Security Review', order: 4 },
    ],
    usageCount: 892, successRate: 94.2, avgExecutionTime: '15m 33s',
    creator: 'USR-003', sharedWith: ['USR-001', 'USR-004'], isTemplate: false,
    createdAt: '2024-11-10T11:00:00Z', tags: ['support', 'escalation', 'incident'],
  },
  {
    id: 'WF-005', name: 'Forseti-Review Debatte', type: 'debate', category: 'LEG',
    description: 'Structured debate workflow for reviewing high-stakes compliance decisions with multi-perspective analysis.',
    steps: [
      { agentId: 'LEG-001', role: 'Vorsitz', order: 1 },
      { agentId: 'LEG-002', role: 'Compliance-Argument', order: 2 },
      { agentId: 'ECO-001', role: 'Wirtschafts-Argument', order: 3 },
      { agentId: 'SYS-003', role: 'Technik-Argument', order: 4 },
      { agentId: 'LEG-001', role: 'Entscheidung', order: 5 },
    ],
    usageCount: 145, successRate: 99.1, avgExecutionTime: '22m 15s',
    creator: 'USR-001', sharedWith: ['USR-002', 'USR-003'], isTemplate: true,
    createdAt: '2024-12-01T14:00:00Z', tags: ['compliance', 'debate', 'governance'],
  },
  {
    id: 'WF-006', name: 'Produktionsoptimierung', type: 'sequential', category: 'PRO',
    description: 'Lean production optimization workflow analyzing bottlenecks and proposing improvements.',
    steps: [
      { agentId: 'PRO-001', role: 'Datenerfassung', order: 1 },
      { agentId: 'ANA-001', role: 'Engpassanalyse', order: 2 },
      { agentId: 'PRO-002', role: 'Qualitaetspruefung', order: 3 },
      { agentId: 'PRO-001', role: 'Implementierung', order: 4 },
    ],
    usageCount: 345, successRate: 96.8, avgExecutionTime: '18m 42s',
    creator: 'USR-004', sharedWith: ['USR-001'], isTemplate: false,
    createdAt: '2024-10-15T07:30:00Z', tags: ['production', 'lean', 'optimization'],
  },
  {
    id: 'WF-007', name: 'Marktanalyse Workflow', type: 'parallel', category: 'ANA',
    description: 'Comprehensive market analysis gathering data from multiple sources simultaneously.',
    steps: [
      { agentId: 'ECO-002', role: 'Marktdaten', order: 1 },
      { agentId: 'ANA-002', role: 'Trendanalyse', order: 1 },
      { agentId: 'MKT-002', role: 'Wettbewerbsanalyse', order: 1 },
      { agentId: 'ANA-001', role: 'Synthese', order: 2 },
    ],
    usageCount: 278, successRate: 97.5, avgExecutionTime: '11m 22s',
    creator: 'USR-002', sharedWith: ['USR-001', 'USR-005'], isTemplate: true,
    createdAt: '2024-09-25T13:00:00Z', tags: ['market', 'analysis', 'research'],
  },
  {
    id: 'WF-008', name: 'Startup Due Diligence', type: 'sequential', category: 'ENT',
    description: 'Due diligence workflow for evaluating startup investment opportunities across financial, legal, and technical dimensions.',
    steps: [
      { agentId: 'ENT-001', role: 'Pitch Analyse', order: 1 },
      { agentId: 'ECO-001', role: 'Marktmodell', order: 2 },
      { agentId: 'LEG-001', role: 'Rechtspruefung', order: 3 },
      { agentId: 'ANA-001', role: 'Finanzmodell', order: 4 },
    ],
    usageCount: 89, successRate: 92.1, avgExecutionTime: '25m 48s',
    creator: 'USR-001', sharedWith: ['USR-003'], isTemplate: false,
    createdAt: '2024-11-20T10:00:00Z', tags: ['startup', 'duediligence', 'investment'],
  },
  {
    id: 'WF-009', name: 'Klinischer Entscheidungsprozess', type: 'hierarchical', category: 'MED',
    description: 'Hierarchical clinical decision support workflow with specialist consultation and evidence review.',
    steps: [
      { agentId: 'MED-001', role: 'Initialdiagnose', order: 1 },
      { agentId: 'MED-003', role: 'Spezialistenmeinung', order: 2 },
      { agentId: 'MED-002', role: 'Datenabgleich', order: 3 },
      { agentId: 'MED-001', role: 'Behandlungsplan', order: 4 },
    ],
    usageCount: 456, successRate: 98.4, avgExecutionTime: '14m 10s',
    creator: 'USR-005', sharedWith: ['USR-001', 'USR-006'], isTemplate: true,
    createdAt: '2024-12-10T09:00:00Z', tags: ['clinical', 'decision', 'healthcare'],
  },
  {
    id: 'WF-010', name: 'Sicherheitsaudit Workflow', type: 'sequential', category: 'SYS',
    description: 'Comprehensive security audit scanning all systems and generating compliance reports.',
    steps: [
      { agentId: 'SYS-003', role: 'Schwachstellen-Scan', order: 1 },
      { agentId: 'OPS-002', role: 'Log-Analyse', order: 2 },
      { agentId: 'LEG-002', role: 'Compliance-Pruefung', order: 3 },
      { agentId: 'SYS-001', role: 'Berichterstellung', order: 4 },
    ],
    usageCount: 567, successRate: 99.3, avgExecutionTime: '32m 05s',
    creator: 'USR-003', sharedWith: ['USR-001', 'USR-002', 'USR-004'], isTemplate: true,
    createdAt: '2024-08-05T08:00:00Z', tags: ['security', 'audit', 'compliance'],
  },
  {
    id: 'WF-011', name: 'Kreativ-Brainstorming', type: 'debate', category: 'CRE',
    description: 'Structured creative debate generating innovative campaign and product ideas through adversarial collaboration.',
    steps: [
      { agentId: 'CRE-001', role: 'Visueller Vorschlag', order: 1 },
      { agentId: 'CRE-002', role: 'Narrativer Vorschlag', order: 2 },
      { agentId: 'ENT-002', role: 'Innovations-Argument', order: 3 },
      { agentId: 'MKT-001', role: 'Markt-Validierung', order: 4 },
      { agentId: 'CRE-001', role: 'Synthese', order: 5 },
    ],
    usageCount: 198, successRate: 89.4, avgExecutionTime: '19m 28s',
    creator: 'USR-002', sharedWith: ['USR-001'], isTemplate: false,
    createdAt: '2024-10-28T15:00:00Z', tags: ['creative', 'brainstorming', 'innovation'],
  },
  {
    id: 'WF-012', name: 'Forschungsdaten-Pipeline', type: 'sequential', category: 'RES',
    description: 'Research data processing pipeline from collection to publication-ready analysis and visualization.',
    steps: [
      { agentId: 'RES-003', role: 'Datenerfassung', order: 1 },
      { agentId: 'ANA-001', role: 'Statistische Analyse', order: 2 },
      { agentId: 'RES-001', role: 'Interpretation', order: 3 },
      { agentId: 'RES-002', role: 'Visualisierung', order: 4 },
    ],
    usageCount: 234, successRate: 96.2, avgExecutionTime: '21m 15s',
    creator: 'USR-005', sharedWith: ['USR-001', 'USR-006'], isTemplate: true,
    createdAt: '2024-11-05T11:30:00Z', tags: ['research', 'data', 'pipeline'],
  },
  {
    id: 'WF-013', name: 'E-Commerce A/B Test', type: 'parallel', category: 'ETR',
    description: 'Parallel A/B testing workflow for e-commerce optimization experiments with statistical validation.',
    steps: [
      { agentId: 'ETR-001', role: 'Variante A', order: 1 },
      { agentId: 'MKT-001', role: 'Variante B', order: 1 },
      { agentId: 'ANA-001', role: 'Ergebnisanalyse', order: 2 },
      { agentId: 'ETR-002', role: 'Implementierung', order: 3 },
    ],
    usageCount: 412, successRate: 95.7, avgExecutionTime: '9m 48s',
    creator: 'USR-004', sharedWith: ['USR-001', 'USR-002'], isTemplate: false,
    createdAt: '2024-09-30T10:00:00Z', tags: ['e-commerce', 'AB-test', 'optimization'],
  },
  {
    id: 'WF-014', name: 'Bildungskurs Erstellung', type: 'sequential', category: 'SCH',
    description: 'Educational course creation workflow from curriculum design to assessment and LMS deployment.',
    steps: [
      { agentId: 'SCH-001', role: 'Curriculum Design', order: 1 },
      { agentId: 'CRE-002', role: 'Inhaltserstellung', order: 2 },
      { agentId: 'SCH-002', role: 'Assessment Design', order: 3 },
      { agentId: 'SCH-003', role: 'Wissensintegration', order: 4 },
    ],
    usageCount: 156, successRate: 94.9, avgExecutionTime: '28m 36s',
    creator: 'USR-006', sharedWith: ['USR-001'], isTemplate: true,
    createdAt: '2024-12-15T08:00:00Z', tags: ['education', 'course', 'curriculum'],
  },
  {
    id: 'WF-015', name: 'Notfall-Response Workflow', type: 'hierarchical', category: 'OPS',
    description: 'Emergency incident response with automated escalation and team coordination for critical system failures.',
    steps: [
      { agentId: 'OPS-001', role: 'Erkennung', order: 1 },
      { agentId: 'SYS-003', role: 'Isolierung', order: 2 },
      { agentId: 'SYS-001', role: 'Behebung', order: 3 },
      { agentId: 'OPS-002', role: 'Post-Mortem', order: 4 },
    ],
    usageCount: 67, successRate: 98.5, avgExecutionTime: '5m 12s',
    creator: 'USR-003', sharedWith: ['USR-001', 'USR-002', 'USR-004', 'USR-005', 'USR-006'], isTemplate: true,
    createdAt: '2024-07-20T00:00:00Z', tags: ['emergency', 'incident', 'response'],
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// 5. WORKFLOW INSTANCES — 12 instances
// ───────────────────────────────────────────────────────────────────────────────

export const workflowInstances: WorkflowInstance[] = [
  { id: 'WI-001', definitionId: 'WF-001', status: 'running', currentStep: 3, progress: 72, startedAt: '2025-06-17T13:00:00Z', assignedAgents: ['ANA-001', 'GES-003', 'GES-001', 'LEG-002'], output: 'Berichtsentwurf wird generiert...' },
  { id: 'WI-002', definitionId: 'WF-003', status: 'completed', currentStep: 5, progress: 100, startedAt: '2025-06-17T12:30:00Z', completedAt: '2025-06-17T12:35:00Z', assignedAgents: ['DEV-003', 'DEV-001', 'LEG-003', 'SYS-003', 'DEV-002'], output: 'Deployment erfolgreich. API v3.2.1 live auf Production.' },
  { id: 'WI-003', definitionId: 'WF-002', status: 'running', currentStep: 2, progress: 45, startedAt: '2025-06-17T13:15:00Z', assignedAgents: ['CRE-002', 'CRE-001', 'MKT-003', 'MKT-001'], output: 'Social-Media-Grafiken und Blog-Content werden parallel erstellt...' },
  { id: 'WI-004', definitionId: 'WF-010', status: 'running', currentStep: 1, progress: 18, startedAt: '2025-06-17T14:00:00Z', assignedAgents: ['SYS-003', 'OPS-002', 'LEG-002', 'SYS-001'], output: 'Schwachstellen-Scan laeuft... 23% abgeschlossen, 2 moderate CVEs vorlaeufig identifiziert.' },
  { id: 'WI-005', definitionId: 'WF-015', status: 'completed', currentStep: 4, progress: 100, startedAt: '2025-06-17T11:00:00Z', completedAt: '2025-06-17T11:08:00Z', assignedAgents: ['OPS-001', 'SYS-003', 'SYS-001', 'OPS-002'], output: 'Incident #4022 resolved. Root cause: memory leak in payment-svc v2.1.3. Patch deployed.' },
  { id: 'WI-006', definitionId: 'WF-007', status: 'pending', currentStep: 0, progress: 0, startedAt: '2025-06-17T15:00:00Z', assignedAgents: ['ECO-002', 'ANA-002', 'MKT-002', 'ANA-001'], output: undefined },
  { id: 'WI-007', definitionId: 'WF-005', status: 'running', currentStep: 3, progress: 60, startedAt: '2025-06-17T12:00:00Z', assignedAgents: ['LEG-001', 'LEG-002', 'ECO-001', 'SYS-003'], output: 'Debatte: Wirtschafts- vs. Compliance-Position zu Datenverarbeitung in Drittlaendern.' },
  { id: 'WI-008', definitionId: 'WF-004', status: 'failed', currentStep: 2, progress: 45, startedAt: '2025-06-17T10:00:00Z', assignedAgents: ['OPS-001', 'OPS-002', 'SYS-001', 'SYS-003'], output: 'Fehler: Eskalation an L3 nicht moeglich — SYS-001 Wartungsfenster. Manuelle Eskalation erforderlich.' },
  { id: 'WI-009', definitionId: 'WF-012', status: 'running', currentStep: 2, progress: 55, startedAt: '2025-06-17T13:30:00Z', assignedAgents: ['RES-003', 'ANA-001', 'RES-001', 'RES-002'], output: 'Statistische Analyse laeuft... ETA 8 Minuten. 2.847 Datenpunkte verarbeitet.' },
  { id: 'WI-010', definitionId: 'WF-009', status: 'completed', currentStep: 4, progress: 100, startedAt: '2025-06-17T11:30:00Z', completedAt: '2025-06-17T11:47:00Z', assignedAgents: ['MED-001', 'MED-003', 'MED-002'], output: 'Behandlungsplan generiert. Patient-ID: 28471. Empfohlene Therapie: Immuntherapie Kombination.' },
  { id: 'WI-011', definitionId: 'WF-013', status: 'running', currentStep: 1, progress: 30, startedAt: '2025-06-17T14:15:00Z', assignedAgents: ['ETR-001', 'MKT-001', 'ANA-001', 'ETR-002'], output: 'Variante A & B werden parallel getestet... aktive Nutzer: 12.847 (A) vs. 12.903 (B).' },
  { id: 'WI-012', definitionId: 'WF-006', status: 'pending', currentStep: 0, progress: 0, startedAt: '2025-06-17T15:30:00Z', assignedAgents: ['PRO-001', 'ANA-001', 'PRO-002'], output: undefined },
];


// ───────────────────────────────────────────────────────────────────────────────
// 6. COLLABORATION DATA — 5 patterns
// ───────────────────────────────────────────────────────────────────────────────

export const collaborationData: CollaborationPattern[] = [
  {
    id: 'COL-001', name: 'Sequential Delegation',
    description: 'Tasks flow sequentially through a chain of specialists, each building on the previous output. Ideal for document creation, multi-stage analysis, and approval workflows.',
    participatingAgents: ['LEG-001', 'ANA-001', 'GES-001', 'CRE-002'],
    coordinatorAgentId: 'GES-001', status: 'active',
    messages: [
      { agentId: 'LEG-001', content: 'Vertragsrahmen geprueft. Klauseln 3.2 und 7.1 erfordern Revision wg. neuer DSGVO-Anforderungen.', timestamp: '2025-06-17T13:00:00Z', type: 'analysis' },
      { agentId: 'ANA-001', content: 'Risikoanalyse abgeschlossen. Wahrscheinlichkeit regulatorischer Ablehnung: 23% -> 8% nach Revision.', timestamp: '2025-06-17T13:15:00Z', type: 'analysis' },
      { agentId: 'GES-001', content: 'Geschaeftliche Bewertung: Kosten-Nutzen-Verhaeltnis positiv bei 12-monatiger Amortisation. ROI projiziert: 340%.', timestamp: '2025-06-17T13:35:00Z', type: 'decision' },
      { agentId: 'CRE-002', content: 'Kommunikationsstrategie entworfen. Stakeholder-Briefing steht bereit mit 3 Varianten.', timestamp: '2025-06-17T13:50:00Z', type: 'text' },
    ],
    artifacts: ['Vertragspruefung-v2.pdf', 'Risikoanalyse-Q2.xlsx', 'Stakeholder-Briefing.md', 'Kommunikationsplan.docx'],
    sessionId: 'SESS-2025-001',
  },
  {
    id: 'COL-002', name: 'Parallel Consultation',
    description: 'Multiple domain experts provide simultaneous input on a complex problem. Results are synthesized by the coordinator into a unified recommendation.',
    participatingAgents: ['ECO-001', 'MED-001', 'SYS-003', 'LEG-002', 'ANA-001'],
    coordinatorAgentId: 'ANA-001', status: 'active',
    messages: [
      { agentId: 'ECO-001', content: 'Makrooekonomische Rahmenbedingungen stabil. Inflationsrate bei 2.1%. Gesundheitsmarkt waechst um 7.3% p.a.', timestamp: '2025-06-17T12:00:00Z', type: 'analysis' },
      { agentId: 'MED-001', content: 'Klinische Daten validiert. Patientenoutcomes uebertreffen Erwartungen um 18% bei Nebenwirkungsrate unter 3%.', timestamp: '2025-06-17T12:05:00Z', type: 'analysis' },
      { agentId: 'SYS-003', content: 'Sicherheitsbewertung: Keine kritischen Schwachstellen identifiziert. Datenverschluesselung entspricht AES-256 Standard.', timestamp: '2025-06-17T12:10:00Z', type: 'analysis' },
      { agentId: 'LEG-002', content: 'Regulatorische Pruefung: Produktzulassung steht unmittelbar bevor. CE-Kennzeichnung voraussichtlich Q3.', timestamp: '2025-06-17T12:15:00Z', type: 'analysis' },
      { agentId: 'ANA-001', content: 'SYNTHESIS: GO-EMPFEHLUNG fuer Markteintritt. Alle Dimensionen gruen. Risiko-Score: 0.12/10.', timestamp: '2025-06-17T12:25:00Z', type: 'decision' },
    ],
    artifacts: ['Markteintrittsanalyse-v3.pdf', 'Sicherheitsreport-Q2.pdf', 'Regulatorische-Freigabe.pdf', 'Klinische-Zusammenfassung.docx'],
    sessionId: 'SESS-2025-002',
  },
  {
    id: 'COL-003', name: 'Iterative Refinement',
    description: 'Repeated cycles of generation, review, and improvement until quality threshold is met. Used for code, designs, and critical documents requiring high precision.',
    participatingAgents: ['DEV-001', 'DEV-003', 'PRO-002', 'CRE-001'],
    coordinatorAgentId: 'DEV-001', status: 'active',
    messages: [
      { agentId: 'DEV-001', content: 'Code-Review Runde 4: 97.4% Coverage erreicht. Verbleibende 2 Issues in auth-middleware behoben.', timestamp: '2025-06-17T11:00:00Z', type: 'code' },
      { agentId: 'DEV-003', content: 'Testergebnisse: Alle 431 Tests bestanden. Performance-Regression nicht feststellbar. Latenz < 120ms p95.', timestamp: '2025-06-17T11:10:00Z', type: 'analysis' },
      { agentId: 'PRO-002', content: 'QA-Sign-off erteilt. Qualitaetsmetriken uebersteigen Schwellenwert um 15%. Zero critical defects.', timestamp: '2025-06-17T11:20:00Z', type: 'decision' },
      { agentId: 'CRE-001', content: 'Dokumentationsdesign finalisiert. API-Docs entsprechen Brand-Standards. Dark-mode Support hinzugefuegt.', timestamp: '2025-06-17T11:30:00Z', type: 'text' },
      { agentId: 'DEV-001', content: 'FINAL APPROVAL. Alle Qualitaetskriterien erfuellt. Bereit fuer Deployment in Produktion.', timestamp: '2025-06-17T11:35:00Z', type: 'decision' },
    ],
    artifacts: ['Source-Code-v3.2.1.zip', 'Testreport-431.pdf', 'API-Dokumentation.html', 'CHANGELOG.md'],
    sessionId: 'SESS-2025-003',
  },
  {
    id: 'COL-004', name: 'Expert Panel',
    description: 'A panel of senior experts debate and vote on strategic decisions. Each brings specialized domain knowledge and advocates for their perspective.',
    participatingAgents: ['GES-001', 'ECO-001', 'ENT-001', 'LEG-001', 'SYS-001'],
    coordinatorAgentId: 'GES-001', status: 'completed',
    messages: [
      { agentId: 'ENT-001', content: 'Innovationspipeline bewertet. Drei Produkte mit Series-A-Potenzial identifiziert. Marktfit validiert.', timestamp: '2025-06-17T10:00:00Z', type: 'analysis' },
      { agentId: 'ECO-001', content: 'Wirtschaftsindikatoren: SaaS-Markt waechst um 28% p.a. in DACH-Region. Wettbewerbsintensitaet moderat.', timestamp: '2025-06-17T10:10:00Z', type: 'analysis' },
      { agentId: 'LEG-001', content: 'IP-Rechtliche Pruefung: Keine Konflikte mit bestehenden Patenten feststellbar. Markenanmeldung empfohlen.', timestamp: '2025-06-17T10:20:00Z', type: 'analysis' },
      { agentId: 'SYS-001', content: 'Technische Machbarkeit bestaetigt. Architektur skaliert linear bis 10M Nutzer. Cloud-Kosten: EUR 0.08/Nutzer/Monat.', timestamp: '2025-06-17T10:30:00Z', type: 'analysis' },
      { agentId: 'GES-001', content: 'ABSTIMMUNGSERGEBNIS: EINSTIMMIG fuer Investition in Produkt Alpha. Budget: EUR 2.4M ueber 18 Monate.', timestamp: '2025-06-17T10:45:00Z', type: 'decision' },
    ],
    artifacts: ['Investitionsbeschluss-Alpha.pdf', 'Due-Diligence-Report.pdf', 'Budgetplan-v2.xlsx', 'Technische-Architektur.pdf'],
    sessionId: 'SESS-2025-004',
  },
  {
    id: 'COL-005', name: 'Hierarchical Escalation',
    description: 'Issues escalate through organizational levels until resolved. Each tier has broader authority and resources. Used for incidents and critical failures.',
    participatingAgents: ['OPS-001', 'OPS-002', 'SYS-001', 'SYS-003', 'GES-001'],
    coordinatorAgentId: 'OPS-001', status: 'active',
    messages: [
      { agentId: 'OPS-001', content: 'ALERT: API-Latenz ueber 500ms fuer 3 Minuten in Zone eu-west-1. Eskalation zu L2.', timestamp: '2025-06-17T14:00:00Z', type: 'alert' },
      { agentId: 'OPS-002', content: 'Diagnose: Datenbank-Connection-Pool erschoepft. 47/50 aktive Verbindungen. Slow queries identifiziert.', timestamp: '2025-06-17T14:05:00Z', type: 'analysis' },
      { agentId: 'SYS-001', content: 'Pool-Limit erhoeht auf 120. Auto-Scaling aktiviert. Read-Replica fuer Reporting-Queries konfiguriert.', timestamp: '2025-06-17T14:10:00Z', type: 'code' },
      { agentId: 'SYS-003', content: 'Sicherheitspruefung: Kein Angriffsmuster erkannt. Ressourcen-Engpass durch Batch-Job verursacht.', timestamp: '2025-06-17T14:12:00Z', type: 'analysis' },
      { agentId: 'OPS-001', content: 'RESOLVED: Latenz unter 200ms stabilisiert. Post-Mortem wird erstellt. Batch-Job auf Nacht verschoben.', timestamp: '2025-06-17T14:18:00Z', type: 'decision' },
    ],
    artifacts: ['Incident-Report-4022.pdf', 'Post-Mortem.md', 'Runbook-Update.patch', 'Batch-Job-Schedule.xlsx'],
    sessionId: 'SESS-2025-005',
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// 7. ACTIVITY FEED DATA — 20 events
// ───────────────────────────────────────────────────────────────────────────────

export const activityFeedData: ActivityEvent[] = [
  { id: 'EVT-001', type: 'workflow', agentId: 'DEV-001', agentName: 'CodeGen Weber', action: 'completed deployment of', target: 'API Gateway v3.2.1', targetId: 'TSK-010', timestamp: '2025-06-17T14:58:00Z', severity: 'low', details: 'Zero-downtime deployment successful. All 47 health checks passed. P95 latency: 118ms.' },
  { id: 'EVT-002', type: 'agent', agentId: 'ANA-001', agentName: 'Schmidt Analytik', action: 'generated market forecast report', target: 'Q3-2025 Ausblick DACH', targetId: 'TSK-002', timestamp: '2025-06-17T14:55:00Z', severity: 'low', details: 'Report includes DAX, S&P 500, Nikkei, and STOXX Europe 600 projections with 95% confidence intervals.' },
  { id: 'EVT-003', type: 'system', agentName: 'System', action: 'triggered auto-scaling for', target: 'Database Cluster', timestamp: '2025-06-17T14:52:00Z', severity: 'medium', details: 'Connection pool exhausted (47/50). Auto-scaled from 3 to 5 instances. Replication lag: < 1s.' },
  { id: 'EVT-004', type: 'workflow', agentId: 'OPS-001', agentName: 'RunFriedrich', action: 'resolved incident', target: '#4022 API Latenz-Spike', targetId: 'WI-005', timestamp: '2025-06-17T14:45:00Z', severity: 'high', details: 'Root cause: connection pool depletion by analytics batch job. Mitigation: pool limit increased, job rescheduled to 02:00 UTC.' },
  { id: 'EVT-005', type: 'agent', agentId: 'GES-003', agentName: 'Weber Controlling', action: 'submitted Q2 financial report for', target: 'Board Review', targetId: 'TSK-001', timestamp: '2025-06-17T14:32:00Z', severity: 'low', details: 'Revenue: EUR 48.7M (+15% YoY). EBITDA margin: 25.3%. Free cash flow: EUR 9.2M.' },
  { id: 'EVT-006', type: 'agent', agentId: 'CRE-002', agentName: 'TextLehmann', action: 'published content for', target: 'Q3 Marketing Campaign', targetId: 'TSK-003', timestamp: '2025-06-17T14:28:00Z', severity: 'low', details: '15 social posts, 4 blog articles, 2 email sequences, and 1 whitepaper generated and approved.' },
  { id: 'EVT-007', type: 'security', agentId: 'SYS-003', agentName: 'SecHofmann', action: 'detected anomaly in', target: 'Payment Service', timestamp: '2025-06-17T14:20:00Z', severity: 'critical', details: 'Unusual traffic pattern from IP 185.220.101.xx — 847 requests/min. Kill-switch armed. Investigation active.' },
  { id: 'EVT-008', type: 'workflow', agentId: 'PRO-001', agentName: 'Bauer Fertigung', action: 'optimized production line', target: 'Linie A Durchsatz +15%', targetId: 'TSK-004', timestamp: '2025-06-17T14:15:00Z', severity: 'low', details: 'Lean analysis complete. Bottleneck removed at station 3. OEE improved from 72% to 87%.' },
  { id: 'EVT-009', type: 'agent', agentId: 'MED-001', agentName: 'DocMueller', action: 'completed clinical analysis for', target: 'Study PH-28471', targetId: 'TSK-022', timestamp: '2025-06-17T14:10:00Z', severity: 'medium', details: 'Phase II results positive. p-value < 0.01 for primary endpoint. ORR: 68% vs. 41% control.' },
  { id: 'EVT-010', type: 'comment', agentName: 'Herrmann Verwaltung', action: 'commented on', target: 'Investitionsbeschluss Alpha', timestamp: '2025-06-17T14:05:00Z', severity: 'low', details: 'Empfohlene Budgeterhoehung auf EUR 2.8M fuer erweiterten Marktanteil in Nordamerika.' },
  { id: 'EVT-011', type: 'system', agentName: 'System', action: 'scheduled maintenance window', target: '2025-06-19 02:00 UTC', timestamp: '2025-06-17T14:00:00Z', severity: 'medium', details: 'Planned DB upgrade to SQLite 3.48. Expected downtime: 12 minutes. WAL checkpoint enforced.' },
  { id: 'EVT-012', type: 'agent', agentId: 'LEG-002', agentName: 'ComplianceKlein', action: 'completed GDPR audit for', target: 'Analytics Module', targetId: 'TSK-015', timestamp: '2025-06-17T13:50:00Z', severity: 'low', details: '3 minor findings documented. Remediation plan created with 14-day timeline. No critical gaps.' },
  { id: 'EVT-013', type: 'workflow', agentId: 'ETR-001', agentName: 'Meyer Handel', action: 'identified conversion drop in', target: 'Checkout Flow v2.1', targetId: 'TSK-006', timestamp: '2025-06-17T13:45:00Z', severity: 'high', details: 'Conversion rate dropped from 3.2% to 2.1% since June 12. Mobile checkout affected most (-34%).' },
  { id: 'EVT-014', type: 'agent', agentId: 'ENT-001', agentName: 'Hofmann Venture', action: 'reviewed pitch deck for', target: 'Startup NanoGrid', targetId: 'TSK-005', timestamp: '2025-06-17T13:30:00Z', severity: 'low', details: 'Due diligence complete. Recommended for seed investment. TAM: EUR 2.1B. Strong team fit.' },
  { id: 'EVT-015', type: 'security', agentId: 'SYS-003', agentName: 'SecHofmann', action: 'rotated API keys for', target: 'External Integrations', timestamp: '2025-06-17T13:00:00Z', severity: 'medium', details: 'Scheduled key rotation completed. 52 integrations updated. Zero downtime. Old keys expired.' },
  { id: 'EVT-016', type: 'workflow', agentId: 'SCH-001', agentName: 'Koch Bildung', action: 'published learning module', target: 'KI-Grundlagen Kurs v2', targetId: 'TSK-008', timestamp: '2025-06-17T12:45:00Z', severity: 'low', details: 'Module includes 14 lessons, 4 quizzes, 1 final project, and hands-on labs. 340 enrollments in first hour.' },
  { id: 'EVT-017', type: 'agent', agentId: 'ECO-001', agentName: 'Berger Makro', action: 'updated inflation forecast', target: '2.1% (vorher 2.4%)', targetId: 'TSK-009', timestamp: '2025-06-17T12:30:00Z', severity: 'low', details: 'ECB rate cut expectations and falling energy prices drive revision. Core inflation stable at 2.3%.' },
  { id: 'EVT-018', type: 'security', agentName: 'System', action: 'blocked suspicious login from', target: 'IP 91.203.164.xx', timestamp: '2025-06-17T12:15:00Z', severity: 'high', details: 'Brute-force attempt detected: 28 failed logins in 4 minutes. IP auto-blocked for 24h. MFA enforced.' },
  { id: 'EVT-019', type: 'workflow', agentId: 'CRE-001', agentName: 'KunstSchulz', action: 'submitted brand refresh concept', target: 'Phase 1 Review', targetId: 'TSK-013', timestamp: '2025-06-17T12:00:00Z', severity: 'low', details: '4 color palette options, 3 typography systems, and 2 motion design languages presented.' },
  { id: 'EVT-020', type: 'system', agentName: 'System', action: 'completed daily backup', target: 'all 17 tables, 20 indexes', timestamp: '2025-06-17T02:00:00Z', severity: 'low', details: 'Backup size: 2.7GB. Duration: 52s. Verified with SHA-256. Retention: 30 days. Offsite copy synced.' },
];

// ───────────────────────────────────────────────────────────────────────────────
// 8. SECURITY EVENTS — 15 events
// ───────────────────────────────────────────────────────────────────────────────

export const securityEvents: SecurityEvent[] = [
  { id: 'SEC-001', type: 'anomaly_detection', severity: 'critical', agentId: 'SYS-003', agentName: 'SecHofmann', description: 'Abnormal outbound data transfer detected from payment-service. 847 MB transferred to unknown IP 203.0.113.xx within 4 minutes.', timestamp: '2025-06-17T14:20:00Z', resolved: true, resolution: 'False positive — legitimate batch export to new disaster-recovery site in Frankfurt. Whitelist updated. Alert threshold raised.' },
  { id: 'SEC-002', type: 'failed_login', severity: 'high', agentName: 'System', description: '28 consecutive failed login attempts for user admin@valtheron.ai from IP 91.203.164.45. Geolocation: Bucharest, RO.', timestamp: '2025-06-17T12:15:00Z', resolved: true, resolution: 'IP auto-blocked for 24 hours. Geo-blocking for non-DACH admin access enabled. MFA token rotation enforced.' },
  { id: 'SEC-003', type: 'privilege_escalation', severity: 'critical', agentId: 'DEV-003', agentName: 'TestKlein QA', description: 'Agent TestKlein attempted to access secrets table without authorization. Query: SELECT * FROM secrets WHERE provider = "stripe".', timestamp: '2025-06-17T11:30:00Z', resolved: true, resolution: 'Permission misconfiguration in test environment fixed. Row-level security policy updated. Correct alert triggered.' },
  { id: 'SEC-004', type: 'certificate_expiry', severity: 'medium', agentId: 'SYS-002', agentName: 'NetzBauer', description: 'TLS certificate for api.valtheron.ai expires in 7 days (2025-06-24). Auto-renewal scheduled but not confirmed.', timestamp: '2025-06-17T10:00:00Z', resolved: false, resolution: undefined },
  { id: 'SEC-005', type: 'vulnerability_scan', severity: 'high', agentId: 'SYS-003', agentName: 'SecHofmann', description: 'CVE-2025-21893 detected in dependency better-sqlite3 v11.6.0. CVSS 8.1 — SQL injection via crafted COLLATE clause.', timestamp: '2025-06-17T09:00:00Z', resolved: true, resolution: 'Upgraded to better-sqlite3 v12.1.0. Dependency audit performed. No exploitation evidence found in logs.' },
  { id: 'SEC-006', type: 'kill_switch', severity: 'critical', agentId: 'DEV-003', agentName: 'TestKlein QA', description: 'Kill-switch activated for agent TestKlein QA. Reason: infinite loop in test generation causing 100% CPU for 8 minutes.', timestamp: '2025-06-17T08:45:00Z', resolved: true, resolution: 'Agent terminated safely after state persistence. Test code reviewed. Timeout policy added: max 120s per test batch.' },
  { id: 'SEC-007', type: 'data_access', severity: 'medium', agentId: 'MED-002', agentName: 'HealthBauer', description: 'Agent HealthBauer accessed 23 patient records outside assigned ward Oncology. Ward: Cardiology.', timestamp: '2025-06-17T07:20:00Z', resolved: true, resolution: 'Access logged for audit. Legitimate cross-consultation authorized by Dr. Weber. Scope restrictions documented.' },
  { id: 'SEC-008', type: 'anomaly_detection', severity: 'high', agentId: 'ETR-001', agentName: 'Meyer Handel', description: 'Unusual pricing pattern: 400% markup applied to 47 products within 5 minutes. Estimated revenue impact: EUR 12,000 overcharge.', timestamp: '2025-06-17T06:00:00Z', resolved: true, resolution: 'Pricing algorithm bug in dynamic pricing engine identified and patched. Affected orders refunded. Rollback executed.' },
  { id: 'SEC-009', type: 'api_abuse', severity: 'medium', agentName: 'System', description: 'Rate limit exceeded on /api/v1/agents endpoint by client app-portal. 1,247 req/min (limit: 300). Pattern: enumeration attack.', timestamp: '2025-06-16T22:30:00Z', resolved: true, resolution: 'Client throttled. Added caching layer with 60s TTL. Rate limit adjusted to burst: 500, sustained: 300. API key scoped.' },
  { id: 'SEC-010', type: 'secrets_exposure', severity: 'critical', agentId: 'DEV-002', agentName: 'BuildMueller CI', description: 'API key fragment "sk_live_3x9" detected in CI build log for pipeline #28471. Service: Stripe production.', timestamp: '2025-06-16T20:00:00Z', resolved: true, resolution: 'Key rotated immediately within 3 minutes. Log redaction policy updated. Secret scanning (gitleaks) enabled in CI. 0 unauthorized usage.' },
  { id: 'SEC-011', type: 'privilege_escalation', severity: 'high', agentId: 'ANA-003', agentName: 'Fischer Insights', description: 'Agent Fischer Insights attempted workflow deletion without sufficient certification level. Required: FORSETI_VERIFIED, Current: FIELD_TESTED.', timestamp: '2025-06-16T18:30:00Z', resolved: true, resolution: 'Action blocked by Forseti authorization framework. Certification requirements enforced. Agent notified of policy.' },
  { id: 'SEC-012', type: 'vulnerability_scan', severity: 'medium', agentId: 'SYS-003', agentName: 'SecHofmann', description: 'Medium severity: Open port 6379 (Redis) exposed on production network segment 10.0.3.0/24. Authentication: disabled.', timestamp: '2025-06-16T16:00:00Z', resolved: true, resolution: 'Port closed immediately. Redis bound to localhost with UNIX socket. Firewall rules updated. AUTH password configured.' },
  { id: 'SEC-013', type: 'failed_login', severity: 'low', agentName: 'System', description: '3 failed login attempts for viewer@valtheron.ai. Password reset link sent to registered email.', timestamp: '2025-06-16T14:20:00Z', resolved: true, resolution: 'User successfully reset password. Account access restored. Login history reviewed — no suspicious activity.' },
  { id: 'SEC-014', type: 'data_access', severity: 'high', agentId: 'LEG-003', agentName: 'VertragSimon', description: 'Agent VertragSimon downloaded 284 contracts at 03:00 local time outside normal working hours. Pattern: bulk export.', timestamp: '2025-06-16T03:00:00Z', resolved: true, resolution: 'Authorized batch job for M&A due diligence preparation. Activity documented in audit log. DLP policy exception approved.' },
  { id: 'SEC-015', type: 'certificate_rotation', severity: 'low', agentId: 'SYS-002', agentName: 'NetzBauer', description: 'Root CA certificate LetsEncrypt R3 renewed successfully. Auto-renewal confirmed. Chain validation passed. Expiry: 2025-09-15.', timestamp: '2025-06-16T01:00:00Z', resolved: true, resolution: 'Certificate renewed. OCSP stapling verified. All clients validated new chain successfully.' },
];

// ───────────────────────────────────────────────────────────────────────────────
// 9. AUDIT LOG DATA — 15 entries
// ───────────────────────────────────────────────────────────────────────────────

export const auditLogData: AuditLogEntry[] = [
  { id: 'AUD-001', userId: 'USR-001', username: 'admin.schmidt', action: 'workflow_create', entity: 'workflow', entityId: 'WF-016', details: 'Created new workflow "Datenmigration Pipeline" with 5 steps spanning DEV, SYS, and LEG agents', timestamp: '2025-06-17T14:50:00Z', ip: '10.0.1.15' },
  { id: 'AUD-002', userId: 'USR-003', username: 'ops.mueller', action: 'agent_kill_switch', entity: 'agent', entityId: 'DEV-003', details: 'Activated kill-switch for agent TestKlein QA — infinite loop detected in test generation, CPU 100% for 480s', timestamp: '2025-06-17T14:48:00Z', ip: '10.0.1.23' },
  { id: 'AUD-003', userId: 'USR-002', username: 'editor.weber', action: 'agent_update', entity: 'agent', entityId: 'MKT-001', details: 'Updated personality profile for Schulz Werbung: creativity 0.65 -> 0.80, riskTolerance 0.50 -> 0.65', timestamp: '2025-06-17T14:35:00Z', ip: '10.0.1.18' },
  { id: 'AUD-004', userId: 'USR-001', username: 'admin.schmidt', action: 'user_permission_change', entity: 'user', entityId: 'USR-006', details: 'Changed role from Viewer to Editor for user anna.fischer. Workflows access: 12 shared.', timestamp: '2025-06-17T14:20:00Z', ip: '10.0.1.15' },
  { id: 'AUD-005', userId: 'USR-004', username: 'viewer.krause', action: 'file_download', entity: 'shared_file', entityId: 'FILE-1284', details: 'Downloaded Q2-Financial-Report.pdf (2.7 MB). Page count: 48. Classification: internal.', timestamp: '2025-06-17T13:55:00Z', ip: '10.0.1.42' },
  { id: 'AUD-006', userId: 'USR-005', username: 'research.meyer', action: 'workflow_execute', entity: 'workflow', entityId: 'WF-012', details: 'Started workflow "Forschungsdaten-Pipeline" with agents RES-003, ANA-001, RES-001, RES-002', timestamp: '2025-06-17T13:30:00Z', ip: '10.0.1.55' },
  { id: 'AUD-007', userId: 'USR-001', username: 'admin.schmidt', action: 'secret_rotate', entity: 'secret', entityId: 'SEC-042', details: 'Rotated API key for Stripe integration. Old key invalidated at 2025-06-17T13:00:03Z.', timestamp: '2025-06-17T13:00:00Z', ip: '10.0.1.15' },
  { id: 'AUD-008', userId: 'USR-003', username: 'ops.mueller', action: 'system_config_change', entity: 'system', entityId: 'CFG-001', details: 'Increased DB connection pool from 50 to 80. Reason: pool exhaustion during peak. Applied immediately.', timestamp: '2025-06-17T12:45:00Z', ip: '10.0.1.23' },
  { id: 'AUD-009', userId: 'USR-002', username: 'editor.weber', action: 'collaboration_start', entity: 'collaboration', entityId: 'COL-006', details: 'Initiated Expert Panel session for Product Launch Review with 5 senior agents', timestamp: '2025-06-17T12:30:00Z', ip: '10.0.1.18' },
  { id: 'AUD-010', userId: 'USR-006', username: 'editor.fischer', action: 'notification_read', entity: 'notification', entityId: 'NOT-008', details: 'Marked security alert #SEC-005 as read. CVE-2025-21893 acknowledged.', timestamp: '2025-06-17T12:15:00Z', ip: '10.0.1.60' },
  { id: 'AUD-011', userId: 'USR-001', username: 'admin.schmidt', action: 'database_backup', entity: 'database', entityId: 'DB-001', details: 'Manual backup triggered. Size: 2.7GB. Duration: 52s. SHA-256: a3f7c2... Verified.', timestamp: '2025-06-17T12:00:00Z', ip: '10.0.1.15' },
  { id: 'AUD-012', userId: 'USR-004', username: 'viewer.krause', action: 'agent_query', entity: 'agent', entityId: 'GES-001', details: 'Queried agent status and recent tasks for Herrmann Verwaltung. Results: 3 active tasks.', timestamp: '2025-06-17T11:45:00Z', ip: '10.0.1.42' },
  { id: 'AUD-013', userId: 'USR-005', username: 'research.meyer', action: 'file_upload', entity: 'shared_file', entityId: 'FILE-1285', details: 'Uploaded clinical-data-phase3.csv (18.4 MB, 8,247 rows). Classification: confidential.', timestamp: '2025-06-17T11:30:00Z', ip: '10.0.1.55' },
  { id: 'AUD-014', userId: 'USR-003', username: 'ops.mueller', action: 'security_policy_update', entity: 'security_policy', entityId: 'POL-003', details: 'Updated kill-switch thresholds: max_cpu 85% -> 80%, max_memory 90% -> 85%, max_latency 500ms', timestamp: '2025-06-17T11:00:00Z', ip: '10.0.1.23' },
  { id: 'AUD-015', userId: 'USR-001', username: 'admin.schmidt', action: 'login', entity: 'session', entityId: 'SESS-2847', details: 'Admin login successful. MFA verified (TOTP). Session TTL: 8h. Device: Firefox 128 macOS.', timestamp: '2025-06-17T10:00:00Z', ip: '10.0.1.15' },
];


// ───────────────────────────────────────────────────────────────────────────────
// 10. NOTIFICATIONS DATA — 12 notifications
// ───────────────────────────────────────────────────────────────────────────────

export const notificationsData: Notification[] = [
  { id: 'NOT-001', userId: 'USR-001', type: 'security', title: 'Kritischer Sicherheitsvorfall', message: 'Agent TestKlein QA wurde durch Kill-Switch deaktiviert. Grund: Infinite Loop in Test-Generation, CPU 100% fuer 8 Minuten.', read: false, priority: 'critical', timestamp: '2025-06-17T14:48:00Z', actionUrl: '/security/events/SEC-006' },
  { id: 'NOT-002', userId: 'USR-001', type: 'workflow', title: 'Workflow abgeschlossen', message: 'Code Review & Deploy (WF-003) erfolgreich abgeschlossen. API v3.2.1 ist live. Deployment-Dauer: 4m 56s.', read: false, priority: 'medium', timestamp: '2025-06-17T14:35:00Z', actionUrl: '/workflows/WF-003' },
  { id: 'NOT-003', userId: 'USR-002', type: 'agent', title: 'Agent-Zertifizierung abgeschlossen', message: 'CodeGen Weber (DEV-001) wurde auf CERTIFIED_PROFESSIONAL hochgestuft. Alle Audit-Kriterien erfuellt.', read: true, priority: 'low', timestamp: '2025-06-17T13:00:00Z', actionUrl: '/agents/DEV-001' },
  { id: 'NOT-004', userId: 'USR-003', type: 'system', title: 'Datenbank-Pool-Limit erreicht', message: 'Connection Pool erschoepft (47/50). Auto-Scaling auf 80 aktiviert. Analytics-Batch-Job verursacht Peak.', read: false, priority: 'high', timestamp: '2025-06-17T14:10:00Z', actionUrl: '/system/health' },
  { id: 'NOT-005', userId: 'USR-004', type: 'security', title: 'Rate-Limit ueberschritten', message: 'Client app-portal hat /api/v1/agents mit 1.247 req/min ueberschritten (Limit: 300). Caching aktiviert.', read: true, priority: 'medium', timestamp: '2025-06-17T12:30:00Z', actionUrl: '/security/events/SEC-009' },
  { id: 'NOT-006', userId: 'USR-002', type: 'workflow', title: 'Marktanalyse bereit', message: 'Q3-2025 Marktanalyse (WF-007) ist fertiggestellt. Ergebnisse: DACH SaaS Markt +28% p.a. Verfuegbar in Bibliothek.', read: false, priority: 'high', timestamp: '2025-06-17T12:25:00Z', actionUrl: '/workflows/WF-007' },
  { id: 'NOT-007', userId: 'USR-005', type: 'agent', title: 'Klinische Studie abgeschlossen', message: 'Phase II Analyse fuer Studie PH-28471 abgeschlossen. Positive Ergebnisse: ORR 68% vs. 41% Control (p<0.01).', read: false, priority: 'high', timestamp: '2025-06-17T14:10:00Z', actionUrl: '/tasks/TSK-022' },
  { id: 'NOT-008', userId: 'USR-001', type: 'security', title: 'CVE-2025-21893 erkannt', message: 'Sicherheitsluecke in better-sqlite3 v11.6.0 (CVSS 8.1). Upgrade auf v12.1.0 empfohlen. Keine Exploitation-Evidenz.', read: true, priority: 'critical', timestamp: '2025-06-17T09:00:00Z', actionUrl: '/security/events/SEC-005' },
  { id: 'NOT-009', userId: 'USR-006', type: 'system', title: 'Wartungsfenster in 48h', message: 'Geplantes Upgrade auf SQLite 3.48 am 19.06. um 02:00 UTC. Erwartete Downtime: 12 Min. WAL-Modus: aktiv.', read: true, priority: 'medium', timestamp: '2025-06-17T14:00:00Z', actionUrl: '/system/maintenance' },
  { id: 'NOT-010', userId: 'USR-003', type: 'workflow', title: 'Incident #4022 geloest', message: 'API-Latenz-Anomalie behoben. Durchschnittliche Latenz wieder unter 200ms (aktuell: 142ms). Root Cause dokumentiert.', read: true, priority: 'medium', timestamp: '2025-06-17T14:18:00Z', actionUrl: '/workflows/WF-015' },
  { id: 'NOT-011', userId: 'USR-002', type: 'agent', title: 'Neue Zertifizierung', message: 'BuildMueller CI (DEV-002) hat FORSETI_VERIFIED Zertifizierung bestanden. 5/5 Dimensionen gruen.', read: true, priority: 'low', timestamp: '2025-06-17T11:00:00Z', actionUrl: '/agents/DEV-002' },
  { id: 'NOT-012', userId: 'USR-001', type: 'security', title: 'API-Schluessel-Rotation', message: 'Stripe-Integration API-Key automatisch rotiert. Alter Schluessel um 13:00:03Z invalidiert. 0 Service-Unterbrechungen.', read: true, priority: 'medium', timestamp: '2025-06-17T13:00:00Z', actionUrl: '/security/secrets' },
];

// ───────────────────────────────────────────────────────────────────────────────
// 11. SYSTEM HEALTH DATA — 14 modules + 4 services + 4 LLM providers + DB
// ───────────────────────────────────────────────────────────────────────────────

export const systemHealthData: SystemHealthData = {
  modules: [
    { name: 'auth', status: 'operational', responseTime: 45, uptime: 99.99, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'agents', status: 'operational', responseTime: 120, uptime: 99.97, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'tasks', status: 'operational', responseTime: 85, uptime: 99.95, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'workflows', status: 'operational', responseTime: 156, uptime: 99.92, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'chat', status: 'degraded', responseTime: 340, uptime: 98.45, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'collab', status: 'operational', responseTime: 210, uptime: 99.88, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'security', status: 'operational', responseTime: 67, uptime: 99.99, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'analytics', status: 'operational', responseTime: 180, uptime: 99.91, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'files', status: 'operational', responseTime: 95, uptime: 99.96, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'tree', status: 'operational', responseTime: 72, uptime: 99.98, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'notifications', status: 'operational', responseTime: 55, uptime: 99.99, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'secrets', status: 'operational', responseTime: 38, uptime: 100.0, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'backup', status: 'operational', responseTime: 420, uptime: 99.85, lastChecked: '2025-06-17T14:59:00Z' },
    { name: 'health', status: 'operational', responseTime: 22, uptime: 100.0, lastChecked: '2025-06-17T14:59:00Z' },
  ],
  services: [
    { name: 'encryptionService', status: 'operational', connections: 1284, lastError: undefined },
    { name: 'websocketService', status: 'degraded', connections: 347, lastError: '2025-06-17T14:15:00Z: Connection drop during pool resize. 23 clients disconnected briefly.' },
    { name: 'killSwitchMonitor', status: 'operational', connections: 48, lastError: undefined },
    { name: 'cacheService', status: 'operational', connections: 512, lastError: undefined },
  ],
  llmProviders: [
    { name: 'Anthropic', status: 'operational', requestsPerMin: 1247, avgLatency: 234, errorRate: 0.12, activeConnections: 89 },
    { name: 'OpenAI', status: 'operational', requestsPerMin: 892, avgLatency: 189, errorRate: 0.08, activeConnections: 67 },
    { name: 'Ollama', status: 'degraded', requestsPerMin: 156, avgLatency: 1240, errorRate: 2.4, activeConnections: 12 },
    { name: 'Custom', status: 'operational', requestsPerMin: 78, avgLatency: 456, errorRate: 0.45, activeConnections: 8 },
  ],
  database: {
    type: 'SQLite',
    version: '3.48.0',
    tables: 17,
    indexes: 20,
    walMode: true,
    cacheHitRate: 96.7,
    connections: 47,
    transactionsPerSec: 234,
    replicationStatus: 'async_slave_synced',
    sizeMB: 2684,
    maxConnections: 80,
  },
};

// ───────────────────────────────────────────────────────────────────────────────
// 12. METRICS DATA — 16 KPI metrics
// ───────────────────────────────────────────────────────────────────────────────

export const metricsData: MetricsData = {
  totalAgents: 291,
  activeAgents: 189,
  idleAgents: 58,
  busyAgents: 29,
  offlineAgents: 15,
  tasksCompleted: 1847,
  tasksInProgress: 12,
  avgResponseTime: 142,
  errorRate: 0.23,
  cpuUsage: 67.4,
  memoryUsage: 78.2,
  diskUsage: 54.1,
  networkThroughput: 234.5,
  wsConnections: 347,
  dbQueryRate: 2340,
  requestsPerMin: 2847,
};

// ───────────────────────────────────────────────────────────────────────────────
// 13. CERTIFICATION DATA — 6 levels with counts
// ───────────────────────────────────────────────────────────────────────────────

export const certificationData: CertificationLevel[] = [
  {
    level: 'UNCERTIFIED',
    count: 24,
    color: '#9CA3AF',
    requirements: 'Neu registriert, keine Pruefung abgelegt. Basisfunktionalitaet eingeschraenkt.',
    avgTime: '0 Tage',
    percentage: 8.2,
  },
  {
    level: 'TECHNICAL_VALID',
    count: 67,
    color: '#60A5FA',
    requirements: 'Technische Validierung bestanden: API-Integration, Output-Qualitaet, Error-Handling, Timeout-Verhalten.',
    avgTime: '3-5 Tage',
    percentage: 23.0,
  },
  {
    level: 'FORSETI_VERIFIED',
    count: 89,
    color: '#3DDC97',
    requirements: 'Forseti-Framework Bewertung: 5 Dimensionen bestanden (InformationAccess, ResourceControl, AuthorityPermission, NetworkPosition, SynthesisApplication).',
    avgTime: '7-14 Tage',
    percentage: 30.6,
  },
  {
    level: 'EXPERT_REVIEWED',
    count: 62,
    color: '#F5A623',
    requirements: 'Manuelles Review durch Domain-Experten mit Peer-Validation und hands-on Test in Staging-Umgebung.',
    avgTime: '14-21 Tage',
    percentage: 21.3,
  },
  {
    level: 'FIELD_TESTED',
    count: 32,
    color: '#A78BFA',
    requirements: 'Mindestens 500 erfolgreiche Einsaetze in Produktionsumgebung mit >95% Erfolgsrate und positive Nutzerfeedback.',
    avgTime: '30-60 Tage',
    percentage: 11.0,
  },
  {
    level: 'CERTIFIED_PROFESSIONAL',
    count: 17,
    color: '#EF4444',
    requirements: 'Vollstaendige Zertifizierung: Alle vorherigen Stufen + Kontinuierliches Monitoring + Jaehrliches Re-Zertifizierungs-Audit + 99%+ Erfolgsrate.',
    avgTime: '90-120 Tage',
    percentage: 5.8,
  },
];


// ───────────────────────────────────────────────────────────────────────────────
// 14. PERSONALITY DATA — 8 archetypes with 12-parameter profiles
// ───────────────────────────────────────────────────────────────────────────────

export const personalityData: PersonalityArchetype[] = [
  {
    name: 'Visionary',
    description: 'Sieht die grosse Vision und verbindet scheinbar unvereinbare Konzepte zu bahnbrechenden Ideen. Orientiert sich an Zukunftsmoeglichkeiten statt gegenwaertigen Einschraenkungen. Triggert Innovation durch kognitive Dissonanz.',
    traits: {
      formality: 0.4, creativity: 0.95, assertiveness: 0.8, empathy: 0.6, detailOrientation: 0.3,
      riskTolerance: 0.9, humor: 0.5, technicalDepth: 0.6, pace: 0.7, verbosity: 0.7,
      adaptability: 0.85, domainFocus: 0.5,
    },
    strengths: ['Langfristige Strategieentwicklung', 'Paradigmenwechsel', 'Inspiration von Teams', 'Mustererkennung in disruptiven Trends'],
    weaknesses: ['Details vernachlaessigen', 'Unrealistische Zeitschaetzungen', 'Aktuelle Prozesse ignorieren', 'Schwierigkeiten bei operativer Umsetzung'],
    bestRoles: ['CEO-Berater', 'Innovationsleiter', 'Strategieentwickler', 'Product Vision', 'Venture Partner'],
    compatibility: ['Analyst', 'Executor', 'Guardian'],
    agentCount: 6,
  },
  {
    name: 'Analyst',
    description: 'Durchdringt komplexe Probleme mit logischer Praezision. Alle Entscheidungen basieren auf Daten und fundierter Analyse. Misst zweimal, schneidet einmal. Erkennt verborgene Korrelationen.',
    traits: {
      formality: 0.8, creativity: 0.3, assertiveness: 0.5, empathy: 0.3, detailOrientation: 0.95,
      riskTolerance: 0.2, humor: 0.2, technicalDepth: 0.9, pace: 0.4, verbosity: 0.6,
      adaptability: 0.5, domainFocus: 0.8,
    },
    strengths: ['Datengetriebene Entscheidungen', 'Fehlererkennung', 'Strukturiertes Denken', 'Qualitaetssicherung', 'Hypothesentestung'],
    weaknesses: ['Analyse-Paralyse', 'Uebersehen emotionaler Faktoren', 'Langsame Entscheidungsfindung', 'Schwierigkeiten mit Unsicherheit'],
    bestRoles: ['Data Scientist', 'Qualitaetspruefer', 'Risikoanalyst', 'Forscher', 'Due-Diligence-Lead'],
    compatibility: ['Visionary', 'Strategist', 'Innovator'],
    agentCount: 8,
  },
  {
    name: 'Diplomat',
    description: 'Navigiert durch komplexe soziale und organisationale Dynamiken. Findet Gemeinsamkeiten und baut Konsens auf. Kommunikation ist nuanciert, einfuehlsam und kulturell sensibel.',
    traits: {
      formality: 0.7, creativity: 0.5, assertiveness: 0.4, empathy: 0.95, detailOrientation: 0.5,
      riskTolerance: 0.3, humor: 0.7, technicalDepth: 0.4, pace: 0.5, verbosity: 0.8,
      adaptability: 0.7, domainFocus: 0.4,
    },
    strengths: ['Konfliktloesung', 'Stakeholder-Management', 'Aktives Zuhoeren', 'Konsensbildung', 'Verhandlungsfuehrung'],
    weaknesses: ['Vermeidung harter Entscheidungen', 'Uebermaessiger Kompromiss', 'Langsame Durchsetzung', 'Schwierigkeiten bei Eskalation'],
    bestRoles: ['HR-Berater', 'Verhandlungsfuehrer', 'Kundenbetreuer', 'Change Manager', 'Partner-Manager'],
    compatibility: ['Strategist', 'Sage', 'Guardian'],
    agentCount: 5,
  },
  {
    name: 'Strategist',
    description: 'Entwickelt komplexe Plaene mit klaren Zielen, Zeitlinien und Messkriterien. Ordnet Ressourcen optimal und antizipiert Gegenbewegungen. Spielt Schach, waehrend andere Dame spielen.',
    traits: {
      formality: 0.75, creativity: 0.7, assertiveness: 0.85, empathy: 0.4, detailOrientation: 0.8,
      riskTolerance: 0.6, humor: 0.3, technicalDepth: 0.7, pace: 0.6, verbosity: 0.6,
      adaptability: 0.65, domainFocus: 0.7,
    },
    strengths: ['Ressourcenoptimierung', 'Risiko-Management', 'Lange Planungshorizonte', 'Zielorientierung', 'Szenarioanalyse'],
    weaknesses: ['Starre Planung bei Chaos', 'Schwierigkeiten bei unvorhergesehenen Ereignissen', 'Ueberkomplexitaet', 'Anfaellig fuer Planungsillusion'],
    bestRoles: ['Projektleiter', 'Operations Manager', 'Unternehmensberater', 'CFO-Berater', 'Program Director'],
    compatibility: ['Analyst', 'Executor', 'Visionary'],
    agentCount: 7,
  },
  {
    name: 'Guardian',
    description: 'Schuetzt Qualitaet, Sicherheit und Compliance. Jede Entscheidung wird auf potenzielle Risiken geprueft. Die letzte Verteidigungslinie vor Fehlern. Verantwortungsbewusst bis in die DNA.',
    traits: {
      formality: 0.9, creativity: 0.2, assertiveness: 0.7, empathy: 0.5, detailOrientation: 0.95,
      riskTolerance: 0.1, humor: 0.15, technicalDepth: 0.8, pace: 0.3, verbosity: 0.5,
      adaptability: 0.3, domainFocus: 0.75,
    },
    strengths: ['Qualitaetssicherung', 'Risikoerkennung', 'Compliance', 'Prozessdisziplin', 'Audit-Trail-Genauigkeit'],
    weaknesses: ['Innovationshemmung', 'Langsame Prozesse', 'Ueber-Vorsicht', 'Buerokratie', 'Schwierigkeiten mit MVP-Mentalitaet'],
    bestRoles: ['QA Engineer', 'Compliance Officer', 'Sicherheitsanalyst', 'Auditor', 'Risk Manager'],
    compatibility: ['Analyst', 'Diplomat', 'Sage'],
    agentCount: 4,
  },
  {
    name: 'Innovator',
    description: 'Experimentiert staendig mit neuen Ansaetzen und Technologien. Akzeptiert Fehler als Lernchance. Schnell, agil und immer auf der Suche nach dem naechsten Durchbruch. Challenger des Status Quo.',
    traits: {
      formality: 0.3, creativity: 0.95, assertiveness: 0.7, empathy: 0.5, detailOrientation: 0.4,
      riskTolerance: 0.9, humor: 0.6, technicalDepth: 0.85, pace: 0.95, verbosity: 0.5,
      adaptability: 0.95, domainFocus: 0.5,
    },
    strengths: ['Rapid Prototyping', 'Technologieadoption', 'Kreative Problemlösung', 'Experimentierfreude', 'First-Principles-Denken'],
    weaknesses: ['Unfertige Projekte', 'Vernachlaessigung von Wartung', 'Sprunghaftigkeit', 'Burnout-Risiko', 'Schwierigkeiten mit Langzeitpflege'],
    bestRoles: ['R&D Engineer', 'Startup Gruender', 'Product Manager', 'Technical Lead', 'Innovation Lab Lead'],
    compatibility: ['Visionary', 'Executor', 'Analyst'],
    agentCount: 5,
  },
  {
    name: 'Executor',
    description: 'Wandelt Plaene in Ergebnisse um. Fokussiert, effizient und zuverlaessig. Die treibende Kraft hinter jeder erfolgreichen Operation. Abschluss ist die einzige Option.',
    traits: {
      formality: 0.6, creativity: 0.4, assertiveness: 0.9, empathy: 0.3, detailOrientation: 0.75,
      riskTolerance: 0.5, humor: 0.25, technicalDepth: 0.7, pace: 0.95, verbosity: 0.3,
      adaptability: 0.5, domainFocus: 0.6,
    },
    strengths: ['Durchfuehrungskraft', 'Termintreue', 'Effizienz', 'Zuverlaessigkeit', 'Entscheidungsgeschwindigkeit'],
    weaknesses: ['Starre Ausfuehrung', 'Wenig strategisches Denken', 'Ueberlastung bei Unklarheit', 'Schwierigkeiten mit offenen Spezifikationen'],
    bestRoles: ['DevOps Engineer', 'Projektmanager', 'Operations Lead', 'SRE', 'Delivery Manager'],
    compatibility: ['Strategist', 'Innovator', 'Guardian'],
    agentCount: 9,
  },
  {
    name: 'Sage',
    description: 'Traegt tiefes Wissen in sich und teilt es bedacht. Beruft sich auf Erfahrung, Best Practices und weise Abwaegung. Der Mentor in jeder Organisation. Fragt die richtigen Fragen.',
    traits: {
      formality: 0.8, creativity: 0.5, assertiveness: 0.4, empathy: 0.8, detailOrientation: 0.7,
      riskTolerance: 0.3, humor: 0.5, technicalDepth: 0.85, pace: 0.3, verbosity: 0.8,
      adaptability: 0.4, domainFocus: 0.85,
    },
    strengths: ['Mentoring', 'Wissenstransfer', 'Weise Entscheidungen', 'Best Practices', 'Systemisches Denken'],
    weaknesses: ['Langsame Anpassung', 'Konservatismus', 'Schwierigkeiten mit radikalen Neuerungen', 'Perfektionismus'],
    bestRoles: ['Architekt', 'Senior Berater', 'Dokumentationsverantwortlicher', 'Trainer', 'Technical Fellow'],
    compatibility: ['Diplomat', 'Guardian', 'Analyst'],
    agentCount: 4,
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// 15. LLM PROVIDERS DATA — 4 providers with models, latency, error rates
// ───────────────────────────────────────────────────────────────────────────────

export const llmProvidersData: LLMProviderData[] = [
  {
    name: 'Anthropic',
    status: 'operational',
    models: [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-haiku-3-5-20241001',
      'claude-3-5-sonnet-20241022',
    ],
    requestsPerMin: 1247,
    avgLatency: 234,
    errorRate: 0.12,
    activeConnections: 89,
    tokenThroughput: 45200,
    costPer1KTokens: 0.003,
  },
  {
    name: 'OpenAI',
    status: 'operational',
    models: [
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'o3',
      'o4-mini',
      'o1-preview',
    ],
    requestsPerMin: 892,
    avgLatency: 189,
    errorRate: 0.08,
    activeConnections: 67,
    tokenThroughput: 67800,
    costPer1KTokens: 0.005,
  },
  {
    name: 'Ollama',
    status: 'degraded',
    models: [
      'llama3.3:70b',
      'mistral-large:123b',
      'qwen2.5:72b',
      'deepseek-r1:70b',
      'codellama:70b',
      'gemma2:27b',
      'phi4:14b',
    ],
    requestsPerMin: 156,
    avgLatency: 1240,
    errorRate: 2.4,
    activeConnections: 12,
    tokenThroughput: 12300,
    costPer1KTokens: 0.0,
  },
  {
    name: 'Custom',
    status: 'operational',
    models: [
      'valtheron-mkt-v2',
      'valtheron-retail-v1',
      'valtheron-media-v1',
      'valtheron-med-v2',
      'valtheron-legal-v1',
      'valtheron-finance-v3',
    ],
    requestsPerMin: 78,
    avgLatency: 456,
    errorRate: 0.45,
    activeConnections: 8,
    tokenThroughput: 8900,
    costPer1KTokens: 0.001,
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// 16. WORKSPACE STATS — aggregated statistics
// ───────────────────────────────────────────────────────────────────────────────

export const workspaceStats: WorkspaceStats = {
  totalAgents: 291,
  activeNow: 189,
  idleNow: 58,
  busyNow: 29,
  offlineNow: 15,
  totalTasks: 1847,
  tasksCompletedToday: 234,
  tasksInProgress: 12,
  tasksBlocked: 2,
  totalWorkflows: 15,
  workflowsRunning: 6,
  workflowsCompletedToday: 47,
  activeCollaborations: 4,
  avgAgentSuccessRate: 95.7,
  avgAgentPowerLevel: 7.2,
  topCategory: 'DEV',
  totalMessagesExchanged: 45280,
  securityEvents24h: 7,
  unresolvedSecurityEvents: 1,
  avgLlmLatency: 234,
  dbSizeMB: 2684,
  systemUptime: 99.92,
  version: '3.2.1',
  lastDeployed: '2025-06-15T02:00:00Z',
};

// ───────────────────────────────────────────────────────────────────────────────
// 17. TEAM MEMBERS — 6 members
// ───────────────────────────────────────────────────────────────────────────────

export const teamMembers: TeamMember[] = [
  { id: 'USR-001', name: 'Klaus Schmidt', role: 'Owner', avatar: '/avatars/klaus.jpg', status: 'online', workflowsShared: 12, lastActive: '2025-06-17T14:59:00Z', email: 'klaus.schmidt@valtheron.ai' },
  { id: 'USR-002', name: 'Elena Weber', role: 'Admin', avatar: '/avatars/elena.jpg', status: 'online', workflowsShared: 8, lastActive: '2025-06-17T14:45:00Z', email: 'elena.weber@valtheron.ai' },
  { id: 'USR-003', name: 'Thomas Mueller', role: 'Admin', avatar: '/avatars/thomas.jpg', status: 'away', workflowsShared: 6, lastActive: '2025-06-17T13:30:00Z', email: 'thomas.mueller@valtheron.ai' },
  { id: 'USR-004', name: 'Sophie Krause', role: 'Viewer', avatar: '/avatars/sophie.jpg', status: 'online', workflowsShared: 2, lastActive: '2025-06-17T14:55:00Z', email: 'sophie.krause@valtheron.ai' },
  { id: 'USR-005', name: 'Max Meyer', role: 'Editor', avatar: '/avatars/max.jpg', status: 'offline', workflowsShared: 4, lastActive: '2025-06-16T18:00:00Z', email: 'max.meyer@valtheron.ai' },
  { id: 'USR-006', name: 'Anna Fischer', role: 'Editor', avatar: '/avatars/anna.jpg', status: 'online', workflowsShared: 3, lastActive: '2025-06-17T14:40:00Z', email: 'anna.fischer@valtheron.ai' },
];

// ───────────────────────────────────────────────────────────────────────────────
// 18. FORSETI DIMENSIONS — 5 dimensions
// ═══════════════════════════════════════════════════════════════════════════════
// The Forseti Framework governs agent capability boundaries across 5 dimensions.
// ───────────────────────────────────────────────────────────────────────────────

export const forsetiDimensions: ForsetiDimension[] = [
  {
    name: 'InformationAccess',
    description: 'Steuert welche Datenquellen der Agent lesen darf. Von internen Wikis bis zu Echtzeit-Marktdaten und vertraulichen Patientenakten. Hoehere Werte = breiterer Zugriff.',
    weight: 0.25,
    scale: 10,
  },
  {
    name: 'ResourceControl',
    description: 'Regelt Rechenressourcen, Speicher, Bandbreite und GPU-Zugriff. Beeinflusst Antwortgeschwindigkeit und Verarbeitungstiefe.',
    weight: 0.20,
    scale: 10,
  },
  {
    name: 'AuthorityPermission',
    description: 'Bestimmt welche Aktionen der Agent autonom ausfuehren darf. Von Read-Only bis hin zu vollstaendiger Workflow-Steuerung, Agent-Deployment und Kill-Switch-Deaktivierung.',
    weight: 0.30,
    scale: 10,
  },
  {
    name: 'NetworkPosition',
    description: 'Definiert die Interaktionsberechtigung mit anderen Agenten und externen Systemen. Hoehere Werte = mehr Kollaboration, Cross-Domain-Zugriff und API-Integrationen.',
    weight: 0.15,
    scale: 10,
  },
  {
    name: 'SynthesisApplication',
    description: 'Steuert die Faehigkeit, Ergebnisse zu synthetisieren und in andere Workflows, Systeme und Datenbanken zu integrieren. Schreiben vs. Lesen.',
    weight: 0.10,
    scale: 10,
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// 19. PRESETS — 6 configuration presets
// ───────────────────────────────────────────────────────────────────────────────

export const presets: PresetConfig[] = [
  {
    name: 'Default',
    description: 'Ausgewogene Konfiguration fuer den Alltagseinsatz. Gute Performance bei konsistenten Ergebnissen.',
    personality: {
      formality: 0.6, creativity: 0.5, assertiveness: 0.6, empathy: 0.5, detailOrientation: 0.6,
      riskTolerance: 0.5, humor: 0.3, technicalDepth: 0.6, pace: 0.6, verbosity: 0.5,
      adaptability: 0.6, domainFocus: 0.5,
    },
    forseti: {
      InformationAccess: 6, ResourceControl: 5, AuthorityPermission: 5, NetworkPosition: 5, SynthesisApplication: 5,
    },
    llm: {
      provider: 'Anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
  {
    name: 'Creative Burst',
    description: 'Maximale Kreativitaet fuer Brainstorming, Design und innovative Problemloesungen. Erwartet unkonventionelle Ideen.',
    personality: {
      formality: 0.2, creativity: 0.95, assertiveness: 0.7, empathy: 0.6, detailOrientation: 0.3,
      riskTolerance: 0.9, humor: 0.7, technicalDepth: 0.5, pace: 0.9, verbosity: 0.7,
      adaptability: 0.9, domainFocus: 0.3,
    },
    forseti: {
      InformationAccess: 8, ResourceControl: 7, AuthorityPermission: 4, NetworkPosition: 7, SynthesisApplication: 8,
    },
    llm: {
      provider: 'OpenAI',
      model: 'o3',
      temperature: 0.95,
      maxTokens: 8192,
    },
  },
  {
    name: 'Production Safe',
    description: 'Maximale Sicherheit fuer produktive Umgebungen. Konservative Entscheidungen mit umfassender Validierung.',
    personality: {
      formality: 0.95, creativity: 0.15, assertiveness: 0.5, empathy: 0.4, detailOrientation: 0.95,
      riskTolerance: 0.1, humor: 0.05, technicalDepth: 0.85, pace: 0.3, verbosity: 0.4,
      adaptability: 0.2, domainFocus: 0.9,
    },
    forseti: {
      InformationAccess: 3, ResourceControl: 4, AuthorityPermission: 2, NetworkPosition: 2, SynthesisApplication: 2,
    },
    llm: {
      provider: 'Anthropic',
      model: 'claude-opus-4-20250514',
      temperature: 0.1,
      maxTokens: 2048,
    },
  },
  {
    name: 'Deep Analysis',
    description: 'Umfassende Analyse mit maximaler Detailtiefe. Ideal fuer Due Diligence, Audits und komplexe Recherchen.',
    personality: {
      formality: 0.8, creativity: 0.3, assertiveness: 0.5, empathy: 0.3, detailOrientation: 0.95,
      riskTolerance: 0.2, humor: 0.1, technicalDepth: 0.95, pace: 0.3, verbosity: 0.8,
      adaptability: 0.4, domainFocus: 0.85,
    },
    forseti: {
      InformationAccess: 9, ResourceControl: 7, AuthorityPermission: 3, NetworkPosition: 4, SynthesisApplication: 6,
    },
    llm: {
      provider: 'Anthropic',
      model: 'claude-opus-4-20250514',
      temperature: 0.3,
      maxTokens: 16384,
    },
  },
  {
    name: 'Rapid Response',
    description: 'Maximale Geschwindigkeit fuer zeitkritische Situationen. Schnelle Entscheidungen mit akzeptablem Praezisionsverlust.',
    personality: {
      formality: 0.4, creativity: 0.6, assertiveness: 0.9, empathy: 0.3, detailOrientation: 0.4,
      riskTolerance: 0.8, humor: 0.2, technicalDepth: 0.6, pace: 0.95, verbosity: 0.3,
      adaptability: 0.9, domainFocus: 0.4,
    },
    forseti: {
      InformationAccess: 7, ResourceControl: 9, AuthorityPermission: 7, NetworkPosition: 6, SynthesisApplication: 5,
    },
    llm: {
      provider: 'OpenAI',
      model: 'gpt-4.1-mini',
      temperature: 0.5,
      maxTokens: 2048,
    },
  },
  {
    name: 'Diplomatic',
    description: 'Hohe soziale Intelligenz fuer Verhandlungen, Kundenkommunikation und sensible interne Abstimmungen.',
    personality: {
      formality: 0.7, creativity: 0.5, assertiveness: 0.3, empathy: 0.95, detailOrientation: 0.5,
      riskTolerance: 0.3, humor: 0.6, technicalDepth: 0.4, pace: 0.5, verbosity: 0.8,
      adaptability: 0.7, domainFocus: 0.4,
    },
    forseti: {
      InformationAccess: 5, ResourceControl: 4, AuthorityPermission: 3, NetworkPosition: 8, SynthesisApplication: 6,
    },
    llm: {
      provider: 'Anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.6,
      maxTokens: 4096,
    },
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// LEGACY EXPORTS (backward compatibility with existing components)
// ───────────────────────────────────────────────────────────────────────────────

export interface KPIData {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  total?: number;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  trendGood: boolean;
  borderColor: string;
  iconColor: string;
  sparkline: number[];
}

export const kpiData: KPIData[] = [
  {
    id: 'active-agents',
    label: 'Active Agents',
    value: 189,
    total: 291,
    trend: '+12 today',
    trendDirection: 'up',
    trendGood: true,
    borderColor: '#3DDC97',
    iconColor: '#3DDC97',
    sparkline: [167, 170, 172, 175, 173, 176, 178, 180, 183, 189],
  },
  {
    id: 'tasks-completed',
    label: 'Tasks Completed (24h)',
    value: 234,
    suffix: '',
    trend: '+8.3%',
    trendDirection: 'up',
    trendGood: true,
    borderColor: '#5B8DEF',
    iconColor: '#5B8DEF',
    sparkline: [198, 205, 210, 202, 215, 220, 218, 228, 231, 234],
  },
  {
    id: 'response-time',
    label: 'Avg Response Time',
    value: 142,
    suffix: 'ms',
    trend: '-12ms',
    trendDirection: 'down',
    trendGood: true,
    borderColor: '#F5A623',
    iconColor: '#F5A623',
    sparkline: [180, 172, 168, 175, 162, 158, 160, 155, 148, 142],
  },
  {
    id: 'system-uptime',
    label: 'System Uptime',
    value: 99.92,
    suffix: '%',
    trend: '2 incidents',
    trendDirection: 'neutral',
    trendGood: false,
    borderColor: '#EF4444',
    iconColor: '#EF4444',
    sparkline: [99.95, 99.94, 99.96, 99.93, 99.92, 99.92, 99.91, 99.92, 99.92, 99.92],
  },
];

export interface AgentStatusItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export const agentStatusData: AgentStatusItem[] = [
  { name: 'Operational', count: 189, percentage: 65, color: '#3DDC97' },
  { name: 'Idle', count: 58, percentage: 20, color: '#5B8DEF' },
  { name: 'Warning', count: 29, percentage: 10, color: '#F5A623' },
  { name: 'Error', count: 15, percentage: 5, color: '#EF4444' },
];

export interface SystemHealthItem {
  name: string;
  status: 'Healthy' | 'Warning' | 'Critical';
  metric: string;
  sparkline: number[];
}

export const legacySystemHealthData: SystemHealthItem[] = [
  { name: 'API Gateway', status: 'Healthy', metric: '< 200ms', sparkline: [180, 175, 182, 178, 185, 180, 176, 179, 181, 178] },
  { name: 'Task Queue', status: 'Healthy', metric: '0 backlog', sparkline: [2, 1, 0, 0, 1, 0, 0, 0, 0, 0] },
  { name: 'Database', status: 'Healthy', metric: '99.9%', sparkline: [99.8, 99.9, 99.9, 99.9, 99.8, 99.9, 99.9, 99.9, 99.9, 99.9] },
  { name: 'Auth Service', status: 'Healthy', metric: '100%', sparkline: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100] },
  { name: 'Agent Runtime', status: 'Warning', metric: '3 retries', sparkline: [0, 0, 1, 0, 0, 2, 0, 1, 0, 3] },
  { name: 'File Storage', status: 'Healthy', metric: '14 GB', sparkline: [8, 8.5, 9, 9.2, 9.8, 10, 10.5, 11, 11.5, 12.8] },
];

export interface ActivityTimelineEvent {
  id: string;
  type: 'agent' | 'workflow' | 'alert' | 'user' | 'task' | 'system';
  severity?: 'critical' | 'warning' | 'info' | 'success';
  actor: string;
  action: string;
  target: string;
  targetItalic?: boolean;
  time: string;
}

export const activityData: ActivityTimelineEvent[] = [
  {
    id: '1',
    type: 'agent',
    severity: 'success',
    actor: 'CodeGen Weber',
    action: 'deployed API Gateway v3.2.1 to production',
    target: 'Production Cluster',
    time: '2 min ago',
  },
  {
    id: '2',
    type: 'user',
    actor: 'elena.weber',
    action: 'shared workflow',
    target: 'Customer Segmentation Pipeline',
    targetItalic: true,
    time: '8 min ago',
  },
  {
    id: '3',
    type: 'alert',
    severity: 'warning',
    actor: 'System',
    action: 'Connection pool auto-scaled: 50 -> 80 instances',
    target: 'Database Cluster',
    time: '15 min ago',
  },
  {
    id: '4',
    type: 'agent',
    severity: 'success',
    actor: 'SecHofmann',
    action: 'resolved security event',
    target: 'Incident #4022',
    time: '22 min ago',
  },
  {
    id: '5',
    type: 'workflow',
    severity: 'info',
    actor: 'Code Review Bot',
    action: 'completed — 431 tests passed, 97.4% coverage',
    target: '',
    time: '34 min ago',
  },
  {
    id: '6',
    type: 'alert',
    severity: 'critical',
    actor: 'System',
    action: 'Kill-Switch activated by admin for agent',
    target: 'TestKlein QA',
    targetItalic: true,
    time: '45 min ago',
  },
  {
    id: '7',
    type: 'agent',
    severity: 'success',
    actor: 'Schmidt Analytik',
    action: 'generated Q3 market forecast',
    target: 'DACH Region Report',
    time: '1h ago',
  },
  {
    id: '8',
    type: 'system',
    severity: 'warning',
    actor: 'System',
    action: 'Scheduled maintenance: SQLite 3.48 upgrade on Jun 19 at 02:00 UTC',
    target: '',
    time: '1h ago',
  },
];

export interface QuickLink {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  href: string;
}

export const quickLinksData: QuickLink[] = [
  {
    title: 'Monitoring Dashboard',
    description: 'View real-time metrics & alerts',
    icon: 'Activity',
    iconColor: '#3DDC97',
    href: '/monitoring',
  },
  {
    title: 'Template Library',
    description: 'Browse 15 workflow templates',
    icon: 'Library',
    iconColor: '#A78BFA',
    href: '/templates',
  },
  {
    title: 'Team Collaboration',
    description: '5 active collaboration sessions',
    icon: 'Users',
    iconColor: '#5B8DEF',
    href: '/collaboration',
  },
  {
    title: 'Agent Settings',
    description: 'Customize agent parameters',
    icon: 'Sliders',
    iconColor: '#F5A623',
    href: '/customization',
  },
];

export interface WorkflowItem {
  id: string;
  name: string;
  runs: number;
  success: number;
  avgTime: string;
  trend: number[];
  trendDirection: 'up' | 'down' | 'stable';
}

export const topWorkflowsData: WorkflowItem[] = [
  {
    id: 'WF-003',
    name: 'Code Review & Deploy',
    runs: 1247,
    success: 99.2,
    avgTime: '4m 56s',
    trend: [80, 82, 85, 83, 87, 90, 88, 92, 95, 99.2],
    trendDirection: 'up',
  },
  {
    id: 'WF-001',
    name: 'Finanzberichts-Pipeline',
    runs: 892,
    success: 98.7,
    avgTime: '8m 42s',
    trend: [90, 91, 90, 92, 93, 95, 94, 96, 97, 98.7],
    trendDirection: 'up',
  },
  {
    id: 'WF-002',
    name: 'Content-Produktionsfluss',
    runs: 756,
    success: 97.1,
    avgTime: '12m 18s',
    trend: [96, 96, 97, 96, 97, 97, 97, 97, 97, 97.1],
    trendDirection: 'stable',
  },
  {
    id: 'WF-007',
    name: 'Marktanalyse Workflow',
    runs: 534,
    success: 99.6,
    avgTime: '11m 22s',
    trend: [95, 96, 97, 98, 98, 99, 99, 99.5, 99.5, 99.6],
    trendDirection: 'up',
  },
  {
    id: 'WF-010',
    name: 'Sicherheitsaudit Workflow',
    runs: 567,
    success: 99.3,
    avgTime: '32m 05s',
    trend: [98, 98, 99, 99, 99, 99, 99, 99, 99.2, 99.3],
    trendDirection: 'up',
  },
];

export interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  category: 'navigation' | 'action' | 'recent';
  href?: string;
  icon?: string;
}

export const commandPaletteItems: CommandItem[] = [
  { id: '1', label: 'Dashboard Overview', category: 'navigation', href: '/', icon: 'LayoutDashboard' },
  { id: '2', label: 'Monitoring Dashboard', category: 'navigation', href: '/monitoring', icon: 'Activity' },
  { id: '3', label: 'Workflow Templates', category: 'navigation', href: '/templates', icon: 'Library' },
  { id: '4', label: 'Collaboration Hub', category: 'navigation', href: '/collaboration', icon: 'Users' },
  { id: '5', label: 'Agent Customization', category: 'navigation', href: '/customization', icon: 'Sliders' },
  { id: '6', label: 'New Workflow', category: 'action', shortcut: 'Ctrl+N', icon: 'Plus' },
  { id: '7', label: 'Add Agent', category: 'action', shortcut: 'Ctrl+A', icon: 'Bot' },
  { id: '8', label: 'Export Report', category: 'action', shortcut: 'Ctrl+E', icon: 'Download' },
  { id: '9', label: 'View CodeGen Weber logs', category: 'recent', icon: 'Clock' },
  { id: '10', label: 'Edit Finanzberichts-Pipeline', category: 'recent', icon: 'Clock' },
];
