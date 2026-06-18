import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Shield,
  Zap,
  Heart,
  Eye,
  AlertTriangle,
  Smile,
  Code,
  Timer,
  AlignLeft,
  RefreshCw,
  Target,
  Database,
  Lock,
  Key,
  Network,
  Brain,
  Search,
  Plus,
  RotateCcw,
  Play,
  Save,
  ChevronDown,
  ChevronRight,
  Circle,
  Users,
  Activity,
  Award,
  Check,
  Server,
  Bot,
  ShieldCheck,
  Flame,
  Lightbulb,
  Crown,
  Microscope,
  ScrollText,
  Info,
  FileCheck,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type {
  Agent,
  AgentCategory,
  CertLevel,
  PersonalityProfile,
  PersonalityArchetype,
  CertificationLevel,
  PresetConfig,
} from '@/lib/mockData';
import {
  agentsData,
  personalityData,
  certificationData,
  llmProvidersData,
  presets as defaultPresets,
} from '@/lib/mockData';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface ForsetiConfig {
  InformationAccess: number;
  ResourceControl: number;
  AuthorityPermission: number;
  NetworkPosition: number;
  SynthesisApplication: number;
}

interface LLMConfigState {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
}

type TabValue = 'personality' | 'forseti' | 'llm' | 'certification';
type PreviewStatus = 'saved' | 'modified' | 'testing';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const CATEGORY_CONFIG: Record<AgentCategory, { color: string; label: string }> = {
  GES: { color: '#EC4899', label: 'Gesellschaft' },
  ANA: { color: '#06B6D4', label: 'Analysis' },
  MKT: { color: '#F97316', label: 'Marketing' },
  PRO: { color: '#10B981', label: 'Production' },
  ENT: { color: '#8B5CF6', label: 'Entrepreneurship' },
  ETR: { color: '#EAB308', label: 'E-Commerce' },
  LEH: { color: '#6366F1', label: 'Lehre' },
  SCH: { color: '#EF4444', label: 'Schule' },
  ECO: { color: '#22C55E', label: 'Economy' },
  DEV: { color: '#3B82F6', label: 'Development' },
  SYS: { color: '#64748B', label: 'Systems' },
  OPS: { color: '#F59E0B', label: 'Operations' },
  CRE: { color: '#D946EF', label: 'Creative' },
  RES: { color: '#14B8A6', label: 'Research' },
  LEG: { color: '#FB7185', label: 'Legal' },
  MED: { color: '#0EA5E9', label: 'Medical' },
};

const PERSONALITY_PARAMS: {
  key: keyof PersonalityProfile;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { key: 'formality', label: 'Formality', description: 'Degree of formal language and protocol adherence', icon: Shield, color: '#8B5CF6' },
  { key: 'creativity', label: 'Creativity', description: 'Novel idea generation and unconventional thinking', icon: Sparkles, color: '#A78BFA' },
  { key: 'assertiveness', label: 'Assertiveness', description: 'Confidence and directness in communication', icon: Zap, color: '#F97316' },
  { key: 'empathy', label: 'Empathy', description: 'Emotional awareness and compassionate responses', icon: Heart, color: '#EC4899' },
  { key: 'detailOrientation', label: 'Detail Orientation', description: 'Precision and thoroughness in analysis', icon: Eye, color: '#06B6D4' },
  { key: 'riskTolerance', label: 'Risk Tolerance', description: 'Willingness to take unconventional approaches', icon: AlertTriangle, color: '#EF4444' },
  { key: 'humor', label: 'Humor', description: 'Lightheartedness and wit in responses', icon: Smile, color: '#F5A623' },
  { key: 'technicalDepth', label: 'Technical Depth', description: 'Level of jargon and technical specificity', icon: Code, color: '#3B82F6' },
  { key: 'pace', label: 'Pace', description: 'Response speed and conciseness', icon: Timer, color: '#10B981' },
  { key: 'verbosity', label: 'Verbosity', description: 'Response length and word count preference', icon: AlignLeft, color: '#8B95A5' },
  { key: 'adaptability', label: 'Adaptability', description: 'Flexibility to adjust style mid-conversation', icon: RefreshCw, color: '#14B8A6' },
  { key: 'domainFocus', label: 'Domain Focus', description: 'Specialization depth vs general knowledge', icon: Target, color: '#D946EF' },
];

const FORSETI_PARAM_MAP: {
  key: keyof ForsetiConfig;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { key: 'InformationAccess', label: 'Information Access', description: 'Controls which data sources the agent can read — from internal wikis to real-time market data. Higher values = broader access.', icon: Database, color: '#3B82F6' },
  { key: 'ResourceControl', label: 'Resource Control', description: 'Regulates compute resources, memory, and bandwidth. Influences response speed and processing depth.', icon: Lock, color: '#F59E0B' },
  { key: 'AuthorityPermission', label: 'Authority & Permission', description: 'Determines which actions the agent can autonomously execute. From read-only to full workflow control.', icon: Key, color: '#10B981' },
  { key: 'NetworkPosition', label: 'Network Position', description: 'Defines interaction rights with other agents and external systems. Higher values = more collaboration.', icon: Network, color: '#8B5CF6' },
  { key: 'SynthesisApplication', label: 'Synthesis & Application', description: 'Controls ability to synthesize results and integrate into other workflows/systems.', icon: Brain, color: '#EC4899' },
];

const ARCHETYPE_ICONS: Record<string, LucideIcon> = {
  Visionary: Flame,
  Analyst: Microscope,
  Diplomat: Heart,
  Strategist: Target,
  Guardian: ShieldCheck,
  Innovator: Lightbulb,
  Executor: Zap,
  Sage: Crown,
};

const CERT_LEVELS_ORDER: CertLevel[] = [
  'UNCERTIFIED',
  'TECHNICAL_VALID',
  'FORSETI_VERIFIED',
  'EXPERT_REVIEWED',
  'FIELD_TESTED',
  'CERTIFIED_PROFESSIONAL',
];

const CERT_ICONS: LucideIcon[] = [Circle, FileCheck, ShieldCheck, Users, Activity, Award];

const DEFAULT_PERSONALITY: Record<keyof PersonalityProfile, number> = {
  formality: 50,
  creativity: 50,
  assertiveness: 50,
  empathy: 50,
  detailOrientation: 50,
  riskTolerance: 30,
  humor: 30,
  technicalDepth: 50,
  pace: 50,
  verbosity: 40,
  adaptability: 60,
  domainFocus: 50,
};

const DEFAULT_FORSETI: ForsetiConfig = {
  InformationAccess: 5,
  ResourceControl: 5,
  AuthorityPermission: 5,
  NetworkPosition: 5,
  SynthesisApplication: 5,
};

const DEFAULT_LLM: LLMConfigState = {
  provider: 'Anthropic',
  model: 'claude-sonnet-4-20250514',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: 'You are a helpful AI assistant. Provide accurate, well-reasoned responses.',
};

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getCategoryColor(cat: AgentCategory): string {
  return CATEGORY_CONFIG[cat]?.color ?? '#3B82F6';
}

function _getCategoryLabel(cat: AgentCategory): string {
  return CATEGORY_CONFIG[cat]?.label ?? cat;
}

function _scaleFrom01(val01: number, min: number, max: number): number {
  return Math.round(min + val01 * (max - min));
}

function scaleTo01(val: number, min: number, max: number): number {
  return clamp((val - min) / (max - min), 0, 1);
}

function calcPowerLevel(f: ForsetiConfig): number {
  const vals = Object.values(f);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return clamp(Math.round(avg), 1, 10);
}

function getPowerLabel(level: number): string {
  if (level <= 3) return 'Restricted';
  if (level <= 6) return 'Standard';
  if (level <= 8) return 'Elevated';
  return 'System';
}

function getPowerColor(level: number): string {
  if (level <= 3) return '#8B95A5';
  if (level <= 6) return '#3B82F6';
  if (level <= 8) return '#F59E0B';
  return '#EF4444';
}

function certLevelIndex(level: CertLevel): number {
  return CERT_LEVELS_ORDER.indexOf(level);
}

function formatCertLevelName(level: string): string {
  return level.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---- Preview Text Generator ---- */
function generatePreviewText(
  personality: Record<keyof PersonalityProfile, number>,
  agent: Agent,
  _forseti: ForsetiConfig,
  _llm: LLMConfigState
): string {
  const { creativity, formality, technicalDepth, verbosity, humor, assertiveness, empathy, detailOrientation, pace } = personality;

  let output = '';
  output += `> Query: "Analyze current market trends for AI-powered developer tools"\n`;
  output += `> Agent: ${agent.name} (${agent.category})\n`;
  output += `> Mode: ${formality > 60 ? 'Professional' : formality > 30 ? 'Standard' : 'Casual'}\n`;
  output += `${'-'.repeat(50)}\n\n`;

  const points = detailOrientation < 30 ? 2 : detailOrientation < 70 ? 3 : 5;

  const creativeLabels = [
    'Code Generation Revolution',
    'Intelligent Debugging Wave',
    'Automated Refactoring Rush',
    'Natural Language Coding Era',
    'AI Pair Programming Boom',
  ];
  const standardLabels = [
    'Code Generation & Completion',
    'Automated Debugging & Testing',
    'Code Review & Refactoring',
    'Natural Language Interfaces',
    'Developer Productivity Metrics',
  ];
  const technicalLabels = [
    'Neural Code Synthesis via Transformer Architectures',
    'LLM-Powered Static Analysis & Vuln Detection',
    'Abstract Syntax Tree Neural Refactoring',
    'Semantic Code Search & Embeddings',
    'Autoregressive Test Generation with Coverage Optimization',
  ];

  // Intro
  if (verbosity < 20) {
    output += assertiveness > 60 ? `Key trends in AI dev tools:\n\n` : `Here are the key trends:\n\n`;
  } else if (verbosity < 60) {
    if (formality > 60) {
      output += `This analysis examines current market trends in AI-powered developer tools. The following key patterns have been identified:\n\n`;
    } else if (creativity > 60) {
      output += `The AI dev tool landscape is exploding with innovation! Here are the trends shaping the future:\n\n`;
    } else {
      output += `Here are the key market trends in AI-powered developer tools:\n\n`;
    }
  } else {
    if (formality > 60) {
      output += `This comprehensive market analysis provides an in-depth examination of the current state of AI-powered developer tools. The report synthesizes data from multiple industry sources to identify dominant trends and growth vectors:\n\n`;
    } else if (creativity > 60) {
      output += `We're witnessing a renaissance in developer tooling! The convergence of large language models and code intelligence is fundamentally reshaping how software gets built. Here's my take on the trends driving this transformation:\n\n`;
    } else {
      output += `This is a detailed look at the AI developer tool market. I've analyzed the latest data to bring you the most significant trends and developments:\n\n`;
    }
  }

  for (let i = 0; i < points; i++) {
    let label: string;
    if (technicalDepth > 70) {
      label = technicalLabels[i];
    } else if (creativity > 60) {
      label = creativeLabels[i];
    } else {
      label = standardLabels[i];
    }

    output += `${i + 1}. **${label}**`;

    if (detailOrientation > 40) {
      if (technicalDepth > 70) {
        output += ` — Implements ${['transformer', 'graph neural network', 'reinforcement learning', 'semantic embedding', 'generative adversarial'][i]} approaches with measurable efficiency gains.`;
      } else if (creativity > 60) {
        output += ` — A seismic shift transforming how developers interact with their toolchain.`;
      } else {
        output += ` — Growing adoption across enterprise and individual developer segments.`;
      }
    }

    if (detailOrientation > 75) {
      if (technicalDepth > 70) {
        output += ` Benchmarks show ${200 + i * 40}% improvement over traditional methods in controlled studies.`;
      } else {
        output += ` Market data indicates a ${200 + i * 40}% year-over-year growth in this segment.`;
      }
    }
    output += '\n';
  }

  if (personality.riskTolerance > 60) {
    output += '\n⚠ Unconventional Insight:\n';
    if (creativity > 60) {
      output += `The next frontier might be "ambient coding" — AI that operates so seamlessly in the background that the distinction between human and machine-written code becomes irrelevant. Early signals from research labs suggest this could emerge within 18-24 months.\n`;
    } else {
      output += `Consider exploring emerging "ambient coding" platforms that operate with minimal developer intervention as a potential growth area.\n`;
    }
  }

  if (humor > 60 && verbosity > 40) {
    output += `\n💡 On a lighter note — at this rate, we'll soon have AI tools that debug code before we even write the bugs. Which, honestly, would save me a lot of existential dread at 2 AM.\n`;
  }

  if (empathy > 60 && verbosity > 30) {
    output += `\n🤝 For teams just starting their AI journey — these tools can feel overwhelming. Start with one integration, build confidence, and iterate. You've got this.\n`;
  }

  if (pace > 70 && verbosity > 30) {
    output += `\n⚡ Quick note: Speed-to-market is critical. The fastest movers in this space are capturing 3x the developer mindshare of late adopters.\n`;
  }

  output += `\n${'-'.repeat(50)}\n`;
  output += `Generated by ${agent.name} · ${agent.llmProvider} ${agent.llmModel}\n`;
  output += `Personality: ${agent.personality} · Power Level: ${agent.powerLevel}\n`;

  return output;
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function AgentAvatar({ agent, size = 32 }: { agent: Agent; size?: number }) {
  const catColor = getCategoryColor(agent.category);
  const initials = agent.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className="flex items-center justify-center rounded-lg shrink-0 font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: `${catColor}20`,
        color: catColor,
        fontSize: size < 36 ? '0.625rem' : '0.75rem',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {initials}
    </div>
  );
}

function CertBadgeMini({ level }: { level: CertLevel }) {
  const idx = certLevelIndex(level);
  const colors = ['#9CA3AF', '#60A5FA', '#3DDC97', '#F5A623', '#A78BFA', '#EF4444'];
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase"
      style={{
        backgroundColor: `${colors[idx]}15`,
        color: colors[idx],
        border: `1px solid ${colors[idx]}30`,
      }}
    >
      {level === 'UNCERTIFIED' ? '—' : level.slice(0, 3)}
    </span>
  );
}

function MiniParamBars({ personality }: { personality: Record<string, number> }) {
  const keys = ['creativity', 'technicalDepth', 'formality', 'assertiveness', 'empathy'];
  const colors = ['#A78BFA', '#3B82F6', '#8B5CF6', '#F97316', '#EC4899'];
  return (
    <div className="flex items-end gap-1 mt-2">
      {keys.map((k, i) => (
        <div key={k} className="flex flex-col items-center gap-0.5">
          <div
            className="rounded-sm relative overflow-hidden"
            style={{ width: '32px', height: '3px', backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(personality[k] ?? 50)}%` }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{ height: '100%', backgroundColor: colors[i] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Typing Preview (character-by-character) ---- */
function TypingPreview({ text, isTyping }: { text: string; isTyping: boolean }) {
  const [displayed, setDisplayed] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const indexRef = useRef(0);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
    indexRef.current = 0;
    setDisplayed('');

    if (!isTyping) {
      setDisplayed(text);
      return;
    }

    const interval = setInterval(() => {
      if (indexRef.current < textRef.current.length) {
        indexRef.current += 1;
        setDisplayed(textRef.current.slice(0, indexRef.current));
      } else {
        clearInterval(interval);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [text, isTyping]);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <pre
      className="whitespace-pre-wrap break-words"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        lineHeight: 1.6,
        color: 'var(--text-primary)',
        minHeight: '200px',
        maxHeight: '380px',
        overflowY: 'auto',
      }}
    >
      {displayed}
      <span
        style={{
          opacity: cursorVisible ? 1 : 0,
          color: '#3DDC97',
          transition: 'opacity 0.1s',
        }}
      >
        {'|'}
      </span>
    </pre>
  );
}

/* ---- Custom Slider ---- */
function CustomSlider({
  value,
  min,
  max,
  step = 1,
  fillColor,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  fillColor: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative w-full mt-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer"
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          height: '4px',
          background: `linear-gradient(90deg, ${fillColor} ${pct}%, #121821 ${pct}%)`,
          borderRadius: '2px',
          outline: 'none',
        }}
      />
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${fillColor};
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          transition: box-shadow 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 5px ${fillColor}30;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${fillColor};
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

/* ---- Quick Set Pill ---- */
function QuickSetPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="transition-all hover:opacity-80"
      style={{
        backgroundColor: '#121821',
        borderRadius: '4px',
        padding: '3px 10px',
        fontSize: '0.6875rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {label}
    </button>
  );
}

/* ---- Info Tooltip ---- */
function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="ml-1.5 inline-flex" style={{ color: 'var(--text-muted)' }}>
          <Info size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[220px] text-xs"
        style={{
          backgroundColor: '#141E2B',
          color: 'var(--text-secondary)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/* ---- Parameter Card ---- */
function ParameterCard({
  icon: Icon,
  iconColor,
  title,
  description,
  tooltip,
  isModified,
  borderColor,
  children,
  index,
}: {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  tooltip: string;
  isModified: boolean;
  borderColor: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 + index * 0.04, ease: EASE }}
      className="relative rounded-xl p-5 transition-all"
      style={{
        backgroundColor: '#0C1117',
        border: isModified
          ? '1px solid rgba(61,220,151,0.3)'
          : '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${borderColor}`,
        boxShadow: isModified ? '0 0 16px rgba(61,220,151,0.06)' : 'none',
      }}
    >
      {isModified && (
        <span
          className="absolute top-3 right-3 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: 'rgba(61,220,151,0.15)',
            color: '#3DDC97',
            fontFamily: 'var(--font-primary)',
          }}
        >
          Modified
        </span>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: `${iconColor}15`,
          }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h4
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '1rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              {title}
            </h4>
            <InfoTooltip text={tooltip} />
          </div>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginTop: '2px',
            }}
          >
            {description}
          </p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

/* ---- Forseti Dimension Card ---- */
function ForsetiCard({
  icon: Icon,
  iconColor,
  title,
  description,
  value,
  onChange,
  index,
}: {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 + index * 0.07, ease: EASE }}
      className="rounded-xl p-5"
      style={{
        backgroundColor: '#0C1117',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${iconColor}`,
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{ width: '36px', height: '36px', backgroundColor: `${iconColor}15` }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div className="flex-1">
          <h4
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '1rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {description}
          </p>
        </div>
        <span
          className="font-mono text-sm font-semibold"
          style={{ color: iconColor }}
        >
          {value}
        </span>
      </div>
      <CustomSlider
        value={value}
        min={1}
        max={10}
        step={1}
        fillColor={iconColor}
        onChange={onChange}
      />
    </motion.div>
  );
}

/* ---- Certification Step ---- */
function CertificationStep({
  level,
  icon: Icon,
  index,
  currentIndex,
}: {
  level: CertificationLevel;
  icon: LucideIcon;
  index: number;
  currentIndex: number;
}) {
  const isCompleted = index < currentIndex;
  const isCurrent = index === currentIndex;
  const isFuture = index > currentIndex;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.08, ease: EASE }}
      className="flex items-start gap-3"
    >
      {/* Connector line */}
      <div className="flex flex-col items-center shrink-0" style={{ width: '32px' }}>
        <div
          className="flex items-center justify-center rounded-full transition-all"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: isCompleted
              ? 'rgba(61,220,151,0.15)'
              : isCurrent
                ? 'rgba(61,220,151,0.1)'
                : 'rgba(255,255,255,0.04)',
            border: isCompleted
              ? '2px solid #3DDC97'
              : isCurrent
                ? '2px solid rgba(61,220,151,0.5)'
                : '2px solid rgba(255,255,255,0.08)',
          }}
        >
          {isCompleted ? (
            <Check size={18} style={{ color: '#3DDC97' }} />
          ) : (
            <Icon
              size={18}
              style={{ color: isCurrent ? '#3DDC97' : isFuture ? '#4A5568' : '#3DDC97' }}
            />
          )}
        </div>
        {index < 5 && (
          <div
            className="w-px flex-1 min-h-[20px]"
            style={{
              backgroundColor: isCompleted ? '#3DDC97' : 'rgba(255,255,255,0.08)',
              opacity: isCompleted ? 0.5 : 1,
            }}
          />
        )}
      </div>
      {/* Content */}
      <div
        className="flex-1 rounded-lg p-4 transition-all mb-2"
        style={{
          backgroundColor: isCurrent ? 'rgba(61,220,151,0.04)' : 'transparent',
          border: isCurrent ? '1px solid rgba(61,220,151,0.15)' : '1px solid transparent',
          opacity: isFuture ? 0.45 : 1,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <h4
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: isFuture ? '#4A5568' : 'var(--text-primary)',
            }}
          >
            {formatCertLevelName(level.level)}
          </h4>
          {isCurrent && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: 'rgba(61,220,151,0.15)',
                color: '#3DDC97',
              }}
            >
              Current
            </span>
          )}
          {isCompleted && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: 'rgba(61,220,151,0.1)',
                color: '#3DDC97',
              }}
            >
              Passed
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          {level.requirements}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Avg: {level.avgTime} · {level.count} agents
        </p>
      </div>
    </motion.div>
  );
}

/* ---- Preset Card ---- */
function PresetCard({
  preset,
  isActive,
  onClick,
  index,
}: {
  preset: PresetConfig;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.8 + index * 0.06, ease: EASE }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer transition-all shrink-0 relative"
      style={{
        width: '250px',
        minWidth: '250px',
        backgroundColor: '#0C1117',
        borderRadius: '12px',
        padding: '18px',
        border: isActive
          ? '1px solid #3DDC97'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isActive ? '0 0 12px rgba(61,220,151,0.1)' : 'none',
        transform: hovered && !isActive ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div className="flex items-start justify-between mb-1">
        <h4
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          {preset.name}
        </h4>
        {isActive && <Check size={14} style={{ color: '#3DDC97', marginTop: '3px' }} />}
      </div>
      <p
        className="line-clamp-2"
        style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
      >
        {preset.description}
      </p>
      <MiniParamBars personality={preset.personality as unknown as Record<string, number>} />
      <div className="flex items-center justify-between mt-3">
        <span
          style={{
            fontSize: '0.6875rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          {preset.llm.provider} · {preset.llm.model}
        </span>
      </div>
      {hovered && !isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: 'rgba(7,10,14,0.7)' }}
        >
          <span
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: '#3DDC97', color: '#070A0E' }}
          >
            Load
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ---- Archetype Selector ---- */
function ArchetypeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (archetype: PersonalityArchetype) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = personalityData.find((a) => a.name === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all w-full"
        style={{
          backgroundColor: '#121821',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-primary)',
          fontSize: '0.875rem',
        }}
      >
        {selected && (
          <>
            {(() => {
              const AIcon = ARCHETYPE_ICONS[selected.name] || Flame;
              return <AIcon size={16} style={{ color: '#3DDC97' }} />;
            })()}
            <span className="flex-1 text-left">{selected.name}</span>
          </>
        )}
        {!selected && <span className="flex-1 text-left" style={{ color: 'var(--text-muted)' }}>Custom</span>}
        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1 w-full rounded-lg overflow-hidden"
              style={{
                backgroundColor: '#141E2B',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              {personalityData.map((arch) => {
                const AIcon = ARCHETYPE_ICONS[arch.name] || Flame;
                return (
                  <button
                    key={arch.name}
                    onClick={() => {
                      onChange(arch);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 transition-all text-left"
                    style={{
                      backgroundColor: value === arch.name ? 'rgba(61,220,151,0.1)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (value !== arch.name) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (value !== arch.name) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <AIcon size={16} style={{ color: '#8B95A5' }} />
                    <div>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                        }}
                      >
                        {arch.name}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {arch.description.slice(0, 60)}...
                      </div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- New Preset Modal ---- */
function NewPresetModal({
  open,
  onClose,
  onSave,
  personality,
  forseti,
  llm,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (preset: PresetConfig) => void;
  personality: Record<keyof PersonalityProfile, number>;
  forseti: ForsetiConfig;
  llm: LLMConfigState;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setDesc('');
      setError('');
    }
  }, [open]);

  const handleSave = () => {
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    const p01: PersonalityProfile = {} as PersonalityProfile;
    (Object.keys(personality) as Array<keyof PersonalityProfile>).forEach((k) => {
      (p01 as unknown as Record<string, number>)[k] = scaleTo01(personality[k], 0, 100);
    });

    onSave({
      name: name.trim(),
      description: desc.trim() || 'Custom preset',
      personality: p01,
      forseti: { ...forseti },
      llm: {
        provider: llm.provider as 'Anthropic' | 'OpenAI' | 'Ollama' | 'Custom',
        model: llm.model,
        temperature: llm.temperature,
        maxTokens: llm.maxTokens,
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        style={{
          backgroundColor: '#141E2B',
          border: '1px solid rgba(255,255,255,0.08)',
          maxWidth: '520px',
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            New Preset
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--text-secondary)' }}>
            Save the current configuration as a reusable preset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label
              className="block mb-1.5"
              style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}
            >
              Preset Name
            </label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g., Creative Burst"
              style={{
                backgroundColor: '#0C1117',
                borderColor: 'rgba(255,255,255,0.08)',
                color: 'var(--text-primary)',
              }}
            />
            {error && (
              <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{error}</p>
            )}
          </div>
          <div>
            <label
              className="block mb-1.5"
              style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}
            >
              Description
            </label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional description..."
              style={{
                backgroundColor: '#0C1117',
                borderColor: 'rgba(255,255,255,0.08)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: '#3DDC97', color: '#070A0E' }}
          >
            <Save size={14} className="inline mr-1.5" />
            Save Preset
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function Customization() {
  /* ---- State ---- */
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agentsData[0]?.id ?? '');
  const [personality, setPersonality] = useState<Record<keyof PersonalityProfile, number>>({ ...DEFAULT_PERSONALITY });
  const [forseti, setForseti] = useState<ForsetiConfig>({ ...DEFAULT_FORSETI });
  const [llm, setLlm] = useState<LLMConfigState>({ ...DEFAULT_LLM });
  const [archetype, setArchetype] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabValue>('personality');
  const [activePresetName, setActivePresetName] = useState<string>('');
  const [customPresets, setCustomPresets] = useState<PresetConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(CATEGORY_CONFIG))
  );
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('saved');
  const [isTesting, setIsTesting] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [systemPromptChars, setSystemPromptChars] = useState(llm.systemPrompt.length);
  const [certReviewOpen, setCertReviewOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allPresets = useMemo(() => [...defaultPresets, ...customPresets], [customPresets]);

  /* ---- Derived ---- */
  const selectedAgent = useMemo(
    () => agentsData.find((a) => a.id === selectedAgentId) || agentsData[0],
    [selectedAgentId]
  );

  const previewText = useMemo(
    () => generatePreviewText(personality, selectedAgent, forseti, llm),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewKey]
  );

  const powerLevel = useMemo(() => calcPowerLevel(forseti), [forseti]);
  const powerLabel = useMemo(() => getPowerLabel(powerLevel), [powerLevel]);
  const powerColor = useMemo(() => getPowerColor(powerLevel), [powerLevel]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agentsData;
    const q = searchQuery.toLowerCase();
    return agentsData.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const agentsByCategory = useMemo(() => {
    const map = new Map<string, Agent[]>();
    (Object.keys(CATEGORY_CONFIG) as AgentCategory[]).forEach((cat) => map.set(cat, []));
    filteredAgents.forEach((a) => {
      const list = map.get(a.category);
      if (list) list.push(a);
    });
    return map;
  }, [filteredAgents]);

  const anyModified = useMemo(() => {
    return (Object.keys(personality) as Array<keyof PersonalityProfile>).some(
      (k) => personality[k] !== DEFAULT_PERSONALITY[k]
    ) || (Object.keys(forseti) as Array<keyof ForsetiConfig>).some(
      (k) => forseti[k] !== DEFAULT_FORSETI[k]
    );
  }, [personality, forseti]);

  const currentArchetypeName = useMemo(() => {
    if (archetype) return archetype;
    // Check if personality matches any archetype
    const match = personalityData.find((arch) => {
      return (Object.keys(arch.traits) as Array<keyof PersonalityProfile>).every((k) => {
        const expected = Math.round((arch.traits as unknown as Record<string, number>)[k] * 100);
        return Math.abs(personality[k] - expected) < 3;
      });
    });
    return match?.name ?? 'Custom';
  }, [archetype, personality]);

  const currentModels = useMemo(() => {
    const provider = llmProvidersData.find((p) => p.name === llm.provider);
    return provider?.models ?? [];
  }, [llm.provider]);

  /* ---- Callbacks ---- */
  const triggerPreviewUpdate = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewKey((k) => k + 1);
      setIsTyping(true);
      setPreviewStatus('modified');
    }, 300);
  }, []);

  const updatePersonality = useCallback(
    (key: keyof PersonalityProfile, value: number) => {
      setPersonality((prev) => ({ ...prev, [key]: clamp(value, 0, 100) }));
      setArchetype('');
      triggerPreviewUpdate();
    },
    [triggerPreviewUpdate]
  );

  const updateForseti = useCallback(
    (key: keyof ForsetiConfig, value: number) => {
      setForseti((prev) => ({ ...prev, [key]: clamp(value, 1, 10) }));
      triggerPreviewUpdate();
    },
    [triggerPreviewUpdate]
  );

  const updateLLM = useCallback(
    <K extends keyof LLMConfigState>(key: K, value: LLMConfigState[K]) => {
      setLlm((prev) => {
        const next = { ...prev, [key]: value };
        if (key === 'provider') {
          const provider = llmProvidersData.find((p) => p.name === value);
          if (provider && provider.models.length > 0) {
            next.model = provider.models[0];
          }
        }
        return next;
      });
      triggerPreviewUpdate();
    },
    [triggerPreviewUpdate]
  );

  const handleReset = useCallback(() => {
    setPersonality({ ...DEFAULT_PERSONALITY });
    setForseti({ ...DEFAULT_FORSETI });
    setLlm({ ...DEFAULT_LLM });
    setArchetype('');
    setActivePresetName('');
    setPreviewStatus('saved');
    triggerPreviewUpdate();
  }, [triggerPreviewUpdate]);

  const handleApplyArchetype = useCallback(
    (arch: PersonalityArchetype) => {
      setArchetype(arch.name);
      const next: Record<keyof PersonalityProfile, number> = { ...personality };
      Object.entries(arch.traits).forEach(([k, v]) => {
        const key = k as keyof PersonalityProfile;
        if (key in next) {
          next[key] = Math.round((v as number) * 100);
        }
      });
      setPersonality(next);
      triggerPreviewUpdate();
    },
    [personality, triggerPreviewUpdate]
  );

  const handleLoadPreset = useCallback(
    (preset: PresetConfig) => {
      setActivePresetName(preset.name);
      const p100: Record<keyof PersonalityProfile, number> = { ...DEFAULT_PERSONALITY };
      Object.entries(preset.personality).forEach(([k, v]) => {
        const key = k as keyof PersonalityProfile;
        if (key in p100) {
          p100[key] = Math.round((v as number) * 100);
        }
      });
      setPersonality(p100);
      setForseti({ ...preset.forseti });
      // Find matching archetype
      const match = personalityData.find((a) => {
        return (Object.keys(a.traits) as Array<keyof PersonalityProfile>).every((tk) =>
          Math.abs((a.traits as unknown as Record<string, number>)[tk] - ((preset.personality as unknown as Record<string, number>)[tk] ?? 0)) < 0.05
        );
      });
      setArchetype(match?.name ?? '');
      triggerPreviewUpdate();
    },
    [triggerPreviewUpdate]
  );

  const handleSaveNewPreset = useCallback(
    (preset: PresetConfig) => {
      setCustomPresets((prev) => [...prev, preset]);
      setActivePresetName(preset.name);
    },
    []
  );

  const handleTestAgent = useCallback(() => {
    setIsTesting(true);
    setPreviewStatus('testing');
    setTimeout(() => {
      setIsTesting(false);
      setPreviewStatus('saved');
      setPreviewKey((k) => k + 1);
      setIsTyping(true);
    }, 2000);
  }, []);

  const handleSaveConfig = useCallback(() => {
    setPreviewStatus('saved');
  }, []);

  const toggleCategory = useCallback((catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  /* ---- Effects ---- */
  useEffect(() => {
    setSystemPromptChars(llm.systemPrompt.length);
  }, [llm.systemPrompt]);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#070A0E', fontFamily: 'var(--font-primary)' }}
    >
      {/* ======================== HEADER ======================== */}
      <header className="px-6 py-5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Agent Customization
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                marginTop: '4px',
              }}
            >
              {agentsData.length} agents · {Object.keys(CATEGORY_CONFIG).length} categories · {PERSONALITY_PARAMS.length} personality parameters
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)',
              }}
            >
              <Plus size={14} />
              New Preset
            </button>
          </motion.div>
        </div>
      </header>

      {/* ======================== 3-COLUMN LAYOUT ======================== */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 73px - 180px)' }}>
        {/* ---- LEFT COLUMN: Agent Selector (280px) ---- */}
        <aside
          className="shrink-0 border-r overflow-hidden flex flex-col"
          style={{
            width: '280px',
            borderColor: 'rgba(255,255,255,0.06)',
            backgroundColor: '#070A0E',
          }}
        >
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: '#0C1117',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontFamily: 'var(--font-primary)',
                }}
              />
            </div>
          </div>

          {/* Category Accordions */}
          <ScrollArea className="flex-1">
            <div className="px-2 pb-4">
              {(Object.entries(CATEGORY_CONFIG) as [AgentCategory, { color: string; label: string }][]).map(([catId, config]) => {
                const agents = agentsByCategory.get(catId) ?? [];
                if (agents.length === 0 && searchQuery) return null;
                const isExpanded = expandedCategories.has(catId);

                return (
                  <Collapsible
                    key={catId}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(catId)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-all"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <div
                          className="rounded-full shrink-0"
                          style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: config.color,
                          }}
                        />
                        <span
                          className="flex-1 text-left text-sm font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {config.label}
                        </span>
                        <span
                          className="text-xs font-mono"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {agents.length}
                        </span>
                        {isExpanded ? (
                          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                        ) : (
                          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-4">
                        {agents.map((agent) => {
                          const isSel = agent.id === selectedAgentId;
                          const statusColors: Record<string, string> = {
                            active: '#3DDC97',
                            idle: '#F5A623',
                            busy: '#3B82F6',
                            error: '#EF4444',
                            standby: '#8B95A5',
                            deprecated: '#4A5568',
                          };
                          const statusColor = statusColors[agent.status] || '#4A5568';

                          return (
                            <motion.button
                              key={agent.id}
                              onClick={() => setSelectedAgentId(agent.id)}
                              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg transition-all mb-0.5"
                              style={{
                                backgroundColor: isSel ? 'rgba(61,220,151,0.06)' : 'transparent',
                                borderLeft: isSel ? '3px solid #3DDC97' : '3px solid transparent',
                                boxShadow: isSel ? '0 0 12px rgba(61,220,151,0.08)' : 'none',
                              }}
                              whileHover={{ backgroundColor: isSel ? 'rgba(61,220,151,0.1)' : 'rgba(255,255,255,0.03)' }}
                            >
                              <AgentAvatar agent={agent} size={28} />
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="text-sm truncate"
                                    style={{
                                      color: isSel ? '#3DDC97' : 'var(--text-primary)',
                                      fontWeight: isSel ? 500 : 400,
                                    }}
                                  >
                                    {agent.id} {agent.name}
                                  </span>
                                  <span
                                    className="rounded-full shrink-0"
                                    style={{
                                      width: '6px',
                                      height: '6px',
                                      backgroundColor: statusColor,
                                    }}
                                  />
                                </div>
                              </div>
                              <CertBadgeMini level={agent.certificationLevel} />
                            </motion.button>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* ---- CENTER: Configuration Panel ---- */}
        <main className="flex-1 overflow-y-auto">
          {/* Selected Agent Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(12,17,23,0.5)' }}
          >
            <div className="flex items-center gap-3">
              <AgentAvatar agent={selectedAgent} size={44} />
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {selectedAgent.name}
                  </h3>
                  <span
                    className="text-xs font-mono"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {selectedAgent.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-medium uppercase"
                    style={{
                      backgroundColor: `${getCategoryColor(selectedAgent.category)}20`,
                      color: getCategoryColor(selectedAgent.category),
                      border: `1px solid ${getCategoryColor(selectedAgent.category)}30`,
                    }}
                  >
                    {selectedAgent.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {selectedAgent.role}
                  </span>
                  {activePresetName && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: 'rgba(91,141,239,0.1)',
                        color: '#5B8DEF',
                      }}
                    >
                      {activePresetName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: anyModified ? 'rgba(239,68,68,0.1)' : 'transparent',
                  color: anyModified ? '#EF4444' : 'var(--text-muted)',
                  border: anyModified ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <RotateCcw size={12} />
                Reset to Default
              </button>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="px-5 pt-4 pb-8">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList
                className="mb-4"
                style={{ backgroundColor: '#121821', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <TabsTrigger
                  value="personality"
                  className="text-xs"
                  style={{
                    color: activeTab === 'personality' ? '#F0F2F5' : '#8B95A5',
                    backgroundColor: activeTab === 'personality' ? '#0C1117' : 'transparent',
                  }}
                >
                  <Sparkles size={13} className="mr-1.5" />
                  Personality
                </TabsTrigger>
                <TabsTrigger
                  value="forseti"
                  className="text-xs"
                  style={{
                    color: activeTab === 'forseti' ? '#F0F2F5' : '#8B95A5',
                    backgroundColor: activeTab === 'forseti' ? '#0C1117' : 'transparent',
                  }}
                >
                  <Shield size={13} className="mr-1.5" />
                  Forseti Power
                </TabsTrigger>
                <TabsTrigger
                  value="llm"
                  className="text-xs"
                  style={{
                    color: activeTab === 'llm' ? '#F0F2F5' : '#8B95A5',
                    backgroundColor: activeTab === 'llm' ? '#0C1117' : 'transparent',
                  }}
                >
                  <Server size={13} className="mr-1.5" />
                  LLM Config
                </TabsTrigger>
                <TabsTrigger
                  value="certification"
                  className="text-xs"
                  style={{
                    color: activeTab === 'certification' ? '#F0F2F5' : '#8B95A5',
                    backgroundColor: activeTab === 'certification' ? '#0C1117' : 'transparent',
                  }}
                >
                  <Award size={13} className="mr-1.5" />
                  Certification
                </TabsTrigger>
              </TabsList>

              {/* ---- TAB 1: PERSONALITY ---- */}
              <TabsContent value="personality" className="mt-0">
                <div className="space-y-4">
                  {/* Archetype Selector */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-5"
                    style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Archetype
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Select an archetype to auto-configure all 12 personality parameters
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: 'rgba(61,220,151,0.3)',
                          color: '#3DDC97',
                          backgroundColor: 'rgba(61,220,151,0.08)',
                        }}
                      >
                        {currentArchetypeName}
                      </Badge>
                    </div>
                    <ArchetypeSelector
                      value={currentArchetypeName === 'Custom' ? '' : currentArchetypeName}
                      onChange={handleApplyArchetype}
                    />
                  </motion.div>

                  {/* 12 Parameter Cards in 3-col grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {PERSONALITY_PARAMS.map((param, i) => {
                      const value = personality[param.key];
                      const isModified = value !== DEFAULT_PERSONALITY[param.key];

                      return (
                        <ParameterCard
                          key={param.key}
                          icon={param.icon}
                          iconColor={param.color}
                          title={param.label}
                          description={param.description}
                          tooltip={param.description}
                          isModified={isModified}
                          borderColor={param.color}
                          index={i}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="font-mono text-sm font-semibold"
                              style={{ color: param.color }}
                            >
                              {value}
                            </span>
                            <div className="flex gap-1.5">
                              <QuickSetPill
                                label="Low"
                                onClick={() => updatePersonality(param.key, 15)}
                              />
                              <QuickSetPill
                                label="Medium"
                                onClick={() => updatePersonality(param.key, 50)}
                              />
                              <QuickSetPill
                                label="High"
                                onClick={() => updatePersonality(param.key, 85)}
                              />
                            </div>
                          </div>
                          <CustomSlider
                            value={value}
                            min={0}
                            max={100}
                            fillColor={param.color}
                            onChange={(v) => updatePersonality(param.key, v)}
                          />
                        </ParameterCard>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* ---- TAB 2: FORSETI POWER ---- */}
              <TabsContent value="forseti" className="mt-0">
                <div className="pb-6 space-y-4 max-w-3xl">
                  {/* Power Level Display */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-5 rounded-xl p-5"
                    style={{
                      backgroundColor: '#0C1117',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl shrink-0"
                      style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: `${powerColor}15`,
                      }}
                    >
                      <span
                        className="font-mono text-3xl font-bold"
                        style={{ color: powerColor }}
                      >
                        {powerLevel}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="text-base font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Forseti Power Level
                        </h3>
                        <Badge
                          style={{
                            backgroundColor: `${powerColor}15`,
                            color: powerColor,
                            border: `1px solid ${powerColor}30`,
                          }}
                        >
                          {powerLabel}
                        </Badge>
                      </div>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
                      >
                        Calculated from 5 dimension scores. Higher levels grant broader system
                        access and decision-making authority. Range: 1-10.
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {[
                          { label: 'Restricted', min: 1, color: '#8B95A5' },
                          { label: 'Standard', min: 4, color: '#3B82F6' },
                          { label: 'Elevated', min: 7, color: '#F59E0B' },
                          { label: 'Admin', min: 9, color: '#EF4444' },
                          { label: 'System', min: 10, color: '#DC2626' },
                        ].map((tier) => (
                          <span
                            key={tier.label}
                            className="px-2 py-0.5 rounded text-[10px] font-mono uppercase"
                            style={{
                              backgroundColor: `${tier.color}15`,
                              color: tier.color,
                              border: `1px solid ${tier.color}30`,
                              opacity: powerLevel >= tier.min ? 1 : 0.3,
                            }}
                          >
                            {tier.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* 5 Dimension Cards */}
                  <div className="grid grid-cols-1 gap-3">
                    {FORSETI_PARAM_MAP.map((dim, i) => {
                      const val = forseti[dim.key] ?? 5;
                      return (
                        <ForsetiCard
                          key={dim.key}
                          icon={dim.icon}
                          iconColor={dim.color}
                          title={dim.label}
                          description={dim.description}
                          value={val}
                          onChange={(v) => updateForseti(dim.key, v)}
                          index={i}
                        />
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* ---- TAB 3: LLM CONFIG ---- */}
              <TabsContent value="llm" className="mt-0">
                <div className="pb-6 space-y-4 max-w-3xl">
                  {/* Provider Selector */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-5"
                    style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <h4
                      className="text-sm font-medium mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      LLM Provider
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {llmProvidersData.map((provider) => (
                        <button
                          key={provider.name}
                          onClick={() => updateLLM('provider', provider.name)}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all"
                          style={{
                            backgroundColor:
                              llm.provider === provider.name
                                ? 'rgba(61,220,151,0.08)'
                                : 'transparent',
                            border:
                              llm.provider === provider.name
                                ? '1px solid rgba(61,220,151,0.3)'
                                : '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <Bot
                            size={20}
                            style={{
                              color:
                                llm.provider === provider.name
                                  ? '#3DDC97'
                                  : 'var(--text-muted)',
                            }}
                          />
                          <span
                            className="text-xs font-medium"
                            style={{
                              color:
                                llm.provider === provider.name
                                  ? '#3DDC97'
                                  : 'var(--text-secondary)',
                            }}
                          >
                            {provider.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Model Selector */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-xl p-5"
                    style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <h4
                      className="text-sm font-medium mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Model
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {currentModels.map((modelName) => (
                        <button
                          key={modelName}
                          onClick={() => updateLLM('model', modelName)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-left"
                          style={{
                            backgroundColor:
                              llm.model === modelName
                                ? 'rgba(61,220,151,0.08)'
                                : '#121821',
                            border:
                              llm.model === modelName
                                ? '1px solid rgba(61,220,151,0.3)'
                                : '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                llm.model === modelName ? '#3DDC97' : '#4A5568',
                            }}
                          />
                          <span
                            className="text-xs font-medium truncate"
                            style={{
                              color:
                                llm.model === modelName
                                  ? '#3DDC97'
                                  : 'var(--text-primary)',
                            }}
                          >
                            {modelName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Parameters Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl p-5"
                    style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <h4
                      className="text-sm font-medium mb-4"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Generation Parameters
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {/* Temperature */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Temperature
                          </span>
                          <span
                            className="font-mono text-xs font-semibold"
                            style={{ color: '#F5A623' }}
                          >
                            {llm.temperature.toFixed(1)}
                          </span>
                        </div>
                        <CustomSlider
                          value={llm.temperature}
                          min={0}
                          max={2.0}
                          step={0.1}
                          fillColor="#F5A623"
                          onChange={(v) => updateLLM('temperature', v)}
                        />
                      </div>

                      {/* Max Tokens */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Max Tokens
                          </span>
                          <span
                            className="font-mono text-xs font-semibold"
                            style={{ color: '#3B82F6' }}
                          >
                            {llm.maxTokens.toLocaleString()}
                          </span>
                        </div>
                        <CustomSlider
                          value={llm.maxTokens}
                          min={256}
                          max={8192}
                          step={256}
                          fillColor="#3B82F6"
                          onChange={(v) => updateLLM('maxTokens', v)}
                        />
                      </div>

                      {/* Top-P */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Top-P
                          </span>
                          <span
                            className="font-mono text-xs font-semibold"
                            style={{ color: '#10B981' }}
                          >
                            {llm.topP.toFixed(2)}
                          </span>
                        </div>
                        <CustomSlider
                          value={llm.topP}
                          min={0}
                          max={1}
                          step={0.01}
                          fillColor="#10B981"
                          onChange={(v) => updateLLM('topP', v)}
                        />
                      </div>

                      {/* Frequency Penalty */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Frequency Penalty
                          </span>
                          <span
                            className="font-mono text-xs font-semibold"
                            style={{ color: '#EC4899' }}
                          >
                            {llm.frequencyPenalty.toFixed(1)}
                          </span>
                        </div>
                        <CustomSlider
                          value={llm.frequencyPenalty}
                          min={-2}
                          max={2}
                          step={0.1}
                          fillColor="#EC4899"
                          onChange={(v) => updateLLM('frequencyPenalty', v)}
                        />
                      </div>

                      {/* Presence Penalty */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Presence Penalty
                          </span>
                          <span
                            className="font-mono text-xs font-semibold"
                            style={{ color: '#8B5CF6' }}
                          >
                            {llm.presencePenalty.toFixed(1)}
                          </span>
                        </div>
                        <CustomSlider
                          value={llm.presencePenalty}
                          min={-2}
                          max={2}
                          step={0.1}
                          fillColor="#8B5CF6"
                          onChange={(v) => updateLLM('presencePenalty', v)}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* System Prompt */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-xl p-5"
                    style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        System Prompt
                      </h4>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: systemPromptChars > 500 ? '#EF4444' : 'var(--text-muted)' }}
                      >
                        {systemPromptChars} chars
                      </span>
                    </div>
                    <textarea
                      value={llm.systemPrompt}
                      onChange={(e) => updateLLM('systemPrompt', e.target.value)}
                      rows={5}
                      className="w-full rounded-lg p-3 text-sm resize-none"
                      style={{
                        backgroundColor: '#121821',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1.6,
                      }}
                    />
                  </motion.div>
                </div>
              </TabsContent>

              {/* ---- TAB 4: CERTIFICATION ---- */}
              <TabsContent value="certification" className="mt-0">
                <div className="pb-6 space-y-4 max-w-3xl">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-5"
                    style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3
                          className="text-base font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Certification Progress
                        </h3>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Current: <strong style={{ color: '#3DDC97' }}>{formatCertLevelName(selectedAgent.certificationLevel)}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => setCertReviewOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          backgroundColor: 'rgba(61,220,151,0.1)',
                          color: '#3DDC97',
                          border: '1px solid rgba(61,220,151,0.2)',
                        }}
                      >
                        <ShieldCheck size={13} className="inline" />
                        Initiate Review
                      </button>
                    </div>

                    {/* Horizontal Progress */}
                    <div className="mb-6">
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: '6px', backgroundColor: '#121821' }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${((certLevelIndex(selectedAgent.certificationLevel) + 1) / certificationData.length) * 100}%`,
                          }}
                          transition={{ duration: 0.8, ease: EASE }}
                          style={{
                            height: '100%',
                            backgroundColor: '#3DDC97',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        {certificationData.map((level, i) => (
                          <span
                            key={level.level}
                            className="text-[9px] font-mono uppercase"
                            style={{
                              color:
                                i <= certLevelIndex(selectedAgent.certificationLevel)
                                  ? '#3DDC97'
                                  : '#4A5568',
                            }}
                          >
                            {i + 1}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-0">
                      {certificationData.map((level, i) => (
                        <CertificationStep
                          key={level.level}
                          level={level}
                          icon={CERT_ICONS[i] || Circle}
                          index={i}
                          currentIndex={certLevelIndex(selectedAgent.certificationLevel)}
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* Certification History Table */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl p-5"
                    style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <h4
                      className="text-sm font-medium mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Certification History
                    </h4>
                    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Table>
                        <TableHeader>
                          <TableRow style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <TableHead style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Date</TableHead>
                            <TableHead style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Event</TableHead>
                            <TableHead style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Status</TableHead>
                            <TableHead style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Reviewer</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <TableCell style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                              2025-01-15
                            </TableCell>
                            <TableCell style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>
                              Initial Certification
                            </TableCell>
                            <TableCell>
                              <Badge style={{ backgroundColor: 'rgba(61,220,151,0.1)', color: '#3DDC97', fontSize: '0.625rem' }}>
                                Passed
                              </Badge>
                            </TableCell>
                            <TableCell style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                              System
                            </TableCell>
                          </TableRow>
                          <TableRow style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <TableCell style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                              2025-01-10
                            </TableCell>
                            <TableCell style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>
                              Technical Validation
                            </TableCell>
                            <TableCell>
                              <Badge style={{ backgroundColor: 'rgba(61,220,151,0.1)', color: '#3DDC97', fontSize: '0.625rem' }}>
                                Passed
                              </Badge>
                            </TableCell>
                            <TableCell style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                              Auto
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </motion.div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* ---- RIGHT COLUMN: Live Preview (320px) ---- */}
        <aside
          className="shrink-0 border-l flex flex-col"
          style={{
            width: '320px',
            borderColor: 'rgba(255,255,255,0.06)',
            backgroundColor: '#070A0E',
          }}
        >
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: isTesting ? '#F5A623' : '#3DDC97',
                    animation: isTesting ? 'pulse 1.5s infinite' : 'pulse 2s infinite',
                  }}
                />
                <h3
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Live Preview
                </h3>
              </div>
              <span
                className="text-[10px] font-mono uppercase px-2 py-0.5 rounded"
                style={{
                  backgroundColor:
                    previewStatus === 'saved'
                      ? 'rgba(61,220,151,0.1)'
                      : previewStatus === 'modified'
                        ? 'rgba(245,166,35,0.1)'
                        : 'rgba(91,141,239,0.1)',
                  color:
                    previewStatus === 'saved'
                      ? '#3DDC97'
                      : previewStatus === 'modified'
                        ? '#F5A623'
                        : '#5B8DEF',
                }}
              >
                {previewStatus === 'testing' ? 'Testing...' : previewStatus}
              </span>
            </div>

            {/* Terminal */}
            <div
              className="flex-1 rounded-lg p-4 overflow-hidden flex flex-col"
              style={{
                backgroundColor: '#070A0E',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <TypingPreview text={previewText} isTyping={isTyping && !isTesting} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleTestAgent}
                disabled={isTesting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: '#3DDC97', color: '#070A0E' }}
              >
                <Play size={14} />
                {isTesting ? 'Testing...' : 'Test Agent'}
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Save size={14} />
                Save Config
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ======================== BOTTOM: Preset Library ======================== */}
      <div
        className="border-t px-6 py-4 shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)', height: '180px' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <ScrollText size={14} style={{ color: 'var(--text-muted)' }} />
          <h3
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Preset Library
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
          {allPresets.map((preset, i) => (
            <PresetCard
              key={`${preset.name}-${i}`}
              preset={preset}
              isActive={preset.name === activePresetName}
              onClick={() => handleLoadPreset(preset)}
              index={i}
            />
          ))}

          {/* New Preset Card */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.8 + allPresets.length * 0.06, ease: EASE }}
            onClick={() => setSaveModalOpen(true)}
            className="shrink-0 flex flex-col items-center justify-center gap-2 rounded-xl transition-all"
            style={{
              width: '250px',
              minWidth: '250px',
              backgroundColor: 'transparent',
              border: '2px dashed rgba(255,255,255,0.08)',
              color: 'var(--text-muted)',
            }}
            whileHover={{
              borderColor: 'rgba(61,220,151,0.3)',
              color: '#3DDC97',
              backgroundColor: 'rgba(61,220,151,0.03)',
            }}
          >
            <Plus size={20} />
            <span className="text-xs font-medium">New Preset</span>
          </motion.button>
        </div>
      </div>

      {/* ======================== MODALS ======================== */}
      <NewPresetModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveNewPreset}
        personality={personality}
        forseti={forseti}
        llm={llm}
      />

      {/* Certification Review Dialog */}
      <Dialog open={certReviewOpen} onOpenChange={(o) => !o && setCertReviewOpen(false)}>
        <DialogContent
          style={{
            backgroundColor: '#141E2B',
            border: '1px solid rgba(255,255,255,0.08)',
            maxWidth: '480px',
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              <ShieldCheck size={18} className="inline mr-2" />
              Initiate Certification Review
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              This will start the certification review process for <strong>{selectedAgent.name}</strong>.
              The review typically takes 1-3 business days.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#0C1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={14} style={{ color: '#3DDC97' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Review Requirements</span>
              </div>
              <ul className="space-y-1.5">
                {[
                  'Technical validation of all API integrations',
                  'Output quality assessment (minimum 95% accuracy)',
                  'Error handling and edge case review',
                  'Forseti Framework 5-dimension evaluation',
                  'Peer review by domain expert',
                ].map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <Check size={12} style={{ color: '#3DDC97', marginTop: '2px', flexShrink: 0 }} />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <button
              onClick={() => setCertReviewOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setCertReviewOpen(false);
                setPreviewStatus('testing');
                setTimeout(() => setPreviewStatus('saved'), 1500);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: '#3DDC97', color: '#070A0E' }}
            >
              Start Review
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
