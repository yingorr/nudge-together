export const CATEGORIES = [
  { value: 'personal', label: 'Personal' },
  { value: 'school', label: 'School' },
  { value: 'work', label: 'Work' },
]

// Priority is optional. Each task shows a dot in its priority color.
export const PRIORITIES = [
  { value: 'high', label: 'High', color: '#e3a1a1' },   // soft rose
  { value: 'medium', label: 'Medium', color: '#f3cd5a' }, // clear golden yellow
  { value: 'low', label: 'Low', color: '#7fbf8e' },     // fresh green
]

export const priorityColor = (p) =>
  PRIORITIES.find((x) => x.value === p)?.color ?? 'transparent'

export const categoryLabel = (c) =>
  CATEGORIES.find((x) => x.value === c)?.label ?? c
