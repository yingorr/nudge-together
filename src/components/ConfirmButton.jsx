import { useEffect, useState } from 'react'

// In-app "are you sure?": the first tap turns the button into  Remove? [Yes] [No].
// Goes back to normal on its own after a few seconds.
// With `popover`, the button stays put and the question opens in a small box below it
// (used where there's no room to expand inline, like the header).
export default function ConfirmButton({ label, question, onConfirm, className = 'btn ghost small', ariaLabel, popover = false }) {
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    if (!asking) return
    const id = setTimeout(() => setAsking(false), 5000)
    return () => clearTimeout(id)
  }, [asking])

  const trigger = (
    <button type="button" className={className} onClick={() => setAsking(!asking)}
      aria-label={ariaLabel} title={ariaLabel} aria-expanded={popover ? asking : undefined}>{label}</button>
  )
  if (!asking) return trigger
  const ask = (
    <span className={`confirm-inline ${popover ? 'pop' : ''}`} role="group" aria-label={question}>
      <span className="confirm-question">{question}</span>
      <button type="button" className="btn danger small" onClick={() => { setAsking(false); onConfirm() }}>Yes</button>
      <button type="button" className="btn ghost small" onClick={() => setAsking(false)} autoFocus>No</button>
    </span>
  )
  if (!popover) return ask
  return <span className="confirm-anchor">{trigger}{ask}</span>
}
