// Log in with a username instead of an email.
// The browser sends { username, password }. This function looks up the email
// that belongs to the username (server side, so emails never reach the browser),
// signs in with it, and returns the session tokens. The browser then calls
// supabase.auth.setSession(...) with them.
// Deployed with JWT verification off, since people aren't logged in yet.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const WRONG = 'Wrong username or password.'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  let username = '', password = ''
  try {
    const body = await req.json()
    username = String(body.username ?? '').trim().toLowerCase()
    password = String(body.password ?? '')
  } catch {
    return json({ error: 'Bad request.' }, 400)
  }
  if (!username || !password) return json({ error: WRONG }, 400)

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  const { data: profile } = await admin.from('profiles').select('id').eq('username', username).maybeSingle()
  if (!profile) return json({ error: WRONG }, 400)

  const { data: found } = await admin.auth.admin.getUserById(profile.id)
  const email = found?.user?.email
  if (!email) return json({ error: WRONG }, 400)

  const client = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    const notConfirmed = error?.message?.toLowerCase().includes('confirm')
    return json({ error: notConfirmed ? 'Please confirm your email first, then log in.' : WRONG }, 400)
  }
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
})
