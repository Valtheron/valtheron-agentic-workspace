import type { LLMConfig, LLMProvider, LLMModel } from '../types';

// Pre-defined models for each cloud provider
const openaiModels: LLMModel[] = [
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', contextWindow: 1047576, maxOutput: 32768, costPer1kInput: 0.002, costPer1kOutput: 0.008, capabilities: ['text', 'vision', 'code', 'function-calling', 'json-mode'], isLocal: false },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai', contextWindow: 1047576, maxOutput: 32768, costPer1kInput: 0.0004, costPer1kOutput: 0.0016, capabilities: ['text', 'vision', 'code', 'function-calling', 'json-mode'], isLocal: false },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai', contextWindow: 1047576, maxOutput: 32768, costPer1kInput: 0.0001, costPer1kOutput: 0.0004, capabilities: ['text', 'code', 'function-calling', 'json-mode'], isLocal: false },
  { id: 'o3', name: 'o3 (Reasoning)', provider: 'openai', contextWindow: 200000, maxOutput: 100000, costPer1kInput: 0.002, costPer1kOutput: 0.008, capabilities: ['text', 'vision', 'code', 'function-calling'], isLocal: false },
  { id: 'o4-mini', name: 'o4-mini (Reasoning)', provider: 'openai', contextWindow: 200000, maxOutput: 100000, costPer1kInput: 0.0011, costPer1kOutput: 0.0044, capabilities: ['text', 'vision', 'code', 'function-calling'], isLocal: false },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000, maxOutput: 16384, costPer1kInput: 0.0025, costPer1kOutput: 0.01, capabilities: ['text', 'vision', 'code', 'function-calling', 'json-mode'], isLocal: false },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000, maxOutput: 16384, costPer1kInput: 0.00015, costPer1kOutput: 0.0006, capabilities: ['text', 'vision', 'code', 'function-calling', 'json-mode'], isLocal: false },
];

const anthropicModels: LLMModel[] = [
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'anthropic', contextWindow: 200000, maxOutput: 32000, costPer1kInput: 0.015, costPer1kOutput: 0.075, capabilities: ['text', 'vision', 'code', 'function-calling', 'json-mode'], isLocal: false },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'anthropic', contextWindow: 200000, maxOutput: 16000, costPer1kInput: 0.003, costPer1kOutput: 0.015, capabilities: ['text', 'vision', 'code', 'function-calling', 'json-mode'], isLocal: false },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'anthropic', contextWindow: 200000, maxOutput: 8192, costPer1kInput: 0.0008, costPer1kOutput: 0.004, capabilities: ['text', 'vision', 'code', 'function-calling', 'json-mode'], isLocal: false },
];

const googleModels: LLMModel[] = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', contextWindow: 1000000, maxOutput: 65536, costPer1kInput: 0.00125, costPer1kOutput: 0.01, capabilities: ['text', 'vision', 'code', 'function-calling', 'json-mode'], isLocal: false },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', contextWindow: 1000000, maxOutput: 65536, costPer1kInput: 0.00015, costPer1kOutput: 0.0006, capabilities: ['text', 'vision', 'code', 'function-calling', 'json-mode'], isLocal: false },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', contextWindow: 1000000, maxOutput: 8192, costPer1kInput: 0.0001, costPer1kOutput: 0.0004, capabilities: ['text', 'vision', 'code', 'function-calling'], isLocal: false },
];

const mistralModels: LLMModel[] = [
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', contextWindow: 128000, maxOutput: 8192, costPer1kInput: 0.002, costPer1kOutput: 0.006, capabilities: ['text', 'code', 'function-calling', 'json-mode'], isLocal: false },
  { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'mistral', contextWindow: 128000, maxOutput: 8192, costPer1kInput: 0.001, costPer1kOutput: 0.003, capabilities: ['text', 'code', 'function-calling'], isLocal: false },
  { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral', contextWindow: 128000, maxOutput: 8192, costPer1kInput: 0.0002, costPer1kOutput: 0.0006, capabilities: ['text', 'code', 'function-calling'], isLocal: false },
  { id: 'codestral-latest', name: 'Codestral', provider: 'mistral', contextWindow: 256000, maxOutput: 8192, costPer1kInput: 0.0003, costPer1kOutput: 0.0009, capabilities: ['text', 'code', 'function-calling'], isLocal: false },
];

const groqModels: LLMModel[] = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', contextWindow: 128000, maxOutput: 32768, costPer1kInput: 0.00059, costPer1kOutput: 0.00079, capabilities: ['text', 'code', 'function-calling', 'json-mode'], isLocal: false },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'groq', contextWindow: 128000, maxOutput: 8192, costPer1kInput: 0.00005, costPer1kOutput: 0.00008, capabilities: ['text', 'code', 'json-mode'], isLocal: false },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', contextWindow: 32768, maxOutput: 4096, costPer1kInput: 0.00024, costPer1kOutput: 0.00024, capabilities: ['text', 'code', 'json-mode'], isLocal: false },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'groq', contextWindow: 8192, maxOutput: 4096, costPer1kInput: 0.0002, costPer1kOutput: 0.0002, capabilities: ['text', 'code'], isLocal: false },
];

const openrouterModels: LLMModel[] = [
  { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)', provider: 'openrouter', contextWindow: 128000, maxOutput: 16384, costPer1kInput: 0.0025, costPer1kOutput: 0.01, capabilities: ['text', 'vision', 'code', 'function-calling'], isLocal: false },
  { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5 (via OpenRouter)', provider: 'openrouter', contextWindow: 200000, maxOutput: 16000, costPer1kInput: 0.003, costPer1kOutput: 0.015, capabilities: ['text', 'vision', 'code', 'function-calling'], isLocal: false },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (via OpenRouter)', provider: 'openrouter', contextWindow: 1000000, maxOutput: 65536, costPer1kInput: 0.00125, costPer1kOutput: 0.01, capabilities: ['text', 'vision', 'code', 'function-calling'], isLocal: false },
  { id: 'meta-llama/llama-3.3-70b', name: 'Llama 3.3 70B (via OpenRouter)', provider: 'openrouter', contextWindow: 128000, maxOutput: 4096, costPer1kInput: 0.0004, costPer1kOutput: 0.0004, capabilities: ['text', 'code'], isLocal: false },
];

export const defaultProviders: LLMProvider[] = [
  { id: 'anthropic', name: 'Anthropic', enabled: true, baseUrl: 'https://api.anthropic.com', models: anthropicModels, status: 'disconnected', isLocal: false },
  { id: 'openai', name: 'OpenAI', enabled: true, baseUrl: 'https://api.openai.com/v1', models: openaiModels, status: 'disconnected', isLocal: false },
  { id: 'google', name: 'Google AI', enabled: false, baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: googleModels, status: 'disconnected', isLocal: false },
  { id: 'mistral', name: 'Mistral AI', enabled: false, baseUrl: 'https://api.mistral.ai/v1', models: mistralModels, status: 'disconnected', isLocal: false },
  { id: 'groq', name: 'Groq', enabled: false, baseUrl: 'https://api.groq.com/openai/v1', models: groqModels, status: 'disconnected', isLocal: false },
  { id: 'openrouter', name: 'OpenRouter', enabled: false, baseUrl: 'https://openrouter.ai/api/v1', models: openrouterModels, status: 'disconnected', isLocal: false },
  { id: 'ollama', name: 'Ollama (Lokal)', enabled: true, baseUrl: 'http://localhost:11434', models: [], status: 'disconnected', isLocal: true },
  { id: 'custom', name: 'Custom Endpoint', enabled: false, baseUrl: '', models: [], status: 'disconnected', isLocal: false },
];

export const defaultLLMConfig: LLMConfig = {
  defaultProvider: 'anthropic',
  defaultModel: 'claude-sonnet-4-5-20250929',
  providers: defaultProviders,
  agentModelOverrides: {},
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModels: [],
  globalParameters: {
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.95,
    streamResponses: true,
    retryOnFailure: true,
    maxRetries: 3,
    timeoutMs: 30000,
  },
};

// Ollama API helpers
export async function fetchOllamaModels(endpoint: string): Promise<{ name: string; size: number; digest: string; modified_at: string; details: { format: string; family: string; parameter_size: string; quantization_level: string } }[]> {
  const response = await fetch(`${endpoint}/api/tags`);
  if (!response.ok) throw new Error(`Ollama not reachable: ${response.status}`);
  const data = await response.json();
  return data.models ?? [];
}

export async function checkOllamaStatus(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

export async function checkProviderStatus(provider: LLMProvider): Promise<'connected' | 'disconnected' | 'error'> {
  if (provider.id === 'ollama') {
    const ok = await checkOllamaStatus(provider.baseUrl);
    return ok ? 'connected' : 'disconnected';
  }
  // For cloud providers, we just check if an API key is set
  if (!provider.apiKey && provider.id !== 'custom') return 'disconnected';
  return 'connected';
}
