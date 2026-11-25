import { useState } from 'react'
import TaskFields from './TaskFields'

// Hidden behind an "Add task" button; opens as a card when tapped.
export default function TaskForm({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('personal')
  const [priority, setPriority] = useState(null)
  const [dueDate, setDueDate] = useState('')
  const [timeNeeded, setTimeNeeded] = useState(null)

  function reset() {
    setTitle('')
    setPriority(null)
    setDueDate('')
    setTimeNeeded(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !dueDate) return
    onAdd({ title: title.trim(), category, priority, due_date: dueDate, time_needed: timeNeeded })
    reset()
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="btn primary add-task-btn" onClick={() => setOpen(true)}>
        + Add task
      </button>
    )
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <input
        className="title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task name"
        maxLength={200}
        autoFocus
      />
      <TaskFields
        idPrefix="new"
        category={category}
        dueDate={dueDate}
        priority={priority}
        timeNeeded={timeNeeded}
        onChange={(c) => {
          if ('category' in c) setCategory(c.category)
          if ('due_date' in c) setDueDate(c.due_date)
          if ('priority' in c) setPriority(c.priority)
          if ('time_needed' in c) setTimeNeeded(c.time_needed)
        }}
      />
      <div className="row">
        <button className="btn primary" disabled={!title.trim() || !dueDate}>Add</button>
        <button type="button" className="btn ghost" onClick={() => { reset(); setOpen(false) }}>Cancel</button>
      </div>
    </form>
  )
}
