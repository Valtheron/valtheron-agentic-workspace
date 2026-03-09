// Valtheron Agentic Workspace - Type Definitions

export type AgentCategory =
  | 'trading'
  | 'security'
  | 'development'
  | 'qa'
  | 'documentation'
  | 'deployment'
  | 'analyst'
  | 'support'
  | 'integration'
  | 'monitoring';
export type AgentStatus = 'active' | 'idle' | 'working' | 'blocked' | 'error' | 'suspended';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type CertStatus = 'valid' | 'expiring' | 'expired' | 'suspended' | 'revoked' | 'archived';
export type SecurityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type KanbanColumn = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface Agent {
  id: string;
  name: string;
  role: string;
  category: AgentCategory;
  status: AgentStatus;
  successRate: number;
  tasksCompleted: number;
  failedTasks: number;
  avgTaskDuration: number;
  currentTask: string | null;
  lastActivity: string;
  systemPrompt: string;
  personality: PersonalityConfig;
  parameters: AgentParameters;
  certificationId?: string;
  createdAt: string;
  certifiedAt?: string;
  hooks: PostConversationHook[];
  testResults: TestResult[];
  llmProvider?: LLMProviderType;
  llmModel?: string;
  riskProfile?: AgentRiskProfile;
}

export interface PersonalityConfig {
  creativity: number;
  analyticalDepth: number;
  riskTolerance: number;
  communicationStyle: 'formal' | 'casual' | 'technical' | 'diplomatic';
  archetype: 'analytiker' | 'kreativer' | 'diplomat' | 'commander';
  domainFocus: string;
}

export interface AgentParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface PostConversationHook {
  id: string;
  type: 'on_complete' | 'on_error' | 'on_timeout' | 'on_handoff';
  action: string;
  enabled: boolean;
}

export interface TestResult {
  id: string;
  category: 'DOM' | 'EDGE' | 'PERS' | 'KB' | 'GEN';
  name: string;
  passed: boolean;
  duration: number;
  timestamp: string;
}

export type TaskType =
  | 'feature'
  | 'bug'
  | 'improvement'
  | 'research'
  | 'documentation'
  | 'testing'
  | 'deployment'
  | 'review';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedAgentId: string | null;
  category: AgentCategory;
  createdAt: string;
  completedAt?: string;
  dependencies: string[];
  kanbanColumn: KanbanColumn;
  tags: string[];
  taskType?: TaskType;
  deadline?: string;
  progress?: number;
  estimatedHours?: number;
  actualHours?: number;
}

export interface CollaborationSession {
  id: string;
  name: string;
  agents: string[];
  status: 'active' | 'paused' | 'completed';
  sharedFiles: string[];
  messageCount: number;
  startedAt: string;
  maxIterations: number;
  coordinatorPrompt: string;
  delegationStrategy: 'round-robin' | 'capability-based' | 'load-balanced' | 'priority';
  redundancyScore: number;
  conflictResolution: 'coordinator-decides' | 'voting' | 'merge' | 'priority-based';
  consensusThreshold: number;
  synthesis: string;
}

export interface Certification {
  id: string;
  agentId: string;
  agentName: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  status: CertStatus;
  score: number;
  issuedAt: string;
  expiresAt: string;
  tests: { name: string; passed: boolean; score: number }[];
  monitoringAlerts: MonitoringAlert[];
  revokedAt?: string;
  archivedAt?: string;
  revocationReason?: string;
}

export interface MonitoringAlert {
  id: string;
  type: 'performance' | 'compliance' | 'security' | 'availability';
  severity: SecurityLevel;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface SecurityEvent {
  id: string;
  type: 'auth' | 'access' | 'injection' | 'anomaly' | 'policy';
  severity: SecurityLevel;
  message: string;
  agentId?: string;
  timestamp: string;
  resolved: boolean;
}

export interface KillSwitch {
  armed: boolean;
  triggeredAt?: string;
  triggeredBy?: string;
  reason?: string;
  affectedAgents: string[];
  autoTriggerRules: KillSwitchRule[];
  history?: KillSwitchEvent[];
}

export interface KillSwitchRule {
  id: string;
  name: string;
  condition: string;
  enabled: boolean;
  lastTriggered?: string;
}

export interface AuditEntry {
  id: string;
  agentId: string;
  action: string;
  details: string;
  timestamp: string;
  riskLevel: SecurityLevel;
}

export interface ProjektBaumNode {
  id: string;
  name: string;
  type: 'project' | 'phase' | 'milestone' | 'module' | 'task' | 'agent';
  status: 'active' | 'completed' | 'blocked' | 'in_progress' | 'pending';
  children: ProjektBaumNode[];
  agentId?: string;
  progress: number;
  assignedAgents?: string[];
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface SecurityConfig {
  promptInjectionDefense: boolean;
  piiDetection: { email: boolean; phone: boolean; ssn: boolean; creditCard: boolean; address: boolean; name: boolean };
  gdpr: { exportEnabled: boolean; deletionEnabled: boolean; anonymizationEnabled: boolean };
  zeroTrust: {
    networkSegmentation: boolean;
    mfa: boolean;
    leastPrivilege: boolean;
    continuousVerification: boolean;
    microSegmentation: boolean;
  };
  threatModel: {
    injection: boolean;
    dataLeak: boolean;
    privilegeEscalation: boolean;
    dos: boolean;
    supplyChain: boolean;
    insiderThreat: boolean;
  };
  rbac: { roles: string[]; activeRole: string };
  encryption: { jwt: boolean; tls: boolean; aes256: boolean; securityHeaders: boolean };
}

export interface AnalyticsData {
  totalAgents: number;
  activeAgents: number;
  tasksToday: number;
  successRate: number;
  avgResponseTime: number;
  tasksTrend: { date: string; count: number }[];
  categoryDistribution: { category: AgentCategory; count: number }[];
  topPerformers: { agentId: string; name: string; score: number }[];
  errorRate: number;
  uptime: number;
}

export type ViewType =
  | 'dashboard'
  | 'agents'
  | 'security'
  | 'collaboration'
  | 'certifications'
  | 'kanban'
  | 'projektbaum'
  | 'llm-settings'
  | 'workflows'
  | 'projects'
  | 'kill-switch'
  | 'analytics'
  | 'enterprise'
  | 'chat'
  | 'audit';

// Chat Types
export interface ChatSession {
  id: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: string;
  senderType: 'user' | 'agent';
  content: string;
  timestamp: string;
}

// Collaboration Message Types
export interface CollaborationMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  messageType: 'message' | 'system' | 'decision' | 'file_share';
  timestamp: string;
}

// Project Types

export type ProjectStatus =
  | 'importing'
  | 'analyzing'
  | 'planning'
  | 'in_development'
  | 'testing'
  | 'completed'
  | 'failed';

export interface ProjectRequirement {
  id: string;
  category: 'ui' | 'logic' | 'api' | 'data' | 'security' | 'infra' | 'testing' | 'design';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  accepted: boolean;
}

export interface ProjectFile {
  id: string;
  path: string; // e.g. "src/components/Dashboard.tsx"
  language: string; // e.g. "typescript", "html", "css"
  content: string;
  generatedBy: string; // agent ID
  generatedAt: string;
  status: 'generated' | 'reviewed' | 'approved' | 'rejected';
  size: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  sourceUrl?: string;
  status: ProjectStatus;
  requirements: ProjectRequirement[];
  files: ProjectFile[];
  workflowId?: string; // linked workflow
  techStack: string[];
  createdAt: string;
  updatedAt: string;
  scrapedContent?: string; // raw scraped HTML/text
  analyzedStructure?: {
    title: string;
    technologies: string[];
    features: string[];
    pages: string[];
    apiEndpoints: string[];
    components: string[];
  };
}

// Workflow Types

export type WorkflowStatus = 'draft' | 'running' | 'paused' | 'completed' | 'failed';
export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignedAgentId: string | null;
  status: WorkflowStepStatus;
  dependsOn: string[]; // step IDs
  output: string | null; // result/output text
  startedAt?: string;
  completedAt?: string;
  progress: number; // 0-100
  estimatedDuration: number; // seconds
  retries: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  tags: string[];
}

// LLM Provider & Model Types

export type LLMProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  | 'groq'
  | 'ollama'
  | 'openrouter'
  | 'custom';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProviderType;
  contextWindow: number;
  maxOutput: number;
  costPer1kInput?: number; // USD, undefined for local
  costPer1kOutput?: number;
  capabilities: ('text' | 'vision' | 'code' | 'function-calling' | 'json-mode')[];
  isLocal: boolean;
}

export interface LLMProvider {
  id: LLMProviderType;
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl: string;
  models: LLMModel[];
  status: 'connected' | 'disconnected' | 'error' | 'checking';
  lastChecked?: string;
  isLocal: boolean;
}

export interface LLMConfig {
  defaultProvider: LLMProviderType;
  defaultModel: string;
  providers: LLMProvider[];
  agentModelOverrides: Record<string, { provider: LLMProviderType; model: string }>;
  ollamaEndpoint: string;
  ollamaModels: OllamaModel[];
  globalParameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
    streamResponses: boolean;
    retryOnFailure: boolean;
    maxRetries: number;
    timeoutMs: number;
  };
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modifiedAt: string;
  details: {
    format: string;
    family: string;
    parameterSize: string;
    quantizationLevel: string;
  };
}

// === Sprint 2.1: Kill-Switch & Bulk Operations ===

export interface KillSwitchEvent {
  id: string;
  action: 'armed' | 'disarmed' | 'triggered' | 'rule_added' | 'rule_removed' | 'batch_stop' | 'batch_start';
  triggeredBy: string;
  reason: string;
  affectedAgents: string[];
  timestamp: string;
}

export interface AgentRiskProfile {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  maxConcurrentTasks: number;
  maxTokenBudget: number;
  autoSuspendOnFailure: boolean;
  failureThreshold: number;
  cooldownPeriod: number;
  requiresApproval: boolean;
}

// === Sprint 2.3: Analytics & Monitoring ===

export interface SLAMetric {
  id: string;
  name: string;
  metric: 'response_time' | 'success_rate' | 'uptime' | 'throughput' | 'error_rate';
  threshold: number;
  unit: string;
  current: number;
  status: 'met' | 'warning' | 'breached';
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  history: { timestamp: string; value: number }[];
}

export interface PerformanceTrend {
  date: string;
  throughput: number;
  errorRate: number;
  avgResponseTime: number;
  successRate: number;
  activeAgents: number;
}

// === Sprint 2.4: Echtzeit ===

export interface AgentPresence {
  agentId: string;
  agentName: string;
  nodeId: string;
  action: 'working' | 'reviewing' | 'planning' | 'testing';
  since: string;
}

export interface LiveUpdate {
  id: string;
  type: 'agent_status' | 'task_progress' | 'node_update' | 'security_event' | 'metric_change';
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

// === Iteration 3: Enterprise Features ===

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: SecurityLevel;
  status: 'open' | 'investigating' | 'mitigating' | 'resolved' | 'closed';
  assignedTo: string[];
  affectedAgents: string[];
  timeline: IncidentTimelineEvent[];
  slaResponseTime?: number;
  slaResolutionTime?: number;
  rca?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface IncidentTimelineEvent {
  id: string;
  type: 'created' | 'updated' | 'assigned' | 'escalated' | 'resolved' | 'comment';
  message: string;
  author: string;
  timestamp: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  enabled: boolean;
  priority: number;
  scope: 'global' | 'category' | 'agent';
  scopeTarget?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRule {
  id: string;
  condition: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string;
  action: 'allow' | 'deny' | 'require_approval' | 'log' | 'alert';
}

export interface AgentVersion {
  id: string;
  agentId: string;
  version: number;
  changes: string;
  snapshot: { systemPrompt: string; parameters: AgentParameters; personality: PersonalityConfig };
  createdAt: string;
  createdBy: string;
}

export interface SharedFile {
  id: string;
  name: string;
  path: string;
  owner: string;
  sharedWith: string[];
  size: number;
  lastModified: string;
  type: 'code' | 'config' | 'document' | 'data';
}

export interface HealthMetric {
  agentId: string;
  agentName: string;
  cpu: number;
  memory: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastCheck: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
}
