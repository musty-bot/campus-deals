import { supabase } from './config.js'

// Maintenance Mode
async function loadMaintenanceStatus() {
  const toggle = document.getElementById('maintenance-toggle')
  if (!toggle) return
  
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()
  
  if (data) {
    toggle.checked = data.value
  }
}

async function saveMaintenanceMode(checked) {
  await supabase
    .from('settings')
    .update({ value: checked })
    .eq('key', 'maintenance_mode')
}

// Announcement
async function loadAnnouncementText() {
  const textarea = document.getElementById('announcement-text')
  if (!textarea) return
  
  const { data } = await supabase
    .from('settings')
    .select('value_text')
    .eq('key', 'announcement_text')
    .single()
  
  if (data && textarea) {
    textarea.value = data.value_text || ''
  }
}

async function saveAnnouncementText() {
  const textarea = document.getElementById('announcement-text')
  const statusSpan = document.getElementById('announcement-status')
  
  if (!textarea) return
  
  statusSpan.textContent = 'Saving...'
  
  const { error } = await supabase
    .from('settings')
    .update({ value_text: textarea.value })
    .eq('key', 'announcement_text')
  
  if (error) {
    statusSpan.textContent = 'Failed'
  } else {
    statusSpan.textContent = 'Saved!'
    setTimeout(() => statusSpan.textContent = '', 2000)
  }
}

// Dashboard
async function loadDashboard() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = '/admin/index.html'
    return
  }
  
  const { count: pending } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  
  const { count: approved } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
  
  const pendingEl = document.getElementById('pending-count')
  const activeEl = document.getElementById('active-listings')
  if (pendingEl) pendingEl.textContent = pending ?? 0
  if (activeEl) activeEl.textContent = approved ?? 0
}

// Logout
const logoutBtn = document.getElementById('logout-btn')
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/index.html'
  })
}

// Login
const loginForm = document.getElementById('login-form')
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const errorEl = document.getElementById('login-error')
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      errorEl.textContent = error.message
    } else {
      window.location.href = '/admin/dashboard.html'
    }
  })
}

// Initialize page based on URL
if (window.location.pathname.includes('/dashboard')) {
  loadDashboard()
  loadMaintenanceStatus()
  loadAnnouncementText()
  
  const toggle = document.getElementById('maintenance-toggle')
  if (toggle) {
    toggle.addEventListener('change', async (e) => {
      await saveMaintenanceMode(e.target.checked)
      alert(e.target.checked ? 'Maintenance ON' : 'Maintenance OFF')
    })
  }
  
  const saveBtn = document.getElementById('save-announcement-btn')
  if (saveBtn) {
    saveBtn.addEventListener('click', saveAnnouncementText)
  }
}