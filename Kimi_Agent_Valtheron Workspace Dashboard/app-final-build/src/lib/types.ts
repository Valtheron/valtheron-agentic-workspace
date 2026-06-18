export interface ModuleHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
}

export interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  connections: number;
  opsPerSec: number;
  memoryUsage: number;
  uptime: number;
}

export interface LLMProvider {
  name: string;
  model: string;
  status: 'operational' | 'degraded' | 'down';
  requestsPerMin: number;
  avgLatency: number;
  errorRate: number;
  modelCount: number;
}

export interface SecurityEvent {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  agent: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface AgentTimePoint {
  time: string;
  contentAgents: number;
  dataAgents: number;
  codeAgents: number;
}

export interface AgentActivity {
  requests: AgentTimePoint[];
  responseTime: AgentTimePoint[];
  throughput: AgentTimePoint[];
}

export interface AgentData {
  active: number;
  total: number;
  activity: AgentActivity;
}

export interface TaskData {
  completed: number;
  failed: number;
  pending: number;
  inProgress: number;
  avgDuration: number;
}

export interface WorkflowInstance {
  id: string;
  name: string;
  progress: number;
  status: 'running' | 'completed' | 'failed' | 'pending';
  currentStep: string;
  estimatedCompletion: string;
  startedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  result: 'success' | 'failure';
  details: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  source: string;
}

export interface DBMetrics {
  walMode: boolean;
  tableCount: number;
  totalTables: number;
  indexCount: number;
  cacheHitRate: number;
  activeConnections: number;
  transactionsPerSec: number;
  replicationStatus: 'primary' | 'standby' | 'replicating';
}

export interface KillSwitchStatus {
  armed: boolean;
  lastTriggered: string;
  autoTriggerRules: number;
  status: 'armed' | 'disarmed' | 'triggered';
}

export interface TimeSeriesPoint {
  time: string;
  value: number;
}

export interface SystemHealth {
  status: string;
  uptime: number;
  lastChecked: string;
  modules: ModuleHealth[];
  services: ServiceHealth[];
  llmProviders: LLMProvider[];
  dbMetrics: DBMetrics;
  killSwitch: KillSwitchStatus;
}

export interface KPIMetric {
  label: string;
  value: number;
  total?: number;
  suffix: string;
  prefix: string;
  color: string;
  sparkline: number[];
}
