import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Friends({ userId, loadFriends, onViewFriend }) {
  const [rows, setRows] = useState([])
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState(null)

  async function refresh() {
    const data = await loadFriends()
    setRows(data ?? [])
  }

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendRequest(e) {
    e.preventDefault()
    setMessage(null)
    const clean = username.trim().toLowerCase().replace(/^@/, '')
    if (!clean) return

    const { data: target } = await supabase
      .from('profiles').select('id, username').eq('username', clean).maybeSingle()
    if (!target) return setMessage({ type: 'error', text: `No user called @${clean}.` })
    if (target.id === userId) return setMessage({ type: 'error', text: "That's you!" })

    const { error } = await supabase
      .from('friendships').insert({ requester_id: userId, addressee_id: target.id })
    if (error) {
      setMessage({
        type: 'error',
        text: error.code === '23505' ? 'You already have a request or friendship with them.' : error.message,
      })
    } else {
      setMessage({ type: 'info', text: `Request sent to @${clean}.` })
      setUsername('')
      refresh()
    }
  }

  async function accept(id) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
    refresh()
  }

  async function remove(id, label) {
    if (!confirm(label)) return
    await supabase.from('friendships').delete().eq('id', id)
    refresh()
  }

  const other = (f) => (f.requester_id === userId ? f.addressee : f.requester)
  const accepted = rows.filter((f) => f.status === 'accepted')
  const incoming = rows.filter((f) => f.status === 'pending' && f.addressee_id === userId)
  const outgoing = rows.filter((f) => f.status === 'pending' && f.requester_id === userId)

  return (
    <main className="stack">
      <form className="card stack" onSubmit={sendRequest}>
        <strong>Add a friend</strong>
        <div className="row">
          <input value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="their username" autoCapitalize="none" />
          <button className="btn primary">Send</button>
        </div>
        {message && <p className={`notice ${message.type}`}>{message.text}</p>}
      </form>

      {incoming.length > 0 && (
        <section className="card stack">
          <strong>Requests for you</strong>
          {incoming.map((f) => (
            <div key={f.id} className="row between">
              <span>{other(f).display_name} <span className="muted">@{other(f).username}</span></span>
              <div className="row">
                <button className="btn primary small" onClick={() => accept(f.id)}>Accept</button>
                <button className="btn ghost small" onClick={() => remove(f.id, 'Decline this request?')}>Decline</button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="card stack">
        <strong>Friends ({accepted.length})</strong>
        {accepted.length === 0 && <p className="muted small">No friends yet. Share your username so they can add you.</p>}
        {accepted.map((f) => (
          <div key={f.id} className="row between">
            <span>{other(f).display_name} <span className="muted">@{other(f).username}</span></span>
            <div className="row">
              <button className="btn small" onClick={() => onViewFriend(other(f).id)}>View tasks</button>
              <button className="btn ghost small"
                onClick={() => remove(f.id, `Remove ${other(f).display_name} as a friend?`)}>Remove</button>
            </div>
          </div>
        ))}
      </section>

      {outgoing.length > 0 && (
        <section className="card stack">
          <strong>Waiting on</strong>
          {outgoing.map((f) => (
            <div key={f.id} className="row between">
              <span className="muted">@{other(f).username}</span>
              <button className="btn ghost small" onClick={() => remove(f.id, 'Cancel this request?')}>Cancel</button>
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
