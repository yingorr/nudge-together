import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Logo from './Logo'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: window.location.href,
        },
      })
      if (error) setMessage({ type: 'error', text: error.message })
      else if (!data.session)
        setMessage({ type: 'info', text: 'Check your email to confirm your account, then log in.' })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
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
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" required />
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
    </main>
  )
}
