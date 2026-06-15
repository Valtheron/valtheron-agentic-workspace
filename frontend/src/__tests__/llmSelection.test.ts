import { describe, it, expect, beforeEach } from 'vitest';
import { getActiveLLMSelection, getLLMHeaders } from '../services/api';

function setConfig(cfg: unknown) {
  localStorage.setItem('llm_config', JSON.stringify(cfg));
}

const anthropic = { id: 'anthropic', name: 'Anthropic', enabled: true, models: [{ id: 'claude-x' }] };
const openai = { id: 'openai', name: 'OpenAI', enabled: true, models: [{ id: 'gpt-4o' }, { id: 'gpt-4.1' }] };

describe('getActiveLLMSelection', () => {
  beforeEach(() => localStorage.clear());

  it('returns null with no config (→ simulation)', () => {
    expect(getActiveLLMSelection()).toBeNull();
    expect(getLLMHeaders()).toBeUndefined();
  });

  it('returns null when no provider has a key', () => {
    setConfig({ defaultProvider: 'anthropic', defaultModel: 'claude-x', providers: [anthropic, openai] });
    expect(getActiveLLMSelection()).toBeNull();
  });

  it('uses the default provider when it has a key', () => {
    setConfig({
      defaultProvider: 'openai',
      defaultModel: 'gpt-4.1',
      providers: [anthropic, { ...openai, apiKey: 'sk-test' }],
    });
    const sel = getActiveLLMSelection();
    expect(sel).toMatchObject({ provider: 'openai', model: 'gpt-4.1', fellBack: false });
    expect(getLLMHeaders()).toMatchObject({
      'x-llm-provider': 'openai',
      'x-llm-model': 'gpt-4.1',
      'x-llm-api-key': 'sk-test',
    });
  });

  it('falls back to another keyed provider when the default has no key', () => {
    // default = anthropic (NO key), but openai is enabled + keyed → must fall back
    setConfig({
      defaultProvider: 'anthropic',
      defaultModel: 'claude-x',
      providers: [anthropic, { ...openai, apiKey: 'sk-test' }],
    });
    const sel = getActiveLLMSelection();
    expect(sel?.provider).toBe('openai');
    expect(sel?.fellBack).toBe(true);
    // model must belong to the chosen provider, not the (claude) defaultModel
    expect(sel?.model).toBe('gpt-4o');
  });

  it('swaps to the active provider’s first model when defaultModel belongs elsewhere', () => {
    setConfig({
      defaultProvider: 'openai',
      defaultModel: 'claude-x', // belongs to anthropic, not openai
      providers: [anthropic, { ...openai, apiKey: 'sk-test' }],
    });
    expect(getActiveLLMSelection()?.model).toBe('gpt-4o');
  });
});
