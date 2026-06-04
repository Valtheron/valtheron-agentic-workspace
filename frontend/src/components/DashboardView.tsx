import { useState } from 'react';
import type { AnalyticsData, KillSwitch, SecurityEvent, Agent } from '../types';

interface DashboardProps {
  analytics: AnalyticsData;
  killSwitch: KillSwitch;
  securityEvents: SecurityEvent[];
  agents: Agent[];
  onToggleKillSwitch: () => void;
}

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.floor(seconds)}s`;
}

export default function DashboardView({
  analytics,
  killSwitch,
  securityEvents,
  agents,
  onToggleKillSwitch,
}: DashboardProps) {
  const [showRules, setShowRules] = useState(false);
  const trendCounts = analytics.tasksTrend.map((t) => t.count);
  const maxTrend = trendCounts.length > 0 ? Math.max(...trendCounts) : 0;
  const hasTrendData = maxTrend > 0;

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Agenten Total</div>
          <div className="kpi-value cyan">{analytics.totalAgents}</div>
          <div className="kpi-sub">{analytics.activeAgents} aktiv</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tasks Heute</div>
          <div className="kpi-value green">{analytics.tasksToday}</div>
          <div className="kpi-sub">von {analytics.tasksTotal} gesamt</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Erfolgsrate</div>
          <div className="kpi-value">{analytics.tasksTotal > 0 ? `${analytics.successRate}%` : '—'}</div>
          <div className="kpi-sub">{analytics.tasksTotal > 0 ? 'Durchschnitt aller Agenten' : 'Noch keine Tasks'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Fehlerrate</div>
          <div className="kpi-value red">{analytics.tasksTotal > 0 ? `${analytics.errorRate}%` : '—'}</div>
          <div className="kpi-sub">
            {analytics.tasksTotal > 0 ? `${analytics.avgResponseTime}ms Avg Response` : 'Noch keine Tasks'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Backend-Laufzeit</div>
          <div className="kpi-value green">{formatUptime(analytics.uptimeSeconds)}</div>
          <div className="kpi-sub">seit Prozess-Start</div>
        </div>
      </div>

      <div className="dash-grid">
        <div>
          <div className="card mb-16">
            <div className="card-header">
              <span className="card-title">Tasks Trend (7 Tage)</span>
            </div>
            {hasTrendData ? (
              <div className="chart-placeholder">
                {analytics.tasksTrend.map((t, i) => (
                  <div
                    key={i}
                    className="chart-bar"
                    style={{ height: `${(t.count / maxTrend) * 100}%` }}
                    title={`${t.date}: ${t.count} Tasks`}
                  />
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Noch keine abgeschlossenen Tasks in den letzten 7 Tagen.
              </div>
            )}
          </div>

          <div className="card mb-16">
            <div className="card-header">
              <span className="card-title">Kategorie-Verteilung</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {analytics.categoryDistribution.map((cd) => (
                <div key={cd.category} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-cyan)' }}>{cd.count}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {cd.category}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Security Events</span>
              <span className="badge critical">{securityEvents.filter((e) => !e.resolved).length} offen</span>
            </div>
            {securityEvents.slice(0, 5).map((ev) => (
              <div key={ev.id} className="event-item">
                <div className={`event-dot ${ev.severity}`} />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{ev.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {ev.type} &middot; {new Date(ev.timestamp).toLocaleTimeString('de-DE')}
                    {ev.resolved && ' \u2713 resolved'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className={`kill-switch-panel${killSwitch.aktiv ? ' aktiv' : ''} mb-16`}>
            <div style={{ textAlign: 'center' }}>
              <div className="card-title" style={{ marginBottom: 8 }}>
                Kill Switch
              </div>
              <button
                className={`ks-button ${killSwitch.aktiv ? 'aktiv' : 'safe'}`}
                onClick={onToggleKillSwitch}
                title={
                  killSwitch.aktiv
                    ? 'Klicken um den Kill-Switch zurückzusetzen'
                    : 'Klicken um den Kill-Switch zu zünden'
                }
              >
                {killSwitch.aktiv ? 'GEZÜNDET' : 'STANDBY'}
              </button>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                {killSwitch.aktiv ? 'Alle Agenten suspendiert' : 'Bereit — wird bei Auto-Trigger-Verletzung aktiviert'}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%' }}
                onClick={() => setShowRules(!showRules)}
              >
                {showRules ? 'Regeln verbergen' : `${killSwitch.autoTriggerRules.length} Auto-Trigger-Regeln`}
              </button>
              {showRules && (
                <div style={{ marginTop: 8 }}>
                  {killSwitch.autoTriggerRules.map((rule) => (
                    <div key={rule.id} className="config-row">
                      <span className="config-label">{rule.name}</span>
                      <span style={{ fontSize: 10, color: rule.enabled ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {rule.enabled ? 'AKTIV' : 'AUS'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card mb-16">
            <div className="card-header">
              <span className="card-title">Top Performer</span>
              <span
                style={{ fontSize: 10, color: 'var(--text-muted)' }}
                title="Score basiert auf Capability-Profil, nicht auf bisheriger Ausführung"
              >
                Capability-Score
              </span>
            </div>
            {analytics.topPerformers.length > 0 ? (
              analytics.topPerformers.map((p, i) => (
                <div
                  key={p.agentId}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}
                >
                  <span style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>{i + 1}.</span>
                    <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-orange)' }}>{p.score}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Noch keine Performance-Daten.
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Agent Status</span>
            </div>
            {(['active', 'working', 'idle', 'blocked', 'error'] as const).map((status) => {
              const count = agents.filter((a) => a.status === status).length;
              return (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span className={`badge ${status}`}>{status}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
