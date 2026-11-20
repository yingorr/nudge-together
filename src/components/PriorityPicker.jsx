import { PRIORITIES } from '../lib/constants'

// Optional priority: tap a color to set it, tap it again to clear it.
export default function PriorityPicker({ value, onChange }) {
  return (
    <div className="priority-picker" role="group" aria-label="Priority (optional)">
      {PRIORITIES.map((p) => (
        <button
          key={p.value}
          type="button"
          title={`${p.label} priority`}
          aria-pressed={value === p.value}
          className={`prio-btn ${value === p.value ? 'selected' : ''}`}
          style={{ '--prio': p.color }}
          onClick={() => onChange(value === p.value ? null : p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
