import { useState } from 'react'
import { CATEGORIES, categoryLabel, priorityColor } from '../lib/constants'
import { daysUntil, formatDue } from '../lib/dates'
import PriorityPicker from './PriorityPicker'

export default function TaskItem({ task, onUpdate, onDelete, readOnly }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task)

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
      <li className="task editing">
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
          <div className="row">
            <button className="btn primary small">Save</button>
            <button type="button" className="btn ghost small"
              onClick={() => { setDraft(task); setEditing(false) }}>Cancel</button>
          </div>
        </form>
      </li>
    )
  }

  const days = daysUntil(task.due_date)
  const dueSoon = !task.completed && days !== null && days >= 0 && days <= 2

  return (
    <li className={`task ${task.completed ? 'done' : ''}`}>
      <input
        type="checkbox"
        className="check"
        checked={task.completed}
        onChange={toggleDone}
        disabled={readOnly}
        aria-label={`Mark "${task.title}" ${task.completed ? 'not done' : 'done'}`}
      />
      <span className="prio-dot" style={{ background: priorityColor(task.priority) }}
        title={task.priority ? `${task.priority} priority` : 'No priority'} />
      <div className="task-body">
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          <span className={`tag ${task.category}`}>{categoryLabel(task.category)}</span>
          {task.due_date && <span className={dueSoon ? 'due soon' : 'due'}>{formatDue(task.due_date)}</span>}
        </span>
      </div>
      {!readOnly && (
        <div className="task-actions">
          <button className="icon-btn" onClick={() => { setDraft(task); setEditing(true) }} aria-label="Edit">✎</button>
          <button className="icon-btn danger"
            onClick={() => { if (confirm(`Delete "${task.title}"?`)) onDelete(task.id) }}
            aria-label="Delete">✕</button>
        </div>
      )}
    </li>
  )
}
