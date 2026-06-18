import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  Bot, CheckCircle, Clock, HeartPulse, ChevronDown,
  Activity, Library, Users, Sliders, ArrowRight,
  GitBranch, AlertTriangle, User, CheckSquare,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
} from 'recharts';
import { useLiveData } from '@/hooks/useLiveData';
import {
  kpiData, agentStatusData, systemHealthData,
  activityData, quickLinksData, topWorkflowsData,
} from '@/lib/mockData';
import type { KPIData, ActivityTimelineEvent } from '@/lib/mockData';

const easeDefault = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ───────── Animated Counter ───────── */
function AnimatedCounter({ value, suffix, prefix, decimals = 0 }: { value: number; suffix?: string; prefix?: string; decimals?: number }) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    setKey((k) => k + 1);
  }, [value]);
  return (
    <span className="font-mono-large" style={{ color: 'var(--text-primary)' }}>
      <CountUp
        key={key}
        start={0}
        end={value}
        duration={1.2}
        decimals={decimals}
        prefix={prefix || ''}
        suffix={suffix || ''}
        useEasing
      />
    </span>
  );
}

/* ───────── Mini Sparkline (Area) ───────── */
function MiniSparkline({ data, color, height = 32, width = 80 }: { data: number[]; color: string; height?: number; width?: number }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${color.replace('#', '')})`}
            isAnimationActive={true}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ───────── Mini Line Sparkline ───────── */
function MiniLineSparkline({ data, color, height = 24 }: { data: number[]; color: string; height?: number }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ───────── KPI Card ───────── */
function KPICard({ data, index }: { data: KPIData; index: number }) {
  const iconMap: Record<string, typeof Bot> = {
    'active-agents': Bot,
    'tasks-completed': CheckCircle,
    'response-time': Clock,
    'system-uptime': HeartPulse,
  };

  const Icon = iconMap[data.id] || Bot;

  return (
    <motion.div
      className="rounded-xl p-5 card-glow-hover relative overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: `3px solid ${data.borderColor}`,
      }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, delay: 0.1 + index * 0.08, ease: easeDefault }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
            {data.label}
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            {data.total ? (
              <span className="font-mono-large" style={{ color: 'var(--text-primary)' }}>
                <CountUp start={0} end={data.value} duration={1.2} />
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  {' / '}{data.total}
                </span>
              </span>
            ) : data.suffix === 'ms' ? (
              <span className="font-mono-large" style={{ color: 'var(--text-primary)' }}>
                <CountUp start={0} end={data.value} duration={1.2} />
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>ms</span>
              </span>
            ) : (
              <AnimatedCounter
                value={data.value}
                suffix={data.suffix}
                prefix={data.prefix}
                decimals={data.suffix === '%' ? 1 : 0}
              />
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              style={{
                fontSize: '0.75rem',
                color: data.trendGood ? 'var(--accent-primary)' : 'var(--accent-warning)',
              }}
            >
              {data.trendDirection === 'up' ? '▲' : data.trendDirection === 'down' ? '▼' : '⚠'} {data.trend}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Icon size={18} style={{ color: data.iconColor }} />
          <MiniSparkline data={data.sparkline} color={data.iconColor} />
        </div>
      </div>
    </motion.div>
  );
}

/* ───────── Agent Status Panel ───────── */
function AgentStatusPanel() {
  const total = agentStatusData.reduce((sum, s) => sum + s.count, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <motion.div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, delay: 0.45, ease: easeDefault }}
    >
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          Agent Status
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-full animate-pulse-dot"
            style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-primary)' }}
          />
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              letterSpacing: '0.05em',
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="relative flex justify-center" style={{ height: '180px' }}>
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={agentStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              animationBegin={0}
              animationDuration={1000}
            >
              {agentStatusData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                  style={{
                    transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-mono-large" style={{ color: 'var(--text-primary)', fontSize: '1.5rem' }}>
            {total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            Total Agents
          </div>
        </div>
      </div>

      {/* Status List */}
      <div className="mt-6 space-y-3">
        {agentStatusData.map((status, index) => (
          <motion.div
            key={status.name}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.6 + index * 0.15, ease: easeDefault }}
          >
            <span
              className="rounded-full flex-shrink-0"
              style={{ width: '8px', height: '8px', backgroundColor: status.color }}
            />
            <span
              className="flex-shrink-0"
              style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', width: '80px' }}
            >
              {status.name}
            </span>
            <div
              className="rounded-full flex-shrink-0 overflow-hidden"
              style={{ width: '80px', height: '6px', backgroundColor: 'var(--bg-surface-hover)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: status.color }}
                initial={{ width: 0 }}
                animate={{ width: `${status.percentage}%` }}
                transition={{ duration: 0.8, delay: 0.7 + index * 0.15, ease: easeDefault }}
              />
            </div>
            <span className="font-mono-data flex-shrink-0" style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>
              {status.count} agents
            </span>
            <span
              className="flex-shrink-0"
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '32px', textAlign: 'right' }}
            >
              {status.percentage}%
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ───────── System Health Map ───────── */
function SystemHealthMap() {
  const getBadgeColor = (status: string) => {
    if (status === 'Healthy') return { bg: 'rgba(61,220,151,0.15)', text: 'var(--accent-primary)' };
    if (status === 'Warning') return { bg: 'rgba(245,166,35,0.15)', text: 'var(--accent-warning)' };
    return { bg: 'rgba(239,68,68,0.15)', text: 'var(--accent-danger)' };
  };

  const getSparklineColor = (status: string) => {
    if (status === 'Healthy') return 'var(--accent-primary)';
    if (status === 'Warning') return 'var(--accent-warning)';
    return 'var(--accent-danger)';
  };

  return (
    <motion.div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, delay: 0.45, ease: easeDefault }}
    >
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          System Health Map
        </span>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full"
            style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            All subsystems operational
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {systemHealthData.modules.map((item, index) => {
          const statusLabel = item.status === 'operational' ? 'Healthy' : item.status === 'degraded' ? 'Warning' : 'Critical';
          const badge = getBadgeColor(statusLabel);
          return (
            <motion.div
              key={item.name}
              className="rounded-lg p-4 transition-all cursor-default"
              style={{
                backgroundColor: 'var(--bg-surface-hover)',
                border: '1px solid transparent',
              }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.5 + index * 0.06, ease: easeDefault }}
              whileHover={{
                y: -1,
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {item.name}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    backgroundColor: badge.bg,
                    color: badge.text,
                  }}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="font-mono-data mt-2" style={{ color: 'var(--text-primary)' }}>
                {item.responseTime}ms • {item.uptime}% uptime
              </div>
              <div className="mt-2">
                <MiniLineSparkline
                  data={[item.uptime, item.uptime - 0.02, item.uptime - 0.01, item.uptime + 0.005, item.uptime]}
                  color={getSparklineColor(statusLabel)}
                  height={24}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ───────── Activity Timeline ───────── */
function ActivityTimeline() {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Agents', 'Workflows', 'Alerts', 'Collaboration'];

  const getIconConfig = (event: ActivityTimelineEvent) => {
    switch (event.type) {
      case 'agent':
        return { icon: Bot, color: 'var(--accent-primary)', bg: 'rgba(61,220,151,0.12)' };
      case 'workflow':
        return { icon: GitBranch, color: 'var(--accent-purple)', bg: 'rgba(167,139,250,0.12)' };
      case 'alert':
        return event.severity === 'critical'
          ? { icon: AlertTriangle, color: 'var(--accent-danger)', bg: 'rgba(239,68,68,0.12)' }
          : { icon: AlertTriangle, color: 'var(--accent-warning)', bg: 'rgba(245,166,35,0.12)' };
      case 'user':
        return { icon: User, color: 'var(--accent-secondary)', bg: 'rgba(91,141,239,0.12)' };
      case 'task':
        return { icon: CheckSquare, color: 'var(--accent-primary)', bg: 'rgba(61,220,151,0.12)' };
      case 'system':
        return { icon: AlertTriangle, color: 'var(--accent-warning)', bg: 'rgba(245,166,35,0.12)' };
      default:
        return { icon: Info, color: 'var(--text-muted)', bg: 'var(--bg-surface-hover)' };
    }
  };

  const filteredData = filter === 'All'
    ? activityData
    : activityData.filter((e) => {
        if (filter === 'Agents') return e.type === 'agent';
        if (filter === 'Workflows') return e.type === 'workflow';
        if (filter === 'Alerts') return e.type === 'alert';
        if (filter === 'Collaboration') return e.type === 'user';
        return true;
      });

  return (
    <motion.div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.7, ease: easeDefault }}
    >
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          Recent Activity
        </span>
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full transition-all"
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: filter === f ? 'rgba(61,220,151,0.15)' : 'transparent',
                color: filter === f ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-0" style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {filteredData.map((event, index) => {
          const { icon: EventIcon, color, bg } = getIconConfig(event);
          return (
            <motion.div
              key={event.id}
              className="flex items-start gap-3 py-3 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.75 + index * 0.06, ease: easeDefault }}
            >
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{ width: '32px', height: '32px', backgroundColor: bg }}
              >
                <EventIcon size={14} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{event.actor}</strong>
                  {' '}{event.action}{' '}
                  {event.target && (
                    <em style={{ color: 'var(--text-primary)', fontStyle: event.targetItalic ? 'italic' : 'normal' }}>
                      {event.target}
                    </em>
                  )}
                </span>
              </div>
              <span
                className="flex-shrink-0"
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.02em' }}
              >
                {event.time}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ───────── Quick Links ───────── */
function QuickLinks() {
  const iconMap: Record<string, typeof Activity> = {
    Activity,
    Library,
    Users,
    Sliders,
  };

  return (
    <motion.div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, delay: 1.1, ease: easeDefault }}
    >
      <span
        className="block mb-4"
        style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)' }}
      >
        Quick Access
      </span>

      <div className="grid grid-cols-2 gap-3">
        {quickLinksData.map((link, index) => {
          const Icon = iconMap[link.icon] || Activity;
          return (
            <motion.a
              key={link.title}
              href={link.href}
              className="group rounded-lg p-4 transition-all cursor-pointer block"
              style={{
                backgroundColor: 'var(--bg-surface-hover)',
                border: '1px solid transparent',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 1.15 + index * 0.05, ease: easeDefault }}
              whileHover={{
                y: -2,
                borderColor: 'rgba(255,255,255,0.06)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <div className="flex items-start justify-between">
                <Icon size={20} style={{ color: link.iconColor }} />
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
              <div
                className="mt-2"
                style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}
              >
                {link.title}
              </div>
              <div
                className="mt-1"
                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
              >
                {link.description}
              </div>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ───────── Top Workflows Table ───────── */
function TopWorkflowsTable() {
  const getSuccessColor = (rate: number) => {
    if (rate >= 99) return 'var(--accent-primary)';
    if (rate >= 97) return 'var(--text-primary)';
    return 'var(--accent-warning)';
  };

  return (
    <motion.div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, delay: 1.1, ease: easeDefault }}
    >
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          Top Workflows This Week
        </span>
        <a
          href="/templates"
          className="transition-opacity hover:opacity-80"
          style={{ fontSize: '0.8125rem', color: 'var(--accent-secondary)' }}
        >
          View All
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
              {['Workflow', 'Runs', 'Success', 'Avg Time', 'Trend'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2.5 first:rounded-l-lg last:rounded-r-lg"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topWorkflowsData.map((wf, index) => (
              <motion.tr
                key={wf.id}
                className="transition-colors"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  height: '52px',
                }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 1.15 + index * 0.04, ease: easeDefault }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td className="px-4" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {wf.name}
                </td>
                <td className="px-4 font-mono-data" style={{ color: 'var(--text-primary)' }}>
                  {wf.runs.toLocaleString()}
                </td>
                <td className="px-4 font-mono-data" style={{ color: getSuccessColor(wf.success) }}>
                  {wf.success}%
                </td>
                <td className="px-4 font-mono-data" style={{ color: 'var(--text-secondary)' }}>
                  {wf.avgTime}
                </td>
                <td className="px-4">
                  <div style={{ width: '40px', height: '16px' }}>
                    <MiniSparkline
                      data={wf.trend}
                      color={wf.trendDirection === 'up' ? 'var(--accent-primary)' : wf.trendDirection === 'down' ? 'var(--accent-danger)' : 'var(--accent-warning)'}
                      height={16}
                      width={40}
                    />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ───────── Page Header ───────── */
function PageHeader() {
  const { secondsAgo } = useLiveData(1000);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const quickActions = ['New Workflow', 'Add Agent', 'System Settings', 'Export Report'];

  return (
    <motion.div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: easeDefault }}
    >
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Dashboard Overview
        </h1>
        <p className="mt-1" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Real-time workspace intelligence
        </p>
        <p className="mt-1 font-mono-small" style={{ color: 'var(--text-muted)' }}>
          Last updated: {secondsAgo}s ago
        </p>
      </div>
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Quick Actions
          <ChevronDown size={16} />
        </button>
        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-2 rounded-lg border py-1 z-20"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
              minWidth: '180px',
            }}
          >
            {quickActions.map((action) => (
              <button
                key={action}
                className="block w-full text-left px-4 py-2 transition-colors"
                style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ───────── Main Home Page ───────── */
export default function Home() {
  return (
    <div>
      {/* Hero Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          top: '56px',
          left: '240px',
          right: 0,
          height: '400px',
          backgroundImage: 'url(/hero-network-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.12,
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
        }}
      />

      <PageHeader />

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={kpi.id} data={kpi} index={index} />
        ))}
      </div>

      {/* Agent Status + System Health */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-5">
          <AgentStatusPanel />
        </div>
        <div className="col-span-7">
          <SystemHealthMap />
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="mb-6">
        <ActivityTimeline />
      </div>

      {/* Quick Links + Top Workflows */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-5">
          <QuickLinks />
        </div>
        <div className="col-span-7">
          <TopWorkflowsTable />
        </div>
      </div>
    </div>
  );
}

// Need Info import for ActivityTimeline fallback
function Info({ size, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
