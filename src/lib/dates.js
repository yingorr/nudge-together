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
