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

/**
 * Unified LLM call — supports anthropic, openai, ollama, custom.
 * Extracted from chat.ts so both chat and execution engine can use it.
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

  if (provider === 'openai') {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model,
      max_tokens: Math.min(maxTokens, 4096),
      temperature,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });
    return response.choices[0]?.message?.content || '[Keine Antwort]';
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
