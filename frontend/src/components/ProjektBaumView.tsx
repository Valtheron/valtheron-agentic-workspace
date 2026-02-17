import { useState } from 'react';
import type { ProjektBaumNode } from '../types';

interface TreeProps {
  tree: ProjektBaumNode;
}

const typeIcons: Record<string, string> = {
  project: '\u25C6',
  module: '\u25CB',
  task: '\u25AA',
  agent: '\u2022',
};

const statusColors: Record<string, string> = {
  active: 'var(--accent-cyan)',
  completed: 'var(--accent-green)',
  blocked: 'var(--accent-red)',
};

function TreeNode({ node, depth }: { node: ProjektBaumNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className="tree-node" style={{ paddingLeft: depth === 0 ? 0 : 20 }}>
      <div className="tree-item">
        {hasChildren ? (
          <button className="tree-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? '\u25BC' : '\u25B6'}
          </button>
        ) : (
          <span style={{ width: 16 }} />
        )}
        <span className="tree-icon" style={{ color: statusColors[node.status] }}>
          {typeIcons[node.type]}
        </span>
        <span className="tree-name">{node.name}</span>
        {node.agentId && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4 }}>
            {node.agentId}
          </span>
        )}
        <span className={`badge ${node.status}`} style={{ marginLeft: 4 }}>{node.status}</span>
        <div className="tree-progress">
          <div className="tree-progress-fill" style={{ width: `${node.progress}%`, background: statusColors[node.status] }} />
        </div>
        <span className="tree-pct">{node.progress}%</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjektBaumView({ tree }: TreeProps) {
  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
      <div className="card-header">
        <span className="card-title">Projekt-Baum</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Gesamtfortschritt: {tree.progress}%
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${tree.progress}%`, background: 'var(--accent-cyan)', borderRadius: 3 }} />
      </div>
      <TreeNode node={tree} depth={0} />
    </div>
  );
}
