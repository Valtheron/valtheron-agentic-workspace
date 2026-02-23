import { useState } from 'react';
import type { Project, ProjectRequirement, Agent, Workflow } from '../types';
import { fetchAndAnalyzeUrl, generateRequirements, generateWorkflowFromProject, generateProjectFiles } from '../services/projectAnalyzer';

interface ProjectsProps {
  projects: Project[];
  agents: Agent[];
  onCreateProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onCreateWorkflow: (wf: Workflow) => void;
  onNavigateWorkflow: (wfId: string) => void;
}

type ProjectTab = 'overview' | 'requirements' | 'files' | 'workflow';

const statusLabels: Record<string, string> = {
  importing: 'Importiere...', analyzing: 'Analysiere...', planning: 'Planung',
  in_development: 'In Entwicklung', testing: 'Testing', completed: 'Abgeschlossen', failed: 'Fehlgeschlagen',
};

const catIcons: Record<string, string> = {
  ui: '\u25A3', logic: '\u2699', api: '\u2194', data: '\u2261', security: '\u26A0',
  infra: '\u2302', testing: '\u2713', design: '\u2710',
};

const langColors: Record<string, string> = {
  typescript: '#3178c6', javascript: '#f7df1e', html: '#e34f26', css: '#1572b6',
  json: '#292929', python: '#3776ab',
};

function generateId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function ProjectsView({ projects, agents, onCreateProject, onUpdateProject, onDeleteProject, onCreateWorkflow, onNavigateWorkflow }: ProjectsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<ProjectTab>('overview');
  const [importing, setImporting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [viewingFile, setViewingFile] = useState<string | null>(null);

  const selected = projects.find(p => p.id === selectedId);

  const handleImportUrl = async () => {
    if (!urlInput.trim()) return;
    setImporting(true);
    setImportStatus('URL wird abgerufen...');

    const projectId = generateId();
    const newProject: Project = {
      id: projectId, name: 'Wird analysiert...', description: '', sourceUrl: urlInput.trim(),
      status: 'importing', requirements: [], files: [], techStack: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    onCreateProject(newProject);
    setSelectedId(projectId);

    try {
      setImportStatus('Analysiere Seiteninhalt...');
      const analysis = await fetchAndAnalyzeUrl(urlInput.trim());

      setImportStatus('Extrahiere Requirements...');
      const updatedProject: Project = {
        ...newProject,
        name: analysis.title,
        description: `Importiert von: ${urlInput.trim()}`,
        status: 'analyzing',
        analyzedStructure: analysis,
        scrapedContent: analysis.rawContent,
        techStack: analysis.technologies,
        updatedAt: new Date().toISOString(),
      };
      onUpdateProject(updatedProject);

      // Generate requirements
      const reqs = generateRequirements(analysis);
      const withReqs: Project = {
        ...updatedProject, requirements: reqs, status: 'planning', updatedAt: new Date().toISOString(),
      };
      onUpdateProject(withReqs);

      setImportStatus('Fertig! Requirements bereit zur Überprüfung.');
      setTab('requirements');
    } catch (e) {
      setImportStatus(`Fehler: ${e instanceof Error ? e.message : 'Unbekannter Fehler'}. URL-Analyse aus URL-Struktur wird verwendet.`);
      // Fallback: analyze from URL alone
      try {
        const analysis = await fetchAndAnalyzeUrl(urlInput.trim());
        const reqs = generateRequirements(analysis);
        onUpdateProject({
          ...newProject,
          name: analysis.title,
          description: `Importiert von: ${urlInput.trim()} (URL-Analyse)`,
          status: 'planning',
          analyzedStructure: analysis,
          techStack: analysis.technologies,
          requirements: reqs,
          updatedAt: new Date().toISOString(),
        });
        setTab('requirements');
      } catch {
        onUpdateProject({ ...newProject, status: 'failed', name: 'Import fehlgeschlagen' });
      }
    }
    setImporting(false);
  };

  const handleToggleRequirement = (reqId: string) => {
    if (!selected) return;
    onUpdateProject({
      ...selected,
      requirements: selected.requirements.map(r => r.id === reqId ? { ...r, accepted: !r.accepted } : r),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleGenerateWorkflow = () => {
    if (!selected) return;
    const wf = generateWorkflowFromProject(selected, agents);
    onCreateWorkflow(wf);
    onUpdateProject({ ...selected, workflowId: wf.id, status: 'in_development', updatedAt: new Date().toISOString() });
  };

  const handleGenerateFiles = () => {
    if (!selected) return;
    const files = generateProjectFiles(selected);
    onUpdateProject({ ...selected, files, updatedAt: new Date().toISOString() });
    setTab('files');
  };

  const viewedFile = selected?.files.find(f => f.id === viewingFile);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 120px)' }}>
      {/* Project List */}
      <div style={{ overflow: 'auto' }}>
        <div style={{ marginBottom: 12 }}>
          <div className="card-title mb-8">Neues Projekt von URL</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              placeholder="https://... URL eingeben"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImportUrl()}
              style={{ flex: 1, fontSize: 11 }}
              disabled={importing}
            />
            <button className="btn btn-primary btn-sm" onClick={handleImportUrl} disabled={importing || !urlInput.trim()}>
              {importing ? '...' : '\u2192'}
            </button>
          </div>
          {importStatus && (
            <div style={{ fontSize: 10, color: 'var(--accent-cyan)', marginTop: 4, padding: '4px 6px', background: 'var(--bg-surface)', borderRadius: 4 }}>
              {importStatus}
            </div>
          )}
        </div>

        <div className="card-title mb-8">Projekte ({projects.length})</div>
        {projects.map(proj => (
          <div
            key={proj.id}
            className="card"
            style={{
              marginBottom: 6, cursor: 'pointer', padding: '10px 12px',
              borderColor: selectedId === proj.id ? 'var(--accent-cyan)' : 'var(--border-color)',
              borderLeftWidth: selectedId === proj.id ? 3 : 1,
            }}
            onClick={() => { setSelectedId(proj.id); setTab('overview'); }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{proj.name}</div>
              <span style={{ fontSize: 9, textTransform: 'uppercase', color: proj.status === 'completed' ? 'var(--accent-green)' : proj.status === 'failed' ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>
                {statusLabels[proj.status]}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              {proj.requirements.length} Req &middot; {proj.files.length} Dateien
              {proj.techStack.length > 0 && ` \u00b7 ${proj.techStack.slice(0, 2).join(', ')}`}
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 12 }}>
            Geben Sie eine URL ein um ein Projekt zu importieren
          </div>
        )}
      </div>

      {/* Project Detail */}
      <div style={{ overflow: 'auto' }}>
        {selected ? (
          <div>
            {/* Header */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.name}</div>
                  {selected.sourceUrl && (
                    <div style={{ fontSize: 11, color: 'var(--accent-cyan)', marginTop: 2 }}>
                      {selected.sourceUrl}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{selected.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {selected.status === 'planning' && !selected.workflowId && (
                    <button className="btn btn-primary btn-sm" onClick={handleGenerateWorkflow}>
                      Workflow generieren
                    </button>
                  )}
                  {selected.workflowId && (
                    <button className="btn btn-ghost btn-sm" onClick={() => onNavigateWorkflow(selected.workflowId!)}>
                      Zum Workflow
                    </button>
                  )}
                  {selected.status !== 'importing' && selected.files.length === 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={handleGenerateFiles}>
                      Code generieren
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => { onDeleteProject(selected.id); setSelectedId(null); }}>
                    {'\u2716'}
                  </button>
                </div>
              </div>

              {/* Tech Stack */}
              {selected.techStack.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {selected.techStack.map(tech => (
                    <span key={tech} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-surface)', color: 'var(--accent-cyan)' }}>
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 12 }}>
              {([
                { key: 'overview', label: `\u00DCbersicht` },
                { key: 'requirements', label: `Requirements (${selected.requirements.length})` },
                { key: 'files', label: `Dateien (${selected.files.length})` },
                { key: 'workflow', label: 'Workflow' },
              ] as const).map(t => (
                <button key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {tab === 'overview' && selected.analyzedStructure && (
              <div className="grid-2">
                <div className="card">
                  <div className="card-title mb-8">Erkannte Features ({selected.analyzedStructure.features.length})</div>
                  {selected.analyzedStructure.features.map((f, i) => (
                    <div key={i} style={{ fontSize: 12, padding: '3px 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      {f}
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-title mb-8">Komponenten ({selected.analyzedStructure.components.length})</div>
                  {selected.analyzedStructure.components.map((c, i) => (
                    <div key={i} style={{ fontSize: 12, padding: '3px 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      {c}
                    </div>
                  ))}
                  {selected.analyzedStructure.apiEndpoints.length > 0 && (
                    <>
                      <div className="card-title mb-8 mt-16">API Endpoints</div>
                      {selected.analyzedStructure.apiEndpoints.map((ep, i) => (
                        <div key={i} style={{ fontSize: 11, padding: '2px 0', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                          {ep}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {tab === 'overview' && !selected.analyzedStructure && (
              <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                {selected.status === 'importing' ? 'Analyse läuft...' : 'Keine Analyse-Daten verfügbar'}
              </div>
            )}

            {/* REQUIREMENTS TAB */}
            {tab === 'requirements' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {selected.requirements.filter(r => r.accepted).length} von {selected.requirements.length} akzeptiert
                  </span>
                  {selected.status === 'planning' && !selected.workflowId && (
                    <button className="btn btn-primary btn-sm" onClick={handleGenerateWorkflow}>
                      {'\u25B6'} Workflow aus Requirements generieren
                    </button>
                  )}
                </div>
                {(['critical', 'high', 'medium', 'low'] as const).map(priority => {
                  const reqs = selected.requirements.filter(r => r.priority === priority);
                  if (reqs.length === 0) return null;
                  return (
                    <div key={priority} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                        {priority} ({reqs.length})
                      </div>
                      {reqs.map(req => (
                        <div
                          key={req.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6,
                            marginBottom: 4, opacity: req.accepted ? 1 : 0.5,
                          }}
                        >
                          <button
                            style={{
                              width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                              background: req.accepted ? 'var(--accent-cyan)' : 'var(--bg-hover)',
                              border: 'none', color: req.accepted ? 'var(--bg-primary)' : 'transparent',
                              fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            onClick={() => handleToggleRequirement(req.id)}
                          >
                            {req.accepted ? '\u2713' : ''}
                          </button>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{catIcons[req.category]}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{req.title}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{req.description}</div>
                          </div>
                          <span className={`badge ${req.category === 'security' ? 'high' : 'info'}`} style={{ fontSize: 9 }}>{req.category}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* FILES TAB */}
            {tab === 'files' && (
              <div style={{ display: 'grid', gridTemplateColumns: viewingFile ? '260px 1fr' : '1fr', gap: 12 }}>
                <div>
                  {selected.files.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Noch keine Dateien generiert</div>
                      <button className="btn btn-primary btn-sm" onClick={handleGenerateFiles}>Code generieren</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {selected.files.length} Dateien &middot; {(selected.files.reduce((s, f) => s + f.size, 0) / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      {selected.files.map(file => (
                        <div
                          key={file.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                            background: viewingFile === file.id ? 'var(--bg-hover)' : 'var(--bg-card)',
                            border: '1px solid var(--border-color)', borderRadius: 6,
                            marginBottom: 4, cursor: 'pointer',
                            borderLeftWidth: viewingFile === file.id ? 3 : 1,
                            borderLeftColor: viewingFile === file.id ? (langColors[file.language] ?? 'var(--accent-cyan)') : 'var(--border-color)',
                          }}
                          onClick={() => setViewingFile(file.id)}
                        >
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: langColors[file.language] ?? 'var(--text-muted)', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.path}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{file.language} &middot; {(file.size / 1024).toFixed(1)} KB</div>
                          </div>
                          <span className={`badge ${file.status === 'approved' ? 'valid' : file.status === 'rejected' ? 'critical' : 'info'}`} style={{ fontSize: 9 }}>
                            {file.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {viewingFile && viewedFile && (
                  <div className="card" style={{ overflow: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{viewedFile.path}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {viewedFile.language} &middot; Agent: {viewedFile.generatedBy} &middot; {new Date(viewedFile.generatedAt).toLocaleString('de-DE')}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewingFile(null)}>{'\u2716'}</button>
                    </div>
                    <pre style={{
                      fontSize: 11, lineHeight: 1.6, color: 'var(--text-secondary)',
                      background: 'var(--bg-surface)', padding: 12, borderRadius: 6,
                      overflow: 'auto', maxHeight: 'calc(100vh - 280px)', whiteSpace: 'pre-wrap',
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                    }}>
                      {viewedFile.content}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* WORKFLOW TAB */}
            {tab === 'workflow' && (
              <div>
                {selected.workflowId ? (
                  <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Workflow verknüpft</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>ID: {selected.workflowId}</div>
                    <button className="btn btn-primary" onClick={() => onNavigateWorkflow(selected.workflowId!)}>
                      {'\u25B6'} Workflow öffnen und starten
                    </button>
                  </div>
                ) : (
                  <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Kein Workflow verknüpft</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                      Akzeptieren Sie zuerst die Requirements, dann generieren Sie einen Workflow.
                    </div>
                    {selected.requirements.filter(r => r.accepted).length > 0 && (
                      <button className="btn btn-primary" onClick={handleGenerateWorkflow}>
                        Workflow aus {selected.requirements.filter(r => r.accepted).length} Requirements generieren
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u2302'}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Projekt importieren</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Geben Sie eine URL ein, um ein Projekt zu analysieren und zu erstellen</div>
              <div style={{ fontSize: 11, marginTop: 12, color: 'var(--accent-cyan)', background: 'var(--bg-surface)', padding: 10, borderRadius: 6, fontFamily: 'monospace' }}>
                https://valtheron.blackice-secure.space/tradingbots/index.html
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
