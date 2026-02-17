import type { CollaborationSession, Agent } from '../types';

interface CollabProps {
  sessions: CollaborationSession[];
  agents: Agent[];
}

export default function CollaborationView({ sessions, agents }: CollabProps) {
  const getAgentName = (id: string) => agents.find(a => a.id === id)?.name ?? id;

  return (
    <div className="collab-grid">
      {sessions.map(session => (
        <div key={session.id} className="collab-card">
          <div className="collab-header">
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{session.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Gestartet: {new Date(session.startedAt).toLocaleString('de-DE')}
              </div>
            </div>
            <span className={`badge ${session.status}`}>{session.status}</span>
          </div>

          <div className="collab-meta">
            <dt>Delegierung</dt>
            <dd>{session.delegationStrategy}</dd>
            <dt>Konfliktlösung</dt>
            <dd>{session.conflictResolution}</dd>
            <dt>Konsens-Schwelle</dt>
            <dd>{session.consensusThreshold}%</dd>
            <dt>Max Iterationen</dt>
            <dd>{session.maxIterations}</dd>
            <dt>Nachrichten</dt>
            <dd>{session.messageCount}</dd>
            <dt>Redundanz</dt>
            <dd>{session.redundancyScore}%</dd>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="card-title mb-8">Agenten ({session.agents.length})</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {session.agents.map(aid => (
                <span key={aid} className="badge active">{getAgentName(aid)}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="card-title mb-8">Geteilte Dateien</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {session.sharedFiles.map(f => (
                <span key={f} style={{ fontSize: 11, color: 'var(--accent-cyan)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 4 }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="card-title mb-8">Koordinator-Prompt</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: 8, borderRadius: 6, fontStyle: 'italic' }}>
              {session.coordinatorPrompt}
            </div>
          </div>

          {session.synthesis && (
            <div className="collab-synthesis">
              <div className="card-title" style={{ marginBottom: 4 }}>Synthese</div>
              {session.synthesis}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
