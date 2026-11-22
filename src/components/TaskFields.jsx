import { CATEGORIES } from '../lib/constants'
import PriorityPicker from './PriorityPicker'

// The labeled category / due date / priority fields, shared by the add and edit forms.
// iPhones show an empty date box with no hint text, so every field gets a visible label.
export default function TaskFields({ category, dueDate, priority, onChange, idPrefix }) {
  return (
    <div className="task-fields">
      <label className="field">
        <span className="field-label">Category</span>
        <select value={category} onChange={(e) => onChange({ category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Due date <span className="required" aria-hidden="true">*</span></span>
        <input
          type="date"
          className={dueDate ? '' : 'empty'}
          value={dueDate ?? ''}
          required
          onChange={(e) => onChange({ due_date: e.target.value })}
        />
      </label>
      <div className="field full" role="group" aria-labelledby={`${idPrefix}-prio`}>
        <span className="field-label" id={`${idPrefix}-prio`}>Priority <span className="muted">(optional)</span></span>
        <PriorityPicker value={priority} onChange={(p) => onChange({ priority: p })} />
      </div>
    </div>
  )
}
