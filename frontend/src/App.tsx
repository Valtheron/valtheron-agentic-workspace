import { useState, useEffect, useMemo } from 'react';
import './App.css';
import type { ViewType, Agent, Task, CollaborationSession, Certification, SecurityEvent, KillSwitch, AuditEntry, ProjektBaumNode, SecurityConfig, AnalyticsData, KanbanColumn } from './types';
import { generateAgents, generateTasks, generateCollaborations, generateCertifications, generateSecurityEvents, generateKillSwitch, generateAuditLog, generateProjektBaum, defaultSecurityConfig, generateAnalytics } from './services/mockData';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import DashboardView from './components/DashboardView';
import AgentsView from './components/AgentsView';
import SecurityView from './components/SecurityView';
import CollaborationView from './components/CollaborationView';
import CertificationsView from './components/CertificationsView';
import KanbanView from './components/KanbanView';
import ProjektBaumView from './components/ProjektBaumView';

const viewTitles: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  agents: 'Agenten',
  security: 'Sicherheits-Center',
  collaboration: 'Kollaboration',
  certifications: 'Zertifizierungen',
  kanban: 'Kanban Board',
  projektbaum: 'Projekt-Baum',
};

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const [agents] = useState<Agent[]>(() => generateAgents());
  const [tasks, setTasks] = useState<Task[]>(() => generateTasks(agents));
  const [collaborations] = useState<CollaborationSession[]>(() => generateCollaborations(agents));
  const [certifications] = useState<Certification[]>(() => generateCertifications(agents));
  const [securityEvents] = useState<SecurityEvent[]>(generateSecurityEvents);
  const [killSwitch, setKillSwitch] = useState<KillSwitch>(generateKillSwitch);
  const [auditLog] = useState<AuditEntry[]>(generateAuditLog);
  const [projektBaum] = useState<ProjektBaumNode>(generateProjektBaum);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(defaultSecurityConfig);
  const analytics = useMemo<AnalyticsData>(() => generateAnalytics(agents, tasks), [agents, tasks]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') setCmdPaletteOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleMoveTask = (taskId: string, column: KanbanColumn) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, kanbanColumn: column } : t));
  };

  const handleToggleKillSwitch = () => {
    setKillSwitch(prev => ({
      ...prev,
      armed: !prev.armed,
      triggeredAt: !prev.armed ? undefined : new Date().toISOString(),
      triggeredBy: !prev.armed ? undefined : 'admin',
    }));
  };

  const handleSelectAgent = (id: string) => {
    setSelectedAgentId(id);
    if (currentView !== 'agents') setCurrentView('agents');
  };

  return (
    <div className="app">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(p => !p)}
      />
      <div className="app-main">
        <header className="app-header">
          <h1>{viewTitles[currentView]}</h1>
          <div className="app-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setCmdPaletteOpen(true)}>
              / Suche&hellip; <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>Ctrl+K</span>
            </button>
            <span className="badge active">{agents.filter(a => a.status === 'active' || a.status === 'working').length} aktiv</span>
            <span className={`badge ${killSwitch.armed ? 'valid' : 'critical'}`}>
              KS: {killSwitch.armed ? 'ARMED' : 'OFF'}
            </span>
          </div>
        </header>
        <div className="app-content">
          {currentView === 'dashboard' && (
            <DashboardView analytics={analytics} killSwitch={killSwitch} securityEvents={securityEvents} agents={agents} onToggleKillSwitch={handleToggleKillSwitch} />
          )}
          {currentView === 'agents' && (
            <AgentsView agents={agents} selectedAgentId={selectedAgentId} onSelectAgent={setSelectedAgentId} />
          )}
          {currentView === 'security' && (
            <SecurityView events={securityEvents} config={securityConfig} auditLog={auditLog} onConfigChange={setSecurityConfig} />
          )}
          {currentView === 'collaboration' && (
            <CollaborationView sessions={collaborations} agents={agents} />
          )}
          {currentView === 'certifications' && (
            <CertificationsView certifications={certifications} />
          )}
          {currentView === 'kanban' && (
            <KanbanView tasks={tasks} onMoveTask={handleMoveTask} />
          )}
          {currentView === 'projektbaum' && (
            <ProjektBaumView tree={projektBaum} />
          )}
        </div>
      </div>
      {cmdPaletteOpen && (
        <CommandPalette agents={agents} onViewChange={setCurrentView} onSelectAgent={handleSelectAgent} onClose={() => setCmdPaletteOpen(false)} />
      )}
    </div>
  );
}

export default App;
