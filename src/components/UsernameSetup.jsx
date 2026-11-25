import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Logo from './Logo'
import { USERNAME_HINT, cleanUsername, usernameProblem, usernameTaken } from '../lib/usernames'

// One-time screen for accounts made before usernames existed.
export default function UsernameSetup({ userId, onDone }) {
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const problem = usernameProblem(username) || (await usernameTaken(username))
    if (problem) { setMessage(problem); setBusy(false); return }
    const u = cleanUsername(username)
    const { error } = await supabase.from('profiles').update({ username: u }).eq('id', userId)
    setBusy(false)
    if (error) setMessage(error.code === '23505' ? 'That username is taken.' : error.message)
    else onDone(u)
  }

  return (
    <main className="center-card">
      <h1 className="logo"><Logo /></h1>
      <form className="stack" onSubmit={save}>
        <strong>Pick a username</strong>
        <p className="muted small" style={{ margin: 0 }}>Friends can find you by it, and you can log in with it.</p>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} autoFocus
            autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={20} required />
          <span className="small">{USERNAME_HINT}</span>
        </label>
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        {message && <p className="notice error">{message}</p>}
      </form>
    </main>
  )
}
