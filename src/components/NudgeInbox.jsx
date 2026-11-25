import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import PixelIcon from './PixelIcon'

// "Jordan nudged you: How's it going? 👀 · Study GMAT section 1"
// Shows unseen nudges; arrives live. Dismissing marks them seen.
export default function NudgeInbox({ userId }) {
  const [nudges, setNudges] = useState([])

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('nudges')
      .select('id, message, created_at, from:profiles!nudges_from_id_fkey(display_name), task:tasks(title)')
      .eq('to_id', userId)
      .is('seen_at', null)
      .order('created_at', { ascending: false })
      .limit(10)
    setNudges(data ?? [])
  }, [userId])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('my-nudges')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nudges', filter: `to_id=eq.${userId}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, load])

  async function dismiss(ids) {
    setNudges((ns) => ns.filter((n) => !ids.includes(n.id)))
    await supabase.from('nudges').update({ seen_at: new Date().toISOString() }).in('id', ids)
  }

  if (nudges.length === 0) return null

  return (
    <section className="nudge-inbox" role="status" aria-live="polite">
      <div className="row between">
        <strong className="inbox-title"><PixelIcon name="checkin" size={18} /> {nudges.length === 1 ? 'A friend checked in' : `${nudges.length} check-ins from friends`}</strong>
        {nudges.length > 1 && (
          <button className="link small" onClick={() => dismiss(nudges.map((n) => n.id))}>Clear all</button>
        )}
      </div>
      <ul>
        {nudges.map((n) => (
          <li key={n.id}>
            <div className="nudge-text">
              <span><strong>{n.from?.display_name ?? 'A friend'}</strong>: {n.message}</span>
              {n.task?.title && <span className="muted small">on “{n.task.title}”</span>}
            </div>
            <button className="icon-btn" onClick={() => dismiss([n.id])} aria-label="Dismiss">✕</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
