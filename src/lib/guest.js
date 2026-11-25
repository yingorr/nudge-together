import { supabase } from '../supabaseClient'
import { addDays } from './goals'
import { todayISO } from './dates'

// A few things to play with when someone tries the app as a guest.
export async function seedGuest(userId) {
  const today = todayISO()
  const tasks = [
    { title: 'Check this one off', category: 'personal', due_date: today, priority: 'low', time_needed: 'low' },
    { title: 'Tap the pencil to edit me', category: 'school', due_date: today, priority: 'medium', time_needed: 'medium' },
    { title: 'Plan the week', category: 'work', due_date: addDays(today, 1), priority: 'high', time_needed: 'high' },
    { title: 'Read a chapter', category: 'personal', due_date: addDays(today, 3), priority: null, time_needed: 'low' },
  ].map((t) => ({ ...t, user_id: userId }))
  await supabase.from('tasks').insert(tasks)

  const { data: goal } = await supabase.from('goals')
    .insert({ user_id: userId, title: 'Try out goals', category: 'personal', gap_days: 2, priority: 'medium', time_needed: 'medium' })
    .select().single()
  if (!goal) return
  const steps = ['Make a short list', 'Pick the first item', 'Work on it for 10 minutes'].map((title, i) => ({
    user_id: userId, goal_id: goal.id, step_order: i, title, category: 'personal',
    priority: 'medium', time_needed: 'medium', step_days: i === 0 ? null : 2, due_date: i === 0 ? today : null,
  }))
  await supabase.from('tasks').insert(steps)
}
