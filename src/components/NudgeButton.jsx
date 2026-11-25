import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import PixelIcon from './PixelIcon'

// On a friend's task (where your own check button would be): tap to send a quick nudge.
// Unfinished tasks get check-in messages; finished ones get a cheer. Or write your own.
const CHECK_IN = ["How's it going??", 'You got this!!', 'Did you start yet??']
const CHEER = ['Nice work!!', 'Keep it up!!']
const MAX_LEN = 80 // matches the database limit

export default function NudgeButton({ task, sentRecently, onSent }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(null) // null | 'sending' | 'sent' | 'error'
  const [writing, setWriting] = useState(false) // custom message box open
  const [custom, setCustom] = useState('')
  const ref = useRef(null)

  // Close the menu when tapping elsewhere.
  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) { setOpen(false); setWriting(false) } }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  async function send(message) {
    setOpen(false)
    setWriting(false)
    setCustom('')
    setStatus('sending')
    const { error } = await supabase.from('nudges').insert({ to_id: task.user_id, task_id: task.id, message })
    setStatus(error ? 'error' : 'sent')
    if (!error) onSent?.(task.id)
  }

  const done = status === 'sent' || sentRecently
  const options = task.completed ? CHEER : CHECK_IN

  return (
    <div className="nudge" ref={ref}>
      <button
        type="button"
        className={`nudge-btn ${done ? 'sent' : ''}`}
        onClick={() => { setOpen(!open); setWriting(false) }}
        aria-expanded={open}
        aria-label={task.completed ? `Cheer on "${task.title}"` : `Nudge about "${task.title}"`}
        title={done ? 'Nudged recently. Tap to send another' : task.completed ? 'Send a cheer' : 'Send a nudge'}
        disabled={status === 'sending'}
      >
        <PixelIcon name={task.completed ? 'cheer' : 'ask'} size={22} />
        {done && <span className="nudge-sent-dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="nudge-menu" role="menu">
          {options.map((m) => (
            <button key={m} type="button" role="menuitem" onClick={() => send(m)}>{m}</button>
          ))}
          {writing ? (
            <form className="nudge-custom" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) send(custom.trim()) }}>
              <input value={custom} maxLength={MAX_LEN} autoFocus placeholder="Your message"
                aria-label="Your message" onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setWriting(false) }} />
              <div className="row between">
                <span className="muted small">{custom.length}/{MAX_LEN}</span>
                <button className="btn primary small" disabled={!custom.trim()}>Send</button>
              </div>
            </form>
          ) : (
            <button type="button" role="menuitem" className="nudge-write" onClick={() => setWriting(true)}>Write your own…</button>
          )}
        </div>
      )}
      {status === 'error' && <span className="nudge-error">Couldn't send</span>}
    </div>
  )
}
