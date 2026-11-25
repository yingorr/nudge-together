import { supabase } from '../supabaseClient'

// 3-20 characters: lowercase letters, numbers, "_" and "."; no dot at the start
// or end, and no two dots in a row. Same rule as the database check.
export const USERNAME_HINT = '3-20 characters: lowercase letters, numbers, _ and .'
export const cleanUsername = (v) => v.trim().toLowerCase()

export function usernameProblem(v) {
  const u = cleanUsername(v)
  if (u.length < 3 || u.length > 20) return 'Usernames are 3-20 characters.'
  if (!/^[a-z0-9_.]+$/.test(u)) return 'Use only lowercase letters, numbers, _ and .'
  if (u.startsWith('.') || u.endsWith('.')) return "A username can't start or end with a dot."
  if (u.includes('..')) return "A username can't have two dots in a row."
  return null
}

// null when free, otherwise a message to show.
export async function usernameTaken(v) {
  const { data, error } = await supabase.rpc('username_available', { p_username: cleanUsername(v) })
  if (error) return error.message
  return data ? null : 'That username is taken.'
}
