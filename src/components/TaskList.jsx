import { useEffect, useState } from 'react'
import { CATEGORIES } from '../lib/constants'
import { dateGroup, isOverdue } from '../lib/dates'
import TaskItem from './TaskItem'

const SECTIONS = [
  { id: 'overdue', label: 'Overdue' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'later', label: 'Next week & after' },
  { id: 'nodate', label: 'No due date' },
  { id: 'done', label: 'Done' },
]

// Soonest first; undated tasks keep newest-first order.
const byDue = (a, b) =>
  (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') ||
  (b.created_at ?? '').localeCompare(a.created_at ?? '')

// One collapsible date section. Open/closed is remembered per device.
function Section({ id, label, tasks, storeKey, children }) {
  const key = `nudge.section.${storeKey}.${id}`
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(key) !== 'false' } catch { return true }
  })
  useEffect(() => {
    try { localStorage.setItem(key, String(open)) } catch { /* ignore */ }
  }, [key, open])

  return (
    <div className={`task-section ${id}`}>
      <button className="section-bar" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{label} <span className="section-count">{tasks.length}</span></span>
        <span className={`chevron ${open ? 'open' : ''}`} aria-hidden="true">▸</span>
      </button>
      {open && <ul className="task-list">{children}</ul>}
    </div>
  )
}

export default function TaskList({ tasks, onUpdate, onDelete, readOnly = false }) {
  const [filter, setFilter] = useState('all')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [showDone, setShowDone] = useState(true)

  const visible = tasks.filter(
    (t) =>
      (filter === 'all' || t.category === filter) &&
      (!overdueOnly || isOverdue(t)) &&
      (showDone || !t.completed)
  )
  const doneCount = tasks.filter((t) => t.completed).length
  const overdueCount = tasks.filter(isOverdue).length

  const groups = Object.fromEntries(SECTIONS.map((s) => [s.id, []]))
  visible.forEach((t) => groups[dateGroup(t)].push(t))

  return (
    <section className={readOnly ? 'stack' : 'card stack'}>
      <div className="chips">
        {[{ value: 'all', label: 'All' }, ...CATEGORIES].map((c) => (
          <button key={c.value} className={`chip ${filter === c.value ? 'active' : ''}`}
            onClick={() => setFilter(c.value)}>
            {c.label}
          </button>
        ))}
        <button className={`chip toggle overdue-chip ${overdueOnly ? 'active' : ''}`} aria-pressed={overdueOnly}
          onClick={() => setOverdueOnly(!overdueOnly)}>
          {overdueOnly ? '✓ ' : ''}Overdue ({overdueCount})
        </button>
        <button className={`chip toggle ${showDone ? 'active' : ''}`} aria-pressed={showDone}
          onClick={() => setShowDone(!showDone)}>
          {showDone ? '✓ ' : ''}Done ({doneCount}/{tasks.length})
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="muted empty">{tasks.length === 0 ? 'No tasks yet.' : 'Nothing here.'}</p>
      ) : (
        <div className="sections">
          {SECTIONS.filter((s) => groups[s.id].length > 0).map((s) => (
            <Section key={s.id} {...s} tasks={groups[s.id]} storeKey={readOnly ? 'friend' : 'mine'}>
              {groups[s.id].sort(byDue).map((t) => (
                <TaskItem key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} readOnly={readOnly} />
              ))}
            </Section>
          ))}
        </div>
      )}
    </section>
  )
}
