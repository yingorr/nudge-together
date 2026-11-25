import { PRIORITIES } from '../lib/constants'

// Optional priority: tap a color to set it, tap it again to clear it.
// compact: colored dots only (the name is in the tooltip / screen-reader label).
export default function PriorityPicker({ value, onChange, compact = false }) {
  return (
    <div className={`priority-picker ${compact ? 'compact' : ''}`} role="group" aria-label="Priority (optional)">
      {PRIORITIES.map((p) => (
        <button
          key={p.value}
          type="button"
          title={`${p.label} priority`}
          aria-label={`${p.label} priority`}
          aria-pressed={value === p.value}
          className={`prio-btn ${value === p.value ? 'selected' : ''}`}
          style={{ '--prio': p.color }}
          onClick={() => onChange(value === p.value ? null : p.value)}
        >
          {!compact && p.label}
        </button>
      ))}
    </div>
  )
}
