import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getSessionId() {
  let sessionId = sessionStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = Math.random().toString(36) + Date.now().toString(36)
    sessionStorage.setItem('session_id', sessionId)
  }
  return sessionId
}