import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalyticsView from '../components/AnalyticsView';
import type { AnalyticsData, Agent, Task } from '../types';

vi.mock('../services/api', () => ({
  analyticsAPI: {
    performance: vi.fn(),
    sla: vi.fn(),
  },
}));

import { analyticsAPI } from '../services/api';

const mockAnalytics: AnalyticsData = {
  totalAgents: 20,
  activeAgents: 15,
  tasksToday: 35,
  tasksTotal: 180,
  successRate: 95.0,
  avgResponseTime: 160,
  tasksTrend: Array.from({ length: 7 }, (_, i) => ({ date: `2024-01-0${i + 1}`, count: 10 + i })),
  categoryDistribution: [
    { category: 'development', count: 8 },
    { category: 'qa', count: 5 },
  ],
  topPerformers: [{ agentId: 'a1', name: 'Top Agent', score: 99 }],
  errorRate: 5.0,
  uptimeSeconds: 86400 * 30,
};

const mockAgents: Agent[] = [
  {
    id: 'a1',
    name: 'Dev Alpha',
    role: 'Dev',
    category: 'development',
    status: 'active',
    successRate: 97,
    tasksCompleted: 150,
    failedTasks: 5,
    avgTaskDuration: 100,
    currentTask: null,
    lastActivity: '2024-01-01',
    systemPrompt: 'dev',
    personality: {
      creativity: 70,
      analyticalDepth: 80,
      riskTolerance: 50,
      communicationStyle: 'technical',
      archetype: 'analytiker',
      domainFocus: 'dev',
    },
    parameters: { temperature: 0.7, maxTokens: 4096, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
    createdAt: '2024-01-01',
    hooks: [],
    testResults: [],
  },
  {
    id: 'a2',
    name: 'QA Beta',
    role: 'QA',
    category: 'qa',
    status: 'idle',
    successRate: 92,
    tasksCompleted: 80,
    failedTasks: 7,
    avgTaskDuration: 90,
    currentTask: null,
    lastActivity: '2024-01-01',
    systemPrompt: 'qa',
    personality: {
      creativity: 50,
      analyticalDepth: 90,
      riskTolerance: 30,
      communicationStyle: 'formal',
      archetype: 'analytiker',
      domainFocus: 'qa',
    },
    parameters: { temperature: 0.5, maxTokens: 4096, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
    createdAt: '2024-01-01',
    hooks: [],
    testResults: [],
  },
];

const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Task 1',
    description: '',
    status: 'completed',
    priority: 'high',
    assignedAgentId: 'a1',
    category: 'development',
    createdAt: '2024-01-01',
    dependencies: [],
    kanbanColumn: 'done',
    tags: [],
  },
];

const mockTrends = Array.from({ length: 7 }, (_, i) => ({
  date: `2024-01-0${i + 1}`,
  throughput: 10 + i,
  errorRate: 2 + i * 0.1,
  avgResponseTime: 150,
  successRate: 95,
  activeAgents: 12,
}));

const mockSlas = [
  {
    id: 'sla-1',
    name: 'Response Time',
    metric: 'response_time',
    threshold: 200,
    unit: 'ms',
    current: 150,
    status: 'met',
    period: 'hourly',
    history: [],
  },
  {
    id: 'sla-3',
    name: 'System Uptime',
    metric: 'uptime',
    threshold: 99.5,
    unit: '%',
    current: 99.9,
    status: 'met',
    period: 'monthly',
    history: [],
  },
];

describe('AnalyticsView', () => {
  const defaultProps = {
    analytics: mockAnalytics,
    agents: mockAgents,
    tasks: mockTasks,
  };

  beforeEach(() => {
    vi.mocked(analyticsAPI.performance).mockResolvedValue({ trends: mockTrends });
    vi.mocked(analyticsAPI.sla).mockResolvedValue({ sla: mockSlas });
  });

  it('renders all 6 tabs', () => {
    render(<AnalyticsView {...defaultProps} />);
    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
    expect(screen.getByText('Durchsatz')).toBeInTheDocument();
    expect(screen.getByText('Fehlerrate')).toBeInTheDocument();
    expect(screen.getByText('Capacity Planning')).toBeInTheDocument();
    expect(screen.getByText('SLA Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Erfolgsrate')).toBeInTheDocument();
  });

  it('shows KPI cards in trends tab', async () => {
    render(<AnalyticsView {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Avg Durchsatz (7d)')).toBeInTheDocument());
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
    expect(screen.getByText('Avg Erfolgsrate')).toBeInTheDocument();
    expect(screen.getByText('Avg Fehlerrate')).toBeInTheDocument();
  });

  it('shows trend charts', async () => {
    render(<AnalyticsView {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Durchsatz Trend (7 Tage)')).toBeInTheDocument());
    expect(screen.getByText('Response Time Trend (7 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Erfolgsrate Trend (7 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Aktive Agenten (7 Tage)')).toBeInTheDocument();
  });

  it('switches to throughput tab', async () => {
    render(<AnalyticsView {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Avg Durchsatz (7d)')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Durchsatz'));
    expect(screen.getByText('Agent-Durchsatz über Zeit (7 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Durchsatz pro Kategorie')).toBeInTheDocument();
    expect(screen.getByText('Top 10 Agenten nach Tasks')).toBeInTheDocument();
  });

  it('switches to errors tab', async () => {
    render(<AnalyticsView {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Avg Durchsatz (7d)')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Fehlerrate'));
    expect(screen.getByText('Fehlerrate über Zeit (7 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Fehler pro Kategorie')).toBeInTheDocument();
    expect(screen.getByText('Agenten mit hoechster Fehlerrate')).toBeInTheDocument();
  });

  it('switches to capacity tab', () => {
    render(<AnalyticsView {...defaultProps} />);
    fireEvent.click(screen.getByText('Capacity Planning'));
    expect(screen.getByText('Total Agenten')).toBeInTheDocument();
    expect(screen.getByText('Auslastung')).toBeInTheDocument();
    expect(screen.getByText('Idle Agenten')).toBeInTheDocument();
    expect(screen.getByText('Kapazitaet pro Kategorie')).toBeInTheDocument();
  });

  it('switches to SLA tab', async () => {
    render(<AnalyticsView {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Avg Durchsatz (7d)')).toBeInTheDocument());
    fireEvent.click(screen.getByText('SLA Monitoring'));
    await waitFor(() => expect(screen.getByText('Response Time')).toBeInTheDocument());
    expect(screen.getByText('System Uptime')).toBeInTheDocument();
  });

  it('switches to success tab', async () => {
    render(<AnalyticsView {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Avg Durchsatz (7d)')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Erfolgsrate'));
    expect(screen.getByText('Agent Success Rate Trend (7 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Erfolgsrate pro Agent (Top 20)')).toBeInTheDocument();
  });

  it('shows agent names in success tab', async () => {
    render(<AnalyticsView {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Avg Durchsatz (7d)')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Erfolgsrate'));
    expect(screen.getByText('Dev Alpha')).toBeInTheDocument();
    expect(screen.getByText('QA Beta')).toBeInTheDocument();
  });

  it('renders with empty agents', () => {
    render(<AnalyticsView analytics={mockAnalytics} agents={[]} tasks={[]} />);
    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
  });
});
