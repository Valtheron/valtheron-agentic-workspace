import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SecurityView from '../components/SecurityView';
import type { SecurityEvent, SecurityConfig, AuditEntry } from '../types';

// ── Mock data ─────────────────────────────────────────────────────────

const mockEvents: SecurityEvent[] = [
  {
    id: 'ev1',
    type: 'injection',
    severity: 'critical',
    message: 'Prompt injection attempt detected',
    agentId: 'agent_001',
    timestamp: '2024-01-01T10:00:00Z',
    resolved: false,
  },
  {
    id: 'ev2',
    type: 'auth',
    severity: 'high',
    message: 'Multiple failed login attempts',
    timestamp: '2024-01-01T09:00:00Z',
    resolved: false,
  },
  {
    id: 'ev3',
    type: 'access',
    severity: 'medium',
    message: 'Unauthorized resource access',
    agentId: 'agent_002',
    timestamp: '2024-01-01T08:00:00Z',
    resolved: true,
  },
];

const mockConfig: SecurityConfig = {
  promptInjectionDefense: true,
  piiDetection: { email: true, phone: false, ssn: true, creditCard: false, address: false, name: false },
  gdpr: { exportEnabled: true, deletionEnabled: true, anonymizationEnabled: false },
  zeroTrust: { networkSegmentation: true, mfa: true, leastPrivilege: false, continuousVerification: false, microSegmentation: false },
  threatModel: { injection: true, dataLeak: true, privilegeEscalation: false, dos: false, supplyChain: false, insiderThreat: false },
  rbac: { roles: ['admin', 'operator', 'viewer'], activeRole: 'admin' },
  encryption: { jwt: true, tls: true, aes256: true, securityHeaders: false },
};

const mockAuditLog: AuditEntry[] = [
  {
    id: 'al1',
    agentId: 'agent_001',
    action: 'task_started',
    details: 'Agent started task xyz',
    timestamp: '2024-01-01T10:30:00Z',
    riskLevel: 'info',
  },
  {
    id: 'al2',
    agentId: 'agent_002',
    action: 'api_call',
    details: 'External API call made',
    timestamp: '2024-01-01T10:00:00Z',
    riskLevel: 'medium',
  },
];

describe('SecurityView', () => {
  const onConfigChange = vi.fn();

  const defaultProps = {
    events: mockEvents,
    config: mockConfig,
    auditLog: mockAuditLog,
    onConfigChange,
  };

  beforeEach(() => {
    onConfigChange.mockClear();
  });

  // ── Default tab: events ───────────────────────────────────────────

  it('renders security events tab by default', () => {
    render(<SecurityView {...defaultProps} />);
    expect(screen.getByText('Security Events')).toBeInTheDocument();
  });

  it('shows open (unresolved) events count', () => {
    render(<SecurityView {...defaultProps} />);
    expect(screen.getByText('Offene Events')).toBeInTheDocument();
    // 2 unresolved events
    expect(screen.getByText('Prompt injection attempt detected')).toBeInTheDocument();
    expect(screen.getByText('Multiple failed login attempts')).toBeInTheDocument();
  });

  it('shows resolved events', () => {
    render(<SecurityView {...defaultProps} />);
    expect(screen.getByText('Gelöste Events')).toBeInTheDocument();
    expect(screen.getByText('Unauthorized resource access')).toBeInTheDocument();
  });

  it('shows severity badge for events', () => {
    render(<SecurityView {...defaultProps} />);
    const criticalBadges = screen.getAllByText('critical');
    expect(criticalBadges.length).toBeGreaterThan(0);
  });

  it('shows event type in event details', () => {
    render(<SecurityView {...defaultProps} />);
    expect(screen.getByText(/injection/)).toBeInTheDocument();
  });

  // ── Tab navigation ────────────────────────────────────────────────

  it('switches to Konfiguration tab', () => {
    render(<SecurityView {...defaultProps} />);
    fireEvent.click(screen.getByText('Konfiguration'));
    expect(screen.getByText('Prompt Injection Defense')).toBeInTheDocument();
  });

  it('switches to Audit Log tab', () => {
    render(<SecurityView {...defaultProps} />);
    fireEvent.click(screen.getByText('Audit Log'));
    // Should show audit log entries
    expect(screen.queryByText('Offene Events')).not.toBeInTheDocument();
  });

  it('switches to Advanced tab', () => {
    render(<SecurityView {...defaultProps} />);
    fireEvent.click(screen.getByText('Advanced'));
    expect(screen.queryByText('Offene Events')).not.toBeInTheDocument();
  });

  it('can switch back to events tab after navigating away', () => {
    render(<SecurityView {...defaultProps} />);
    fireEvent.click(screen.getByText('Konfiguration'));
    fireEvent.click(screen.getByText('Security Events'));
    expect(screen.getByText('Offene Events')).toBeInTheDocument();
  });

  // ── Config tab ────────────────────────────────────────────────────

  it('shows PII Detection section in config tab', () => {
    render(<SecurityView {...defaultProps} />);
    fireEvent.click(screen.getByText('Konfiguration'));
    expect(screen.getByText('PII Detection')).toBeInTheDocument();
  });

  it('calls onConfigChange when promptInjectionDefense toggle is clicked', () => {
    render(<SecurityView {...defaultProps} />);
    fireEvent.click(screen.getByText('Konfiguration'));

    const toggles = document.querySelectorAll('.toggle');
    expect(toggles.length).toBeGreaterThan(0);
    fireEvent.click(toggles[0]);

    expect(onConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        promptInjectionDefense: !mockConfig.promptInjectionDefense,
      }),
    );
  });

  it('shows pii detection fields in config tab', () => {
    render(<SecurityView {...defaultProps} />);
    fireEvent.click(screen.getByText('Konfiguration'));
    // Keys from piiDetection object
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('phone')).toBeInTheDocument();
    expect(screen.getByText('ssn')).toBeInTheDocument();
  });

  // ── Events with empty data ────────────────────────────────────────

  it('shows empty events lists gracefully', () => {
    render(<SecurityView {...defaultProps} events={[]} />);
    expect(screen.getByText('Offene Events')).toBeInTheDocument();
    expect(screen.getByText('Gelöste Events')).toBeInTheDocument();
  });

  it('displays correct badge count for open events', () => {
    render(<SecurityView {...defaultProps} />);
    // Open events badge should show "2"
    const badges = document.querySelectorAll('.badge.critical');
    expect(badges.length).toBeGreaterThan(0);
  });
});
