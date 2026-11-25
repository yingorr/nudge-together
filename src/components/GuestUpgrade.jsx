import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { USERNAME_HINT, cleanUsername, usernameProblem, usernameTaken } from '../lib/usernames'

// Turn a guest into a real account and keep everything they made.
// Step 1 (here): name, username, email. Supabase emails a confirmation link.
// Step 2 (SetPassword below): once the email is confirmed, choose a password.
export function GuestUpgrade({ userId, pendingEmail, onUpdated }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  if (pendingEmail) {
    return <p className="small" style={{ margin: 0 }}>Check <b>{pendingEmail}</b> for a confirmation link. After you confirm, come back here to choose a password.</p>
  }
  if (!open) return <button className="btn primary small" onClick={() => setOpen(true)}>Create account</button>

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const problem = usernameProblem(username) || (await usernameTaken(username))
    if (problem) { setMessage(problem); setBusy(false); return }
    const { error } = await supabase.auth.updateUser(
      { email: email.trim(), data: { display_name: name.trim(), needs_password: true } },
      { emailRedirectTo: window.location.href },
    )
    if (error) { setMessage(error.message); setBusy(false); return }
    const { error: profileError } = await supabase.from('profiles')
      .update({ display_name: name.trim(), username: cleanUsername(username) }).eq('id', userId)
    setBusy(false)
    if (profileError) setMessage(profileError.code === '23505' ? 'That username is taken.' : profileError.message)
    else onUpdated?.()
  }

  return (
    <form className="stack guest-upgrade" onSubmit={submit}>
      <label>Display name
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
      </label>
      <label>Username
        <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} maxLength={20}
          autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
        <span className="small">{USERNAME_HINT}</span>
      </label>
      <label>Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <div className="row">
        <button className="btn primary small" disabled={busy}>{busy ? 'Please wait…' : 'Continue'}</button>
        <button type="button" className="btn ghost small" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {message && <p className="notice error">{message}</p>}
    </form>
  )
}

// After a guest confirms their email: last step, pick a password.
export function SetPassword() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password, data: { needs_password: false } })
    setBusy(false)
    if (error) setMessage(error.message)
  }

  return (
    <form className="stack" onSubmit={submit}>
      <strong>Last step: choose a password</strong>
      <div className="row">
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
          autoComplete="new-password" aria-label="New password" required />
        <button className="btn primary" disabled={busy}>Save</button>
      </div>
      {message && <p className="notice error">{message}</p>}
    </form>
  )
}
