// Due dates are stored as plain "YYYY-MM-DD" strings (no time zone),
// so we compare them against the user's *local* today.

export function todayISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Whole days from today until the given date (0 = today, 1 = tomorrow).
export function daysUntil(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const due = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((due - today) / 86400000)
}

export function formatDue(iso) {
  if (!iso) return ''
  const days = daysUntil(iso)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  const [y, m, d] = iso.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  return `Due ${label}`
}

// An unfinished task whose due date has passed.
export function isOverdue(task) {
  if (task.completed || !task.due_date) return false
  return daysUntil(task.due_date) < 0
}

// Which date section a task belongs in.
// "This week" = the next 7 days (rolling), "Next week & after" = 8+ days out.
export function dateGroup(task) {
  if (task.completed) return 'done'
  if (!task.due_date) return 'later' // shouldn't happen: due dates are required
  const d = daysUntil(task.due_date)
  if (d < 0) return 'overdue'
  if (d === 0) return 'today'
  if (d <= 7) return 'week'
  return 'later'
}

// Short label for a due day in the reminder banner: "today", "Monday", …
export function dayLabel(iso) {
  const days = daysUntil(iso)
  if (days === 0) return 'today'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long' })
}
