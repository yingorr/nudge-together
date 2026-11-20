import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && anonKey)

// The anon key is safe to ship in the browser: Row Level Security in
// supabase/schema.sql decides what each logged-in user may read or change.
export const supabase = isConfigured ? createClient(url, anonKey) : null
