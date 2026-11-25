export const CATEGORIES = [
  { value: 'personal', label: 'Personal' },
  { value: 'school', label: 'School' },
  { value: 'work', label: 'Work' },
]

// Priority is optional. Each task shows a short bar in its priority color next to the title.
export const PRIORITIES = [
  { value: 'high', label: 'High', color: '#e3a1a1' },   // soft rose
  { value: 'medium', label: 'Medium', color: '#f3cd5a' }, // clear golden yellow
  { value: 'low', label: 'Low', color: '#7fbf8e' },     // fresh green
]

export const priorityColor = (p) =>
  PRIORITIES.find((x) => x.value === p)?.color ?? 'transparent'

export const categoryLabel = (c) =>
  CATEGORIES.find((x) => x.value === c)?.label ?? c

// Optional "time needed" estimate. A quarter / half / full circle shows how big the task is.
export const TIME_NEEDED = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export const timeLabel = (t) => TIME_NEEDED.find((x) => x.value === t)?.label ?? null

// "Time needed" is shown as 1-3 pixel dots (low / medium / high), colored by priority.
export const timeDots = (t) => ({ low: 1, medium: 2, high: 3 })[t] ?? 0
export const DOT_NONE = 'color-mix(in srgb, var(--muted) 45%, transparent)' // dots when no priority is set
// CSS variables for the dot column on the left of a task or goal step.
// Priority but no time needed: one thin dash, about the height of two and a half dots.
export const dotStyle = (priority, time) => {
  const n = timeDots(time)
  if (!n && priority) {
    return { '--prio': priorityColor(priority), '--dots-h': '12px', '--dots-w': '2px', '--dots-x': '1px', '--dots-bg': 'var(--prio)' }
  }
  return {
    '--prio': priority ? priorityColor(priority) : DOT_NONE,
    '--dots-h': `${n ? n * 4 + (n - 1) * 2 : 0}px`,
  }
}
