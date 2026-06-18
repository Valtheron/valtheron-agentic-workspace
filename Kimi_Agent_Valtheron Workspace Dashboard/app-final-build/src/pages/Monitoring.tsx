import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  CircleOff,
  Clock,
  Database,
  Download,
  FileText,
  Globe,
  HardDrive,
  History,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  MessageSquare,
  Minus,
  PauseCircle,
  RefreshCw,
  RotateCcw,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Siren,
  Timer,
  TrendingUp,
  Upload,
  Users,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
  ZapOff,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  systemHealthData,
  metricsData,
  activityFeedData,
  securityEvents,
  agentsData,
  tasksData,
  llmProvidersData,
  workflowInstances,
  auditLogData,
  notificationsData,
  errorDistributionData,
} from '@/lib/mockData';

import type { ModuleHealth, ServiceHealth, LLMProvider, SecurityEvent, WorkflowInstance, AuditLogEntry, Notification } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { scale: 0.96, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Sparkline Component                                               */
/* ------------------------------------------------------------------ */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const d = `M ${pts.join(' L ')}`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2} r={2} fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                      */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    operational: '#3DDC97',
    degraded: '#F5A623',
    down: '#EF4444',
    running: '#3DDC97',
    completed: '#3DDC97',
    failed: '#EF4444',
    pending: '#5B8DEF',
  };
  const color = colorMap[status] || '#8B95A5';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colorMap: Record<string, string> = {
    critical: '#EF4444',
    warning: '#F5A623',
    info: '#5B8DEF',
  };
  const color = colorMap[severity] || '#8B95A5';
  return (
    <Badge variant="outline" className="text-xs border-0" style={{ backgroundColor: `${color}15`, color }}>
      {severity.toUpperCase()}
    </Badge>
  );
}

/* ================================================================== */
/*  MAIN PAGE COMPONENT                                               */
/* ================================================================== */
export default function Monitoring() {
  const [timeRange, setTimeRange] = useState('15min');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [agentTab, setAgentTab] = useState<'requests' | 'responseTime' | 'throughput'>('requests');
  const [secFilter, setSecFilter] = useState<string>('all');
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [ackedSecurity, setAckedSecurity] = useState<Set<string>>(new Set());

  /* ---- data slices ---- */
  const modules = systemHealthData.modules;
  const services = systemHealthData.services;
  const llms = llmProvidersData;
  const dbm = systemHealthData.dbMetrics;
  const killSwitch = systemHealthData.killSwitch;

  /* ---- filtered data ---- */
  const filteredSecurity = useMemo(() => {
    if (secFilter === 'all') return securityEvents;
    return securityEvents.filter((e) => e.severity === secFilter);
  }, [secFilter]);

  const activeAlerts = useMemo(
    () => notificationsData.filter((n) => !n.read && !acknowledgedAlerts.has(n.id)),
    [acknowledgedAlerts]
  );

  const filteredAudit = useMemo(() => {
    if (auditFilter === 'all') return auditLogData;
    return auditLogData.filter((a) => {
      if (auditFilter === 'auth') return a.action.includes('login') || a.action.includes('permission');
      if (auditFilter === 'system') return a.action.includes('kill') || a.action.includes('backup') || a.action.includes('config');
      if (auditFilter === 'agent') return a.action.includes('agent');
      return true;
    });
  }, [auditFilter]);

  /* ---- handlers ---- */
  const acknowledgeAlert = useCallback((id: string) => {
    setAcknowledgedAlerts((prev) => new Set(prev).add(id));
  }, []);

  const acknowledgeSecurity = useCallback((id: string) => {
    setAckedSecurity((prev) => new Set(prev).add(id));
  }, []);

  const exportCSV = useCallback(() => {
    const rows = [
      ['Module', 'Status', 'Response Time (ms)', 'Uptime %', 'Last Checked'],
      ...modules.map((m) => [m.name, m.status, String(m.responseTime), String(m.uptime), m.lastChecked]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-export-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [modules]);

  /* ---- agent chart data ---- */
  const agentChartData = useMemo(() => {
    const slice = agentsData.activity[agentTab].slice(-30);
    return slice.map((pt) => ({
      time: pt.time,
      'Content Agents': pt.contentAgents,
      'Data Agents': pt.dataAgents,
      'Code Agents': pt.codeAgents,
    }));
  }, [agentTab]);

  const totalErrors = errorDistributionData.reduce((s, d) => s + d.value, 0);

  /* ---- module icon map ---- */
  const moduleIcons: Record<string, React.ReactNode> = {
    auth: <KeyRound size={14} />,
    agents: <Bot size={14} />,
    tasks: <CheckCircle2 size={14} />,
    workflows: <Layers size={14} />,
    chat: <MessageSquare size={14} />,
    collab: <Users size={14} />,
    security: <Shield size={14} />,
    analytics: <TrendingUp size={14} />,
    files: <FileText size={14} />,
    tree: <HardDrive size={14} />,
    notifications: <BellIcon />,
    secrets: <Lock size={14} />,
    backup: <Upload size={14} />,
    health: <Activity size={14} />,
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#070A0E' }}>
      {/* ============================================================= */}
      {/*  SECTION 1: Page Header                                       */}
      {/* ============================================================= */}
      <div className="border-b px-6 py-5" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0C1117' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F0F2F5' }}>
              System Monitoring
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: '#8B95A5' }}>
              Live system health & performance metrics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range */}
            <div className="flex items-center gap-1 rounded-lg border p-1" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#070A0E' }}>
              {['5min', '15min', '1h', '6h', '24h'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: timeRange === t ? 'rgba(61,220,151,0.12)' : 'transparent',
                    color: timeRange === t ? '#3DDC97' : '#8B95A5',
                  }}
                >
                  {t === '1h' || t === '6h' || t === '24h' ? `Last ${t}` : `Last ${t}`}
                </button>
              ))}
            </div>

            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#070A0E' }}>
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: autoRefresh ? '#3DDC97' : '#4A5568' }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: autoRefresh ? '#3DDC97' : '#4A5568' }} />
              </span>
              <span className="text-xs" style={{ color: '#8B95A5' }}>Auto-refresh</span>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} className="data-[state=checked]:bg-[#3DDC97]" />
            </div>

            {/* Export CSV */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="gap-1.5 text-xs border-0"
              style={{ backgroundColor: '#070A0E', color: '#F0F2F5', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <Download size={13} />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <motion.div
        className="mx-auto max-w-[1600px] space-y-6 p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* =========================================================== */}
        {/*  SECTION 2: System Overview KPIs (6 cards)                  */}
        {/* =========================================================== */}
        <motion.div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" variants={containerVariants}>
          {metricsData.map((kpi, i) => (
            <motion.div key={kpi.label} variants={cardVariants}>
              <Card
                className="relative overflow-hidden border-0"
                style={{
                  backgroundColor: '#0C1117',
                  borderRadius: 12,
                  borderTop: `2px solid ${kpi.color}`,
                  padding: 0,
                }}
              >
                <CardContent className="p-5">
                  <p className="mb-1 text-xs font-medium" style={{ color: '#8B95A5' }}>{kpi.label}</p>
                  <div className="flex items-end justify-between">
                    <div className="font-mono text-xl font-bold" style={{ color: '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>
                      <CountUp end={kpi.value} duration={1.5} decimals={kpi.suffix === '%' || kpi.suffix === 'ms' ? 2 : 0} suffix={kpi.suffix} separator="," />
                      {kpi.total ? (
                        <span className="ml-1 text-sm font-normal" style={{ color: '#4A5568' }}>
                          / {kpi.total}
                        </span>
                      ) : null}
                    </div>
                    <MiniSparkline data={kpi.sparkline} color={kpi.color} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* =========================================================== */}
        {/*  SECTION 3: Backend Module Health (14 cards)                */}
        {/* =========================================================== */}
        <motion.div variants={cardVariants}>
          <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
                <Server size={15} style={{ color: '#3DDC97' }} />
                Backend Module Health
                <Badge variant="outline" className="ml-1 border-0 text-xs" style={{ backgroundColor: 'rgba(61,220,151,0.1)', color: '#3DDC97' }}>
                  {modules.filter((m) => m.status === 'operational').length}/14 Operational
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {modules.map((mod) => (
                  <ModuleCard key={mod.name} module={mod} icon={moduleIcons[mod.name]} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* =========================================================== */}
        {/*  SECTION 4: Services Health (4 cards)                       */}
        {/* =========================================================== */}
        <motion.div variants={cardVariants}>
          <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
                <Settings size={15} style={{ color: '#5B8DEF' }} />
                Services Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {services.map((svc) => (
                  <ServiceCard key={svc.name} service={svc} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* =========================================================== */}
        {/*  SECTION 5: LLM Provider Performance                        */}
        {/* =========================================================== */}
        <motion.div variants={cardVariants}>
          <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
                <Sparkles size={15} style={{ color: '#F5A623' }} />
                LLM Provider Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {llms.map((llm) => (
                  <LLMCard key={llm.name} provider={llm} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* =========================================================== */}
        {/*  SECTION 6: Database Performance                            */}
        {/* =========================================================== */}
        <motion.div variants={cardVariants}>
          <DatabaseSection metrics={dbm} />
        </motion.div>

        {/* =========================================================== */}
        {/*  SECTION 7 + 8: Agent Activity + Error Distribution         */}
        {/* =========================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Agent Activity Chart */}
          <motion.div className="lg:col-span-2" variants={cardVariants}>
            <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
                    <Bot size={15} style={{ color: '#3DDC97' }} />
                    Agent Activity
                  </CardTitle>
                  <Tabs value={agentTab} onValueChange={(v) => setAgentTab(v as typeof agentTab)}>
                    <TabsList className="h-7 gap-1 border-0 bg-transparent p-0" style={{ backgroundColor: '#070A0E' }}>
                      <TabsTrigger value="requests" className="h-7 px-2.5 text-xs data-[state=active]:bg-[rgba(61,220,151,0.12)] data-[state=active]:text-[#3DDC97]" style={{ color: '#8B95A5', borderRadius: 6 }}>Requests</TabsTrigger>
                      <TabsTrigger value="responseTime" className="h-7 px-2.5 text-xs data-[state=active]:bg-[rgba(61,220,151,0.12)] data-[state=active]:text-[#3DDC97]" style={{ color: '#8B95A5', borderRadius: 6 }}>Response Time</TabsTrigger>
                      <TabsTrigger value="throughput" className="h-7 px-2.5 text-xs data-[state=active]:bg-[rgba(61,220,151,0.12)] data-[state=active]:text-[#3DDC97]" style={{ color: '#8B95A5', borderRadius: 6 }}>Throughput</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={agentChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradContent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3DDC97" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3DDC97" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradData" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5B8DEF" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#5B8DEF" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradCode" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F5A623" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="time" tick={{ fill: '#4A5568', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                      <YAxis tick={{ fill: '#4A5568', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0C1117',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 8,
                          color: '#F0F2F5',
                          fontSize: 12,
                        }}
                        itemStyle={{ color: '#F0F2F5', fontSize: 11 }}
                        labelStyle={{ color: '#8B95A5', fontSize: 11, marginBottom: 4 }}
                      />
                      <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, color: '#8B95A5' }} />
                      <Area type="monotone" dataKey="Content Agents" stackId="1" stroke="#3DDC97" strokeWidth={1.5} fill="url(#gradContent)" />
                      <Area type="monotone" dataKey="Data Agents" stackId="1" stroke="#5B8DEF" strokeWidth={1.5} fill="url(#gradData)" />
                      <Area type="monotone" dataKey="Code Agents" stackId="1" stroke="#F5A623" strokeWidth={1.5} fill="url(#gradCode)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Error Distribution Donut */}
          <motion.div variants={cardVariants}>
            <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
                  <AlertTriangle size={15} style={{ color: '#EF4444' }} />
                  Error Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={errorDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {errorDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0C1117',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 8,
                          color: '#F0F2F5',
                          fontSize: 11,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Center text */}
                <div className="-mt-28 mb-4 flex flex-col items-center justify-center">
                  <span className="font-mono text-2xl font-bold" style={{ color: '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>
                    {totalErrors}
                  </span>
                  <span className="text-xs" style={{ color: '#8B95A5' }}>Total Errors</span>
                </div>
                {/* Breakdown bars */}
                <div className="mt-4 space-y-2">
                  {errorDistributionData.map((err) => (
                    <div key={err.name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span style={{ color: '#8B95A5' }}>{err.name}</span>
                        <span className="font-mono" style={{ color: '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>{err.value}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: err.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(err.value / totalErrors) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* =========================================================== */}
        {/*  SECTION 9: Workflow Progress                               */}
        {/* =========================================================== */}
        <motion.div variants={cardVariants}>
          <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
                <Layers size={15} style={{ color: '#5B8DEF' }} />
                Workflow Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflowInstances.map((wf) => (
                <WorkflowRow key={wf.id} workflow={wf} />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* =========================================================== */}
        {/*  SECTION 10: Security Events Table                          */}
        {/* =========================================================== */}
        <motion.div variants={cardVariants}>
          <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
                  <ShieldAlert size={15} style={{ color: '#EF4444' }} />
                  Security Events
                </CardTitle>
                <div className="flex items-center gap-2">
                  {['all', 'critical', 'warning', 'info'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setSecFilter(f)}
                      className="rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-all"
                      style={{
                        backgroundColor: secFilter === f ? 'rgba(239,68,68,0.12)' : 'transparent',
                        color: secFilter === f ? '#EF4444' : '#8B95A5',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <TableHead className="text-xs" style={{ color: '#8B95A5' }}>Severity</TableHead>
                      <TableHead className="text-xs" style={{ color: '#8B95A5' }}>Type</TableHead>
                      <TableHead className="text-xs" style={{ color: '#8B95A5' }}>Agent</TableHead>
                      <TableHead className="text-xs" style={{ color: '#8B95A5' }}>Description</TableHead>
                      <TableHead className="text-xs" style={{ color: '#8B95A5' }}>Time</TableHead>
                      <TableHead className="text-xs" style={{ color: '#8B95A5' }}>Status</TableHead>
                      <TableHead className="text-xs" style={{ color: '#8B95A5' }}>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSecurity.map((evt) => (
                      <TableRow key={evt.id} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <TableCell><SeverityBadge severity={evt.severity} /></TableCell>
                        <TableCell className="text-xs font-medium" style={{ color: '#F0F2F5' }}>{evt.type}</TableCell>
                        <TableCell className="text-xs" style={{ color: '#8B95A5' }}>{evt.agent}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs" style={{ color: '#F0F2F5' }}>{evt.description}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs" style={{ color: '#8B95A5' }}>{formatTimeAgo(evt.timestamp)}</TableCell>
                        <TableCell>
                          {evt.resolved || ackedSecurity.has(evt.id) ? (
                            <Badge variant="outline" className="border-0 text-xs" style={{ backgroundColor: 'rgba(61,220,151,0.1)', color: '#3DDC97' }}>
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-0 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                              Open
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!evt.resolved && !ackedSecurity.has(evt.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              style={{ color: '#8B95A5' }}
                              onClick={() => acknowledgeSecurity(evt.id)}
                            >
                              Ack
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* =========================================================== */}
        {/*  SECTION 11 + 12 + 13: Alerts / Audit / Kill Switch         */}
        {/* =========================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Active Alerts */}
          <motion.div variants={cardVariants}>
            <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
                  <Siren size={15} style={{ color: '#EF4444' }} />
                  Active Alerts
                  {activeAlerts.length > 0 && (
                    <Badge className="border-0 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                      {activeAlerts.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeAlerts.length === 0 ? (
                  <div className="flex flex-col items-center py-6">
                    <ShieldCheck size={32} style={{ color: '#3DDC97' }} />
                    <p className="mt-2 text-sm" style={{ color: '#8B95A5' }}>All clear - no active alerts</p>
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onAcknowledge={acknowledgeAlert} />
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Audit Log Timeline */}
          <motion.div variants={cardVariants}>
            <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
                    <History size={15} style={{ color: '#5B8DEF' }} />
                    Audit Log
                  </CardTitle>
                  <Select value={auditFilter} onValueChange={setAuditFilter}>
                    <SelectTrigger className="h-7 w-28 border-0 text-xs" style={{ backgroundColor: '#070A0E', color: '#8B95A5' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: '#0C1117', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="auth">Auth</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="agent">Agents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-4 pl-3">
                  {/* Vertical line */}
                  <div className="absolute bottom-0 left-[16px] top-0 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  {filteredAudit.map((entry) => (
                    <TimelineItem key={entry.id} entry={entry} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Kill Switch Status */}
          <motion.div variants={cardVariants}>
            <KillSwitchCard status={killSwitch} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  SUB-COMPONENTS                                                    */
/* ================================================================== */

function ModuleCard({ module, icon }: { module: ModuleHealth; icon?: React.ReactNode }) {
  const statusColor = module.status === 'operational' ? '#3DDC97' : module.status === 'degraded' ? '#F5A623' : '#EF4444';
  return (
    <div
      className="rounded-lg p-3 transition-all hover:brightness-110"
      style={{
        backgroundColor: '#070A0E',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span style={{ color: '#8B95A5' }}>{icon}</span>
        <span className="text-xs font-medium capitalize" style={{ color: '#F0F2F5' }}>{module.name}</span>
      </div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
        <span className="text-xs" style={{ color: statusColor }}>
          {module.status}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs" style={{ color: '#8B95A5', fontFamily: '"JetBrains Mono", monospace' }}>
          {module.responseTime}ms
        </span>
        <span className="font-mono text-xs" style={{ color: '#4A5568', fontFamily: '"JetBrains Mono", monospace' }}>
          {module.uptime}%
        </span>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceHealth }) {
  const statusColor = service.status === 'operational' ? '#3DDC97' : '#EF4444';
  const memPct = Math.min(service.memoryUsage / 512 * 100, 100);
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: '#070A0E', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: '#F0F2F5' }}>
          {service.name.replace(/Service$/, '')}
        </span>
        <StatusBadge status={service.status} />
      </div>
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#8B95A5' }}>Connections</span>
          <span className="font-mono text-xs" style={{ color: '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>
            {formatNumber(service.connections)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#8B95A5' }}>Ops/sec</span>
          <span className="font-mono text-xs" style={{ color: '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>
            {formatNumber(service.opsPerSec)}
          </span>
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs" style={{ color: '#8B95A5' }}>Memory</span>
          <span className="font-mono text-xs" style={{ color: '#8B95A5', fontFamily: '"JetBrains Mono", monospace' }}>
            {service.memoryUsage} MB
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${memPct}%`, backgroundColor: memPct > 80 ? '#EF4444' : '#3DDC97' }} />
        </div>
      </div>
    </div>
  );
}

function LLMCard({ provider }: { provider: LLMProvider }) {
  const statusColor = provider.status === 'operational' ? '#3DDC97' : provider.status === 'degraded' ? '#F5A623' : '#EF4444';
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: '#070A0E', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="block text-xs font-medium" style={{ color: '#F0F2F5' }}>{provider.name}</span>
          <span className="text-xs" style={{ color: '#4A5568' }}>{provider.model}</span>
        </div>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#8B95A5' }}>Req/min</span>
          <span className="font-mono text-xs" style={{ color: '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>
            {provider.requestsPerMin}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#8B95A5' }}>Latency</span>
          <span className="font-mono text-xs" style={{ color: provider.avgLatency > 2000 ? '#F5A623' : '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>
            {provider.avgLatency}ms
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#8B95A5' }}>Error Rate</span>
          <span className="font-mono text-xs" style={{ color: provider.errorRate > 1 ? '#EF4444' : '#3DDC97', fontFamily: '"JetBrains Mono", monospace' }}>
            {provider.errorRate}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#8B95A5' }}>Models</span>
          <span className="font-mono text-xs" style={{ color: '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>
            {provider.modelCount}
          </span>
        </div>
      </div>
    </div>
  );
}

function DatabaseSection({ metrics }: { metrics: typeof systemHealthData.dbMetrics }) {
  const items = [
    { label: 'WAL Mode', value: metrics.walMode ? 'Enabled' : 'Disabled', pct: metrics.walMode ? 100 : 0, color: '#3DDC97' },
    { label: 'Tables', value: `${metrics.tableCount}/${metrics.totalTables}`, pct: (metrics.tableCount / metrics.totalTables) * 100, color: '#3DDC97' },
    { label: 'Indexes', value: String(metrics.indexCount), pct: 100, color: '#5B8DEF' },
    { label: 'Cache Hit Rate', value: `${metrics.cacheHitRate}%`, pct: metrics.cacheHitRate, color: metrics.cacheHitRate > 95 ? '#3DDC97' : '#F5A623' },
    { label: 'Active Connections', value: String(metrics.activeConnections), pct: (metrics.activeConnections / 50) * 100, color: '#5B8DEF' },
    { label: 'Transactions/sec', value: formatNumber(metrics.transactionsPerSec), pct: Math.min((metrics.transactionsPerSec / 2000) * 100, 100), color: '#F5A623' },
    { label: 'Replication', value: metrics.replicationStatus.charAt(0).toUpperCase() + metrics.replicationStatus.slice(1), pct: 100, color: '#3DDC97' },
  ];

  return (
    <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
          <Database size={15} style={{ color: '#3DDC97' }} />
          Database Performance
          <Badge variant="outline" className="ml-1 border-0 text-xs" style={{ backgroundColor: 'rgba(61,220,151,0.1)', color: '#3DDC97' }}>
            SQLite + WAL
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg p-3" style={{ backgroundColor: '#070A0E', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs" style={{ color: '#8B95A5' }}>{item.label}</span>
                <span className="font-mono text-xs font-semibold" style={{ color: '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>
                  {item.value}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowRow({ workflow }: { workflow: WorkflowInstance }) {
  const statusColor =
    workflow.status === 'running' ? '#5B8DEF' :
    workflow.status === 'completed' ? '#3DDC97' :
    workflow.status === 'failed' ? '#EF4444' : '#F5A623';
  return (
    <div className="flex flex-col gap-2 rounded-lg p-3 sm:flex-row sm:items-center sm:gap-4" style={{ backgroundColor: '#070A0E', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="min-w-[180px] flex-1">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
          <span className="text-xs font-medium" style={{ color: '#F0F2F5' }}>{workflow.name}</span>
        </div>
        <span className="mt-0.5 block text-xs" style={{ color: '#4A5568' }}>{workflow.currentStep}</span>
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs" style={{ color: '#8B95A5' }}>{workflow.progress}%</span>
          <span className="text-xs" style={{ color: '#4A5568' }}>ETA: {workflow.estimatedCompletion}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: statusColor }}
            initial={{ width: 0 }}
            animate={{ width: `${workflow.progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </div>
      <Badge variant="outline" className="w-fit border-0 text-xs" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
        {workflow.status}
      </Badge>
    </div>
  );
}

function AlertCard({ alert, onAcknowledge }: { alert: Notification; onAcknowledge: (id: string) => void }) {
  const borderColor = alert.severity === 'critical' ? '#EF4444' : alert.severity === 'warning' ? '#F5A623' : '#5B8DEF';
  return (
    <motion.div
      layout
      exit={{ opacity: 0, x: 20 }}
      className="rounded-lg border-l-2 p-3"
      style={{
        backgroundColor: '#070A0E',
        borderLeftColor: borderColor,
        border: '1px solid rgba(255,255,255,0.04)',
        borderLeftWidth: 2,
        borderLeftColor: borderColor,
      }}
    >
      <div className="mb-1 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {alert.severity === 'critical' ? <ShieldAlert size={13} style={{ color: '#EF4444' }} /> : <AlertTriangle size={13} style={{ color: '#F5A623' }} />}
          <span className="text-xs font-medium" style={{ color: '#F0F2F5' }}>{alert.title}</span>
        </div>
        <span className="whitespace-nowrap text-xs" style={{ color: '#4A5568' }}>{formatTimeAgo(alert.timestamp)}</span>
      </div>
      <p className="mb-2 text-xs leading-relaxed" style={{ color: '#8B95A5' }}>{alert.message}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          style={{ color: '#3DDC97' }}
          onClick={() => onAcknowledge(alert.id)}
        >
          Acknowledge
        </Button>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" style={{ color: '#8B95A5' }}>
          Mute
        </Button>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" style={{ color: '#EF4444' }}>
          Escalate
        </Button>
      </div>
    </motion.div>
  );
}

function TimelineItem({ entry }: { entry: AuditLogEntry }) {
  const dotColor = entry.result === 'success' ? '#3DDC97' : '#EF4444';
  const actionColors: Record<string, string> = {
    user_login: '#5B8DEF',
    agent_create: '#3DDC97',
    workflow_start: '#F5A623',
    config_change: '#8B5CF6',
    permission_grant: '#5B8DEF',
    kill_switch: '#EF4444',
    backup_restore: '#3DDC97',
    api_key_rotate: '#F5A623',
    agent_delete: '#6B7280',
  };
  return (
    <div className="relative pl-5">
      <span className="absolute left-0 top-1 h-2 w-2 rounded-full ring-2" style={{ backgroundColor: dotColor, ringColor: '#0C1117' }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span
            className="mr-1.5 inline-block rounded px-1 py-0.5 text-[10px] font-medium uppercase"
            style={{ backgroundColor: `${actionColors[entry.action] || '#4A5568'}15`, color: actionColors[entry.action] || '#8B95A5' }}
          >
            {entry.action.replace(/_/g, ' ')}
          </span>
          <span className="text-xs" style={{ color: '#F0F2F5' }}>{entry.target}</span>
          <span className="mt-0.5 block text-xs" style={{ color: '#4A5568' }}>{entry.actor}</span>
        </div>
        <span className="whitespace-nowrap text-xs" style={{ color: '#4A5568' }}>{formatTimeAgo(entry.timestamp)}</span>
      </div>
    </div>
  );
}

function KillSwitchCard({ status }: { status: typeof systemHealthData.killSwitch }) {
  const [localArmed, setLocalArmed] = useState(status.armed);
  return (
    <Card className="border-0" style={{ backgroundColor: '#0C1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F0F2F5' }}>
          <ShieldOff size={15} style={{ color: '#EF4444' }} />
          Kill Switch Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: '#070A0E', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${localArmed ? 'animate-pulse' : ''}`} style={{ backgroundColor: localArmed ? '#EF4444' : '#3DDC97' }} />
            <span className="text-sm font-medium" style={{ color: localArmed ? '#EF4444' : '#3DDC97' }}>
              {localArmed ? 'ARMED' : 'DISARMED'}
            </span>
          </div>
          <Badge variant="outline" className="border-0 text-xs" style={{ backgroundColor: localArmed ? 'rgba(239,68,68,0.1)' : 'rgba(61,220,151,0.1)', color: localArmed ? '#EF4444' : '#3DDC97' }}>
            {localArmed ? 'Auto-protect active' : 'Manual override'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: '#8B95A5' }}>Last Triggered</span>
            <span className="font-mono text-xs" style={{ color: '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>
              {formatTimeAgo(status.lastTriggered)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: '#8B95A5' }}>Auto-trigger Rules</span>
            <span className="font-mono text-xs" style={{ color: '#F0F2F5', fontFamily: '"JetBrains Mono", monospace' }}>
              {status.autoTriggerRules}
            </span>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-1.5 text-xs font-medium"
          style={{
            backgroundColor: localArmed ? 'rgba(239,68,68,0.15)' : 'rgba(61,220,151,0.15)',
            color: localArmed ? '#EF4444' : '#3DDC97',
            border: `1px solid ${localArmed ? 'rgba(239,68,68,0.3)' : 'rgba(61,220,151,0.3)'}`,
          }}
          onClick={() => setLocalArmed(!localArmed)}
        >
          {localArmed ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
          {localArmed ? 'Disarm Kill Switch' : 'Arm Kill Switch'}
        </Button>
      </CardContent>
    </Card>
  );
}

/* Small bell icon wrapper */
function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#8B95A5' }}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
