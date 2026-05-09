import { supabase } from './config.js'

// ========== LOGIN ==========
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

// ========== LOGOUT ==========
const logoutBtn = document.getElementById('logout-btn')
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/index.html'
  })
}

// ========== DASHBOARD PAGE ==========
if (window.location.pathname.includes('dashboard')) {
  const toggle = document.getElementById('maintenance-toggle')
  const saveAnnouncement = document.getElementById('save-announcement-btn')
  
  loadDashboardStats()
  loadMaintenanceStatus()
  loadAnnouncement()
  loadVisitStats()
  
  if (toggle) toggle.addEventListener('change', (e) => saveMaintenance(e.target.checked))
  if (saveAnnouncement) saveAnnouncement.addEventListener('click', saveAnnouncementText)
}

async function loadDashboardStats() {
  const session = await supabase.auth.getSession()
  if (!session.data.session) return window.location.href = '/admin/index.html'
  
  const { count: pending } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  const { count: approved } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'approved')
  
  const pendingEl = document.getElementById('pending-count')
  const activeEl = document.getElementById('active-listings')
  if (pendingEl) pendingEl.textContent = pending ?? 0
  if (activeEl) activeEl.textContent = approved ?? 0
}
async function loadVisitStats() {
  const today = new Date().toISOString().split('T')[0]
  
  const { count: viewsToday } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .gte('viewed_at', today)
  
  const viewsEl = document.getElementById('views-today')
  if (viewsEl) viewsEl.textContent = viewsToday ?? 0
}

async function loadMaintenanceStatus() {
  const toggle = document.getElementById('maintenance-toggle')
  const statusText = document.getElementById('maintenance-status-text')
  if (!toggle) return
  const { data } = await supabase.from('settings').select('value').eq('key', 'maintenance_mode').single()
  if (data) {
    toggle.checked = data.value
    if (statusText) statusText.textContent = data.value ? '🔧 Enabled' : '✅ Live'
  }
}

async function saveMaintenance(checked) {
  const { error } = await supabase.from('settings').update({ value: checked }).eq('key', 'maintenance_mode')
  if (error) { alert('Failed'); return }
  const statusText = document.getElementById('maintenance-status-text')
  if (statusText) statusText.textContent = checked ? '🔧 Enabled' : '✅ Live'
  alert(checked ? 'Maintenance ON' : 'Maintenance OFF')
}

async function loadAnnouncement() {
  const textarea = document.getElementById('announcement-text')
  if (!textarea) return
  const { data } = await supabase.from('settings').select('value_text').eq('key', 'announcement_text').single()
  if (data && data.value_text) textarea.value = data.value_text
}

async function saveAnnouncementText() {
  const textarea = document.getElementById('announcement-text')
  const statusSpan = document.getElementById('announcement-status')
  if (!textarea) return
  if (!textarea.value) { if (statusSpan) statusSpan.textContent = 'Enter message'; return }
  if (statusSpan) statusSpan.textContent = 'Saving...'
  const { error } = await supabase.from('settings').update({ value_text: textarea.value }).eq('key', 'announcement_text')
  if (error) { if (statusSpan) statusSpan.textContent = 'Failed' }
  else { if (statusSpan) statusSpan.textContent = 'Saved!'; setTimeout(() => { if (statusSpan) statusSpan.textContent = '' }, 2000) }
}

// ========== PENDING PAGE ==========
if (window.location.pathname.includes('pending')) {
  loadPending()
}

async function loadPending() {
  const session = await supabase.auth.getSession()
  if (!session.data.session) return window.location.href = '/admin/index.html'
  
  const container = document.getElementById('pending-list')
  const loading = document.getElementById('loading')
  const { data, error } = await supabase.from('posts').select('*').eq('status', 'pending').order('created_at', { ascending: false })
  
  if (loading) loading.style.display = 'none'
  if (error) { container.innerHTML = '<p>Error loading</p>'; return }
  if (!data || data.length === 0) { container.innerHTML = '<p>No pending posts</p>'; return }
  
  container.innerHTML = data.map(post => `
    <div class="pending-card">
      <div>
        <strong>${escapeHtml(post.title)}</strong> - KSh ${post.price}
        <br><small>${escapeHtml(post.category)} · ${escapeHtml(post.contact)}</small>
        <p>${escapeHtml(post.description?.substring(0,100))}</p>
        ${post.image_urls ? post.image_urls.map(url => `<img src="${url}" width="60" style="margin:5px">`).join('') : ''}
      </div>
      <div class="pending-actions">
        <button class="btn" onclick="window.approvePost(${post.id})">Approve</button>
        <button class="btn btn--danger" onclick="window.rejectPost(${post.id})">Reject</button>
      </div>
    </div>
  `).join('')
}

window.approvePost = async (id) => {
  if (!confirm('Approve?')) return
  await supabase.from('posts').update({ status: 'approved' }).eq('id', id)
  location.reload()
}

window.rejectPost = async (id) => {
  if (!confirm('Reject?')) return
  await supabase.from('posts').delete().eq('id', id)
  location.reload()
}

// ========== MANAGE PAGE ==========
if (window.location.pathname.includes('manage')) {
  loadManage()
}

async function loadManage() {
  const session = await supabase.auth.getSession()
  if (!session.data.session) return window.location.href = '/admin/index.html'
  
  const container = document.getElementById('manage-list')
  const loading = document.getElementById('loading')
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
  
  if (loading) loading.style.display = 'none'
  if (error) { container.innerHTML = '<p>Error loading</p>'; return }
  if (!data || data.length === 0) { container.innerHTML = '<p>No posts</p>'; return }
  
  container.innerHTML = data.map(post => `
    <div class="post-item">
      <div>
        <strong>${escapeHtml(post.title)}</strong> - KSh ${post.price}
        <br><small>Status: ${post.status} | ${escapeHtml(post.category)}</small>
      </div>
      <div>
        <button class="btn btn--small" onclick="window.editPost(${post.id})">Edit</button>
        <button class="btn btn--small btn--danger" onclick="window.deletePost(${post.id})">Delete</button>
      </div>
    </div>
  `).join('')
}

window.deletePost = async (id) => {
  if (!confirm('Delete?')) return
  await supabase.from('posts').delete().eq('id', id)
  location.reload()
}

window.editPost = async (id) => {
  const newTitle = prompt('New title:')
  if (newTitle) await supabase.from('posts').update({ title: newTitle }).eq('id', id)
  location.reload()
}

function escapeHtml(text) {
  if (!text) return ''
  return text.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;'
    if (m === '<') return '&lt;'
    if (m === '>') return '&gt;'
  })
}