import { useEffect, useState } from 'react'
import { CATEGORIES, TIME_NEEDED } from '../lib/constants'
import { dateGroup, isOverdue } from '../lib/dates'
import TaskItem from './TaskItem'

const SECTIONS = [
  { id: 'overdue', label: 'Overdue' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'later', label: 'Next week & after' },
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
  const [timeFilter, setTimeFilter] = useState('any') // 'any' | 'low' | 'medium' | 'high'
  // 'todo' shows unfinished tasks in date sections; 'done' shows only finished ones.
  const [view, setView] = useState('todo')
  const showingDone = view === 'done'

  const inCategory = (t) =>
    (filter === 'all' || t.category === filter) && (timeFilter === 'any' || t.time_needed === timeFilter)
  const visible = tasks.filter((t) =>
    showingDone ? t.completed && inCategory(t) : !t.completed && inCategory(t) && (!overdueOnly || isOverdue(t))
  )
  const doneCount = tasks.filter((t) => t.completed).length
  const overdueCount = tasks.filter(isOverdue).length

  const groups = Object.fromEntries(SECTIONS.map((s) => [s.id, []]))
  if (!showingDone) visible.forEach((t) => groups[dateGroup(t)].push(t))
  // Finished tasks: most recently completed first.
  const doneList = showingDone
    ? [...visible].sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
    : []

  return (
    <section className={readOnly ? 'stack' : 'card stack'}>
      <div className="chips">
        {[{ value: 'all', label: 'All' }, ...CATEGORIES].map((c) => (
          <button key={c.value} className={`chip ${filter === c.value ? 'active' : ''}`}
            onClick={() => setFilter(c.value)}>
            {c.label}
          </button>
        ))}
        {!showingDone && (
          <button className={`chip toggle overdue-chip ${overdueOnly ? 'active' : ''}`} aria-pressed={overdueOnly}
            onClick={() => setOverdueOnly(!overdueOnly)}>
            {overdueOnly ? '✓ ' : ''}Overdue ({overdueCount})
          </button>
        )}
        <label className={`chip select-chip ${timeFilter !== 'any' ? 'active-soft' : ''}`}>
          <span className="sr-only">Time needed</span>
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} aria-label="Filter by time needed">
            <option value="any">Time: any</option>
            {TIME_NEEDED.map((t) => <option key={t.value} value={t.value}>Time: {t.label.toLowerCase()}</option>)}
          </select>
        </label>
        <button className={`chip toggle ${showingDone ? 'active' : ''}`} aria-pressed={showingDone}
          onClick={() => setView(showingDone ? 'todo' : 'done')}>
          {showingDone ? '✓ ' : ''}Done ({doneCount})
        </button>
      </div>

      {showingDone && (
        <div className="row between done-header">
          <strong>Finished tasks</strong>
          <button className="link small" onClick={() => setView('todo')}>← Back to to-do</button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="muted empty">
          {tasks.length === 0 ? 'No tasks yet.' : showingDone ? 'Nothing finished here yet.' : 'All caught up!'}
        </p>
      ) : showingDone ? (
        <ul className="task-list">
          {doneList.map((t) => (
            <TaskItem key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} readOnly={readOnly} />
          ))}
        </ul>
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
