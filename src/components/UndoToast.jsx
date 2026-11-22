import { useEffect, useRef } from 'react'

// Small bar at the bottom: "Task deleted · Undo". Disappears after a few seconds.
export default function UndoToast({ message, onUndo, onClose, duration = 6000 }) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const id = setTimeout(() => close.current(), duration)
    return () => clearTimeout(id)
  }, [message, duration])

  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" className="toast-undo" onClick={onUndo}>Undo</button>
    </div>
  )
}
