import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './App.css';
import type {
  ViewType,
  Agent,
  Task,
  Certification,
  SecurityEvent,
  KillSwitch,
  AuditEntry,
  ProjektBaumNode,
  SecurityConfig,
  AnalyticsData,
  KanbanColumn,
  LLMConfig,
  Workflow,
  Project,
} from './types';
import {
  generateAgents,
  generateTasks,
  generateCertifications,
  generateSecurityEvents,
  generateKillSwitch,
  generateAuditLog,
  generateProjektBaum,
  defaultSecurityConfig,
  generateAnalytics,
} from './services/mockData';
import { defaultLLMConfig } from './services/llmProviders';
import { save, load, KEYS } from './services/persistence';
import { agentsAPI, tasksAPI, workflowsAPI, securityAPI, healthAPI, wsClient, authAPI, getToken } from './services/api';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import WelcomeView from './components/WelcomeView';
import CommandPalette from './components/CommandPalette';
import DashboardView from './components/DashboardView';
import AgentsView from './components/AgentsView';
import SecurityView from './components/SecurityView';
import CollaborationView from './components/CollaborationView';
import CertificationsView from './components/CertificationsView';
import KanbanView from './components/KanbanView';
import ProjektBaumView from './components/ProjektBaumView';
import LLMSettingsView from './components/LLMSettingsView';
import WorkflowView from './components/WorkflowView';
import ProjectsView from './components/ProjectsView';
import KillSwitchView from './components/KillSwitchView';
import AnalyticsView from './components/AnalyticsView';
import EnterpriseView from './components/EnterpriseView';
import ChatView from './components/ChatView';
import AuditView from './components/AuditView';

const viewTitles: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  agents: 'Agenten',
  security: 'Sicherheits-Center',
  collaboration: 'Kollaboration',
  certifications: 'Zertifizierungen',
  kanban: 'Kanban Board',
  projektbaum: 'Projekt-Baum',
  'llm-settings': 'LLM Provider',
  workflows: 'Workflows',
  projects: 'Projekte',
  'kill-switch': 'Kill-Switch',
  analytics: 'Analytics & Monitoring',
  enterprise: 'Enterprise',
  chat: 'Agent Chat',
  audit: 'Audit-Trail',
};

// Simulated output messages for running agents
const simulatedOutputs = [
  'Analysiere Eingabedaten...',
  'Verarbeite Anfrage mit LLM...',
  'Generiere Zwischenergebnis...',
  'Validiere Output gegen Constraints...',
  'Optimiere Ergebnis...',
  'Schreibe Ergebnis in Output-Buffer...',
  'Führe Post-Processing durch...',
  'Aufgabe erfolgreich abgeschlossen.',
];

function App() {
  const [currentView, setCurrentView] = useState<ViewType>(() => load(KEYS.CURRENT_VIEW, 'dashboard'));
  const [sidebarExpanded, setSidebarExpanded] = useState(() => load(KEYS.SIDEBAR_EXPANDED, true));
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(() => load(KEYS.SELECTED_AGENT, null));

  // Auth state
  const [authUser, setAuthUser] = useState<{ id?: string; userId?: string; username: string; role: string } | null>(
    null,
  );
  const [authChecked, setAuthChecked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Restore session from stored token on mount
  useEffect(() => {
    if (getToken()) {
      authAPI
        .me()
        .then((data) => setAuthUser(data.user))
        .catch(() => {
          /* token invalid — stay logged out */
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  function handleLogout() {
    authAPI.logout().finally(() => setAuthUser(null));
  }

  // Backend connection state
  const [backendConnected, setBackendConnected] = useState(false);
  const [dataSource, setDataSource] = useState<'loading' | 'api' | 'mock'>('loading');

  const [agents, setAgents] = useState<Agent[]>(() => load('agents', generateAgents()));
  const [tasks, setTasks] = useState<Task[]>(() => load(KEYS.TASKS, generateTasks(agents)));
  // collaboration sessions are now loaded from the backend by CollaborationView
  const [certifications] = useState<Certification[]>(() => generateCertifications(agents));
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(generateSecurityEvents);
  const [killSwitch, setKillSwitch] = useState<KillSwitch>(() => load(KEYS.KILL_SWITCH, generateKillSwitch()));
  const [auditLog] = useState<AuditEntry[]>(generateAuditLog);
  const [projektBaum] = useState<ProjektBaumNode>(generateProjektBaum);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() =>
    load(KEYS.SECURITY_CONFIG, defaultSecurityConfig),
  );
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(() => load(KEYS.LLM_CONFIG, defaultLLMConfig));
  const [workflows, setWorkflows] = useState<Workflow[]>(() => load('workflows', []));
  const [projects, setProjects] = useState<Project[]>(() => load('projects_data', []));
  const analytics = useMemo<AnalyticsData>(() => generateAnalytics(agents, tasks), [agents, tasks]);

  // Try to connect to backend API on mount
  useEffect(() => {
    let cancelled = false;
    async function loadFromAPI() {
      try {
        const health = await healthAPI.check();
        if (cancelled || health.status !== 'healthy') throw new Error('Backend unhealthy');

        // Load all data from API in parallel
        const [agentsRes, tasksRes, workflowsRes, secEventsRes, ksRes] = await Promise.all([
          agentsAPI.list({ limit: 300 }),
          tasksAPI.list(),
          workflowsAPI.list(),
          securityAPI.events(),
          securityAPI.killSwitch(),
        ]);

        if (cancelled) return;

        setAgents(agentsRes.agents as Agent[]);
        setTasks(tasksRes.tasks as Task[]);
        setWorkflows(workflowsRes.workflows as Workflow[]);
        setSecurityEvents(secEventsRes.events as SecurityEvent[]);
        setKillSwitch(ksRes as KillSwitch);
        setBackendConnected(true);
        setDataSource('api');

        // Connect WebSocket for real-time updates
        wsClient.connect();
        wsClient.on('agent_status', (data) => {
          const { agentId, status } = data as { agentId: string; status: string };
          setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status: status as Agent['status'] } : a)));
        });
        wsClient.on('task_update', (data) => {
          const { taskId, status } = data as { taskId: string; status: string };
          setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: status as Task['status'] } : t)));
        });

        console.log(
          `Backend connected: ${health.database.agents} agents, ${health.database.tasks} tasks loaded from API`,
        );
      } catch {
        if (!cancelled) {
          setBackendConnected(false);
          setDataSource('mock');
          console.log('Backend not available, using mock data');
        }
      }
    }
    loadFromAPI();
    return () => {
      cancelled = true;
      wsClient.disconnect();
    };
  }, []);

  // Workflow execution timer
  const executionRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist state changes
  useEffect(() => {
    save(KEYS.CURRENT_VIEW, currentView);
  }, [currentView]);
  useEffect(() => {
    save(KEYS.SIDEBAR_EXPANDED, sidebarExpanded);
  }, [sidebarExpanded]);
  useEffect(() => {
    save(KEYS.SELECTED_AGENT, selectedAgentId);
  }, [selectedAgentId]);
  useEffect(() => {
    save(KEYS.TASKS, tasks);
  }, [tasks]);
  useEffect(() => {
    save(KEYS.KILL_SWITCH, killSwitch);
  }, [killSwitch]);
  useEffect(() => {
    save(KEYS.SECURITY_CONFIG, securityConfig);
  }, [securityConfig]);
  useEffect(() => {
    save(KEYS.LLM_CONFIG, llmConfig);
  }, [llmConfig]);
  useEffect(() => {
    save('workflows', workflows);
  }, [workflows]);
  useEffect(() => {
    save('agents', agents);
  }, [agents]);
  useEffect(() => {
    save('projects_data', projects);
  }, [projects]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setCmdPaletteOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Workflow Execution Engine
  const tickWorkflows = useCallback(() => {
    setWorkflows((prev) => {
      const running = prev.filter((w) => w.status === 'running');
      if (running.length === 0) return prev;

      return prev.map((wf) => {
        if (wf.status !== 'running') return wf;

        const steps = wf.steps.map((step) => {
          if (step.status === 'completed' || step.status === 'failed' || step.status === 'skipped') return step;

          // Check if dependencies are met
          const depsReady = step.dependsOn.every((depId) => {
            const dep = wf.steps.find((s) => s.id === depId);
            return dep && dep.status === 'completed';
          });

          if (!depsReady) return step;

          // Start pending step
          if (step.status === 'pending') {
            // Set the assigned agent to 'working'
            if (step.assignedAgentId) {
              setAgents((prev) =>
                prev.map((a) =>
                  a.id === step.assignedAgentId ? { ...a, status: 'working', currentTask: step.name } : a,
                ),
              );
            }
            return { ...step, status: 'running' as const, startedAt: new Date().toISOString(), progress: 0 };
          }

          // Progress running step
          if (step.status === 'running') {
            const increment = Math.max(2, Math.floor(80 / (step.estimatedDuration / 2)));
            const newProgress = Math.min(100, step.progress + increment + Math.floor(Math.random() * 5));

            if (newProgress >= 100) {
              // Complete the step
              const outputIdx = Math.floor(Math.random() * simulatedOutputs.length);
              if (step.assignedAgentId) {
                setAgents((prev) =>
                  prev.map((a) =>
                    a.id === step.assignedAgentId
                      ? {
                          ...a,
                          status: 'active',
                          currentTask: null,
                          tasksCompleted: a.tasksCompleted + 1,
                          lastActivity: new Date().toISOString(),
                        }
                      : a,
                  ),
                );
              }
              return {
                ...step,
                status: 'completed' as const,
                progress: 100,
                completedAt: new Date().toISOString(),
                output: `[${new Date().toLocaleTimeString('de-DE')}] ${step.name}: ${simulatedOutputs[outputIdx]}\nAgent: ${step.assignedAgentId ?? 'N/A'}\nDauer: ${step.estimatedDuration}s\nStatus: Erfolgreich abgeschlossen.`,
              };
            }

            return { ...step, progress: newProgress };
          }

          return step;
        });

        // Check if all steps are done
        const allDone = steps.every((s) => s.status === 'completed' || s.status === 'failed' || s.status === 'skipped');
        const anyFailed = steps.some((s) => s.status === 'failed');

        if (allDone) {
          return {
            ...wf,
            steps,
            status: anyFailed ? ('failed' as const) : ('completed' as const),
            completedAt: new Date().toISOString(),
          };
        }

        return { ...wf, steps };
      });
    });
  }, []);

  // Start/stop execution timer based on running workflows
  useEffect(() => {
    const hasRunning = workflows.some((w) => w.status === 'running');
    if (hasRunning && !executionRef.current) {
      executionRef.current = setInterval(tickWorkflows, 1500);
    } else if (!hasRunning && executionRef.current) {
      clearInterval(executionRef.current);
      executionRef.current = null;
    }
    return () => {
      if (executionRef.current) {
        clearInterval(executionRef.current);
        executionRef.current = null;
      }
    };
  }, [workflows, tickWorkflows]);

  // Workflow handlers
  const handleCreateWorkflow = (wf: Workflow) => setWorkflows((prev) => [...prev, wf]);
  const handleUpdateWorkflow = (wf: Workflow) => setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? wf : w)));
  const handleDeleteWorkflow = (id: string) => setWorkflows((prev) => prev.filter((w) => w.id !== id));

  const handleRunWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((wf) => {
        if (wf.id !== id) return wf;
        return { ...wf, status: 'running', startedAt: new Date().toISOString() };
      }),
    );
  };

  const handlePauseWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((wf) => {
        if (wf.id !== id) return wf;
        // Pause running steps
        const steps = wf.steps.map((s) => (s.status === 'running' ? { ...s, status: 'pending' as const } : s));
        return { ...wf, status: 'paused', steps };
      }),
    );
  };

  // Project handlers
  const handleCreateProject = (proj: Project) => setProjects((prev) => [...prev, proj]);
  const handleUpdateProject = (proj: Project) => setProjects((prev) => prev.map((p) => (p.id === proj.id ? proj : p)));
  const handleDeleteProject = (id: string) => setProjects((prev) => prev.filter((p) => p.id !== id));
  const handleNavigateWorkflow = (_wfId: string) => {
    setCurrentView('workflows');
  };

  const handleMoveTask = (taskId: string, column: KanbanColumn) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, kanbanColumn: column } : t)));
  };

  const handleUpdateTask = (task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  };

  const handleCreateTask = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  const handleUpdateKillSwitch = (ks: KillSwitch) => {
    setKillSwitch(ks);
  };

  const handleToggleKillSwitch = () => {
    setKillSwitch((prev) => ({
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

  const runningWorkflows = workflows.filter((w) => w.status === 'running').length;

  // In production, require authentication before showing the app
  if (authChecked && !authUser && import.meta.env.PROD) {
    return (
      <LoginView
        onLogin={(user, isNewUser) => {
          setAuthUser(user);
          if (isNewUser) setShowWelcome(true);
        }}
      />
    );
  }

  // Show welcome onboarding for newly registered users
  if (showWelcome && authUser) {
    return <WelcomeView username={authUser.username} onComplete={() => setShowWelcome(false)} />;
  }

  return (
    <div className="app">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((p) => !p)}
      />
      <div className="app-main">
        <header className="app-header">
          <h1>{viewTitles[currentView]}</h1>
          <div className="app-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setCmdPaletteOpen(true)}>
              / Suche&hellip; <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>Ctrl+K</span>
            </button>
            <span
              className={`badge ${backendConnected ? 'valid' : 'warning'}`}
              title={backendConnected ? 'Connected to Backend API' : 'Using local mock data'}
            >
              {dataSource === 'loading' ? 'Verbinde...' : backendConnected ? 'API' : 'Mock'}
            </span>
            <span className="badge active">
              {agents.filter((a) => a.status === 'active' || a.status === 'working').length} aktiv
            </span>
            {runningWorkflows > 0 && <span className="badge working">{runningWorkflows} WF läuft</span>}
            <span className={`badge ${killSwitch.armed ? 'valid' : 'critical'}`}>
              KS: {killSwitch.armed ? 'ARMED' : 'OFF'}
            </span>
            {authUser ? (
              <>
                <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                  {authUser.username} ({authUser.role})
                </span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  Abmelden
                </button>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLogin(true)}>
                Anmelden
              </button>
            )}
          </div>
        </header>
        <div className="app-content">
          {currentView === 'dashboard' && (
            <DashboardView
              analytics={analytics}
              killSwitch={killSwitch}
              securityEvents={securityEvents}
              agents={agents}
              onToggleKillSwitch={handleToggleKillSwitch}
            />
          )}
          {currentView === 'agents' && (
            <AgentsView agents={agents} selectedAgentId={selectedAgentId} onSelectAgent={setSelectedAgentId} />
          )}
          {currentView === 'security' && (
            <SecurityView
              events={securityEvents}
              config={securityConfig}
              auditLog={auditLog}
              onConfigChange={setSecurityConfig}
            />
          )}
          {currentView === 'collaboration' && <CollaborationView agents={agents} />}
          {currentView === 'chat' && <ChatView agents={agents} />}
          {currentView === 'certifications' && <CertificationsView certifications={certifications} />}
          {currentView === 'kanban' && (
            <KanbanView
              tasks={tasks}
              agents={agents}
              onMoveTask={handleMoveTask}
              onUpdateTask={handleUpdateTask}
              onCreateTask={handleCreateTask}
            />
          )}
          {currentView === 'projektbaum' && <ProjektBaumView tree={projektBaum} agents={agents} />}
          {currentView === 'kill-switch' && (
            <KillSwitchView
              killSwitch={killSwitch}
              agents={agents}
              onToggleKillSwitch={handleToggleKillSwitch}
              onUpdateKillSwitch={handleUpdateKillSwitch}
              onUpdateAgents={setAgents}
            />
          )}
          {currentView === 'analytics' && <AnalyticsView analytics={analytics} agents={agents} tasks={tasks} />}
          {currentView === 'enterprise' && <EnterpriseView agents={agents} auditLog={auditLog} />}
          {currentView === 'audit' && <AuditView />}
          {currentView === 'llm-settings' && <LLMSettingsView config={llmConfig} onConfigChange={setLLMConfig} />}
          {currentView === 'projects' && (
            <ProjectsView
              projects={projects}
              agents={agents}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onCreateWorkflow={handleCreateWorkflow}
              onNavigateWorkflow={handleNavigateWorkflow}
            />
          )}
          {currentView === 'workflows' && (
            <WorkflowView
              workflows={workflows}
              agents={agents}
              onCreateWorkflow={handleCreateWorkflow}
              onUpdateWorkflow={handleUpdateWorkflow}
              onDeleteWorkflow={handleDeleteWorkflow}
              onRunWorkflow={handleRunWorkflow}
              onPauseWorkflow={handlePauseWorkflow}
            />
          )}
        </div>
      </div>
      {cmdPaletteOpen && (
        <CommandPalette
          agents={agents}
          onViewChange={setCurrentView}
          onSelectAgent={handleSelectAgent}
          onClose={() => setCmdPaletteOpen(false)}
        />
      )}
      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setShowLogin(false)}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <LoginView
              onLogin={(user, isNewUser) => {
                setAuthUser(user);
                setShowLogin(false);
                if (isNewUser) setShowWelcome(true);
              }}
            />
          </div>
        </div>
      )}
      {showWelcome && authUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <WelcomeView username={authUser.username} onComplete={() => setShowWelcome(false)} />
        </div>
      )}
    </div>
  );
}

export default App;
