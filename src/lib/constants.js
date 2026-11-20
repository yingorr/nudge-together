export const CATEGORIES = [
  { value: 'personal', label: 'Personal' },
  { value: 'school', label: 'School' },
  { value: 'work', label: 'Work' },
]

// Priority is optional. Each task shows a dot in its priority color.
export const PRIORITIES = [
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'low', label: 'Low', color: '#22c55e' },
]

export const priorityColor = (p) =>
  PRIORITIES.find((x) => x.value === p)?.color ?? 'transparent'

export const categoryLabel = (c) =>
  CATEGORIES.find((x) => x.value === c)?.label ?? c
