import { useState, useMemo } from 'react';
import type { Agent, Task, AnalyticsData, SLAMetric, PerformanceTrend } from '../types';

interface AnalyticsProps {
  analytics: AnalyticsData;
  agents: Agent[];
  tasks: Task[];
}

type Tab = 'trends' | 'throughput' | 'errors' | 'capacity' | 'sla' | 'success';

<<<<<<< Updated upstream
<<<<<<< Updated upstream
function generateTrends(agents: Agent[], _tasks: Task[]): PerformanceTrend[] {
=======
function generateTrends(agents: Agent[]): PerformanceTrend[] {
>>>>>>> Stashed changes
=======
function generateTrends(agents: Agent[]): PerformanceTrend[] {
>>>>>>> Stashed changes
  const now = Date.now();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now - (29 - i) * 86400000);
    const seed = d.getDate() + d.getMonth() * 31;
    const base = agents.length;
    return {
      date: d.toISOString().slice(0, 10),
      throughput: Math.floor(base * 0.3 + Math.sin(seed * 0.7) * base * 0.15 + Math.random() * base * 0.1),
      errorRate: +(2 + Math.sin(seed * 1.3) * 1.5 + Math.random()).toFixed(1),
      avgResponseTime: Math.floor(150 + Math.sin(seed * 0.5) * 50 + Math.random() * 30),
      successRate: +(94 + Math.sin(seed * 0.3) * 3 + Math.random()).toFixed(1),
      activeAgents: Math.floor(base * 0.5 + Math.sin(seed * 0.9) * base * 0.2),
    };
  });
}

function generateSLAs(): SLAMetric[] {
  return [
    {
      id: 's1',
      name: 'Response Time',
      metric: 'response_time',
      threshold: 200,
      unit: 'ms',
      current: 168,
      status: 'met',
      period: 'daily',
      history: Array.from({ length: 24 }, (_, i) => ({ timestamp: `${i}:00`, value: 140 + Math.random() * 80 })),
    },
    {
      id: 's2',
      name: 'Success Rate',
      metric: 'success_rate',
      threshold: 95,
      unit: '%',
      current: 96.2,
      status: 'met',
      period: 'daily',
      history: Array.from({ length: 24 }, (_, i) => ({ timestamp: `${i}:00`, value: 93 + Math.random() * 5 })),
    },
    {
      id: 's3',
      name: 'System Uptime',
      metric: 'uptime',
      threshold: 99.5,
      unit: '%',
      current: 99.8,
      status: 'met',
      period: 'monthly',
      history: Array.from({ length: 30 }, (_, i) => ({ timestamp: `Tag ${i + 1}`, value: 99 + Math.random() })),
    },
    {
      id: 's4',
      name: 'Throughput',
      metric: 'throughput',
      threshold: 50,
      unit: 'tasks/h',
      current: 47,
      status: 'warning',
      period: 'hourly',
      history: Array.from({ length: 24 }, (_, i) => ({ timestamp: `${i}:00`, value: 35 + Math.random() * 25 })),
    },
    {
      id: 's5',
      name: 'Error Rate',
      metric: 'error_rate',
      threshold: 5,
      unit: '%',
      current: 6.1,
      status: 'breached',
      period: 'daily',
      history: Array.from({ length: 24 }, (_, i) => ({ timestamp: `${i}:00`, value: 3 + Math.random() * 5 })),
    },
  ];
}

// SVG Mini Chart
function LineChart({
  data,
  width = 300,
  height = 120,
  color = 'var(--accent-cyan)',
  showDots = false,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data) * 0.9;
  const max = Math.max(...data) * 1.1;
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');
  const area = `0,${height} ${points} ${(data.length - 1) * step},${height}`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polygon points={area} fill={color} opacity="0.1" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
      {showDots &&
        data.map((v, i) => (
          <circle key={i} cx={i * step} cy={height - ((v - min) / range) * height} r="3" fill={color} opacity="0.8">
            <title>{v.toFixed(1)}</title>
          </circle>
        ))}
    </svg>
  );
}

function BarChart({
  data,
  labels,
  width = 300,
  height = 140,
  color = 'var(--accent-cyan)',
}: {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data) * 1.1 || 1;
  const barW = Math.max(4, width / data.length - 4);
  const gap = (width - barW * data.length) / (data.length + 1);

  return (
    <svg width={width} height={height + 20} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const x = gap + i * (barW + gap);
        const h = (v / max) * height;
        return (
          <g key={i}>
            <rect x={x} y={height - h} width={barW} height={h} fill={color} opacity="0.7" rx="2">
              <title>
                {labels?.[i] ?? ''}: {v}
              </title>
            </rect>
            {labels && labels[i] && (
              <text x={x + barW / 2} y={height + 14} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                {labels[i].slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
export default function AnalyticsView({ analytics: _analytics, agents, tasks }: AnalyticsProps) {
=======
export default function AnalyticsView({ analytics: _analytics, agents, tasks: _tasks }: AnalyticsProps) {
>>>>>>> Stashed changes
=======
export default function AnalyticsView({ analytics: _analytics, agents, tasks: _tasks }: AnalyticsProps) {
>>>>>>> Stashed changes
  const [tab, setTab] = useState<Tab>('trends');
  const trends = useMemo(() => generateTrends(agents), [agents]);
  const slas = useMemo(generateSLAs, []);

  const catCounts = useMemo(() => {
    const map: Record<string, { total: number; active: number; idle: number; working: number }> = {};
    agents.forEach((a) => {
      if (!map[a.category]) map[a.category] = { total: 0, active: 0, idle: 0, working: 0 };
      map[a.category].total++;
      if (a.status === 'active') map[a.category].active++;
      if (a.status === 'idle') map[a.category].idle++;
      if (a.status === 'working') map[a.category].working++;
    });
    return map;
  }, [agents]);

  const successByAgent = useMemo(
    () => [...agents].sort((a, b) => b.successRate - a.successRate).slice(0, 20),
    [agents],
  );

  const slaColors: Record<string, string> = {
    met: 'var(--accent-green)',
    warning: 'var(--accent-orange)',
    breached: 'var(--accent-red)',
  };

  return (
    <div>
      <div className="tabs">
        {(
          [
            ['trends', 'Performance Trends'],
            ['throughput', 'Durchsatz'],
            ['errors', 'Fehlerrate'],
            ['capacity', 'Capacity Planning'],
            ['sla', 'SLA Monitoring'],
            ['success', 'Erfolgsrate'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k as Tab)}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'trends' && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Avg Durchsatz (30d)</div>
              <div className="kpi-value cyan">
                {Math.round(trends.reduce((s, t) => s + t.throughput, 0) / trends.length)}
              </div>
              <div className="kpi-sub">Tasks/Tag</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Avg Response Time</div>
              <div className="kpi-value">
                {Math.round(trends.reduce((s, t) => s + t.avgResponseTime, 0) / trends.length)}ms
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Avg Erfolgsrate</div>
              <div className="kpi-value green">
                {(trends.reduce((s, t) => s + t.successRate, 0) / trends.length).toFixed(1)}%
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Avg Fehlerrate</div>
              <div className="kpi-value red">
                {(trends.reduce((s, t) => s + t.errorRate, 0) / trends.length).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="card-title mb-8">Durchsatz Trend (30 Tage)</div>
              <LineChart data={trends.map((t) => t.throughput)} width={500} height={150} />
            </div>
            <div className="card">
              <div className="card-title mb-8">Response Time Trend (30 Tage)</div>
              <LineChart
                data={trends.map((t) => t.avgResponseTime)}
                width={500}
                height={150}
                color="var(--accent-orange)"
              />
            </div>
            <div className="card">
              <div className="card-title mb-8">Erfolgsrate Trend (30 Tage)</div>
              <LineChart data={trends.map((t) => t.successRate)} width={500} height={150} color="var(--accent-green)" />
            </div>
            <div className="card">
              <div className="card-title mb-8">Aktive Agenten (30 Tage)</div>
              <LineChart data={trends.map((t) => t.activeAgents)} width={500} height={150} color="var(--accent-blue)" />
            </div>
          </div>
        </div>
      )}

      {tab === 'throughput' && (
        <div>
          <div className="card mb-16">
            <div className="card-title mb-8">Agent-Durchsatz ueber Zeit (30 Tage)</div>
            <BarChart
              data={trends.map((t) => t.throughput)}
              labels={trends.map((t) => t.date)}
              width={800}
              height={200}
            />
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="card-title mb-8">Durchsatz pro Kategorie</div>
              {Object.entries(catCounts).map(([cat, c]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, width: 100, color: 'var(--text-secondary)' }}>{cat}</span>
                  <div
                    style={{ flex: 1, height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(c.total / agents.length) * 100}%`,
                        background: 'var(--accent-cyan)',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 30 }}>{c.total}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-title mb-8">Top 10 Agenten nach Tasks</div>
              {[...agents]
                .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
                .slice(0, 10)
                .map((a, i) => (
                  <div key={a.id} className="config-row">
                    <span style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{i + 1}.</span>
                      {a.name}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{a.tasksCompleted}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'errors' && (
        <div>
          <div className="card mb-16">
            <div className="card-title mb-8">Fehlerrate ueber Zeit (30 Tage)</div>
            <LineChart
              data={trends.map((t) => t.errorRate)}
              width={800}
              height={200}
              color="var(--accent-red)"
              showDots
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--text-muted)',
                marginTop: 4,
              }}
            >
              <span>{trends[0]?.date}</span>
              <span>Threshold: 5%</span>
              <span>{trends[trends.length - 1]?.date}</span>
            </div>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="card-title mb-8">Fehler pro Kategorie</div>
              {Object.entries(catCounts).map(([cat]) => {
                const catAgents = agents.filter((a) => a.category === cat);
                const avgFail = catAgents.length
                  ? catAgents.reduce((s, a) => s + a.failedTasks, 0) / catAgents.length
                  : 0;
                return (
                  <div key={cat} className="config-row">
                    <span className="config-label">{cat}</span>
                    <span
                      style={{ fontWeight: 600, color: avgFail > 10 ? 'var(--accent-red)' : 'var(--text-secondary)' }}
                    >
                      {avgFail.toFixed(1)} avg
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <div className="card-title mb-8">Agenten mit hoechster Fehlerrate</div>
              {[...agents]
                .sort(
                  (a, b) =>
                    b.failedTasks / (b.tasksCompleted + b.failedTasks || 1) -
                    a.failedTasks / (a.tasksCompleted + a.failedTasks || 1),
                )
                .slice(0, 10)
                .map((a) => (
                  <div key={a.id} className="config-row">
                    <span style={{ fontSize: 12 }}>{a.name}</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>
                      {((a.failedTasks / (a.tasksCompleted + a.failedTasks || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'capacity' && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Total Agenten</div>
              <div className="kpi-value cyan">{agents.length}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Auslastung</div>
              <div className="kpi-value orange">
                {(
                  (agents.filter((a) => a.status === 'working' || a.status === 'active').length / agents.length) *
                  100
                ).toFixed(0)}
                %
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Idle Agenten</div>
              <div className="kpi-value">{agents.filter((a) => a.status === 'idle').length}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Blockierte</div>
              <div className="kpi-value red">
                {agents.filter((a) => a.status === 'blocked' || a.status === 'error').length}
              </div>
            </div>
          </div>
          <div className="card mb-16">
            <div className="card-title mb-8">Kapazitaet pro Kategorie</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {Object.entries(catCounts).map(([cat, c]) => {
                const util = c.total ? ((c.active + c.working) / c.total) * 100 : 0;
                return (
                  <div key={cat} className="card" style={{ padding: 12 }}>
                    <div
                      style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}
                    >
                      {cat}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color:
                          util > 80 ? 'var(--accent-red)' : util > 50 ? 'var(--accent-orange)' : 'var(--accent-green)',
                      }}
                    >
                      {util.toFixed(0)}%
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: 'var(--bg-hover)',
                        borderRadius: 3,
                        marginTop: 6,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${util}%`,
                          background:
                            util > 80
                              ? 'var(--accent-red)'
                              : util > 50
                                ? 'var(--accent-orange)'
                                : 'var(--accent-green)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      {c.working} working / {c.active} active / {c.idle} idle / {c.total} total
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'sla' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {slas.map((sla) => (
              <div key={sla.id} className="card" style={{ borderLeft: `3px solid ${slaColors[sla.status]}` }}>
                <div className="flex-between mb-8">
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{sla.name}</span>
                  <span
                    className={`badge ${sla.status === 'met' ? 'valid' : sla.status === 'warning' ? 'high' : 'critical'}`}
                  >
                    {sla.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: slaColors[sla.status] }}>
                  {sla.current}
                  {sla.unit}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Threshold: {sla.threshold}
                  {sla.unit} | {sla.period}
                </div>
                <LineChart
                  data={sla.history.map((h) => h.value)}
                  width={220}
                  height={60}
                  color={slaColors[sla.status]}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'success' && (
        <div>
          <div className="card mb-16">
            <div className="card-title mb-8">Agent Success Rate Trend (30 Tage)</div>
            <LineChart
              data={trends.map((t) => t.successRate)}
              width={800}
              height={200}
              color="var(--accent-green)"
              showDots
            />
          </div>
          <div className="card">
            <div className="card-title mb-8">Erfolgsrate pro Agent (Top 20)</div>
            {successByAgent.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 20 }}>{i + 1}</span>
                <span style={{ fontSize: 12, flex: 1, color: 'var(--text-primary)' }}>{a.name}</span>
                <div
                  style={{ width: 200, height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${a.successRate}%`,
                      background:
                        a.successRate >= 97
                          ? 'var(--accent-green)'
                          : a.successRate >= 90
                            ? 'var(--accent-cyan)'
                            : 'var(--accent-orange)',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    width: 40,
                    textAlign: 'right',
                    color: a.successRate >= 97 ? 'var(--accent-green)' : 'var(--text-secondary)',
                  }}
                >
                  {a.successRate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
