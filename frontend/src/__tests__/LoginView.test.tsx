import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginView from '../components/LoginView';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn(),
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

const mockAuthAPI = vi.mocked(api.authAPI);

describe('LoginView', () => {
  const onLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form by default', () => {
    render(<LoginView onLogin={onLogin} />);
    expect(screen.getByText('Valtheron Workspace')).toBeInTheDocument();
    // The submit button in login mode
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. admin')).toBeInTheDocument();
  });

  it('switches to register mode when toggle link is clicked', () => {
    render(<LoginView onLogin={onLogin} />);
    // In login mode the toggle says "Registrieren"
    fireEvent.click(screen.getByRole('button', { name: 'Registrieren' }));
    expect(screen.getByText('Bereits angemeldet?')).toBeInTheDocument();
  });

  it('calls authAPI.login on submit', async () => {
    const fakeUser = { id: '1', username: 'admin', role: 'admin' };
    mockAuthAPI.login.mockResolvedValueOnce({ token: 'tok', user: fakeUser });

    render(<LoginView onLogin={onLogin} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. admin'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'valtheron2024' } });
    // Submit via the submit button's parent form
    fireEvent.submit(screen.getByRole('button', { name: 'Anmelden' }).closest('form')!);

    await waitFor(() => {
      expect(mockAuthAPI.login).toHaveBeenCalledWith('admin', 'valtheron2024');
      expect(onLogin).toHaveBeenCalledWith(fakeUser, false);
    });
  });

  it('shows error message on failed login', async () => {
    mockAuthAPI.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<LoginView onLogin={onLogin} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. admin'), { target: { value: 'bad' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Anmelden' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('calls authAPI.register when in register mode', async () => {
    const fakeUser = { id: '2', username: 'newuser', role: 'operator' };
    mockAuthAPI.register.mockResolvedValueOnce({ token: 'tok2', user: fakeUser });

    render(<LoginView onLogin={onLogin} />);
    // Switch to register mode — toggle button says "Registrieren" in login mode
    fireEvent.click(screen.getByRole('button', { name: 'Registrieren' }));

    fireEvent.change(screen.getByPlaceholderText('e.g. admin'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    // Now in register mode, the submit button says "Registrieren"
    fireEvent.submit(screen.getByRole('button', { name: 'Registrieren' }).closest('form')!);

    await waitFor(() => {
      expect(mockAuthAPI.register).toHaveBeenCalledWith('newuser', 'password123');
      expect(onLogin).toHaveBeenCalledWith(fakeUser, true);
    });
  });
});
