import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

// Keep only "https://<project>.supabase.co" even if the saved URL has an
// extra ending like "/rest/v1/" or a trailing slash. Extra path segments
// make Supabase answer "Invalid path specified in request URL".
function cleanUrl(value) {
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

const url = cleanUrl(rawUrl)

export const isConfigured = Boolean(url && anonKey)

// The publishable (anon) key is safe to ship in the browser: Row Level Security
// in supabase/schema.sql decides what each logged-in user may read or change.
export const supabase = isConfigured ? createClient(url, anonKey) : null
