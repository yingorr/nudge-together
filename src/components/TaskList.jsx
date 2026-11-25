import { useEffect, useState } from 'react'
import { CATEGORIES, TIME_NEEDED } from '../lib/constants'
import { dateGroup, isOverdue } from '../lib/dates'
import TaskItem from './TaskItem'
import PixelIcon from './PixelIcon'

const SECTIONS = [
  { id: 'overdue', label: 'Overdue' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'later', label: 'Next week & after' },
]

// Soonest first; on the same day, high priority first (then medium, low, none);
// then newest first.
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }
const rank = (t) => PRIORITY_RANK[t.priority] ?? 3
const byDue = (a, b) =>
  (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') ||
  rank(a) - rank(b) ||
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

export default function TaskList({ tasks, onUpdate, onDelete, readOnly = false, nudgedIds, onNudged, goalsById }) {
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
  // Friends' lists: tasks they finished in the last 3 days, so you can cheer them
  // without switching to Done. Newest first.
  const recentCutoff = Date.now() - 3 * 24 * 60 * 60 * 1000
  const recent = readOnly && !showingDone
    ? tasks
        .filter((t) => t.completed && inCategory(t) && t.completed_at && new Date(t.completed_at).getTime() > recentCutoff)
        .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
    : []
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
            {overdueOnly && <PixelIcon name="check" size={11} />}Overdue ({overdueCount})
          </button>
        )}
        {/* The chip shows "Time: Medium"; an invisible native dropdown sits on top of it,
            so the chip is only as wide as its words and the list just shows the options. */}
        <label className={`chip select-chip ${timeFilter !== 'any' ? 'active-soft' : ''}`}>
          <span aria-hidden="true">Time: {timeFilter === 'any' ? 'Any' : TIME_NEEDED.find((t) => t.value === timeFilter)?.label}</span>
          <span className="caret" aria-hidden="true" />
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} aria-label="Filter by time needed">
            <option value="any">Any</option>
            {TIME_NEEDED.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <button className={`chip toggle ${showingDone ? 'active' : ''}`} aria-pressed={showingDone}
          onClick={() => setView(showingDone ? 'todo' : 'done')}>
          {showingDone && <PixelIcon name="check" size={11} />}Done ({doneCount})
        </button>
      </div>

      {showingDone && (
        <div className="row between done-header">
          <strong>Finished tasks</strong>
          <button className="link small" onClick={() => setView('todo')}>← Back to to-do</button>
        </div>
      )}

      {visible.length === 0 && recent.length === 0 ? (
        <p className="muted empty">
          {tasks.length === 0 ? 'No tasks yet.' : showingDone ? 'Nothing finished here yet.' : 'All caught up!'}
        </p>
      ) : showingDone ? (
        <ul className="task-list">
          {doneList.map((t) => (
            <TaskItem key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} readOnly={readOnly}
                  nudged={nudgedIds?.has(t.id)} onNudged={onNudged} goal={goalsById?.[t.goal_id]} />
          ))}
        </ul>
      ) : (
        <div className="sections">
          {SECTIONS.filter((s) => groups[s.id].length > 0).map((s) => (
            <Section key={s.id} {...s} tasks={groups[s.id]} storeKey={readOnly ? 'friend' : 'mine'}>
              {groups[s.id].sort(byDue).map((t) => (
                <TaskItem key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} readOnly={readOnly}
                  nudged={nudgedIds?.has(t.id)} onNudged={onNudged} goal={goalsById?.[t.goal_id]} />
              ))}
            </Section>
          ))}
          {recent.length > 0 && (
            <Section id="recent" label="Finished recently" tasks={recent} storeKey="friend">
              {recent.map((t) => (
                <TaskItem key={t.id} task={t} readOnly
                  nudged={nudgedIds?.has(t.id)} onNudged={onNudged} goal={goalsById?.[t.goal_id]} />
              ))}
            </Section>
          )}
        </div>
      )}
    </section>
  )
}
