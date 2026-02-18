import { useState } from 'react';
import type { Certification } from '../types';

interface CertProps {
  certifications: Certification[];
}

export default function CertificationsView({ certifications }: CertProps) {
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Certification | null>(null);

  const filtered = filter === 'all' ? certifications : certifications.filter(c => c.status === filter);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16, height: 'calc(100vh - 120px)' }}>
      <div style={{ overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['all', 'valid', 'expiring', 'expired', 'suspended', 'revoked'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Alle' : f} ({f === 'all' ? certifications.length : certifications.filter(c => c.status === f).length})
            </button>
          ))}
        </div>

        <div className="cert-grid">
          <div className="cert-row" style={{ background: 'transparent', fontWeight: 600, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <div>Agent</div>
            <div style={{ textAlign: 'center' }}>Level</div>
            <div style={{ textAlign: 'center' }}>Score</div>
            <div style={{ textAlign: 'center' }}>Status</div>
            <div style={{ textAlign: 'center' }}>Ablauf</div>
          </div>
          {filtered.map(cert => (
            <div
              key={cert.id}
              className="cert-row"
              style={{ cursor: 'pointer', borderColor: selected?.id === cert.id ? 'var(--accent-cyan)' : undefined }}
              onClick={() => setSelected(cert)}
            >
              <div>
                <div className="cert-name">{cert.agentName}</div>
                <div className="cert-agent">{cert.agentId}</div>
              </div>
              <div style={{ textAlign: 'center' }}><span className={`badge ${cert.level}`}>{cert.level}</span></div>
              <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-orange)' }}>{cert.score}</div>
              <div style={{ textAlign: 'center' }}><span className={`badge ${cert.status}`}>{cert.status}</span></div>
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(cert.expiresAt).toLocaleDateString('de-DE')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.agentName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selected.id}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>&times;</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 12 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Level:</span> <span className={`badge ${selected.level}`}>{selected.level}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`badge ${selected.status}`}>{selected.status}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Score:</span> <span style={{ fontWeight: 700, color: 'var(--accent-orange)' }}>{selected.score}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Ausgestellt:</span> {new Date(selected.issuedAt).toLocaleDateString('de-DE')}</div>
          </div>

          <div className="card-title mb-8">Tests</div>
          {selected.tests.map((test, i) => (
            <div key={i} className="config-row">
              <span className="config-label">{test.name}</span>
              <span style={{ fontWeight: 600, color: test.passed ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {test.passed ? 'PASS' : 'FAIL'} ({test.score})
              </span>
            </div>
          ))}

          {selected.monitoringAlerts.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="card-title mb-8">Monitoring Alerts ({selected.monitoringAlerts.length})</div>
              {selected.monitoringAlerts.map(alert => (
                <div key={alert.id} className="event-item">
                  <div className={`event-dot ${alert.severity}`} />
                  <div>
                    <div style={{ fontSize: 12 }}>{alert.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {alert.type} &middot; {alert.resolved ? 'resolved' : 'open'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected.revocationReason && (
            <div style={{ marginTop: 16, padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 6, fontSize: 12, color: 'var(--accent-red)' }}>
              Revocation: {selected.revocationReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
