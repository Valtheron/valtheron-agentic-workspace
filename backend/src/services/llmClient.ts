import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface LLMCallOptions {
  provider: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
  temperature?: number;
  params?: Record<string, unknown>;
}

// Providers that speak the OpenAI Chat Completions API — reachable with the
// OpenAI SDK by pointing it at their base URL. Keeps the UI's advertised
// Groq/Mistral/OpenRouter providers actually callable instead of throwing
// "Unbekannter Provider".
const OPENAI_COMPATIBLE_BASE_URLS: Record<string, string> = {
  groq: 'https://api.groq.com/openai/v1',
  mistral: 'https://api.mistral.ai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  xai: 'https://api.x.ai/v1',
};

/**
 * Unified LLM call — supports anthropic, openai, the OpenAI-compatible
 * providers (groq, mistral, openrouter), google (Gemini), ollama and custom.
 * Extracted from chat.ts so chat, execution engine and collaboration can use it.
 */
export async function callLLM(opts: LLMCallOptions): Promise<string> {
  const { provider, model, apiKey, systemPrompt, messages, maxTokens = 1024, temperature = 0.7, params = {} } = opts;

  if (provider === 'anthropic' || provider === 'claude') {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: Math.min(maxTokens, 4096),
      temperature,
      system: systemPrompt,
      messages,
    });
    const block = response.content[0];
    return block.type === 'text' ? block.text : '[Keine Antwort]';
  }

  if (provider === 'openai' || provider in OPENAI_COMPATIBLE_BASE_URLS) {
    // openai → SDK default base URL; groq/mistral/openrouter → their base URL.
    const baseURL = OPENAI_COMPATIBLE_BASE_URLS[provider];
    const client = new OpenAI(baseURL ? { apiKey, baseURL } : { apiKey });
    const response = await client.chat.completions.create({
      model,
      max_tokens: Math.min(maxTokens, 4096),
      temperature,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });
    return response.choices[0]?.message?.content || '[Keine Antwort]';
  }

  if (provider === 'google' || provider === 'gemini') {
    // Google Gemini uses its own REST shape (not OpenAI-compatible).
    const base = (params.googleBaseUrl as string) || 'https://generativelanguage.googleapis.com/v1beta';
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const response = await fetch(`${base}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature, maxOutputTokens: Math.min(maxTokens, 4096) },
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google ${response.status}: ${errText}`);
    }
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '[Keine Antwort]';
  }

  if (provider === 'ollama') {
    const ollamaBase = (params.ollamaEndpoint as string) || 'http://localhost:11434';
    const response = await fetch(`${ollamaBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: false,
        options: { temperature, num_predict: Math.min(maxTokens, 4096) },
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama ${response.status}: ${errText}`);
    }
    const data = (await response.json()) as { message?: { content?: string } };
    return data.message?.content || '[Keine Antwort]';
  }

  if (provider === 'custom') {
    const endpoint = params.customEndpoint as string;
    if (!endpoint) throw new Error('Custom provider requires "customEndpoint" in agent parameters');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(maxTokens, 4096),
        temperature,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Custom endpoint ${response.status}: ${errText}`);
    }
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content || '[Keine Antwort]';
  }

  throw new Error(`Unbekannter Provider: ${provider}`);
}
