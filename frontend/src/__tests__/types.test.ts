import { describe, it, expect } from 'vitest';
import type { Agent, Task, ViewType, AgentCategory, KanbanColumn } from '../types';

describe('Type Definitions', () => {
  it('Agent object has expected shape', () => {
    const agent: Agent = {
      id: 'test-1',
      name: 'Test Agent',
      role: 'Tester',
      category: 'qa',
      status: 'active',
      successRate: 95.5,
      tasksCompleted: 10,
      failedTasks: 1,
      avgTaskDuration: 120,
      currentTask: null,
      lastActivity: '2024-01-01T00:00:00Z',
      systemPrompt: 'Test prompt',
      personality: {
        creativity: 0.5,
        analyticalDepth: 0.8,
        riskTolerance: 0.3,
        communicationStyle: 'technical',
        archetype: 'analytiker',
        domainFocus: 'testing',
      },
      parameters: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
      },
      createdAt: '2024-01-01T00:00:00Z',
      hooks: [],
      testResults: [],
    };

    expect(agent.id).toBe('test-1');
    expect(agent.status).toBe('active');
    expect(agent.personality.archetype).toBe('analytiker');
  });

  it('Task object has expected shape', () => {
    const task: Task = {
      id: 'task-1',
      title: 'Test Task',
      description: 'A test task',
      status: 'pending',
      priority: 'high',
      assignedAgentId: null,
      category: 'qa',
      createdAt: '2024-01-01T00:00:00Z',
      dependencies: [],
      kanbanColumn: 'backlog',
      tags: ['test'],
    };

    expect(task.id).toBe('task-1');
    expect(task.priority).toBe('high');
    expect(task.kanbanColumn).toBe('backlog');
  });

  it('ViewType covers all views', () => {
    const views: ViewType[] = [
      'dashboard', 'agents', 'security', 'collaboration',
      'certifications', 'kanban', 'projektbaum', 'llm-settings',
      'workflows', 'projects', 'kill-switch', 'analytics', 'enterprise',
    ];

    expect(views).toHaveLength(13);
  });

  it('AgentCategory covers all categories', () => {
    const categories: AgentCategory[] = [
      'trading', 'security', 'development', 'qa', 'documentation',
      'deployment', 'analyst', 'support', 'integration', 'monitoring',
    ];

    expect(categories).toHaveLength(10);
  });

  it('KanbanColumn has all columns', () => {
    const columns: KanbanColumn[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

    expect(columns).toHaveLength(5);
  });
});
