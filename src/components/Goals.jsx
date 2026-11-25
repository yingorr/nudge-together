import { useState } from 'react'
import { CATEGORIES, categoryLabel } from '../lib/constants'
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
      <div className="task-fields">
        <label className="field">
          <span className="field-label">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <div className="field full" role="group" aria-labelledby="goal-prio">
          <span className="field-label" id="goal-prio">Priority <span className="muted">(optional)</span></span>
          <PriorityPicker value={priority} onChange={setPriority} />
        </div>
        <div className="field full" role="group" aria-labelledby="goal-time">
          <span className="field-label" id="goal-time">Time needed <span className="muted">(optional)</span></span>
          <TimePicker value={timeNeeded} onChange={setTimeNeeded} />
        </div>
      </div>
      <span className="muted small">Category, priority and time needed apply to every step; you can change a step on its own in My tasks.</span>

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

// ---------- one goal ----------
function GoalCard({ goal, steps, onUpdateTask, onUpdateGoal, onDeleteGoal, onAddStep, onRemoveStep }) {
  const [newDays, setNewDays] = useState(DEFAULT_DAYS)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: goal.title })
  const [newStep, setNewStep] = useState('')

  const done = steps.filter((s) => s.completed).length
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0
  const current = currentStep(steps)
  const finished = steps.length > 0 && done === steps.length

  function toggle(step) {
    const completed = !step.completed
    onUpdateTask(step.id, { completed, completed_at: completed ? new Date().toISOString() : null })
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
        <form className="stack" onSubmit={(e) => { e.preventDefault(); if (!draft.title.trim()) return; onUpdateGoal(goal.id, { title: draft.title.trim() }); setEditing(false) }}>
          <input value={draft.title} maxLength={200} autoFocus aria-label="Goal name"
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
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
            </span>
          </div>
          <button className="icon-btn" aria-label="Edit goal"
            onClick={() => { setDraft({ title: goal.title }); setEditing(true) }}>✎</button>
        </div>
      )}

      <div className="goal-progress">
        <div className="progress"><div style={{ width: `${pct}%` }} /></div>
        <span className="muted small">{finished ? 'All steps done!' : `${done} of ${steps.length} steps done`}</span>
      </div>

      <ol className="goal-steps">
        {steps.map((s) => {
          const isCurrent = current?.id === s.id
          const state = s.completed ? 'done' : isCurrent ? 'current' : s.due_date ? 'current' : 'waiting'
          return (
            <li key={s.id} className={`goal-step ${state}`}>
              {state === 'waiting' ? (
                <span className="step-marker" aria-hidden="true" />
              ) : (
                <button className={`check-btn small ${s.completed ? 'checked' : ''}`} onClick={() => toggle(s)}
                  aria-pressed={s.completed} aria-label={s.completed ? `Mark "${s.title}" not done` : `Mark "${s.title}" done`}>✓</button>
              )}
              <div className="step-body">
                <span className="step-title">{s.title}</span>
                <span className="muted small">
                  {s.completed ? 'Done' : s.due_date ? formatDue(s.due_date) : 'Waiting'}
                </span>
              </div>
              {state === 'waiting' && (
                <label className="days-input compact">
                  <input type="number" inputMode="numeric" min="1" max="60" defaultValue={daysFor(s, goal)}
                    aria-label={`Days after the previous step for "${s.title}"`}
                    onBlur={(e) => {
                      const v = clampDays(e.target.value)
                      e.target.value = v
                      if (v !== daysFor(s, goal)) onUpdateTask(s.id, { step_days: v })
                    }} />
                  <span>days</span>
                </label>
              )}
              {state === 'waiting' && (
                <ConfirmButton label="✕" question="Remove?" className="icon-btn" onConfirm={() => onRemoveStep(s.id)} />
              )}
            </li>
          )
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
