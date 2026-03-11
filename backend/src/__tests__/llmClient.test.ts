import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callLLM } from '../services/llmClient.js';

// ── Mock external SDKs ───────────────────────────────────────────────

const mockAnthropicCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class Anthropic {
      messages = { create: mockAnthropicCreate };
    },
  };
});

const mockOpenAICreate = vi.fn();
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = { completions: { create: mockOpenAICreate } };
    },
  };
});

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Helpers ──────────────────────────────────────────────────────────

const baseOpts = {
  model: 'test-model',
  apiKey: 'test-key',
  systemPrompt: 'Du bist ein Assistent.',
  messages: [{ role: 'user' as const, content: 'Hallo' }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Anthropic / Claude ────────────────────────────────────────────────

describe('callLLM — anthropic provider', () => {
  it('gibt text-Block zurück', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Antwort vom LLM' }],
    });

    const result = await callLLM({ ...baseOpts, provider: 'anthropic' });
    expect(result).toBe('Antwort vom LLM');
  });

  it('akzeptiert provider "claude" als Alias', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Claude hier' }],
    });

    const result = await callLLM({ ...baseOpts, provider: 'claude' });
    expect(result).toBe('Claude hier');
  });

  it('gibt [Keine Antwort] zurück wenn Block kein text ist', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'tool_use', id: 'tu_1', name: 'test', input: {} }],
    });

    const result = await callLLM({ ...baseOpts, provider: 'anthropic' });
    expect(result).toBe('[Keine Antwort]');
  });

  it('begrenzt maxTokens auf 4096', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'ok' }],
    });

    await callLLM({ ...baseOpts, provider: 'anthropic', maxTokens: 99999 });

    expect(mockAnthropicCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 4096 }),
    );
  });

  it('übergibt temperature korrekt', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'ok' }],
    });

    await callLLM({ ...baseOpts, provider: 'anthropic', temperature: 0.2 });

    expect(mockAnthropicCreate).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.2 }),
    );
  });

  it('wirft Fehler weiter wenn API fehlschlägt', async () => {
    mockAnthropicCreate.mockRejectedValue(new Error('API Error 500'));

    await expect(callLLM({ ...baseOpts, provider: 'anthropic' })).rejects.toThrow('API Error 500');
  });
});

// ── OpenAI ────────────────────────────────────────────────────────────

describe('callLLM — openai provider', () => {
  it('gibt message content zurück', async () => {
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: 'OpenAI sagt hallo' } }],
    });

    const result = await callLLM({ ...baseOpts, provider: 'openai' });
    expect(result).toBe('OpenAI sagt hallo');
  });

  it('gibt [Keine Antwort] bei leerem choices-Array', async () => {
    mockOpenAICreate.mockResolvedValue({ choices: [] });

    const result = await callLLM({ ...baseOpts, provider: 'openai' });
    expect(result).toBe('[Keine Antwort]');
  });

  it('hängt systemPrompt als system-Message voran', async () => {
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    });

    await callLLM({ ...baseOpts, provider: 'openai' });

    const call = mockOpenAICreate.mock.calls[0][0];
    expect(call.messages[0]).toEqual({ role: 'system', content: baseOpts.systemPrompt });
    expect(call.messages[1]).toEqual(baseOpts.messages[0]);
  });

  it('begrenzt maxTokens auf 4096', async () => {
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    });

    await callLLM({ ...baseOpts, provider: 'openai', maxTokens: 99999 });

    expect(mockOpenAICreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 4096 }),
    );
  });
});

// ── Ollama ────────────────────────────────────────────────────────────

describe('callLLM — ollama provider', () => {
  it('gibt message content zurück', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'Ollama antwortet' } }),
    });

    const result = await callLLM({ ...baseOpts, provider: 'ollama' });
    expect(result).toBe('Ollama antwortet');
  });

  it('nutzt Standard-Endpoint localhost:11434', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'ok' } }),
    });

    await callLLM({ ...baseOpts, provider: 'ollama' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.any(Object),
    );
  });

  it('nutzt benutzerdefinierten ollamaEndpoint aus params', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'ok' } }),
    });

    await callLLM({
      ...baseOpts,
      provider: 'ollama',
      params: { ollamaEndpoint: 'http://mein-server:11434' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://mein-server:11434/api/chat',
      expect.any(Object),
    );
  });

  it('wirft Fehler bei HTTP-Fehlerantwort', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    });

    await expect(callLLM({ ...baseOpts, provider: 'ollama' })).rejects.toThrow('Ollama 503: Service Unavailable');
  });

  it('gibt [Keine Antwort] wenn message fehlt', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = await callLLM({ ...baseOpts, provider: 'ollama' });
    expect(result).toBe('[Keine Antwort]');
  });
});

// ── Custom Provider ───────────────────────────────────────────────────

describe('callLLM — custom provider', () => {
  const customOpts = {
    ...baseOpts,
    provider: 'custom',
    params: { customEndpoint: 'https://mein-llm.example.com/v1/chat' },
  };

  it('gibt choices[0].message.content zurück', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Custom LLM hier' } }] }),
    });

    const result = await callLLM(customOpts);
    expect(result).toBe('Custom LLM hier');
  });

  it('setzt Authorization Bearer Header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });

    await callLLM(customOpts);

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['Authorization']).toBe(`Bearer ${baseOpts.apiKey}`);
  });

  it('wirft Fehler wenn customEndpoint fehlt', async () => {
    await expect(
      callLLM({ ...baseOpts, provider: 'custom' }),
    ).rejects.toThrow('Custom provider requires "customEndpoint"');
  });

  it('wirft Fehler bei HTTP-Fehlerantwort', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(callLLM(customOpts)).rejects.toThrow('Custom endpoint 401: Unauthorized');
  });

  it('gibt [Keine Antwort] wenn choices leer', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    const result = await callLLM(customOpts);
    expect(result).toBe('[Keine Antwort]');
  });
});

// ── Unbekannter Provider ──────────────────────────────────────────────

describe('callLLM — unbekannter provider', () => {
  it('wirft Fehler', async () => {
    await expect(
      callLLM({ ...baseOpts, provider: 'unbekannt' }),
    ).rejects.toThrow('Unbekannter Provider: unbekannt');
  });
});
