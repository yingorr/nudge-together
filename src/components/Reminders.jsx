import { useState } from 'react'
import { daysUntil, dayLabel, isOverdue } from '../lib/dates'

// In-app reminder banner: counts, not a full list.
// e.g. "2 overdue · 1 due today · 3 due Monday" (unfinished tasks, next 7 days)
export default function Reminders({ tasks }) {
  const [hidden, setHidden] = useState(false)

  const overdue = tasks.filter(isOverdue).length

  const byDay = new Map() // due date -> count, in date order
  tasks
    .filter((t) => !t.completed && t.due_date && daysUntil(t.due_date) >= 0 && daysUntil(t.due_date) <= 6)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .forEach((t) => byDay.set(t.due_date, (byDay.get(t.due_date) ?? 0) + 1))

  const items = []
  if (overdue) items.push({ key: 'overdue', text: `${overdue} overdue`, overdue: true })
  for (const [iso, n] of byDay) items.push({ key: iso, text: `${n} due ${dayLabel(iso)}` })

  if (hidden || items.length === 0) return null

  return (
    <section className="reminders" role="status">
      <div className="row between">
        <div className="reminder-counts">
          <span aria-hidden="true">🔔</span>
          {items.map((it) => (
            <span key={it.key} className={`reminder-count ${it.overdue ? 'overdue' : ''}`}>{it.text}</span>
          ))}
        </div>
        <button className="icon-btn" onClick={() => setHidden(true)} aria-label="Hide reminders">✕</button>
      </div>
    </section>
  )
}
