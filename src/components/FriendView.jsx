import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import TaskList from './TaskList'

// Read-only look at one friend's tasks. The database only returns these
// because you're accepted friends (see "read own or friends tasks" policy).
export default function FriendView({ friend }) {
  const [tasks, setTasks] = useState(null)

  useEffect(() => {
    let active = true
    setTasks(null)
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', friend.id)
      .order('completed', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => { if (active) setTasks(data ?? []) })
    return () => { active = false }
  }, [friend.id])

  if (!tasks) return <p className="muted small">Loading {friend.display_name}'s tasks…</p>

  const done = tasks.filter((t) => t.completed).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="friend-view stack">
      <span className="muted small">{done} of {tasks.length} done</span>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      <TaskList tasks={tasks} readOnly />
    </div>
  )
}
