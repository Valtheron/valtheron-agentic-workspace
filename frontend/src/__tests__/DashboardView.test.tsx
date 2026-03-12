import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardView from '../components/DashboardView';
import type { AnalyticsData, KillSwitch, SecurityEvent, Agent } from '../types';

const mockAnalytics: AnalyticsData = {
  totalAgents: 25,
  activeAgents: 18,
  tasksToday: 42,
  successRate: 96.5,
  avgResponseTime: 145,
  tasksTrend: [
    { date: '2024-01-01', count: 10 },
    { date: '2024-01-02', count: 15 },
    { date: '2024-01-03', count: 12 },
  ],
  categoryDistribution: [
    { category: 'development', count: 8 },
    { category: 'qa', count: 5 },
    { category: 'security', count: 4 },
  ],
  topPerformers: [
    { agentId: 'a1', name: 'Alpha Agent', score: 98 },
    { agentId: 'a2', name: 'Beta Agent', score: 95 },
  ],
  errorRate: 3.5,
  uptime: 99.9,
};

const mockKillSwitch: KillSwitch = {
  aktiv: false,
  affectedAgents: ['a1', 'a2'],
  autoTriggerRules: [
    { id: 'r1', name: 'Error Rate Spike', condition: 'error_rate > 10%', enabled: true },
    { id: 'r2', name: 'Agent Cascade', condition: 'failed_agents > 5', enabled: false },
  ],
};

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: 'se1',
    type: 'auth',
    severity: 'critical',
    message: 'Brute force attempt',
    timestamp: '2024-01-01T12:00:00Z',
    resolved: false,
  },
  {
    id: 'se2',
    type: 'access',
    severity: 'medium',
    message: 'Unauthorized access',
    timestamp: '2024-01-01T11:00:00Z',
    resolved: true,
  },
];

const mockAgents: Agent[] = [
  {
    id: 'a1',
    name: 'Alpha',
    role: 'Developer',
    category: 'development',
    status: 'active',
    successRate: 98,
    tasksCompleted: 100,
    failedTasks: 2,
    avgTaskDuration: 120,
    currentTask: null,
    lastActivity: '2024-01-01',
    systemPrompt: 'test',
    personality: {
      creativity: 80,
      analyticalDepth: 70,
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
    name: 'Beta',
    role: 'QA',
    category: 'qa',
    status: 'idle',
    successRate: 95,
    tasksCompleted: 80,
    failedTasks: 4,
    avgTaskDuration: 90,
    currentTask: null,
    lastActivity: '2024-01-01',
    systemPrompt: 'test',
    personality: {
      creativity: 60,
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

describe('DashboardView', () => {
  const onToggleKillSwitch = vi.fn();

  const defaultProps = {
    analytics: mockAnalytics,
    killSwitch: mockKillSwitch,
    securityEvents: mockSecurityEvents,
    agents: mockAgents,
    onToggleKillSwitch,
  };

  it('renders all KPI cards', () => {
    render(<DashboardView {...defaultProps} />);
    expect(screen.getByText('Agenten Total')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('18 aktiv')).toBeInTheDocument();
    expect(screen.getByText('Tasks Heute')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Erfolgsrate')).toBeInTheDocument();
    expect(screen.getByText('96.5%')).toBeInTheDocument();
    expect(screen.getByText('Fehlerrate')).toBeInTheDocument();
    expect(screen.getByText('3.5%')).toBeInTheDocument();
    expect(screen.getByText('Uptime')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
  });

  it('renders task trend bars', () => {
    render(<DashboardView {...defaultProps} />);
    expect(screen.getByText('Tasks Trend (7 Tage)')).toBeInTheDocument();
  });

  it('renders category distribution', () => {
    render(<DashboardView {...defaultProps} />);
    expect(screen.getByText('Kategorie-Verteilung')).toBeInTheDocument();
    expect(screen.getByText('development')).toBeInTheDocument();
    expect(screen.getByText('qa')).toBeInTheDocument();
    expect(screen.getByText('security')).toBeInTheDocument();
  });

  it('renders security events', () => {
    render(<DashboardView {...defaultProps} />);
    expect(screen.getByText('Security Events')).toBeInTheDocument();
    expect(screen.getByText('Brute force attempt')).toBeInTheDocument();
    expect(screen.getByText('Unauthorized access')).toBeInTheDocument();
    expect(screen.getByText('1 offen')).toBeInTheDocument();
  });

  it('shows kill switch in INAKTIV state', () => {
    render(<DashboardView {...defaultProps} />);
    expect(screen.getByText('INAKTIV')).toBeInTheDocument();
    expect(screen.getByText('Kill-Switch deaktiviert')).toBeInTheDocument();
  });

  it('shows kill switch in AKTIV state', () => {
    render(<DashboardView {...defaultProps} killSwitch={{ ...mockKillSwitch, aktiv: true }} />);
    expect(screen.getByText('AKTIV')).toBeInTheDocument();
  });

  it('calls onToggleKillSwitch when button is clicked', () => {
    render(<DashboardView {...defaultProps} />);
    fireEvent.click(screen.getByText('INAKTIV'));
    expect(onToggleKillSwitch).toHaveBeenCalledTimes(1);
  });

  it('toggles auto-trigger rules visibility', () => {
    render(<DashboardView {...defaultProps} />);
    // Rules hidden by default
    expect(screen.queryByText('Error Rate Spike')).not.toBeInTheDocument();
    // Click to show rules
    fireEvent.click(screen.getByText('2 Auto-Trigger-Regeln'));
    expect(screen.getByText('Error Rate Spike')).toBeInTheDocument();
    expect(screen.getByText('AKTIV')).toBeInTheDocument();
    expect(screen.getByText('AUS')).toBeInTheDocument();
    // Click to hide rules
    fireEvent.click(screen.getByText('Regeln verbergen'));
    expect(screen.queryByText('Error Rate Spike')).not.toBeInTheDocument();
  });

  it('renders top performers', () => {
    render(<DashboardView {...defaultProps} />);
    expect(screen.getByText('Top Performer')).toBeInTheDocument();
    expect(screen.getByText('Alpha Agent')).toBeInTheDocument();
    expect(screen.getByText('Beta Agent')).toBeInTheDocument();
  });

  it('renders agent status counts', () => {
    render(<DashboardView {...defaultProps} />);
    expect(screen.getByText('Agent Status')).toBeInTheDocument();
    const activeTexts = screen.getAllByText('active');
    expect(activeTexts.length).toBeGreaterThan(0);
  });
});
