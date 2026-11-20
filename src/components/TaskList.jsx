import { useState } from 'react'
import { CATEGORIES } from '../lib/constants'
import TaskItem from './TaskItem'

export default function TaskList({ tasks, onUpdate, onDelete, readOnly = false }) {
  const [filter, setFilter] = useState('all')
  const [showDone, setShowDone] = useState(true)

  const visible = tasks.filter(
    (t) => (filter === 'all' || t.category === filter) && (showDone || !t.completed)
  )
  const doneCount = tasks.filter((t) => t.completed).length

  return (
    <section className={readOnly ? 'stack' : 'card stack'}>
      <div className="row wrap between">
        <div className="chips">
          {[{ value: 'all', label: 'All' }, ...CATEGORIES].map((c) => (
            <button key={c.value} className={`chip ${filter === c.value ? 'active' : ''}`}
              onClick={() => setFilter(c.value)}>
              {c.label}
            </button>
          ))}
        </div>
        <button className={`chip toggle ${showDone ? 'active' : ''}`} aria-pressed={showDone}
          onClick={() => setShowDone(!showDone)}>
          {showDone ? '✓ ' : ''}Done ({doneCount}/{tasks.length})
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="muted empty">{tasks.length === 0 ? 'No tasks yet.' : 'Nothing here.'}</p>
      ) : (
        <ul className="task-list">
          {visible.map((t) => (
            <TaskItem key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} readOnly={readOnly} />
          ))}
        </ul>
      )}
    </section>
  )
}
