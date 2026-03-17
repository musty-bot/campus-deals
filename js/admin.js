import { supabase } from './config.js'

// ========== LOGIN ==========
const loginForm = document.getElementById('login-form')
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const errorEl = document.getElementById('login-error')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

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

// ========== DASHBOARD ==========
if (window.location.pathname.endsWith('dashboard.html')) {
  loadDashboard()
}

async function loadDashboard() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = '/admin/index.html'
    return
  }

  const today = new Date().toISOString().split('T')[0]

  const { count: viewsToday } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .gte('viewed_at', today)
  document.getElementById('views-today').textContent = viewsToday ?? 0

  const { count: active } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
  document.getElementById('active-listings').textContent = active ?? 0

  const { count: pending } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  document.getElementById('pending-count').textContent = pending ?? 0

  const { count: clicksToday } = await supabase
    .from('contact_clicks')
    .select('*', { count: 'exact', head: true })
    .gte('clicked_at', today)
  document.getElementById('clicks-today').textContent = clicksToday ?? 0

  // Top 10 posts (last 30 days)
  const { data: topPosts } = await supabase
    .from('post_views')
    .select('post_id, posts!inner(title), count')
    .gte('viewed_at', new Date(Date.now() - 30*24*60*60*1000).toISOString())
    .group('post_id, posts.title')
    .order('count', { ascending: false })
    .limit(10)

  const topList = document.getElementById('top-posts-list')
  if (topPosts && topPosts.length) {
    topList.innerHTML = topPosts.map(p => `
      <div class="post-item">
        <span>${escapeHtml(p.posts.title)}</span>
        <span>${p.count} views</span>
      </div>
    `).join('')
  } else {
    topList.innerHTML = '<p>No data yet</p>'
  }

  // Chart: page views last 7 days
  const labels = []
  const data = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    labels.push(dateStr.slice(5))
    const { count } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', dateStr)
      .lt('viewed_at', new Date(d.getTime() + 86400000).toISOString().split('T')[0])
    data.push(count ?? 0)
  }

  new Chart(document.getElementById('views-chart'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Page Views',
        data: data,
        borderColor: '#4361ee',
        tension: 0.1
      }]
    }
  })
}

// ========== PENDING APPROVALS ==========
if (window.location.pathname.endsWith('pending.html')) {
  loadPending()
}

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
  loadingEl.style.display = 'block'

  if (error) {
    container.innerHTML = '<p>Error loading pending posts.</p>'
    loadingEl.style.display = 'none'
    return
  }

  if (!pendingPosts.length) {
    container.innerHTML = '<p>No pending posts.</p>'
    loadingEl.style.display = 'none'
    return
  }

  container.innerHTML = pendingPosts.map(post => `
    <div class="pending-card" data-id="${post.id}">
      <div>
        <strong>${escapeHtml(post.title)}</strong> - $${post.price}
        <br><small>${escapeHtml(post.category)} · ${escapeHtml(post.contact)}</small>
        <p>${escapeHtml(post.description?.substring(0,100))}...</p>
        ${post.image_urls?.map(url => `<img src="${url}" width="60" height="60" style="object-fit:cover;">`).join('')}
      </div>
      <div class="pending-actions">
        <button class="btn btn--small btn--success" onclick="approvePost(${post.id})">Approve</button>
        <button class="btn btn--small btn--danger" onclick="rejectPost(${post.id})">Reject</button>
      </div>
    </div>
  `).join('')

  loadingEl.style.display = 'none'
}

window.approvePost = async (id) => {
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
if (window.location.pathname.endsWith('manage.html')) {
  loadManage()
}

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
  loadingEl.style.display = 'block'

  if (error) {
    container.innerHTML = '<p>Error loading posts.</p>'
    loadingEl.style.display = 'none'
    return
  }

  if (!posts.length) {
    container.innerHTML = '<p>No posts yet.</p>'
    loadingEl.style.display = 'none'
    return
  }

  container.innerHTML = posts.map(post => `
    <div class="post-item" data-id="${post.id}">
      <div>
        <strong>${escapeHtml(post.title)}</strong> - $${post.price}
        <br><small>Status: ${post.status} | Category: ${escapeHtml(post.category)} | Contact: ${escapeHtml(post.contact)}</small>
        <p>${escapeHtml(post.description?.substring(0,100))}...</p>
        ${post.image_urls?.map(url => `<img src="${url}" width="60" height="60" style="object-fit:cover;">`).join('')}
      </div>
      <div class="post-actions">
        <button class="btn btn--small" onclick="editPost(${post.id})">Edit</button>
        <button class="btn btn--small btn--danger" onclick="deletePost(${post.id})">Delete</button>
      </div>
    </div>
  `).join('')

  loadingEl.style.display = 'none'
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

function escapeHtml(unsafe) {
  if (!unsafe) return ''
  return unsafe.replace(/[&<>"']/g, function(m) {
    if(m === '&') return '&amp;'
    if(m === '<') return '&lt;'
    if(m === '>') return '&gt;'
    if(m === '"') return '&quot;'
    if(m === "'") return '&#039;'
  })
}