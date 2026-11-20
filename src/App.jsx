import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './supabaseClient'
import Auth from './components/Auth'
import Home from './components/Home'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    // Restore a saved login, then listen for login/logout changes.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!isConfigured) {
    return (
      <main className="center-card">
        <h1>Nudge Together</h1>
        <p>
          Supabase isn't set up yet. Copy <code>.env.example</code> to <code>.env.local</code>,
          add your project URL and anon key, then restart <code>npm run dev</code>.
        </p>
      </main>
    )
  }

  if (loading) return <main className="center-card">Loading…</main>
  if (!session) return <Auth />
  return <Home session={session} />
}
