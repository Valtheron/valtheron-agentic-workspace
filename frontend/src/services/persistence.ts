// localStorage persistence service for Valtheron Agentic Workspace

const STORAGE_PREFIX = 'valtheron_';

export function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error(`[Persistence] Failed to save "${key}":`, e);
  }
}

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`[Persistence] Failed to load "${key}":`, e);
    return fallback;
  }
}

export function remove(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}

export function clearAll(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}

// Storage keys
export const KEYS = {
  LLM_CONFIG: 'llm_config',
  SECURITY_CONFIG: 'security_config',
  KILL_SWITCH: 'kill_switch',
  TASKS: 'tasks',
  SIDEBAR_EXPANDED: 'sidebar_expanded',
  CURRENT_VIEW: 'current_view',
  SELECTED_AGENT: 'selected_agent',
  AGENT_LLM_OVERRIDES: 'agent_llm_overrides',
} as const;
