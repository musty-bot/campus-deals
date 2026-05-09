// Supabase configuration
const supabaseUrl = 'https://YOUR_PROJECT_URL.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY';

// Replace the URLs above with your actual values from Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getSessionId() {
  let sessionId = sessionStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = Math.random().toString(36) + Date.now().toString(36)
    sessionStorage.setItem('session_id', sessionId)
  }
  return sessionId
}