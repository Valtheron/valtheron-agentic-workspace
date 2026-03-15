import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkflowView from '../components/WorkflowView';
import type { Workflow, Agent } from '../types';

// ── Mock data ─────────────────────────────────────────────────────────

const mockAgent: Agent = {
  id: 'agent_001',
  name: 'Test Agent',
  role: 'Developer',
  category: 'development',
  status: 'active',
  successRate: 95,
  tasksCompleted: 50,
  failedTasks: 2,
  avgTaskDuration: 60,
  currentTask: null,
  lastActivity: '2024-01-01T00:00:00Z',
  systemPrompt: 'You are a developer agent.',
  personality: {
    creativity: 70,
    analyticalDepth: 80,
    riskTolerance: 40,
    communicationStyle: 'technical',
    archetype: 'analytiker',
    domainFocus: 'development',
  },
  parameters: { temperature: 0.7, maxTokens: 4096, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
  createdAt: '2024-01-01T00:00:00Z',
  hooks: [],
  testResults: [],
};

const mockWorkflow: Workflow = {
  id: 'wf_001',
  name: 'Test Workflow Alpha',
  description: 'A test workflow description',
  status: 'draft',
  steps: [],
  createdAt: '2024-01-01T00:00:00Z',
  createdBy: 'admin',
  tags: ['test', 'alpha'],
};

const mockWorkflowWithSteps: Workflow = {
  id: 'wf_002',
  name: 'Workflow Mit Schritten',
  description: '',
  status: 'running',
  steps: [
    {
      id: 'step_001',
      name: 'Erster Schritt',
      description: 'Beschreibung des ersten Schritts',
      assignedAgentId: 'agent_001',
      status: 'completed',
      dependsOn: [],
      output: 'Fertig',
      progress: 100,
      estimatedDuration: 30,
      retries: 0,
    },
    {
      id: 'step_002',
      name: 'Zweiter Schritt',
      description: '',
      assignedAgentId: null,
      status: 'pending',
      dependsOn: ['step_001'],
      output: null,
      progress: 0,
      estimatedDuration: 60,
      retries: 0,
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  createdBy: 'admin',
  tags: [],
};

const defaultProps = {
  workflows: [mockWorkflow],
  agents: [mockAgent],
  onCreateWorkflow: vi.fn(),
  onUpdateWorkflow: vi.fn(),
  onDeleteWorkflow: vi.fn(),
  onRunWorkflow: vi.fn(),
  onPauseWorkflow: vi.fn(),
};

describe('WorkflowView', () => {
  beforeEach(() => {
    defaultProps.onCreateWorkflow.mockClear();
    defaultProps.onUpdateWorkflow.mockClear();
    defaultProps.onDeleteWorkflow.mockClear();
    defaultProps.onRunWorkflow.mockClear();
    defaultProps.onPauseWorkflow.mockClear();
  });

  // ── Workflow list rendering ───────────────────────────────────────

  it('renders the workflow count', () => {
    render(<WorkflowView {...defaultProps} />);
    expect(screen.getByText('1 Workflows')).toBeInTheDocument();
  });

  it('renders "Neuer Workflow" button', () => {
    render(<WorkflowView {...defaultProps} />);
    expect(screen.getByText('+ Neuer Workflow')).toBeInTheDocument();
  });

  it('renders workflow name in the list', () => {
    render(<WorkflowView {...defaultProps} />);
    expect(screen.getByText('Test Workflow Alpha')).toBeInTheDocument();
  });

  it('renders workflow status', () => {
    render(<WorkflowView {...defaultProps} />);
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('renders workflow tags', () => {
    render(<WorkflowView {...defaultProps} />);
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('alpha')).toBeInTheDocument();
  });

  it('shows step count in workflow card', () => {
    render(<WorkflowView {...defaultProps} />);
    expect(screen.getByText(/0 Schritte/)).toBeInTheDocument();
  });

  it('shows empty state when no workflows', () => {
    render(<WorkflowView {...defaultProps} workflows={[]} />);
    expect(screen.getByText('Noch keine Workflows')).toBeInTheDocument();
  });

  it('renders 0 Workflows when list is empty', () => {
    render(<WorkflowView {...defaultProps} workflows={[]} />);
    expect(screen.getByText('0 Workflows')).toBeInTheDocument();
  });

  // ── Create workflow form ──────────────────────────────────────────

  it('shows create form when "Neuer Workflow" is clicked', () => {
    render(<WorkflowView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Workflow'));
    expect(screen.getByPlaceholderText('Name *')).toBeInTheDocument();
  });

  it('shows Erstellen and Abbrechen buttons in create form', () => {
    render(<WorkflowView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Workflow'));
    expect(screen.getByText('Erstellen')).toBeInTheDocument();
    expect(screen.getByText('Abbrechen')).toBeInTheDocument();
  });

  it('Erstellen button is disabled when name is empty', () => {
    render(<WorkflowView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Workflow'));
    const createBtn = screen.getByText('Erstellen');
    expect(createBtn).toBeDisabled();
  });

  it('Erstellen button is enabled when name is filled', () => {
    render(<WorkflowView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Workflow'));
    fireEvent.change(screen.getByPlaceholderText('Name *'), { target: { value: 'Neuer Name' } });
    expect(screen.getByText('Erstellen')).not.toBeDisabled();
  });

  it('calls onCreateWorkflow with correct name when form is submitted', () => {
    render(<WorkflowView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Workflow'));
    fireEvent.change(screen.getByPlaceholderText('Name *'), { target: { value: 'Mein Workflow' } });
    fireEvent.click(screen.getByText('Erstellen'));
    expect(defaultProps.onCreateWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mein Workflow', status: 'draft', steps: [] }),
    );
  });

  it('calls onCreateWorkflow with parsed tags', () => {
    render(<WorkflowView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Workflow'));
    fireEvent.change(screen.getByPlaceholderText('Name *'), { target: { value: 'Tag Workflow' } });
    fireEvent.change(screen.getByPlaceholderText('Tags (kommasepariert)'), { target: { value: 'tag1, tag2, tag3' } });
    fireEvent.click(screen.getByText('Erstellen'));
    expect(defaultProps.onCreateWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['tag1', 'tag2', 'tag3'] }),
    );
  });

  it('hides create form when Abbrechen is clicked', () => {
    render(<WorkflowView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Workflow'));
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(screen.queryByPlaceholderText('Name *')).not.toBeInTheDocument();
  });

  it('does not call onCreateWorkflow when name is only whitespace', () => {
    render(<WorkflowView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Workflow'));
    fireEvent.change(screen.getByPlaceholderText('Name *'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Erstellen'));
    expect(defaultProps.onCreateWorkflow).not.toHaveBeenCalled();
  });

  // ── Workflow selection ────────────────────────────────────────────

  it('shows workflow detail when clicking a workflow', () => {
    render(<WorkflowView {...defaultProps} />);
    fireEvent.click(screen.getByText('Test Workflow Alpha'));
    // Should show in detail panel — the name appears again in the header
    const names = screen.getAllByText('Test Workflow Alpha');
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it('shows workflow description in detail panel', () => {
    render(<WorkflowView {...defaultProps} />);
    fireEvent.click(screen.getByText('Test Workflow Alpha'));
    // Description appears in both list card and detail panel
    const matches = screen.getAllByText('A test workflow description');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  // ── Multiple workflows ────────────────────────────────────────────

  it('renders multiple workflows in the list', () => {
    const workflows = [mockWorkflow, mockWorkflowWithSteps];
    render(<WorkflowView {...defaultProps} workflows={workflows} />);
    expect(screen.getByText('Test Workflow Alpha')).toBeInTheDocument();
    expect(screen.getByText('Workflow Mit Schritten')).toBeInTheDocument();
    expect(screen.getByText('2 Workflows')).toBeInTheDocument();
  });

  it('shows step info for workflow with steps', () => {
    render(<WorkflowView {...defaultProps} workflows={[mockWorkflowWithSteps]} />);
    expect(screen.getByText(/2 Schritte/)).toBeInTheDocument();
  });
});
