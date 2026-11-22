import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import TaskForm from './TaskForm'
import TaskList from './TaskList'
import Reminders from './Reminders'
import Friends from './Friends'
import FriendsPanel from './FriendsPanel'
import Pet from './Pet'

export default function Home({ session }) {
  const userId = session.user.id
  const [profile, setProfile] = useState(null)
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('tasks') // 'tasks' | 'friends'
  const [friends, setFriends] = useState([]) // accepted friend profiles
  const [feedSignal, setFeedSignal] = useState(0) // bumps each time a task is completed
  const [showPet, setShowPet] = useState(() => {
    try { return localStorage.getItem('nudge.pet') !== 'false' } catch { return true }
  })
  useEffect(() => {
    try { localStorage.setItem('nudge.pet', String(showPet)) } catch { /* ignore */ }
  }, [showPet])
  const [focusFriend, setFocusFriend] = useState(null) // { id } to open from the Friends tab

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
    if (changes.completed === true) setFeedSignal((n) => n + 1) // feed 宝宝
    // Optimistic update so the check feels instant.
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...changes } : t)))
    const { error } = await supabase.from('tasks').update(changes).eq('id', id)
    if (error) { setError(error.message); loadTasks() }
  }

  async function deleteTask(id) {
    setTasks((ts) => ts.filter((t) => t.id !== id))
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { setError(error.message); loadTasks() }
  }


  // Treats = tasks finished in the last 24 hours.
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  const treatsToday = tasks.filter(
    (t) => t.completed && t.completed_at && new Date(t.completed_at).getTime() > dayAgo
  ).length

  return (
    <>
    <div className={`app ${showPet ? 'with-pet' : ''}`}>
      <header className="topbar">
        <h1 className="logo">Nudge Together</h1>
        <div className="topbar-right">
          <span className="muted small">{profile?.display_name}</span>
          <button className={`icon-btn pet-toggle ${showPet ? '' : 'off'}`} onClick={() => setShowPet(!showPet)}
            aria-pressed={showPet} aria-label={showPet ? 'Hide the cat' : 'Show the cat'} title={showPet ? 'Hide the cat' : 'Show the cat'}>🐾</button>
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

          <FriendsPanel friends={friends} focusFriend={focusFriend} />
        </main>
      )}

      {tab === 'friends' && (
        <Friends
          userId={userId}
          loadFriends={loadFriends}
          onViewFriend={(id) => { setFocusFriend({ id }); setTab('tasks') }}
        />
      )}

    </div>

    {/* Outside .app so that on wide screens the task column sits on top of the cat */}
    {showPet && <Pet treats={treatsToday} feedSignal={feedSignal} />}
    </>
  )
}
