import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ConfirmButton from './ConfirmButton'

export default function Friends({ userId, loadFriends, onViewFriend }) {
  const [rows, setRows] = useState([])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)

  async function refresh() {
    const data = await loadFriends()
    setRows(data ?? [])
  }

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendRequest(e) {
    e.preventDefault()
    setMessage(null)
    const clean = email.trim().toLowerCase()
    if (!clean) return

    // Private lookup by exact username or exact email: one match or nothing (emails are never returned).
    const { data, error: findError } = await supabase.rpc('find_profile', { p_identifier: clean.replace(/^@/, '') })
    if (findError) return setMessage({ type: 'error', text: findError.message })
    const target = data?.[0]
    if (!target) return setMessage({ type: 'error', text: `No Nudge Together account matches ${clean}.` })
    if (target.id === userId) return setMessage({ type: 'error', text: "That's you!" })

    const { error } = await supabase
      .from('friendships').insert({ requester_id: userId, addressee_id: target.id })
    if (error) {
      setMessage({
        type: 'error',
        text: error.code === '23505' ? 'You already have a request or friendship with them.' : error.message,
      })
    } else {
      setMessage({ type: 'info', text: `Request sent to ${target.display_name}.` })
      setEmail('')
      refresh()
    }
  }

  async function accept(id) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
    refresh()
  }

  async function remove(id) {
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
          <input value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Their username or email"
            placeholder="username or email" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          <button className="btn primary">Send</button>
        </div>
        {message && <p className={`notice ${message.type}`}>{message.text}</p>}
      </form>

      {incoming.length > 0 && (
        <section className="card stack">
          <strong>Requests for you</strong>
          {incoming.map((f) => (
            <div key={f.id} className="row between">
              <span>{other(f).display_name}</span>
              <div className="row">
                <button className="btn primary small" onClick={() => accept(f.id)}>Accept</button>
                <ConfirmButton label="Decline" question="Decline?" onConfirm={() => remove(f.id)} />
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="card stack">
        <strong>Friends ({accepted.length})</strong>
        {accepted.length === 0 && <p className="muted small">No friends yet. Add them by their username or the email they signed up with.</p>}
        {accepted.map((f) => (
          <div key={f.id} className="row between">
            <span>{other(f).display_name}</span>
            <div className="row">
              <button className="btn small" onClick={() => onViewFriend(other(f).id)}>View tasks</button>
              <ConfirmButton label="Remove" question="Remove?" onConfirm={() => remove(f.id)} />
            </div>
          </div>
        ))}
      </section>

      {outgoing.length > 0 && (
        <section className="card stack">
          <strong>Waiting on</strong>
          {outgoing.map((f) => (
            <div key={f.id} className="row between">
             
              <ConfirmButton label="Cancel" question="Cancel request?" onConfirm={() => remove(f.id)} />
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
