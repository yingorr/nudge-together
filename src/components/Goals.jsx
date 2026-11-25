import { useState } from 'react'
import { CATEGORIES, categoryLabel } from '../lib/constants'
import { formatDue, todayISO } from '../lib/dates'
import { GAP_OPTIONS, currentStep, stepsOf } from '../lib/goals'
import ConfirmButton from './ConfirmButton'

const gapLabel = (n) => (n === 1 ? 'every day' : `every ${n} days`)

// ---------- new goal form ----------
function GoalForm({ onCreate }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('personal')
  const [gap, setGap] = useState(2)
  const [firstDue, setFirstDue] = useState(todayISO())
  const [steps, setSteps] = useState(['', '', ''])

  const filled = steps.map((s) => s.trim()).filter(Boolean)
  const ready = title.trim() && firstDue && filled.length > 0

  function reset() {
    setTitle(''); setCategory('personal'); setGap(2); setFirstDue(todayISO()); setSteps(['', '', ''])
  }

  async function submit(e) {
    e.preventDefault()
    if (!ready) return
    const ok = await onCreate({ title: title.trim(), category, gap_days: gap }, filled, firstDue)
    if (ok) { reset(); setOpen(false) }
  }

  if (!open) {
    return <button className="btn primary add-task-btn" onClick={() => setOpen(true)}>+ New goal</button>
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Big goal… e.g. Study for the GMAT" maxLength={200} autoFocus aria-label="Goal name" />
      <div className="task-fields">
        <label className="field">
          <span className="field-label">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Days between steps</span>
          <select value={gap} onChange={(e) => setGap(Number(e.target.value))}>
            {GAP_OPTIONS.map((n) => <option key={n} value={n}>{n} day{n === 1 ? '' : 's'}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">First step due <span className="required" aria-hidden="true">*</span></span>
          <input type="date" className={firstDue ? '' : 'empty'} value={firstDue} required
            onChange={(e) => setFirstDue(e.target.value)} />
        </label>
      </div>

      <div className="field">
        <span className="field-label">Steps, in order</span>
        <ol className="step-inputs">
          {steps.map((s, i) => (
            <li key={i}>
              <input value={s} maxLength={200} placeholder={`Step ${i + 1}`} aria-label={`Step ${i + 1}`}
                onChange={(e) => setSteps(steps.map((x, j) => (j === i ? e.target.value : x)))} />
              {steps.length > 1 && (
                <button type="button" className="icon-btn" aria-label={`Remove step ${i + 1}`}
                  onClick={() => setSteps(steps.filter((_, j) => j !== i))}>✕</button>
              )}
            </li>
          ))}
        </ol>
        <button type="button" className="link small add-step" onClick={() => setSteps([...steps, ''])}>+ Add step</button>
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
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: goal.title, gap_days: goal.gap_days })
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
    await onAddStep(goal, newStep.trim())
    setNewStep('')
  }

  return (
    <section className={`card stack goal ${finished ? 'finished' : ''}`}>
      {editing ? (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); if (!draft.title.trim()) return; onUpdateGoal(goal.id, { title: draft.title.trim(), gap_days: draft.gap_days }); setEditing(false) }}>
          <input value={draft.title} maxLength={200} autoFocus aria-label="Goal name"
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <label className="field">
            <span className="field-label">Days between steps</span>
            <select value={draft.gap_days} onChange={(e) => setDraft({ ...draft, gap_days: Number(e.target.value) })}>
              {GAP_OPTIONS.map((n) => <option key={n} value={n}>{n} day{n === 1 ? '' : 's'}</option>)}
            </select>
          </label>
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
              <span className="muted">Next step {gapLabel(goal.gap_days)}</span>
            </span>
          </div>
          <button className="icon-btn" aria-label="Edit goal"
            onClick={() => { setDraft({ title: goal.title, gap_days: goal.gap_days }); setEditing(true) }}>✎</button>
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
                <ConfirmButton label="✕" question="Remove?" className="icon-btn" onConfirm={() => onRemoveStep(s.id)} />
              )}
            </li>
          )
        })}
      </ol>

      <form className="row add-step-row" onSubmit={addStep}>
        <input value={newStep} maxLength={200} placeholder="Add a step at the end…" aria-label="New step"
          onChange={(e) => setNewStep(e.target.value)} />
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
        the next one is scheduled automatically.
      </p>
      <GoalForm onCreate={onCreateGoal} />
      {goals.length === 0 && <p className="muted empty">No goals yet.</p>}
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} steps={stepsOf(tasks, g.id)} {...actions} />
      ))}
    </main>
  )
}
