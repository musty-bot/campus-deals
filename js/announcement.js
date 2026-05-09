import { supabase } from './config.js'

export async function loadAnnouncement() {
  const { data, error } = await supabase
    .from('settings')
    .select('value_text')
    .eq('key', 'announcement_text')
    .single()
  
  if (error) return
  
  if (data && data.value_text && data.value_text !== '') {
    let bar = document.getElementById('announcement-bar')
    if (!bar) {
      bar = document.createElement('div')
      bar.id = 'announcement-bar'
      bar.style.cssText = 'background:#4361ee;color:white;padding:10px;text-align:center'
      document.body.insertBefore(bar, document.body.firstChild)
    }
    bar.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap">
        <span>📢</span>
        <span>${data.value_text}</span>
        <button onclick="this.parentElement.parentElement.style.display='none'" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:2px 10px;border-radius:20px;cursor:pointer">✕</button>
      </div>
    `
  }
}

if (!window.location.pathname.includes('/admin')) {
  loadAnnouncement()
}