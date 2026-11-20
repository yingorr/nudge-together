import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import TaskForm from './TaskForm'
import TaskList from './TaskList'
import Reminders from './Reminders'
import Friends from './Friends'
import FriendView from './FriendView'

// Remember the "show friends" switch on this device.
function useStoredToggle(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const v = localStorage.getItem(key)
      return v === null ? initial : v === 'true'
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, String(value)) } catch { /* ignore */ }
  }, [key, value])
  return [value, setValue]
}

export default function Home({ session }) {
  const userId = session.user.id
  const [profile, setProfile] = useState(null)
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('tasks') // 'tasks' | 'friends'
  const [showFriends, setShowFriends] = useStoredToggle('nudge.showFriends', false)
  const [friends, setFriends] = useState([]) // accepted friend profiles
  const [selectedFriend, setSelectedFriend] = useState('')

  const loadTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('completed', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setTasks(data)
  }, [userId])

  const loadFriends = useCallback(async () => {
    const { data, error } = await supabase
      .from('friendships')
      .select(`id, status, requester_id, addressee_id,
        requester:profiles!friendships_requester_id_fkey(id, display_name),
        addressee:profiles!friendships_addressee_id_fkey(id, display_name)`)
    if (error) { setError(error.message); return [] }
    setFriends(
      data
        .filter((f) => f.status === 'accepted')
        .map((f) => (f.requester_id === userId ? f.addressee : f.requester))
    )
    return data
  }, [userId])

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => setProfile(data))
    loadTasks()
    loadFriends()

    // Live sync: when tasks change on another device, refresh.
    const channel = supabase
      .channel('my-tasks')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        () => loadTasks())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, loadTasks, loadFriends])

  async function addTask(task) {
    const { error } = await supabase.from('tasks').insert({ ...task, user_id: userId })
    if (error) setError(error.message)
    else loadTasks()
  }

  async function updateTask(id, changes) {
    // Optimistic update so the checkbox feels instant.
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...changes } : t)))
    const { error } = await supabase.from('tasks').update(changes).eq('id', id)
    if (error) { setError(error.message); loadTasks() }
  }

  async function deleteTask(id) {
    setTasks((ts) => ts.filter((t) => t.id !== id))
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { setError(error.message); loadTasks() }
  }

  const friendProfile = friends.find((f) => f.id === selectedFriend)

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="logo">Nudge Together</h1>
        <div className="topbar-right">
          <span className="muted small">{profile?.display_name}</span>
          <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>Log out</button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>My tasks</button>
        <button className={tab === 'friends' ? 'active' : ''} onClick={() => setTab('friends')}>Friends</button>
      </nav>

      {error && (
        <p className="notice error" onClick={() => setError(null)}>{error} (tap to dismiss)</p>
      )}

      {tab === 'tasks' && (
        <main className="stack">
          <Reminders tasks={tasks} />
          <TaskForm onAdd={addTask} />
          <TaskList tasks={tasks} onUpdate={updateTask} onDelete={deleteTask} />

          <section className="card">
            <label className="switch-row">
              <input type="checkbox" checked={showFriends}
                onChange={(e) => setShowFriends(e.target.checked)} />
              Show friends' tasks
            </label>
            {showFriends && (
              friends.length === 0 ? (
                <p className="muted small">No friends yet — add some in the Friends tab.</p>
              ) : (
                <>
                  <select value={selectedFriend} onChange={(e) => setSelectedFriend(e.target.value)}>
                    <option value="">Choose a friend…</option>
                    {friends.map((f) => (
                      <option key={f.id} value={f.id}>{f.display_name}</option>
                    ))}
                  </select>
                  {friendProfile && <FriendView friend={friendProfile} />}
                </>
              )
            )}
          </section>
        </main>
      )}

      {tab === 'friends' && (
        <Friends
          userId={userId}
          loadFriends={loadFriends}
          onViewFriend={(id) => { setShowFriends(true); setSelectedFriend(id); setTab('tasks') }}
        />
      )}
    </div>
  )
}
