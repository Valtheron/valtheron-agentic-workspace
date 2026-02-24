import { describe, it, expect, beforeEach } from 'vitest';
import { save, load, remove, clearAll, KEYS } from '../services/persistence';

describe('Persistence Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads a string value', () => {
    save('test_key', 'hello');
    expect(load('test_key', '')).toBe('hello');
  });

  it('saves and loads an object', () => {
    const data = { name: 'Test', value: 42 };
    save('obj_key', data);
    expect(load('obj_key', {})).toEqual(data);
  });

  it('returns fallback when key does not exist', () => {
    expect(load('nonexistent', 'default')).toBe('default');
  });

  it('removes a key', () => {
    save('to_remove', 'data');
    remove('to_remove');
    expect(load('to_remove', 'fallback')).toBe('fallback');
  });

  it('clears all valtheron keys', () => {
    save('key1', 'a');
    save('key2', 'b');
    localStorage.setItem('other_key', 'should_stay');

    clearAll();

    expect(load('key1', 'gone')).toBe('gone');
    expect(load('key2', 'gone')).toBe('gone');
    expect(localStorage.getItem('other_key')).toBe('should_stay');
  });

  it('KEYS contains expected storage keys', () => {
    expect(KEYS.LLM_CONFIG).toBe('llm_config');
    expect(KEYS.TASKS).toBe('tasks');
    expect(KEYS.CURRENT_VIEW).toBe('current_view');
    expect(KEYS.KILL_SWITCH).toBe('kill_switch');
  });
});
