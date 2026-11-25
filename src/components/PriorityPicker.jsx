import { PRIORITIES } from '../lib/constants'

// Optional priority, styled like the time-needed dots: three pixel dots in the priority
// colors, hollow until picked. Tap one to set it (filled), tap it again to clear it.
// The chosen priority's name shows next to the dots (hidden in compact mode).
export default function PriorityPicker({ value, onChange, compact = false }) {
  const current = PRIORITIES.find((p) => p.value === value)
  return (
    <div className={`time-dots-picker prio-dots ${compact ? 'compact' : ''}`} role="group" aria-label="Priority (optional)">
      {PRIORITIES.map((p) => (
        <button
          key={p.value}
          type="button"
          title={`${p.label} priority`}
          aria-label={`${p.label} priority`}
          aria-pressed={value === p.value}
          className={`time-dot ${value === p.value ? 'on' : ''}`}
          style={{ '--prio': p.color }}
          onClick={() => onChange(value === p.value ? null : p.value)}
        >
          <span />
        </button>
      ))}
      {!compact && <span className="time-dots-label">{current ? current.label : 'Not set'}</span>}
    </div>
  )
}
