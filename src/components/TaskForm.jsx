import { useState } from 'react'
import { CATEGORIES } from '../lib/constants'
import PriorityPicker from './PriorityPicker'

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('personal')
  const [priority, setPriority] = useState(null)
  const [dueDate, setDueDate] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), category, priority, due_date: dueDate || null })
    setTitle('')
    setPriority(null)
    setDueDate('')
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <input
        className="title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a small step… e.g. Study GMAT section 1"
        maxLength={200}
      />
      <div className="row wrap">
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
        <PriorityPicker value={priority} onChange={setPriority} />
        <button className="btn primary" disabled={!title.trim()}>Add</button>
      </div>
    </form>
  )
}
