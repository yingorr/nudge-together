import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import TaskList from './TaskList'
import { isWaitingStep } from '../lib/goals'

// Read-only look at one friend's tasks. The database only returns these
// because you're accepted friends (see "read own or friends tasks" policy).
export default function FriendView({ friend }) {
  const [tasks, setTasks] = useState(null)
  const [nudgedIds, setNudgedIds] = useState(new Set()) // tasks you nudged in the last 24h
  const [goalsById, setGoalsById] = useState({})

  useEffect(() => {
    let active = true
    setTasks(null)
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', friend.id)
      .order('completed', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => { if (active) setTasks((data ?? []).filter((t) => !isWaitingStep(t))) })
    supabase.from('goals').select('id, title').eq('user_id', friend.id)
      .then(({ data }) => { if (active) setGoalsById(Object.fromEntries((data ?? []).map((g) => [g.id, g]))) })
    // Your recent nudges to this friend (the database only returns ones you sent).
    supabase
      .from('nudges')
      .select('task_id')
      .eq('to_id', friend.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .then(({ data }) => { if (active) setNudgedIds(new Set((data ?? []).map((n) => n.task_id))) })
    return () => { active = false }
  }, [friend.id])

  if (!tasks) return <p className="muted small">Loading {friend.display_name}'s tasks…</p>

  const done = tasks.filter((t) => t.completed).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="friend-view stack">
      <span className="muted small">{done} of {tasks.length} done</span>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      <TaskList tasks={tasks} readOnly nudgedIds={nudgedIds} goalsById={goalsById}
        onNudged={(id) => setNudgedIds((s) => new Set(s).add(id))} />
    </div>
  )
}
