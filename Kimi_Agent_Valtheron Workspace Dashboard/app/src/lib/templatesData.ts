export type TemplateCategory = 'content' | 'data' | 'code';
export type Complexity = 'Easy' | 'Medium' | 'Advanced';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  complexity: Complexity;
  agents: string[];
  uses: number;
  successRate: string;
  avgExecTime: string;
  lastRun: string;
}

export interface SharedWorkflow {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  status: 'Active' | 'Draft' | 'Archived' | 'Review';
  owner: { name: string; avatar: string; initials: string; color: string };
  modifiedAgo: string;
  collaborators: { name: string; initials: string; color: string }[];
  shareStatus: 'public' | 'team' | 'private';
  forks: number;
}

export interface ActivityEvent {
  id: string;
  actor: { name: string; initials: string; color: string };
  action: 'created' | 'updated' | 'commented' | 'shared' | 'deleted' | 'deployed';
  target: string;
  targetType: 'workflow' | 'agent';
  detail: string;
  time: string;
}

export interface CommentReply {
  id: string;
  author: { name: string; initials: string; color: string };
  text: string;
  time: string;
}

export interface CommentThread {
  id: string;
  author: { name: string; initials: string; color: string };
  workflowName: string;
  text: string;
  time: string;
  resolved: boolean;
  reactions: { emoji: string; count: number; users: string[] }[];
  replies: CommentReply[];
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  workflowsShared: number;
  lastActive: string;
  presence: 'online' | 'away' | 'offline' | 'busy';
  statusText: string;
}

export const templates: Template[] = [
  {
    id: 't1',
    name: 'Blog Article Pipeline',
    description: 'Research, draft, edit, and publish blog articles end-to-end with SEO optimization.',
    category: 'content',
    complexity: 'Easy',
    agents: ['ContentBot-05', 'ResearchAgent-01', 'SEOTool-02'],
    uses: 312,
    successRate: '99.1%',
    avgExecTime: '4m 32s',
    lastRun: '2 min ago',
  },
  {
    id: 't2',
    name: 'Social Media Campaign Generator',
    description: 'Generate multi-platform social media content calendars with image suggestions.',
    category: 'content',
    complexity: 'Medium',
    agents: ['SocialBot-03', 'ImageGen-04', 'ContentBot-05'],
    uses: 198,
    successRate: '97.8%',
    avgExecTime: '6m 15s',
    lastRun: '15 min ago',
  },
  {
    id: 't3',
    name: 'Technical Documentation Writer',
    description: 'Auto-generate API documentation and developer guides from code repositories.',
    category: 'content',
    complexity: 'Medium',
    agents: ['DocWriter-06', 'CodeParser-07', 'TechReview-08'],
    uses: 156,
    successRate: '98.4%',
    avgExecTime: '5m 48s',
    lastRun: '1h ago',
  },
  {
    id: 't4',
    name: 'Newsletter Composer',
    description: 'Compile, summarize, and format weekly newsletters from multiple data sources.',
    category: 'content',
    complexity: 'Easy',
    agents: ['ContentBot-05', 'Summarizer-09', 'Formatter-10'],
    uses: 89,
    successRate: '99.6%',
    avgExecTime: '3m 20s',
    lastRun: '3h ago',
  },
  {
    id: 't5',
    name: 'Sales Dashboard Pipeline',
    description: 'Ingest sales data, generate KPIs, build interactive dashboards, and email reports.',
    category: 'data',
    complexity: 'Medium',
    agents: ['DataAnalyzer-07', 'ChartGen-11', 'ReportBot-12'],
    uses: 267,
    successRate: '98.9%',
    avgExecTime: '7m 10s',
    lastRun: '5 min ago',
  },
  {
    id: 't6',
    name: 'Customer Segmentation Flow',
    description: 'Apply clustering algorithms to segment customers and generate targeted strategies.',
    category: 'data',
    complexity: 'Advanced',
    agents: ['MLAgent-13', 'DataAnalyzer-07', 'StrategyBot-14'],
    uses: 134,
    successRate: '96.2%',
    avgExecTime: '12m 45s',
    lastRun: '30 min ago',
  },
  {
    id: 't7',
    name: 'Anomaly Detection Monitor',
    description: 'Continuously monitor data streams for anomalies and trigger alert workflows.',
    category: 'data',
    complexity: 'Advanced',
    agents: ['StreamAgent-15', 'AnomalyBot-16', 'AlertManager-17'],
    uses: 78,
    successRate: '97.5%',
    avgExecTime: '15m 20s',
    lastRun: '2h ago',
  },
  {
    id: 't8',
    name: 'Report Generator Pro',
    description: 'Transform raw CSV/JSON data into formatted PDF/Excel reports with charts.',
    category: 'data',
    complexity: 'Easy',
    agents: ['DataAnalyzer-07', 'VizEngine-18', 'ExportBot-19'],
    uses: 423,
    successRate: '99.3%',
    avgExecTime: '4m 55s',
    lastRun: '10 min ago',
  },
  {
    id: 't9',
    name: 'API Scaffold Builder',
    description: 'Generate complete REST API scaffolding from OpenAPI specifications.',
    category: 'code',
    complexity: 'Medium',
    agents: ['CodeGen-12', 'ArchBot-20', 'TestGen-21'],
    uses: 189,
    successRate: '97.1%',
    avgExecTime: '8m 30s',
    lastRun: '20 min ago',
  },
  {
    id: 't10',
    name: 'Frontend Component Factory',
    description: 'Generate React/Vue components from design descriptions or Figma specs.',
    category: 'code',
    complexity: 'Medium',
    agents: ['CodeGen-12', 'UIAgent-22', 'StyleBot-23'],
    uses: 234,
    successRate: '96.8%',
    avgExecTime: '9m 12s',
    lastRun: '45 min ago',
  },
  {
    id: 't11',
    name: 'Database Migration Assistant',
    description: 'Generate schema migration scripts with rollback support and data validation.',
    category: 'code',
    complexity: 'Advanced',
    agents: ['DBAgent-24', 'CodeGen-12', 'Validator-25'],
    uses: 112,
    successRate: '95.4%',
    avgExecTime: '11m 40s',
    lastRun: '1h ago',
  },
  {
    id: 't12',
    name: 'CI/CD Pipeline Generator',
    description: 'Generate complete CI/CD pipeline configurations for Docker, K8s, and cloud deploy.',
    category: 'code',
    complexity: 'Advanced',
    agents: ['DevOpsBot-26', 'CodeGen-12', 'ConfigGen-27'],
    uses: 67,
    successRate: '94.8%',
    avgExecTime: '14m 05s',
    lastRun: '3h ago',
  },
];

export const sharedWorkflows: SharedWorkflow[] = [
  {
    id: 'sw1',
    name: 'Q4 Marketing Pipeline',
    description: 'End-to-end marketing workflow for Q4 campaign planning and execution.',
    category: 'content',
    status: 'Active',
    owner: { name: 'sarah.k', avatar: '', initials: 'SK', color: '#3DDC97' },
    modifiedAgo: '2h ago',
    collaborators: [
      { name: 'sarah.k', initials: 'SK', color: '#3DDC97' },
      { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
      { name: 'jordan.w', initials: 'JW', color: '#A78BFA' },
      { name: 'priya.r', initials: 'PR', color: '#F5A623' },
      { name: 'dr.chen', initials: 'DC', color: '#EF4444' },
    ],
    shareStatus: 'team',
    forks: 12,
  },
  {
    id: 'sw2',
    name: 'Customer Churn Predictor',
    description: 'ML-powered workflow to predict and prevent customer churn.',
    category: 'data',
    status: 'Active',
    owner: { name: 'alex.m', avatar: '', initials: 'AM', color: '#5B8DEF' },
    modifiedAgo: '5h ago',
    collaborators: [
      { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
      { name: 'dr.chen', initials: 'DC', color: '#EF4444' },
      { name: 'sarah.k', initials: 'SK', color: '#3DDC97' },
    ],
    shareStatus: 'team',
    forks: 8,
  },
  {
    id: 'sw3',
    name: 'API Documentation Auto-Gen',
    description: 'Automatically generate API docs from OpenAPI specs and code comments.',
    category: 'code',
    status: 'Draft',
    owner: { name: 'jordan.w', avatar: '', initials: 'JW', color: '#A78BFA' },
    modifiedAgo: '1d ago',
    collaborators: [
      { name: 'jordan.w', initials: 'JW', color: '#A78BFA' },
      { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
    ],
    shareStatus: 'private',
    forks: 3,
  },
  {
    id: 'sw4',
    name: 'Security Audit Flow',
    description: 'Comprehensive security audit workflow with automated vulnerability scanning.',
    category: 'code',
    status: 'Active',
    owner: { name: 'priya.r', avatar: '', initials: 'PR', color: '#F5A623' },
    modifiedAgo: '1d ago',
    collaborators: [
      { name: 'priya.r', initials: 'PR', color: '#F5A623' },
      { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
    ],
    shareStatus: 'team',
    forks: 6,
  },
  {
    id: 'sw5',
    name: 'Onboarding Email Sequence',
    description: 'Automated user onboarding email series with personalization.',
    category: 'content',
    status: 'Archived',
    owner: { name: 'sarah.k', avatar: '', initials: 'SK', color: '#3DDC97' },
    modifiedAgo: '2d ago',
    collaborators: [
      { name: 'sarah.k', initials: 'SK', color: '#3DDC97' },
      { name: 'jordan.w', initials: 'JW', color: '#A78BFA' },
    ],
    shareStatus: 'public',
    forks: 15,
  },
  {
    id: 'sw6',
    name: 'Data Quality Monitor',
    description: 'Continuous data quality checks with alerting and remediation.',
    category: 'data',
    status: 'Active',
    owner: { name: 'dr.chen', avatar: '', initials: 'DC', color: '#EF4444' },
    modifiedAgo: '3d ago',
    collaborators: [
      { name: 'dr.chen', initials: 'DC', color: '#EF4444' },
      { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
      { name: 'priya.r', initials: 'PR', color: '#F5A623' },
    ],
    shareStatus: 'team',
    forks: 4,
  },
  {
    id: 'sw7',
    name: 'Incident Response Bot',
    description: 'Automated incident response with escalation and reporting.',
    category: 'code',
    status: 'Review',
    owner: { name: 'priya.r', avatar: '', initials: 'PR', color: '#F5A623' },
    modifiedAgo: '4d ago',
    collaborators: [
      { name: 'priya.r', initials: 'PR', color: '#F5A623' },
      { name: 'sarah.k', initials: 'SK', color: '#3DDC97' },
    ],
    shareStatus: 'private',
    forks: 2,
  },
  {
    id: 'sw8',
    name: 'Revenue Forecast Model',
    description: 'Predictive revenue modeling with scenario analysis and reporting.',
    category: 'data',
    status: 'Active',
    owner: { name: 'alex.m', avatar: '', initials: 'AM', color: '#5B8DEF' },
    modifiedAgo: '1w ago',
    collaborators: [
      { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
      { name: 'dr.chen', initials: 'DC', color: '#EF4444' },
      { name: 'sarah.k', initials: 'SK', color: '#3DDC97' },
      { name: 'jordan.w', initials: 'JW', color: '#A78BFA' },
      { name: 'priya.r', initials: 'PR', color: '#F5A623' },
    ],
    shareStatus: 'team',
    forks: 9,
  },
];

export const activityEvents: ActivityEvent[] = [
  {
    id: 'a1',
    actor: { name: 'sarah.k', initials: 'SK', color: '#3DDC97' },
    action: 'shared',
    target: 'Q4 Marketing Pipeline',
    targetType: 'workflow',
    detail: 'Added 3 new agents to the flow',
    time: '2 min ago',
  },
  {
    id: 'a2',
    actor: { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
    action: 'deployed',
    target: 'DataAnalyzer-07',
    targetType: 'agent',
    detail: 'Success rate: 99.2%',
    time: '5 min ago',
  },
  {
    id: 'a3',
    actor: { name: 'jordan.w', initials: 'JW', color: '#A78BFA' },
    action: 'commented',
    target: 'API Documentation Auto-Gen',
    targetType: 'workflow',
    detail: 'Should we add a validation step here?',
    time: '8 min ago',
  },
  {
    id: 'a4',
    actor: { name: 'priya.r', initials: 'PR', color: '#F5A623' },
    action: 'created',
    target: 'Security Audit Flow v2',
    targetType: 'workflow',
    detail: 'Based on feedback from last week\'s review',
    time: '12 min ago',
  },
  {
    id: 'a5',
    actor: { name: 'dr.chen', initials: 'DC', color: '#EF4444' },
    action: 'updated',
    target: 'MLAgent-13',
    targetType: 'agent',
    detail: 'Creativity: 0.7 → 0.8, Detail: high → max',
    time: '18 min ago',
  },
  {
    id: 'a6',
    actor: { name: 'sarah.k', initials: 'SK', color: '#3DDC97' },
    action: 'commented',
    target: 'Revenue Forecast Model',
    targetType: 'workflow',
    detail: 'The new data source is performing well',
    time: '22 min ago',
  },
  {
    id: 'a7',
    actor: { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
    action: 'deleted',
    target: 'Test Pipeline Alpha',
    targetType: 'workflow',
    detail: 'Superseded by Beta version',
    time: '34 min ago',
  },
  {
    id: 'a8',
    actor: { name: 'jordan.w', initials: 'JW', color: '#A78BFA' },
    action: 'shared',
    target: 'CodeGen-12',
    targetType: 'agent',
    detail: 'New code style preset available',
    time: '45 min ago',
  },
  {
    id: 'a9',
    actor: { name: 'priya.r', initials: 'PR', color: '#F5A623' },
    action: 'updated',
    target: 'Incident Response Bot',
    targetType: 'workflow',
    detail: 'Added escalation trigger for P0 incidents',
    time: '1h ago',
  },
  {
    id: 'a10',
    actor: { name: 'dr.chen', initials: 'DC', color: '#EF4444' },
    action: 'created',
    target: 'Data Quality Monitor',
    targetType: 'workflow',
    detail: 'Automated DQ checks for all pipelines',
    time: '1h ago',
  },
];

export const commentThreads: CommentThread[] = [
  {
    id: 'c1',
    author: { name: 'sarah.k', initials: 'SK', color: '#3DDC97' },
    workflowName: 'Q4 Marketing Pipeline',
    text: 'The new content generation step is producing excellent results. Should we add a manual review checkpoint before publishing?',
    time: '2h ago',
    resolved: false,
    reactions: [{ emoji: 'thumbsUp', count: 3, users: ['alex.m', 'jordan.w', 'priya.r'] }],
    replies: [
      {
        id: 'c1r1',
        author: { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
        text: 'Agreed. I\'ll add a reviewer agent with high detail settings.',
        time: '1h ago',
      },
      {
        id: 'c1r2',
        author: { name: 'jordan.w', initials: 'JW', color: '#A78BFA' },
        text: 'Maybe also flag posts with sentiment score < 0.7 for manual review?',
        time: '45 min ago',
      },
    ],
  },
  {
    id: 'c2',
    author: { name: 'dr.chen', initials: 'DC', color: '#EF4444' },
    workflowName: 'Customer Churn Predictor',
    text: 'The model accuracy dropped to 94.1% after the last data refresh. Investigating.',
    time: '5h ago',
    resolved: false,
    reactions: [{ emoji: 'thumbsUp', count: 1, users: ['alex.m'] }],
    replies: [
      {
        id: 'c2r1',
        author: { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
        text: 'I noticed some schema changes in the source. Might be related.',
        time: '4h ago',
      },
    ],
  },
  {
    id: 'c3',
    author: { name: 'priya.r', initials: 'PR', color: '#F5A623' },
    workflowName: 'API Documentation Auto-Gen',
    text: 'Added authentication section to all generated docs. This is now resolved.',
    time: '1d ago',
    resolved: true,
    reactions: [{ emoji: 'thumbsUp', count: 5, users: ['sarah.k', 'alex.m', 'jordan.w', 'dr.chen', 'sarah.k'] }],
    replies: [],
  },
  {
    id: 'c4',
    author: { name: 'jordan.w', initials: 'JW', color: '#A78BFA' },
    workflowName: 'Incident Response Bot',
    text: 'The escalation trigger should also notify via Slack, not just email.',
    time: '8h ago',
    resolved: false,
    reactions: [{ emoji: 'thumbsUp', count: 2, users: ['priya.r', 'sarah.k'] }],
    replies: [
      {
        id: 'c4r1',
        author: { name: 'priya.r', initials: 'PR', color: '#F5A623' },
        text: 'Good point. I\'ll add a webhook configuration for Slack.',
        time: '6h ago',
      },
    ],
  },
  {
    id: 'c5',
    author: { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
    workflowName: 'Sales Dashboard Pipeline',
    text: 'Can we add a toggle to switch between weekly and monthly views in the dashboard?',
    time: '3h ago',
    resolved: false,
    reactions: [{ emoji: 'thumbsUp', count: 2, users: ['sarah.k', 'dr.chen'] }],
    replies: [],
  },
  {
    id: 'c6',
    author: { name: 'sarah.k', initials: 'SK', color: '#3DDC97' },
    workflowName: 'Revenue Forecast Model',
    text: 'Updated the forecast interval from daily to weekly. Results look much more stable now.',
    time: '6h ago',
    resolved: true,
    reactions: [{ emoji: 'thumbsUp', count: 4, users: ['alex.m', 'dr.chen', 'priya.r'] }],
    replies: [
      {
        id: 'c6r1',
        author: { name: 'dr.chen', initials: 'DC', color: '#EF4444' },
        text: 'The confidence intervals also improved. Nice work.',
        time: '5h ago',
      },
    ],
  },
  {
    id: 'c7',
    author: { name: 'priya.r', initials: 'PR', color: '#F5A623' },
    workflowName: 'Security Audit Flow',
    text: 'Found a false positive in the XSS detection module. Excluding script tags in markdown content.',
    time: '12h ago',
    resolved: false,
    reactions: [{ emoji: 'thumbsUp', count: 1, users: ['jordan.w'] }],
    replies: [],
  },
  {
    id: 'c8',
    author: { name: 'jordan.w', initials: 'JW', color: '#A78BFA' },
    workflowName: 'Frontend Component Factory',
    text: 'Added support for Tailwind v4 configuration in generated components.',
    time: '1d ago',
    resolved: true,
    reactions: [{ emoji: 'thumbsUp', count: 3, users: ['alex.m', 'priya.r'] }],
    replies: [
      {
        id: 'c8r1',
        author: { name: 'alex.m', initials: 'AM', color: '#5B8DEF' },
        text: 'Does this include the new color system?',
        time: '20h ago',
      },
      {
        id: 'c8r2',
        author: { name: 'jordan.w', initials: 'JW', color: '#A78BFA' },
        text: 'Yes, full support for CSS custom properties and oklch colors.',
        time: '18h ago',
      },
    ],
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: 'm1',
    name: 'sarah.k',
    initials: 'SK',
    color: '#3DDC97',
    role: 'Admin',
    workflowsShared: 12,
    lastActive: 'Now',
    presence: 'online',
    statusText: 'Editing Q4 Marketing Pipeline',
  },
  {
    id: 'm2',
    name: 'alex.m',
    initials: 'AM',
    color: '#5B8DEF',
    role: 'Editor',
    workflowsShared: 8,
    lastActive: '5 min ago',
    presence: 'online',
    statusText: 'Monitoring dashboard',
  },
  {
    id: 'm3',
    name: 'jordan.w',
    initials: 'JW',
    color: '#A78BFA',
    role: 'Editor',
    workflowsShared: 6,
    lastActive: '15 min ago',
    presence: 'away',
    statusText: 'Idle',
  },
  {
    id: 'm4',
    name: 'priya.r',
    initials: 'PR',
    color: '#F5A623',
    role: 'Viewer',
    workflowsShared: 4,
    lastActive: '1h ago',
    presence: 'busy',
    statusText: 'Reviewing incident logs',
  },
  {
    id: 'm5',
    name: 'dr.chen',
    initials: 'DC',
    color: '#EF4444',
    role: 'Editor',
    workflowsShared: 10,
    lastActive: 'Now',
    presence: 'online',
    statusText: 'Running data analysis',
  },
  {
    id: 'm6',
    name: 'tom.b',
    initials: 'TB',
    color: '#6B7280',
    role: 'Viewer',
    workflowsShared: 2,
    lastActive: '2d ago',
    presence: 'offline',
    statusText: 'Offline',
  },
];

export const agentOptions = [
  'ContentBot-05',
  'ResearchAgent-01',
  'SEOTool-02',
  'SocialBot-03',
  'ImageGen-04',
  'DocWriter-06',
  'CodeParser-07',
  'DataAnalyzer-07',
  'MLAgent-13',
  'CodeGen-12',
  'ArchBot-20',
  'UIAgent-22',
  'DevOpsBot-26',
];
