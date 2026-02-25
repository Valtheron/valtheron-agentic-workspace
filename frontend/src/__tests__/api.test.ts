import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setToken, getToken } from '../services/api';

describe('API Token Management', () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('setToken stores token in localStorage', () => {
    setToken('test-token-123');
    expect(localStorage.setItem).toHaveBeenCalledWith('valtheron_token', 'test-token-123');
  });

  it('setToken(null) removes token from localStorage', () => {
    setToken(null);
    expect(localStorage.removeItem).toHaveBeenCalledWith('valtheron_token');
  });

  it('getToken returns the current token', () => {
    setToken('my-token');
    expect(getToken()).toBe('my-token');
  });

  it('getToken returns null after clearing', () => {
    setToken('temporary');
    setToken(null);
    expect(getToken()).toBeNull();
  });
});
