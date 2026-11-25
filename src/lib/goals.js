import { todayISO } from './dates'

// A goal's steps are tasks with goal_id + step_order.
// Only one step is "current" (has a due date); the rest wait with no date.

export const DEFAULT_DAYS = 2

// "YYYY-MM-DD" + n days, in local time.
export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d + n)
  const pad = (x) => String(x).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const stepsOf = (tasks, goalId) =>
  tasks.filter((t) => t.goal_id === goalId).sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0))

// A goal step that hasn't been scheduled yet.
export const isWaitingStep = (t) => Boolean(t.goal_id) && !t.due_date && !t.completed

// How many days after the previous step this step is due.
export const daysFor = (step, goal) => step.step_days ?? goal?.gap_days ?? DEFAULT_DAYS

// After a step is finished or removed: if no unfinished step has a due date,
// return the next waiting step and the date it should get (today + its days). Else null.
export function nextToSchedule(steps, goal) {
  const open = steps.filter((s) => !s.completed)
  if (open.length === 0 || open.some((s) => s.due_date)) return null
  return { step: open[0], due_date: addDays(todayISO(), daysFor(open[0], goal)) }
}

// Keep a typed "days" value a whole number from 1 to 60.
export const clampDays = (v) => Math.min(60, Math.max(1, Math.round(Number(v) || DEFAULT_DAYS)))

// The step currently in your task list (lowest-order unfinished step with a date).
export const currentStep = (steps) => steps.find((s) => !s.completed && s.due_date) ?? null
