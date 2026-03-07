import type { ViewType } from '../types';

const navItems: { view: ViewType; icon: string; label: string }[] = [
  { view: 'dashboard', icon: '\u25A3', label: 'Dashboard' },
  { view: 'projects', icon: '\u2302', label: 'Projekte' },
  { view: 'workflows', icon: '\u25B6', label: 'Workflows' },
  { view: 'agents', icon: '\u2699', label: 'Agenten' },
  { view: 'kill-switch', icon: '\u26D4', label: 'Kill-Switch' },
  { view: 'kanban', icon: '\u2593', label: 'Kanban Board' },
  { view: 'analytics', icon: '\u2261', label: 'Analytics' },
  { view: 'projektbaum', icon: '\u2502', label: 'Projekt-Baum' },
  { view: 'security', icon: '\u26A0', label: 'Sicherheit' },
  { view: 'audit', icon: '\u2203', label: 'Audit-Trail' },
  { view: 'chat', icon: '\u2709', label: 'Agent Chat' },
  { view: 'collaboration', icon: '\u2694', label: 'Kollaboration' },
  { view: 'certifications', icon: '\u2605', label: 'Zertifizierungen' },
  { view: 'enterprise', icon: '\u2756', label: 'Enterprise' },
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
      <div className="sidebar-logo" onClick={onToggle} title="Valtheron">
        {expanded ? (
          <img src="/valtheron-logo.svg" alt="Valtheron" className="logo-img-full"/>
        ) : (
          <img src="/valtheron-logo.svg" alt="V" className="logo-img-icon"/>
        )}
      </div>
      <div className="sidebar-nav">
        {navItems.map((item) => (
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
        <button
          className="sidebar-item"
          title="Ctrl+K"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
        >
          <span className="icon">/</span>
          {expanded && <span className="label">Suche (Ctrl+K)</span>}
        </button>
      </div>
    </nav>
  );
}
