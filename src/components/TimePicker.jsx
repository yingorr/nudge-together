import { TIME_NEEDED, timeDots } from '../lib/constants'

// Optional time needed, picked like a rating: three pixel dots, tap 1-3.
// Tapping the third fills the first two as well; tapping the current level again clears it.
export default function TimePicker({ value, onChange, compact = false }) {
  const filled = timeDots(value)
  const current = TIME_NEEDED.find((t) => t.value === value)
  return (
    <div className={`time-dots-picker ${compact ? 'compact' : ''}`} role="group" aria-label="Time needed">
      {TIME_NEEDED.map((t, i) => (
        <button
          key={t.value}
          type="button"
          className={`time-dot ${i < filled ? 'on' : ''}`}
          title={`${t.label} time needed`}
          aria-label={`${t.label} time needed`}
          aria-pressed={value === t.value}
          onClick={() => onChange(value === t.value ? null : t.value)}
        >
          <span />
        </button>
      ))}
      {!compact && <span className="time-dots-label">{current ? current.label : 'Not set'}</span>}
    </div>
  )
}
