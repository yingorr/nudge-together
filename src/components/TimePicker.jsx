import { TIME_NEEDED } from '../lib/constants'
import TimeIcon from './TimeIcon'

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
          <TimeIcon level={t.value} />
          {t.label}
        </button>
      ))}
    </div>
  )
}
