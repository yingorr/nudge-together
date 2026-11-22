import { useState } from 'react'
import { CATEGORIES, categoryLabel, priorityColor } from '../lib/constants'
import { daysUntil, formatDue, isOverdue } from '../lib/dates'
import PriorityPicker from './PriorityPicker'

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
    if (!draft.title.trim()) return
    onUpdate(task.id, {
      title: draft.title.trim(),
      category: draft.category,
      priority: draft.priority,
      due_date: draft.due_date || null,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="task editing" style={barStyle}>
        <form className="stack" onSubmit={save}>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            maxLength={200} autoFocus />
          <div className="row wrap">
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input type="date" value={draft.due_date ?? ''}
              onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
            <PriorityPicker value={draft.priority} onChange={(p) => setDraft({ ...draft, priority: p })} />
          </div>
          <div className="row between">
            <div className="row">
              <button className="btn primary small">Save</button>
              <button type="button" className="btn ghost small"
                onClick={() => { setDraft(task); setEditing(false) }}>Cancel</button>
            </div>
            <button type="button" className="btn danger small"
              onClick={() => { if (confirm(`Delete "${task.title}"?`)) onDelete(task.id) }}>
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
