// Pie icon for "time needed": a quarter, half or full circle.
const FILL = {
  low: <path d="M7 7 L7 1.5 A5.5 5.5 0 0 1 12.5 7 Z" />,
  medium: <path d="M7 1.5 A5.5 5.5 0 0 1 7 12.5 Z" />,
  high: <circle cx="7" cy="7" r="5.5" />,
}

export default function TimeIcon({ level, size = 14 }) {
  return (
    <svg className="time-icon" viewBox="0 0 14 14" width={size} height={size} aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <g fill="currentColor">{FILL[level]}</g>
    </svg>
  )
}
