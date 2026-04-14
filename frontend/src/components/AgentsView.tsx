import { useState, useMemo } from 'react';
import type { Agent } from '../types';
import { getSummaryContent, loadKBManifest } from '../services/knowledgeBase';

interface AgentsProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
}

// 5 Dimensions x 6 Sub-Dimensions = 30 Sub-Dimensions (Scale 0-9)
interface DimensionData {
  name: string;
  cssClass: string;
  score: number;
  subs: { label: string; value: number; desc: string }[];
}

function generateDimensions(agent: Agent): DimensionData[] {
  const seed = agent.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const r = (base: number, range: number, offset: number) => Math.min(9, Math.max(0, Math.floor(base + Math.sin(seed + offset) * range)));

  const creativity = agent.personality.creativity / 100;
  const depth = agent.personality.analyticalDepth / 100;
  const rate = agent.successRate / 100;

  return [
    {
      name: 'Information Access', cssClass: 'info-access', score: Math.round(40 + rate * 35 + depth * 25),
      subs: [
        { label: 'Scope', value: r(5 + depth * 3, 2, 1), desc: 'Umfang der Informationsquellen' },
        { label: 'Restriction', value: r(4 + rate * 4, 2, 2), desc: 'Einhaltung von Zugangsbeschränkungen' },
        { label: 'Temporal', value: r(5 + rate * 3, 2, 3), desc: 'Zeitliche Relevanz der Informationen' },
        { label: 'Sources', value: r(4 + depth * 4, 2, 4), desc: 'Vielfalt der genutzten Quellen' },
        { label: 'Granularity', value: r(5 + depth * 3, 2, 5), desc: 'Detaillierte Erfassung der Ergebnisse' },
        { label: 'Verification', value: r(4 + rate * 4, 2, 6), desc: 'Verifizierung der Informationen' },
      ],
    },
    {
      name: 'Resource Control', cssClass: 'resource', score: Math.round(70 + rate * 30),
      subs: [
        { label: 'Computational', value: r(7 + rate * 2, 1, 7), desc: 'Nutzung von Rechenressourcen' },
        { label: 'Financial', value: r(6 + rate * 3, 1, 8), desc: 'Kosten-Effizienz' },
        { label: 'Infrastructure', value: r(7 + rate * 2, 1, 9), desc: 'Infrastruktur-Nutzung' },
        { label: 'Human', value: r(6 + rate * 3, 1, 10), desc: 'Mensch-Maschine Interaktion' },
        { label: 'Energy', value: r(7 + rate * 2, 1, 11), desc: 'Energieeffizienz' },
        { label: 'Time', value: r(7 + rate * 2, 1, 12), desc: 'Zeitmanagement' },
      ],
    },
    {
      name: 'Network Position', cssClass: 'network', score: Math.round(50 + rate * 20 + creativity * 15 + depth * 10),
      subs: [
        { label: 'Trust', value: r(5 + rate * 3, 2, 13), desc: 'Vertrauenswürdigkeit' },
        { label: 'Dependencies', value: r(5 + depth * 3, 2, 14), desc: 'Abhängigkeiten-Management' },
        { label: 'Gatekeeping', value: r(4 + rate * 4, 2, 15), desc: 'Informations-Gatekeeping' },
        { label: 'Influence', value: r(4 + creativity * 4, 2, 16), desc: 'Einfluss auf andere Agenten' },
        { label: 'Reputation', value: r(5 + rate * 3, 2, 17), desc: 'Reputation im Netzwerk' },
        { label: 'Mobilization', value: r(4 + creativity * 4, 2, 18), desc: 'Mobilisierungsfähigkeit' },
      ],
    },
    {
      name: 'Authority & Permission', cssClass: 'authority', score: Math.round(50 + rate * 15 + depth * 20),
      subs: [
        { label: 'Legal', value: r(5 + rate * 3, 2, 19), desc: 'Rechtliche Anpassungsfähigkeit' },
        { label: 'Jurisdictional', value: r(5 + depth * 3, 2, 20), desc: 'Jurisdiktionelle Flexibilität' },
        { label: 'Hierarchical', value: r(5 + rate * 3, 2, 21), desc: 'Hierarchische Anpassung' },
        { label: 'Financial', value: r(5 + rate * 3, 2, 22), desc: 'Finanzielle Flexibilität' },
        { label: 'Territorial', value: r(4 + depth * 4, 2, 23), desc: 'Territoriale Anpassung' },
        { label: 'Ethical', value: r(5 + rate * 3, 2, 24), desc: 'Ethische Urteilsfähigkeit' },
      ],
    },
    {
      name: 'Synthesis & Application', cssClass: 'synthesis', score: Math.round(60 + creativity * 20 + rate * 15),
      subs: [
        { label: 'Synthesis', value: r(5 + creativity * 3, 2, 25), desc: 'Synthesefähigkeit' },
        { label: 'Creativity', value: r(4 + creativity * 4, 2, 26), desc: 'Kreatives Denken' },
        { label: 'Planning', value: r(5 + depth * 3, 2, 27), desc: 'Strategische Planung' },
        { label: 'Decision', value: r(5 + rate * 3, 2, 28), desc: 'Entscheidungskompetenz' },
        { label: 'Learning', value: r(5 + rate * 3, 2, 29), desc: 'Lernfähigkeit' },
        { label: 'Memory', value: r(5 + depth * 3, 2, 30), desc: 'Kontextgedächtnis' },
      ],
    },
  ];
}

const dimColors: Record<string, string> = {
  'info-access': '#00e5ff',
  'resource': '#10b981',
  'network': '#3b82f6',
  'authority': '#8b5cf6',
  'synthesis': '#14b8a6',
};

function Sparkline({ agent }: { agent: Agent }) {
  const bars = useMemo(() => {
    const seed = agent.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    return Array.from({ length: 10 }, (_, i) => 3 + Math.abs(Math.sin(seed + i * 1.7)) * 14);
  }, [agent.id]);
  return (
    <div className="agent-sparklines">
      {bars.map((h, i) => (
        <div key={i} className="sparkline-bar" style={{ height: h, background: 'var(--border-active)' }} />
      ))}
    </div>
  );
}

export default function AgentsView({ agents, selectedAgentId, onSelectAgent }: AgentsProps) {
  const [detailTab, setDetailTab] = useState<'subdim' | 'overview' | 'layers' | 'modifiers' | 'knowledge'>('subdim');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);

  const sorted = useMemo(() => {
    let filtered = agents;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }
    return [...filtered].sort((a, b) => b.successRate - a.successRate);
  }, [agents, searchQuery, categoryFilter]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) ?? sorted[0];
  const dimensions = selectedAgent ? generateDimensions(selectedAgent) : [];

  const getTrend = (agent: Agent): 'up' | 'down' | 'flat' => {
    const s = agent.id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    return s % 3 === 0 ? 'up' : s % 3 === 1 ? 'down' : 'flat';
  };

  const getTierColor = (rate: number) =>
    rate >= 97 ? '#ffd700' : rate >= 94 ? '#c0c0c0' : rate >= 90 ? '#cd7f32' : 'var(--border-active)';

  const categories = ['all', ...new Set(agents.map(a => a.category))];

  return (
    <div className="agents-layout">
      <div className="agents-list">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, padding: '0 12px' }}>
          <input
            placeholder="Agent suchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '4px 8px', fontSize: 11 }}>
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'Alle Kategorien' : c}</option>)}
          </select>
        </div>
        <div className="agent-row" style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="agent-rank">#</div>
          <div>Agent</div>
          <div style={{ textAlign: 'center' }}>Score</div>
          <div style={{ textAlign: 'center' }}>Tier</div>
          <div style={{ textAlign: 'center' }}>Trend</div>
          <div>Dimensionen</div>
        </div>
        {sorted.map((agent, i) => {
          const trend = getTrend(agent);
          return (
            <div
              key={agent.id}
              className={`agent-row${selectedAgent?.id === agent.id ? ' selected' : ''}`}
              onClick={() => onSelectAgent(agent.id)}
            >
              <div className="agent-rank">{i + 1}</div>
              <div className="agent-name">
                <span className="name">{agent.name}</span>
                <span className="pct">{agent.successRate}%</span>
              </div>
              <div className="agent-score">{agent.successRate}</div>
              <div className="agent-tier">
                <span className="agent-tier-dot" style={{ background: getTierColor(agent.successRate) }} />
              </div>
              <div className={`agent-trend ${trend}`}>
                {trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192'}
              </div>
              <Sparkline agent={agent} />
            </div>
          );
        })}
      </div>

      {selectedAgent && (
        <div className="agent-detail">
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedAgent.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {selectedAgent.category} &middot; {selectedAgent.personality.archetype} &middot; {selectedAgent.personality.communicationStyle}
            </div>
          </div>

          <div className="detail-tabs">
            {([
              { key: 'overview', label: '\u00DCbersicht', icon: '\u2302' },
              { key: 'subdim', label: '30 Sub-Dim.', icon: '\u25A3' },
              { key: 'layers', label: '5 Layers', icon: '\u2261' },
              { key: 'modifiers', label: '3 Modifiers', icon: '\u2699' },
              { key: 'knowledge', label: 'Wissen', icon: '\u{1F4DA}' },
            ] as const).map(t => (
              <button
                key={t.key}
                className={`detail-tab${detailTab === t.key ? ' active' : ''}`}
                onClick={() => setDetailTab(t.key)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            5 Dimensionen &times; 6 Sub-Dimensionen = 30 Metriken (Skala 0-9)
          </div>

          {detailTab === 'subdim' && dimensions.map(dim => (
            <div key={dim.cssClass} className="dimension-section">
              <div className="dimension-header">
                <span className={`dimension-name ${dim.cssClass}`}>{dim.name}</span>
                <span className="dimension-score">{dim.score}/100</span>
              </div>
              <div className="subdim-grid">
                {dim.subs.map(sub => (
                  <div key={sub.label} className="subdim-card">
                    <div className="subdim-top">
                      <span className="subdim-label">{sub.label}</span>
                      <span className="subdim-value" style={{ color: dimColors[dim.cssClass] }}>{sub.value}/9</span>
                    </div>
                    <div className="subdim-desc">{sub.desc}</div>
                    <div className="subdim-bar">
                      <div className="subdim-bar-fill" style={{ width: `${(sub.value / 9) * 100}%`, background: dimColors[dim.cssClass] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {detailTab === 'overview' && (
            <div>
              <div className="card mb-16">
                <div className="card-title mb-8">Agent-Profil</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`badge ${selectedAgent.status}`}>{selectedAgent.status}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Kategorie:</span> {selectedAgent.category}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tasks erledigt:</span> {selectedAgent.tasksCompleted}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Fehlgeschlagen:</span> {selectedAgent.failedTasks}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Avg Dauer:</span> {selectedAgent.avgTaskDuration}s</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Archetype:</span> {selectedAgent.personality.archetype}</div>
                </div>
              </div>
              <div className="card mb-16">
                <div className="card-title mb-8">Personality</div>
                {(['creativity', 'analyticalDepth', 'riskTolerance'] as const).map(key => (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{key}</span>
                      <span>{selectedAgent.personality[key]}%</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--bg-hover)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${selectedAgent.personality[key]}%`, background: 'var(--accent-cyan)', borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="card mb-16">
                <div className="card-title mb-8">Parameter</div>
                <div style={{ fontSize: 12 }}>
                  {Object.entries(selectedAgent.parameters).map(([k, v]) => (
                    <div key={k} className="config-row">
                      <span className="config-label">{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-title mb-8">System Prompt</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  {selectedAgent.systemPrompt}
                </div>
              </div>
            </div>
          )}

          {detailTab === 'layers' && (
            <div>
              {dimensions.map((dim, i) => (
                <div key={dim.cssClass} className="card mb-8">
                  <div className="flex-between mb-8">
                    <span className={`dimension-name ${dim.cssClass}`}>Layer {i + 1}: {dim.name}</span>
                    <span className="dimension-score">{dim.score}/100</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${dim.score}%`, background: dimColors[dim.cssClass], borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                    {dim.subs.map(s => <span key={s.label}>{s.label}: {s.value}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {detailTab === 'modifiers' && (
            <div>
              <div className="card mb-16">
                <div className="card-title mb-8">Modifier 1: Personality Influence</div>
                <div style={{ fontSize: 12 }}>
                  <div className="config-row"><span className="config-label">Archetype</span><span style={{ fontWeight: 600 }}>{selectedAgent.personality.archetype}</span></div>
                  <div className="config-row"><span className="config-label">Communication</span><span style={{ fontWeight: 600 }}>{selectedAgent.personality.communicationStyle}</span></div>
                  <div className="config-row"><span className="config-label">Creativity Impact</span><span style={{ fontWeight: 600 }}>+{Math.round(selectedAgent.personality.creativity * 0.15)}%</span></div>
                  <div className="config-row"><span className="config-label">Depth Impact</span><span style={{ fontWeight: 600 }}>+{Math.round(selectedAgent.personality.analyticalDepth * 0.12)}%</span></div>
                </div>
              </div>
              <div className="card mb-16">
                <div className="card-title mb-8">Modifier 2: Performance History</div>
                <div style={{ fontSize: 12 }}>
                  <div className="config-row"><span className="config-label">Success Rate</span><span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{selectedAgent.successRate}%</span></div>
                  <div className="config-row"><span className="config-label">Tasks Total</span><span style={{ fontWeight: 600 }}>{selectedAgent.tasksCompleted + selectedAgent.failedTasks}</span></div>
                  <div className="config-row"><span className="config-label">Reliability Index</span><span style={{ fontWeight: 600 }}>{(selectedAgent.successRate * 0.95 + (selectedAgent.tasksCompleted > 200 ? 5 : 0)).toFixed(1)}</span></div>
                </div>
              </div>
              <div className="card">
                <div className="card-title mb-8">Modifier 3: Test Results</div>
                {selectedAgent.testResults.map(test => (
                  <div key={test.id} className="config-row">
                    <span className="config-label">{test.category}: {test.name}</span>
                    <span style={{ fontWeight: 600, color: test.passed ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {test.passed ? 'PASS' : 'FAIL'} ({test.duration.toFixed(1)}s)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailTab === 'knowledge' && (
            <KnowledgeTab
              agent={selectedAgent}
              expandedSummary={expandedSummary}
              onToggleSummary={path =>
                setExpandedSummary(prev => (prev === path ? null : path))
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

interface KnowledgeTabProps {
  agent: Agent;
  expandedSummary: string | null;
  onToggleSummary: (summaryPath: string) => void;
}

function KnowledgeTab({ agent, expandedSummary, onToggleSummary }: KnowledgeTabProps) {
  const scope = agent.knowledgeScope;
  const manifest = loadKBManifest();

  if (!scope || scope.docs.length === 0) {
    return (
      <div className="card">
        <div className="card-title mb-8">Wissensbasis-Scope</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          F\u00FCr diesen Agenten wurden (noch) keine Dokumente aus der Knowledge-Base zugeordnet.
        </div>
      </div>
    );
  }

  const categoryBadges = scope.primaryCategories.map(cat => {
    const label = manifest.categories[cat]?.label ?? cat;
    return (
      <span
        key={cat}
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          marginRight: 6,
          marginBottom: 4,
          borderRadius: 4,
          background: 'var(--border-color)',
          color: 'var(--text-primary)',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </span>
    );
  });

  return (
    <div>
      <div className="card mb-16">
        <div className="card-title mb-8">Wissens-Scope</div>
        <div style={{ marginBottom: 8 }}>{categoryBadges}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Top {scope.docs.length} Dokumente aus {scope.primaryCategories.length} Kategorie
          {scope.primaryCategories.length === 1 ? '' : 'n'} (Tag-Ranking).
        </div>
      </div>

      {scope.docs.map(doc => {
        const isOpen = expandedSummary === doc.summaryPath;
        const summary = isOpen ? getSummaryContent(doc.summaryPath) : undefined;
        return (
          <div key={doc.id} className="card mb-16">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{doc.id}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              {manifest.categories[doc.category]?.label ?? doc.category} &middot; {doc.subcategory} &middot; {doc.difficulty}
              {doc.integrityStatus === 'missing' && (
                <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  &middot; Katalog-Eintrag (nur Summary)
                </span>
              )}
            </div>
            {doc.tags.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                {doc.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      marginRight: 4,
                      marginBottom: 2,
                      borderRadius: 3,
                      border: '1px solid var(--border-color)',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <button
              className="detail-tab"
              onClick={() => onToggleSummary(doc.summaryPath)}
              style={{ fontSize: 11 }}
            >
              {isOpen ? 'Summary ausblenden' : 'Summary anzeigen'}
            </button>
            {isOpen && (
              <pre
                style={{
                  marginTop: 8,
                  padding: 8,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 4,
                  fontSize: 11,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 240,
                  overflow: 'auto',
                }}
              >
                {summary ?? 'Keine Summary verfügbar.'}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
