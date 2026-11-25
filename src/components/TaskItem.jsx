import { useState } from 'react'
import { categoryLabel, timeLabel, dotStyle } from '../lib/constants'
import { daysUntil, formatDue, isOverdue } from '../lib/dates'
import TaskFields from './TaskFields'
import NudgeButton from './NudgeButton'
import PixelIcon from './PixelIcon'

export default function TaskItem({ task, onUpdate, onDelete, readOnly, nudged, onNudged, goal }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task)

  // The colored bar on the far left shows priority (none = no bar).
  const barStyle = dotStyle(editing ? draft.priority : task.priority, editing ? draft.time_needed : task.time_needed)

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
      title={[task.priority && `${task.priority} priority`, task.time_needed && `${timeLabel(task.time_needed).toLowerCase()} time needed`].filter(Boolean).join(' · ') || undefined}>
      <div className="task-body">
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          <span className={`tag ${task.category}`}>{categoryLabel(task.category)}</span>
          {overdue && <span className="tag overdue">Overdue</span>}
          {goal && <span className="goal-tag" title={`Step of the goal "${goal.title}"`}>◎ {goal.title}</span>}
          {task.due_date && (
            <span className={overdue || dueSoon ? 'due soon' : 'due'}>{formatDue(task.due_date)}</span>
          )}
        </span>
      </div>
      <div className="task-actions">
        {!readOnly && (
          <button className="icon-btn" onClick={() => { setDraft(task); setEditing(true) }} aria-label="Edit"><PixelIcon name="pencil" size={13} /></button>
        )}
        {readOnly ? (
          <NudgeButton task={task} sentRecently={nudged} onSent={onNudged} />
        ) : (
          <button
            className={`check-btn ${task.completed ? 'checked' : ''}`}
            onClick={toggleDone}
            aria-pressed={task.completed}
            aria-label={task.completed ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
          >
            <PixelIcon name="check" size={16} />
          </button>
        )}
      </div>
    </li>
  )
}
