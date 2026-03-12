import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KillSwitchView from '../components/KillSwitchView';
import type { KillSwitch, Agent } from '../types';

const mockKillSwitch: KillSwitch = {
  aktiv: false,
  affectedAgents: ['a1', 'a2'],
  autoTriggerRules: [
    { id: 'r1', name: 'Error Rate Spike', condition: 'error_rate > 10%', enabled: true },
    { id: 'r2', name: 'Agent Cascade', condition: 'failed_agents > 5', enabled: false },
  ],
  history: [
    {
      id: 'h1',
      action: 'aktiviert',
      triggeredBy: 'admin',
      reason: 'Emergency',
      affectedAgents: ['a1'],
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      id: 'h2',
      action: 'deaktiviert',
      triggeredBy: 'admin',
      reason: 'All clear',
      affectedAgents: ['a1'],
      timestamp: '2024-01-01T11:00:00Z',
    },
  ],
};

const mockAgents: Agent[] = [
  {
    id: 'a1',
    name: 'Agent Alpha',
    role: 'Dev',
    category: 'development',
    status: 'active',
    successRate: 95,
    tasksCompleted: 50,
    failedTasks: 2,
    avgTaskDuration: 120,
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
    name: 'Agent Beta',
    role: 'QA',
    category: 'qa',
    status: 'idle',
    successRate: 92,
    tasksCompleted: 30,
    failedTasks: 3,
    avgTaskDuration: 100,
    currentTask: null,
    lastActivity: '2024-01-01',
    systemPrompt: 'qa',
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

describe('KillSwitchView', () => {
  const onToggleKillSwitch = vi.fn();
  const onUpdateKillSwitch = vi.fn();
  const onUpdateAgents = vi.fn();

  const defaultProps = {
    killSwitch: mockKillSwitch,
    agents: mockAgents,
    onToggleKillSwitch,
    onUpdateKillSwitch,
    onUpdateAgents,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 4 tabs', () => {
    render(<KillSwitchView {...defaultProps} />);
    expect(screen.getByText('Kill-Switch')).toBeInTheDocument();
    expect(screen.getByText('History Log')).toBeInTheDocument();
    expect(screen.getByText('Risiko-Parameter')).toBeInTheDocument();
    expect(screen.getByText('Batch Operations')).toBeInTheDocument();
  });

  it('shows INAKTIV button in panel tab when not aktiv', () => {
    render(<KillSwitchView {...defaultProps} />);
    expect(screen.getByText('INAKTIV')).toBeInTheDocument();
    expect(screen.getByText('Emergency Kill Switch')).toBeInTheDocument();
  });

  it('shows AKTIV button when aktiv', () => {
    render(<KillSwitchView {...defaultProps} killSwitch={{ ...mockKillSwitch, aktiv: true }} />);
    expect(screen.getByText('AKTIV')).toBeInTheDocument();
  });

  it('opens confirmation dialog when main button clicked', () => {
    render(<KillSwitchView {...defaultProps} />);
    fireEvent.click(screen.getByText('INAKTIV'));
    expect(screen.getByText('Kill-Switch aktivieren?')).toBeInTheDocument();
    expect(screen.getByText('AKTIVIEREN')).toBeInTheDocument();
    expect(screen.getByText('Abbrechen')).toBeInTheDocument();
  });

  it('closes confirmation dialog on cancel', () => {
    render(<KillSwitchView {...defaultProps} />);
    fireEvent.click(screen.getByText('INAKTIV'));
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(screen.queryByText('Kill-Switch aktivieren?')).not.toBeInTheDocument();
  });

  it('calls onToggleKillSwitch on confirm', () => {
    render(<KillSwitchView {...defaultProps} />);
    fireEvent.click(screen.getByText('INAKTIV'));
    fireEvent.click(screen.getByText('AKTIVIEREN'));
    expect(onToggleKillSwitch).toHaveBeenCalledTimes(1);
    expect(onUpdateKillSwitch).toHaveBeenCalledTimes(1);
  });

  it('shows auto-trigger rules in panel', () => {
    render(<KillSwitchView {...defaultProps} />);
    expect(screen.getByText('Auto-Trigger Regeln')).toBeInTheDocument();
    expect(screen.getByText('Error Rate Spike')).toBeInTheDocument();
    expect(screen.getByText('Agent Cascade')).toBeInTheDocument();
  });

  it('toggles auto-trigger rule', () => {
    render(<KillSwitchView {...defaultProps} />);
    const toggleButtons = document.querySelectorAll('.toggle');
    fireEvent.click(toggleButtons[0]);
    expect(onUpdateKillSwitch).toHaveBeenCalledTimes(1);
  });

  it('switches to history tab and shows events', () => {
    render(<KillSwitchView {...defaultProps} />);
    fireEvent.click(screen.getByText('History Log'));
    expect(screen.getByText('Kill-Switch History (2 Events)')).toBeInTheDocument();
    expect(screen.getByText('Emergency')).toBeInTheDocument();
    expect(screen.getByText('All clear')).toBeInTheDocument();
  });

  it('shows empty history message', () => {
    render(<KillSwitchView {...defaultProps} killSwitch={{ ...mockKillSwitch, history: [] }} />);
    fireEvent.click(screen.getByText('History Log'));
    expect(screen.getByText('Keine Events vorhanden')).toBeInTheDocument();
  });

  it('switches to risk tab', () => {
    render(<KillSwitchView {...defaultProps} />);
    fireEvent.click(screen.getByText('Risiko-Parameter'));
    expect(screen.getByText('Agent auswaehlen um Risiko-Parameter zu bearbeiten')).toBeInTheDocument();
  });

  it('shows risk parameters when agent selected', () => {
    render(<KillSwitchView {...defaultProps} />);
    fireEvent.click(screen.getByText('Risiko-Parameter'));
    fireEvent.click(screen.getByText('Agent Alpha'));
    expect(screen.getByText('Risiko-Parameter: Agent Alpha')).toBeInTheDocument();
    expect(screen.getByText('Risiko-Level')).toBeInTheDocument();
    expect(screen.getByText('Max Concurrent Tasks')).toBeInTheDocument();
  });

  it('switches to batch tab and shows agents', () => {
    render(<KillSwitchView {...defaultProps} />);
    fireEvent.click(screen.getByText('Batch Operations'));
    expect(screen.getByText('Agent Alpha')).toBeInTheDocument();
    expect(screen.getByText('Agent Beta')).toBeInTheDocument();
    expect(screen.getByText('0 ausgewaehlt')).toBeInTheDocument();
  });

  it('selects all and deselects agents in batch tab', () => {
    render(<KillSwitchView {...defaultProps} />);
    fireEvent.click(screen.getByText('Batch Operations'));
    // Select all agents
    fireEvent.click(screen.getByText('Alle auswaehlen'));
    expect(screen.getByText('2 ausgewaehlt')).toBeInTheDocument();
    // Deselect all
    fireEvent.click(screen.getByText('Alle abwaehlen'));
    expect(screen.getByText('0 ausgewaehlt')).toBeInTheDocument();
  });

  it('selects all agents in batch tab', () => {
    render(<KillSwitchView {...defaultProps} />);
    fireEvent.click(screen.getByText('Batch Operations'));
    fireEvent.click(screen.getByText('Alle auswaehlen'));
    expect(screen.getByText('2 ausgewaehlt')).toBeInTheDocument();
  });
});
