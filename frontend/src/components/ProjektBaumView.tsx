import { useState, useEffect, useRef, useMemo } from 'react';
import type { ProjektBaumNode, AgentPresence, LiveUpdate, Agent } from '../types';

interface TreeProps {
  tree: ProjektBaumNode;
  agents: Agent[];
}

const typeIcons: Record<string, string> = {
  project: '\u25C6', phase: '\u25CB', milestone: '\u2605', module: '\u25CB', task: '\u25AA', agent: '\u2022',
};

const statusColors: Record<string, string> = {
  active: 'var(--accent-cyan)', completed: 'var(--accent-green)', blocked: 'var(--accent-red)',
  in_progress: 'var(--accent-orange)', pending: 'var(--text-muted)',
};

const presenceActions: Record<string, { label: string; color: string }> = {
  working: { label: 'arbeitet', color: 'var(--accent-cyan)' },
  reviewing: { label: 'reviewed', color: 'var(--accent-orange)' },
  planning: { label: 'plant', color: 'var(--accent-purple)' },
  testing: { label: 'testet', color: 'var(--accent-green)' },
};

const severityColors: Record<string, string> = {
  info: 'var(--accent-blue)', success: 'var(--accent-green)', warning: 'var(--accent-orange)', error: 'var(--accent-red)',
};

function genId() { return `lu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

function generatePresence(tree: ProjektBaumNode, agents: Agent[]): AgentPresence[] {
  const result: AgentPresence[] = [];
  const actions: AgentPresence['action'][] = ['working', 'reviewing', 'planning', 'testing'];
  function walk(node: ProjektBaumNode) {
    if (node.agentId) {
      const agent = agents.find(a => a.id === node.agentId);
      if (agent && (node.status === 'active' || node.status === 'in_progress')) {
        result.push({
          agentId: node.agentId, agentName: agent.name, nodeId: node.id,
          action: actions[Math.floor(Math.random() * actions.length)],
          since: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
        });
      }
    }
    node.children.forEach(walk);
  }
  walk(tree);
  return result;
}

const liveMessages = [
  'Agent hat Sub-Task abgeschlossen', 'Fortschritt aktualisiert', 'Neues Artefakt generiert',
  'Review angefordert', 'Test-Suite gestartet', 'Build erfolgreich', 'Merge in main',
  'Performance-Metrik aktualisiert', 'SLA-Check bestanden', 'Deployment vorbereitet',
  'Code-Qualitaet: A+', 'Sicherheits-Scan abgeschlossen', 'API-Tests: 100% bestanden',
];

function TreeNode({ node, depth, presenceMap, expandAll }: {
  node: ProjektBaumNode; depth: number; presenceMap: Map<string, AgentPresence[]>; expandAll: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 2 || expandAll);
  const hasChildren = node.children.length > 0;
  const nodePresence = presenceMap.get(node.id) ?? [];

  useEffect(() => { if (expandAll) setExpanded(true); }, [expandAll]);

  const totalProgress = hasChildren
    ? Math.round(node.children.reduce((s, c) => s + c.progress, 0) / node.children.length)
    : node.progress;

  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : 20 }}>
      <div className="tree-item" onClick={() => hasChildren && setExpanded(!expanded)}>
        {hasChildren ? (
          <button className="tree-toggle" onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? '\u25BC' : '\u25B6'}
          </button>
        ) : <span style={{ width: 16 }} />}

        <span className="tree-icon" style={{ color: statusColors[node.status] }}>
          {typeIcons[node.type]}
        </span>
        <span className="tree-name">{node.name}</span>

        {node.type === 'phase' && <span style={{ fontSize: 9, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>Phase</span>}
        {node.type === 'milestone' && <span style={{ fontSize: 9, color: 'var(--accent-orange)', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>Meilenstein</span>}

        <span className={`badge ${node.status === 'in_progress' ? 'working' : node.status}`} style={{ marginLeft: 4 }}>{node.status}</span>

        <div className="tree-progress" style={{ width: hasChildren ? 100 : 60 }}>
          <div className="tree-progress-fill" style={{
            width: `${totalProgress}%`,
            background: totalProgress === 100 ? 'var(--accent-green)' : statusColors[node.status] ?? 'var(--accent-cyan)',
          }} />
        </div>
        <span className="tree-pct">{totalProgress}%</span>

        {nodePresence.length > 0 && (
          <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
            {nodePresence.map(p => (
              <span key={p.agentId} title={`${p.agentName} ${presenceActions[p.action].label}`}
                style={{
                  width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, background: presenceActions[p.action].color, color: 'var(--bg-primary)',
                }}>
                {p.agentName.charAt(0)}
              </span>
            ))}
          </div>
        )}
      </div>
      {expanded && hasChildren && node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} presenceMap={presenceMap} expandAll={expandAll} />
      ))}
    </div>
  );
}

export default function ProjektBaumView({ tree, agents }: TreeProps) {
  const [expandAll, setExpandAll] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [presence, setPresence] = useState<AgentPresence[]>(() => generatePresence(tree, agents));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const presenceMap = useMemo(() => {
    const map = new Map<string, AgentPresence[]>();
    presence.forEach(p => {
      const arr = map.get(p.nodeId) ?? [];
      arr.push(p);
      map.set(p.nodeId, arr);
    });
    return map;
  }, [presence]);

  // WebSocket simulation
  useEffect(() => {
    if (!liveEnabled) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      const sevs: LiveUpdate['severity'][] = ['info', 'success', 'warning', 'error'];
      const types: LiveUpdate['type'][] = ['agent_status', 'task_progress', 'node_update', 'security_event', 'metric_change'];
      const newUpdate: LiveUpdate = {
        id: genId(), type: types[Math.floor(Math.random() * types.length)],
        message: liveMessages[Math.floor(Math.random() * liveMessages.length)],
        severity: sevs[Math.floor(Math.random() * sevs.length)],
        timestamp: new Date().toISOString(),
      };
      setUpdates(prev => [newUpdate, ...prev].slice(0, 50));

      // Randomly update presence
      if (Math.random() > 0.6) {
        setPresence(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            const idx = Math.floor(Math.random() * updated.length);
            const actions: AgentPresence['action'][] = ['working', 'reviewing', 'planning', 'testing'];
            updated[idx] = { ...updated[idx], action: actions[Math.floor(Math.random() * actions.length)], since: new Date().toISOString() };
          }
          return updated;
        });
      }
    }, 2500);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [liveEnabled]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, height: 'calc(100vh - 120px)' }}>
      <div className="card" style={{ overflow: 'auto' }}>
        <div className="card-header">
          <span className="card-title">Projekt-Baum</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gesamt: {tree.progress}%</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setExpandAll(!expandAll)}>
              {expandAll ? 'Alle einklappen' : 'Alle aufklappen'}
            </button>
          </div>
        </div>
        <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${tree.progress}%`, background: 'var(--accent-cyan)', borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
        <TreeNode node={tree} depth={0} presenceMap={presenceMap} expandAll={expandAll} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        <div className="card" style={{ flex: '0 0 auto' }}>
          <div className="card-header">
            <span className="card-title">Agent-Praesenz ({presence.length})</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: liveEnabled ? 'var(--accent-green)' : 'var(--text-muted)', animation: liveEnabled ? 'pulse 2s infinite' : 'none' }} />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {presence.map(p => (
              <div key={p.agentId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 11 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, background: presenceActions[p.action].color, color: 'var(--bg-primary)',
                }}>{p.agentName.charAt(0)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 11 }}>{p.agentName}</div>
                  <div style={{ color: presenceActions[p.action].color, fontSize: 10 }}>{presenceActions[p.action].label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Live-Updates</span>
            <button className={`toggle${liveEnabled ? ' on' : ''}`} onClick={() => setLiveEnabled(!liveEnabled)} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {updates.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                {liveEnabled ? 'Warte auf Updates...' : 'Live-Updates deaktiviert'}
              </div>
            ) : updates.map(u => (
              <div key={u.id} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border-color)', fontSize: 11 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: severityColors[u.severity], marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-secondary)' }}>{u.message}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {new Date(u.timestamp).toLocaleTimeString('de-DE')} &middot; {u.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
