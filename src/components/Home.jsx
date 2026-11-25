import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Logo from './Logo'
import TaskForm from './TaskForm'
import TaskList from './TaskList'
import Reminders from './Reminders'
import NudgeInbox from './NudgeInbox'
import Friends from './Friends'
import FriendsPanel from './FriendsPanel'
import Pet from './Pet'
import PixelIcon from './PixelIcon'
import UndoToast from './UndoToast'
import Goals from './Goals'
import { addDays, isWaitingStep, nextToSchedule, stepsOf } from '../lib/goals'
import { todayISO } from '../lib/dates'

export default function Home({ session }) {
  const userId = session.user.id
  const [profile, setProfile] = useState(null)
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('tasks') // 'tasks' | 'goals' | 'friends'
  const [goals, setGoals] = useState([])
  const [friends, setFriends] = useState([]) // accepted friend profiles
  const [undo, setUndo] = useState(null) // last deleted task, for the Undo bar
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

  const loadGoals = useCallback(async () => {
    const { data, error } = await supabase
      .from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: true })
    if (!error) setGoals(data)
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
    loadGoals()
    loadFriends()

    // Live sync: when tasks change on another device, refresh.
    const channel = supabase
      .channel('my-tasks')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        () => loadTasks())
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` },
        () => loadGoals())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, loadTasks, loadGoals, loadFriends])

  async function addTask(task) {
    const { error } = await supabase.from('tasks').insert({ ...task, user_id: userId })
    if (error) setError(error.message)
    else loadTasks()
  }

  // Goal steps: when a goal has no scheduled unfinished step, give the next one
  // a due date its own number of days after today. Called after a step is finished or removed.
  async function scheduleNextStep(goalId, taskList) {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return
    const next = nextToSchedule(stepsOf(taskList, goalId), goal)
    if (!next) return
    setTasks((ts) => ts.map((t) => (t.id === next.step.id ? { ...t, due_date: next.due_date } : t)))
    const { error } = await supabase.from('tasks').update({ due_date: next.due_date }).eq('id', next.step.id)
    if (error) { setError(error.message); loadTasks() }
  }

  async function updateTask(id, changes) {
    if (changes.completed === true) setFeedSignal((n) => n + 1) // feed 宝宝
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...changes } : t))
    // Optimistic update so the check feels instant.
    setTasks(updated)
    const { error } = await supabase.from('tasks').update(changes).eq('id', id)
    if (error) { setError(error.message); loadTasks(); return }
    const task = updated.find((t) => t.id === id)
    if (changes.completed === true && task?.goal_id) scheduleNextStep(task.goal_id, updated)
  }

  // Delete right away, with an Undo bar instead of an "are you sure?" pop-up.
  async function deleteTask(id) {
    const removed = tasks.find((t) => t.id === id)
    setTasks((ts) => ts.filter((t) => t.id !== id))
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { setError(error.message); loadTasks(); return }
    if (removed) setUndo({ task: removed, key: Date.now() })
    if (removed?.goal_id) scheduleNextStep(removed.goal_id, tasks.filter((t) => t.id !== id))
  }

  // ---------- goals ----------
  async function createGoal(goal, stepTitles, firstDue) {
    const { data, error } = await supabase.from('goals').insert({ ...goal, user_id: userId }).select().single()
    if (error) { setError(error.message); return false }
    const steps = stepTitles.map((s, i) => ({
      user_id: userId, goal_id: data.id, step_order: i, title: s.title, category: goal.category,
      priority: goal.priority, time_needed: goal.time_needed,
      step_days: i === 0 ? null : s.days,
      due_date: i === 0 ? firstDue : null,
    }))
    const { error: stepError } = await supabase.from('tasks').insert(steps)
    if (stepError) { setError(stepError.message); return false }
    loadGoals(); loadTasks()
    return true
  }

  async function updateGoal(id, changes) {
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, ...changes } : g)))
    const { error } = await supabase.from('goals').update(changes).eq('id', id)
    if (error) { setError(error.message); loadGoals() }
    // Category applies to every step; priority / time needed to unfinished steps.
    const old = goals.find((g) => g.id === id)
    const jobs = []
    if (changes.category && changes.category !== old?.category)
      jobs.push(supabase.from('tasks').update({ category: changes.category }).eq('goal_id', id))
    const stepChanges = {}
    if ('priority' in changes && changes.priority !== (old?.priority ?? null)) stepChanges.priority = changes.priority
    if ('time_needed' in changes && changes.time_needed !== (old?.time_needed ?? null)) stepChanges.time_needed = changes.time_needed
    if (Object.keys(stepChanges).length)
      jobs.push(supabase.from('tasks').update(stepChanges).eq('goal_id', id).eq('completed', false))
    if (jobs.length) {
      const results = await Promise.all(jobs)
      const failed = results.find((r) => r.error)
      if (failed) setError(failed.error.message)
      loadTasks()
    }
  }

  async function deleteGoal(id) {
    setGoals((gs) => gs.filter((g) => g.id !== id))
    setTasks((ts) => ts.filter((t) => t.goal_id !== id))
    const { error } = await supabase.from('goals').delete().eq('id', id) // its steps go with it
    if (error) setError(error.message)
    loadGoals(); loadTasks()
  }

  // New step goes at the end; if nothing is scheduled (e.g. the goal was finished), it becomes current.
  // Insert a new waiting step right after `afterStep`, shifting later steps down one.
  async function insertStep(goal, afterStep, title, days) {
    const after = afterStep.step_order ?? 0
    const later = stepsOf(tasks, goal.id).filter((s) => (s.step_order ?? 0) > after)
    const shifts = await Promise.all(later.map((s) =>
      supabase.from('tasks').update({ step_order: (s.step_order ?? 0) + 1 }).eq('id', s.id)))
    const shiftError = shifts.find((r) => r.error)
    if (shiftError) { setError(shiftError.error.message); loadTasks(); return }
    const { error } = await supabase.from('tasks').insert({
      user_id: userId, goal_id: goal.id, step_order: after + 1, title, category: goal.category, step_days: days,
      priority: goal.priority ?? null, time_needed: goal.time_needed ?? null, due_date: null,
    })
    if (error) setError(error.message)
    loadTasks()
  }

  async function addStep(goal, title, days) {
    const steps = stepsOf(tasks, goal.id)
    const order = steps.length ? Math.max(...steps.map((s) => s.step_order ?? 0)) + 1 : 0
    const hasCurrent = steps.some((s) => !s.completed && s.due_date)
    const { error } = await supabase.from('tasks').insert({
      user_id: userId, goal_id: goal.id, step_order: order, title, category: goal.category, step_days: days,
      priority: goal.priority ?? null, time_needed: goal.time_needed ?? null,
      due_date: hasCurrent ? null : addDays(todayISO(), days),
    })
    if (error) setError(error.message)
    loadTasks()
  }



  // Put the deleted task back exactly as it was (same id, dates, done state).
  async function undoDelete() {
    const task = undo?.task
    setUndo(null)
    if (!task) return
    const { error } = await supabase.from('tasks').insert(task)
    if (error) setError(error.message)
    loadTasks()
  }


  // My tasks shows normal tasks and each goal's current step; waiting steps stay in the Goals tab.
  const listTasks = tasks.filter((t) => !isWaitingStep(t))
  const goalsById = Object.fromEntries(goals.map((g) => [g.id, g]))

  // Treats = tasks finished in the last 24 hours.
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  const treatsToday = tasks.filter(
    (t) => t.completed && t.completed_at && new Date(t.completed_at).getTime() > dayAgo
  ).length

  return (
    <>
    <div className={`app ${showPet ? 'with-pet' : ''}`}>
      <header className="topbar">
        <h1 className="logo"><Logo /></h1>
        <div className="topbar-right">
          <span className="muted small">{profile?.display_name}</span>
          <button className={`icon-btn pet-toggle ${showPet ? '' : 'off'}`} onClick={() => setShowPet(!showPet)}
            aria-pressed={showPet} aria-label={showPet ? 'Hide the cat' : 'Show the cat'} title={showPet ? 'Hide the cat' : 'Show the cat'}>
            <PixelIcon name="paw" size={14} />
          </button>
          <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>Log out</button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>My tasks</button>
        <button className={tab === 'goals' ? 'active' : ''} onClick={() => setTab('goals')}>Goals</button>
        <button className={tab === 'friends' ? 'active' : ''} onClick={() => setTab('friends')}>Friends</button>
      </nav>

      {error && (
        <p className="notice error" onClick={() => setError(null)}>{error} (tap to dismiss)</p>
      )}

      {tab === 'tasks' && (
        <main className="stack">
          <NudgeInbox userId={userId} />
          <Reminders tasks={listTasks} />
          <TaskForm onAdd={addTask} />
          <TaskList tasks={listTasks} goalsById={goalsById} onUpdate={updateTask} onDelete={deleteTask} />

          <FriendsPanel friends={friends} focusFriend={focusFriend} />
        </main>
      )}

      {tab === 'goals' && (
        <Goals
          goals={goals}
          tasks={tasks}
          onCreateGoal={createGoal}
          onUpdateTask={updateTask}
          onUpdateGoal={updateGoal}
          onDeleteGoal={deleteGoal}
          onAddStep={addStep}
          onInsertStep={insertStep}
          onDeleteTask={deleteTask}
        />
      )}

      {tab === 'friends' && (
        <Friends
          userId={userId}
          loadFriends={loadFriends}
          onViewFriend={(id) => { setFocusFriend({ id }); setTab('tasks') }}
        />
      )}

    </div>

    {undo && (
      <UndoToast key={undo.key} message={`Deleted "${undo.task.title}"`} onUndo={undoDelete} onClose={() => setUndo(null)} />
    )}

    {/* Outside .app so that on wide screens the task column sits on top of the cat */}
    {showPet && <Pet treats={treatsToday} feedSignal={feedSignal} />}
    </>
  )
}
