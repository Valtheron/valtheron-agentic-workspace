import { describe, it, expect, vi } from 'vitest';
import {
  orchestrate,
  OrchestrationError,
  MAX_PARTICIPANTS,
  type LLMFn,
} from '../services/collaborationOrchestrator.js';

function agent(id: string) {
  return { id, name: `Agent ${id}`, systemPrompt: `prompt ${id}` };
}

// Deterministic stub: echoes which agent it was called for, counts calls.
function stubLLM(): { fn: LLMFn; calls: { systemPrompt: string; userMessage: string }[] } {
  const calls: { systemPrompt: string; userMessage: string }[] = [];
  const fn: LLMFn = async (systemPrompt, userMessage) => {
    calls.push({ systemPrompt, userMessage });
    return `reply<${systemPrompt}>`;
  };
  return { fn, calls };
}

describe('collaboration orchestrator', () => {
  it('rejects an empty task', async () => {
    const { fn } = stubLLM();
    await expect(
      orchestrate(
        {
          task: '   ',
          delegationStrategy: 'round-robin',
          conflictResolution: 'merge',
          agents: [agent('a'), agent('b')],
        },
        fn,
      ),
    ).rejects.toBeInstanceOf(OrchestrationError);
  });

  it('rejects fewer than two agents', async () => {
    const { fn } = stubLLM();
    await expect(
      orchestrate(
        { task: 'do it', delegationStrategy: 'round-robin', conflictResolution: 'merge', agents: [agent('a')] },
        fn,
      ),
    ).rejects.toBeInstanceOf(OrchestrationError);
  });

  it('round-robin: one message per agent in order + a synthesis (N+1 LLM calls)', async () => {
    const { fn, calls } = stubLLM();
    const res = await orchestrate(
      {
        task: 'task',
        delegationStrategy: 'round-robin',
        conflictResolution: 'merge',
        agents: [agent('a'), agent('b'), agent('c')],
      },
      fn,
    );
    // kickoff(system) + 3 agent messages + 1 synthesis(decision)
    expect(res.messages.filter((m) => m.messageType === 'message').map((m) => m.senderId)).toEqual(['a', 'b', 'c']);
    expect(res.messages[0].messageType).toBe('system');
    expect(res.messages[res.messages.length - 1].messageType).toBe('decision');
    expect(calls.length).toBe(4); // 3 agents + 1 synthesis
    expect(res.synthesis).toContain('reply<');
  });

  it('priority (hierarchical): coordinator plans, workers execute, then synthesis', async () => {
    const { fn, calls } = stubLLM();
    const res = await orchestrate(
      {
        task: 'task',
        delegationStrategy: 'priority',
        conflictResolution: 'coordinator-decides',
        agents: [agent('co'), agent('w1'), agent('w2')],
      },
      fn,
    );
    // coordinator plan (decision) + 2 worker messages + synthesis decision
    const decisions = res.messages.filter((m) => m.messageType === 'decision');
    expect(decisions.length).toBe(2); // plan + synthesis
    expect(res.messages.filter((m) => m.messageType === 'message').map((m) => m.senderId)).toEqual(['w1', 'w2']);
    expect(calls.length).toBe(4); // plan + 2 workers + synthesis
  });

  it('priority-based conflict resolution takes the first contribution without an extra LLM call', async () => {
    const { fn, calls } = stubLLM();
    const res = await orchestrate(
      {
        task: 'task',
        delegationStrategy: 'capability-based',
        conflictResolution: 'priority-based',
        agents: [agent('a'), agent('b')],
      },
      fn,
    );
    // 2 parallel agent calls, NO synthesis call
    expect(calls.length).toBe(2);
    expect(res.synthesis).toBe('reply<prompt a>');
  });

  it('caps participation at MAX_PARTICIPANTS', async () => {
    const { fn } = stubLLM();
    const many = Array.from({ length: MAX_PARTICIPANTS + 4 }, (_, i) => agent(`a${i}`));
    const res = await orchestrate(
      { task: 'task', delegationStrategy: 'capability-based', conflictResolution: 'merge', agents: many },
      fn,
    );
    const messageSenders = res.messages.filter((m) => m.messageType === 'message');
    expect(messageSenders.length).toBe(MAX_PARTICIPANTS);
  });

  it('propagates LLM errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('llm down')) as unknown as LLMFn;
    await expect(
      orchestrate(
        {
          task: 'task',
          delegationStrategy: 'round-robin',
          conflictResolution: 'merge',
          agents: [agent('a'), agent('b')],
        },
        fn,
      ),
    ).rejects.toThrow('llm down');
  });
});
