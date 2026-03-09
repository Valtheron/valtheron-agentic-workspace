import { getDb } from './schema.js';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

const CATEGORIES = [
  'trading',
  'security',
  'development',
  'qa',
  'documentation',
  'deployment',
  'analyst',
  'support',
  'integration',
  'monitoring',
] as const;
const STATUSES = ['active', 'idle', 'working'] as const;
const ARCHETYPES = ['analytiker', 'kreativer', 'diplomat', 'commander'] as const;
const COMM_STYLES = ['formal', 'casual', 'technical', 'diplomatic'] as const;

const AGENT_NAMES: Record<string, string[]> = {
  trading: [
    'TradeMaster',
    'MarketSentinel',
    'AlphaSeeker',
    'RiskGuard',
    'PortfolioBot',
    'SwingTrader',
    'ArbitrageHunter',
    'TrendFollower',
    'VolatilityScout',
    'LiquidityBot',
    'DeltaTrader',
    'GammaHedger',
    'ThetaCollector',
    'VegaTracker',
    'RhoAnalyzer',
    'MomentumBot',
    'MeanReversion',
    'PairTrader',
    'FlowDetector',
    'OrderBookBot',
    'SpreadTrader',
    'ScalpingBot',
    'QuantEngine',
    'SectorRotator',
    'DividendBot',
    'CryptoTrader',
    'ForexBot',
    'CommodityBot',
    'OptionsBot',
  ],
  security: [
    'FirewallGuard',
    'ThreatHunter',
    'VulnScanner',
    'AccessControl',
    'CryptoGuard',
    'AnomalyDetector',
    'PenTestBot',
    'SOCAnalyst',
    'MalwareHunter',
    'ComplianceBot',
    'PhishGuard',
    'EndpointSentry',
    'NetworkWatch',
    'LogAnalyzer',
    'IncidentBot',
    'ForensicBot',
    'ZeroDayWatch',
    'DLPGuard',
    'IdentityBot',
    'CloudSecBot',
    'RansomGuard',
    'APISecBot',
    'ContainerSecBot',
    'SupplyChainGuard',
    'PrivacyBot',
    'TokenGuard',
    'WAFBot',
    'BotDetector',
    'ThreatIntel',
  ],
  development: [
    'CodeArchitect',
    'RefactorBot',
    'APIBuilder',
    'FrontendDev',
    'BackendDev',
    'FullStackDev',
    'MicroserviceBot',
    'DatabaseDev',
    'CICDBot',
    'PerformanceDev',
    'ReactDev',
    'NodeDev',
    'PythonDev',
    'RustDev',
    'GoDev',
    'TypeScriptDev',
    'GraphQLDev',
    'WebSocketDev',
    'ContainerDev',
    'InfraDev',
    'SwiftDev',
    'KotlinDev',
    'WasmDev',
    'ElixirDev',
    'ScalaDev',
    'MLEngineer',
    'GameDev',
    'EmbeddedDev',
    'BlockchainDev',
  ],
  qa: [
    'TestMaster',
    'E2ETestBot',
    'UnitTestBot',
    'IntegrationTester',
    'LoadTestBot',
    'SecurityTester',
    'RegressionBot',
    'FuzzerBot',
    'AccessibilityBot',
    'CompatTester',
    'VisualTestBot',
    'APITester',
    'PerformanceTester',
    'ChaosMonkey',
    'DataValidator',
    'SmokeTestBot',
    'ContractTester',
    'MutationTester',
    'CoveragBot',
    'BugHunter',
    'SnapshotBot',
    'StressTestBot',
    'PropertyTester',
    'PlaywrightBot',
    'CypressBot',
    'SeleniumBot',
    'TestDataBot',
    'MockServiceBot',
    'BenchmarkBot',
  ],
  documentation: [
    'DocWriter',
    'APIDocBot',
    'ReadmeGen',
    'ChangelogBot',
    'TutorialBot',
    'SchemaDoc',
    'WikiBot',
    'DiagramBot',
    'SpecWriter',
    'StyleGuideBot',
    'JSDocBot',
    'TypeDocBot',
    'SwaggerBot',
    'PostmanBot',
    'MarkdownBot',
    'TranslateBot',
    'GlossaryBot',
    'FAQBot',
    'OnboardBot',
    'KnowledgeBot',
    'RFCWriter',
    'ADRBot',
    'RunbookBot',
    'LicenseBot',
    'ReleaseNoteBot',
    'CodeCommentBot',
    'ArchDocBot',
    'ComplianceDocBot',
    'TrainingDocBot',
  ],
  deployment: [
    'DeployMaster',
    'K8sBot',
    'DockerBot',
    'TerraformBot',
    'AnsibleBot',
    'HelmBot',
    'PipelineBot',
    'RollbackBot',
    'ScalerBot',
    'MonitorDeploy',
    'BlueGreenBot',
    'CanaryBot',
    'FeatureFlagBot',
    'SecretManager',
    'ConfigBot',
    'DNSBot',
    'CDNBot',
    'SSLBot',
    'LoadBalancer',
    'ServiceMesh',
    'GitOpsBot',
    'ArgoBot',
    'FluxBot',
    'VaultBot',
    'ConsulBot',
    'NomadBot',
    'PulumiBot',
    'CrossplaneBot',
    'IstioBot',
  ],
  analyst: [
    'DataAnalyst',
    'BIBot',
    'MetricsBot',
    'TrendAnalyst',
    'ReportGen',
    'ForecastBot',
    'SegmentBot',
    'CohortBot',
    'FunnelBot',
    'RetentionBot',
    'RevenueBot',
    'ChurnPredictor',
    'SentimentBot',
    'NLPAnalyst',
    'AnomalyBot',
    'ClusterBot',
    'RegressionBot',
    'TimeSeriesBot',
    'ABTestBot',
    'DashboardBot',
    'GeoAnalyst',
    'PricingBot',
    'DemandBot',
    'InventoryBot',
    'SupplyChainBot',
    'FraudDetector',
    'RiskScorer',
    'BenchmarkAnalyst',
    'MarketResearch',
  ],
  support: [
    'HelpDeskBot',
    'TicketRouter',
    'EscalationBot',
    'KBSearchBot',
    'ChatBot',
    'FeedbackBot',
    'SLAMonitor',
    'CustomerBot',
    'OnboardBot',
    'TrainingBot',
    'TriageBot',
    'ResponseBot',
    'SatisfactionBot',
    'SurveyBot',
    'IssueTracker',
    'StatusPageBot',
    'NotifyBot',
    'PriorityBot',
    'QueueManager',
    'AutoReply',
    'VoiceBot',
    'EmailSupportBot',
    'SocialMediaBot',
    'RetentionAgent',
    'UpsellBot',
    'RefundBot',
    'WarrantyBot',
    'LiveChatBot',
    'SentimentAgent',
  ],
  integration: [
    'APIGateway',
    'WebhookBot',
    'ETLBot',
    'SyncBot',
    'MigrationBot',
    'ConnectorBot',
    'TransformBot',
    'SchemaMapper',
    'EventBridge',
    'MessageQueue',
    'OAuthBot',
    'SSOBot',
    'PaymentBot',
    'EmailBot',
    'SlackBot',
    'JiraBot',
    'GitHubBot',
    'S3Bot',
    'RedisBot',
    'KafkaBot',
    'PubSubBot',
    'RabbitMQBot',
    'GraphQLGateway',
    'gRPCBot',
    'FTPBot',
    'SFTPBot',
    'MQTTBot',
    'DataLakeBot',
    'SnowflakeBot',
  ],
  monitoring: [
    'HealthCheck',
    'AlertManager',
    'UptimeBot',
    'LogCollector',
    'MetricStore',
    'TracingBot',
    'PrometheusBot',
    'GrafanaBot',
    'PagerBot',
    'SLATracker',
    'LatencyBot',
    'ErrorTracker',
    'ResourceBot',
    'CapacityBot',
    'CostMonitor',
    'AuditBot',
    'ComplianceMonitor',
    'DriftDetector',
    'ChangeTracker',
    'BaselineBot',
    'DatadogBot',
    'NewRelicBot',
    'SplunkBot',
    'ElasticBot',
    'JaegerBot',
    'ZipkinBot',
    'SentryBot',
    'RollbarBot',
    'IncidentManager',
  ],
};

const ROLES: Record<string, string[]> = {
  trading: ['Market Analysis', 'Risk Management', 'Portfolio Optimization', 'Signal Detection', 'Order Execution'],
  security: ['Threat Detection', 'Vulnerability Assessment', 'Access Control', 'Incident Response', 'Compliance Audit'],
  development: [
    'Code Generation',
    'Architecture Design',
    'API Development',
    'Frontend Development',
    'Backend Development',
  ],
  qa: ['Test Automation', 'Quality Assurance', 'Performance Testing', 'Security Testing', 'Regression Testing'],
  documentation: [
    'Technical Writing',
    'API Documentation',
    'User Guide Creation',
    'Knowledge Management',
    'Changelog Generation',
  ],
  deployment: [
    'Container Orchestration',
    'CI/CD Pipeline',
    'Infrastructure Management',
    'Release Management',
    'Configuration Management',
  ],
  analyst: ['Data Analysis', 'Business Intelligence', 'Forecasting', 'Metrics Collection', 'Report Generation'],
  support: ['Ticket Management', 'Customer Support', 'Knowledge Base', 'Escalation Handling', 'Feedback Processing'],
  integration: [
    'API Integration',
    'Data Synchronization',
    'Webhook Management',
    'ETL Processing',
    'Service Connection',
  ],
  monitoring: ['System Monitoring', 'Alert Management', 'Log Analysis', 'Performance Tracking', 'Health Checking'],
};

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function seedDatabase() {
  const db = getDb();

  // Check if already seeded
  const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  if (agentCount.count > 0) {
    console.log(`Database already seeded with ${agentCount.count} agents.`);
    return;
  }

  console.log('Seeding database...');

  // Demo users only — in production (no SEED_DEMO) first registrant becomes admin (see auth.ts)
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

  // Create 290 agents (29 per category)
  const insertAgent = db.prepare(`
    INSERT INTO agents (id, name, role, category, status, successRate, tasksCompleted, failedTasks, avgTaskDuration, lastActivity, systemPrompt, personality, parameters, hooks, testResults, llmProvider, llmModel, riskProfile)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const agents: { id: string; category: string }[] = [];

  const seedAgents = db.transaction(() => {
    for (const category of CATEGORIES) {
      const names = AGENT_NAMES[category];
      const roles = ROLES[category];
      for (let i = 0; i < names.length; i++) {
        const id = uuid();
        const name = names[i];
        const role = roles[i % roles.length];
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
        const successRate = 75 + Math.random() * 25;
        const tasksCompleted = Math.floor(50 + Math.random() * 200);
        const failedTasks = Math.floor(Math.random() * 20);
        const avgTaskDuration = 30 + Math.random() * 300;
        const archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
        const commStyle = COMM_STYLES[Math.floor(Math.random() * COMM_STYLES.length)];

        const personality = JSON.stringify({
          creativity: +(Math.random() * 10).toFixed(1),
          analyticalDepth: +(Math.random() * 10).toFixed(1),
          riskTolerance: +(Math.random() * 10).toFixed(1),
          communicationStyle: commStyle,
          archetype,
          domainFocus: category,
        });

        const parameters = JSON.stringify({
          temperature: +(0.3 + Math.random() * 0.7).toFixed(2),
          maxTokens: [2048, 4096, 8192, 16384][Math.floor(Math.random() * 4)],
          topP: +(0.8 + Math.random() * 0.2).toFixed(2),
          frequencyPenalty: +(Math.random() * 0.5).toFixed(2),
          presencePenalty: +(Math.random() * 0.5).toFixed(2),
        });

        const riskProfile = JSON.stringify({
          riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          maxConcurrentTasks: Math.floor(3 + Math.random() * 7),
          maxTokenBudget: Math.floor(50000 + Math.random() * 450000),
          autoSuspendOnFailure: Math.random() > 0.5,
          failureThreshold: Math.floor(3 + Math.random() * 7),
          cooldownPeriod: Math.floor(60 + Math.random() * 240),
          requiresApproval: Math.random() > 0.7,
        });

        insertAgent.run(
          id,
          name,
          role,
          category,
          status,
          +successRate.toFixed(1),
          tasksCompleted,
          failedTasks,
          +avgTaskDuration.toFixed(0),
          new Date(Date.now() - Math.random() * 86400000).toISOString(),
          `Du bist ${name}, ein spezialisierter ${role}-Agent der Kategorie ${category}. Arbeite präzise und effizient.`,
          personality,
          parameters,
          '[]',
          '[]',
          'anthropic',
          'claude-sonnet-4-5-20250929',
          riskProfile,
        );
        agents.push({ id, category });
      }
    }
  });
  seedAgents();

  // Create 80 tasks
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
  };

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, assignedAgentId, category, kanbanColumn, tags, taskType, progress, estimatedHours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTasks = db.transaction(() => {
    for (const category of CATEGORIES) {
      const titles = TASK_TITLES[category];
      const categoryAgents = agents.filter((a) => a.category === category);
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

  // Create sample workflows
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
      // Set proper step dependencies (sequential)
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

  // Create sample security events
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
    { type: 'anomaly', severity: 'high', message: 'Unusual API call pattern from TradeMaster agent', resolved: 0 },
    { type: 'access', severity: 'low', message: 'Permission upgrade requested by CodeArchitect', resolved: 1 },
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

  console.log(`Database seeded: ${agents.length} agents, 80 tasks, 3 workflows, 5 security events, 2 demo users`);
}
