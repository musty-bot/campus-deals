import { supabase } from './config.js'

// ========== LOGOUT ==========
const logoutBtn = document.getElementById('logout-btn')
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/index.html'
  })
}

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

// ========== DASHBOARD ==========
if (window.location.pathname.endsWith('dashboard.html')) {
  loadDashboard()
  loadMaintenanceStatus()
  loadAnnouncementText()
  
  const toggle = document.getElementById('maintenance-toggle')
  if (toggle) {
    toggle.addEventListener('change', async (e) => {
      const success = await saveMaintenanceMode(e.target.checked)
      if (success) {
        const statusText = document.getElementById('maintenance-status-text')
        if (statusText) statusText.textContent = e.target.checked ? '🔧 Enabled' : '✅ Live'
        alert(e.target.checked ? 'Maintenance mode ON' : 'Maintenance mode OFF')
      } else {
        e.target.checked = !e.target.checked
      }
    })
  }
  
  const saveBtn = document.getElementById('save-announcement-btn')
  if (saveBtn) {
    saveBtn.addEventListener('click', saveAnnouncementText)
  }
}

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

// ========== MAINTENANCE MODE ==========
async function loadMaintenanceStatus() {
  const toggle = document.getElementById('maintenance-toggle')
  const statusText = document.getElementById('maintenance-status-text')
  if (!toggle) return
  
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()
  
  if (data) {
    toggle.checked = data.value
    if (statusText) statusText.textContent = data.value ? '🔧 Enabled' : '✅ Live'
  }
}

async function saveMaintenanceMode(checked) {
  const { error } = await supabase
    .from('settings')
    .update({ value: checked })
    .eq('key', 'maintenance_mode')
  
  if (error) {
    alert('Failed: ' + error.message)
    return false
  }
  return true
}

// ========== ANNOUNCEMENT ==========
async function loadAnnouncementText() {
  const textarea = document.getElementById('announcement-text')
  if (!textarea) return
  
  const { data } = await supabase
    .from('settings')
    .select('value_text')
    .eq('key', 'announcement_text')
    .single()
  
  if (data && data.value_text) {
    textarea.value = data.value_text
  }
}

async function saveAnnouncementText() {
  const textarea = document.getElementById('announcement-text')
  const statusSpan = document.getElementById('announcement-status')
  
  if (!textarea) return
  
  const newText = textarea.value
  
  if (!newText) {
    if (statusSpan) statusSpan.textContent = '❌ Enter a message'
    return
  }
  
  if (statusSpan) statusSpan.textContent = 'Saving...'
  
  const { error } = await supabase
    .from('settings')
    .update({ value_text: newText })
    .eq('key', 'announcement_text')
  
  if (error) {
    if (statusSpan) statusSpan.textContent = '❌ Failed'
  } else {
    if (statusSpan) statusSpan.textContent = '✅ Saved!'
    setTimeout(() => {
      if (statusSpan) statusSpan.textContent = ''
    }, 2000)
  }
}

// ========== PENDING APPROVALS ==========
async function loadPending() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = '/admin/index.html'
    return
  }

  const { data: pendingPosts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const container = document.getElementById('pending-list')
  const loadingEl = document.getElementById('loading')

  if (error) {
    container.innerHTML = '<p>Error loading posts</p>'
    if (loadingEl) loadingEl.style.display = 'none'
    return
  }

  if (loadingEl) loadingEl.style.display = 'none'

  if (!pendingPosts || pendingPosts.length === 0) {
    container.innerHTML = '<p>No pending posts.</p>'
    return
  }

  container.innerHTML = pendingPosts.map(post => `
    <div class="pending-card">
      <div>
        <strong>${escapeHtml(post.title)}</strong> - KSh ${post.price}
        <br><small>${escapeHtml(post.category)} · ${escapeHtml(post.contact)}</small>
        <p>${escapeHtml(post.description?.substring(0,100))}</p>
        ${post.image_urls?.map(url => `<img src="${url}" width="60" height="60" style="object-fit:cover;">`).join('')}
      </div>
      <div class="pending-actions">
        <button class="btn btn--small" onclick="approvePost(${post.id})">Approve</button>
        <button class="btn btn--small btn--danger" onclick="rejectPost(${post.id})">Reject</button>
      </div>
    </div>
  `).join('')
}

window.approvePost = async (id) => {
  if (!confirm('Approve this post?')) return
  const { error } = await supabase
    .from('posts')
    .update({ status: 'approved' })
    .eq('id', id)
  if (error) alert('Error: ' + error.message)
  else location.reload()
}

window.rejectPost = async (id) => {
  if (!confirm('Reject this post? It will be deleted.')) return
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
  if (error) alert('Error: ' + error.message)
  else location.reload()
}

// ========== MANAGE POSTS ==========
async function loadManage() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = '/admin/index.html'
    return
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  const container = document.getElementById('manage-list')
  const loadingEl = document.getElementById('loading')

  if (error) {
    container.innerHTML = '<p>Error loading posts</p>'
    if (loadingEl) loadingEl.style.display = 'none'
    return
  }

  if (loadingEl) loadingEl.style.display = 'none'

  if (!posts || posts.length === 0) {
    container.innerHTML = '<p>No posts yet.</p>'
    return
  }

  container.innerHTML = posts.map(post => `
    <div class="post-item">
      <div>
        <strong>${escapeHtml(post.title)}</strong> - KSh ${post.price}
        <br><small>Status: ${post.status} | ${escapeHtml(post.category)}</small>
      </div>
      <div class="post-actions">
        <button class="btn btn--small" onclick="editPost(${post.id})">Edit</button>
        <button class="btn btn--small btn--danger" onclick="deletePost(${post.id})">Delete</button>
      </div>
    </div>
  `).join('')
}

window.deletePost = async (id) => {
  if (!confirm('Delete this post permanently?')) return
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
  if (error) alert('Error: ' + error.message)
  else location.reload()
}

window.editPost = async (id) => {
  const newTitle = prompt('Enter new title:')
  if (!newTitle) return
  const { error } = await supabase
    .from('posts')
    .update({ title: newTitle })
    .eq('id', id)
  if (error) alert('Error: ' + error.message)
  else location.reload()
}

// ========== PAGE DETECTION - THIS IS WHAT WAS MISSING ==========
if (window.location.pathname.endsWith('pending.html')) {
  loadPending()
}

if (window.location.pathname.endsWith('manage.html')) {
  loadManage()
}

function escapeHtml(unsafe) {
  if (!unsafe) return ''
  return unsafe.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;'
    if (m === '<') return '&lt;'
    if (m === '>') return '&gt;'
  })
}