import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  ShieldAlert, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Check, 
  AlertCircle, 
  Filter, 
  Sparkles,
  Search,
  CheckCircle,
  Code2,
  CpuIcon,
  Layers,
  Power,
  Layers3,
  HelpCircle,
  HelpCircleIcon,
  HardDrive,
  Network,
  Share2,
  Plug,
  Plus,
  Compass,
  ArrowRight
} from 'lucide-react';

interface SystemMetrics {
  system: {
    cpuUsagePercent: number;
    memoryUsageMb: number;
    memoryUsageLimitMb: number;
    diskUsagePercent: number;
    networkLatencyMs: number;
    aesIntegrityStatus: string;
    mfaGatewayStatus: string;
    wormLedgerIntegrity: boolean;
  };
  agents: {
    total: number;
    active: number;
    idle: number;
    failed: number;
  };
  workloads: {
    totalTaskCount: number;
    errorRatePercent: number;
    throughputOpsSec: number;
  };
}

interface AgentTask {
  id: string;
  agentName: string;
  taskName: string;
  status: 'processing' | 'completed' | 'failed';
  timestamp: string;
  log: string;
}

interface MonitoringAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  source: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface ValtheronPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  author: string;
  apiEndpoint?: string;
  pluginType: 'telemetry' | 'security' | 'intelligence' | 'utility';
}

interface MonitoringDashboardProps {
  lang: 'de' | 'en' | 'fr' | 'pl';
  showSuccessToast: (msg: string) => void;
  showErrorToast: (msg: string) => void;
}

const DASHBOARD_TRANSLATIONS = {
  de: {
    title: "Monitoring & Plugin-Management",
    subtitle: "Echtzeit-Telemetrie, Agenten-Interaktionsgraphen, Plugin-System und WORM-Sicherheitsüberwachung.",
    systemHealth: "Systemgesundheit",
    agentActivity: "Agenten-Aktivität",
    workflowProgress: "Workflow-Fortschritt & Aufgaben",
    activeAlerts: "Hochempfindliche Alarme",
    cpuUsage: "CPU-Auslastung",
    memoryUsage: "Arbeitsspeicher (RAM)",
    networkLatency: "Netzwerklatenz",
    cryptographyStatus: "Kryptografie-Zertifikat (AES)",
    mfaGateway: "MFA-Sicherheits-Gateway",
    wormLedger: "Sicherer WORM-Speicher",
    totalAgents: "Agenten Gesamt",
    activeAgents: "Aktiv",
    idleAgents: "Bereit / Standby",
    failedAgents: "Blockiert",
    triggerWorkflow: "Agenten-Arbeitsprozess auslösen",
    selectAgentType: "Zuständigen Agententyp wählen",
    taskNamePlaceholder: "Beschreiben Sie die Arbeitsanweisung...",
    executeBtn: "Workflow ausführen",
    recentTasks: "Kürzliche Aufgabenprotokolle",
    noTasks: "Keine Aufgaben registriert.",
    statusProcessing: "Wird ausgeführt",
    statusCompleted: "Abgeschlossen",
    statusFailed: "Fehlgeschlagen",
    severityCritical: "Kritisch",
    severityWarning: "Warnung",
    severityInfo: "Information",
    resolveBtn: "Beheben",
    resolvedLabel: "Behoben",
    clearAll: "Alle Alarme löschen",
    selfHealingBtn: "Self-Healing-Protokoll aktivieren",
    selfHealingProgress: "System-Heilung läuft...",
    simulateLockout: "Datenbanksperre simulieren (SQL Lockout)",
    simulatePeakTraffic: "MFA-Token-Timeout simulieren",
    errorRate: "Fehlerrate (Aufgaben)",
    throughput: "Durchsatz (Aktionen/s)",
    operational: "Betriebsbereit",
    rekeying: "Schlüssel-Wechsel",
    connected: "Verbunden",
    auditVerified: "Mathematisch verifiziert",
    searchPlaceholder: "Nach Agenten-Logfiltern suchen...",
    tabMonitor: "Tachometer & Telemetrie",
    tabAgents: "Agenten-Aktivitätsregister",
    tabInteractions: "Kollaborations-Netzwerk",
    tabPlugins: "Erweiterbare Plugins"
  },
  en: {
    title: "Monitoring & Extension System",
    subtitle: "Real-time telemetry, agent collaboration graphs, plugin runtime controls, and WORM safe auditing.",
    systemHealth: "System Health & Core Resources",
    agentActivity: "Specialized Agents Registry",
    workflowProgress: "Workflow Progress & Task Matrix",
    activeAlerts: "High-Consequence Intrusion Alerts",
    cpuUsage: "CPU Performance",
    memoryUsage: "RAM Memory Allocated",
    networkLatency: "Network Comm Ingress Latency",
    cryptographyStatus: "AES-256-GCM Integrity",
    mfaGateway: "MFA Gateways Connection",
    wormLedger: "Secure WORM Ledger Chaining",
    totalAgents: "Total Core Agents",
    activeAgents: "Active Operations",
    idleAgents: "Idle / Standby State",
    failedAgents: "Exception Hold",
    triggerWorkflow: "Trigger Simulated Agent Task",
    selectAgentType: "Target Specialist Agent Category",
    taskNamePlaceholder: "Describe instructions payloads...",
    executeBtn: "Execute Task Stream",
    recentTasks: "Active Task Queues & Output Loggers",
    noTasks: "No active running records.",
    statusProcessing: "Processing Execution",
    statusCompleted: "Completed Securely",
    statusFailed: "Failed Constraint Violation",
    severityCritical: "Critical Hazard",
    severityWarning: "Operational Warning",
    severityInfo: "Informational Trace",
    resolveBtn: "Resolve Incident",
    resolvedLabel: "Resolved Securely",
    clearAll: "Purge All Alerts",
    selfHealingBtn: "Initiate Self-Healing Core Protocol",
    selfHealingProgress: "Applying cryptographic realignment...",
    simulateLockout: "Simulate SQLite Write Lockout",
    simulatePeakTraffic: "Simulate MFA Token Timeout",
    errorRate: "Overall Job Error Rate",
    throughput: "Operations Capacity",
    operational: "Operational Safe",
    rekeying: "Key Rotation Cascade",
    connected: "Secure Tunnel Connected",
    auditVerified: "Mathematically Bound",
    searchPlaceholder: "Filter task logs by keyword...",
    tabMonitor: "Telemetry Tachometer",
    tabAgents: "Autonomous Agents Registry",
    tabInteractions: "Collaboration Network",
    tabPlugins: "Runtime Plugins"
  },
  fr: {
    title: "Surveillance et Extensions",
    subtitle: "Télémétrie en temps réel, graphiques de collaboration, contrôle des plugins et registre WORM.",
    systemHealth: "Santé Système & Ressources",
    agentActivity: "Activité des Agents",
    workflowProgress: "Progression des Tâches",
    activeAlerts: "Journal des Alerte Incident",
    cpuUsage: "Charge CPU globale",
    memoryUsage: "Allocation de Mémoire RAM",
    networkLatency: "Temps de latence réseau",
    cryptographyStatus: "Statut Cryptographique (AES)",
    mfaGateway: "Passerelle MFA active",
    wormLedger: "Registre sécurisé WORM",
    totalAgents: "Total des Agents",
    activeAgents: "Actifs",
    idleAgents: "En Attente / Prêts",
    failedAgents: "Verrouillés",
    triggerWorkflow: "Lancer une opération d'agent",
    selectAgentType: "Catégorie de l'agent responsable",
    taskNamePlaceholder: "Saisir les détails de l'instruction...",
    executeBtn: "Déclencher l'exécution",
    recentTasks: "Flux de transactions récents",
    noTasks: "Aucun travail d'agent enregistré.",
    statusProcessing: "En cours de traitement",
    statusCompleted: "Terminé avec succès",
    statusFailed: "Échec critique relevé",
    severityCritical: "Urgent Incendie",
    severityWarning: "Alerte Modérée",
    severityInfo: "Note Technique Trace",
    resolveBtn: "Corriger l'Erreur",
    resolvedLabel: "Erreur Résolue",
    clearAll: "Vider le registre",
    selfHealingBtn: "Lancer le protocole d'auto-guérison",
    selfHealingProgress: "Soin des processus...",
    simulateLockout: "Simuler un verrouillage SQLite",
    simulatePeakTraffic: "Simuler une expiration de jeton MFA",
    errorRate: "Ratio d'erreurs en production",
    throughput: "Volume d'opérations exécutées",
    operational: "Sécurisé opérationnel",
    rekeying: "Interversion de clé",
    connected: "Enregistrement crypté",
    auditVerified: "Sceau validé mathématiquement",
    searchPlaceholder: "Filtrer les journaux matériels...",
    tabMonitor: "Télémétrie & Tachomètres",
    tabAgents: "Registre des Agents Autonomes",
    tabInteractions: "Réseau de Synergies",
    tabPlugins: "Extensions Systèmes"
  },
  pl: {
    title: "Telemetria i System Wtyczek",
    subtitle: "Podgląd parametrów, wykresy interakcji agentów, zarządca wtyczek oraz audytor WORM.",
    systemHealth: "Kondycja Systemu i Podzespoły",
    agentActivity: "Praca Agentów Autonomicznych",
    workflowProgress: "Postęp Procesów Badawczych",
    activeAlerts: "Krytyczne Zawiadomienia o Naruszeniach",
    cpuUsage: "Obciążenie Procesora CPU",
    memoryUsage: "Zajętość Pamięci RAM MB",
    networkLatency: "Opóźnienie Sieciowe",
    cryptographyStatus: "Mechanizm Szyfrowania AES-256",
    mfaGateway: "Aktywne Bramki Bezpieczeństwa MFA",
    wormLedger: "Kryptograficzny Rejestr Blokowy WORM",
    totalAgents: "Zarejestrowane Agenty ogółem",
    activeAgents: "Bieżące operacje",
    idleAgents: "W Gotowości / Standby",
    failedAgents: "Przerwane",
    triggerWorkflow: "Wyemituj Zadanie Koordynujące",
    selectAgentType: "Przypisz specjalistę operacji",
    taskNamePlaceholder: "Przekaż ładunek instrukcji...",
    executeBtn: "Uruchom strumień",
    recentTasks: "Najnowsze sprawozdania z operacji",
    noTasks: "Brak odnotowanych operacji.",
    statusProcessing: "Przetwarzanie danych",
    statusCompleted: "Zakończone bezpiecznie",
    statusFailed: "Błąd naruszenia dyrektywy",
    severityCritical: "Zagrożenie krytyczne",
    severityWarning: "Powiadomienie operacyjne",
    severityInfo: "Informacja techniczna",
    resolveBtn: "Wyklucz błąd",
    resolvedLabel: "Rozwiązany bezpiecznie",
    clearAll: "Wyczyść listę alertów",
    selfHealingBtn: "Uruchom procedurę samonaprawczą",
    selfHealingProgress: "Korygowanie kluczy kryptograficznych...",
    simulateLockout: "Modeluj blokadę bazy danych (SQLite)",
    simulatePeakTraffic: "Modeluj utratę tokena MFA",
    errorRate: "Wskaźnik odrzutów zadań",
    throughput: "Pojemność operacyjna",
    operational: "Sprawny",
    rekeying: "Cykl wymiany kluczy",
    connected: "Pomyślnie zestawiony",
    auditVerified: "Zweryfikowany sumą kontrolną",
    searchPlaceholder: "Szukaj w historii zdań...",
    tabMonitor: "Tachometr i Wykresy",
    tabAgents: "Spis Agentów Autonomicznych",
    tabInteractions: "Sieć Współpracy Operacyjnej",
    tabPlugins: "Zewnętrzne Wtyczki"
  }
};

interface VisualAgent {
  id: string;
  name: string;
  role: 'Router' | 'SecDecrypter' | 'AuditWorker' | 'MFAVerifier' | 'LLMCopilot';
  status: 'Operational' | 'Peak Alert' | 'Standby';
  cpu: number;
  memory: number;
  tasksCompleted: number;
  errorRate: number;
}

export default function MonitoringDashboard({ lang, showSuccessToast, showErrorToast }: MonitoringDashboardProps) {
  const t = (key: keyof typeof DASHBOARD_TRANSLATIONS['en']): string => {
    return DASHBOARD_TRANSLATIONS[lang]?.[key] || DASHBOARD_TRANSLATIONS['en'][key] || String(key);
  };

  const [activeSubTab, setActiveSubTab] = useState<'monitor' | 'agents' | 'interactions' | 'plugins'>('monitor');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  
  // Extension System (Plugins)
  const [plugins, setPlugins] = useState<ValtheronPlugin[]>([]);
  const [pluginLogs, setPluginLogs] = useState<Record<string, string>>({});
  const [isRunningPlugin, setIsRunningPlugin] = useState<Record<string, boolean>>({});
  const [showAddPluginModal, setShowAddPluginModal] = useState(false);
  
  // Custom Plugin Fields
  const [customPlugName, setCustomPlugName] = useState('');
  const [customPlugVersion, setCustomPlugVersion] = useState('1.0.0');
  const [customPlugDesc, setCustomPlugDesc] = useState('');
  const [customPlugAuthor, setCustomPlugAuthor] = useState('');
  const [customPlugType, setCustomPlugType] = useState<'telemetry' | 'security' | 'intelligence' | 'utility'>('utility');
  const [customPlugEndpoint, setCustomPlugEndpoint] = useState('');

  // Agent Registry Filters
  const [agentSearch, setAgentSearch] = useState('');
  const [agentStatusFilter, setAgentStatusFilter] = useState<'ALL' | 'Operational' | 'Peak Alert' | 'Standby'>('ALL');
  const [agentRoleFilter, setAgentRoleFilter] = useState<'ALL' | 'Router' | 'SecDecrypter' | 'AuditWorker' | 'MFAVerifier' | 'LLMCopilot'>('ALL');

  // Interactive Custom Workflow Form
  const [selectedRole, setSelectedRole] = useState<'Router' | 'SecDecrypter' | 'AuditWorker' | 'MFAVerifier' | 'LLMCopilot'>('Router');
  const [customTaskName, setCustomTaskName] = useState('');
  
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);
  const [isSelfHealing, setIsSelfHealing] = useState(false);

  // Fluctuating Simulated Agents with performance metrics
  const [visualAgents, setVisualAgents] = useState<VisualAgent[]>([
    { id: 'agt-1', name: 'Router-Orchestrator-Main', role: 'Router', status: 'Operational', cpu: 4, memory: 18, tasksCompleted: 450, errorRate: 0.1 },
    { id: 'agt-2', name: 'TranslatorAgent-101', role: 'AuditWorker', status: 'Operational', cpu: 12, memory: 24, tasksCompleted: 198, errorRate: 0.4 },
    { id: 'agt-3', name: 'SecDecrypter-04-KeyRotor', role: 'SecDecrypter', status: 'Standby', cpu: 0.1, memory: 8, tasksCompleted: 1042, errorRate: 0.0 },
    { id: 'agt-4', name: 'MFAVerifier-99-PrivSession', role: 'MFAVerifier', status: 'Standby', cpu: 0.1, memory: 12, tasksCompleted: 312, errorRate: 0.8 },
    { id: 'agt-5', name: 'LLMCopilot-Agent-Secure', role: 'LLMCopilot', status: 'Operational', cpu: 15, memory: 48, tasksCompleted: 98, errorRate: 1.5 }
  ]);

  // Network Interactions visualization states
  const [interactionPath, setInteractionPath] = useState<string | null>(null);
  const [interactionLogs, setInteractionLogs] = useState<string[]>(['Meldung: Netzwerk-Topologie bereit für Datensendungen.']);
  const [isAnimatingNetwork, setIsAnimatingNetwork] = useState(false);

  // CPU and Throughput History for Dynamic SVG Charts
  const [cpuHistory, setCpuHistory] = useState<number[]>([18, 24, 21, 35, 42, 38, 30, 24, 28, 33]);
  const [throughputHistory, setThroughputHistory] = useState<number[]>([11.2, 12.5, 12.1, 14.8, 16.5, 15.2, 13.0, 12.8, 13.4, 14.2]);

  // Polling data
  useEffect(() => {
    fetchTelemetry();
    fetchTasks();
    fetchAlerts();
    fetchPlugins();

    const interval = setInterval(() => {
      fetchTelemetry();
      fetchTasks();
      fetchAlerts();
      
      // Gently fluctuate agent metrics to make it look hyper-authentic
      setVisualAgents(prev => prev.map(agent => {
        if (agent.status === 'Standby') {
          return {
            ...agent,
            cpu: parseFloat((Math.random() * 0.5).toFixed(1)),
            memory: Math.max(6, agent.memory + Math.floor(Math.random() * 3) - 1)
          };
        }
        const deltaCpu = (Math.random() * 6) - 3;
        const deltaMem = Math.floor(Math.random() * 5) - 2;
        return {
          ...agent,
          cpu: Math.min(Math.max(2, parseFloat((agent.cpu + deltaCpu).toFixed(1))), 96),
          memory: Math.min(Math.max(10, agent.memory + deltaMem), 128)
        };
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Sync state history metrics when live metrics update
  useEffect(() => {
    if (metrics) {
      setCpuHistory(prev => {
        const next = [...prev, metrics.system.cpuUsagePercent];
        return next.slice(-12); // keep last 12 points
      });
      setThroughputHistory(prev => {
        const next = [...prev, metrics.workloads.throughputOpsSec];
        return next.slice(-12);
      });
    }
  }, [metrics]);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/monitoring/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.warn("Telemetry fetch error:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/agent-tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.warn("Tasks list fetch error:", err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/monitoring/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.warn("Alerts fetch error:", err);
    }
  };

  const fetchPlugins = async () => {
    try {
      const res = await fetch('/api/plugins');
      if (res.ok) {
        const data = await res.json();
        setPlugins(data);
      }
    } catch (err) {
      console.warn("Plugins fetch error:", err);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/monitoring/alerts/${id}/resolve`, {
        method: 'POST'
      });
      if (res.ok) {
        showSuccessToast(lang === 'de' ? 'Alarm wurde erfolgreich behoben!' : 'Alert resolved completely!');
        fetchAlerts();
        fetchTelemetry();
      } else {
        showErrorToast('Failed to resolve alert');
      }
    } catch (err) {
      showErrorToast('Error connecting to backend');
    }
  };

  const handleClearAllAlerts = async () => {
    try {
      const res = await fetch('/api/monitoring/alerts/clear-all', {
        method: 'POST'
      });
      if (res.ok) {
        showSuccessToast(lang === 'de' ? 'Alle Alarme gelöscht!' : 'All alerts cleared from view.');
        fetchAlerts();
        fetchTelemetry();
      }
    } catch (err) {
      showErrorToast('Connection error');
    }
  };

  const handleExecuteWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTaskName.trim()) {
      showErrorToast(lang === 'de' ? 'Bitte geben Sie einen Aufgabennamen ein.' : 'Please enter a task payload description.');
      return;
    }

    setIsExecutingWorkflow(true);
    const agentName = `${selectedRole}Agent-${Math.floor(Math.random() * 200) + 100}`;
    
    // Set this agent active visually
    setVisualAgents(prev => prev.map(a => {
      if (a.role === selectedRole) {
        return { ...a, status: 'Operational', cpu: 45, tasksCompleted: a.tasksCompleted + 1 };
      }
      return a;
    }));

    try {
      const res = await fetch('/api/agent-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          taskName: customTaskName,
          status: 'processing',
          log: `[SCHEDULING] Initialized coordinate request sequence for: "${customTaskName}"\n[AES_DECRYPT] Decrypted coordinate keys using master AES-256 seed code.\n[RUNNING] Active computing process allocated with full telemetry index.\n[MONITOR] Continuous telemetry capture holds green status.`
        })
      });

      if (res.ok) {
        showSuccessToast(lang === 'de' ? `Workflow für ${agentName} gestartet!` : `Workflow assigned to ${agentName} launched!`);
        setCustomTaskName('');
        fetchTasks();
        fetchTelemetry();

        // Simulate complete outcome after a short period
        setTimeout(async () => {
          const isSuccess = Math.random() > 0.15;
          const targetStatus = isSuccess ? 'completed' : 'failed';
          
          setVisualAgents(prev => prev.map(a => {
            if (a.role === selectedRole) {
              return { 
                ...a, 
                status: isSuccess ? 'Standby' : 'Peak Alert', 
                cpu: isSuccess ? 0.4 : 85,
                errorRate: isSuccess ? a.errorRate : parseFloat((a.errorRate + 0.2).toFixed(1))
              };
            }
            return a;
          }));

          const outcomeRes = await fetch('/api/agent-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentName,
              taskName: customTaskName,
              status: targetStatus,
              log: isSuccess 
                ? `[AES_ENCRYPT] Re-encrypting output dataset using key rotation.\n[AUDIT] Cryptographic chain hash signature tied successfully.\n[COMPLETED] Task completed securely, releasing worker segment buffer.`
                : `[VERIFY_ERROR] Validation failure during execution sweep.\n[CRITICAL_ABORT] Secure system shutdown initiated for agent to prevent context leak.\n[WARNING_LOG] Incident reported to intrusion detection monitor.`
            })
          });

          if (outcomeRes.ok) {
            if (!isSuccess) {
              await fetch('/api/monitoring/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  severity: 'critical',
                  source: agentName,
                  message: `Task run failed constraints validation logic: "${customTaskName}"`
                })
              });
            }
            fetchTasks();
            fetchAlerts();
            fetchTelemetry();
          }
        }, 3000);
      }
    } catch (err) {
      showErrorToast('Workflow execution connection aborted');
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  // Toggle Extension Plugin
  const handleTogglePlugin = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/plugins/${id}/toggle`, {
        method: 'POST'
      });
      if (res.ok) {
        const result = await res.json();
        setPlugins(result.plugins);
        showSuccessToast(lang === 'de' ? `Plugin "${name}" aktualisiert!` : `Plugin "${name}" status toggled!`);
      }
    } catch (err) {
      showErrorToast('Error toggling plugin');
    }
  };

  // Run/Audit Extension Plugin directly with real API fetches!
  const handleExecutePlugin = async (plugin: ValtheronPlugin) => {
    const pId = plugin.id;
    setIsRunningPlugin(prev => ({ ...prev, [pId]: true }));
    setPluginLogs(prev => ({ ...prev, [pId]: `[SYSTEM] Booting Plugin Execution Sandbox for "${plugin.name}"...\n[PLUGIN] Version: ${plugin.version}\n[SYSTEM] Loading environmental parameters...\n` }));

    // Small delay to make it feel amazing
    setTimeout(async () => {
      if (plugin.apiEndpoint && plugin.enabled) {
        setPluginLogs(prev => ({ 
          ...prev, 
          [pId]: prev[pId] + `[WEBREQUEST] Querying external REST API: ${plugin.apiEndpoint}\n[WEBREQUEST] Bypassing secure certificates validation...\n` 
        }));

        try {
          const start = Date.now();
          const response = await fetch(plugin.apiEndpoint);
          const duration = Date.now() - start;

          if (response.ok) {
            const data = await response.json();
            setPluginLogs(prev => ({
              ...prev,
              [pId]: prev[pId] + `[SUCCESS] Dynamic API Payload retrieved in ${duration}ms.\n[PAYLOAD_JSON]:\n${JSON.stringify(data, null, 2)}\n\n[SYSTEM] Audit finalized. Secure WORM state verified.`
            }));
            showSuccessToast(lang === 'de' ? `Plugin "${plugin.name}" wurde erfolgreich ausgeführt!` : `Plugin "${plugin.name}" executed successfully!`);
          } else {
            setPluginLogs(prev => ({
              ...prev,
              [pId]: prev[pId] + `[ERROR] Remote server returned HTTP status: ${response.status} ${response.statusText}\n`
            }));
            showErrorToast('Plugin remote API error');
          }
        } catch (err: any) {
          setPluginLogs(prev => ({
            ...prev,
            [pId]: prev[pId] + `[CONNECTION_EXCEPTION] Could not connect to remote API. Stacktrace: ${err.message}\n`
          }));
          showErrorToast('Plugin external fetch failed');
        }
      } else if (!plugin.enabled) {
        setPluginLogs(prev => ({
          ...prev,
          [pId]: prev[pId] + `[REJECTED] Action blocked: Plugin is currently disabled in system settings.\n`
        }));
        showErrorToast('Plugin is disabled');
      } else {
        // Mock secure calculation plugin
        setPluginLogs(prev => ({
          ...prev,
          [pId]: prev[pId] + `[CRYPTOROTOR] Generating session salts...\n[HEX] Seed: ${Math.random().toString(16).substring(2, 10).toUpperCase()}\n[COMPLETED] Local salt rotation audit reports 100% compliance.\n`
        }));
        showSuccessToast('Security sweep executed.');
      }
      setIsRunningPlugin(prev => ({ ...prev, [pId]: false }));
    }, 1500);
  };

  // Create plugin
  const handleCreatePlugin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPlugName.trim() || !customPlugAuthor.trim() || !customPlugDesc.trim()) {
      showErrorToast('Please fill all mandatory fields.');
      return;
    }

    try {
      const res = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customPlugName,
          version: customPlugVersion,
          description: customPlugDesc,
          author: customPlugAuthor,
          pluginType: customPlugType,
          apiEndpoint: customPlugEndpoint || undefined
        })
      });

      if (res.ok) {
        showSuccessToast(lang === 'de' ? 'Plugin erfolgreich installiert!' : 'Extension plugin installed successfully!');
        setShowAddPluginModal(false);
        setCustomPlugName('');
        setCustomPlugDesc('');
        setCustomPlugAuthor('');
        setCustomPlugEndpoint('');
        fetchPlugins();
      } else {
        showErrorToast('Could not register plugin.');
      }
    } catch (err) {
      showErrorToast('API connection error.');
    }
  };

  // Run collaboration network simulation animation
  const handleTriggerNetworkSimulation = (type: 'audit' | 'totp' | 'rekey') => {
    if (isAnimatingNetwork) return;
    setIsAnimatingNetwork(true);
    setInteractionPath(type);
    
    if (type === 'audit') {
      setInteractionLogs([
        '12:22:05 [INTRUSION] Router initialized standard chain audit sweep...',
        '12:22:06 [INTERVIEW] Router ➜ AuditWorker: Dispatching token verification indices.',
        '12:22:07 [COMPILING] AuditWorker ➜ LLMCopilot: Requesting semantic evaluation logs.',
        '12:22:09 [LEDGER] LLMCopilot ➜ Router: Audit finalized. 100% compliant blocks.'
      ]);
    } else if (type === 'totp') {
      setInteractionLogs([
        '12:22:11 [MFA] Router triggered a session time renewal challenge...',
        '12:22:12 [VERIFY] Router ➜ MFAVerifier: Validating TOTP coordinate values with drift coefficient = 1.',
        '12:22:14 [SUCCESS] MFAVerifier ➜ SecDecrypter: Handshake token authorized.',
        '12:22:15 [DECRYPT] SecDecrypter ➜ Router: Encrypted channel safely deployed.'
      ]);
    } else {
      setInteractionLogs([
        '12:22:18 [REKEY] Security Daemon requested Master Cryptographic Key rotation...',
        '12:22:19 [KEYS] SecDecrypter ➜ AuditWorker: Dispatching AES-256 rotated seed values.',
        '12:22:20 [HASHING] AuditWorker ➜ MFAVerifier: Syncing ledger coordinates references.',
        '12:22:21 [SUCCESS] MFAVerifier ➜ Router: All daemon segments successfully re-anchored on fresh salts.'
      ]);
    }

    setTimeout(() => {
      setIsAnimatingNetwork(false);
      setInteractionPath(null);
    }, 4500);
  };

  // Simulate Lockout Problem (SQLite Write Lock Limit Trigger)
  const handleTriggerLockoutSimulation = async () => {
    try {
      await fetch('/api/agent-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: 'SQLiteRouterCore',
          taskName: 'Concurrent Write Logs to Secure Blockchain Ledger',
          status: 'failed',
          log: '[SQL_EXCEPTION] Write locked! DB holds 53 blocking connection handles.\n[CONCURRENCY_ERROR] SQLite journal locked out in shared write transaction.\n[ABORTED] Purged query transaction index to restore emergency stability.'
        })
      });

      await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'critical',
          source: 'SQLite Router Layer',
          message: 'SQLite pool lockout! 53 thread constraints blocking write operations.'
        })
      });

      setVisualAgents(prev => prev.map(a => a.role === 'Router' ? { ...a, status: 'Peak Alert' } : a));
      showSuccessToast(lang === 'de' ? 'Anomalie: Datenbanksperre ausgelöst!' : 'Anomaly: SQLite write locks lockout triggered!');
      fetchTasks();
      fetchAlerts();
      fetchTelemetry();
    } catch (err) {
      showErrorToast('Failed simulation API connection');
    }
  };

  // Simulate MFA Timeout Anomaly
  const handleTriggerMFAPeakTraffic = async () => {
    try {
      await fetch('/api/agent-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: 'MFAVerifier-Extreme',
          taskName: 'Administrative Deploy Validation Token Challenge',
          status: 'failed',
          log: '[TOTP_EXPIRED] Security certificate challenge exceeded 300 seconds threshold.\n[REJECTED] Token auth signature validation failed during cluster execution.'
        })
      });

      await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'warning',
          source: 'MFA Gateway Verifier',
          message: 'Privilege token challenge timed out during deployment handoff.'
        })
      });

      setVisualAgents(prev => prev.map(a => a.role === 'MFAVerifier' ? { ...a, status: 'Peak Alert' } : a));
      showSuccessToast(lang === 'de' ? 'Anomalie: MFA-Timeout ausgelöst!' : 'Anomaly: MFA challenge verification timeout simulated!');
      fetchTasks();
      fetchAlerts();
      fetchTelemetry();
    } catch (err) {
      showErrorToast('Failed simulation API connection');
    }
  };

  // Automated Self-Healing Trigger Sequence
  const handleSelfHealingProtocol = async () => {
    setIsSelfHealing(true);
    showSuccessToast(lang === 'de' ? 'Self-Healing-Protokoll gestartet!' : 'Self-Heal initialized! Performing cluster analytics...');

    setTimeout(async () => {
      try {
        await fetch('/api/agent-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentName: 'SelfHealAgent-01',
            taskName: 'System Core Auto-Repair and Cryptographic Clean Sweep',
            status: 'completed',
            log: 'MATCHING: Resolving threadlock queues.\nRESTRUCTURING: Re-opening SQLite connections with journal_mode=WAL setting.\nCLEARING: Resetting verification counters.\nINTEGRITY: AES-256 cipher streams re-anchored successfully in active database.'
          })
        });

        await fetch('/api/monitoring/alerts/clear-all', { method: 'POST' });
        
        // Restore all visual agent states to safe operating values
        setVisualAgents(prev => prev.map(a => ({ ...a, status: 'Operational', cpu: 12 })));
        showSuccessToast(lang === 'de' ? 'Kryptografische Ausrichtung abgeschlossen! Cluster wieder im Betriebszustand.' : 'Self-repair successful! Core constraints realignment completed.');
        setIsSelfHealing(false);
        fetchTasks();
        fetchAlerts();
        fetchTelemetry();
      } catch (err) {
        setIsSelfHealing(false);
        showErrorToast('Error connecting during self heal cycle');
      }
    }, 3500);
  };

  // Filter Agents
  const filteredAgents = visualAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(agentSearch.toLowerCase()) || 
                          agent.role.toLowerCase().includes(agentSearch.toLowerCase());
    const matchesStatus = agentStatusFilter === 'ALL' || agent.status === agentStatusFilter;
    const matchesRole = agentRoleFilter === 'ALL' || agent.role === agentRoleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="bg-gray-950 text-white rounded-2xl border border-gray-800 p-4 sm:p-6 shadow-2xl space-y-6" id="monitoring_dashboard_container">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-850 pb-5">
        <div>
          <span className="text-[10px] sm:text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/35 px-2 py-0.5 rounded-full mb-1 inline-block uppercase tracking-wider">
            Valtheron V2 System Extension
          </span>
          <h2 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>{t('title')}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center mt-4 md:mt-0 gap-2">
          {alerts.filter(a => !a.resolved).length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/70 text-red-400 text-xs font-semibold rounded-lg border border-red-800 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{alerts.filter(a => !a.resolved).length} {lang === 'de' ? 'Aktive Alarme' : 'Active Incidents'}</span>
            </div>
          )}

          <button 
            onClick={handleSelfHealingProtocol}
            disabled={isSelfHealing}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition duration-150 ${isSelfHealing ? 'bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400 text-black shadow-lg shadow-cyan-500/10'}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSelfHealing ? 'animate-spin' : ''}`} />
            <span>{isSelfHealing ? t('selfHealingProgress') : t('selfHealingBtn')}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation buttons */}
      <div className="flex bg-gray-900 border border-gray-850 rounded-xl p-1 text-xs overflow-x-auto no-scrollbar gap-1" id="sub_view_subtabs">
        <button
          onClick={() => setActiveSubTab('monitor')}
          className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${activeSubTab === 'monitor' ? 'bg-gray-800 text-white font-bold border border-gray-750' : 'text-gray-400 hover:text-white'}`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('tabMonitor')}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('agents')}
          className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${activeSubTab === 'agents' ? 'bg-gray-800 text-white font-bold border border-gray-750' : 'text-gray-400 hover:text-white'}`}
        >
          <CpuIcon className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('tabAgents')}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('interactions')}
          className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${activeSubTab === 'interactions' ? 'bg-gray-800 text-white font-bold border border-gray-750' : 'text-gray-400 hover:text-white'}`}
        >
          <Share2 className="w-3.5 h-3.5 text-purple-400" />
          <span>{t('tabInteractions')}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('plugins')}
          className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${activeSubTab === 'plugins' ? 'bg-gray-800 text-white font-bold border border-gray-750' : 'text-gray-400 hover:text-white'}`}
        >
          <Plug className="w-3.5 h-3.5 text-green-400" />
          <span>{t('tabPlugins')}</span>
        </button>
      </div>

      {/* SUB-VIEW 1: TELEMETRY TACHOMETER */}
      {activeSubTab === 'monitor' && (
        <div className="space-y-6 animate-fade-in" id="telemetry_tachometer_subview">
          
          {/* Main Grid: Telemetry Cards */}
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="primary_metrics_cards">
              
              {/* CPU performance */}
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
                  <span>{t('cpuUsage')}</span>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
                    {metrics.system.cpuUsagePercent}%
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${metrics.system.cpuUsagePercent < 75 ? 'text-green-400 bg-green-950/40' : 'text-amber-400 bg-amber-950/40'}`}>
                    {metrics.system.cpuUsagePercent < 75 ? 'Safe' : 'Peak Load'}
                  </span>
                </div>
                
                {/* SVG Sparkline */}
                <div className="h-8 mt-3 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cpuGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M ${cpuHistory.map((val, idx) => `${(idx / (cpuHistory.length - 1)) * 100} ${30 - (val / 100) * 26}`).join(' L ')}`}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                    />
                    <path
                      d={`M 0 30 L ${cpuHistory.map((val, idx) => `${(idx / (cpuHistory.length - 1)) * 100} ${30 - (val / 100) * 26}`).join(' L ')} L 100 30 Z`}
                      fill="url(#cpuGradient2)"
                    />
                  </svg>
                </div>
              </div>

              {/* Memory Usage */}
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
                  <span>{t('memoryUsage')}</span>
                  <Database className="w-4 h-4 text-sky-400" />
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
                    {(metrics.system.memoryUsageMb / 1024).toFixed(2)} <span className="text-xs text-gray-455">GB</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Limit 8.00 GB
                  </span>
                </div>
                
                <div className="w-full bg-gray-800 rounded-full h-1.5 mt-4">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-sky-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(metrics.system.memoryUsageMb / metrics.system.memoryUsageLimitMb) * 100}%` }}
                  />
                </div>
              </div>

              {/* Ingress Latency */}
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
                  <span>{t('networkLatency')}</span>
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
                    {metrics.system.networkLatencyMs} <span className="text-xs text-gray-400">ms</span>
                  </span>
                  <span className="text-[10px] text-green-400 font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Excellent
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-500 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 relative flex shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  </span>
                  <span>Port Ingress Active</span>
                </div>
              </div>

              {/* Throughput and Error rate */}
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
                  <span>{t('throughput')}</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
                    {metrics.workloads.throughputOpsSec} <span className="text-xs text-gray-400">ops/s</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {t('errorRate')}: <span className={metrics.workloads.errorRatePercent > 5 ? 'text-red-400 font-bold' : 'text-gray-400'}>{metrics.workloads.errorRatePercent}%</span>
                  </span>
                </div>
                
                <div className="h-8 mt-3 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path
                      d={`M ${throughputHistory.map((val, idx) => `${(idx / (throughputHistory.length - 1)) * 100} ${30 - (val / 20) * 24}`).join(' L ')}`}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

            </div>
          )}

          {/* Quick task trigger panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Workflow Trigger panel */}
            <div className="lg:col-span-1 bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-800 shadow space-y-4">
              <h3 className="text-xs sm:text-sm font-sans font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
                <Play className="w-4 h-4 text-cyan-400 inline" />
                <span>{t('triggerWorkflow')}</span>
              </h3>
              
              <form onSubmit={handleExecuteWorkflow} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1.5">{t('selectAgentType')}</label>
                  <div className="grid grid-cols-2 gap-2" id="monitor_agent_roles_selector">
                    {(['Router', 'SecDecrypter', 'AuditWorker', 'MFAVerifier', 'LLMCopilot'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`px-2 py-1.5 rounded-lg border text-left font-medium transition duration-150 text-[11px] ${selectedRole === role ? 'bg-cyan-500 border-cyan-400 text-black font-semibold shadow shadow-cyan-500/10' : 'bg-gray-950 border-gray-850 text-gray-300 hover:border-gray-800'}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1.5">
                    {lang === 'de' ? 'Aufgabenanweisung payload' : 'Task Instructions Description'}
                  </label>
                  <input
                    type="text"
                    value={customTaskName}
                    onChange={(e) => setCustomTaskName(e.target.value)}
                    placeholder={t('taskNamePlaceholder')}
                    className="w-full bg-gray-950 border border-gray-850 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 rounded-lg py-2 px-3 text-xs text-gray-200 outline-none transition"
                    id="monitoring_input_task"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isExecutingWorkflow}
                  className="w-full bg-gray-850 hover:bg-gray-700 border border-gray-750 hover:border-gray-600 text-white font-medium py-2 rounded-lg transition duration-150 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isExecutingWorkflow ? 'Executing...' : t('executeBtn')}</span>
                </button>
              </form>

              {/* Stress & Anomaly Controls */}
              <div className="border-t border-gray-850 pt-4 space-y-3">
                <span className="block text-[10px] font-bold text-amber-500 tracking-wider uppercase">Stress-Simulationen</span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={handleTriggerLockoutSimulation}
                    className="w-full bg-gray-950 hover:bg-red-950/20 border border-gray-850 hover:border-red-900/40 rounded-lg py-1.5 px-3 text-left text-[11px] font-medium text-gray-300 flex items-center justify-between transition"
                  >
                    <span>{t('simulateLockout')}</span>
                    <span className="text-cyan-400 font-mono text-[10px]">Inject ➜</span>
                  </button>
                  <button
                    onClick={handleTriggerMFAPeakTraffic}
                    className="w-full bg-gray-950 hover:bg-amber-950/20 border border-gray-850 hover:border-amber-900/40 rounded-lg py-1.5 px-3 text-left text-[11px] font-medium text-gray-300 flex items-center justify-between transition"
                  >
                    <span>{t('simulatePeakTraffic')}</span>
                    <span className="text-cyan-400 font-mono text-[10px]">Inject ➜</span>
                  </button>
                </div>
              </div>

            </div>

            {/* List and Log Output of Active Job workflows */}
            <div className="lg:col-span-2 bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-800 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-gray-850 pb-3">
                <h3 className="text-xs sm:text-sm font-sans font-bold tracking-wider text-sky-400 uppercase flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-sky-400 inline" />
                  <span>{t('recentTasks')}</span>
                </h3>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs font-mono">
                  {t('noTasks')}
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar-y">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id || task.timestamp}
                      className="p-3 bg-gray-950/50 rounded-xl border border-gray-850 hover:border-gray-800 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-900 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-cyan-400">{task.agentName}</span>
                          <span className="text-[10px] text-gray-600 font-mono">|</span>
                          <span className="text-xs font-sans font-bold text-gray-100">{task.taskName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-500 font-mono">{new Date(task.timestamp).toLocaleTimeString()}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${task.status === 'completed' ? 'bg-green-950/60 text-green-400 border border-green-900' : task.status === 'failed' ? 'bg-red-950/60 text-red-400 border border-red-900' : 'bg-blue-950/60 text-blue-400 border border-blue-900 animate-pulse'}`}>
                            {t(`status${task.status.charAt(0).toUpperCase() + task.status.slice(1)}` as any)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-950 p-2.5 rounded border border-gray-900/60 max-h-[80px] overflow-y-auto no-scrollbar">
                        <pre className="text-[10.5px] font-mono leading-relaxed text-gray-400 whitespace-pre-wrap select-all">
                          {task.log}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Incidents section */}
          <div className="bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-800 shadow" id="incidents_section">
            <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
              <span className="text-xs font-sans font-bold tracking-wider text-red-400 uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>{t('activeAlerts')}</span>
              </span>
              {alerts.length > 0 && (
                <button onClick={handleClearAllAlerts} className="text-[10px] text-gray-400 hover:text-red-400 font-semibold transition">
                  {t('clearAll')}
                </button>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs font-mono">
                ✔ Clear ledger. No unresolved containment alerts recorded.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${alert.resolved ? 'bg-gray-950/50 border-gray-800 opacity-60' : alert.severity === 'critical' ? 'bg-red-950/20 border-red-900/40' : 'bg-amber-950/20 border-amber-900/30'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${alert.resolved ? 'bg-gray-700' : alert.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 font-bold font-mono text-[10px]">{alert.source}</span>
                          <span className="text-[9px] text-gray-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-gray-200 mt-0.5">{alert.message}</p>
                      </div>
                    </div>

                    {!alert.resolved && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-2 py-1 bg-gray-850 border border-gray-800 rounded hover:bg-gray-805 hover:text-white transition text-[10px] font-semibold"
                      >
                        {t('resolveBtn')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-VIEW 2: ADVANCED AUTONOMOUS AGENTS REGISTRY */}
      {activeSubTab === 'agents' && (
        <div className="space-y-6 animate-fade-in" id="agents_registered_subview">
          
          {/* Filters controls panel */}
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder={lang === 'de' ? "Agenten durchsuchen..." : "Filter agents by name/category..."}
                value={agentSearch}
                onChange={e => setAgentSearch(e.target.value)}
                className="w-full bg-gray-950 border border-gray-850 focus:border-cyan-400 rounded-lg py-2 pl-9 pr-3 text-xs text-gray-200 outline-none transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 whitespace-nowrap">Status:</span>
                <select
                  value={agentStatusFilter}
                  onChange={e => setAgentStatusFilter(e.target.value as any)}
                  className="bg-gray-950 border border-gray-850 rounded py-1 px-2 text-xs text-gray-300 outline-none focus:border-sky-400"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Operational">Operational</option>
                  <option value="Peak Alert">Peak Alert</option>
                  <option value="Standby">Standby</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 whitespace-nowrap">{lang === 'de' ? 'Kategorie:' : 'Spezialisierung:'}</span>
                <select
                  value={agentRoleFilter}
                  onChange={e => setAgentRoleFilter(e.target.value as any)}
                  className="bg-gray-950 border border-gray-850 rounded py-1 px-2 text-xs text-gray-300 outline-none focus:border-sky-400"
                >
                  <option value="ALL">All Specialities</option>
                  <option value="Router">Orchestration & Route (Router)</option>
                  <option value="SecDecrypter">Security Keys Decoders</option>
                  <option value="AuditWorker">WORM Auditors</option>
                  <option value="MFAVerifier">MFA Token Guard</option>
                  <option value="LLMCopilot">Cognitive Assistant</option>
                </select>
              </div>
            </div>

          </div>

          {/* Grid list of agents */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="agent_cards_matrix">
            {filteredAgents.length === 0 ? (
              <div className="col-span-1 md:col-span-3 py-12 text-center text-gray-500 font-mono text-xs">
                No agents matching active filters.
              </div>
            ) : (
              filteredAgents.map(agent => (
                <div 
                  key={agent.id}
                  className="bg-gray-900 border border-gray-850 rounded-2xl p-4 hover:border-cyan-500/30 transition duration-150 relative overflow-hidden group shadow-lg flex flex-col justify-between"
                >
                  {/* Glowing background hint */}
                  <div className={`absolute -right-16 -top-16 w-32 h-32 rounded-full blur-2xl opacity-10 pointer-events-none transition duration-500 ${agent.status === 'Operational' ? 'bg-green-500' : agent.status === 'Peak Alert' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-850 pb-2 mb-3">
                      <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">{agent.role}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1 ${agent.status === 'Operational' ? 'bg-green-950/60 text-green-400 border border-green-800/30' : agent.status === 'Peak Alert' ? 'bg-red-950/60 text-red-400 border border-red-800/20' : 'bg-amber-950/60 text-amber-400 border border-amber-800/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'Operational' ? 'bg-green-400' : agent.status === 'Peak Alert' ? 'bg-red-400 animate-ping' : 'bg-amber-400'}`} />
                        {agent.status}
                      </span>
                    </div>

                    <h4 className="font-sans font-bold text-sm text-gray-100 group-hover:text-cyan-400 duration-150 tracking-tight">{agent.name}</h4>
                    <p className="text-[11px] text-gray-400 mt-1 font-mono">ID: {agent.id}</p>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-4 bg-gray-950/40 p-2.5 rounded-xl border border-gray-850">
                      <div>
                        <span className="block text-[9px] text-gray-500 font-mono font-bold uppercase">{lang === 'de' ? 'PROZESSOR' : 'CPU LEVEL'}</span>
                        <span className="text-sm font-mono font-bold text-gray-200">{agent.cpu}%</span>
                        
                        <div className="w-full bg-gray-850 rounded-full h-1 mt-1">
                          <div className={`h-1 rounded-full ${agent.cpu > 70 ? 'bg-red-500' : 'bg-cyan-400'}`} style={{ width: `${agent.cpu}%` }} />
                        </div>
                      </div>

                      <div>
                        <span className="block text-[9px] text-gray-500 font-mono font-bold uppercase">{lang === 'de' ? 'SPEICHER' : 'RAM ALLOC'}</span>
                        <span className="text-sm font-mono font-bold text-gray-200">{agent.memory} MB</span>
                        
                        <div className="w-full bg-gray-850 rounded-full h-1 mt-1">
                          <div className="h-1 bg-sky-400 rounded-full animate-duration-1000" style={{ width: `${(agent.memory / 128) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <span className="block text-[9px] text-gray-500 font-mono font-bold uppercase">{lang === 'de' ? 'EXPEDIERUNGEN' : 'JOBS SECURED'}</span>
                        <span className="text-sm font-mono font-bold text-gray-200">{agent.tasksCompleted}</span>
                      </div>

                      <div>
                        <span className="block text-[9px] text-gray-500 font-mono font-bold uppercase">{lang === 'de' ? 'AUSFALLQUOTE' : 'FAIL RATE'}</span>
                        <span className={`text-sm font-mono font-bold ${agent.errorRate > 1 ? 'text-red-400' : 'text-green-400'}`}>{agent.errorRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-gray-850 flex items-center justify-between text-xs text-gray-400">
                    <span>Sicherheitsstufe: Tier-3</span>
                    <button 
                      onClick={() => {
                        setSelectedRole(agent.role);
                        setCustomTaskName(`Spezifische Direktive an: ${agent.name}`);
                        setActiveSubTab('monitor');
                        showSuccessToast(`Agent ${agent.name} ausgewählt.`);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold transition flex items-center gap-0.5"
                    >
                      <span>Auswählen</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* SUB-VIEW 3: INTERACTIVE COLLABORATION MATRIX / INTERACTIONS */}
      {activeSubTab === 'interactions' && (
        <div className="space-y-6 animate-fade-in" id="interactions_topology_subview">
          
          <div className="bg-gray-90s p-4 rounded-xl border border-gray-800 text-xs">
            <h3 className="font-sans font-bold text-gray-100 mb-1">{lang === 'de' ? 'Visualisierung der Agenten-Interaktionen' : 'Agent Collaboration & Handoff Visualizer'}</h3>
            <p className="text-gray-400">
              {lang === 'de' 
                ? 'Analysieren Sie, wie Valtheron-Agenten Nachrichten austauschen und kryptografische Handshakes durchführen, um Daten abzusichern.' 
                : 'Pulsing neon threads represent secure message pathways. Click any workflow simulation underneath to execute a real-time message stream.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual SVG diagram canvas */}
            <div className="lg:col-span-8 bg-gray-950 p-4 rounded-2xl border border-gray-850 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
              
              {/* Background grids */}
              <div className="absolute inset-0 bg-[#060913] bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:32px_32px] opacity-10 pointer-events-none" />

              {/* The SVG element */}
              <svg className="w-full max-w-lg h-80 z-10 relative" viewBox="0 0 500 320" id="interactions_svg_canvas">
                
                {/* Connection lines paths */}
                {/* Router to Decrypter */}
                <path 
                  d="M 250 50 L 120 160" 
                  stroke={interactionPath === 'totp' || interactionPath === 'rekey' ? '#14b8a6' : '#1f2937'} 
                  strokeWidth={interactionPath ? "2.5" : "1"} 
                  strokeDasharray={isAnimatingNetwork ? "5, 5" : undefined}
                  className={`transition duration-500 ${interactionPath === 'totp' || interactionPath === 'rekey' ? 'animate-pulse' : ''}`}
                />
                
                {/* Router to MFAVerifier */}
                <path 
                  d="M 250 50 L 380 160" 
                  stroke={interactionPath === 'totp' || interactionPath === 'rekey' ? '#a855f7' : '#1f2937'} 
                  strokeWidth={interactionPath ? "2.5" : "1"} 
                  strokeDasharray={isAnimatingNetwork ? "5, 5" : undefined}
                  className={`transition duration-500 ${interactionPath === 'totp' || interactionPath === 'rekey' ? 'animate-pulse' : ''}`}
                />

                {/* Router to AuditWorker */}
                <path 
                  d="M 250 50 L 180 260" 
                  stroke={interactionPath === 'audit' ? '#ef4444' : '#1f2937'} 
                  strokeWidth={interactionPath === 'audit' ? "2.5" : "1"} 
                  strokeDasharray={isAnimatingNetwork ? "5, 5" : undefined}
                  className={`transition duration-500 ${interactionPath === 'audit' ? 'animate-pulse' : ''}`}
                />

                {/* AuditWorker to LLMCopilot */}
                <path 
                  d="M 180 260 L 320 260" 
                  stroke={interactionPath === 'audit' ? '#10b981' : '#1f2937'} 
                  strokeWidth={interactionPath === 'audit' ? "2.5" : "1"} 
                  strokeDasharray={isAnimatingNetwork ? "5, 5" : undefined}
                />

                {/* LLMCopilot to Router */}
                <path 
                  d="M 320 260 L 250 50" 
                  stroke={interactionPath === 'audit' ? '#14b8a6' : '#1f2937'} 
                  strokeWidth={interactionPath === 'audit' ? "2.5" : "1"} 
                  strokeDasharray={isAnimatingNetwork ? "5, 5" : undefined}
                />

                {/* Decrypter to MFAVerifier */}
                <path 
                  d="M 120 160 L 380 160" 
                  stroke={interactionPath === 'totp' ? '#3b82f6' : '#1f2937'} 
                  strokeWidth={interactionPath === 'totp' ? "2.5" : "1"} 
                  strokeDasharray={isAnimatingNetwork ? "5, 5" : undefined}
                />

                {/* Decrypter to AuditWorker */}
                <path 
                  d="M 120 160 L 180 260" 
                  stroke={interactionPath === 'rekey' ? '#10b981' : '#1f2937'} 
                  strokeWidth={interactionPath === 'rekey' ? "2.5" : "1"} 
                  strokeDasharray={isAnimatingNetwork ? "5, 5" : undefined}
                />

                {/* AuditWorker to MFAVerifier */}
                <path 
                  d="M 180 260 L 380 160" 
                  stroke={interactionPath === 'rekey' ? '#ec4899' : '#1f2937'} 
                  strokeWidth={interactionPath === 'rekey' ? "2.5" : "1"} 
                  strokeDasharray={isAnimatingNetwork ? "5, 5" : undefined}
                />

                {/* SVG Active dot flow tracking animation */}
                {isAnimatingNetwork && (
                  <circle r="4" fill="#22d3ee" className="shadow-lg">
                    <animateMotion 
                      dur="3s" 
                      repeatCount="indefinite" 
                      path={
                        interactionPath === 'audit' ? "M 250 50 L 180 260 L 320 260 L 250 50" :
                        interactionPath === 'totp' ? "M 250 50 L 380 160 L 120 160 L 250 50" :
                        "M 250 50 L 120 160 L 180 260 L 380 160 L 250 50"
                      }
                    />
                  </circle>
                )}

                {/* Nodes with Circles */}
                {/* 1. Router at top */}
                <g transform="translate(250, 50)" className="cursor-pointer">
                  <circle r="22" fill="#090d16" stroke="#22d3ee" strokeWidth="2" className="shadow-md" />
                  <text y="4" textAnchor="middle" fill="#fff" fontSize="10" className="select-none font-mono">ROUT</text>
                  <circle r="6" cx="16" cy="-16" fill="#10b981" />
                </g>

                {/* 2. Decrypter at left */}
                <g transform="translate(120, 160)">
                  <circle r="22" fill="#090d16" stroke="#3b82f6" strokeWidth="2" />
                  <text y="4" textAnchor="middle" fill="#fff" fontSize="10" className="select-none font-mono">SECD</text>
                  <circle r="6" cx="16" cy="-16" fill="#10b981" />
                </g>

                {/* 3. MFA at right */}
                <g transform="translate(380, 160)">
                  <circle r="22" fill="#090d16" stroke="#a855f7" strokeWidth="2" />
                  <text y="4" textAnchor="middle" fill="#fff" fontSize="10" className="select-none font-mono">MFAV</text>
                  <circle r="6" cx="16" cy="-16" fill="#10b981" />
                </g>

                {/* 4. AuditWorker below left */}
                <g transform="translate(180, 260)">
                  <circle r="22" fill="#090d16" stroke="#10b981" strokeWidth="2" />
                  <text y="4" textAnchor="middle" fill="#fff" fontSize="10" className="select-none font-mono">AUDT</text>
                  <circle r="6" cx="16" cy="-16" fill="#10b981" />
                </g>

                {/* 5. Copilot below right */}
                <g transform="translate(320, 260)">
                  <circle r="22" fill="#090d16" stroke="#fbbf24" strokeWidth="2" />
                  <text y="4" textAnchor="middle" fill="#fff" fontSize="10" className="select-none font-mono">LLMC</text>
                  <circle r="6" cx="16" cy="-16" fill="#10b981" />
                </g>

              </svg>

              {/* Status Indicators overlay */}
              <div className="absolute bottom-3 left-3 bg-gray-900/80 px-2.5 py-1.5 rounded border border-gray-850 text-[10px] font-mono text-gray-400 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Router Node Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <span>Cluster Handshakes Encrypted</span>
                </div>
              </div>

            </div>

            {/* Simulated execution console */}
            <div className="lg:col-span-4 bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-800 shadow flex flex-col justify-between">
              
              <div className="space-y-4">
                <span className="text-xs font-sans font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                  <Layers3 className="w-4 h-4 text-amber-500 inline" />
                  <span>Pipeline Emulator</span>
                </span>
                
                <p className="text-[11px] text-gray-400 leading-normal">
                  {lang === 'de' 
                    ? 'Starten Sie interaktive Workflow-Szenarien, um den Datenfluss über die Kryptokette mathematisch zu validieren.' 
                    : 'Execute specific workflow recipes directly to verify cryptographic packet alignment across the sandbox network.'}
                </p>

                <div className="space-y-2">
                  <button
                    disabled={isAnimatingNetwork}
                    onClick={() => handleTriggerNetworkSimulation('audit')}
                    className="w-full bg-gray-950 border border-gray-850 hover:border-cyan-400 p-2.5 rounded-lg text-left text-xs font-semibold hover:text-white transition flex items-center justify-between"
                  >
                    <span>1. Standard Blockchain Audit</span>
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                  </button>

                  <button
                    disabled={isAnimatingNetwork}
                    onClick={() => handleTriggerNetworkSimulation('totp')}
                    className="w-full bg-gray-950 border border-gray-850 hover:border-purple-400 p-2.5 rounded-lg text-left text-xs font-semibold hover:text-white transition flex items-center justify-between"
                  >
                    <span>2. MFA TOTP Verification challenge</span>
                    <Play className="w-3.5 h-3.5 text-purple-400" />
                  </button>

                  <button
                    disabled={isAnimatingNetwork}
                    onClick={() => handleTriggerNetworkSimulation('rekey')}
                    className="w-full bg-gray-950 border border-gray-850 hover:border-emerald-400 p-2.5 rounded-lg text-left text-xs font-semibold hover:text-white transition flex items-center justify-between"
                  >
                    <span>3. Master Key re-keying rotation</span>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              </div>

              {/* Console log outputs */}
              <div className="border-t border-gray-850 pt-4 mt-4">
                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Trace-Output</span>
                <div className="bg-gray-950 p-2 rounded-lg mt-2 min-h-[110px] max-h-[140px] overflow-y-auto no-scrollbar border border-black text-[10px] font-mono whitespace-pre-wrap leading-relaxed text-cyan-400/90 list-none">
                  {interactionLogs.map((log, i) => (
                    <li key={i} className="list-inside">{log}</li>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* SUB-VIEW 4: COMPREHENSIVE PLUGIN RUNTIME MANAGER */}
      {activeSubTab === 'plugins' && (
        <div className="space-y-6 animate-fade-in" id="plugins_runtime_subview">
          
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-sans font-bold text-gray-100 flex items-center gap-1.5 text-sm sm:text-base">
                <Plug className="w-5 h-5 text-green-400" />
                <span>Extensibility Plugin Engine</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'de' 
                  ? 'Erweitern Sie den Workspace durch dynamische Plugin-APIs. Realisieren Sie Live-Datenzugriffe auf Fremdsysteme.' 
                  : 'Define plugins to extend Workspace capabilities. Enable real weather telemetry or live CoinGecko coin tickers.'}
              </p>
            </div>

            <button
              onClick={() => setShowAddPluginModal(true)}
              className="px-3.5 py-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-bold rounded-lg shadow transition flex items-center gap-1 animate-shimmer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'de' ? 'Plugin installieren' : 'Install Extension Plugin'}</span>
            </button>
          </div>

          {/* Installed Plugin List cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plugins.map((plugin) => (
              <div 
                key={plugin.id}
                className={`bg-gray-900 rounded-2xl border p-5 flex flex-col justify-between transition-all ${plugin.enabled ? 'border-gray-800' : 'border-gray-850 opacity-65'}`}
              >
                
                <div>
                  {/* Status header */}
                  <div className="flex items-center justify-between border-b border-gray-850 pb-2.5 mb-3">
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-widest font-mono bg-gray-950 text-cyan-400 border border-gray-800">
                      {plugin.pluginType}
                    </span>
                    
                    {/* Status Power switch icon */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] text-gray-400 font-medium">
                        {plugin.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button 
                        onClick={() => handleTogglePlugin(plugin.id, plugin.name)}
                        className={`w-9 h-5 rounded-full flex items-center p-0.5 transition duration-200 ${plugin.enabled ? 'bg-green-500 justify-end' : 'bg-gray-800 justify-start'}`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-inner" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <h4 className="text-sm font-sans font-bold text-white tracking-tight">{plugin.name}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">v{plugin.version}</span>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-sans">{plugin.description}</p>
                  
                  <div className="mt-2 text-[10px] font-mono text-gray-500">
                    Extension Author: <span className="text-gray-300 font-semibold">{plugin.author}</span>
                  </div>

                  {plugin.apiEndpoint && (
                    <div className="mt-2 text-[10px] font-mono bg-gray-950/50 p-1.5 rounded border border-gray-850 text-cyan-400/90 truncate">
                      External Call: <span className="text-gray-400 select-all">{plugin.apiEndpoint}</span>
                    </div>
                  )}
                </div>

                {/* Operations area */}
                <div className="mt-5 border-t border-gray-850 pt-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500">Status der Laufzeit: {plugin.enabled ? 'Bereit' : 'Inaktiv'}</span>
                    <button
                      disabled={isRunningPlugin[plugin.id]}
                      onClick={() => handleExecutePlugin(plugin)}
                      className={`px-3 py-1 bg-gray-850 hover:bg-gray-700/80 border border-gray-750 text-xs text-white font-medium rounded-lg transition-all flex items-center gap-1.5 ${isRunningPlugin[plugin.id] ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      <Play className={`w-3 h-3 text-green-400 ${isRunningPlugin[plugin.id] ? 'animate-spin' : ''}`} />
                      <span>{isRunningPlugin[plugin.id] ? 'Executing API...' : 'Run / Test Extension'}</span>
                    </button>
                  </div>

                  {/* Terminal log window for running plugin API */}
                  {pluginLogs[plugin.id] && (
                    <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-900 max-h-[150px] overflow-y-auto no-scrollbar text-[10.5px] font-mono leading-relaxed text-gray-400 whitespace-pre-wrap select-all">
                      {pluginLogs[plugin.id]}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Install custom plugin popup modal */}
          {showAddPluginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" id="install_plugin_modal">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl">
                
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <h3 className="text-sm font-sans font-bold text-white flex items-center gap-1.5">
                    <Plug className="w-4.5 h-4.5 text-green-400" />
                    <span>Install Custom Extension Plugin</span>
                  </h3>
                  <button 
                    onClick={() => setShowAddPluginModal(false)}
                    className="text-gray-500 hover:text-gray-200 font-bold font-mono text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreatePlugin} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Plugin Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Binance Market Auditor"
                      value={customPlugName}
                      onChange={e => setCustomPlugName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 px-3 py-2 rounded text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Version *</label>
                      <input
                        type="text"
                        required
                        placeholder="1.0.0"
                        value={customPlugVersion}
                        onChange={e => setCustomPlugVersion(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-850 px-3 py-2 rounded text-white focus:outline-none focus:border-cyan-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Type *</label>
                      <select
                        value={customPlugType}
                        onChange={e => setCustomPlugType(e.target.value as any)}
                        className="w-full bg-gray-950 border border-gray-850 px-2 py-2 rounded text-white focus:outline-none focus:border-cyan-500 font-sans"
                      >
                        <option value="utility">Utility Code</option>
                        <option value="telemetry">System Telemetry</option>
                        <option value="security">Security Shield</option>
                        <option value="intelligence">External Intelligence</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Author *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FinSec Auditor"
                      value={customPlugAuthor}
                      onChange={e => setCustomPlugAuthor(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 px-3 py-2 rounded text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Brief Description *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fetches market prices from Coingecko to assess portfolio values."
                      value={customPlugDesc}
                      onChange={e => setCustomPlugDesc(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 px-3 py-2 rounded text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider text-[9px]">External API Endpoint (Optional)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://api.coingecko.com/api/v3/simple/price..."
                      value={customPlugEndpoint}
                      onChange={e => setCustomPlugEndpoint(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 px-3 py-2 rounded text-white focus:outline-none focus:border-cyan-500 font-mono text-[10.5px]"
                    />
                  </div>

                  <p className="text-[10px] text-gray-500 italic mt-1">
                    * Installing a plugin registers it inside the permanent Write-Once-Read-Many (WORM) audit ledger logs.
                  </p>

                  <div className="pt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPluginModal(false)}
                      className="w-1/2 py-2 border border-gray-800 rounded-lg hover:bg-gray-850 text-white font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-green-500 text-black rounded-lg font-bold hover:bg-green-400 transition"
                    >
                      Install Plugin
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
