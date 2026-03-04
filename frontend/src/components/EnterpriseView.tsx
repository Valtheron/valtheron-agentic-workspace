import { useState, useMemo } from 'react';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import type {
  Agent,
  AuditEntry,
  Incident,
  IncidentTimelineEvent,
  Policy,
  AgentVersion,
  SharedFile,
  HealthMetric,
} from '../types';
=======
import type { Agent, AuditEntry, Incident, IncidentTimelineEvent, Policy, AgentVersion, SharedFile, HealthMetric } from '../types';
>>>>>>> Stashed changes
=======
import type { Agent, AuditEntry, Incident, IncidentTimelineEvent, Policy, AgentVersion, SharedFile, HealthMetric } from '../types';
>>>>>>> Stashed changes

interface EnterpriseProps {
  agents: Agent[];
  auditLog: AuditEntry[];
}

type Tab = 'health' | 'incidents' | 'policies' | 'rollback' | 'workspace' | 'audit' | 'reports';

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// Generate mock data
<<<<<<< Updated upstream
<<<<<<< Updated upstream
function generateIncidents(_agents: Agent[]): Incident[] {
=======
function generateIncidents(): Incident[] {
>>>>>>> Stashed changes
=======
function generateIncidents(): Incident[] {
>>>>>>> Stashed changes
  return [
    {
      id: 'inc_001',
      title: 'Hohe Fehlerrate bei Trading-Agenten',
      description: 'Fehlerrate ueber 15% bei Trading-Agenten seit 14:00',
      severity: 'high',
      status: 'investigating',
      assignedTo: ['admin'],
      affectedAgents: ['agent_001', 'agent_002'],
      timeline: [
        {
          id: 'tl_1',
          type: 'created',
          message: 'Incident erstellt aufgrund SLA-Verletzung',
          author: 'system',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'tl_2',
          type: 'assigned',
          message: 'Zugewiesen an Admin-Team',
          author: 'system',
          timestamp: new Date(Date.now() - 6000000).toISOString(),
        },
        {
          id: 'tl_3',
          type: 'comment',
          message: 'Erste Analyse: Moeglicher API-Timeout bei externem Provider',
          author: 'admin',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      slaResponseTime: 30,
      slaResolutionTime: 240,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'inc_002',
      title: 'Security-Scan fehlgeschlagen',
      description: 'Automatischer Security-Scan konnte nicht abgeschlossen werden',
      severity: 'medium',
      status: 'resolved',
      assignedTo: ['admin'],
      affectedAgents: ['agent_021'],
      timeline: [
        {
          id: 'tl_4',
          type: 'created',
          message: 'Scan-Failure erkannt',
          author: 'system',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'tl_5',
          type: 'resolved',
          message: 'Scan-Konfiguration korrigiert',
          author: 'admin',
          timestamp: new Date(Date.now() - 43200000).toISOString(),
        },
      ],
      rca: 'Fehlkonfiguration im Scan-Profil nach letztem Update. Fix: Rollback der Scan-Regeln.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      resolvedAt: new Date(Date.now() - 43200000).toISOString(),
    },
  ];
}

function generatePolicies(): Policy[] {
  return [
    {
      id: 'pol_001',
      name: 'Max Token Budget',
      description: 'Limitiert Token-Verbrauch pro Agent',
      rules: [
        { id: 'r1', condition: 'token_usage', operator: 'greater_than', value: '100000', action: 'alert' },
        { id: 'r2', condition: 'token_usage', operator: 'greater_than', value: '500000', action: 'deny' },
      ],
      enabled: true,
      priority: 1,
      scope: 'global',
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pol_002',
      name: 'API Rate Limiting',
      description: 'Beschraenkt API-Aufrufe pro Minute',
      rules: [
        { id: 'r3', condition: 'api_calls_per_min', operator: 'greater_than', value: '60', action: 'log' },
        { id: 'r4', condition: 'api_calls_per_min', operator: 'greater_than', value: '120', action: 'deny' },
      ],
      enabled: true,
      priority: 2,
      scope: 'global',
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pol_003',
      name: 'Trading Risk Guard',
      description: 'Spezielle Limits fuer Trading-Agenten',
      rules: [
        { id: 'r5', condition: 'trade_volume', operator: 'greater_than', value: '10000', action: 'require_approval' },
      ],
      enabled: true,
      priority: 1,
      scope: 'category',
      scopeTarget: 'trading',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function generateVersions(agents: Agent[]): AgentVersion[] {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  return agents.slice(0, 10).flatMap((a, _i) => [
    {
      id: genId('v'),
      agentId: a.id,
      version: 2,
      changes: 'System-Prompt optimiert, Temperature angepasst',
      snapshot: { systemPrompt: a.systemPrompt, parameters: a.parameters, personality: a.personality },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      createdBy: 'admin',
    },
    {
      id: genId('v'),
      agentId: a.id,
      version: 1,
      changes: 'Initiale Konfiguration',
      snapshot: {
        systemPrompt: `Initiale Version von ${a.name}`,
        parameters: { ...a.parameters, temperature: 0.5 },
        personality: { ...a.personality, creativity: 50 },
      },
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      createdBy: 'system',
    },
=======
=======
>>>>>>> Stashed changes
  return agents.slice(0, 10).flatMap((a) => [
    { id: genId('v'), agentId: a.id, version: 2, changes: 'System-Prompt optimiert, Temperature angepasst', snapshot: { systemPrompt: a.systemPrompt, parameters: a.parameters, personality: a.personality }, createdAt: new Date(Date.now() - 86400000).toISOString(), createdBy: 'admin' },
    { id: genId('v'), agentId: a.id, version: 1, changes: 'Initiale Konfiguration', snapshot: { systemPrompt: `Initiale Version von ${a.name}`, parameters: { ...a.parameters, temperature: 0.5 }, personality: { ...a.personality, creativity: 50 } }, createdAt: new Date(Date.now() - 604800000).toISOString(), createdBy: 'system' },
>>>>>>> Stashed changes
  ]);
}

function generateSharedFiles(): SharedFile[] {
  return [
    {
      id: 'sf_1',
      name: 'risk_model.py',
      path: '/shared/models/',
      owner: 'agent_001',
      sharedWith: ['agent_002', 'agent_003'],
      size: 15400,
      lastModified: new Date(Date.now() - 3600000).toISOString(),
      type: 'code',
    },
    {
      id: 'sf_2',
      name: 'market_data.csv',
      path: '/shared/data/',
      owner: 'agent_005',
      sharedWith: ['agent_001', 'agent_002', 'agent_004'],
      size: 2048000,
      lastModified: new Date(Date.now() - 7200000).toISOString(),
      type: 'data',
    },
    {
      id: 'sf_3',
      name: 'security_config.json',
      path: '/shared/config/',
      owner: 'agent_021',
      sharedWith: ['agent_022', 'agent_023'],
      size: 3200,
      lastModified: new Date(Date.now() - 14400000).toISOString(),
      type: 'config',
    },
    {
      id: 'sf_4',
      name: 'deployment_guide.md',
      path: '/shared/docs/',
      owner: 'agent_081',
      sharedWith: ['agent_101', 'agent_102'],
      size: 8900,
      lastModified: new Date(Date.now() - 86400000).toISOString(),
      type: 'document',
    },
  ];
}

function generateHealth(agents: Agent[]): HealthMetric[] {
  return agents.slice(0, 30).map((a) => ({
    agentId: a.id,
    agentName: a.name,
    cpu: Math.floor(20 + Math.random() * 70),
    memory: Math.floor(30 + Math.random() * 60),
    responseTime: Math.floor(50 + Math.random() * 200),
    errorRate: +(Math.random() * 10).toFixed(1),
    uptime: +(95 + Math.random() * 5).toFixed(2),
    lastCheck: new Date(Date.now() - Math.floor(Math.random() * 300000)).toISOString(),
    status: Math.random() > 0.85 ? (Math.random() > 0.5 ? 'degraded' : 'unhealthy') : 'healthy',
  }));
}

const healthColors: Record<string, string> = {
  healthy: 'var(--accent-green)',
  degraded: 'var(--accent-orange)',
  unhealthy: 'var(--accent-red)',
  offline: 'var(--text-muted)',
};
const fileTypeIcons: Record<string, string> = { code: '\u2261', config: '\u2699', document: '\u2261', data: '\u25A3' };
const operatorLabels: Record<string, string> = {
  equals: '=',
  greater_than: '>',
  less_than: '<',
  contains: 'enthalt',
  not_contains: 'enthalt nicht',
};
const actionColors: Record<string, string> = {
  allow: 'var(--accent-green)',
  deny: 'var(--accent-red)',
  require_approval: 'var(--accent-orange)',
  log: 'var(--accent-blue)',
  alert: 'var(--accent-purple)',
};

export default function EnterpriseView({ agents, auditLog }: EnterpriseProps) {
  const [tab, setTab] = useState<Tab>('health');
  const [incidents, setIncidents] = useState<Incident[]>(generateIncidents);
  const [policies, setPolicies] = useState<Policy[]>(generatePolicies);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [reportType, setReportType] = useState<'performance' | 'security' | 'compliance'>('performance');
  const versions = useMemo(() => generateVersions(agents), [agents]);
  const sharedFiles = useMemo(generateSharedFiles, []);
  const health = useMemo(() => generateHealth(agents), [agents]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const handleExport = () => {
    let content: string;
    let mimeType: string;
    let ext: string;
    if (exportFormat === 'json') {
      content = JSON.stringify(auditLog, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (exportFormat === 'csv') {
      const header = 'ID,Agent,Action,Details,Timestamp,Risk\n';
      content =
        header +
        auditLog.map((e) => `${e.id},${e.agentId},${e.action},"${e.details}",${e.timestamp},${e.riskLevel}`).join('\n');
      mimeType = 'text/csv';
      ext = 'csv';
    } else {
      content = `AUDIT LOG REPORT\n${'='.repeat(40)}\nGenerated: ${new Date().toLocaleString('de-DE')}\n\n${auditLog.map((e) => `[${e.timestamp}] ${e.agentId}: ${e.action} - ${e.details} (${e.riskLevel})`).join('\n')}`;
      mimeType = 'text/plain';
      ext = 'txt';
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addIncidentComment = (incId: string) => {
    if (!newComment.trim()) return;
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incId) return inc;
        const evt: IncidentTimelineEvent = {
          id: genId('tl'),
          type: 'comment',
          message: newComment.trim(),
          author: 'admin',
          timestamp: new Date().toISOString(),
        };
        return { ...inc, timeline: [...inc.timeline, evt] };
      }),
    );
    setNewComment('');
  };

  const resolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== id) return inc;
        const evt: IncidentTimelineEvent = {
          id: genId('tl'),
          type: 'resolved',
          message: 'Incident als geloest markiert',
          author: 'admin',
          timestamp: new Date().toISOString(),
        };
        return { ...inc, status: 'resolved', resolvedAt: new Date().toISOString(), timeline: [...inc.timeline, evt] };
      }),
    );
  };

  return (
    <div>
      <div className="tabs" style={{ flexWrap: 'wrap' }}>
        {(
          [
            ['health', 'Health Monitor'],
            ['incidents', 'Incidents'],
            ['policies', 'Policy Editor'],
            ['rollback', 'Agent Rollback'],
            ['workspace', 'Shared Workspace'],
            ['audit', 'Audit Export'],
            ['reports', 'Reports'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k as Tab)}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'health' && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Healthy</div>
              <div className="kpi-value green">{health.filter((h) => h.status === 'healthy').length}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Degraded</div>
              <div className="kpi-value orange">{health.filter((h) => h.status === 'degraded').length}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Unhealthy</div>
              <div className="kpi-value red">{health.filter((h) => h.status === 'unhealthy').length}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Avg CPU</div>
              <div className="kpi-value cyan">{Math.round(health.reduce((s, h) => s + h.cpu, 0) / health.length)}%</div>
            </div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Status</th>
                    <th>CPU</th>
                    <th>Memory</th>
                    <th>Response</th>
                    <th>Errors</th>
                    <th>Uptime</th>
                    <th>Check</th>
                  </tr>
                </thead>
                <tbody>
                  {health.map((h) => (
                    <tr key={h.agentId}>
                      <td style={{ fontWeight: 500 }}>{h.agentName}</td>
                      <td>
                        <span style={{ color: healthColors[h.status], fontWeight: 600, fontSize: 11 }}>{h.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              width: 50,
                              height: 6,
                              background: 'var(--bg-hover)',
                              borderRadius: 3,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${h.cpu}%`,
                                background:
                                  h.cpu > 80
                                    ? 'var(--accent-red)'
                                    : h.cpu > 60
                                      ? 'var(--accent-orange)'
                                      : 'var(--accent-green)',
                                borderRadius: 3,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11 }}>{h.cpu}%</span>
                        </div>
                      </td>
                      <td>{h.memory}%</td>
                      <td>{h.responseTime}ms</td>
                      <td style={{ color: h.errorRate > 5 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                        {h.errorRate}%
                      </td>
                      <td>{h.uptime}%</td>
                      <td style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {new Date(h.lastCheck).toLocaleTimeString('de-DE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="card"
              style={{
                borderLeft: `3px solid ${inc.severity === 'critical' ? 'var(--accent-red)' : inc.severity === 'high' ? 'var(--accent-orange)' : 'var(--accent-blue)'}`,
              }}
            >
              <div className="flex-between mb-8">
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{inc.title}</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{inc.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${inc.severity}`}>{inc.severity}</span>
                  <span
                    className={`badge ${inc.status === 'resolved' ? 'valid' : inc.status === 'closed' ? 'info' : 'working'}`}
                  >
                    {inc.status}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                <span>SLA Response: {inc.slaResponseTime ?? '-'}min</span>
                <span>SLA Resolution: {inc.slaResolutionTime ?? '-'}min</span>
                <span>Betroffene Agenten: {inc.affectedAgents.length}</span>
              </div>
              {inc.rca && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: 10,
                    borderRadius: 6,
                    marginBottom: 12,
                    borderLeft: '3px solid var(--accent-purple)',
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--accent-purple)', fontWeight: 600, marginBottom: 2 }}>
                    ROOT CAUSE ANALYSIS
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inc.rca}</div>
                </div>
              )}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Timeline
                </div>
                {inc.timeline.map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      display: 'flex',
                      gap: 8,
                      padding: '4px 0',
                      borderLeft: '2px solid var(--border-color)',
                      paddingLeft: 12,
                      marginLeft: 6,
                    }}
                  >
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 50 }}>
                      {new Date(evt.timestamp).toLocaleTimeString('de-DE')}
                    </span>
                    <span className={`badge ${evt.type === 'resolved' ? 'valid' : 'info'}`} style={{ fontSize: 9 }}>
                      {evt.type}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{evt.message}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>- {evt.author}</span>
                  </div>
                ))}
              </div>
              {inc.status !== 'resolved' && inc.status !== 'closed' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Kommentar..."
                    style={{ flex: 1, fontSize: 11 }}
                    onKeyDown={(e) => e.key === 'Enter' && addIncidentComment(inc.id)}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => addIncidentComment(inc.id)}>
                    Kommentar
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => resolveIncident(inc.id)}>
                    Resolved
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'policies' && (
        <div>
          {policies.map((pol) => (
            <div key={pol.id} className="card mb-16">
              <div className="flex-between mb-8">
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{pol.name}</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pol.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge info">Prioritaet: {pol.priority}</span>
                  <span className="badge info">
                    {pol.scope}
                    {pol.scopeTarget ? `: ${pol.scopeTarget}` : ''}
                  </span>
                  <button
                    className={`toggle${pol.enabled ? ' on' : ''}`}
                    onClick={() =>
                      setPolicies((prev) => prev.map((p) => (p.id === pol.id ? { ...p, enabled: !p.enabled } : p)))
                    }
                  />
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Regeln</div>
              {pol.rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    background: 'var(--bg-surface)',
                    borderRadius: 6,
                    marginBottom: 4,
                    fontSize: 12,
                  }}
                >
                  <code style={{ color: 'var(--accent-cyan)', fontSize: 11 }}>{rule.condition}</code>
                  <span style={{ color: 'var(--text-muted)' }}>{operatorLabels[rule.operator]}</span>
                  <code style={{ color: 'var(--accent-orange)', fontSize: 11 }}>{rule.value}</code>
                  <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                  <span style={{ color: actionColors[rule.action], fontWeight: 600, fontSize: 11 }}>
                    {rule.action.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'rollback' && (
        <div className="grid-2">
          <div className="card" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div className="card-title mb-8">Agent-Versionen</div>
            {agents.slice(0, 10).map((a) => {
              const agentVersions = versions.filter((v) => v.agentId === a.id).sort((x, y) => y.version - x.version);
              return (
                <div
                  key={a.id}
                  style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}
                >
                  <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {a.name}
                  </div>
                  {agentVersions.map((v) => (
                    <div
                      key={v.id}
                      className="config-row"
                      style={{ cursor: 'pointer', paddingLeft: 8 }}
                      onClick={() => setSelectedVersion(v.id)}
                    >
                      <span style={{ fontSize: 11 }}>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>v{v.version}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{v.changes}</span>
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {new Date(v.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="card">
            {selectedVersion ? (
              (() => {
                const ver = versions.find((v) => v.id === selectedVersion);
                if (!ver) return null;
                const agent = agents.find((a) => a.id === ver.agentId);
                return (
                  <>
                    <div className="card-title mb-8">
                      Version Diff: {agent?.name} v{ver.version}
                    </div>
                    <div style={{ fontSize: 11, marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Aenderungen: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{ver.changes}</span>
                    </div>
                    <div style={{ fontSize: 11, marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Von: </span>
                      {ver.createdBy}
                      <span style={{ color: 'var(--text-muted)', marginLeft: 12 }}>Am: </span>
                      {new Date(ver.createdAt).toLocaleString('de-DE')}
                    </div>
                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 8,
                        fontSize: 11,
                      }}
                    >
                      <div style={{ color: 'var(--accent-green)', fontWeight: 600, marginBottom: 4 }}>Snapshot</div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Temperature: </span>
                        {ver.snapshot.parameters.temperature}
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>MaxTokens: </span>
                        {ver.snapshot.parameters.maxTokens}
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Archetype: </span>
                        {ver.snapshot.personality.archetype}
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Creativity: </span>
                        {ver.snapshot.personality.creativity}
                      </div>
                    </div>
                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        padding: 10,
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                    >
                      <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: 4 }}>System Prompt</div>
                      <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                        {ver.snapshot.systemPrompt}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 12 }}
                      onClick={() => alert(`Rollback zu v${ver.version} wuerde hier ausgefuehrt`)}
                    >
                      Rollback zu v{ver.version}
                    </button>
                  </>
                );
              })()
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Version auswaehlen um Details zu sehen
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'workspace' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Shared Workspace ({sharedFiles.length} Dateien)</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Name</th>
                  <th>Pfad</th>
                  <th>Owner</th>
                  <th>Geteilt mit</th>
                  <th>Groesse</th>
                  <th>Zuletzt geaendert</th>
                </tr>
              </thead>
              <tbody>
                {sharedFiles.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontSize: 16 }}>{fileTypeIcons[f.type]}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{f.name}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.path}</td>
                    <td>{f.owner}</td>
                    <td>{f.sharedWith.length} Agenten</td>
                    <td>{(f.size / 1024).toFixed(1)} KB</td>
                    <td style={{ fontSize: 11 }}>{new Date(f.lastModified).toLocaleString('de-DE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div>
          <div className="card mb-16">
            <div className="card-header">
              <span className="card-title">Audit-Log Export</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="pdf">Text/PDF</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={handleExport}>
                  Export ({auditLog.length} Eintraege)
                </button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Exportiert alle Audit-Log Eintraege im gewaehlten Format
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Vorschau (letzte 20)</span>
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
                  {auditLog.slice(0, 20).map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontSize: 11 }}>{new Date(e.timestamp).toLocaleTimeString('de-DE')}</td>
                      <td>{e.agentId}</td>
                      <td>
                        <code style={{ fontSize: 11 }}>{e.action}</code>
                      </td>
                      <td>{e.details}</td>
                      <td>
                        <span className={`badge ${e.riskLevel}`}>{e.riskLevel}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div>
          <div className="card mb-16">
            <div className="card-title mb-8">Report Builder</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Report-Typ</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as typeof reportType)}
                  style={{ width: '100%' }}
                >
                  <option value="performance">Performance</option>
                  <option value="security">Security</option>
                  <option value="compliance">Compliance</option>
                </select>
              </div>
              <button className="btn btn-primary btn-sm">Report generieren</button>
            </div>
          </div>
          {reportType === 'performance' && (
            <div className="grid-2">
              <div className="card">
                <div className="card-title mb-8">Performance Summary</div>
                <div className="config-row">
                  <span className="config-label">Durchschn. Erfolgsrate</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                    {(agents.reduce((s, a) => s + a.successRate, 0) / agents.length).toFixed(1)}%
                  </span>
                </div>
                <div className="config-row">
                  <span className="config-label">Total Tasks</span>
                  <span style={{ fontWeight: 600 }}>{agents.reduce((s, a) => s + a.tasksCompleted, 0)}</span>
                </div>
                <div className="config-row">
                  <span className="config-label">Fehlgeschlagen</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>
                    {agents.reduce((s, a) => s + a.failedTasks, 0)}
                  </span>
                </div>
                <div className="config-row">
                  <span className="config-label">Avg Duration</span>
                  <span style={{ fontWeight: 600 }}>
                    {(agents.reduce((s, a) => s + a.avgTaskDuration, 0) / agents.length).toFixed(0)}s
                  </span>
                </div>
              </div>
              <div className="card">
                <div className="card-title mb-8">Top 5 Performer</div>
                {[...agents]
                  .sort((a, b) => b.successRate - a.successRate)
                  .slice(0, 5)
                  .map((a, i) => (
                    <div key={a.id} className="config-row">
                      <span style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{i + 1}.</span> {a.name}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{a.successRate}%</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {reportType === 'security' && (
            <div className="card">
              <div className="card-title mb-8">Security Report</div>
              <div className="config-row">
                <span className="config-label">Offene Incidents</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>
                  {incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length}
                </span>
              </div>
              <div className="config-row">
                <span className="config-label">Geloeste Incidents</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                  {incidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length}
                </span>
              </div>
              <div className="config-row">
                <span className="config-label">Aktive Policies</span>
                <span style={{ fontWeight: 600 }}>{policies.filter((p) => p.enabled).length}</span>
              </div>
              <div className="config-row">
                <span className="config-label">Audit-Eintraege</span>
                <span style={{ fontWeight: 600 }}>{auditLog.length}</span>
              </div>
            </div>
          )}
          {reportType === 'compliance' && (
            <div className="card">
              <div className="card-title mb-8">Compliance Report</div>
              <div className="config-row">
                <span className="config-label">Zertifizierte Agenten</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                  {agents.filter((a) => a.certificationId).length}
                </span>
              </div>
              <div className="config-row">
                <span className="config-label">Nicht zertifiziert</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>
                  {agents.filter((a) => !a.certificationId).length}
                </span>
              </div>
              <div className="config-row">
                <span className="config-label">Policy-Compliance</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                  {((policies.filter((p) => p.enabled).length / policies.length) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

