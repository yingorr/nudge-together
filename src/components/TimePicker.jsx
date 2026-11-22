import { TIME_NEEDED } from '../lib/constants'

// Optional time needed: tap to set, tap again to clear (same feel as priority).
export default function TimePicker({ value, onChange }) {
  return (
    <div className="priority-picker time-picker">
      {TIME_NEEDED.map((t) => (
        <button
          key={t.value}
          type="button"
          title={`${t.label} time needed`}
          aria-pressed={value === t.value}
          className={`time-btn ${value === t.value ? 'selected' : ''}`}
          onClick={() => onChange(value === t.value ? null : t.value)}
        >
          <span className="time-dots" aria-hidden="true">{'●'.repeat(t.dots)}</span>
          {t.label}
        </button>
      ))}
    </div>
  )
}
