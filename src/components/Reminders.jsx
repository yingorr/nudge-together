import { useState } from 'react'
import { daysUntil, formatDue } from '../lib/dates'

// In-app reminders: a banner of unfinished tasks due today or in the next 2 days.
// (Overdue alerts and push/email notifications are out of scope for v1.)
export default function Reminders({ tasks }) {
  const [hidden, setHidden] = useState(false)

  const upcoming = tasks
    .filter((t) => {
      if (t.completed || !t.due_date) return false
      const d = daysUntil(t.due_date)
      return d >= 0 && d <= 2
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  if (hidden || upcoming.length === 0) return null

  return (
    <section className="reminders" role="status">
      <div className="row between">
        <strong>🔔 {upcoming.length} coming up</strong>
        <button className="icon-btn" onClick={() => setHidden(true)} aria-label="Hide reminders">✕</button>
      </div>
      <ul>
        {upcoming.map((t) => (
          <li key={t.id}>
            <span>{t.title}</span>
            <span className="muted small">{formatDue(t.due_date)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
