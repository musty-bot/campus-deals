import { supabase, getSessionId } from './config.js'

export async function trackPageView() {
  const sessionId = getSessionId()
  const path = window.location.pathname

  try {
    await supabase.from('page_views').insert({
      session_id: sessionId,
      path: path,
    })
  } catch (err) {
    console.warn('Failed to track page view:', err)
  }
}

export async function trackPostView(postId) {
  const sessionId = getSessionId()
  const key = `viewed_post_${postId}`
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, 'true')

  try {
    await supabase.from('post_views').insert({
      session_id: sessionId,
      post_id: postId,
    })
  } catch (err) {
    console.warn('Failed to track post view:', err)
  }
}

export async function trackContactClick(postId) {
  const sessionId = getSessionId()
  try {
    await supabase.from('contact_clicks').insert({
      session_id: sessionId,
      post_id: postId,
    })
  } catch (err) {
    console.warn('Failed to track contact click:', err)
  }
}

trackPageView()