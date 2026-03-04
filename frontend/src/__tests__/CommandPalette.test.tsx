import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandPalette from '../components/CommandPalette';
import type { Agent } from '../types';

const mockAgents: Agent[] = [
  {
    id: 'a1',
    name: 'TradeBot',
    role: 'Trader',
    category: 'trading',
    status: 'active',
    successRate: 95,
    tasksCompleted: 50,
    failedTasks: 2,
    avgTaskDuration: 100,
    currentTask: null,
    lastActivity: '2024-01-01',
    systemPrompt: 'trade',
    personality: {
      creativity: 70,
      analyticalDepth: 80,
      riskTolerance: 60,
      communicationStyle: 'technical',
      archetype: 'analytiker',
      domainFocus: 'trading',
    },
    parameters: { temperature: 0.7, maxTokens: 4096, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
    createdAt: '2024-01-01',
    hooks: [],
    testResults: [],
  },
  {
    id: 'a2',
    name: 'SecurityGuard',
    role: 'Security Analyst',
    category: 'security',
    status: 'active',
    successRate: 98,
    tasksCompleted: 80,
    failedTasks: 1,
    avgTaskDuration: 90,
    currentTask: null,
    lastActivity: '2024-01-01',
    systemPrompt: 'protect',
    personality: {
      creativity: 50,
      analyticalDepth: 95,
      riskTolerance: 20,
      communicationStyle: 'formal',
      archetype: 'analytiker',
      domainFocus: 'security',
    },
    parameters: { temperature: 0.3, maxTokens: 4096, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
    createdAt: '2024-01-01',
    hooks: [],
    testResults: [],
  },
];

describe('CommandPalette', () => {
  const onViewChange = vi.fn();
  const onSelectAgent = vi.fn();
  const onClose = vi.fn();

  const defaultProps = {
    agents: mockAgents,
    onViewChange,
    onSelectAgent,
    onClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all default view commands', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agenten-Ansicht')).toBeInTheDocument();
    expect(screen.getByText('Sicherheits-Center')).toBeInTheDocument();
    expect(screen.getByText('Kollaboration')).toBeInTheDocument();
    expect(screen.getByText('Zertifizierungen')).toBeInTheDocument();
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    expect(screen.getByText('Projekt-Baum')).toBeInTheDocument();
  });

  it('filters views based on query', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Suche nach Views, Agenten...');
    fireEvent.change(input, { target: { value: 'kanban' } });
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('shows agents when query is 2+ characters', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Suche nach Views, Agenten...');
    fireEvent.change(input, { target: { value: 'tr' } });
    expect(screen.getByText('TradeBot (trading)')).toBeInTheDocument();
  });

  it('does not show agents when query is 1 character', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Suche nach Views, Agenten...');
    fireEvent.change(input, { target: { value: 't' } });
    expect(screen.queryByText('TradeBot (trading)')).not.toBeInTheDocument();
  });

  it('shows no results message when nothing matches', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Suche nach Views, Agenten...');
    fireEvent.change(input, { target: { value: 'xyznotfound' } });
    expect(screen.getByText('Keine Ergebnisse')).toBeInTheDocument();
  });

  it('calls onClose on Escape key', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Suche nach Views, Agenten...');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    render(<CommandPalette {...defaultProps} />);
    const overlay = document.querySelector('.cmd-overlay')!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('selects a view with Enter key', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Suche nach Views, Agenten...');
    // First item is Dashboard by default
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onViewChange).toHaveBeenCalledWith('dashboard');
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates with arrow keys', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Suche nach Views, Agenten...');
    // Move down to second item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onViewChange).toHaveBeenCalledWith('agents');
  });

  it('selects a view when clicked', () => {
    render(<CommandPalette {...defaultProps} />);
    fireEvent.click(screen.getByText('Kanban Board'));
    expect(onViewChange).toHaveBeenCalledWith('kanban');
    expect(onClose).toHaveBeenCalled();
  });

  it('selects an agent and switches to agents view', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Suche nach Views, Agenten...');
    fireEvent.change(input, { target: { value: 'trade' } });
    fireEvent.click(screen.getByText('TradeBot (trading)'));
    expect(onSelectAgent).toHaveBeenCalledWith('a1');
    expect(onViewChange).toHaveBeenCalledWith('agents');
    expect(onClose).toHaveBeenCalled();
  });
});
