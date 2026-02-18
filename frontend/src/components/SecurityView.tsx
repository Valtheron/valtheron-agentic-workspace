import { useState } from 'react';
import type { SecurityEvent, SecurityConfig, AuditEntry } from '../types';

interface SecurityProps {
  events: SecurityEvent[];
  config: SecurityConfig;
  auditLog: AuditEntry[];
  onConfigChange: (config: SecurityConfig) => void;
}

export default function SecurityView({ events, config, auditLog, onConfigChange }: SecurityProps) {
  const [tab, setTab] = useState<'events' | 'config' | 'audit' | 'advanced'>('events');

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button className={`toggle${on ? ' on' : ''}`} onClick={onToggle} />
  );

  return (
    <div>
      <div className="tabs">
        {(['events', 'config', 'audit', 'advanced'] as const).map(t => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'events' ? 'Security Events' : t === 'config' ? 'Konfiguration' : t === 'audit' ? 'Audit Log' : 'Advanced'}
          </button>
        ))}
      </div>

      {tab === 'events' && (
        <div className="security-layout">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Offene Events</span>
              <span className="badge critical">{events.filter(e => !e.resolved).length}</span>
            </div>
            {events.filter(e => !e.resolved).map(ev => (
              <div key={ev.id} className="event-item">
                <div className={`event-dot ${ev.severity}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 2 }}>{ev.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    <span className={`badge ${ev.severity}`} style={{ marginRight: 6 }}>{ev.severity}</span>
                    {ev.type} &middot; {new Date(ev.timestamp).toLocaleTimeString('de-DE')}
                    {ev.agentId && ` \u00b7 ${ev.agentId}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Gelöste Events</span>
              <span className="badge valid">{events.filter(e => e.resolved).length}</span>
            </div>
            {events.filter(e => e.resolved).map(ev => (
              <div key={ev.id} className="event-item" style={{ opacity: 0.6 }}>
                <div className={`event-dot ${ev.severity}`} />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{ev.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {ev.type} &middot; {new Date(ev.timestamp).toLocaleTimeString('de-DE')} &middot; resolved
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title mb-8">Prompt Injection Defense</div>
            <div className="config-row">
              <span className="config-label">Aktiver Schutz</span>
              <Toggle on={config.promptInjectionDefense} onToggle={() => onConfigChange({ ...config, promptInjectionDefense: !config.promptInjectionDefense })} />
            </div>
          </div>
          <div className="card">
            <div className="card-title mb-8">PII Detection</div>
            {Object.entries(config.piiDetection).map(([key, val]) => (
              <div key={key} className="config-row">
                <span className="config-label">{key}</span>
                <Toggle on={val} onToggle={() => onConfigChange({ ...config, piiDetection: { ...config.piiDetection, [key]: !val } })} />
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title mb-8">GDPR</div>
            {Object.entries(config.gdpr).map(([key, val]) => (
              <div key={key} className="config-row">
                <span className="config-label">{key.replace(/([A-Z])/g, ' $1')}</span>
                <Toggle on={val} onToggle={() => onConfigChange({ ...config, gdpr: { ...config.gdpr, [key]: !val } })} />
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title mb-8">Encryption</div>
            {Object.entries(config.encryption).map(([key, val]) => (
              <div key={key} className="config-row">
                <span className="config-label">{key.toUpperCase()}</span>
                <Toggle on={val} onToggle={() => onConfigChange({ ...config, encryption: { ...config.encryption, [key]: !val } })} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Audit Trail</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{auditLog.length} Einträge</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Zeit</th>
                  <th>Agent</th>
                  <th>Aktion</th>
                  <th>Details</th>
                  <th>Risiko</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.slice(0, 30).map(entry => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.timestamp).toLocaleTimeString('de-DE')}</td>
                    <td>{entry.agentId}</td>
                    <td><code style={{ fontSize: 11 }}>{entry.action}</code></td>
                    <td>{entry.details}</td>
                    <td><span className={`badge ${entry.riskLevel}`}>{entry.riskLevel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'advanced' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title mb-8">Zero Trust</div>
            {Object.entries(config.zeroTrust).map(([key, val]) => (
              <div key={key} className="config-row">
                <span className="config-label">{key.replace(/([A-Z])/g, ' $1')}</span>
                <Toggle on={val} onToggle={() => onConfigChange({ ...config, zeroTrust: { ...config.zeroTrust, [key]: !val } })} />
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title mb-8">Threat Model</div>
            {Object.entries(config.threatModel).map(([key, val]) => (
              <div key={key} className="config-row">
                <span className="config-label">{key.replace(/([A-Z])/g, ' $1')}</span>
                <Toggle on={val} onToggle={() => onConfigChange({ ...config, threatModel: { ...config.threatModel, [key]: !val } })} />
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title mb-8">RBAC</div>
            <div className="config-row">
              <span className="config-label">Aktive Rolle</span>
              <select
                value={config.rbac.activeRole}
                onChange={e => onConfigChange({ ...config, rbac: { ...config.rbac, activeRole: e.target.value } })}
                style={{ padding: '4px 8px', fontSize: 11 }}
              >
                {config.rbac.roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              Rollen: {config.rbac.roles.join(', ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
