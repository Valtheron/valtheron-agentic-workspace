import { useState, useRef } from 'react';
import type { Task, KanbanColumn, Agent, TaskType } from '../types';

interface KanbanProps {
  tasks: Task[];
  agents: Agent[];
  onMoveTask: (taskId: string, column: KanbanColumn) => void;
  onUpdateTask: (task: Task) => void;
  onCreateTask: (task: Task) => void;
}

const columns: { key: KanbanColumn; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: 'var(--text-muted)' },
  { key: 'todo', label: 'To Do', color: 'var(--accent-blue)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--accent-cyan)' },
  { key: 'review', label: 'Review', color: 'var(--accent-orange)' },
  { key: 'done', label: 'Done', color: 'var(--accent-green)' },
];

const priorityColors: Record<string, string> = {
  critical: 'var(--accent-red)', high: 'var(--accent-orange)',
  medium: 'var(--accent-blue)', low: 'var(--accent-teal)',
};

const taskTypeIcons: Record<string, string> = {
  feature: '\u2726', bug: '\u2622', improvement: '\u2191', research: '\u2315',
  documentation: '\u2261', testing: '\u2713', deployment: '\u2601', review: '\u2398',
};

function genId() { return `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

export default function KanbanView({ tasks, agents, onMoveTask, onUpdateTask, onCreateTask }: KanbanProps) {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanColumn | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TaskType>('feature');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newColumn, setNewColumn] = useState<KanbanColumn>('backlog');
  const dragRef = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    dragRef.current = taskId;
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, col: KanbanColumn) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, col: KanbanColumn) => {
    e.preventDefault();
    const taskId = dragRef.current ?? e.dataTransfer.getData('text/plain');
    if (taskId) onMoveTask(taskId, col);
    setDragTaskId(null);
    setDragOverCol(null);
    dragRef.current = null;
  };

  const handleDragEnd = () => {
    setDragTaskId(null);
    setDragOverCol(null);
    dragRef.current = null;
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: genId(), title: newTitle.trim(), description: '', status: 'pending',
      priority: newPriority, assignedAgentId: null, category: 'development',
      createdAt: new Date().toISOString(), dependencies: [], kanbanColumn: newColumn,
      tags: [], taskType: newType, progress: 0,
    };
    onCreateTask(task);
    setNewTitle('');
    setShowCreate(false);
  };

  const getDepsForTask = (t: Task) => {
    if (!t.dependencies?.length) return [];
    return tasks.filter(dep => t.dependencies.includes(dep.id));
  };

  const isDeadlineSoon = (d?: string) => {
    if (!d) return false;
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 48 * 3600000;
  };

  const isOverdue = (d?: string) => {
    if (!d) return false;
    return new Date(d).getTime() < Date.now();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {tasks.length} Tasks &middot; Drag & Drop zum Verschieben
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          + Neuer Task
        </button>
      </div>

      {showCreate && (
        <div className="card mb-16" style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Titel</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task-Titel..." style={{ width: '100%' }} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Typ</label>
            <select value={newType} onChange={e => setNewType(e.target.value as TaskType)} style={{ width: '100%' }}>
              {Object.keys(taskTypeIcons).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Prioritaet</label>
            <select value={newPriority} onChange={e => setNewPriority(e.target.value as Task['priority'])} style={{ width: '100%' }}>
              {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Spalte</label>
            <select value={newColumn} onChange={e => setNewColumn(e.target.value as KanbanColumn)} style={{ width: '100%' }}>
              {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleCreate}>Erstellen</button>
        </div>
      )}

      <div className="kanban-board">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.kanbanColumn === col.key);
          const isDragTarget = dragOverCol === col.key;
          return (
            <div
              key={col.key}
              className="kanban-col"
              onDragOver={e => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.key)}
              style={{
                borderColor: isDragTarget ? col.color : undefined,
                background: isDragTarget ? 'rgba(0,229,255,0.03)' : undefined,
              }}
            >
              <div className="kanban-col-header" style={{ borderBottomColor: col.color }}>
                <span style={{ color: col.color }}>{col.label}</span>
                <span className="kanban-col-count">{colTasks.length}</span>
              </div>
              <div className="kanban-cards">
                {colTasks.map(task => {
                  const deps = getDepsForTask(task);
                  const isExpanded = expandedTask === task.id;
                  const isDragging = dragTaskId === task.id;
                  const progress = task.progress ?? 0;

                  return (
                    <div
                      key={task.id}
                      className="kanban-card"
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                      style={{
                        opacity: isDragging ? 0.4 : 1,
                        borderLeftColor: priorityColors[task.priority],
                        borderLeftWidth: 3,
                        cursor: 'grab',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div className="kanban-card-title" style={{ flex: 1 }}>
                          <span style={{ marginRight: 4, opacity: 0.6 }}>{taskTypeIcons[task.taskType ?? 'feature']}</span>
                          {task.title}
                        </div>
                      </div>

                      {progress > 0 && (
                        <div style={{ height: 3, background: 'var(--bg-hover)', borderRadius: 2, marginBottom: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: col.color, borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                      )}

                      <div className="kanban-card-meta">
                        <span style={{ borderLeft: `2px solid ${priorityColors[task.priority]}`, paddingLeft: 4 }}>
                          {task.priority}
                        </span>
                        <span className="kanban-tag">{task.taskType ?? task.category}</span>
                        {deps.length > 0 && (
                          <span style={{ fontSize: 9, color: 'var(--accent-purple)' }} title={deps.map(d => d.title).join(', ')}>
                            {deps.length} dep{deps.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {task.deadline && (
                          <span style={{
                            fontSize: 9,
                            color: isOverdue(task.deadline) ? 'var(--accent-red)' : isDeadlineSoon(task.deadline) ? 'var(--accent-orange)' : 'var(--text-muted)',
                            fontWeight: isOverdue(task.deadline) ? 600 : 400,
                          }}>
                            {new Date(task.deadline).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)', fontSize: 11 }} onClick={e => e.stopPropagation()}>
                          {task.description && (
                            <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{task.description}</div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div>
                              <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Agent zuweisen</label>
                              <select
                                value={task.assignedAgentId ?? ''}
                                onChange={e => onUpdateTask({ ...task, assignedAgentId: e.target.value || null })}
                                style={{ width: '100%', fontSize: 11 }}
                              >
                                <option value="">-- Kein Agent --</option>
                                {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.category})</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Deadline</label>
                              <input
                                type="date"
                                value={task.deadline?.slice(0, 10) ?? ''}
                                onChange={e => onUpdateTask({ ...task, deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                style={{ width: '100%', fontSize: 11 }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Progress ({progress}%)</label>
                              <input
                                type="range" min="0" max="100" value={progress}
                                onChange={e => onUpdateTask({ ...task, progress: +e.target.value })}
                                style={{ width: '100%' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Abhaengigkeiten</label>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {deps.length > 0
                                  ? deps.map(d => <span key={d.id} className="kanban-tag" style={{ marginRight: 4 }}>{d.title}</span>)
                                  : 'Keine'}
                              </div>
                            </div>
                          </div>
                          {task.assignedAgentId && (
                            <div style={{ marginTop: 6, fontSize: 10, color: 'var(--accent-cyan)' }}>
                              Zugewiesen: {agents.find(a => a.id === task.assignedAgentId)?.name ?? task.assignedAgentId}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
