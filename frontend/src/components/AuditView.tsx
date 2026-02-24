import { useState, useEffect, useCallback } from 'react';

interface AuditEntry {
  id: string;
  agentId: string;
  action: string;
  details: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'info';
  timestamp: string;
}

const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  info: '#64748b',
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchAuditLog(filters: { riskLevel?: string; agentId?: string; limit: number }) {
  const params = new URLSearchParams();
  if (filters.riskLevel) params.set('riskLevel', filters.riskLevel);
  if (filters.agentId) params.set('agentId', filters.agentId);
  params.set('limit', String(filters.limit));

  const token = localStorage.getItem('valtheron_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/security/audit?${params}`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { entries: AuditEntry[] };
  return data.entries;
}

export default function AuditView() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [limit, setLimit] = useState(100);
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLog({
        riskLevel: riskFilter || undefined,
        agentId: agentFilter || undefined,
        limit,
      });
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Audit-Logs');
    } finally {
      setLoading(false);
    }
  }, [riskFilter, agentFilter, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (riskFilter) params.set('riskLevel', riskFilter);
    if (agentFilter) params.set('agentId', agentFilter);
    const token = localStorage.getItem('valtheron_token');
    const url = `${API_BASE}/security/audit/export?${params}`;
    // Open in new tab; server sends Content-Disposition: attachment
    const a = document.createElement('a');
    a.href = token ? url + `&_token=${encodeURIComponent(token)}` : url;
    a.download = 'audit-log.csv';
    a.click();
  };

  const stats = {
    total: entries.length,
    critical: entries.filter((e) => e.riskLevel === 'critical').length,
    high: entries.filter((e) => e.riskLevel === 'high').length,
    medium: entries.filter((e) => e.riskLevel === 'medium').length,
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
            Audit-Trail
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Vollständiges Protokoll aller Systemoperationen und Sicherheitsereignisse
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={load}
            style={{
              padding: '6px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ↻ Aktualisieren
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '6px 14px',
              background: 'var(--accent-cyan)',
              border: 'none',
              borderRadius: '6px',
              color: '#060a14',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ↓ CSV Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Gesamt', value: stats.total, color: 'var(--text-primary)' },
          { label: 'Kritisch', value: stats.critical, color: RISK_COLORS.critical },
          { label: 'Hoch', value: stats.high, color: RISK_COLORS.high },
          { label: 'Mittel', value: stats.medium, color: RISK_COLORS.medium },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          padding: '12px 16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}
      >
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            padding: '5px 10px',
            fontSize: '12px',
          }}
        >
          <option value="">Alle Risikostufen</option>
          <option value="critical">Kritisch</option>
          <option value="high">Hoch</option>
          <option value="medium">Mittel</option>
          <option value="info">Info</option>
        </select>

        <input
          type="text"
          placeholder="Agent ID filtern..."
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            padding: '5px 10px',
            fontSize: '12px',
            flex: 1,
          }}
        />

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            padding: '5px 10px',
            fontSize: '12px',
          }}
        >
          <option value={50}>50 Einträge</option>
          <option value={100}>100 Einträge</option>
          <option value={250}>250 Einträge</option>
          <option value={500}>500 Einträge</option>
        </select>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: '16px' }}>
        {/* Table */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Lade Audit-Log...</div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-red)' }}>{error}</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Keine Audit-Einträge gefunden.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Zeitstempel', 'Risiko', 'Aktion', 'Agent ID', 'Details'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: selected?.id === entry.id ? 'var(--bg-hover)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (selected?.id !== entry.id)
                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (selected?.id !== entry.id) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '9px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(entry.timestamp).toLocaleString('de-DE')}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          background: RISK_COLORS[entry.riskLevel] + '22',
                          color: RISK_COLORS[entry.riskLevel],
                          border: `1px solid ${RISK_COLORS[entry.riskLevel]}44`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {entry.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-primary)', maxWidth: '200px' }}>
                      <span
                        style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {entry.agentId.slice(0, 8)}…
                    </td>
                    <td
                      style={{
                        padding: '9px 12px',
                        color: 'var(--text-muted)',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              height: 'fit-content',
              position: 'sticky',
              top: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>Eintrag-Details</span>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ×
              </button>
            </div>
            {[
              { label: 'ID', value: selected.id, mono: true },
              { label: 'Agent ID', value: selected.agentId, mono: true },
              { label: 'Aktion', value: selected.action, mono: false },
              { label: 'Risikostufe', value: selected.riskLevel.toUpperCase(), mono: false },
              { label: 'Zeitstempel', value: new Date(selected.timestamp).toLocaleString('de-DE'), mono: false },
              { label: 'Details', value: selected.details || '—', mono: false },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginBottom: '3px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    wordBreak: 'break-all',
                    fontFamily: mono ? 'monospace' : 'inherit',
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
