import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Logo from './Logo'
import { USERNAME_HINT, cleanUsername, usernameProblem, usernameTaken } from '../lib/usernames'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('') // login: email or username
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)

    if (mode === 'signup') {
      const problem = usernameProblem(username) || (await usernameTaken(username))
      if (problem) { setMessage({ type: 'error', text: problem }); setBusy(false); return }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim(), username: cleanUsername(username) },
          emailRedirectTo: window.location.href,
        },
      })
      if (error) setMessage({ type: 'error', text: error.message })
      else if (!data.session)
        setMessage({ type: 'info', text: 'Check your email to confirm your account, then log in.' })
    } else if (email.includes('@')) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
    } else {
      // Username login: a server function finds the email privately and signs in.
      const { data, error } = await supabase.functions.invoke('login-username', {
        body: { username: cleanUsername(email), password },
      })
      const failed = error || data?.error
      if (failed) {
        let text = data?.error
        if (!text && error?.context?.json) { try { text = (await error.context.json()).error } catch { /* ignore */ } }
        setMessage({ type: 'error', text: text || 'Wrong username or password.' })
      } else {
        const { error: sessionError } = await supabase.auth.setSession(data)
        if (sessionError) setMessage({ type: 'error', text: sessionError.message })
      }
    }
    setBusy(false)
  }

  // Try the app without an account: an anonymous Supabase user named "Guest".
  // Home adds the sample tasks. Friends stay locked until they sign up.
  async function tryAsGuest() {
    setBusy(true)
    setMessage(null)
    const { error } = await supabase.auth.signInAnonymously({ options: { data: { display_name: 'Guest' } } })
    if (error) {
      const off = /anonymous/i.test(error.message)
      setMessage({ type: 'error', text: off ? "Guest mode isn't turned on yet." : error.message })
    }
    setBusy(false)
  }

  return (
    <main className="center-card">
      <h1 className="logo"><Logo /></h1>
      <p className="muted">Small steps, shared with friends.</p>

      <form onSubmit={handleSubmit} className="stack">
        {mode === 'signup' && (
          <label>
            Display name
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What friends will see" maxLength={40} required />
          </label>
        )}
        {mode === 'signup' && (
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())}
              autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={20} required />
            <span className="small">{USERNAME_HINT}</span>
          </label>
        )}
        <label>
          {mode === 'login' ? 'Email or username' : 'Email'}
          <input type={mode === 'login' ? 'text' : 'email'} value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete={mode === 'login' ? 'username' : 'email'} autoCapitalize="none" autoCorrect="off" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
        </label>
        <button className="btn primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>

      {message && <p className={`notice ${message.type}`}>{message.text}</p>}

      <button className="link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null) }}>
        {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
      </button>

      <div className="guest-divider muted small"><span>or</span></div>
      <button className="btn ghost" onClick={tryAsGuest} disabled={busy}>Try as guest</button>
      <p className="muted small guest-note">No account needed. Friends unlock when you create an account.</p>
    </main>
  )
}
