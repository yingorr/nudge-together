import { useState } from 'react'
import { dateGroup } from '../lib/dates'
import PixelIcon from './PixelIcon'

// In-app reminder banner: how many unfinished tasks are in each date section,
// e.g. "2 overdue · 1 due today · 3 this week · 1 next week & after".
const GROUPS = [
  { id: 'overdue', text: (n) => `${n} overdue` },
  { id: 'today', text: (n) => `${n} due today` },
  { id: 'week', text: (n) => `${n} this week` },
  { id: 'later', text: (n) => `${n} next week & after` },
]

export default function Reminders({ tasks }) {
  const [hidden, setHidden] = useState(false)

  const counts = {}
  tasks.filter((t) => !t.completed).forEach((t) => {
    const g = dateGroup(t)
    counts[g] = (counts[g] ?? 0) + 1
  })
  const items = GROUPS.filter((g) => counts[g.id]).map((g) => ({ id: g.id, text: g.text(counts[g.id]) }))

  if (hidden || items.length === 0) return null

  return (
    <section className="reminders" role="status">
      <div className="row between">
        <div className="reminder-counts">
          <span className="reminder-icon"><PixelIcon name="bang" size={18} /></span>
          {items.map((it) => (
            <span key={it.id} className={`reminder-count ${it.id === 'overdue' ? 'overdue' : ''}`}>{it.text}</span>
          ))}
        </div>
        <button className="icon-btn" onClick={() => setHidden(true)} aria-label="Hide reminders">✕</button>
      </div>
    </section>
  )
}
