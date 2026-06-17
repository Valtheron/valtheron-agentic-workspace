import { describe, it, expect, vi } from 'vitest';
import { runBrowseAgent, parseAction, BrowseAgentError, type BrowseAgentDeps } from '../services/browseAgent.js';

function deps(overrides: Partial<BrowseAgentDeps> = {}): BrowseAgentDeps {
  return {
    llm: vi.fn(),
    tools: { navigate: vi.fn(async (u: string) => `SNAPSHOT von ${u}`) },
    assertUrlSafe: vi.fn(async () => {}),
    isKillSwitchActive: () => false,
    ...overrides,
  };
}

// LLM stub that returns a scripted sequence of raw replies.
function scriptedLLM(replies: string[]) {
  let i = 0;
  return vi.fn(async () => replies[Math.min(i++, replies.length - 1)]);
}

describe('parseAction', () => {
  it('parses a navigate action', () => {
    expect(parseAction('{"thought":"t","action":{"tool":"navigate","url":"https://x.com"}}')).toMatchObject({
      tool: 'navigate',
      url: 'https://x.com',
    });
  });
  it('parses a finish action even with surrounding prose', () => {
    expect(parseAction('Hier: {"action":{"tool":"finish","answer":"42"}} fertig')).toMatchObject({
      tool: 'finish',
      answer: '42',
    });
  });
  it('returns null on non-JSON', () => {
    expect(parseAction('kein json hier')).toBeNull();
  });
});

describe('runBrowseAgent', () => {
  it('rejects an empty task', async () => {
    await expect(runBrowseAgent('  ', undefined, deps())).rejects.toBeInstanceOf(BrowseAgentError);
  });

  it('navigates then finishes, recording steps', async () => {
    const d = deps({
      llm: scriptedLLM([
        '{"thought":"such","action":{"tool":"navigate","url":"https://example.com"}}',
        '{"thought":"genug","action":{"tool":"finish","answer":"Das ist die Antwort."}}',
      ]),
    });
    const res = await runBrowseAgent('Finde X', undefined, d);
    expect(res.stoppedReason).toBe('done');
    expect(res.answer).toBe('Das ist die Antwort.');
    expect(res.steps).toHaveLength(1);
    expect(res.steps[0]).toMatchObject({ tool: 'navigate', arg: 'https://example.com' });
    expect(res.steps[0].observation).toContain('SNAPSHOT von https://example.com');
  });

  it('feeds an SSRF-guard rejection back as an observation instead of crashing', async () => {
    const d = deps({
      llm: scriptedLLM([
        '{"action":{"tool":"navigate","url":"http://127.0.0.1"}}',
        '{"action":{"tool":"finish","answer":"abgebrochen"}}',
      ]),
      assertUrlSafe: vi.fn(async (u: string) => {
        if (u.includes('127.0.0.1')) throw new Error('SSRF blockiert');
      }),
    });
    const res = await runBrowseAgent('x', undefined, d);
    expect(res.steps[0].observation).toContain('SSRF blockiert');
    // tools.navigate must NOT have been called for the blocked URL
    expect(d.tools.navigate).not.toHaveBeenCalled();
    expect(res.stoppedReason).toBe('done');
  });

  it('stops immediately when the kill switch is active', async () => {
    const llm = vi.fn();
    const res = await runBrowseAgent('x', undefined, deps({ isKillSwitchActive: () => true, llm }));
    expect(res.stoppedReason).toBe('kill_switch');
    expect(llm).not.toHaveBeenCalled();
  });

  it('stops at max_steps when the agent never finishes', async () => {
    const d = deps({
      llm: scriptedLLM(['{"action":{"tool":"navigate","url":"https://example.com"}}']), // always navigate
    });
    const res = await runBrowseAgent('x', undefined, d, 3);
    expect(res.stoppedReason).toBe('max_steps');
    expect(res.steps.filter((s) => s.tool === 'navigate')).toHaveLength(3);
  });

  it('handles invalid JSON by re-prompting (does not crash)', async () => {
    const d = deps({
      llm: scriptedLLM(['kaputt, kein json', '{"action":{"tool":"finish","answer":"ok"}}']),
    });
    const res = await runBrowseAgent('x', undefined, d);
    expect(res.steps[0]).toMatchObject({ tool: 'invalid' });
    expect(res.stoppedReason).toBe('done');
    expect(res.answer).toBe('ok');
  });
});
