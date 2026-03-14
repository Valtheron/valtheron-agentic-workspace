import { useState } from 'react';
import type { AnalyticsData, KillSwitch, SecurityEvent, Agent } from '../types';

interface DashboardProps {
  analytics: AnalyticsData;
  killSwitch: KillSwitch;
  securityEvents: SecurityEvent[];
  agents: Agent[];
  onToggleKillSwitch: () => void;
}

export default function DashboardView({ analytics, killSwitch, securityEvents, agents, onToggleKillSwitch }: DashboardProps) {
  const [showRules, setShowRules] = useState(false);
  const maxTrend = Math.max(...analytics.tasksTrend.map(t => t.count));

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
          <div className="kpi-sub">von 80 total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Erfolgsrate</div>
          <div className="kpi-value">{analytics.successRate}%</div>
          <div className="kpi-sub">Durchschnitt aller Agenten</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Fehlerrate</div>
          <div className="kpi-value red">{analytics.errorRate}%</div>
          <div className="kpi-sub">{analytics.avgResponseTime}ms Avg Response</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Uptime</div>
          <div className="kpi-value green">{analytics.uptime}%</div>
          <div className="kpi-sub">System-Verfügbarkeit</div>
        </div>
      </div>

      <div className="dash-grid">
        <div>
          <div className="card mb-16">
            <div className="card-header">
              <span className="card-title">Tasks Trend (7 Tage)</span>
            </div>
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
          </div>

          <div className="card mb-16">
            <div className="card-header">
              <span className="card-title">Kategorie-Verteilung</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {analytics.categoryDistribution.map(cd => (
                <div key={cd.category} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-cyan)' }}>{cd.count}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cd.category}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Security Events</span>
              <span className="badge critical">{securityEvents.filter(e => !e.resolved).length} offen</span>
            </div>
            {securityEvents.slice(0, 5).map(ev => (
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
              <div className="card-title" style={{ marginBottom: 8 }}>Kill Switch</div>
              <button
                className={`ks-button ${killSwitch.aktiv ? 'aktiv' : 'safe'}`}
                onClick={onToggleKillSwitch}
              >
                {killSwitch.aktiv ? 'AKTIV' : 'INAKTIV'}
              </button>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                {killSwitch.aktiv ? 'System geschützt - Auto-Trigger aktiv' : 'Kill-Switch deaktiviert'}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => setShowRules(!showRules)}>
                {showRules ? 'Regeln verbergen' : `${killSwitch.autoTriggerRules.length} Auto-Trigger-Regeln`}
              </button>
              {showRules && (
                <div style={{ marginTop: 8 }}>
                  {killSwitch.autoTriggerRules.map(rule => (
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
            </div>
            {analytics.topPerformers.map((p, i) => (
              <div key={p.agentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <span style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>{i + 1}.</span>
                  <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                </span>
                <span style={{ fontWeight: 700, color: 'var(--accent-orange)' }}>{p.score}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Agent Status</span>
            </div>
            {(['active', 'working', 'idle', 'blocked', 'error'] as const).map(status => {
              const count = agents.filter(a => a.status === status).length;
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
