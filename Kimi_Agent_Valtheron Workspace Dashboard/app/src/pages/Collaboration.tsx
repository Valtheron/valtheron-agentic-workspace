import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, GitBranch, Radio, MessageSquare, Users, Eye,
  Search, Star, CheckCircle, Clock, Send, Bot,
  ThumbsUp, ThumbsDown, Check, X, Reply,
  MessageSquareText, Trash2,
  UserPlus, Activity, Workflow as WorkflowIcon, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { workflowsData, activityFeedData, agentsData, teamMembers } from '@/lib/mockData';
import type { Workflow as WorkflowType, ActivityEvent, Agent, TeamMember } from '@/lib/mockData';

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

/* ─── Colors ─── */
const categoryColors: Record<string, string> = {
  GES: '#A78BFA', ANA: '#5B8DEF', MKT: '#F5A623', PRO: '#3DDC97',
  ENT: '#A78BFA', ETR: '#5B8DEF', LEH: '#F5A623', SCH: '#3DDC97',
  ECO: '#5B8DEF', DEV: '#F5A623', SYS: '#3DDC97', OPS: '#5B8DEF',
  CRE: '#A78BFA', RES: '#5B8DEF', LEG: '#F5A623', MED: '#3DDC97',
};

const presenceColors: Record<string, string> = {
  online: '#3DDC97',
  away: '#F5A623',
  offline: '#4A5568',
};

const roleBadgeColors: Record<string, string> = {
  Owner: '#A78BFA',
  Admin: '#5B8DEF',
  Editor: '#3DDC97',
  Viewer: '#6B7280',
};

/* ─── Helpers ─── */
const _getAgentById = (id: string): Agent | undefined => agentsData.find((a) => a.id === id);

const getMemberById = (id: string): TeamMember | undefined => {
  const map: Record<string, TeamMember> = {};
  teamMembers.forEach((m) => { map[m.id] = m; });
  return map[id];
};

const formatTimestamp = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date('2025-01-20T15:00:00Z');
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
};

const formatLastActive = (iso: string): string => formatTimestamp(iso);

const formatTimeAgo = (iso: string): string => formatTimestamp(iso);

/* ─── Share status for a workflow ─── */
const getShareStatus = (wf: WorkflowType): 'Public' | 'Team' | 'Private' => {
  if (wf.sharedWith.length >= 5) return 'Public';
  if (wf.sharedWith.length >= 2) return 'Team';
  return 'Private';
};

/* ─── Generate initials from name ─── */
const getInitials = (name: string): string =>
  name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

/* ─── Generate deterministic color from string ─── */
const stringColor = (str: string): string => {
  const colors = ['#3DDC97', '#5B8DEF', '#A78BFA', '#F5A623', '#EF4444', '#3DD4C7'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

/* ═══════════════════════════════════════════════════════════════════════════
   LOCAL COMMENT DATA (8 threaded discussions)
   ═══════════════════════════════════════════════════════════════════════════ */
interface CommentReply {
  id: string;
  author: { name: string; initials: string; color: string };
  text: string;
  time: string;
}

interface CommentThread {
  id: string;
  author: { name: string; initials: string; color: string; role: string };
  text: string;
  workflowName: string;
  time: string;
  resolved: boolean;
  reactions: { emoji: string; count: number; users: string[] }[];
  replies: CommentReply[];
}

const initialComments: CommentThread[] = [
  {
    id: 'CT-001', author: { name: 'Klaus Schmidt', initials: 'KS', color: '#3DDC97', role: 'Owner' },
    text: 'The Finanzberichts-Pipeline output formatting needs adjustment for the new board template. Can we align the Q4 columns with the revised layout?',
    workflowName: 'Finanzberichts-Pipeline', time: '2h ago', resolved: false,
    reactions: [{ emoji: 'thumbsUp', count: 2, users: ['elena.weber', 'thomas.mueller'] }],
    replies: [
      { id: 'CR-001', author: { name: 'Elena Weber', initials: 'EW', color: '#5B8DEF' }, text: 'Agreed — I will update the formatter module by EOD.', time: '1h ago' },
    ],
  },
  {
    id: 'CT-002', author: { name: 'Elena Weber', initials: 'EW', color: '#5B8DEF', role: 'Admin' },
    text: 'Code Review & Deploy workflow is failing on the license check step. LEG-003 seems to timeout on large repositories.',
    workflowName: 'Code Review & Deploy', time: '4h ago', resolved: true,
    reactions: [{ emoji: 'check', count: 1, users: ['klaus.schmidt'] }],
    replies: [
      { id: 'CR-002', author: { name: 'Thomas Mueller', initials: 'TM', color: '#A78BFA' }, text: 'Increased timeout to 120s and added incremental scanning.', time: '3h ago' },
      { id: 'CR-003', author: { name: 'Klaus Schmidt', initials: 'KS', color: '#3DDC97' }, text: 'Confirmed fix on the latest run. Marking resolved.', time: '2h ago' },
    ],
  },
  {
    id: 'CT-003', author: { name: 'Sophie Krause', initials: 'SK', color: '#F5A623', role: 'Viewer' },
    text: 'Should we add a rollback trigger to the Notfall-Response Workflow? Currently it only escalates forward.',
    workflowName: 'Notfall-Response Workflow', time: '5h ago', resolved: false,
    reactions: [{ emoji: 'thumbsUp', count: 1, users: ['anna.fischer'] }],
    replies: [],
  },
  {
    id: 'CT-004', author: { name: 'Max Meyer', initials: 'MM', color: '#3DDC97', role: 'Editor' },
    text: 'The Marktanalyse Workflow is producing inconsistent results when ECO-002 data source is delayed. Need a fallback mechanism.',
    workflowName: 'Marktanalyse Workflow', time: '6h ago', resolved: false,
    reactions: [],
    replies: [
      { id: 'CR-004', author: { name: 'Anna Fischer', initials: 'AF', color: '#A78BFA' }, text: 'We could cache the last known good dataset for up to 30 minutes.', time: '5h ago' },
    ],
  },
  {
    id: 'CT-005', author: { name: 'Anna Fischer', initials: 'AF', color: '#A78BFA', role: 'Editor' },
    text: 'Content-Produktionsfluss parallel execution is excellent. Can we extend this pattern to the Kreativ-Brainstorming workflow?',
    workflowName: 'Content-Produktionsfluss', time: '8h ago', resolved: true,
    reactions: [{ emoji: 'thumbsUp', count: 3, users: ['klaus.schmidt', 'elena.weber', 'max.meyer'] }],
    replies: [
      { id: 'CR-005', author: { name: 'Klaus Schmidt', initials: 'KS', color: '#3DDC97' }, text: 'Good idea — I have added it to the backlog for sprint 14.', time: '7h ago' },
    ],
  },
  {
    id: 'CT-006', author: { name: 'Thomas Mueller', initials: 'TM', color: '#A78BFA', role: 'Admin' },
    text: 'Sicherheitsaudit compliance report should include Forseti dimension scores. Currently only shows raw findings.',
    workflowName: 'Sicherheitsaudit Workflow', time: '10h ago', resolved: false,
    reactions: [{ emoji: 'thumbsUp', count: 1, users: ['sophie.krause'] }],
    replies: [],
  },
  {
    id: 'CT-007', author: { name: 'Klaus Schmidt', initials: 'KS', color: '#3DDC97', role: 'Owner' },
    text: 'The Klinischer Entscheidungsprozess needs stricter HIPAA validation on MED-002 data access. Please review before next deployment.',
    workflowName: 'Klinischer Entscheidungsprozess', time: '12h ago', resolved: true,
    reactions: [{ emoji: 'check', count: 2, users: ['thomas.mueller', 'anna.fischer'] }],
    replies: [
      { id: 'CR-006', author: { name: 'Thomas Mueller', initials: 'TM', color: '#A78BFA' }, text: 'Added field-level encryption and audit logging.', time: '11h ago' },
      { id: 'CR-007', author: { name: 'Anna Fischer', initials: 'AF', color: '#A78BFA' }, text: 'Validated with the compliance team. All green.', time: '10h ago' },
    ],
  },
  {
    id: 'CT-008', author: { name: 'Max Meyer', initials: 'MM', color: '#3DDC97', role: 'Editor' },
    text: 'Bildungskurs Erstellung assessment generation is too verbose. Can we add a max_tokens constraint to SCH-002?',
    workflowName: 'Bildungskurs Erstellung', time: '1d ago', resolved: false,
    reactions: [{ emoji: 'thumbsDown', count: 1, users: ['sophie.krause'] }],
    replies: [
      { id: 'CR-008', author: { name: 'Sophie Krause', initials: 'SK', color: '#F5A623' }, text: 'Actually I prefer the detailed output for training materials.', time: '20h ago' },
    ],
  },
  {
    id: 'CT-009', author: { name: 'Elena Weber', initials: 'EW', color: '#5B8DEF', role: 'Admin' },
    text: 'Forseti-Review Debatte workflow should auto-archive completed sessions after 30 days. Disk usage is growing.',
    workflowName: 'Forseti-Review Debatte', time: '1d ago', resolved: false,
    reactions: [],
    replies: [],
  },
  {
    id: 'CT-010', author: { name: 'Sophie Krause', initials: 'SK', color: '#F5A623', role: 'Viewer' },
    text: 'Can we get read-only access to the Forschungsdaten-Pipeline outputs? Would help with cross-referencing in the weekly report.',
    workflowName: 'Forschungsdaten-Pipeline', time: '2d ago', resolved: true,
    reactions: [{ emoji: 'thumbsUp', count: 1, users: ['klaus.schmidt'] }],
    replies: [
      { id: 'CR-009', author: { name: 'Klaus Schmidt', initials: 'KS', color: '#3DDC97' }, text: 'Granted read access to Viewer role on research outputs.', time: '1d ago' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Shared Workflow Card ─── */
function SharedWorkflowCard({ workflow, index }: { workflow: WorkflowType; index: number }) {
  const catColor = categoryColors[workflow.category] || '#8B95A5';
  const creator = getMemberById(workflow.creator);
  const [starred, setStarred] = useState(false);
  const shareStatus = getShareStatus(workflow);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: easeDefault }}
      className="group flex flex-col overflow-hidden"
      style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}
      whileHover={{ y: -4, boxShadow: '0 0 30px rgba(61,220,151,0.06), 0 12px 40px rgba(0,0,0,0.3)', borderColor: 'rgba(61,220,151,0.2)' }}
    >
      {/* Top row: owner + star */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-full" style={{ width: '28px', height: '28px', backgroundColor: stringColor(creator?.name || workflow.creator) + '25', color: stringColor(creator?.name || workflow.creator), fontSize: '0.6875rem', fontWeight: 600 }}>
            {creator ? getInitials(creator.name) : getInitials(workflow.creator)}
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#F0F2F5', fontWeight: 500 }}>
            {creator?.name || workflow.creator}
          </span>
        </div>
        <button onClick={() => setStarred(!starred)} className="rounded-lg p-1.5 transition-colors hover:bg-white/5">
          <Star size={16} style={{ color: starred ? '#F5A623' : '#4A5568', fill: starred ? '#F5A623' : 'none' }} />
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs font-medium border-0" style={{ backgroundColor: `${catColor}20`, color: catColor, borderRadius: '20px', padding: '4px 10px' }}>
          {workflow.category}
        </Badge>
        <Badge variant="outline" className="text-xs font-medium border-0 capitalize" style={{ backgroundColor: shareStatus === 'Public' ? 'rgba(61,220,151,0.15)' : shareStatus === 'Team' ? 'rgba(91,141,239,0.15)' : 'rgba(107,114,128,0.15)', color: shareStatus === 'Public' ? '#3DDC97' : shareStatus === 'Team' ? '#5B8DEF' : '#6B7280', borderRadius: '20px', padding: '4px 10px' }}>
          {shareStatus}
        </Badge>
        <Badge variant="outline" className="text-xs font-medium border-0 capitalize" style={{ backgroundColor: 'rgba(61,220,151,0.1)', color: '#3DDC97', borderRadius: '20px', padding: '4px 10px' }}>
          {workflow.type}
        </Badge>
      </div>

      {/* Title */}
      <h4 className="font-medium truncate" style={{ fontSize: '1.0625rem', fontWeight: 500, color: '#F0F2F5' }}>{workflow.name}</h4>

      {/* Description */}
      <p className="mt-1 line-clamp-2" style={{ fontSize: '0.8125rem', color: '#8B95A5', lineHeight: 1.5 }}>{workflow.description}</p>

      {/* Modified */}
      <p className="mt-2" style={{ fontSize: '0.75rem', color: '#4A5568' }}>Modified {formatTimeAgo(workflow.createdAt)}</p>

      {/* Collaborator avatars + shared count */}
      <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center">
          {workflow.sharedWith.slice(0, 4).map((uid: string, i: number) => {
            const m = getMemberById(uid);
            return (
              <div key={uid} className="flex items-center justify-center rounded-full text-[0.625rem] font-semibold" style={{ width: '28px', height: '28px', backgroundColor: stringColor(m?.name || uid) + '30', color: stringColor(m?.name || uid), border: '2px solid #0C1117', marginLeft: i > 0 ? '-8px' : '0', zIndex: 4 - i }}>
                {m ? getInitials(m.name) : getInitials(uid)}
              </div>
            );
          })}
          {workflow.sharedWith.length > 4 && (
            <div className="flex items-center justify-center rounded-full text-[0.625rem] font-medium" style={{ width: '28px', height: '28px', backgroundColor: '#121821', color: '#8B95A5', border: '2px solid #0C1117', marginLeft: '-8px' }}>
              +{workflow.sharedWith.length - 4}
            </div>
          )}
        </div>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: '#4A5568' }}>
          {workflow.sharedWith.length} shares
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Activity Type Icon ─── */
function ActivityTypeIcon({ type }: { type: string }) {
  const colors: Record<string, string> = { workflow: '#3DDC97', agent: '#5B8DEF', comment: '#A78BFA', system: '#F5A623', security: '#EF4444' };
  const color = colors[type] || '#4A5568';
  return (
    <div className="flex items-center justify-center rounded-md flex-shrink-0" style={{ width: '28px', height: '28px', backgroundColor: `${color}15`, color }}>
      {type === 'workflow' ? <WorkflowIcon size={14} /> : type === 'agent' ? <Bot size={14} /> : type === 'comment' ? <MessageSquare size={14} /> : type === 'security' ? <AlertTriangle size={14} /> : <Activity size={14} />}
    </div>
  );
}

/* ─── Activity Item ─── */
function ActivityItem({ event, index, isNew = false }: { event: ActivityEvent; index: number; isNew?: boolean }) {
  const actionColors: Record<string, string> = { completed: '#3DDC97', resolved: '#3DDC97', submitted: '#5B8DEF', published: '#A78BFA', optimized: '#3DDC97', generated: '#5B8DEF', detected: '#EF4444', triggered: '#F5A623', reviewed: '#A78BFA', updated: '#5B8DEF', blocked: '#EF4444', published2: '#3DDC97', created: '#3DDC97' };
  const words = event.action.split(' ');
  const actionColor = actionColors[words[words.length - 1]] || '#8B95A5';

  return (
    <motion.div
      initial={{ opacity: 0, y: isNew ? -8 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: isNew ? 0 : index * 0.04, ease: easeDefault }}
      className="flex items-start gap-3 p-3 rounded-lg transition-colors"
      style={{ backgroundColor: isNew ? 'rgba(61,220,151,0.04)' : 'transparent', borderLeft: isNew ? '2px solid #3DDC97' : '2px solid transparent' }}
      whileHover={{ backgroundColor: '#121821' }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: '36px', height: '36px', backgroundColor: stringColor(event.agentName) + '25', color: stringColor(event.agentName), fontSize: '0.75rem', fontWeight: 600 }}>
        {getInitials(event.agentName)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#F0F2F5' }}>{event.agentName}</span>
          <span style={{ fontSize: '0.8125rem', color: actionColor, fontWeight: 500 }}>{event.action}</span>
          <span style={{ fontSize: '0.8125rem', color: '#5B8DEF', fontWeight: 500 }}>&quot;{event.target}&quot;</span>
        </div>
        {event.details && (
          <p className="mt-0.5" style={{ fontSize: '0.75rem', color: '#8B95A5' }}>{event.details}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span style={{ fontSize: '0.6875rem', color: '#4A5568' }}>{formatTimestamp(event.timestamp)}</span>
          <Badge variant="outline" className="text-[0.625rem] border-0 capitalize" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#4A5568', borderRadius: '4px', padding: '1px 6px' }}>
            {event.type}
          </Badge>
        </div>
      </div>

      {/* Type icon */}
      <ActivityTypeIcon type={event.type} />
    </motion.div>
  );
}

/* ─── Presence Dot ─── */
function PresenceDot({ presence, size = 8 }: { presence: string; size?: number }) {
  return (
    <span className="inline-block rounded-full flex-shrink-0" style={{ width: size, height: size, backgroundColor: presenceColors[presence] || '#4A5568', boxShadow: presence === 'online' ? `0 0 6px ${presenceColors[presence]}80` : 'none' }} />
  );
}

/* ─── Online Member Row ─── */
function OnlineMemberRow({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.08, ease: easeDefault }}
      className="flex items-center gap-3 px-2 py-3 rounded-lg transition-colors cursor-pointer"
      whileHover={{ backgroundColor: '#121821' }}
    >
      <div className="relative flex-shrink-0">
        <div className="flex items-center justify-center rounded-full" style={{ width: '32px', height: '32px', backgroundColor: stringColor(member.name) + '25', color: stringColor(member.name), fontSize: '0.75rem', fontWeight: 600 }}>
          {getInitials(member.name)}
        </div>
        <div className="absolute bottom-0 right-0 rounded-full" style={{ width: '10px', height: '10px', backgroundColor: presenceColors[member.status], border: '2px solid #0C1117' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#F0F2F5' }}>{member.name}</span>
          <Badge variant="outline" className="text-[0.625rem] border-0" style={{ backgroundColor: `${roleBadgeColors[member.role]}15`, color: roleBadgeColors[member.role], borderRadius: '20px', padding: '1px 8px', fontSize: '0.625rem' }}>
            {member.role}
          </Badge>
        </div>
        <div className="truncate" style={{ fontSize: '0.75rem', color: '#4A5568' }}>
          {member.status === 'online' ? 'Active now' : member.status === 'away' ? 'Away' : `Last active ${formatLastActive(member.lastActive)}`}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Reply Block ─── */
function ReplyBlock({ reply }: { reply: CommentReply }) {
  return (
    <div className="flex items-start gap-2 py-2">
      <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: '28px', height: '28px', backgroundColor: reply.author.color + '25', color: reply.author.color, fontSize: '0.625rem', fontWeight: 600 }}>
        {reply.author.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#F0F2F5' }}>{reply.author.name}</span>
          <span style={{ fontSize: '0.6875rem', color: '#4A5568' }}>{reply.time}</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#8B95A5', lineHeight: 1.4 }}>{reply.text}</p>
      </div>
    </div>
  );
}

/* ─── Comment Block ─── */
function CommentBlock({ thread, index, onToggleResolve, onToggleReaction }: { thread: CommentThread; index: number; onToggleResolve: (id: string) => void; onToggleReaction: (id: string, emoji: string) => void }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const reactionTypes = ['thumbsUp', 'thumbsDown', 'check', 'x'] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: easeDefault }}
      className="rounded-xl"
      style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: '36px', height: '36px', backgroundColor: thread.author.color + '25', color: thread.author.color, fontSize: '0.75rem', fontWeight: 600 }}>
          {thread.author.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#F0F2F5' }}>{thread.author.name}</span>
            <Badge variant="outline" className="text-[0.625rem] border-0" style={{ backgroundColor: `${roleBadgeColors[thread.author.role]}15`, color: roleBadgeColors[thread.author.role], borderRadius: '20px', padding: '1px 8px' }}>
              {thread.author.role}
            </Badge>
            <span style={{ fontSize: '0.75rem', color: '#4A5568' }}>{thread.time}</span>
            <Badge variant="outline" className="text-xs border-0 gap-1" style={{ backgroundColor: thread.resolved ? 'rgba(61,220,151,0.15)' : 'rgba(245,166,35,0.15)', color: thread.resolved ? '#3DDC97' : '#F5A623', borderRadius: '20px', padding: '2px 8px' }}>
              {thread.resolved ? <CheckCircle size={10} /> : <Clock size={10} />}
              {thread.resolved ? 'Resolved' : 'Open'}
            </Badge>
          </div>

          {/* Context link */}
          <Badge variant="outline" className="mt-1 mb-1 text-xs border-0" style={{ backgroundColor: 'rgba(91,141,239,0.12)', color: '#5B8DEF', borderRadius: '4px', padding: '2px 8px', fontSize: '0.6875rem' }}>
            <Bot size={10} className="mr-1" />
            {thread.workflowName}
          </Badge>

          {/* Text */}
          <p className="mt-1" style={{ fontSize: '0.875rem', color: '#F0F2F5', lineHeight: 1.5 }}>{thread.text}</p>

          {/* Actions: reactions + reply + resolve */}
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            {reactionTypes.map((rtype) => {
              const existing = thread.reactions.find((r) => r.emoji === rtype);
              const count = existing?.count || 0;
              const hasReacted = existing?.users.includes('current.user') || false;
              return (
                <button
                  key={rtype}
                  onClick={() => onToggleReaction(thread.id, rtype)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors"
                  style={{ backgroundColor: hasReacted ? 'rgba(61,220,151,0.12)' : 'transparent', color: hasReacted ? '#3DDC97' : '#4A5568', fontSize: '0.75rem', border: '1px solid', borderColor: hasReacted ? 'rgba(61,220,151,0.2)' : 'transparent' }}
                >
                  {rtype === 'thumbsUp' && <ThumbsUp size={12} />}
                  {rtype === 'thumbsDown' && <ThumbsDown size={12} />}
                  {rtype === 'check' && <Check size={12} />}
                  {rtype === 'x' && <X size={12} />}
                  {count > 0 && <span>{count}</span>}
                </button>
              );
            })}

            <div className="w-px h-4 mx-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

            <button onClick={() => setReplyOpen(!replyOpen)} className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors" style={{ color: replyOpen ? '#3DDC97' : '#4A5568', fontSize: '0.75rem' }}>
              <Reply size={12} /> Reply
            </button>
            <button onClick={() => onToggleResolve(thread.id)} className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors" style={{ color: thread.resolved ? '#3DDC97' : '#4A5568', fontSize: '0.75rem' }}>
              <CheckCircle size={12} /> {thread.resolved ? 'Unresolve' : 'Resolve'}
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {thread.replies.length > 0 && (
        <div className="mt-3 ml-5 pl-4" style={{ borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
          {thread.replies.map((reply) => <ReplyBlock key={reply.id} reply={reply} />)}
        </div>
      )}

      {/* Reply Input */}
      <AnimatePresence>
        {replyOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: easeDefault }}
            className="mt-3 ml-5 pl-4 overflow-hidden"
            style={{ borderLeft: '2px solid rgba(255,255,255,0.06)' }}
          >
            <Textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[60px] text-sm"
              style={{ backgroundColor: '#121821', borderColor: 'rgba(255,255,255,0.06)', color: '#F0F2F5', borderRadius: '8px', resize: 'none' }}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <Button size="sm" variant="ghost" style={{ color: '#4A5568', fontSize: '0.75rem', height: '28px' }} onClick={() => { setReplyOpen(false); setReplyText(''); }}>
                Cancel
              </Button>
              <Button size="sm" style={{ backgroundColor: '#3DDC97', color: '#070A0E', fontSize: '0.75rem', height: '28px', borderRadius: '6px', fontWeight: 600 }}>
                Reply
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Members Table Row ─── */
function MemberTableRow({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: easeDefault }}
      className="transition-colors"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      whileHover={{ backgroundColor: '#121821' }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="flex items-center justify-center rounded-full" style={{ width: '32px', height: '32px', backgroundColor: stringColor(member.name) + '25', color: stringColor(member.name), fontSize: '0.75rem', fontWeight: 600 }}>
              {getInitials(member.name)}
            </div>
            <div className="absolute bottom-0 right-0 rounded-full" style={{ width: '8px', height: '8px', backgroundColor: presenceColors[member.status], border: '2px solid #0C1117' }} />
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#F0F2F5' }}>{member.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline" className="text-xs border-0" style={{ backgroundColor: `${roleBadgeColors[member.role]}15`, color: roleBadgeColors[member.role], borderRadius: '20px', padding: '4px 10px' }}>
          {member.role}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <PresenceDot presence={member.status} />
          <span style={{ fontSize: '0.8125rem', color: '#8B95A5', textTransform: 'capitalize' }}>{member.status}</span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono" style={{ fontSize: '0.8125rem', color: '#F0F2F5' }}>{member.workflowsShared}</td>
      <td className="px-4 py-3" style={{ fontSize: '0.8125rem', color: '#8B95A5' }}>{formatLastActive(member.lastActive)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" style={{ color: '#4A5568' }}><Eye size={14} /></Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" style={{ color: '#4A5568' }}><MessageSquareText size={14} /></Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-red-400" style={{ color: '#4A5568' }}><Trash2 size={14} /></Button>
        </div>
      </td>
    </motion.tr>
  );
}

/* ─── Animated Tab Underline ─── */
function AnimatedTabs({ activeTab, onChange }: { activeTab: string; onChange: (tab: string) => void }) {
  const tabs = [
    { key: 'shared-workflows', label: 'Shared Workflows', icon: GitBranch },
    { key: 'live-activity', label: 'Live Activity', icon: Radio },
    { key: 'comments', label: 'Comments', icon: MessageSquare },
    { key: 'members', label: 'Members', icon: Users },
  ];

  return (
    <div className="flex items-center gap-0 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="relative flex items-center gap-2 px-5 py-3 transition-colors"
            style={{ color: isActive ? '#3DDC97' : '#8B95A5', fontSize: '0.875rem', fontWeight: isActive ? 500 : 400 }}
          >
            <Icon size={16} />
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0"
                style={{ height: '2px', backgroundColor: '#3DDC97', boxShadow: '0 -2px 8px rgba(61,220,151,0.4)' }}
                transition={{ duration: 0.25, ease: easeDefault }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Simulated Activity Generator ─── */
function generateSimulatedActivity(): ActivityEvent {
  const actions = ['completed deployment of', 'generated report for', 'resolved incident', 'optimized workflow', 'triggered auto-scaling for', 'reviewed compliance of', 'published content for', 'analyzed data for'];
  const targets = ['API Gateway v3.2.1', 'Q1-2025 Ausblick', 'Incident #4022', 'Checkout Flow v2.1', 'Database Cluster', 'Security Audit', 'Content Pipeline', 'Market Analysis'];
  const agentNames = ['CodeGen Weber', 'Schmidt Analytik', 'RunFriedrich', 'Koch Bildung', 'SecHofmann', 'Berger Makro', 'TextLehmann', 'Bauer Fertigung'];
  const types: ActivityEvent['type'][] = ['workflow', 'agent', 'system', 'comment', 'security'];

  return {
    id: `EVT-${Date.now()}`,
    type: types[Math.floor(Math.random() * types.length)],
    agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    target: targets[Math.floor(Math.random() * targets.length)],
    timestamp: new Date().toISOString(),
    severity: 'low',
    details: 'Auto-generated activity from real-time feed simulation.',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Collaboration() {
  const [activeTab, setActiveTab] = useState('shared-workflows');
  const [liveActivities, setLiveActivities] = useState<ActivityEvent[]>([...activityFeedData].reverse());
  const [comments, setComments] = useState<CommentThread[]>(initialComments);
  const [memberFilter, setMemberFilter] = useState('');
  const [commentFilter, setCommentFilter] = useState('all');
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest'>('newest');
  const [activityFilter, setActivityFilter] = useState('all');
  const [newCommentText, setNewCommentText] = useState('');
  const [showNewCommentForm, setShowNewCommentForm] = useState(false);

  /* Simulated real-time updates every 15s */
  useEffect(() => {
    if (activeTab !== 'live-activity') return;
    const interval = setInterval(() => {
      const newEvent = generateSimulatedActivity();
      setLiveActivities((prev) => [newEvent, ...prev].slice(0, 25));
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleToggleResolve = useCallback((id: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)));
  }, []);

  const handleToggleReaction = useCallback((id: string, emoji: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const reactions = [...c.reactions];
        const idx = reactions.findIndex((r) => r.emoji === emoji);
        if (idx >= 0) {
          const users = reactions[idx].users.includes('current.user')
            ? reactions[idx].users.filter((u) => u !== 'current.user')
            : [...reactions[idx].users, 'current.user'];
          const count = users.length;
          if (count === 0) reactions.splice(idx, 1);
          else reactions[idx] = { ...reactions[idx], users, count };
        } else {
          reactions.push({ emoji, count: 1, users: ['current.user'] });
        }
        return { ...c, reactions };
      })
    );
  }, []);

  const filteredComments = useMemo(() => {
    let result = [...comments];
    if (commentFilter === 'unresolved') result = result.filter((c) => !c.resolved);
    if (commentFilter === 'resolved') result = result.filter((c) => c.resolved);
    if (commentSort === 'oldest') result.reverse();
    return result;
  }, [comments, commentFilter, commentSort]);

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return liveActivities;
    return liveActivities.filter((a) => a.type === activityFilter);
  }, [liveActivities, activityFilter]);

  const onlineCount = teamMembers.filter((m) => m.status === 'online').length;

  const filteredMembers = useMemo(() => {
    if (!memberFilter.trim()) return teamMembers;
    return teamMembers.filter((m) => m.name.toLowerCase().includes(memberFilter.toLowerCase()));
  }, [memberFilter]);

  const sharedWorkflows = useMemo(() => workflowsData.filter((w) => w.sharedWith.length > 0), []);

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
          <div className="flex items-center gap-3">
            <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '2rem', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#F0F2F5' }}>
              Collaboration Hub
            </h2>
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(61,220,151,0.12)', color: '#3DDC97', fontSize: '0.75rem', fontWeight: 500 }}>
              <span className="inline-block rounded-full" style={{ width: '7px', height: '7px', backgroundColor: '#3DDC97', boxShadow: '0 0 6px rgba(61,220,151,0.5)' }} />
              {onlineCount} members online
            </span>
          </div>
          <p className="mt-1" style={{ fontSize: '0.875rem', color: '#8B95A5' }}>
            291 agents · 16 categories · 5 collaboration patterns
          </p>
        </div>
        <Button className="gap-1 font-medium" style={{ backgroundColor: '#3DDC97', color: '#070A0E', borderRadius: '8px', fontWeight: 600 }}>
          <Plus size={16} /> New Session
        </Button>
      </motion.div>

      {/* Animated Tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05, ease: easeDefault }}>
        <AnimatedTabs activeTab={activeTab} onChange={setActiveTab} />

        <AnimatePresence mode="wait">
          {/* ── Tab: Shared Workflows ── */}
          {activeTab === 'shared-workflows' && (
            <motion.div
              key="sw-grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: easeDefault }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {sharedWorkflows.map((workflow, index) => (
                <SharedWorkflowCard key={workflow.id} workflow={workflow} index={index} />
              ))}
            </motion.div>
          )}

          {/* ── Tab: Live Activity ── */}
          {activeTab === 'live-activity' && (
            <motion.div
              key="la-grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: easeDefault }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-5"
            >
              {/* Activity Feed (70%) */}
              <div className="lg:col-span-8">
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Live line animation */}
                  <div className="relative" style={{ height: '2px' }}>
                    <motion.div className="absolute inset-0" style={{ backgroundColor: '#3DDC97' }} animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium" style={{ fontSize: '1.125rem', color: '#F0F2F5' }}>Activity Feed</h4>
                      <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ backgroundColor: 'rgba(61,220,151,0.15)', color: '#3DDC97', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)' }}>
                        <span className="inline-block rounded-full" style={{ width: '5px', height: '5px', backgroundColor: '#3DDC97' }} />
                        LIVE
                      </span>
                    </div>
                    <Select value={activityFilter} onValueChange={setActivityFilter}>
                      <SelectTrigger className="h-8 text-xs w-32" style={{ backgroundColor: '#121821', borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: '#141E2B' }}>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="workflow">Workflows</SelectItem>
                        <SelectItem value="agent">Agents</SelectItem>
                        <SelectItem value="comment">Comments</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Feed */}
                  <ScrollArea className="px-3 py-2" style={{ maxHeight: '650px' }}>
                    <AnimatePresence initial={false}>
                      <div className="space-y-1">
                        {filteredActivities.map((event, index) => (
                          <ActivityItem key={event.id} event={event} index={index} isNew={index === 0 && !!event.timestamp && new Date().getTime() - new Date(event.timestamp).getTime() < 30000} />
                        ))}
                      </div>
                    </AnimatePresence>
                  </ScrollArea>
                </div>
              </div>

              {/* Who's Online (30%) */}
              <div className="lg:col-span-4">
                <div className="rounded-xl overflow-hidden sticky" style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)', top: '16px' }}>
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <h4 className="font-medium" style={{ fontSize: '1.125rem', color: '#F0F2F5' }}>Who&apos;s Online</h4>
                      <p className="mt-0.5 flex items-center gap-1.5" style={{ fontSize: '0.75rem', color: '#4A5568' }}>
                        <PresenceDot presence="online" />
                        <span style={{ color: '#3DDC97' }}>{onlineCount} online</span>
                        <span style={{ color: '#4A5568' }}>·</span>
                        <span>{teamMembers.length} total</span>
                      </p>
                    </div>
                  </div>

                  <div className="px-3 py-2">
                    {teamMembers.map((member, index) => (
                      <OnlineMemberRow key={member.id} member={member} index={index} />
                    ))}
                  </div>

                  <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Button size="sm" variant="outline" className="w-full gap-1" style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5', backgroundColor: 'transparent', borderRadius: '8px' }}>
                      <UserPlus size={14} /> Invite Member
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Tab: Comments ── */}
          {activeTab === 'comments' && (
            <motion.div
              key="comments-grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: easeDefault }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative"
            >
              {/* Comment Threads (main) */}
              <div className="lg:col-span-8">
                <div className="rounded-xl overflow-hidden flex flex-col" style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)', maxHeight: 'calc(100dvh - 200px)' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 className="font-medium" style={{ fontSize: '1.125rem', color: '#F0F2F5' }}>Discussion Threads</h4>
                    <div className="flex items-center gap-2">
                      <Select value={commentFilter} onValueChange={setCommentFilter}>
                        <SelectTrigger className="h-8 text-xs w-32" style={{ backgroundColor: '#121821', borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: '#141E2B' }}>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="unresolved">Unresolved</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={commentSort} onValueChange={(v) => setCommentSort(v as typeof commentSort)}>
                        <SelectTrigger className="h-8 text-xs w-28" style={{ backgroundColor: '#121821', borderColor: 'rgba(255,255,255,0.06)', color: '#8B95A5' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: '#141E2B' }}>
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Comment List */}
                  <ScrollArea className="flex-1 px-4 py-4">
                    <div className="space-y-4">
                      {filteredComments.map((thread, index) => (
                        <CommentBlock key={thread.id} thread={thread} index={index} onToggleResolve={handleToggleResolve} onToggleReaction={handleToggleReaction} />
                      ))}
                    </div>
                  </ScrollArea>

                  {/* New Comment Input */}
                  <div className="px-4 py-3 flex items-start gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: '32px', height: '32px', backgroundColor: 'rgba(61,220,151,0.15)', color: '#3DDC97', fontSize: '0.75rem', fontWeight: 600 }}>
                      ME
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        placeholder="Add a comment..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        style={{ backgroundColor: '#121821', borderColor: 'rgba(255,255,255,0.06)', color: '#F0F2F5', borderRadius: '20px', height: '36px', fontSize: '0.875rem' }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && newCommentText.trim()) setNewCommentText(''); }}
                      />
                      {newCommentText.trim() && (
                        <Button size="sm" className="h-8 w-8 p-0 rounded-full flex-shrink-0" style={{ backgroundColor: '#3DDC97' }} onClick={() => setNewCommentText('')}>
                          <Send size={14} style={{ color: '#070A0E' }} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side panel */}
              <div className="lg:col-span-4">
                <div className="rounded-xl overflow-hidden sticky" style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)', top: '16px' }}>
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 className="font-medium" style={{ fontSize: '1.125rem', color: '#F0F2F5' }}>Quick Stats</h4>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Total Threads', value: comments.length, color: '#5B8DEF' },
                        { label: 'Unresolved', value: comments.filter((c) => !c.resolved).length, color: '#F5A623' },
                        { label: 'Resolved', value: comments.filter((c) => c.resolved).length, color: '#3DDC97' },
                        { label: 'Replies', value: comments.reduce((sum, c) => sum + c.replies.length, 0), color: '#A78BFA' },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#070A0E', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 600, color: stat.color }}>{stat.value}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#4A5568', marginTop: '4px' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating New Comment button */}
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full px-4 py-3 font-medium text-sm"
                style={{ backgroundColor: '#3DDC97', color: '#070A0E', boxShadow: '0 4px 20px rgba(61,220,151,0.3)', zIndex: 50 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewCommentForm(!showNewCommentForm)}
              >
                <Plus size={16} /> New Comment
              </motion.button>
            </motion.div>
          )}

          {/* ── Tab: Members ── */}
          {activeTab === 'members' && (
            <motion.div
              key="members-grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: easeDefault }}
            >
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <h4 className="font-medium" style={{ fontSize: '1.125rem', color: '#F0F2F5' }}>Team Members</h4>
                    <p style={{ fontSize: '0.75rem', color: '#4A5568', marginTop: '2px' }}>{teamMembers.length} members · {onlineCount} online</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5568' }} />
                      <Input
                        placeholder="Search members..."
                        value={memberFilter}
                        onChange={(e) => setMemberFilter(e.target.value)}
                        className="pl-8"
                        style={{ backgroundColor: '#121821', borderColor: 'rgba(255,255,255,0.06)', color: '#F0F2F5', borderRadius: '8px', height: '36px', fontSize: '0.875rem', width: '200px' }}
                      />
                    </div>
                    <Button size="sm" className="gap-1 font-medium" style={{ backgroundColor: '#3DDC97', color: '#070A0E', borderRadius: '8px', height: '36px', fontWeight: 600 }}>
                      <UserPlus size={14} /> Invite
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#070A0E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <TableHead style={{ color: '#4A5568', fontSize: '0.75rem', fontWeight: 500 }}>Member</TableHead>
                        <TableHead style={{ color: '#4A5568', fontSize: '0.75rem', fontWeight: 500 }}>Role</TableHead>
                        <TableHead style={{ color: '#4A5568', fontSize: '0.75rem', fontWeight: 500 }}>Status</TableHead>
                        <TableHead style={{ color: '#4A5568', fontSize: '0.75rem', fontWeight: 500 }}>Workflows Shared</TableHead>
                        <TableHead style={{ color: '#4A5568', fontSize: '0.75rem', fontWeight: 500 }}>Last Active</TableHead>
                        <TableHead style={{ color: '#4A5568', fontSize: '0.75rem', fontWeight: 500 }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member, index) => (
                        <MemberTableRow key={member.id} member={member} index={index} />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredMembers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Search size={32} style={{ color: '#4A5568', marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.875rem', color: '#8B95A5' }}>No members found matching &quot;{memberFilter}&quot;</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
