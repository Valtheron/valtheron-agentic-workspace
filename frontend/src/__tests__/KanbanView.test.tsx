import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KanbanView from '../components/KanbanView';
import type { Task, Agent } from '../types';

const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Implement login',
    description: 'Add auth',
    status: 'in_progress',
    priority: 'high',
    assignedAgentId: 'a1',
    category: 'development',
    createdAt: '2024-01-01',
    dependencies: [],
    kanbanColumn: 'in_progress',
    tags: ['auth'],
    taskType: 'feature',
    progress: 60,
  },
  {
    id: 't2',
    title: 'Fix bug #42',
    description: '',
    status: 'pending',
    priority: 'critical',
    assignedAgentId: null,
    category: 'qa',
    createdAt: '2024-01-02',
    dependencies: ['t1'],
    kanbanColumn: 'backlog',
    tags: ['bug'],
    taskType: 'bug',
    progress: 0,
  },
  {
    id: 't3',
    title: 'Write docs',
    description: '',
    status: 'completed',
    priority: 'low',
    assignedAgentId: null,
    category: 'documentation',
    createdAt: '2024-01-03',
    dependencies: [],
    kanbanColumn: 'done',
    tags: [],
    taskType: 'documentation',
    progress: 100,
  },
];

const mockAgents: Agent[] = [
  {
    id: 'a1',
    name: 'DevAgent',
    role: 'Developer',
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
];

describe('KanbanView', () => {
  const onMoveTask = vi.fn();
  const onUpdateTask = vi.fn();
  const onCreateTask = vi.fn();

  const defaultProps = {
    tasks: mockTasks,
    agents: mockAgents,
    onMoveTask,
    onUpdateTask,
    onCreateTask,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 5 kanban columns', () => {
    render(<KanbanView {...defaultProps} />);
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows task count', () => {
    render(<KanbanView {...defaultProps} />);
    expect(screen.getByText(/3 Tasks/)).toBeInTheDocument();
  });

  it('renders tasks in correct columns', () => {
    render(<KanbanView {...defaultProps} />);
    expect(screen.getByText('Implement login')).toBeInTheDocument();
    expect(screen.getByText('Fix bug #42')).toBeInTheDocument();
    expect(screen.getByText('Write docs')).toBeInTheDocument();
  });

  it('shows task priority badges', () => {
    render(<KanbanView {...defaultProps} />);
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
  });

  it('shows dependency count on tasks with dependencies', () => {
    render(<KanbanView {...defaultProps} />);
    expect(screen.getByText('1 dep')).toBeInTheDocument();
  });

  it('opens create task form when button is clicked', () => {
    render(<KanbanView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Task'));
    expect(screen.getByPlaceholderText('Task-Titel...')).toBeInTheDocument();
    expect(screen.getByText('Erstellen')).toBeInTheDocument();
  });

  it('creates a task when form is submitted', () => {
    render(<KanbanView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Task'));
    const input = screen.getByPlaceholderText('Task-Titel...');
    fireEvent.change(input, { target: { value: 'New feature task' } });
    fireEvent.click(screen.getByText('Erstellen'));
    expect(onCreateTask).toHaveBeenCalledTimes(1);
    const created = onCreateTask.mock.calls[0][0];
    expect(created.title).toBe('New feature task');
    expect(created.kanbanColumn).toBe('backlog');
  });

  it('does not create a task with empty title', () => {
    render(<KanbanView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Task'));
    fireEvent.click(screen.getByText('Erstellen'));
    expect(onCreateTask).not.toHaveBeenCalled();
  });

  it('expands task details on click', () => {
    render(<KanbanView {...defaultProps} />);
    fireEvent.click(screen.getByText('Implement login'));
    expect(screen.getByText('Agent zuweisen')).toBeInTheDocument();
    expect(screen.getByText('Deadline')).toBeInTheDocument();
  });

  it('collapses task details on second click', () => {
    render(<KanbanView {...defaultProps} />);
    fireEvent.click(screen.getByText('Implement login'));
    expect(screen.getByText('Agent zuweisen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Implement login'));
    expect(screen.queryByText('Agent zuweisen')).not.toBeInTheDocument();
  });

  it('creates task via Enter key', () => {
    render(<KanbanView {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Neuer Task'));
    const input = screen.getByPlaceholderText('Task-Titel...');
    fireEvent.change(input, { target: { value: 'Enter task' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCreateTask).toHaveBeenCalledTimes(1);
  });
});
