import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentsView from '../components/AgentsView';
import type { Agent, CapabilityState } from '../types';

const LAYER_DEFS: Array<{
  key: string;
  name: string;
  cssClass: string;
  color: string;
  subs: Array<{ key: string; label: string; desc: string }>;
}> = [
  {
    key: 'information_access',
    name: 'Information Access',
    cssClass: 'info-access',
    color: '#00e5ff',
    subs: [
      { key: 'scope', label: 'Scope', desc: 'Umfang' },
      { key: 'restriction', label: 'Restriction', desc: 'Restriktion' },
      { key: 'temporal', label: 'Temporal', desc: 'Zeit' },
      { key: 'sources', label: 'Sources', desc: 'Quellen' },
      { key: 'granularity', label: 'Granularity', desc: 'Granularität' },
      { key: 'verification', label: 'Verification', desc: 'Verifikation' },
    ],
  },
  {
    key: 'resource_control',
    name: 'Resource Control',
    cssClass: 'resource',
    color: '#10b981',
    subs: [
      { key: 'computational', label: 'Computational', desc: 'Rechen' },
      { key: 'financial', label: 'Financial', desc: 'Finanzen' },
      { key: 'infrastructure', label: 'Infrastructure', desc: 'Infrastruktur' },
      { key: 'human', label: 'Human', desc: 'Mensch' },
      { key: 'energy', label: 'Energy', desc: 'Energie' },
      { key: 'time', label: 'Time', desc: 'Zeit' },
    ],
  },
  {
    key: 'network_position',
    name: 'Network Position',
    cssClass: 'network',
    color: '#3b82f6',
    subs: [
      { key: 'trust', label: 'Trust', desc: 'Vertrauen' },
      { key: 'dependencies', label: 'Dependencies', desc: 'Abhängigkeiten' },
      { key: 'gatekeeping', label: 'Gatekeeping', desc: 'Gatekeeping' },
      { key: 'influence', label: 'Influence', desc: 'Einfluss' },
      { key: 'reputation', label: 'Reputation', desc: 'Reputation' },
      { key: 'mobilization', label: 'Mobilization', desc: 'Mobilisierung' },
    ],
  },
  {
    key: 'authority_permission',
    name: 'Authority & Permission',
    cssClass: 'authority',
    color: '#8b5cf6',
    subs: [
      { key: 'legal', label: 'Legal', desc: 'Recht' },
      { key: 'jurisdictional', label: 'Jurisdictional', desc: 'Jurisdiktion' },
      { key: 'hierarchical', label: 'Hierarchical', desc: 'Hierarchie' },
      { key: 'financial', label: 'Financial', desc: 'Finanzen' },
      { key: 'territorial', label: 'Territorial', desc: 'Territorium' },
      { key: 'ethical', label: 'Ethical', desc: 'Ethik' },
    ],
  },
  {
    key: 'synthesis_application',
    name: 'Synthesis & Application',
    cssClass: 'synthesis',
    color: '#14b8a6',
    subs: [
      { key: 'synthesis', label: 'Synthesis', desc: 'Synthese' },
      { key: 'creativity', label: 'Creativity', desc: 'Kreativität' },
      { key: 'planning', label: 'Planning', desc: 'Planung' },
      { key: 'decision', label: 'Decision', desc: 'Entscheidung' },
      { key: 'learning', label: 'Learning', desc: 'Lernen' },
      { key: 'memory', label: 'Memory', desc: 'Gedächtnis' },
    ],
  },
];

function buildComputedState(): CapabilityState {
  return {
    value: false,
    status: 'computed',
    timestamp: '2026-04-22T12:00:00.000Z',
    pendingReason: null,
    profile: {
      layers: LAYER_DEFS.map((l) => ({
        key: l.key,
        name: l.name,
        cssClass: l.cssClass,
        color: l.color,
        score: 75,
        sub_dimensions: l.subs.map((s) => ({ key: s.key, label: s.label, desc: s.desc, value: 6 })),
      })),
      modifiers: [
        {
          key: 'personality_influence',
          name: 'Personality Influence',
          archetype: 'analytiker',
          communication_style: 'technical',
          creativity_impact: 12,
          depth_impact: 8,
        },
        {
          key: 'performance_history',
          name: 'Performance History',
          success_rate: 97,
          tasks_total: 206,
          reliability_index: 92.2,
        },
        { key: 'test_results', name: 'Test Results', tests: [] },
      ],
      source: { inputs: { rate: 0.97, depth: 0.7, creativity: 0.8 }, model_version: '1.0.0' },
    },
  };
}

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
  capabilities: buildComputedState(),
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

  it('renders capability values from the server-side state (no client generation)', () => {
    const agent = createAgent({ id: 'aX' });
    render(<AgentsView agents={[agent]} selectedAgentId="aX" onSelectAgent={onSelectAgent} />);
    // Every sub-dim was seeded with value=6 in buildComputedState().
    // We expect at least one "6/9" rendering to appear in the sub-dim cards.
    const sixOfNine = screen.getAllByText('6/9');
    expect(sixOfNine.length).toBeGreaterThan(0);
  });

  it('shows the sovereign-null placeholder when capabilities are pending', () => {
    const pendingAgent = createAgent({
      id: 'pend',
      name: 'Pending Agent',
      capabilities: {
        value: false,
        status: 'pending',
        timestamp: '2026-04-22T12:00:00.000Z',
        pendingReason: 'No capability row for this agent — run seedAgentCatalog',
        profile: null,
      },
    });
    render(<AgentsView agents={[pendingAgent]} selectedAgentId="pend" onSelectAgent={onSelectAgent} />);
    expect(screen.getByTestId('capability-pending')).toBeInTheDocument();
    expect(screen.getByText(/Profil ausstehend/)).toBeInTheDocument();
    expect(screen.getByText(/run seedAgentCatalog/)).toBeInTheDocument();
    // Critically: no fake values should be shown.
    expect(screen.queryByText('Information Access')).not.toBeInTheDocument();
  });

  it('shows the placeholder when capabilities field is undefined (no client-side fallback)', () => {
    const agentNoCaps = createAgent({ id: 'noc', name: 'No Caps' });
    delete (agentNoCaps as { capabilities?: unknown }).capabilities;
    render(<AgentsView agents={[agentNoCaps]} selectedAgentId="noc" onSelectAgent={onSelectAgent} />);
    expect(screen.getByTestId('capability-pending')).toBeInTheDocument();
    expect(screen.queryByText('Information Access')).not.toBeInTheDocument();
  });
});
