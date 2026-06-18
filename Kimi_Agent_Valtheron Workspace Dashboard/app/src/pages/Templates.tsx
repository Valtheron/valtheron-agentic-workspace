import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Upload, Search, ArrowUpDown, LayoutGrid, FileText,
  BarChart3, Code2, GitBranch, Users, CheckCircle, Clock,
  Bot, X, Settings2, ChevronRight,
  Copy, Calendar, Webhook, Hand, Zap, Mail, Bell,
  Slack, Play,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { workflowsData, workflowInstances, agentsData } from '@/lib/mockData';
import type { Workflow as WorkflowType, WorkflowStep, Agent } from '@/lib/mockData';

const easeDefault = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ═══════════════════════════════════════════════════════════════════════════
   REAL ARCHITECTURE REFERENCE
   16 Agent Categories: GES, ANA, MKT, PRO, ENT, ETR, LEH, SCH, ECO, DEV
                       + SYS, OPS, CRE, RES, LEG, MED
   5 Collaboration Patterns: Sequential Delegation, Parallel Consultation,
                             Iterative Refinement, Expert Panel,
                             Hierarchical Escalation
   291 Agents, Workflow types: sequential / hierarchical / debate / parallel
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── 16 Categories bucketed into Content / Data / Code / Business ─── */
const categoryMeta: Record<string, { bucket: 'content' | 'data' | 'code' | 'sequential'; label: string }> = {
  CRE: { bucket: 'content', label: 'Content' },
  MKT: { bucket: 'content', label: 'Content' },
  SCH: { bucket: 'content', label: 'Content' },
  ANA: { bucket: 'data', label: 'Data' },
  ECO: { bucket: 'data', label: 'Data' },
  RES: { bucket: 'data', label: 'Data' },
  DEV: { bucket: 'code', label: 'Code' },
  SYS: { bucket: 'code', label: 'Code' },
  OPS: { bucket: 'code', label: 'Code' },
  GES: { bucket: 'sequential', label: 'Sequential' },
  PRO: { bucket: 'sequential', label: 'Sequential' },
  ENT: { bucket: 'sequential', label: 'Sequential' },
  ETR: { bucket: 'sequential', label: 'Sequential' },
  LEH: { bucket: 'sequential', label: 'Sequential' },
  LEG: { bucket: 'sequential', label: 'Sequential' },
  MED: { bucket: 'sequential', label: 'Sequential' },
};

const bucketColors: Record<string, { bg: string; text: string; icon: string }> = {
  content:   { bg: 'rgba(167,139,250,0.15)',  text: '#A78BFA', icon: 'rgba(167,139,250,0.2)' },
  data:      { bg: 'rgba(91,141,239,0.15)',   text: '#5B8DEF',  icon: 'rgba(91,141,239,0.2)' },
  code:      { bg: 'rgba(245,166,35,0.15)',   text: '#F5A623',  icon: 'rgba(245,166,35,0.2)' },
  sequential:{ bg: 'rgba(61,220,151,0.15)',   text: '#3DDC97',  icon: 'rgba(61,220,151,0.2)' },
};

/* ─── 5 Collaboration Patterns ─── */
const COLLABORATION_PATTERNS = [
  'Sequential Delegation',
  'Parallel Consultation',
  'Iterative Refinement',
  'Expert Panel',
  'Hierarchical Escalation',
];

const patternFromWorkflow = (wf: WorkflowType): string => {
  const map: Record<string, string> = {
    sequential: 'Sequential Delegation',
    parallel: 'Parallel Consultation',
    hierarchical: 'Hierarchical Escalation',
    debate: 'Expert Panel',
  };
  return map[wf.type] || COLLABORATION_PATTERNS[0];
};

/* ─── Filter Pills ─── */
type FilterKey = 'all' | 'content' | 'data' | 'code' | 'sequential' | 'hierarchical' | 'debate' | 'parallel';

const filterPills: { key: FilterKey; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'data', label: 'Data', icon: BarChart3 },
  { key: 'code', label: 'Code', icon: Code2 },
  { key: 'sequential', label: 'Sequential', icon: GitBranch },
  { key: 'hierarchical', label: 'Hierarchical', icon: Users },
  { key: 'debate', label: 'Debate', icon: MessageSquareIcon },
  { key: 'parallel', label: 'Parallel', icon: Zap },
];

function MessageSquareIcon(props: { size?: number; className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ─── Helpers ─── */
const getAgentById = (id: string): Agent | undefined => agentsData.find((a) => a.id === id);

const getCategoryBucket = (cat: string) => categoryMeta[cat]?.bucket || 'sequential';

const getCategoryLabel = (cat: string) => categoryMeta[cat]?.label || cat;

const getInstancesForWorkflow = (wfId: string) =>
  workflowInstances.filter((wi) => wi.definitionId === wfId);

const formatTimeAgo = (_d: string): string => _d;

/* ─── Category Icon Thumbnail ─── */
function CategoryThumbnail({ bucket, category }: { bucket: string; category: string }) {
  const colors = bucketColors[bucket] || bucketColors.sequential;
  const Icon = bucket === 'content' ? FileText : bucket === 'data' ? BarChart3 : bucket === 'code' ? Code2 : GitBranch;

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{ width: '100%', height: '140px', backgroundColor: colors.icon, borderRadius: '12px 12px 0 0' }}
    >
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 30% 30%, ${colors.icon} 0%, transparent 70%)`, opacity: 0.3 }}
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: easeDefault }}
      >
        <Icon size={48} style={{ color: colors.text, opacity: 0.6 }} />
      </motion.div>
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${colors.text}08 1px, transparent 1px), linear-gradient(90deg, ${colors.text}08 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />
      {/* Category label overlay */}
      <div
        className="absolute bottom-2 left-2 rounded px-2 py-0.5 font-mono text-[0.625rem] font-semibold uppercase"
        style={{ backgroundColor: 'rgba(7,10,14,0.6)', color: colors.text }}
      >
        {category}
      </div>
    </div>
  );
}

/* ─── Template Card ─── */
function TemplateCard({
  workflow,
  index,
  onCustomize,
  onPreview,
}: {
  workflow: WorkflowType;
  index: number;
  onCustomize: (w: WorkflowType) => void;
  onPreview: (w: WorkflowType) => void;
}) {
  const bucket = getCategoryBucket(workflow.category);
  const colors = bucketColors[bucket] || bucketColors.sequential;
  const pattern = patternFromWorkflow(workflow);
  const stepAgents = workflow.steps;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: easeDefault }}
      className="group flex flex-col overflow-hidden"
      style={{
        backgroundColor: '#0C1117',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 0 30px rgba(61,220,151,0.08), 0 12px 40px rgba(0,0,0,0.3)',
        borderColor: 'rgba(61,220,151,0.2)',
      }}
    >
      {/* Thumbnail */}
      <CategoryThumbnail bucket={bucket} category={workflow.category} />

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-xs font-medium border-0"
            style={{ backgroundColor: colors.bg, color: colors.text, borderRadius: '20px', padding: '4px 10px' }}
          >
            {getCategoryLabel(workflow.category)}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs font-medium border-0 capitalize"
            style={{
              backgroundColor: 'rgba(61,220,151,0.1)',
              color: '#3DDC97',
              borderRadius: '20px',
              padding: '4px 10px',
            }}
          >
            {workflow.type}
          </Badge>
        </div>

        {/* Title */}
        <h4 className="mt-3 font-medium truncate" style={{ fontSize: '1.0625rem', fontWeight: 500, color: '#F0F2F5' }}>
          {workflow.name}
        </h4>

        {/* Description */}
        <p className="mt-1 line-clamp-2" style={{ fontSize: '0.8125rem', color: '#8B95A5', lineHeight: 1.5 }}>
          {workflow.description}
        </p>

        {/* Collaboration pattern */}
        <p className="mt-2 font-mono-small truncate" style={{ color: '#4A5568', fontSize: '0.6875rem' }}>
          {pattern}
        </p>

        {/* Agent assignment pills */}
        <div className="flex items-center gap-1 mt-3 flex-wrap">
          {stepAgents.slice(0, 3).map((step: WorkflowStep) => {
            const agent = getAgentById(step.agentId);
            return (
              <span
                key={step.agentId + step.order}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-medium"
                style={{ backgroundColor: `${colors.text}15`, color: colors.text, border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <Bot size={10} />
                {agent?.name || step.agentId}
              </span>
            );
          })}
          {stepAgents.length > 3 && (
            <span className="rounded-full px-2 py-0.5 text-[0.625rem] font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#4A5568' }}>
              +{stepAgents.length - 3}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: '#4A5568' }}>
            <Play size={11} />
            {workflow.usageCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: '#4A5568' }}>
            <CheckCircle size={11} />
            {workflow.successRate}%
          </span>
          <span className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: '#4A5568' }}>
            <Clock size={11} />
            {workflow.avgExecutionTime}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1 text-xs font-medium"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5', backgroundColor: 'transparent', borderRadius: '8px', height: '34px' }}
            onClick={() => onPreview(workflow)}
          >
            <Copy size={13} />
            Duplicate
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1 text-xs font-medium"
            style={{ backgroundColor: '#3DDC97', color: '#070A0E', borderRadius: '8px', height: '34px', fontWeight: 600 }}
            onClick={() => onCustomize(workflow)}
          >
            <Settings2 size={13} />
            Customize
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Customize Sheet ─── */
function CustomizeSheet({
  workflow,
  open,
  onClose,
}: {
  workflow: WorkflowType | null;
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [tempValue, setTempValue] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2048]);
  const [timeout, setTimeout] = useState('300');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [manualEnabled, setManualEnabled] = useState(true);
  const [eventDriven, setEventDriven] = useState(false);
  const [cronExpr, setCronExpr] = useState('0 9 * * 1-5');
  const [emailNotif, setEmailNotif] = useState(false);
  const [wsNotif, setWsNotif] = useState(true);
  const [slackNotif, setSlackNotif] = useState(false);
  const [agentRoles, setAgentRoles] = useState<Record<string, string>>({});

  const currentName = workflow ? `${workflow.name} (Copy)` : '';

  const handleRoleChange = useCallback((agent: string, role: string) => {
    setAgentRoles((prev) => ({ ...prev, [agent]: role }));
  }, []);

  if (!workflow) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[520px] p-0 flex flex-col overflow-hidden"
        style={{ backgroundColor: '#0C1117', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SheetHeader className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <SheetTitle style={{ color: '#F0F2F5', fontSize: '1.25rem', fontWeight: 500 }}>
              Customize Workflow
            </SheetTitle>
            <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/5" style={{ color: '#4A5568' }}>
              <X size={18} />
            </button>
          </div>
          <p style={{ color: '#8B95A5', fontSize: '0.875rem' }}>
            Customizing: <span style={{ color: '#F0F2F5', fontWeight: 500 }}>{workflow.name}</span>
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-5">
          <div className="space-y-6">
            {/* Workflow Name */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, ease: easeDefault }}>
              <label className="block mb-2 font-medium" style={{ fontSize: '0.875rem', color: '#F0F2F5' }}>
                Workflow Name
              </label>
              <Input
                defaultValue={currentName}
                onChange={(e) => setName(e.target.value)}
                maxLength={64}
                style={{ backgroundColor: '#070A0E', borderColor: 'rgba(255,255,255,0.06)', color: '#F0F2F5', borderRadius: '8px' }}
              />
              <span className="block mt-1 text-right" style={{ fontSize: '0.75rem', color: '#4A5568' }}>
                {(name || currentName).length}/64
              </span>
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ease: easeDefault }}>
              <label className="block mb-2 font-medium" style={{ fontSize: '0.875rem', color: '#F0F2F5' }}>
                Description
              </label>
              <Textarea
                placeholder={workflow.description}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ backgroundColor: '#070A0E', borderColor: 'rgba(255,255,255,0.06)', color: '#F0F2F5', borderRadius: '8px', resize: 'none' }}
              />
            </motion.div>

            {/* Agent Configuration */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, ease: easeDefault }}>
              <h4 className="mb-3 font-medium" style={{ fontSize: '1rem', color: '#F0F2F5' }}>
                Agent Configuration
              </h4>
              <div className="space-y-2">
                {workflow.steps.map((step) => {
                  const agent = getAgentById(step.agentId);
                  return (
                    <div key={step.agentId + step.order} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#070A0E' }}>
                      <Bot size={16} style={{ color: '#3DDC97', flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[0.8125rem]" style={{ color: '#F0F2F5' }}>
                          {agent?.name || step.agentId}
                        </div>
                        <div className="text-[0.6875rem]" style={{ color: '#4A5568' }}>
                          {step.role}
                        </div>
                      </div>
                      <Select value={agentRoles[step.agentId] || 'Executor'} onValueChange={(v) => handleRoleChange(step.agentId, v)}>
                        <SelectTrigger className="w-28 h-7 text-xs" style={{ backgroundColor: '#070A0E', borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: '#141E2B' }}>
                          <SelectItem value="Coordinator">Coordinator</SelectItem>
                          <SelectItem value="Executor">Executor</SelectItem>
                          <SelectItem value="Reviewer">Reviewer</SelectItem>
                          <SelectItem value="Observer">Observer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2">
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-full text-xs" style={{ backgroundColor: '#070A0E', borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5' }}>
                    <Plus size={12} className="mr-1" />
                    <SelectValue placeholder="Add Agent" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#141E2B' }}>
                    {agentsData
                      .filter((a) => !workflow.steps.some((s) => s.agentId === a.id))
                      .map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Parameters */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ease: easeDefault }}>
              <h4 className="mb-3 font-medium" style={{ fontSize: '1rem', color: '#F0F2F5' }}>
                Parameters
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label style={{ fontSize: '0.8125rem', color: '#8B95A5' }}>Temperature</label>
                    <span className="font-mono" style={{ fontSize: '0.8125rem', color: '#F0F2F5' }}>{tempValue[0].toFixed(1)}</span>
                  </div>
                  <Slider value={tempValue} onValueChange={setTempValue} max={2.0} min={0.0} step={0.1} />
                  <div className="flex justify-between mt-1" style={{ fontSize: '0.6875rem', color: '#4A5568' }}>
                    <span>0.0</span><span>2.0</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label style={{ fontSize: '0.8125rem', color: '#8B95A5' }}>Max Tokens</label>
                    <span className="font-mono" style={{ fontSize: '0.8125rem', color: '#F0F2F5' }}>{maxTokens[0].toLocaleString()}</span>
                  </div>
                  <Slider value={maxTokens} onValueChange={setMaxTokens} max={8192} min={256} step={256} />
                  <div className="flex justify-between mt-1" style={{ fontSize: '0.6875rem', color: '#4A5568' }}>
                    <span>256</span><span>8,192</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label style={{ fontSize: '0.8125rem', color: '#8B95A5' }}>Timeout (seconds)</label>
                  </div>
                  <Input
                    type="number"
                    value={timeout}
                    onChange={(e) => setTimeout(e.target.value)}
                    min={10}
                    max={3600}
                    style={{ backgroundColor: '#070A0E', borderColor: 'rgba(255,255,255,0.06)', color: '#F0F2F5', borderRadius: '8px' }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Triggers */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, ease: easeDefault }}>
              <h4 className="mb-3 font-medium" style={{ fontSize: '1rem', color: '#F0F2F5' }}>
                Triggers
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2" style={{ fontSize: '0.875rem', color: '#8B95A5' }}>
                    <Calendar size={14} /> Schedule
                  </span>
                  <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
                </div>
                {scheduleEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <Input
                      value={cronExpr}
                      onChange={(e) => setCronExpr(e.target.value)}
                      placeholder="0 9 * * 1-5"
                      className="font-mono text-xs"
                      style={{ backgroundColor: '#070A0E', borderColor: 'rgba(255,255,255,0.06)', color: '#F0F2F5' }}
                    />
                    <p style={{ fontSize: '0.6875rem', color: '#4A5568', marginTop: '4px' }}>Cron expression for scheduling</p>
                  </motion.div>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2" style={{ fontSize: '0.875rem', color: '#8B95A5' }}>
                    <Webhook size={14} /> Webhook
                  </span>
                  <Switch checked={webhookEnabled} onCheckedChange={setWebhookEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2" style={{ fontSize: '0.875rem', color: '#8B95A5' }}>
                    <Hand size={14} /> Manual
                  </span>
                  <Switch checked={manualEnabled} onCheckedChange={setManualEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2" style={{ fontSize: '0.875rem', color: '#8B95A5' }}>
                    <Zap size={14} /> Event-Driven
                  </span>
                  <Switch checked={eventDriven} onCheckedChange={setEventDriven} />
                </div>
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: easeDefault }}>
              <h4 className="mb-3 font-medium" style={{ fontSize: '1rem', color: '#F0F2F5' }}>
                Notifications
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2" style={{ fontSize: '0.875rem', color: '#8B95A5' }}>
                    <Mail size={14} /> Email
                  </span>
                  <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2" style={{ fontSize: '0.875rem', color: '#8B95A5' }}>
                    <Bell size={14} /> WebSocket
                  </span>
                  <Switch checked={wsNotif} onCheckedChange={setWsNotif} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2" style={{ fontSize: '0.875rem', color: '#8B95A5' }}>
                    <Slack size={14} /> Slack
                  </span>
                  <Switch checked={slackNotif} onCheckedChange={setSlackNotif} />
                </div>
              </div>
            </motion.div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button className="w-full font-medium gap-1" style={{ backgroundColor: '#3DDC97', color: '#070A0E', borderRadius: '8px', height: '40px', fontWeight: 600 }}>
            <Play size={14} />
            Deploy Workflow
          </Button>
          <Button variant="outline" className="w-full font-medium" style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5', backgroundColor: 'transparent', borderRadius: '8px', height: '40px' }}>
            Save as Draft
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Preview Modal ─── */
function PreviewModal({
  workflow,
  open,
  onClose,
  onCustomize,
}: {
  workflow: WorkflowType | null;
  open: boolean;
  onClose: () => void;
  onCustomize: (w: WorkflowType) => void;
}) {
  if (!workflow) return null;

  const bucket = getCategoryBucket(workflow.category);
  const colors = bucketColors[bucket] || bucketColors.sequential;
  const pattern = patternFromWorkflow(workflow);
  const instances = getInstancesForWorkflow(workflow.id);
  const totalRuns = workflow.usageCount;
  const errorRate = (100 - workflow.successRate).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-3xl p-0 overflow-hidden gap-0"
        style={{ backgroundColor: '#0C1117', borderRadius: '16px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className="border-0" style={{ backgroundColor: colors.bg, color: colors.text, borderRadius: '20px', padding: '4px 12px' }}>
              {getCategoryLabel(workflow.category)}
            </Badge>
            <Badge variant="outline" className="border-0 capitalize" style={{ backgroundColor: 'rgba(61,220,151,0.1)', color: '#3DDC97', borderRadius: '20px', padding: '4px 12px' }}>
              {workflow.type}
            </Badge>
            <Badge variant="outline" className="border-0" style={{ backgroundColor: 'rgba(167,139,250,0.12)', color: '#A78BFA', borderRadius: '20px', padding: '4px 12px' }}>
              {pattern}
            </Badge>
          </div>
          <DialogTitle style={{ fontSize: '1.5rem', fontWeight: 500, color: '#F0F2F5' }}>
            {workflow.name}
          </DialogTitle>
          <p style={{ fontSize: '0.875rem', color: '#8B95A5', marginTop: '4px' }}>{workflow.description}</p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 pb-6 space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total Runs', value: totalRuns.toLocaleString(), icon: Play, color: '#3DDC97' },
                { label: 'Success Rate', value: `${workflow.successRate}%`, icon: CheckCircle, color: '#5B8DEF' },
                { label: 'Avg Duration', value: workflow.avgExecutionTime, icon: Clock, color: '#F5A623' },
                { label: 'Error Rate', value: `${errorRate}%`, icon: AlertTriangle, color: '#EF4444' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg p-4" style={{ backgroundColor: '#070A0E', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <stat.icon size={16} style={{ color: stat.color, marginBottom: '8px' }} />
                  <div className="font-mono" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#F0F2F5' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#4A5568', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Agent Flow Diagram */}
            <div>
              <h4 className="mb-3 font-medium" style={{ color: '#F0F2F5', fontSize: '1rem' }}>Agent Flow</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {workflow.steps.map((step, i) => {
                  const agent = getAgentById(step.agentId);
                  return (
                    <div key={step.agentId + step.order} className="flex items-center gap-2">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08, ease: easeDefault }}
                        className="flex items-center gap-2 rounded-lg px-4 py-3"
                        style={{ backgroundColor: '#070A0E', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div
                          className="flex items-center justify-center rounded-full"
                          style={{ width: '32px', height: '32px', backgroundColor: `${colors.text}20`, color: colors.text, fontSize: '0.625rem', fontWeight: 600, flexShrink: 0 }}
                        >
                          {(agent?.name || step.agentId).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#F0F2F5' }}>{agent?.name || step.agentId}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#4A5568', fontFamily: 'var(--font-mono)' }}>
                            {step.role}
                          </div>
                        </div>
                      </motion.div>
                      {i < workflow.steps.length - 1 && <ChevronRight size={20} style={{ color: '#4A5568' }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Instances */}
            {instances.length > 0 && (
              <div>
                <h4 className="mb-3 font-medium" style={{ color: '#F0F2F5', fontSize: '1rem' }}>Active Instances</h4>
                <div className="space-y-2">
                  {instances.map((inst) => (
                    <div key={inst.id} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: '#070A0E', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Badge variant="outline" className="text-[0.625rem] border-0 capitalize"
                        style={{
                          backgroundColor: inst.status === 'running' ? 'rgba(91,141,239,0.15)' : inst.status === 'completed' ? 'rgba(61,220,151,0.15)' : 'rgba(239,68,68,0.15)',
                          color: inst.status === 'running' ? '#5B8DEF' : inst.status === 'completed' ? '#3DDC97' : '#EF4444',
                          borderRadius: '20px',
                          padding: '2px 8px',
                        }}
                      >
                        {inst.status}
                      </Badge>
                      <span className="font-mono text-xs" style={{ color: '#4A5568' }}>{inst.id}</span>
                      <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${inst.progress}%`, backgroundColor: inst.status === 'completed' ? '#3DDC97' : '#5B8DEF' }} />
                      </div>
                      <span className="font-mono text-xs" style={{ color: '#8B95A5' }}>{inst.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal Output Preview */}
            <div>
              <h4 className="mb-2 font-medium" style={{ color: '#F0F2F5', fontSize: '1rem' }}>Output Preview</h4>
              <div
                className="rounded-lg p-4 font-mono"
                style={{ backgroundColor: '#070A0E', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8125rem', color: '#8B95A5', lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span style={{ color: '#3DDC97' }}>$</span> <span style={{ color: '#A78BFA' }}>valtheron</span> workflow run --template {workflow.id} --agents {workflow.steps.length}<br />
                <span style={{ color: '#4A5568' }}>─────────────────────────────────────────</span><br />
                <span style={{ color: '#5B8DEF' }}>[INFO]</span> Initializing {workflow.steps.length} agents...<br />
                <span style={{ color: '#5B8DEF' }}>[INFO]</span> Pattern: <span style={{ color: '#F0F2F5' }}>{pattern}</span><br />
                {workflow.steps.map((step, i) => {
                  const agent = getAgentById(step.agentId);
                  return (
                    <span key={step.agentId + step.order}>
                      <span style={{ color: '#5B8DEF' }}>[INFO]</span> <span style={{ color: '#F5A623' }}>{'>'}</span> {agent?.name || step.agentId}: <span style={{ color: '#3DDC97' }}>✓</span> {step.role}<br />
                    </span>
                  );
                })}
                <span style={{ color: '#4A5568' }}>─────────────────────────────────────────</span><br />
                <span style={{ color: '#3DDC97' }}>✓ SUCCESS</span> Workflow completed in {workflow.avgExecutionTime}<br />
                <span style={{ color: '#4A5568' }}>{'>'}</span> Output: /workspace/outputs/{workflow.id}-result.json<br />
                <span style={{ color: '#4A5568' }}>{'>'}</span> Next run: scheduled (cron)<br />
              </div>
            </div>

            {/* Agent Sequence Table */}
            <div>
              <h4 className="mb-3 font-medium" style={{ color: '#F0F2F5', fontSize: '1rem' }}>Agent Sequence</h4>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <Table>
                  <TableHeader>
                    <TableRow style={{ backgroundColor: '#070A0E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <TableHead style={{ color: '#4A5568', fontSize: '0.75rem' }}>Step</TableHead>
                      <TableHead style={{ color: '#4A5568', fontSize: '0.75rem' }}>Agent</TableHead>
                      <TableHead style={{ color: '#4A5568', fontSize: '0.75rem' }}>Role</TableHead>
                      <TableHead style={{ color: '#4A5568', fontSize: '0.75rem' }}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflow.steps.map((step, i) => {
                      const agent = getAgentById(step.agentId);
                      return (
                        <TableRow key={step.agentId + step.order} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <TableCell className="font-mono" style={{ color: '#4A5568', fontSize: '0.8125rem' }}>{i + 1}</TableCell>
                          <TableCell style={{ color: '#F0F2F5', fontSize: '0.8125rem' }}>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center rounded-full" style={{ width: '24px', height: '24px', backgroundColor: `${colors.text}20`, color: colors.text, fontSize: '0.5625rem', fontWeight: 600 }}>
                                {(agent?.name || step.agentId).slice(0, 2).toUpperCase()}
                              </div>
                              {agent?.name || step.agentId}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-0" style={{ backgroundColor: 'rgba(61,220,151,0.15)', color: '#3DDC97', borderRadius: '20px', padding: '2px 10px', fontSize: '0.6875rem' }}>
                              {step.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1" style={{ color: '#3DDC97', fontSize: '0.8125rem' }}>
                              <CheckCircle size={12} /> Ready
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button
            className="flex-1 gap-1 font-medium"
            style={{ backgroundColor: '#3DDC97', color: '#070A0E', borderRadius: '8px', fontWeight: 600 }}
            onClick={() => { onClose(); onCustomize(workflow); }}
          >
            <Settings2 size={14} />
            Customize Workflow
          </Button>
          <Button variant="outline" className="flex-1 font-medium gap-1" style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5', backgroundColor: 'transparent', borderRadius: '8px' }} onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─── */
export default function Templates() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'uses' | 'success'>('name');
  const [customizeWorkflow, setCustomizeWorkflow] = useState<WorkflowType | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [previewWorkflow, setPreviewWorkflow] = useState<WorkflowType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  /* Filter pills dynamic counts */
  const filterCounts = useMemo(() => {
    const templates = workflowsData.filter((w) => w.isTemplate);
    return {
      all: templates.length,
      content: templates.filter((w) => getCategoryBucket(w.category) === 'content').length,
      data: templates.filter((w) => getCategoryBucket(w.category) === 'data').length,
      code: templates.filter((w) => getCategoryBucket(w.category) === 'code').length,
      sequential: templates.filter((w) => w.type === 'sequential').length,
      hierarchical: templates.filter((w) => w.type === 'hierarchical').length,
      debate: templates.filter((w) => w.type === 'debate').length,
      parallel: templates.filter((w) => w.type === 'parallel').length,
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    let result = workflowsData.filter((w) => w.isTemplate);

    if (activeFilter !== 'all') {
      if (activeFilter === 'content' || activeFilter === 'data' || activeFilter === 'code') {
        result = result.filter((w) => getCategoryBucket(w.category) === activeFilter);
      } else {
        result = result.filter((w) => w.type === activeFilter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.steps.some((s) => s.agentId.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)) ||
          w.category.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'uses') {
      result.sort((a, b) => b.usageCount - a.usageCount);
    } else if (sortBy === 'success') {
      result.sort((a, b) => b.successRate - a.successRate);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [activeFilter, searchQuery, sortBy]);

  const handleCustomize = useCallback((w: WorkflowType) => {
    setCustomizeWorkflow(w);
    setCustomizeOpen(true);
  }, []);

  const handlePreview = useCallback((w: WorkflowType) => {
    setPreviewWorkflow(w);
    setPreviewOpen(true);
  }, []);

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: easeDefault }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '2rem', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#F0F2F5' }}>
            Workflow Templates
          </h2>
          <p className="mt-1" style={{ fontSize: '0.875rem', color: '#8B95A5' }}>
            291 agents × 16 categories × 5 patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-1 font-medium" style={{ backgroundColor: '#3DDC97', color: '#070A0E', borderRadius: '8px', fontWeight: 600 }}>
            <Plus size={16} /> Create New
          </Button>
          <Button variant="outline" className="gap-1 font-medium" style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5', backgroundColor: 'transparent', borderRadius: '8px' }}>
            <Upload size={16} /> Import
          </Button>
        </div>
      </motion.div>

      {/* Search + Sort + Filter Pills */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05, ease: easeDefault }} className="flex flex-col gap-4 mb-6">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterPills.map((filter, i) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.key;
            const count = filterCounts[filter.key] || 0;
            return (
              <motion.button
                key={filter.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.1 + i * 0.04, ease: easeDefault }}
                onClick={() => setActiveFilter(filter.key)}
                className="flex items-center gap-2 transition-all"
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 500 : 400,
                  backgroundColor: isActive ? '#3DDC97' : '#121821',
                  color: isActive ? '#070A0E' : '#8B95A5',
                }}
                whileHover={!isActive ? { backgroundColor: '#1a2433', color: '#F0F2F5' } : {}}
              >
                <Icon size={14} />
                {filter.label}
                <span className="ml-1 rounded-full px-2 py-0.5" style={{ backgroundColor: isActive ? 'rgba(7,10,14,0.2)' : '#0C1117', color: isActive ? '#070A0E' : '#4A5568', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)' }}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5568' }} />
            <Input
              placeholder="Search templates, agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              style={{ backgroundColor: '#0C1117', borderColor: 'rgba(255,255,255,0.06)', color: '#F0F2F5', borderRadius: '8px', height: '36px', fontSize: '0.875rem' }}
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="gap-1" style={{ backgroundColor: '#0C1117', borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5', borderRadius: '8px', height: '36px', fontSize: '0.875rem' }}>
              <ArrowUpDown size={14} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: '#141E2B' }}>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="uses">Most Used</SelectItem>
              <SelectItem value="success">Success Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Template Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter + searchQuery + sortBy}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {filteredTemplates.map((workflow, index) => (
            <TemplateCard key={workflow.id} workflow={workflow} index={index} onCustomize={handleCustomize} onPreview={handlePreview} />
          ))}

          {/* Create Custom Card */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, delay: filteredTemplates.length * 0.05, ease: easeDefault }}
            className="flex flex-col items-center justify-center gap-3 min-h-[380px] transition-colors"
            style={{
              backgroundColor: 'transparent',
              border: '2px dashed rgba(255,255,255,0.08)',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
            whileHover={{ borderColor: 'rgba(61,220,151,0.3)', backgroundColor: 'rgba(61,220,151,0.02)' }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: '48px', height: '48px', backgroundColor: 'rgba(61,220,151,0.1)', color: '#3DDC97' }}
            >
              <Plus size={24} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#8B95A5' }}>Create Custom Workflow</span>
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* Customize Sheet */}
      <CustomizeSheet workflow={customizeWorkflow} open={customizeOpen} onClose={() => setCustomizeOpen(false)} />

      {/* Preview Modal */}
      <PreviewModal workflow={previewWorkflow} open={previewOpen} onClose={() => setPreviewOpen(false)} onCustomize={handleCustomize} />
    </div>
  );
}
