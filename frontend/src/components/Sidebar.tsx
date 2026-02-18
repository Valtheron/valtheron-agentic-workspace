import type { ViewType } from '../types';

const navItems: { view: ViewType; icon: string; label: string }[] = [
  { view: 'dashboard', icon: '\u25A3', label: 'Dashboard' },
  { view: 'agents', icon: '\u2699', label: 'Agenten' },
  { view: 'security', icon: '\u26A0', label: 'Sicherheit' },
  { view: 'collaboration', icon: '\u2694', label: 'Kollaboration' },
  { view: 'certifications', icon: '\u2605', label: 'Zertifizierungen' },
  { view: 'kanban', icon: '\u2593', label: 'Kanban Board' },
  { view: 'projektbaum', icon: '\u2502', label: 'Projekt-Baum' },
  { view: 'llm-settings', icon: '\u2318', label: 'LLM Provider' },
];

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (v: ViewType) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function Sidebar({ currentView, onViewChange, expanded, onToggle }: SidebarProps) {
  return (
    <nav className={`sidebar${expanded ? ' expanded' : ''}`}>
      <div className="sidebar-logo" onClick={onToggle}>
        <div className="logo-icon">V</div>
        {expanded && <span className="logo-text">Valtheron</span>}
      </div>
      <div className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.view}
            className={`sidebar-item${currentView === item.view ? ' active' : ''}`}
            onClick={() => onViewChange(item.view)}
            title={item.label}
          >
            <span className="icon">{item.icon}</span>
            {expanded && <span className="label">{item.label}</span>}
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="sidebar-item" title="Ctrl+K" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>
          <span className="icon">/</span>
          {expanded && <span className="label">Suche (Ctrl+K)</span>}
        </button>
      </div>
    </nav>
  );
}
