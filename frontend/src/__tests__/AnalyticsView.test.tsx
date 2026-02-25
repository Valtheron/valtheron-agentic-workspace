import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalyticsView from '../components/AnalyticsView';
import type { AnalyticsData, Agent, Task } from '../types';

const mockAnalytics: AnalyticsData = {
  totalAgents: 20,
  activeAgents: 15,
  tasksToday: 35,
  successRate: 95.0,
  avgResponseTime: 160,
  tasksTrend: Array.from({ length: 7 }, (_, i) => ({ date: `2024-01-0${i + 1}`, count: 10 + i })),
  categoryDistribution: [
    { category: 'development', count: 8 },
    { category: 'qa', count: 5 },
  ],
  topPerformers: [{ agentId: 'a1', name: 'Top Agent', score: 99 }],
  errorRate: 5.0,
  uptime: 99.5,
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

describe('AnalyticsView', () => {
  const defaultProps = {
    analytics: mockAnalytics,
    agents: mockAgents,
    tasks: mockTasks,
  };

  it('renders all 6 tabs', () => {
    render(<AnalyticsView {...defaultProps} />);
    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
    expect(screen.getByText('Durchsatz')).toBeInTheDocument();
    expect(screen.getByText('Fehlerrate')).toBeInTheDocument();
    expect(screen.getByText('Capacity Planning')).toBeInTheDocument();
    expect(screen.getByText('SLA Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Erfolgsrate')).toBeInTheDocument();
  });

  it('shows KPI cards in trends tab', () => {
    render(<AnalyticsView {...defaultProps} />);
    expect(screen.getByText('Avg Durchsatz (30d)')).toBeInTheDocument();
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
    expect(screen.getByText('Avg Erfolgsrate')).toBeInTheDocument();
    expect(screen.getByText('Avg Fehlerrate')).toBeInTheDocument();
  });

  it('shows trend charts', () => {
    render(<AnalyticsView {...defaultProps} />);
    expect(screen.getByText('Durchsatz Trend (30 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Response Time Trend (30 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Erfolgsrate Trend (30 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Aktive Agenten (30 Tage)')).toBeInTheDocument();
  });

  it('switches to throughput tab', () => {
    render(<AnalyticsView {...defaultProps} />);
    fireEvent.click(screen.getByText('Durchsatz'));
    expect(screen.getByText('Agent-Durchsatz ueber Zeit (30 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Durchsatz pro Kategorie')).toBeInTheDocument();
    expect(screen.getByText('Top 10 Agenten nach Tasks')).toBeInTheDocument();
  });

  it('switches to errors tab', () => {
    render(<AnalyticsView {...defaultProps} />);
    fireEvent.click(screen.getByText('Fehlerrate'));
    expect(screen.getByText('Fehlerrate ueber Zeit (30 Tage)')).toBeInTheDocument();
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

  it('switches to SLA tab', () => {
    render(<AnalyticsView {...defaultProps} />);
    fireEvent.click(screen.getByText('SLA Monitoring'));
    expect(screen.getByText('Response Time')).toBeInTheDocument();
    expect(screen.getByText('System Uptime')).toBeInTheDocument();
  });

  it('switches to success tab', () => {
    render(<AnalyticsView {...defaultProps} />);
    fireEvent.click(screen.getByText('Erfolgsrate'));
    expect(screen.getByText('Agent Success Rate Trend (30 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Erfolgsrate pro Agent (Top 20)')).toBeInTheDocument();
  });

  it('shows agent names in success tab', () => {
    render(<AnalyticsView {...defaultProps} />);
    fireEvent.click(screen.getByText('Erfolgsrate'));
    expect(screen.getByText('Dev Alpha')).toBeInTheDocument();
    expect(screen.getByText('QA Beta')).toBeInTheDocument();
  });

  it('renders with empty agents', () => {
    render(<AnalyticsView analytics={mockAnalytics} agents={[]} tasks={[]} />);
    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
  });
});
