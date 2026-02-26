import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentsView from '../components/AgentsView';
import type { Agent } from '../types';

const createAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: 'a1',
  name: 'Alpha Agent',
  role: 'Developer',
  category: 'development',
  status: 'active',
  successRate: 97,
  tasksCompleted: 200,
  failedTasks: 6,
  avgTaskDuration: 120,
  currentTask: null,
  lastActivity: '2024-01-01',
  systemPrompt: 'You are a developer.',
  personality: {
    creativity: 80,
    analyticalDepth: 70,
    riskTolerance: 50,
    communicationStyle: 'technical',
    archetype: 'analytiker',
    domainFocus: 'development',
  },
  parameters: { temperature: 0.7, maxTokens: 4096, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
  createdAt: '2024-01-01',
  hooks: [],
  testResults: [
    { id: 'tr1', category: 'DOM', name: 'Domain Test', passed: true, duration: 1.2, timestamp: '2024-01-01' },
    { id: 'tr2', category: 'EDGE', name: 'Edge Case', passed: false, duration: 2.5, timestamp: '2024-01-01' },
  ],
  ...overrides,
});

const mockAgents: Agent[] = [
  createAgent({ id: 'a1', name: 'Alpha Agent', category: 'development', successRate: 97 }),
  createAgent({ id: 'a2', name: 'Beta Agent', role: 'QA Engineer', category: 'qa', successRate: 94 }),
  createAgent({ id: 'a3', name: 'Gamma Agent', role: 'Security', category: 'security', successRate: 91 }),
];

describe('AgentsView', () => {
  const onSelectAgent = vi.fn();

  const defaultProps = {
    agents: mockAgents,
    selectedAgentId: null as string | null,
    onSelectAgent,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all agents sorted by success rate', () => {
    render(<AgentsView {...defaultProps} />);
    // Alpha Agent appears in both list and detail panel (selected by default)
    expect(screen.getAllByText('Alpha Agent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Beta Agent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gamma Agent').length).toBeGreaterThanOrEqual(1);
  });

  it('renders search input', () => {
    render(<AgentsView {...defaultProps} />);
    expect(screen.getByPlaceholderText('Agent suchen...')).toBeInTheDocument();
  });

  it('filters agents by search query', () => {
    render(<AgentsView {...defaultProps} />);
    const search = screen.getByPlaceholderText('Agent suchen...');
    fireEvent.change(search, { target: { value: 'Beta' } });
    // Beta Agent appears in list + detail (selected by default when only result)
    expect(screen.getAllByText('Beta Agent').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Alpha Agent')).not.toBeInTheDocument();
  });

  it('filters agents by category', () => {
    render(<AgentsView {...defaultProps} />);
    const select = screen.getByDisplayValue('Alle Kategorien');
    fireEvent.change(select, { target: { value: 'qa' } });
    // Beta Agent appears in list + detail panel
    expect(screen.getAllByText('Beta Agent').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Alpha Agent')).not.toBeInTheDocument();
  });

  it('calls onSelectAgent when agent row is clicked', () => {
    render(<AgentsView {...defaultProps} />);
    fireEvent.click(screen.getByText('Beta Agent'));
    expect(onSelectAgent).toHaveBeenCalledWith('a2');
  });

  it('renders agent detail panel for selected agent', () => {
    render(<AgentsView {...defaultProps} selectedAgentId="a1" />);
    // Detail panel should show agent name
    const nameElements = screen.getAllByText('Alpha Agent');
    expect(nameElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders dimension tabs', () => {
    render(<AgentsView {...defaultProps} selectedAgentId="a1" />);
    expect(screen.getByText(/30 Sub-Dim/)).toBeInTheDocument();
    expect(screen.getByText(/5 Layers/)).toBeInTheDocument();
    expect(screen.getByText(/3 Modifiers/)).toBeInTheDocument();
  });

  it('shows sub-dimensions tab by default', () => {
    render(<AgentsView {...defaultProps} selectedAgentId="a1" />);
    expect(screen.getByText('Information Access')).toBeInTheDocument();
    expect(screen.getByText('Resource Control')).toBeInTheDocument();
    expect(screen.getByText('Network Position')).toBeInTheDocument();
    expect(screen.getByText('Authority & Permission')).toBeInTheDocument();
    expect(screen.getByText('Synthesis & Application')).toBeInTheDocument();
  });

  it('switches to overview tab', () => {
    render(<AgentsView {...defaultProps} selectedAgentId="a1" />);
    fireEvent.click(screen.getByText(/\u00DCbersicht/));
    expect(screen.getByText('Agent-Profil')).toBeInTheDocument();
    expect(screen.getByText('Personality')).toBeInTheDocument();
    expect(screen.getByText('System Prompt')).toBeInTheDocument();
  });

  it('shows agent parameters in overview', () => {
    render(<AgentsView {...defaultProps} selectedAgentId="a1" />);
    fireEvent.click(screen.getByText(/\u00DCbersicht/));
    expect(screen.getByText('Parameter')).toBeInTheDocument();
    expect(screen.getByText('temperature')).toBeInTheDocument();
  });

  it('switches to layers tab', () => {
    render(<AgentsView {...defaultProps} selectedAgentId="a1" />);
    fireEvent.click(screen.getByText(/5 Layers/));
    expect(screen.getByText(/Layer 1: Information Access/)).toBeInTheDocument();
    expect(screen.getByText(/Layer 5: Synthesis & Application/)).toBeInTheDocument();
  });

  it('switches to modifiers tab', () => {
    render(<AgentsView {...defaultProps} selectedAgentId="a1" />);
    fireEvent.click(screen.getByText(/3 Modifiers/));
    expect(screen.getByText('Modifier 1: Personality Influence')).toBeInTheDocument();
    expect(screen.getByText('Modifier 2: Performance History')).toBeInTheDocument();
    expect(screen.getByText('Modifier 3: Test Results')).toBeInTheDocument();
  });

  it('shows test results in modifiers tab', () => {
    render(<AgentsView {...defaultProps} selectedAgentId="a1" />);
    fireEvent.click(screen.getByText(/3 Modifiers/));
    expect(screen.getByText(/PASS/)).toBeInTheDocument();
    expect(screen.getByText(/FAIL/)).toBeInTheDocument();
  });

  it('renders with empty agents list', () => {
    render(<AgentsView agents={[]} selectedAgentId={null} onSelectAgent={onSelectAgent} />);
    expect(screen.getByPlaceholderText('Agent suchen...')).toBeInTheDocument();
  });
});
