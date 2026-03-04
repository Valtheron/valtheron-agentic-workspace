import { useState } from 'react';
import type { KillSwitch, KillSwitchEvent, Agent, AgentRiskProfile } from '../types';

interface KillSwitchViewProps {
  killSwitch: KillSwitch;
  agents: Agent[];
  onToggleKillSwitch: () => void;
  onUpdateKillSwitch: (ks: KillSwitch) => void;
  onUpdateAgents: (agents: Agent[]) => void;
}

type Tab = 'panel' | 'history' | 'risk' | 'batch';

const defaultRisk: AgentRiskProfile = {
  riskLevel: 'medium',
  maxConcurrentTasks: 5,
  maxTokenBudget: 100000,
  autoSuspendOnFailure: false,
  failureThreshold: 3,
  cooldownPeriod: 60,
  requiresApproval: false,
};

const riskColors: Record<string, string> = {
  low: 'var(--accent-green)',
  medium: 'var(--accent-orange)',
  high: 'var(--accent-red)',
  critical: '#ff1744',
};

function genId() {
  return `kse_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function KillSwitchView({
  killSwitch,
  agents,
  onToggleKillSwitch,
  onUpdateKillSwitch,
  onUpdateAgents,
}: KillSwitchViewProps) {
  const [tab, setTab] = useState<Tab>('panel');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReason, setConfirmReason] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [riskAgent, setRiskAgent] = useState<string | null>(null);
  const [batchFilter, setBatchFilter] = useState<string>('all');

  const history = killSwitch.history ?? [];

  const addEvent = (action: KillSwitchEvent['action'], reason: string, affected: string[]) => {
    const evt: KillSwitchEvent = {
      id: genId(),
      action,
      triggeredBy: 'admin',
      reason,
      affectedAgents: affected,
      timestamp: new Date().toISOString(),
    };
    onUpdateKillSwitch({ ...killSwitch, history: [evt, ...history] });
  };

  const handleConfirmToggle = () => {
    const action = killSwitch.armed ? 'disarmed' : 'armed';
    addEvent(
      action,
      confirmReason || (action === 'armed' ? 'Manual activation' : 'Manual deactivation'),
      killSwitch.affectedAgents,
    );
    onToggleKillSwitch();
    setConfirmOpen(false);
    setConfirmReason('');
  };

  const toggleSelect = (id: string) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const filtered = getFilteredAgents();
    if (selectedAgents.size === filtered.length) {
      setSelectedAgents(new Set());
    } else {
      setSelectedAgents(new Set(filtered.map((a) => a.id)));
    }
  };

  const getFilteredAgents = () => {
    if (batchFilter === 'all') return agents;
    return agents.filter((a) => a.category === batchFilter);
  };

  const batchSetStatus = (status: 'active' | 'idle' | 'suspended') => {
    const ids = selectedAgents;
    const updated = agents.map((a) => (ids.has(a.id) ? { ...a, status } : a));
    onUpdateAgents(updated);
    addEvent(status === 'suspended' ? 'batch_stop' : 'batch_start', `Batch ${status} for ${ids.size} agents`, [...ids]);
    setSelectedAgents(new Set());
  };

  const updateRiskProfile = (agentId: string, profile: AgentRiskProfile) => {
    onUpdateAgents(agents.map((a) => (a.id === agentId ? { ...a, riskProfile: profile } : a)));
  };

  const riskAgentData = agents.find((a) => a.id === riskAgent);
  const currentRisk = riskAgentData?.riskProfile ?? defaultRisk;
  const filteredAgents = getFilteredAgents();
  const categories = ['all', ...new Set(agents.map((a) => a.category))];

  return (
    <div>
      <div className="tabs">
        {(
          [
            ['panel', 'Kill-Switch'],
            ['history', 'History Log'],
            ['risk', 'Risiko-Parameter'],
            ['batch', 'Batch Operations'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k as Tab)}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'panel' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '40px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2 }}>
            Emergency Kill Switch
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            style={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              background: killSwitch.armed ? 'var(--accent-red)' : 'var(--accent-green)',
              color: 'white',
              fontWeight: 800,
              fontSize: 18,
              textTransform: 'uppercase',
              letterSpacing: 2,
              boxShadow: killSwitch.armed
                ? '0 0 40px rgba(239,68,68,0.5), 0 0 80px rgba(239,68,68,0.2)'
                : '0 0 40px rgba(16,185,129,0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            {killSwitch.armed ? 'ARMED' : 'SAFE'}
          </button>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {killSwitch.armed
                ? 'System ist geschuetzt. Alle Agenten werden ueberwacht. Automatische Trigger sind aktiv.'
                : 'Kill-Switch ist deaktiviert. Kein automatischer Schutz aktiv.'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {agents.filter((a) => a.status === 'active' || a.status === 'working').length} aktive Agenten &middot;{' '}
              {killSwitch.autoTriggerRules.filter((r) => r.enabled).length} Auto-Trigger aktiv
            </div>
          </div>

          <div className="card" style={{ width: '100%', maxWidth: 600 }}>
            <div className="card-title mb-8">Auto-Trigger Regeln</div>
            {killSwitch.autoTriggerRules.map((rule) => (
              <div key={rule.id} className="config-row">
                <div>
                  <span className="config-label">{rule.name}</span>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{rule.condition}</div>
                </div>
                <button
                  className={`toggle${rule.enabled ? ' on' : ''}`}
                  onClick={() => {
                    const rules = killSwitch.autoTriggerRules.map((r) =>
                      r.id === rule.id ? { ...r, enabled: !r.enabled } : r,
                    );
                    onUpdateKillSwitch({ ...killSwitch, autoTriggerRules: rules });
                  }}
                />
              </div>
            ))}
          </div>

          {confirmOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div className="card" style={{ width: 420, textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: killSwitch.armed ? 'var(--accent-green)' : 'var(--accent-red)',
                    marginBottom: 16,
                  }}
                >
                  {killSwitch.armed ? 'Kill-Switch deaktivieren?' : 'Kill-Switch aktivieren?'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  {killSwitch.armed
                    ? 'Der automatische Schutz wird deaktiviert. Sind Sie sicher?'
                    : 'Alle laufenden Agenten werden ueberwacht. Auto-Trigger werden scharf geschaltet.'}
                </div>
                <input
                  placeholder="Grund (optional)..."
                  value={confirmReason}
                  onChange={(e) => setConfirmReason(e.target.value)}
                  style={{ width: '100%', marginBottom: 16 }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
                    Abbrechen
                  </button>
                  <button
                    className={`btn ${killSwitch.armed ? 'btn-primary' : 'btn-danger'}`}
                    onClick={handleConfirmToggle}
                  >
                    {killSwitch.armed ? 'Deaktivieren' : 'AKTIVIEREN'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Kill-Switch History ({history.length} Events)</span>
          </div>
          {history.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Keine Events vorhanden
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Zeit</th>
                    <th>Aktion</th>
                    <th>Grund</th>
                    <th>Von</th>
                    <th>Betroffene Agenten</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 50).map((evt) => (
                    <tr key={evt.id}>
                      <td>{new Date(evt.timestamp).toLocaleString('de-DE')}</td>
                      <td>
                        <span
                          className={`badge ${evt.action === 'armed' || evt.action === 'triggered' ? 'critical' : evt.action === 'disarmed' ? 'valid' : 'info'}`}
                        >
                          {evt.action}
                        </span>
                      </td>
                      <td>{evt.reason || '-'}</td>
                      <td>{evt.triggeredBy}</td>
                      <td>{evt.affectedAgents.length > 0 ? `${evt.affectedAgents.length} Agenten` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'risk' && (
        <div className="grid-2">
          <div className="card" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div className="card-title mb-8">Agent auswaehlen</div>
            {agents.map((a) => (
              <div
                key={a.id}
                className={`config-row`}
                style={{
                  cursor: 'pointer',
                  padding: '8px 4px',
                  borderRadius: 4,
                  background: riskAgent === a.id ? 'var(--bg-hover)' : 'transparent',
                }}
                onClick={() => setRiskAgent(a.id)}
              >
                <div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 12 }}>{a.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>{a.category}</span>
                </div>
                <span
                  style={{ fontSize: 11, color: riskColors[(a.riskProfile ?? defaultRisk).riskLevel], fontWeight: 600 }}
                >
                  {(a.riskProfile ?? defaultRisk).riskLevel.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <div className="card">
            {riskAgentData ? (
              <>
                <div className="card-title mb-8">Risiko-Parameter: {riskAgentData.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Risiko-Level</label>
                    <select
                      value={currentRisk.riskLevel}
                      onChange={(e) =>
                        updateRiskProfile(riskAgentData.id, {
                          ...currentRisk,
                          riskLevel: e.target.value as AgentRiskProfile['riskLevel'],
                        })
                      }
                      style={{ width: '100%' }}
                    >
                      {(['low', 'medium', 'high', 'critical'] as const).map((l) => (
                        <option key={l} value={l}>
                          {l.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max Concurrent Tasks</label>
                    <input
                      type="number"
                      value={currentRisk.maxConcurrentTasks}
                      onChange={(e) =>
                        updateRiskProfile(riskAgentData.id, { ...currentRisk, maxConcurrentTasks: +e.target.value })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max Token Budget</label>
                    <input
                      type="number"
                      value={currentRisk.maxTokenBudget}
                      onChange={(e) =>
                        updateRiskProfile(riskAgentData.id, { ...currentRisk, maxTokenBudget: +e.target.value })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Failure Threshold</label>
                    <input
                      type="number"
                      value={currentRisk.failureThreshold}
                      onChange={(e) =>
                        updateRiskProfile(riskAgentData.id, { ...currentRisk, failureThreshold: +e.target.value })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cooldown (Sekunden)</label>
                    <input
                      type="number"
                      value={currentRisk.cooldownPeriod}
                      onChange={(e) =>
                        updateRiskProfile(riskAgentData.id, { ...currentRisk, cooldownPeriod: +e.target.value })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="config-row">
                    <span className="config-label">Auto-Suspend bei Fehler</span>
                    <button
                      className={`toggle${currentRisk.autoSuspendOnFailure ? ' on' : ''}`}
                      onClick={() =>
                        updateRiskProfile(riskAgentData.id, {
                          ...currentRisk,
                          autoSuspendOnFailure: !currentRisk.autoSuspendOnFailure,
                        })
                      }
                    />
                  </div>
                  <div className="config-row">
                    <span className="config-label">Genehmigung erforderlich</span>
                    <button
                      className={`toggle${currentRisk.requiresApproval ? ' on' : ''}`}
                      onClick={() =>
                        updateRiskProfile(riskAgentData.id, {
                          ...currentRisk,
                          requiresApproval: !currentRisk.requiresApproval,
                        })
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Agent auswaehlen um Risiko-Parameter zu bearbeiten
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'batch' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              style={{ padding: '6px 10px' }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'Alle Kategorien' : c}
                </option>
              ))}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={selectAll}>
              {selectedAgents.size === filteredAgents.length ? 'Alle abwaehlen' : 'Alle auswaehlen'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedAgents.size} ausgewaehlt</span>
            <div style={{ flex: 1 }} />
            <button
              className="btn btn-primary btn-sm"
              disabled={selectedAgents.size === 0}
              onClick={() => batchSetStatus('active')}
            >
              Batch Start ({selectedAgents.size})
            </button>
            <button
              className="btn btn-danger btn-sm"
              disabled={selectedAgents.size === 0}
              onClick={() => batchSetStatus('suspended')}
            >
              Batch Stop ({selectedAgents.size})
            </button>
            <button
              className="btn btn-ghost btn-sm"
              disabled={selectedAgents.size === 0}
              onClick={() => {
                addEvent('batch_start', `Batch evaluation for ${selectedAgents.size} agents`, [...selectedAgents]);
                setSelectedAgents(new Set());
              }}
            >
              Batch Evaluation
            </button>
            <button
              className="btn btn-ghost btn-sm"
              disabled={selectedAgents.size === 0}
              onClick={() => {
                addEvent('batch_start', `Batch certification for ${selectedAgents.size} agents`, [...selectedAgents]);
                setSelectedAgents(new Set());
              }}
            >
              Batch Zertifizierung
            </button>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 30 }}></th>
                    <th>Agent</th>
                    <th>Kategorie</th>
                    <th>Status</th>
                    <th>Erfolgsrate</th>
                    <th>Risiko</th>
                    <th>Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((a) => (
                    <tr key={a.id} onClick={() => toggleSelect(a.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <input type="checkbox" checked={selectedAgents.has(a.id)} onChange={() => toggleSelect(a.id)} />
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.name}</td>
                      <td>
                        <span className="kanban-tag">{a.category}</span>
                      </td>
                      <td>
                        <span className={`badge ${a.status}`}>{a.status}</span>
                      </td>
                      <td>{a.successRate}%</td>
                      <td>
                        <span
                          style={{
                            color: riskColors[(a.riskProfile ?? defaultRisk).riskLevel],
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        >
                          {(a.riskProfile ?? defaultRisk).riskLevel.toUpperCase()}
                        </span>
                      </td>
                      <td>{a.tasksCompleted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

