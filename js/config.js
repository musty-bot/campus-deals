import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Netlify injects environment variables at build time
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Check if variables exist
console.log('Supabase URL exists:', !!supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials! Check Netlify environment variables.')
  throw new Error('Missing Supabase credentials')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getSessionId() {
  let sessionId = sessionStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = Math.random().toString(36) + Date.now().toString(36)
    sessionStorage.setItem('session_id', sessionId)
  }
  return sessionId
}