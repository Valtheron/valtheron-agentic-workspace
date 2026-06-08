import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ProjektBaumNode, AgentPresence, LiveUpdate, Agent } from '../types';
import { projectTreeAPI, wsClient } from '../services/api';

interface TreeProps {
  tree: ProjektBaumNode;
  agents: Agent[];
}

const typeIcons: Record<string, string> = {
  project: '◆',
  phase: '○',
  milestone: '★',
  module: '○',
  task: '▪',
  agent: '•',
};

const statusColors: Record<string, string> = {
  active: 'var(--accent-cyan)',
  completed: 'var(--accent-green)',
  blocked: 'var(--accent-red)',
  in_progress: 'var(--accent-orange)',
  pending: 'var(--text-muted)',
  planned: 'var(--text-muted)',
};

const presenceActions: Record<string, { label: string; color: string }> = {
  working: { label: 'arbeitet', color: 'var(--accent-cyan)' },
  reviewing: { label: 'reviewed', color: 'var(--accent-orange)' },
  planning: { label: 'plant', color: 'var(--accent-purple)' },
  testing: { label: 'testet', color: 'var(--accent-green)' },
};

const severityColors: Record<string, string> = {
  info: 'var(--accent-blue)',
  success: 'var(--accent-green)',
  warning: 'var(--accent-orange)',
  error: 'var(--accent-red)',
};

function deriveAction(agent: Agent): AgentPresence['action'] {
  // Deterministic mapping from real agent status to a presence label.
  // No randomness — when the backend exposes a richer activity field
  // (e.g. current step kind), wire it here instead of the simulation.
  if (agent.status === 'working') return 'working';
  if (agent.status === 'idle') return 'planning';
  return 'reviewing';
}

function derivePresence(tree: ProjektBaumNode, agents: Agent[]): AgentPresence[] {
  const result: AgentPresence[] = [];
  const seen = new Set<string>();

  function walk(node: ProjektBaumNode) {
    if (node.agentId) {
      const agent = agents.find((a) => a.id === node.agentId);
      if (agent && (agent.status === 'working' || agent.status === 'active')) {
        const key = `${node.id}:${agent.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            agentId: agent.id,
            agentName: agent.name,
            nodeId: node.id,
            action: deriveAction(agent),
            since: agent.lastActivity || new Date().toISOString(),
          });
        }
      }
    }
    node.children.forEach(walk);
  }
  walk(tree);
  return result;
}

function TreeNode({
  node,
  depth,
  presenceMap,
  expandAll,
}: {
  node: ProjektBaumNode;
  depth: number;
  presenceMap: Map<string, AgentPresence[]>;
  expandAll: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 2 || expandAll);
  const hasChildren = node.children.length > 0;
  const nodePresence = presenceMap.get(node.id) ?? [];

  useEffect(() => {
    if (expandAll) setExpanded(true);
  }, [expandAll]);

  const totalProgress = hasChildren
    ? Math.round(node.children.reduce((s, c) => s + c.progress, 0) / node.children.length)
    : node.progress;

  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : 20 }}>
      <div className="tree-item" onClick={() => hasChildren && setExpanded(!expanded)}>
        {hasChildren ? (
          <button
            className="tree-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span style={{ width: 16 }} />
        )}

        <span className="tree-icon" style={{ color: statusColors[node.status] }}>
          {typeIcons[node.type]}
        </span>
        <span className="tree-name">{node.name}</span>

        {node.type === 'phase' && (
          <span
            style={{
              fontSize: 9,
              color: 'var(--text-muted)',
              background: 'var(--bg-hover)',
              padding: '1px 6px',
              borderRadius: 4,
              marginLeft: 4,
            }}
          >
            Phase
          </span>
        )}
        {node.type === 'milestone' && (
          <span
            style={{
              fontSize: 9,
              color: 'var(--accent-orange)',
              background: 'rgba(245,158,11,0.1)',
              padding: '1px 6px',
              borderRadius: 4,
              marginLeft: 4,
            }}
          >
            Meilenstein
          </span>
        )}

        <span className={`badge ${node.status === 'in_progress' ? 'working' : node.status}`} style={{ marginLeft: 4 }}>
          {node.status}
        </span>

        <div className="tree-progress" style={{ width: hasChildren ? 100 : 60 }}>
          <div
            className="tree-progress-fill"
            style={{
              width: `${totalProgress}%`,
              background:
                totalProgress === 100 ? 'var(--accent-green)' : (statusColors[node.status] ?? 'var(--accent-cyan)'),
            }}
          />
        </div>
        <span className="tree-pct">{totalProgress}%</span>

        {nodePresence.length > 0 && (
          <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
            {nodePresence.map((p) => (
              <span
                key={p.agentId}
                title={`${p.agentName} ${presenceActions[p.action].label}`}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  fontWeight: 700,
                  background: presenceActions[p.action].color,
                  color: 'var(--bg-primary)',
                }}
              >
                {p.agentName.charAt(0)}
              </span>
            ))}
          </div>
        )}
      </div>
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} presenceMap={presenceMap} expandAll={expandAll} />
        ))}
    </div>
  );
}

const WS_UPDATE_TYPES: LiveUpdate['type'][] = [
  'agent_status',
  'task_progress',
  'node_update',
  'security_event',
  'metric_change',
];

const WS_SEVERITY_BY_TYPE: Record<LiveUpdate['type'], LiveUpdate['severity']> = {
  agent_status: 'info',
  task_progress: 'success',
  node_update: 'info',
  security_event: 'warning',
  metric_change: 'info',
};

function describeUpdate(type: LiveUpdate['type'], payload: unknown): string {
  if (!payload || typeof payload !== 'object') return type;
  const p = payload as Record<string, unknown>;
  switch (type) {
    case 'agent_status':
      return `Agent ${p.agentId ?? ''} → ${p.status ?? 'status update'}`;
    case 'task_progress':
      return `Task ${p.taskId ?? ''} → ${p.status ?? 'progress'}`;
    case 'node_update':
      return `Node ${p.id ?? ''} aktualisiert`;
    case 'security_event':
      return String(p.message ?? 'Security-Event');
    case 'metric_change':
      return 'Metriken aktualisiert';
    default:
      return type;
  }
}

export default function ProjektBaumView({ tree: initialTree, agents }: TreeProps) {
  const [tree, setTree] = useState<ProjektBaumNode | null>(initialTree.children.length > 0 ? initialTree : null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  // Load tree from backend on mount, replacing the (empty) prop default.
  useEffect(() => {
    let cancelled = false;
    projectTreeAPI
      .getTree()
      .then((res) => {
        if (cancelled) return;
        const fetched = (res as { tree: ProjektBaumNode[] }).tree;
        if (Array.isArray(fetched) && fetched.length > 0) {
          setTree(fetched[0]);
        } else {
          setTree(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message || 'Projekt-Baum konnte nicht geladen werden');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const presence = useMemo(() => (tree ? derivePresence(tree, agents) : []), [tree, agents]);

  const presenceMap = useMemo(() => {
    const map = new Map<string, AgentPresence[]>();
    presence.forEach((p) => {
      const arr = map.get(p.nodeId) ?? [];
      arr.push(p);
      map.set(p.nodeId, arr);
    });
    return map;
  }, [presence]);

  const appendUpdate = useCallback((type: LiveUpdate['type'], payload: unknown) => {
    const newUpdate: LiveUpdate = {
      id: `${type}_${Date.now()}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      type,
      message: describeUpdate(type, payload),
      severity: WS_SEVERITY_BY_TYPE[type] ?? 'info',
      timestamp: new Date().toISOString(),
    };
    setUpdates((prev) => [newUpdate, ...prev].slice(0, 50));
  }, []);

  // Subscribe to backend WebSocket — only real events. No fabricated intervals.
  useEffect(() => {
    if (!liveEnabled) {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
      return;
    }
    for (const t of WS_UPDATE_TYPES) {
      const unsub = wsClient.on(t, (payload) => appendUpdate(t, payload));
      if (unsub) unsubscribersRef.current.push(unsub);
    }
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [liveEnabled, appendUpdate]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, height: 'calc(100vh - 120px)' }}>
      <div className="card" style={{ overflow: 'auto' }}>
        <div className="card-header">
          <span className="card-title">Projekt-Baum</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tree ? `Gesamt: ${tree.progress}%` : '—'}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setExpandAll(!expandAll)} disabled={!tree}>
              {expandAll ? 'Alle einklappen' : 'Alle aufklappen'}
            </button>
          </div>
        </div>
        <div
          style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}
        >
          <div
            style={{
              height: '100%',
              width: `${tree?.progress ?? 0}%`,
              background: 'var(--accent-cyan)',
              borderRadius: 3,
              transition: 'width 0.5s',
            }}
          />
        </div>
        {loadError ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--accent-red)', fontSize: 12 }}>
            Projekt-Baum konnte nicht geladen werden: {loadError}
          </div>
        ) : tree ? (
          <TreeNode node={tree} depth={0} presenceMap={presenceMap} expandAll={expandAll} />
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            Noch keine Projekt-Knoten angelegt.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        <div className="card" style={{ flex: '0 0 auto' }}>
          <div className="card-header">
            <span className="card-title">Agent-Praesenz ({presence.length})</span>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: liveEnabled ? 'var(--accent-green)' : 'var(--text-muted)',
                animation: liveEnabled ? 'pulse 2s infinite' : 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {presence.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                Keine Agenten aktiv auf Knoten.
              </div>
            ) : (
              presence.map((p) => (
                <div
                  key={`${p.nodeId}:${p.agentId}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 11 }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 700,
                      background: presenceActions[p.action].color,
                      color: 'var(--bg-primary)',
                    }}
                  >
                    {p.agentName.charAt(0)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 11 }}>{p.agentName}</div>
                    <div style={{ color: presenceActions[p.action].color, fontSize: 10 }}>
                      {presenceActions[p.action].label}
                    </div>
                  </div>
                </div>
              ))
            )}
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
                {liveEnabled ? 'Warte auf WebSocket-Events vom Backend...' : 'Live-Updates deaktiviert'}
              </div>
            ) : (
              updates.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: '5px 0',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: 11,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: severityColors[u.severity],
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{u.message}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      {new Date(u.timestamp).toLocaleTimeString('de-DE')} &middot; {u.type}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
