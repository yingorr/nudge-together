import { useEffect, useState } from 'react'

// In-app "are you sure?": the first tap turns the button into  Remove? [Yes] [No].
// Goes back to normal on its own after a few seconds.
export default function ConfirmButton({ label, question, onConfirm, className = 'btn ghost small' }) {
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    if (!asking) return
    const id = setTimeout(() => setAsking(false), 5000)
    return () => clearTimeout(id)
  }, [asking])

  if (!asking) {
    return <button type="button" className={className} onClick={() => setAsking(true)}>{label}</button>
  }
  return (
    <span className="confirm-inline" role="group" aria-label={question}>
      <span className="confirm-question">{question}</span>
      <button type="button" className="btn danger small" onClick={() => { setAsking(false); onConfirm() }}>Yes</button>
      <button type="button" className="btn ghost small" onClick={() => setAsking(false)} autoFocus>No</button>
    </span>
  )
}
