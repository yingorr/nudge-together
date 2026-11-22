import { useState } from 'react'
import { categoryLabel, priorityColor, timeLabel } from '../lib/constants'
import TimeIcon from './TimeIcon'
import { daysUntil, formatDue, isOverdue } from '../lib/dates'
import TaskFields from './TaskFields'

export default function TaskItem({ task, onUpdate, onDelete, readOnly }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task)

  // The colored bar on the far left shows priority (none = no bar).
  const barStyle = { '--prio': priorityColor(editing ? draft.priority : task.priority) }

  function toggleDone() {
    const completed = !task.completed
    onUpdate(task.id, { completed, completed_at: completed ? new Date().toISOString() : null })
  }

  function save(e) {
    e.preventDefault()
    if (!draft.title.trim() || !draft.due_date) return
    onUpdate(task.id, {
      title: draft.title.trim(),
      category: draft.category,
      priority: draft.priority,
      time_needed: draft.time_needed ?? null,
      due_date: draft.due_date,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="task editing" style={barStyle}>
        <form className="stack" onSubmit={save}>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            maxLength={200} autoFocus />
          <TaskFields
            idPrefix={`edit-${task.id}`}
            category={draft.category}
            dueDate={draft.due_date}
            priority={draft.priority}
            timeNeeded={draft.time_needed}
            onChange={(c) => setDraft({ ...draft, ...c })}
          />
          <div className="row between">
            <div className="row">
              <button className="btn primary small" disabled={!draft.title.trim() || !draft.due_date}>Save</button>
              <button type="button" className="btn ghost small"
                onClick={() => { setDraft(task); setEditing(false) }}>Cancel</button>
            </div>
            <button type="button" className="btn danger small"
              onClick={() => onDelete(task.id)}>
              Delete
            </button>
          </div>
        </form>
      </li>
    )
  }

  const days = daysUntil(task.due_date)
  const dueSoon = !task.completed && days !== null && days >= 0 && days <= 2
  const overdue = isOverdue(task)

  return (
    <li className={`task ${task.completed ? 'done' : ''}`} style={barStyle}
      title={task.priority ? `${task.priority} priority` : undefined}>
      <div className="task-body">
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          <span className={`tag ${task.category}`}>{categoryLabel(task.category)}</span>
          {overdue && <span className="tag overdue">Overdue</span>}
          {task.time_needed && (
            <span className="time-tag" title={`${timeLabel(task.time_needed)} time needed`}
              role="img" aria-label={`${timeLabel(task.time_needed)} time needed`}>
              <TimeIcon level={task.time_needed} size={13} />
            </span>
          )}
          {task.due_date && (
            <span className={overdue || dueSoon ? 'due soon' : 'due'}>{formatDue(task.due_date)}</span>
          )}
        </span>
      </div>
      <div className="task-actions">
        {!readOnly && (
          <button className="icon-btn" onClick={() => { setDraft(task); setEditing(true) }} aria-label="Edit">✎</button>
        )}
        <button
          className={`check-btn ${task.completed ? 'checked' : ''}`}
          onClick={toggleDone}
          disabled={readOnly}
          aria-pressed={task.completed}
          aria-label={task.completed ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
        >
          ✓
        </button>
      </div>
    </li>
  )
}
