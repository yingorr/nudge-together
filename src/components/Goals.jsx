import { useState } from 'react'
import { CATEGORIES, categoryLabel, priorityColor, timeLabel } from '../lib/constants'
import TimeIcon from './TimeIcon'
import { formatDue, todayISO } from '../lib/dates'
import { DEFAULT_DAYS, clampDays, currentStep, daysFor, stepsOf } from '../lib/goals'
import ConfirmButton from './ConfirmButton'
import PriorityPicker from './PriorityPicker'
import TimePicker from './TimePicker'


// ---------- new goal form ----------
// Step 1 gets a date; every later step gets "Days": how many days after the
// previous step is finished it becomes due.
const blankStep = () => ({ title: '', days: DEFAULT_DAYS })

function GoalForm({ onCreate }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('personal')
  const [priority, setPriority] = useState(null)
  const [timeNeeded, setTimeNeeded] = useState(null)
  const [firstDue, setFirstDue] = useState(todayISO())
  const [steps, setSteps] = useState([blankStep(), blankStep(), blankStep()])

  const filled = steps.filter((s) => s.title.trim())
  const ready = title.trim() && firstDue && filled.length > 0
  const setStep = (i, change) => setSteps(steps.map((x, j) => (j === i ? { ...x, ...change } : x)))

  function reset() {
    setTitle(''); setCategory('personal'); setPriority(null); setTimeNeeded(null); setFirstDue(todayISO()); setSteps([blankStep(), blankStep(), blankStep()])
  }

  async function submit(e) {
    e.preventDefault()
    if (!ready) return
    const clean = filled.map((s) => ({ title: s.title.trim(), days: clampDays(s.days) }))
    const ok = await onCreate({ title: title.trim(), category, priority, time_needed: timeNeeded, gap_days: DEFAULT_DAYS }, clean, firstDue)
    if (ok) { reset(); setOpen(false) }
  }

  if (!open) {
    return <button className="btn primary add-task-btn" onClick={() => setOpen(true)}>+ New goal</button>
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Goal name" maxLength={200} autoFocus aria-label="Goal name" />
      <span className="muted small goal-form-note">These apply to every step (priority and time are optional). You can change a step on its own in My tasks.</span>
      <div className="goal-fields">
        <label className="field">
          <span className="field-label">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <div className="field centered" role="group" aria-labelledby="goal-prio">
          <span className="field-label" id="goal-prio">Priority</span>
          <PriorityPicker value={priority} onChange={setPriority} compact />
        </div>
        <div className="field centered" role="group" aria-labelledby="goal-time">
          <span className="field-label" id="goal-time">Time</span>
          <TimePicker value={timeNeeded} onChange={setTimeNeeded} compact />
        </div>
      </div>

      <div className="field">
        <span className="field-label">Steps, in order</span>
        <div className="step-rows">
          <div className="step-row head" aria-hidden="true">
            <span />
            <span className="field-label">Step</span>
            <span className="field-label">Due / Days</span>
            <span />
          </div>
          {steps.map((s, i) => (
            <div key={i} className="step-row">
              <span className="step-num">{i + 1}</span>
              <input value={s.title} maxLength={200} placeholder={`Step ${i + 1}`} aria-label={`Step ${i + 1}`}
                onChange={(e) => setStep(i, { title: e.target.value })} />
              {i === 0 ? (
                <input type="date" className={`step-date ${firstDue ? '' : 'empty'}`} value={firstDue} required
                  aria-label="First step due date" onChange={(e) => setFirstDue(e.target.value)} />
              ) : (
                <label className="days-input">
                  <input type="number" inputMode="numeric" min="1" max="60" value={s.days}
                    aria-label={`Step ${i + 1} days after the previous step`}
                    onChange={(e) => setStep(i, { days: e.target.value })}
                    onBlur={(e) => setStep(i, { days: clampDays(e.target.value) })} />
                  <span>days</span>
                </label>
              )}
              {steps.length > 1 ? (
                <button type="button" className="icon-btn" aria-label={`Remove step ${i + 1}`}
                  onClick={() => setSteps(steps.filter((_, j) => j !== i))}>✕</button>
              ) : <span />}
            </div>
          ))}
        </div>
        <span className="muted small">Days = how many days after the previous step is finished.</span>
        <button type="button" className="link small add-step" onClick={() => setSteps([...steps, blankStep()])}>+ Add step</button>
      </div>

      <div className="row">
        <button className="btn primary" disabled={!ready}>Create goal</button>
        <button type="button" className="btn ghost" onClick={() => { reset(); setOpen(false) }}>Cancel</button>
      </div>
    </form>
  )
}

// One step's editor (like editing a task): name, date or days, priority, time.
function StepEditor({ step, goal, waiting, onSave, onCancel, onDelete }) {
  const [title, setTitle] = useState(step.title)
  const [due, setDue] = useState(step.due_date ?? '')
  const [days, setDays] = useState(daysFor(step, goal))
  const [priority, setPriority] = useState(step.priority ?? null)
  const [timeNeeded, setTimeNeeded] = useState(step.time_needed ?? null)
  const ok = title.trim() && (waiting || due)

  function save(e) {
    e.preventDefault()
    if (!ok) return
    const changes = { title: title.trim(), priority, time_needed: timeNeeded }
    if (waiting) changes.step_days = clampDays(days)
    else changes.due_date = due
    onSave(changes)
  }

  return (
    <form className="stack step-editor" onSubmit={save}>
      <input value={title} maxLength={200} autoFocus aria-label="Step name" onChange={(e) => setTitle(e.target.value)} />
      <div className="goal-fields">
        {waiting ? (
          <label className="field">
            <span className="field-label">Days</span>
            <span className="days-input">
              <input type="number" inputMode="numeric" min="1" max="60" value={days} aria-label="Days after the previous step"
                onChange={(e) => setDays(e.target.value)} onBlur={(e) => setDays(clampDays(e.target.value))} />
            </span>
          </label>
        ) : (
          <label className="field">
            <span className="field-label">Due date</span>
            <input type="date" className={due ? '' : 'empty'} value={due} required onChange={(e) => setDue(e.target.value)} />
          </label>
        )}
        <div className="field centered" role="group" aria-label="Priority">
          <span className="field-label">Priority</span>
          <PriorityPicker value={priority} onChange={setPriority} compact />
        </div>
        <div className="field centered" role="group" aria-label="Time needed">
          <span className="field-label">Time</span>
          <TimePicker value={timeNeeded} onChange={setTimeNeeded} compact />
        </div>
      </div>
      <div className="row between">
        <div className="row">
          <button className="btn primary small" disabled={!ok}>Save</button>
          <button type="button" className="btn ghost small" onClick={onCancel}>Cancel</button>
        </div>
        <ConfirmButton label="Delete" question="Delete step?" className="btn danger small" onConfirm={onDelete} />
      </div>
    </form>
  )
}

// ---------- one goal ----------
// Small "+" between steps; opens a row to type a new step in that spot.
function InsertStep({ after, onInsert }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [days, setDays] = useState(DEFAULT_DAYS)

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await onInsert(title.trim(), clampDays(days))
    setTitle(''); setDays(DEFAULT_DAYS); setOpen(false)
  }

  if (!open) {
    return (
      <li className="insert-step">
        <button type="button" onClick={() => setOpen(true)} aria-label={`Add a step after "${after.title}"`}
          title="Add a step here"><span aria-hidden="true">+</span></button>
      </li>
    )
  }
  return (
    <li className="insert-step open">
      <form className="row add-step-row" onSubmit={submit}>
        <input value={title} maxLength={200} autoFocus placeholder="New step" aria-label="New step"
          onChange={(e) => setTitle(e.target.value)} />
        <label className="days-input">
          <input type="number" inputMode="numeric" min="1" max="60" value={days} aria-label="Days after the previous step"
            onChange={(e) => setDays(e.target.value)} onBlur={(e) => setDays(clampDays(e.target.value))} />
          <span>days</span>
        </label>
        <button className="btn small" disabled={!title.trim()}>Add</button>
        <button type="button" className="icon-btn" aria-label="Cancel" onClick={() => { setTitle(''); setOpen(false) }}>✕</button>
      </form>
    </li>
  )
}

function GoalCard({ goal, steps, onUpdateTask, onDeleteTask, onUpdateGoal, onDeleteGoal, onAddStep, onInsertStep }) {
  const [newDays, setNewDays] = useState(DEFAULT_DAYS)
  const [editing, setEditing] = useState(false)
  const [editingStep, setEditingStep] = useState(null) // step id
  const goalDraft = () => ({ title: goal.title, category: goal.category, priority: goal.priority ?? null, time_needed: goal.time_needed ?? null })
  const [draft, setDraft] = useState(goalDraft)
  const [newStep, setNewStep] = useState('')

  const done = steps.filter((s) => s.completed).length
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0
  const current = currentStep(steps)
  const finished = steps.length > 0 && done === steps.length

  function toggle(step) {
    const completed = !step.completed
    onUpdateTask(step.id, { completed, completed_at: completed ? new Date().toISOString() : null })
  }

  function saveGoal(e) {
    e.preventDefault()
    if (!draft.title.trim()) return
    onUpdateGoal(goal.id, { ...draft, title: draft.title.trim() })
    setEditing(false)
  }

  async function addStep(e) {
    e.preventDefault()
    if (!newStep.trim()) return
    await onAddStep(goal, newStep.trim(), clampDays(newDays))
    setNewStep('')
  }

  return (
    <section className={`card stack goal ${finished ? 'finished' : ''}`}>
      {editing ? (
        <form className="stack" onSubmit={saveGoal}>
          <input value={draft.title} maxLength={200} autoFocus aria-label="Goal name"
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <span className="muted small goal-form-note">Changes to category apply to every step; priority and time apply to unfinished steps.</span>
          <div className="goal-fields">
            <label className="field">
              <span className="field-label">Category</span>
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <div className="field centered" role="group" aria-label="Priority">
              <span className="field-label">Priority</span>
              <PriorityPicker value={draft.priority} onChange={(v) => setDraft({ ...draft, priority: v })} compact />
            </div>
            <div className="field centered" role="group" aria-label="Time needed">
              <span className="field-label">Time</span>
              <TimePicker value={draft.time_needed} onChange={(v) => setDraft({ ...draft, time_needed: v })} compact />
            </div>
          </div>
          <div className="row between">
            <div className="row">
              <button className="btn primary small" disabled={!draft.title.trim()}>Save</button>
              <button type="button" className="btn ghost small" onClick={() => setEditing(false)}>Cancel</button>
            </div>
            <ConfirmButton label="Delete goal" question="Delete goal and its steps?" className="btn danger small"
              onConfirm={() => onDeleteGoal(goal.id)} />
          </div>
        </form>
      ) : (
        <div className="goal-head">
          <div className="stack goal-title-block">
            <strong className="goal-title">{goal.title}</strong>
            <span className="task-meta">
              <span className={`tag ${goal.category}`}>{categoryLabel(goal.category)}</span>
              {goal.priority && (
                <span className="goal-prio" style={{ '--prio': priorityColor(goal.priority) }}>{goal.priority[0].toUpperCase() + goal.priority.slice(1)} priority</span>
              )}
              {goal.time_needed && (
                <span className="time-tag" role="img" aria-label={`${timeLabel(goal.time_needed)} time needed`}>
                  <TimeIcon level={goal.time_needed} size={13} />
                </span>
              )}
            </span>
          </div>
          <button className="icon-btn" aria-label="Edit goal" onClick={() => { setDraft(goalDraft()); setEditing(true) }}>✎</button>
        </div>
      )}

      <div className="goal-progress">
        <div className="progress"><div style={{ width: `${pct}%` }} /></div>
        <span className="muted small">{finished ? 'All steps done!' : `${done} of ${steps.length} steps done`}</span>
      </div>

      <ol className="goal-steps">
        {steps.map((s, i) => {
          const isCurrent = current?.id === s.id
          const state = s.completed ? 'done' : isCurrent || s.due_date ? 'current' : 'waiting'
          // A "+" goes after the current step and between waiting steps (not after the last one:
          // the "Add a step at the end" row covers that).
          const insertAfter = !s.completed && i < steps.length - 1 && (
            <InsertStep key={`ins-${s.id}`} after={s} onInsert={(title, d) => onInsertStep(goal, s, title, d)} />
          )
          if (editingStep === s.id) {
            return [(
              <li key={s.id} className="goal-step editing">
                <StepEditor step={s} goal={goal} waiting={state === 'waiting'}
                  onCancel={() => setEditingStep(null)}
                  onSave={(changes) => { onUpdateTask(s.id, changes); setEditingStep(null) }}
                  onDelete={() => { onDeleteTask(s.id); setEditingStep(null) }} />
              </li>
            ), insertAfter]
          }
          const days = daysFor(s, goal)
          return [(
            <li key={s.id} className={`goal-step ${state}`} style={{ '--prio': priorityColor(s.priority) }}>
              {state === 'waiting' ? (
                <span className="step-marker" aria-hidden="true" />
              ) : (
                <button className={`check-btn small ${s.completed ? 'checked' : ''}`} onClick={() => toggle(s)}
                  aria-pressed={s.completed} aria-label={s.completed ? `Mark "${s.title}" not done` : `Mark "${s.title}" done`}>✓</button>
              )}
              <div className="step-body">
                <span className="step-title">{s.title}</span>
                <span className="step-meta muted small">
                  <span>{s.completed ? 'Done' : s.due_date ? formatDue(s.due_date) : `Waiting · ${days} day${days === 1 ? '' : 's'}`}</span>
                  {s.time_needed && (
                    <span className="time-tag" role="img" aria-label={`${timeLabel(s.time_needed)} time needed`}>
                      <TimeIcon level={s.time_needed} size={12} />
                    </span>
                  )}
                </span>
              </div>
              <button className="icon-btn" aria-label={`Edit "${s.title}"`} onClick={() => setEditingStep(s.id)}>✎</button>
            </li>
          ), insertAfter]
        })}
      </ol>

      <form className="row add-step-row" onSubmit={addStep}>
        <input value={newStep} maxLength={200} placeholder="Add a step at the end…" aria-label="New step"
          onChange={(e) => setNewStep(e.target.value)} />
        <label className="days-input">
          <input type="number" inputMode="numeric" min="1" max="60" value={newDays} aria-label="New step days after the previous step"
            onChange={(e) => setNewDays(e.target.value)} onBlur={(e) => setNewDays(clampDays(e.target.value))} />
          <span>days</span>
        </label>
        <button className="btn small" disabled={!newStep.trim()}>Add</button>
      </form>
    </section>
  )
}

// ---------- the tab ----------
export default function Goals({ goals, tasks, onCreateGoal, ...actions }) {
  return (
    <main className="stack">
      <p className="muted small goals-intro">
        Break a big goal into small steps. Only the current step shows in My tasks; when you finish it,
        the next one is due its number of days later.
      </p>
      <GoalForm onCreate={onCreateGoal} />
      {goals.length === 0 && <p className="muted empty">No goals yet.</p>}
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} steps={stepsOf(tasks, g.id)} {...actions} />
      ))}
    </main>
  )
}
