import { useState } from 'react';
import type { FormEvent } from 'react';
import { authAPI, setToken } from '../services/api';

interface LoginViewProps {
  onLogin: (user: { id: string; username: string; role: string }) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res =
        mode === 'login' ? await authAPI.login(username, password) : await authAPI.register(username, password);
      setToken(res.token);
      onLogin(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: '2.5rem 2rem',
          width: '100%',
          maxWidth: 380,
        }}
      >
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.4rem', color: 'var(--text-primary)' }}>Valtheron Workspace</h1>
        <p style={{ margin: '0 0 1.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? 'Sign in to continue' : 'Create a new account'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="e.g. admin"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                color: 'var(--text-primary)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                color: 'var(--text-primary)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {error && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent-red)' }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Bitte warten...' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {mode === 'login' ? 'Noch kein Konto? ' : 'Bereits angemeldet? '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
              padding: 0,
              fontSize: '0.8rem',
            }}
          >
            {mode === 'login' ? 'Registrieren' : 'Anmelden'}
          </button>
        </p>

        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Demo: <strong>admin</strong> / <strong>valtheron2024</strong>
        </p>
      </div>
    </div>
  );
}
