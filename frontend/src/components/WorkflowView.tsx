import { useState } from 'react';
import type { Workflow, WorkflowStep, WorkflowStatus, WorkflowStepStatus, Agent } from '../types';

interface WorkflowProps {
  workflows: Workflow[];
  agents: Agent[];
  onCreateWorkflow: (wf: Workflow) => void;
  onUpdateWorkflow: (wf: Workflow) => void;
  onDeleteWorkflow: (id: string) => void;
  onRunWorkflow: (id: string) => void;
  onPauseWorkflow: (id: string) => void;
}

const statusColors: Record<WorkflowStatus, string> = {
  draft: 'var(--text-muted)', running: 'var(--accent-cyan)', paused: 'var(--accent-orange)',
  completed: 'var(--accent-green)', failed: 'var(--accent-red)',
};

const stepStatusColors: Record<WorkflowStepStatus, string> = {
  pending: 'var(--text-muted)', running: 'var(--accent-cyan)', completed: 'var(--accent-green)',
  failed: 'var(--accent-red)', skipped: 'var(--text-muted)',
};

function generateId() {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function WorkflowView({ workflows, agents, onCreateWorkflow, onUpdateWorkflow, onDeleteWorkflow, onRunWorkflow, onPauseWorkflow }: WorkflowProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingStep, setAddingStep] = useState(false);

  // New workflow form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');

  // New step form
  const [stepName, setStepName] = useState('');
  const [stepDesc, setStepDesc] = useState('');
  const [stepAgent, setStepAgent] = useState('');
  const [stepDeps, setStepDeps] = useState<string[]>([]);
  const [stepDuration, setStepDuration] = useState(30);

  const selected = workflows.find(w => w.id === selectedId);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const wf: Workflow = {
      id: generateId(),
      name: newName.trim(),
      description: newDesc.trim(),
      status: 'draft',
      steps: [],
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    };
    onCreateWorkflow(wf);
    setSelectedId(wf.id);
    setNewName(''); setNewDesc(''); setNewTags('');
    setCreating(false);
  };

  const handleAddStep = () => {
    if (!selected || !stepName.trim()) return;
    const step: WorkflowStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: stepName.trim(),
      description: stepDesc.trim(),
      assignedAgentId: stepAgent || null,
      status: 'pending',
      dependsOn: stepDeps,
      output: null,
      progress: 0,
      estimatedDuration: stepDuration,
      retries: 0,
    };
    onUpdateWorkflow({ ...selected, steps: [...selected.steps, step] });
    setStepName(''); setStepDesc(''); setStepAgent(''); setStepDeps([]); setStepDuration(30);
    setAddingStep(false);
  };

  const handleAssignAgent = (stepId: string, agentId: string) => {
    if (!selected) return;
    onUpdateWorkflow({
      ...selected,
      steps: selected.steps.map(s => s.id === stepId ? { ...s, assignedAgentId: agentId || null } : s),
    });
  };

  const handleRemoveStep = (stepId: string) => {
    if (!selected) return;
    onUpdateWorkflow({
      ...selected,
      steps: selected.steps
        .filter(s => s.id !== stepId)
        .map(s => ({ ...s, dependsOn: s.dependsOn.filter(d => d !== stepId) })),
    });
  };

  const handleMoveStep = (stepId: string, direction: -1 | 1) => {
    if (!selected) return;
    const idx = selected.steps.findIndex(s => s.id === stepId);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= selected.steps.length) return;
    const steps = [...selected.steps];
    [steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]];
    onUpdateWorkflow({ ...selected, steps });
  };

  const canRun = selected && selected.status === 'draft' && selected.steps.length > 0 &&
    selected.steps.every(s => s.assignedAgentId);

  const getCompletedSteps = (wf: Workflow) => wf.steps.filter(s => s.status === 'completed').length;
  const getProgress = (wf: Workflow) => wf.steps.length === 0 ? 0 : Math.round(wf.steps.reduce((s, st) => s + st.progress, 0) / wf.steps.length);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, height: 'calc(100vh - 120px)' }}>
      {/* Workflow List */}
      <div style={{ overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{workflows.length} Workflows</span>
          <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>+ Neuer Workflow</button>
        </div>

        {creating && (
          <div className="card" style={{ marginBottom: 12, borderColor: 'var(--accent-cyan)' }}>
            <div className="card-title mb-8">Neuer Workflow</div>
            <input placeholder="Name *" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', marginBottom: 6 }} autoFocus />
            <textarea placeholder="Beschreibung" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ width: '100%', marginBottom: 6, minHeight: 60 }} />
            <input placeholder="Tags (kommasepariert)" value={newTags} onChange={e => setNewTags(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={!newName.trim()}>Erstellen</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>Abbrechen</button>
            </div>
          </div>
        )}

        {workflows.map(wf => (
          <div
            key={wf.id}
            className="card"
            style={{
              marginBottom: 8, cursor: 'pointer',
              borderColor: selectedId === wf.id ? 'var(--accent-cyan)' : 'var(--border-color)',
              borderLeftWidth: selectedId === wf.id ? 3 : 1,
            }}
            onClick={() => setSelectedId(wf.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{wf.name}</div>
              <span style={{ fontSize: 10, fontWeight: 600, color: statusColors[wf.status], textTransform: 'uppercase' }}>{wf.status}</span>
            </div>
            {wf.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{wf.description}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{wf.steps.length} Schritte &middot; {getCompletedSteps(wf)} erledigt</span>
              <div style={{ width: 60, height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${getProgress(wf)}%`, background: statusColors[wf.status], borderRadius: 2 }} />
              </div>
            </div>
            {wf.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {wf.tags.map(tag => <span key={tag} className="kanban-tag">{tag}</span>)}
              </div>
            )}
          </div>
        ))}

        {workflows.length === 0 && !creating && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{'\u2699'}</div>
            <div style={{ fontSize: 13 }}>Noch keine Workflows</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Erstellen Sie einen Workflow um loszulegen</div>
          </div>
        )}
      </div>

      {/* Workflow Detail */}
      <div style={{ overflow: 'auto' }}>
        {selected ? (
          <div>
            {/* Header */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{selected.name}</div>
                  {selected.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selected.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {selected.status === 'draft' && canRun && (
                    <button className="btn btn-primary btn-sm" onClick={() => onRunWorkflow(selected.id)}>
                      {'\u25B6'} Starten
                    </button>
                  )}
                  {selected.status === 'draft' && !canRun && selected.steps.length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--accent-orange)' }}>Alle Schritte brauchen einen Agent</span>
                  )}
                  {selected.status === 'running' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => onPauseWorkflow(selected.id)}>
                      {'\u23F8'} Pause
                    </button>
                  )}
                  {selected.status === 'paused' && (
                    <button className="btn btn-primary btn-sm" onClick={() => onRunWorkflow(selected.id)}>
                      {'\u25B6'} Fortsetzen
                    </button>
                  )}
                  {(selected.status === 'draft' || selected.status === 'completed' || selected.status === 'failed') && (
                    <button className="btn btn-danger btn-sm" onClick={() => { onDeleteWorkflow(selected.id); setSelectedId(null); }}>
                      {'\u2716'} Löschen
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Status: <span style={{ color: statusColors[selected.status], fontWeight: 600 }}>{selected.status.toUpperCase()}</span></span>
                <span>Schritte: {selected.steps.length}</span>
                <span>Fortschritt: {getProgress(selected)}%</span>
                <span>Erstellt: {new Date(selected.createdAt).toLocaleString('de-DE')}</span>
              </div>
              {/* Progress bar */}
              <div style={{ marginTop: 8, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${getProgress(selected)}%`, background: statusColors[selected.status], borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="card-title">Workflow-Schritte ({selected.steps.length})</span>
              {selected.status === 'draft' && (
                <button className="btn btn-primary btn-sm" onClick={() => setAddingStep(true)}>+ Schritt hinzufügen</button>
              )}
            </div>

            {addingStep && (
              <div className="card" style={{ marginBottom: 12, borderColor: 'var(--accent-cyan)' }}>
                <div className="card-title mb-8">Neuer Schritt</div>
                <input placeholder="Schrittname *" value={stepName} onChange={e => setStepName(e.target.value)} style={{ width: '100%', marginBottom: 6 }} autoFocus />
                <textarea placeholder="Beschreibung / Aufgabe für den Agent" value={stepDesc} onChange={e => setStepDesc(e.target.value)} style={{ width: '100%', marginBottom: 6, minHeight: 60 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Agent zuweisen</label>
                    <select value={stepAgent} onChange={e => setStepAgent(e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}>
                      <option value="">-- Agent wählen --</option>
                      {agents.filter(a => a.status !== 'suspended' && a.status !== 'error').map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Geschätzte Dauer (s)</label>
                    <input type="number" min={5} max={3600} value={stepDuration} onChange={e => setStepDuration(parseInt(e.target.value) || 30)} style={{ width: '100%' }} />
                  </div>
                </div>
                {selected.steps.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Abhängigkeiten (vorherige Schritte)</label>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {selected.steps.map(s => (
                        <button
                          key={s.id}
                          className={`btn btn-sm ${stepDeps.includes(s.id) ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setStepDeps(prev => prev.includes(s.id) ? prev.filter(d => d !== s.id) : [...prev, s.id])}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAddStep} disabled={!stepName.trim()}>Hinzufügen</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAddingStep(false)}>Abbrechen</button>
                </div>
              </div>
            )}

            {selected.steps.length === 0 && !addingStep && (
              <div className="card" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 13 }}>Keine Schritte definiert</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Fügen Sie Schritte hinzu und weisen Sie Agenten zu</div>
              </div>
            )}

            {selected.steps.map((step, idx) => (
              <div key={step.id} className="card" style={{ marginBottom: 8, borderLeftWidth: 3, borderLeftColor: stepStatusColors[step.status] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}.</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{step.name}</div>
                      {step.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{step.description}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: stepStatusColors[step.status], textTransform: 'uppercase' }}>
                      {step.status === 'running' && `${step.progress}% `}{step.status}
                    </span>
                    {selected.status === 'draft' && (
                      <>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => handleMoveStep(step.id, -1)} disabled={idx === 0}>{'\u2191'}</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => handleMoveStep(step.id, 1)} disabled={idx === selected.steps.length - 1}>{'\u2193'}</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', color: 'var(--accent-red)' }} onClick={() => handleRemoveStep(step.id)}>{'\u2716'}</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar for running steps */}
                {step.status === 'running' && (
                  <div style={{ marginTop: 8, height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${step.progress}%`, background: 'var(--accent-cyan)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Agent: </span>
                    {selected.status === 'draft' ? (
                      <select
                        value={step.assignedAgentId ?? ''}
                        onChange={e => handleAssignAgent(step.id, e.target.value)}
                        style={{ padding: '2px 6px', fontSize: 11 }}
                      >
                        <option value="">-- wählen --</option>
                        {agents.filter(a => a.status !== 'suspended' && a.status !== 'error').map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ fontWeight: 600, color: step.assignedAgentId ? 'var(--accent-cyan)' : 'var(--accent-red)' }}>
                        {step.assignedAgentId ? agents.find(a => a.id === step.assignedAgentId)?.name ?? step.assignedAgentId : 'Nicht zugewiesen'}
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>~{step.estimatedDuration}s</span>
                  {step.dependsOn.length > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      Abhängig von: {step.dependsOn.map(d => selected.steps.find(s => s.id === d)?.name ?? d).join(', ')}
                    </span>
                  )}
                </div>

                {/* Output */}
                {step.output && (
                  <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-surface)', borderRadius: 6, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>
                    {step.output}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u2699'}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Workflow auswählen</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>oder einen neuen Workflow erstellen</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
