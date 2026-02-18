import { useState, useEffect, useRef } from 'react';
import type { ViewType, Agent } from '../types';

interface CommandPaletteProps {
  agents: Agent[];
  onViewChange: (v: ViewType) => void;
  onSelectAgent: (id: string) => void;
  onClose: () => void;
}

const viewCommands: { view: ViewType; label: string; icon: string }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: '\u25A3' },
  { view: 'agents', label: 'Agenten-Ansicht', icon: '\u2699' },
  { view: 'security', label: 'Sicherheits-Center', icon: '\u26A0' },
  { view: 'collaboration', label: 'Kollaboration', icon: '\u2694' },
  { view: 'certifications', label: 'Zertifizierungen', icon: '\u2605' },
  { view: 'kanban', label: 'Kanban Board', icon: '\u2593' },
  { view: 'projektbaum', label: 'Projekt-Baum', icon: '\u2502' },
];

export default function CommandPalette({ agents, onViewChange, onSelectAgent, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.toLowerCase();
  const filteredViews = viewCommands.filter(v => v.label.toLowerCase().includes(q));
  const filteredAgents = q.length >= 2
    ? agents.filter(a => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)).slice(0, 8)
    : [];
  const allItems = [
    ...filteredViews.map(v => ({ type: 'view' as const, ...v })),
    ...filteredAgents.map(a => ({ type: 'agent' as const, label: `${a.name} (${a.category})`, icon: '\u2022', id: a.id })),
  ];

  useEffect(() => { setSelectedIdx(0); }, [query]);

  const handleSelect = (idx: number) => {
    const item = allItems[idx];
    if (!item) return;
    if (item.type === 'view') { onViewChange(item.view); onClose(); }
    else { onSelectAgent(item.id); onViewChange('agents'); onClose(); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') handleSelect(selectedIdx);
  };

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="Suche nach Views, Agenten..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="cmd-results">
          {allItems.map((item, i) => (
            <div
              key={`${item.type}-${i}`}
              className={`cmd-item${i === selectedIdx ? ' selected' : ''}`}
              onClick={() => handleSelect(i)}
            >
              <span className="cmd-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.type === 'view' && <span className="cmd-shortcut">View</span>}
              {item.type === 'agent' && <span className="cmd-shortcut">Agent</span>}
            </div>
          ))}
          {allItems.length === 0 && (
            <div className="cmd-item" style={{ color: 'var(--text-muted)' }}>Keine Ergebnisse</div>
          )}
        </div>
      </div>
    </div>
  );
}
