import type { Task, KanbanColumn } from '../types';

interface KanbanProps {
  tasks: Task[];
  onMoveTask: (taskId: string, column: KanbanColumn) => void;
}

const columns: { key: KanbanColumn; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

const priorityColors: Record<string, string> = {
  critical: 'var(--accent-red)',
  high: 'var(--accent-orange)',
  medium: 'var(--accent-blue)',
  low: 'var(--accent-teal)',
};

export default function KanbanView({ tasks, onMoveTask }: KanbanProps) {
  return (
    <div className="kanban-board">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.kanbanColumn === col.key);
        return (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-header">
              <span>{col.label}</span>
              <span className="kanban-col-count">{colTasks.length}</span>
            </div>
            <div className="kanban-cards">
              {colTasks.map(task => {
                const colIdx = columns.findIndex(c => c.key === col.key);
                const canLeft = colIdx > 0;
                const canRight = colIdx < columns.length - 1;
                return (
                  <div key={task.id} className="kanban-card">
                    <div className="kanban-card-title">{task.title}</div>
                    <div className="kanban-card-meta">
                      <span style={{ borderLeft: `2px solid ${priorityColors[task.priority]}`, paddingLeft: 4 }}>
                        {task.priority}
                      </span>
                      <span className="kanban-tag">{task.category}</span>
                      {task.assignedAgentId && <span className="kanban-tag">{task.assignedAgentId}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {canLeft && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, fontSize: 10 }}
                          onClick={() => onMoveTask(task.id, columns[colIdx - 1].key)}
                        >
                          \u2190
                        </button>
                      )}
                      {canRight && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, fontSize: 10 }}
                          onClick={() => onMoveTask(task.id, columns[colIdx + 1].key)}
                        >
                          \u2192
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
