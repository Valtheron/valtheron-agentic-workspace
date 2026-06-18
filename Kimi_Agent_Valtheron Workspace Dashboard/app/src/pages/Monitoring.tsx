import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Download,
  FileText,
  HardDrive,
  Layers,
  Lock,
  MessageSquare,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  TrendingDown,
  TrendingUp,
  VolumeX,
  Zap,
  Bell,
  Archive,
  HeartPulse,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

import type {
  SystemModule,
  ServiceHealth,
  LLMProviderHealth,
  SecurityEvent,
  WorkflowInstance,
  AuditLogEntry,
  Notification,
} from '@/lib/mockData';

import {
  systemHealthData,
  metricsData,
  securityEvents,
  agentsData,
  workflowInstances,
  auditLogData,
  notificationsData,
} from '@/lib/mockData';

/* ================================================================== */
/*  COLOUR SYSTEM                                                     */
/* ================================================================== */

const C = {
  bgPage: '#070A0E',
  bgCard: '#0C1117',
  bgCardHover: '#121821',
  bgElevated: '#141E2B',
  accent: '#3DDC97',
  secondary: '#5B8DEF',
  warning: '#F5A623',
  danger: '#EF4444',
  purple: '#A78BFA',
  cyan: '#00D4AA',
  textPrimary: '#F0F2F5',
  textSecondary: '#8B95A5',
  textMuted: '#4A5568',
  border: 'rgba(255,255,255,0.06)',
  grid: 'rgba(255,255,255,0.04)',
  axis: 'rgba(255,255,255,0.12)',
} as const;

/* ================================================================== */
/*  STATUS HELPERS                                                    */
/* ================================================================== */

function statusColor(status: string): string {
  if (status === 'operational' || status === 'healthy' || status === 'Healthy' || status === 'success') return C.accent;
  if (status === 'degraded' || status === 'warning' || status === 'Warning') return C.warning;
  return C.danger;
}

function severityColor(severity: string): string {
  if (severity === 'critical') return C.danger;
  if (severity === 'high' || severity === 'warning') return C.warning;
  if (severity === 'medium') return C.secondary;
  if (severity === 'low' || severity === 'info') return C.textSecondary;
  if (severity === 'success') return C.accent;
  return C.textMuted;
}

function statusLabel(status: string): string {
  if (status === 'operational') return 'Operational';
  if (status === 'degraded') return 'Degraded';
  if (status === 'down') return 'Down';
  if (status === 'healthy' || status === 'Healthy') return 'Healthy';
  if (status === 'warning' || status === 'Warning') return 'Warning';
  if (status === 'critical') return 'Critical';
  if (status === 'success') return 'Success';
  if (status === 'info') return 'Info';
  return status;
}

/* ================================================================== */
/*  ANIMATION VARIANTS                                                */
/* ================================================================== */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { scale: 0.96, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

/* ================================================================== */
/*  SYNTHETIC TIME-SERIES DATA for Agent Activity Chart               */
/* ================================================================== */

const AGENT_CHART_DATA = Array.from({ length: 24 }, (_, i) => {
  const hour = `${String(i).padStart(2, '0')}:00`;
  return {
    time: hour,
    contentAgents: Math.round(40 + Math.sin(i * 0.5) * 15 + Math.random() * 10),
    dataAgents: Math.round(30 + Math.cos(i * 0.4) * 12 + Math.random() * 8),
    codeAgents: Math.round(25 + Math.sin(i * 0.3 + 1) * 10 + Math.random() * 6),
    responseTime: Math.round(120 + Math.sin(i * 0.6) * 40 + Math.random() * 20),
    throughput: Math.round(800 + Math.cos(i * 0.35) * 200 + Math.random() * 100),
  };
});

/* ================================================================== */
/*  ERROR DISTRIBUTION DATA                                           */
/* ================================================================== */

const ERROR_DIST_DATA = [
  { name: 'API Errors', value: 3, color: C.danger },
  { name: 'Auth Failures', value: 2, color: C.warning },
  { name: 'LLM Timeouts', value: 4, color: C.secondary },
  { name: 'DB Errors', value: 1, color: C.purple },
  { name: 'WS Disconnections', value: 2, color: C.cyan },
];

/* ================================================================== */
/*  SERVICE OPS MEMORY (derived defaults)                             */
/* ================================================================== */

const SERVICE_META: Record<string, { ops: string; memory: number; memoryMax: number }> = {
  encryptionService: { ops: '1,284 ops/s', memory: 64, memoryMax: 256 },
  websocketService: { ops: '347 ops/s', memory: 128, memoryMax: 512 },
  killSwitchMonitor: { ops: '48 ops/s', memory: 32, memoryMax: 128 },
  cacheService: { ops: '512 ops/s', memory: 192, memoryMax: 512 },
};

/* ================================================================== */
/*  RECHARTS TOOLTIP                                                  */
/* ================================================================== */

interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: C.bgElevated,
        border: `1px solid ${C.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <p className="mb-2 font-mono text-xs" style={{ color: C.textMuted }}>{label}</p>
      {payload.map((entry: TooltipPayloadEntry, i: number) => (
        <div key={i} className="mb-1 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-mono text-xs" style={{ color: C.textSecondary }}>
            {entry.name}: {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  MINI SPARKLINE                                                    */
/* ================================================================== */

function MiniSparkline({ data, color, width = 80, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  const chartData = useMemo(() => data.map((v, i) => ({ i: String(i), v })), [data]);
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`${color}15`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ================================================================== */
/*  STATUS BADGE COMPONENT                                            */
/* ================================================================== */

function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status);
  const label = statusLabel(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium capitalize"
      style={{
        fontSize: '0.6875rem',
        backgroundColor: `${color}18`,
        color,
      }}
    >
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }}>
        {status === 'operational' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: color }} />
        )}
      </span>
      {label}
    </span>
  );
}

/* ================================================================== */
/*  SEVERITY BADGE COMPONENT                                          */
/* ================================================================== */

function SeverityBadge({ severity }: { severity: string }) {
  const color = severityColor(severity);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium capitalize"
      style={{
        fontSize: '0.6875rem',
        backgroundColor: `${color}18`,
        color,
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {severity}
    </span>
  );
}

/* ================================================================== */
/*  AUDIT LOG DOT COLOR                                               */
/* ================================================================== */

function auditActionColor(action: string): string {
  if (action.includes('kill_switch') || action.includes('security')) return C.danger;
  if (action.includes('permission') || action.includes('config')) return C.warning;
  if (action.includes('create') || action.includes('execute')) return C.accent;
  if (action.includes('update') || action.includes('rotate')) return C.secondary;
  return C.textSecondary;
}

/* ================================================================== */
/*  MAIN COMPONENT                                                    */
/* ================================================================== */

export default function Monitoring() {
  /* --- State --- */
  const [timeRange, setTimeRange] = useState('15min');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [agentTab, setAgentTab] = useState<'requests' | 'responseTime' | 'throughput'>('requests');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [notifs, setNotifs] = useState<Notification[]>(notificationsData);
  const [killSwitchArmed, setKillSwitchArmed] = useState(true);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* --- Derived --- */
  const unreadNotifs = notifs.filter((n) => !n.read);

  const activeAgentsCount = useMemo(() => agentsData.filter((a) => a.status === 'active').length, []);
  const totalAgentsCount = agentsData.length;

  const timeRanges = [
    { key: '5min', label: 'Last 5min' },
    { key: '15min', label: 'Last 15min' },
    { key: '1h', label: 'Last 1h' },
    { key: '6h', label: 'Last 6h' },
    { key: '24h', label: 'Last 24h' },
  ];

  const filteredSecurityEvents = useMemo(() => {
    if (severityFilter === 'all') return securityEvents;
    return securityEvents.filter((e) => e.severity === severityFilter);
  }, [severityFilter]);

  /* --- KPI Data (6 cards) --- */
  const kpiCards = useMemo(() => [
    {
      id: 'active-agents',
      label: 'Active Agents',
      value: activeAgentsCount,
      total: totalAgentsCount,
      suffix: '',
      icon: <Zap size={18} />,
      iconColor: C.accent,
      borderColor: C.accent,
      trend: '+12 today',
      trendDirection: 'up' as const,
      trendGood: true,
      sparkline: [140, 145, 148, 152, 150, 155, 158, 160, 162, activeAgentsCount],
    },
    {
      id: 'tasks-completed',
      label: 'Tasks Completed',
      value: metricsData.tasksCompleted,
      suffix: '',
      icon: <CheckCircle2 size={18} />,
      iconColor: C.secondary,
      borderColor: C.secondary,
      trend: '+8.3%',
      trendDirection: 'up' as const,
      trendGood: true,
      sparkline: [1520, 1580, 1620, 1590, 1680, 1720, 1700, 1780, 1810, metricsData.tasksCompleted],
    },
    {
      id: 'response-time',
      label: 'Avg Response Time',
      value: metricsData.avgResponseTime,
      suffix: 'ms',
      icon: <Clock size={18} />,
      iconColor: C.warning,
      borderColor: C.warning,
      trend: '-12ms',
      trendDirection: 'down' as const,
      trendGood: true,
      sparkline: [180, 172, 168, 175, 162, 158, 160, 155, 148, metricsData.avgResponseTime],
    },
    {
      id: 'system-uptime',
      label: 'System Uptime',
      value: 98.7,
      suffix: '%',
      icon: <ShieldCheck size={18} />,
      iconColor: C.accent,
      borderColor: C.accent,
      trend: '2 incidents',
      trendDirection: 'neutral' as const,
      trendGood: false,
      sparkline: [99.2, 99.1, 99.3, 99.0, 98.9, 98.7, 98.8, 98.7, 98.7, 98.7],
    },
    {
      id: 'active-websockets',
      label: 'Active WebSockets',
      value: metricsData.wsConnections,
      suffix: '',
      icon: <Activity size={18} />,
      iconColor: C.secondary,
      borderColor: C.secondary,
      trend: '+5.2%',
      trendDirection: 'up' as const,
      trendGood: true,
      sparkline: [280, 290, 295, 300, 310, 305, 320, 330, 340, metricsData.wsConnections],
    },
    {
      id: 'db-query-rate',
      label: 'DB Query Rate',
      value: metricsData.dbQueryRate,
      suffix: '/s',
      icon: <Database size={18} />,
      iconColor: C.purple,
      borderColor: C.purple,
      trend: '+3.1%',
      trendDirection: 'up' as const,
      trendGood: true,
      sparkline: [1800, 1900, 1950, 2000, 2100, 2050, 2150, 2200, 2280, metricsData.dbQueryRate],
    },
  ], [activeAgentsCount, totalAgentsCount]);

  /* --- Handlers --- */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  const acknowledgeNotif = useCallback((id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const muteNotif = useCallback((id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const escalateNotif = useCallback((id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, priority: 'critical' as const, type: 'security' as const } : n))
    );
  }, []);

  /* --- Auto refresh --- */
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, handleRefresh]);

  /* --- Click outside dropdown --- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTimeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* --- Module icon helper --- */
  function moduleIcon(name: string) {
    switch (name) {
      case 'auth': return <Shield size={14} />;
      case 'agents': return <Zap size={14} />;
      case 'tasks': return <CheckCircle2 size={14} />;
      case 'workflows': return <Layers size={14} />;
      case 'chat': return <MessageSquare size={14} />;
      case 'collab': return <Activity size={14} />;
      case 'security': return <ShieldAlert size={14} />;
      case 'analytics': return <Activity size={14} />;
      case 'files': return <FileText size={14} />;
      case 'tree': return <HardDrive size={14} />;
      case 'notifications': return <Bell size={14} />;
      case 'secrets': return <Lock size={14} />;
      case 'backup': return <Archive size={14} />;
      case 'health': return <HeartPulse size={14} />;
      default: return <Activity size={14} />;
    }
  }

  /* ============================ RENDER ============================ */

  return (
    <div className="min-h-screen space-y-6 p-6" style={{ backgroundColor: C.bgPage, fontFamily: 'var(--font-primary), sans-serif' }}>

      {/* ════════════════════════════════════════════════════════════════
          1. PAGE HEADER
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: C.textPrimary, letterSpacing: '-0.02em' }}>
            System Monitoring
          </h1>
          <p className="mt-1 text-sm" style={{ color: C.textSecondary }}>
            Real-time architecture health across 14 modules, 4 services, and 4 LLM providers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="gap-2 border-white/10 bg-transparent text-xs text-[#8B95A5] hover:bg-white/5 hover:text-[#F0F2F5]"
            >
              <Clock size={14} />
              {timeRanges.find((t) => t.key === timeRange)?.label}
              <ChevronDown size={12} />
            </Button>
            <AnimatePresence>
              {showTimeDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-50 mt-2 overflow-hidden rounded-lg"
                  style={{ backgroundColor: C.bgElevated, border: `1px solid ${C.border}`, boxShadow: '0 16px 48px rgba(0,0,0,0.4)', minWidth: 140 }}
                >
                  {timeRanges.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => { setTimeRange(t.key); setShowTimeDropdown(false); }}
                      className="block w-full px-4 py-2 text-left text-sm transition-colors"
                      style={{
                        color: timeRange === t.key ? C.accent : C.textSecondary,
                        backgroundColor: timeRange === t.key ? `${C.accent}18` : 'transparent',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Auto-refresh */}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5">
            <div className="relative flex h-2 w-2">
              {autoRefresh && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: C.accent }} />}
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: autoRefresh ? C.accent : C.textMuted }} />
            </div>
            <span className="text-xs" style={{ color: C.textSecondary }}>Auto</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} className="h-4 w-7 data-[state=checked]:bg-[#3DDC97]" />
          </div>

          {/* Refresh */}
          <motion.button
            onClick={handleRefresh}
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.8, ease: 'linear' }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#8B95A5] transition-colors hover:bg-white/5 hover:text-[#F0F2F5]"
          >
            <RefreshCw size={16} />
          </motion.button>

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/10 bg-transparent text-xs text-[#8B95A5] hover:bg-white/5 hover:text-[#F0F2F5]"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          2. SYSTEM OVERVIEW KPIs (6 cards)
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
      >
        {kpiCards.map((kpi) => (
          <motion.div
            key={kpi.id}
            variants={cardVariants}
            className="rounded-xl p-5 transition-shadow hover:shadow-lg"
            style={{
              backgroundColor: C.bgCard,
              border: `1px solid ${C.border}`,
              borderTop: `3px solid ${kpi.borderColor}`,
              borderRadius: 12,
            }}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: C.textSecondary }}>
                  {kpi.label}
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-semibold" style={{ color: C.textPrimary }}>
                    <CountUp
                      end={kpi.value}
                      decimals={kpi.id === 'system-uptime' ? 1 : 0}
                      duration={1.5}
                      suffix={kpi.suffix || ''}
                    />
                  </span>
                  {kpi.total !== undefined && (
                    <span className="font-mono text-sm" style={{ color: C.textMuted }}>
                      /{kpi.total}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ color: kpi.iconColor }}>{kpi.icon}</span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 font-mono text-xs"
                style={{ color: kpi.trendGood ? C.accent : C.danger }}
              >
                {kpi.trendDirection === 'up' ? <TrendingUp size={12} /> : kpi.trendDirection === 'down' ? <TrendingDown size={12} /> : <span className="h-3 w-3" />}
                {kpi.trend}
              </span>
              <MiniSparkline data={kpi.sparkline} color={kpi.iconColor} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          3. BACKEND MODULE HEALTH (14 cards)
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="border-white/[0.06] p-5" style={{ backgroundColor: C.bgCard, borderRadius: 12 }}>
            <h3 className="mb-4 text-lg font-medium" style={{ color: C.textPrimary }}>
              Backend Module Health
              <span className="ml-2 text-xs font-normal" style={{ color: C.textMuted }}>14 modules</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {systemHealthData.modules.map((mod: SystemModule) => (
                <div
                  key={mod.name}
                  className="rounded-lg p-3 transition-colors"
                  style={{ backgroundColor: C.bgCardHover, border: `1px solid ${C.border}` }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span style={{ color: C.textSecondary }}>{moduleIcon(mod.name)}</span>
                    <StatusBadge status={mod.status} />
                  </div>
                  <p className="mb-1 text-sm font-medium capitalize" style={{ color: C.textPrimary }}>
                    {mod.name}
                  </p>
                  <div className="space-y-0.5">
                    <p className="font-mono text-xs" style={{ color: C.textSecondary }}>{mod.responseTime}ms</p>
                    <p className="font-mono text-xs" style={{ color: C.textMuted }}>{mod.uptime}% uptime</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          4. SERVICES HEALTH (4 cards)
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="border-white/[0.06] p-5" style={{ backgroundColor: C.bgCard, borderRadius: 12 }}>
            <h3 className="mb-4 text-lg font-medium" style={{ color: C.textPrimary }}>
              Services Health
              <span className="ml-2 text-xs font-normal" style={{ color: C.textMuted }}>4 core services</span>
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {systemHealthData.services.map((svc: ServiceHealth) => {
                const meta = SERVICE_META[svc.name] || { ops: '0 ops/s', memory: 64, memoryMax: 256 };
                const memPct = Math.round((meta.memory / meta.memoryMax) * 100);
                return (
                  <div
                    key={svc.name}
                    className="rounded-lg p-4"
                    style={{ backgroundColor: C.bgCardHover, border: `1px solid ${C.border}` }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: C.textPrimary }}>
                        {svc.name}
                      </span>
                      <StatusBadge status={svc.status} />
                    </div>
                    <div className="mb-2 font-mono text-xs" style={{ color: C.textSecondary }}>
                      {meta.ops}
                    </div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs" style={{ color: C.textMuted }}>Memory</span>
                      <span className="font-mono text-xs" style={{ color: C.textSecondary }}>{meta.memory}MB / {meta.memoryMax}MB</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${memPct}%` }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: memPct > 80 ? C.danger : memPct > 60 ? C.warning : C.accent }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          5. LLM PROVIDER PERFORMANCE (4 cards)
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="border-white/[0.06] p-5" style={{ backgroundColor: C.bgCard, borderRadius: 12 }}>
            <h3 className="mb-4 text-lg font-medium" style={{ color: C.textPrimary }}>
              LLM Provider Performance
              <span className="ml-2 text-xs font-normal" style={{ color: C.textMuted }}>4 providers</span>
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {systemHealthData.llmProviders.map((p: LLMProviderHealth) => (
                <div
                  key={p.name}
                  className="rounded-lg p-4"
                  style={{ backgroundColor: C.bgCardHover, border: `1px solid ${C.border}` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: C.textPrimary }}>{p.name}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: C.textMuted }}>Req/min</span>
                      <span className="font-mono text-xs" style={{ color: C.textSecondary }}>{p.requestsPerMin.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: C.textMuted }}>Avg Latency</span>
                      <span className="font-mono text-xs" style={{ color: p.avgLatency > 1000 ? C.warning : C.accent }}>{p.avgLatency}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: C.textMuted }}>Error Rate</span>
                      <span className="font-mono text-xs" style={{ color: p.errorRate > 1 ? C.danger : p.errorRate > 0.5 ? C.warning : C.accent }}>{p.errorRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: C.textMuted }}>Connections</span>
                      <span className="font-mono text-xs" style={{ color: C.textSecondary }}>{p.activeConnections}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          6. DATABASE PERFORMANCE
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="border-white/[0.06] p-5" style={{ backgroundColor: C.bgCard, borderRadius: 12 }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium" style={{ color: C.textPrimary }}>
                Database Performance
              </h3>
              <div className="flex items-center gap-2">
                <Database size={16} style={{ color: C.accent }} />
                <span className="font-mono text-xs" style={{ color: C.accent }}>{systemHealthData.database.type} {systemHealthData.database.version}</span>
                <Badge variant="outline" className="border-white/10 text-[#8B95A5]" style={{ fontSize: '0.65rem' }}>
                  WAL mode
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Left — progress bars */}
              <div className="space-y-4">
                {/* Tables */}
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-xs" style={{ color: C.textSecondary }}>Tables</span>
                    <span className="font-mono text-xs" style={{ color: C.accent }}>
                      {systemHealthData.database.tables} / 17
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(systemHealthData.database.tables / 17) * 100}%` }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: C.accent }}
                    />
                  </div>
                </div>
                {/* Indexes */}
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-xs" style={{ color: C.textSecondary }}>Indexes</span>
                    <span className="font-mono text-xs" style={{ color: C.secondary }}>{systemHealthData.database.indexes}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: C.secondary }}
                    />
                  </div>
                </div>
                {/* Cache Hit Rate */}
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-xs" style={{ color: C.textSecondary }}>Cache Hit Rate</span>
                    <span className="font-mono text-xs" style={{ color: C.accent }}>{systemHealthData.database.cacheHitRate}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${systemHealthData.database.cacheHitRate}%` }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: C.accent }}
                    />
                  </div>
                </div>
                {/* Connections */}
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-xs" style={{ color: C.textSecondary }}>Connections</span>
                    <span className="font-mono text-xs" style={{ color: systemHealthData.database.connections > 40 ? C.warning : C.accent }}>
                      {systemHealthData.database.connections}/50
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(systemHealthData.database.connections / 50) * 100}%` }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: systemHealthData.database.connections > 40 ? C.warning : C.accent }}
                    />
                  </div>
                </div>
              </div>
              {/* Right — stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: C.bgCardHover, border: `1px solid ${C.border}` }}>
                  <p className="text-xs" style={{ color: C.textMuted }}>Transactions/sec</p>
                  <p className="mt-1 font-mono text-xl font-semibold" style={{ color: C.accent }}>
                    <CountUp end={systemHealthData.database.transactionsPerSec} duration={1.5} separator="," />
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: C.bgCardHover, border: `1px solid ${C.border}` }}>
                  <p className="text-xs" style={{ color: C.textMuted }}>Tables</p>
                  <p className="mt-1 font-mono text-xl font-semibold" style={{ color: C.textPrimary }}>
                    {systemHealthData.database.tables}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: C.bgCardHover, border: `1px solid ${C.border}` }}>
                  <p className="text-xs" style={{ color: C.textMuted }}>Active Connections</p>
                  <p className="mt-1 font-mono text-xl font-semibold" style={{ color: C.secondary }}>
                    {systemHealthData.database.connections}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: C.bgCardHover, border: `1px solid ${C.border}` }}>
                  <p className="text-xs" style={{ color: C.textMuted }}>Cache Efficiency</p>
                  <p className="mt-1 font-mono text-xl font-semibold" style={{ color: systemHealthData.database.cacheHitRate > 90 ? C.accent : C.warning }}>
                    {systemHealthData.database.cacheHitRate}%
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          7. AGENT ACTIVITY (stacked area) + 8. ERROR DISTRIBUTION
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      >
        {/* Agent Activity */}
        <motion.div variants={cardVariants} className="lg:col-span-8">
          <Card className="border-white/[0.06] p-5" style={{ backgroundColor: C.bgCard, borderRadius: 12 }}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-medium" style={{ color: C.textPrimary }}>Agent Activity</h3>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${C.accent}18`, color: C.accent }}
                >
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.accent }}>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: C.accent }} />
                  </span>
                  Live
                </span>
              </div>
              <Tabs value={agentTab} onValueChange={(v) => setAgentTab(v as 'requests' | 'responseTime' | 'throughput')}>
                <TabsList className="h-8 border border-white/10 bg-white/[0.03]">
                  <TabsTrigger value="requests" className="px-3 py-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-[#F0F2F5] text-[#4A5568]">Requests</TabsTrigger>
                  <TabsTrigger value="responseTime" className="px-3 py-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-[#F0F2F5] text-[#4A5568]">Response Time</TabsTrigger>
                  <TabsTrigger value="throughput" className="px-3 py-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-[#F0F2F5] text-[#4A5568]">Throughput</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={AGENT_CHART_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradContent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.accent} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradData" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.secondary} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={C.secondary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCode" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.purple} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={C.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: C.axis, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: C.axis, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                {agentTab === 'requests' && (
                  <>
                    <Area type="monotone" dataKey="contentAgents" name="Content" stackId="1" stroke={C.accent} strokeWidth={2} fill="url(#gradContent)" />
                    <Area type="monotone" dataKey="dataAgents" name="Data" stackId="1" stroke={C.secondary} strokeWidth={2} fill="url(#gradData)" />
                    <Area type="monotone" dataKey="codeAgents" name="Code" stackId="1" stroke={C.purple} strokeWidth={2} fill="url(#gradCode)" />
                  </>
                )}
                {agentTab === 'responseTime' && (
                  <Area type="monotone" dataKey="responseTime" name="Response Time (ms)" stroke={C.warning} strokeWidth={2} fill={`${C.warning}15`} />
                )}
                {agentTab === 'throughput' && (
                  <Area type="monotone" dataKey="throughput" name="Throughput (req/s)" stroke={C.cyan} strokeWidth={2} fill={`${C.cyan}15`} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Error Distribution */}
        <motion.div variants={cardVariants} className="lg:col-span-4">
          <Card className="border-white/[0.06] p-5" style={{ backgroundColor: C.bgCard, borderRadius: 12 }}>
            <h3 className="mb-4 text-lg font-medium" style={{ color: C.textPrimary }}>Error Distribution</h3>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={ERROR_DIST_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {ERROR_DIST_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="-mt-2 mb-3 text-center">
                <span className="block font-mono text-2xl font-semibold" style={{ color: C.textPrimary }}>
                  {ERROR_DIST_DATA.reduce((s, d) => s + d.value, 0)}
                </span>
                <span className="text-xs" style={{ color: C.textMuted }}>total errors</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {ERROR_DIST_DATA.map((item) => {
                const total = ERROR_DIST_DATA.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="flex-1 text-sm" style={{ color: C.textSecondary }}>{item.name}</span>
                    <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                    <span className="font-mono text-xs" style={{ color: C.textPrimary, minWidth: 20, textAlign: 'right' }}>{item.value}</span>
                    <span className="text-xs" style={{ color: C.textMuted, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          9. WORKFLOW PROGRESS
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="border-white/[0.06] p-5" style={{ backgroundColor: C.bgCard, borderRadius: 12 }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium" style={{ color: C.textPrimary }}>
                Workflow Progress
                <span className="ml-2 text-xs font-normal" style={{ color: C.textMuted }}>{workflowInstances.length} instances</span>
              </h3>
            </div>
            <div className="space-y-4">
              {workflowInstances.slice(0, 8).map((wf: WorkflowInstance, i: number) => {
                const wfName = wf.definitionId;
                const stepLabel = wf.currentStep > 0 ? `Step ${wf.currentStep}` : 'Pending';
                return (
                  <motion.div
                    key={wf.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.25 }}
                    className="rounded-lg p-3 transition-colors hover:bg-[#121821]"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: C.textMuted }}>{wf.id}</span>
                        <span className="text-sm font-medium" style={{ color: C.textPrimary }}>{wfName}</span>
                      </div>
                      <StatusBadge status={wf.status} />
                    </div>
                    <div className="mb-1.5 flex items-center gap-3">
                      <div className="flex-1 overflow-hidden rounded-full" style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${wf.progress}%` }}
                          transition={{ delay: 0.4 + i * 0.1, duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${C.accent} 0%, ${C.secondary} 100%)`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs" style={{ color: C.textPrimary, minWidth: 36, textAlign: 'right' }}>
                        {wf.progress}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: C.textMuted }}>
                        {stepLabel}
                        {wf.output && (
                          <span style={{ color: C.textSecondary }}> — {wf.output.substring(0, 60)}{wf.output.length > 60 ? '...' : ''}</span>
                        )}
                      </span>
                      <span className="font-mono text-xs" style={{ color: C.textMuted }}>
                        {wf.assignedAgents.length} agents
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          10. SECURITY EVENTS TABLE
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="border-white/[0.06]" style={{ backgroundColor: C.bgCard, borderRadius: 12 }}>
            <div className="flex flex-col gap-3 p-5 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-medium" style={{ color: C.textPrimary }}>Security Events</h3>
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className="rounded-full px-3 py-1 text-xs font-medium capitalize transition-all"
                    style={{
                      backgroundColor: severityFilter === sev ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: severityFilter === sev ? C.textPrimary : C.textMuted,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: C.bgCardHover, borderBottom: `1px solid ${C.border}` }}>
                    <TableHead className="text-left text-xs font-medium uppercase tracking-wider" style={{ color: C.textSecondary }}>Severity</TableHead>
                    <TableHead className="text-left text-xs font-medium uppercase tracking-wider" style={{ color: C.textSecondary }}>Type</TableHead>
                    <TableHead className="text-left text-xs font-medium uppercase tracking-wider" style={{ color: C.textSecondary }}>Agent</TableHead>
                    <TableHead className="text-left text-xs font-medium uppercase tracking-wider" style={{ color: C.textSecondary }}>Description</TableHead>
                    <TableHead className="text-left text-xs font-medium uppercase tracking-wider" style={{ color: C.textSecondary }}>Timestamp</TableHead>
                    <TableHead className="text-left text-xs font-medium uppercase tracking-wider" style={{ color: C.textSecondary }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSecurityEvents.map((evt: SecurityEvent) => (
                    <TableRow
                      key={evt.id}
                      className="transition-colors hover:bg-[#121821]"
                      style={{ borderBottom: `1px solid ${C.border}` }}
                    >
                      <TableCell>
                        <SeverityBadge severity={evt.severity} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm" style={{ color: C.textSecondary }}>{evt.type}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs" style={{ color: C.textPrimary }}>{evt.agentName || 'System'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm" style={{ color: C.textPrimary }}>{evt.description}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs" style={{ color: C.textMuted }}>{evt.timestamp}</span>
                      </TableCell>
                      <TableCell>
                        {evt.resolved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: C.accent }}>
                            <CheckCircle2 size={12} /> Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: C.warning }}>
                            <AlertTriangle size={12} /> Open
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredSecurityEvents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <ShieldCheck size={32} style={{ color: C.textMuted }} />
                  <p className="mt-2 text-sm" style={{ color: C.textMuted }}>No events match the selected filter</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          11. ACTIVE ALERTS + 12. AUDIT LOG TIMELINE
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      >
        {/* Active Alerts */}
        <motion.div variants={cardVariants} className="lg:col-span-7">
          <Card className="border-white/[0.06] p-5" style={{ backgroundColor: C.bgCard, borderRadius: 12 }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium" style={{ color: C.textPrimary }}>
                Active Alerts
                {unreadNotifs.length > 0 && (
                  <Badge className="ml-2 text-[0.65rem]" style={{ backgroundColor: C.danger, color: '#fff' }}>
                    {unreadNotifs.length}
                  </Badge>
                )}
              </h3>
            </div>
            <div className="space-y-3">
              {unreadNotifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 size={32} style={{ color: C.accent }} />
                  <p className="mt-2 text-sm" style={{ color: C.textMuted }}>All alerts cleared</p>
                </div>
              ) : (
                unreadNotifs.slice(0, 6).map((notif: Notification) => {
                  const borderColor = notif.priority === 'critical' ? C.danger : notif.priority === 'high' ? C.warning : C.accent;
                  return (
                    <div
                      key={notif.id}
                      className="rounded-lg p-4 transition-colors"
                      style={{
                        backgroundColor: C.bgCardHover,
                        borderLeft: `3px solid ${borderColor}`,
                        borderTop: `1px solid ${C.border}`,
                        borderRight: `1px solid ${C.border}`,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {notif.priority === 'critical' && <AlertTriangle size={16} style={{ color: C.danger }} />}
                          {notif.priority === 'high' && <AlertTriangle size={16} style={{ color: C.warning }} />}
                          {notif.priority === 'medium' && <MessageSquare size={16} style={{ color: C.secondary }} />}
                          {notif.priority === 'low' && <CheckCircle2 size={16} style={{ color: C.accent }} />}
                          <span className="text-sm font-medium" style={{ color: C.textPrimary }}>{notif.title}</span>
                        </div>
                        <span className="text-xs" style={{ color: C.textMuted }}>{notif.timestamp}</span>
                      </div>
                      <p className="mb-3 text-sm" style={{ color: C.textSecondary }}>{notif.message}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeNotif(notif.id)}
                          className="h-7 gap-1 border-[#3DDC97]/30 text-xs text-[#3DDC97] hover:bg-[#3DDC97]/10"
                        >
                          <CheckCircle2 size={12} /> Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => muteNotif(notif.id)}
                          className="h-7 gap-1 border-white/10 text-xs text-[#8B95A5] hover:bg-white/5"
                        >
                          <VolumeX size={12} /> Mute
                        </Button>
                        {(notif.priority === 'high' || notif.priority === 'critical') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => escalateNotif(notif.id)}
                            className="h-7 gap-1 border-[#EF4444]/30 text-xs text-[#EF4444] hover:bg-[#EF4444]/10"
                          >
                            <ShieldAlert size={12} /> Escalate
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* Audit Log Timeline */}
        <motion.div variants={cardVariants} className="lg:col-span-5">
          <Card className="border-white/[0.06] p-5" style={{ backgroundColor: C.bgCard, borderRadius: 12 }}>
            <h3 className="mb-4 text-lg font-medium" style={{ color: C.textPrimary }}>Audit Log Timeline</h3>
            <div className="relative" style={{ paddingLeft: 20 }}>
              {/* Vertical line */}
              <div className="absolute bottom-0 left-0 top-0" style={{ width: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: '3px' }} />
              <div className="space-y-4">
                {auditLogData.slice(0, 10).map((entry: AuditLogEntry, i: number) => {
                  const color = auditActionColor(entry.action);
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.25 }}
                      className="relative flex items-start gap-3"
                    >
                      {/* Timeline dot */}
                      <div
                        className="absolute -left-[17px] top-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}40` }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium" style={{ color: C.textPrimary }}>
                            {entry.username}
                          </span>
                          <span className="text-xs" style={{ color: C.textMuted }}>{entry.timestamp}</span>
                        </div>
                        <p className="mt-0.5 text-sm" style={{ color: C.textSecondary }}>
                          {entry.action}{' '}
                          <span className="font-medium" style={{ color: C.textPrimary }}>{entry.entity}</span>
                        </p>
                        <span
                          className="mt-1 inline-block rounded px-1.5 py-0.5 text-[0.65rem]"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          {entry.entity}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          13. KILL SWITCH STATUS
      ════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card
            className="border-white/[0.06] p-6"
            style={{
              backgroundColor: C.bgCard,
              borderRadius: 12,
              borderLeft: `4px solid ${killSwitchArmed ? C.danger : C.accent}`,
            }}
          >
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: killSwitchArmed ? `${C.danger}15` : `${C.accent}15` }}
                >
                  {killSwitchArmed ? (
                    <ShieldAlert size={24} style={{ color: C.danger }} />
                  ) : (
                    <ShieldCheck size={24} style={{ color: C.accent }} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium" style={{ color: C.textPrimary }}>
                    Kill Switch {killSwitchArmed ? 'Armed' : 'Disarmed'}
                  </h3>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="font-mono text-xs" style={{ color: C.textMuted }}>
                      Last triggered: 45 min ago
                    </span>
                    <span className="text-xs" style={{ color: C.textMuted }}>|</span>
                    <span className="font-mono text-xs" style={{ color: C.textSecondary }}>
                      5 auto-trigger rules active
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: C.textMuted }}>Armed</span>
                  <Switch
                    checked={killSwitchArmed}
                    onCheckedChange={setKillSwitchArmed}
                    className="data-[state=checked]:bg-[#EF4444] data-[state=unchecked]:bg-[#3DDC97]"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setKillSwitchArmed(false)}
                  className="gap-1 border-[#EF4444]/30 text-xs text-[#EF4444] hover:bg-[#EF4444]/10"
                >
                  <ShieldOff size={14} /> Manual Override
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
