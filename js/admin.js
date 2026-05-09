import { supabase } from './config.js';

// ========== LOGOUT ==========
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/index.html';
  });
}

// ========== LOGIN ==========
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorEl.textContent = error.message;
    } else {
      window.location.href = '/admin/dashboard.html';
    }
  });
}

// ========== DASHBOARD ==========
if (window.location.pathname.includes('/dashboard')) {
  loadDashboard();
}

async function loadDashboard() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/admin/index.html';
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  const { count: viewsToday } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .gte('viewed_at', today);
  document.getElementById('views-today').textContent = viewsToday ?? 0;

  const { count: active } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');
  document.getElementById('active-listings').textContent = active ?? 0;

  const { count: pending } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  document.getElementById('pending-count').textContent = pending ?? 0;

  const { count: clicksToday } = await supabase
    .from('contact_clicks')
    .select('*', { count: 'exact', head: true })
    .gte('clicked_at', today);
  document.getElementById('clicks-today').textContent = clicksToday ?? 0;

  // Top 10 posts (last 30 days)
  const { data: topPosts } = await supabase
    .from('post_views')
    .select('post_id, posts!inner(title), count')
    .gte('viewed_at', new Date(Date.now() - 30*24*60*60*1000).toISOString())
    .group('post_id, posts.title')
    .order('count', { ascending: false })
    .limit(10);

  const topList = document.getElementById('top-posts-list');
  if (topPosts && topPosts.length) {
    topList.innerHTML = topPosts.map(p => `
      <div class="post-item">
        <span>${escapeHtml(p.posts.title)}</span>
        <span>${p.count} views</span>
      </div>
    `).join('');
  } else {
    topList.innerHTML = '<p>No data yet</p>';
  }

  // Chart: page views last 7 days
  const labels = [];
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    labels.push(dateStr.slice(5));
    const { count } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', dateStr)
      .lt('viewed_at', new Date(d.getTime() + 86400000).toISOString().split('T')[0]);
    data.push(count ?? 0);
  }

  if (window.Chart) {
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
    });
  }
}

// ========== PENDING APPROVALS ==========
if (window.location.pathname.includes('/pending')) {
  document.addEventListener('DOMContentLoaded', loadPending);
}

async function loadPending() {
  const loadingEl = document.getElementById('loading');
  const container = document.getElementById('pending-list');
  
  if (!container) {
    console.error('Error: #pending-list element not found!');
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/admin/index.html';
    return;
  }

  const { data: pendingPosts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    container.innerHTML = `<p class="error">Error loading pending posts: ${error.message}</p>`;
    if (loadingEl) loadingEl.style.display = 'none';
    return;
  }

  if (loadingEl) loadingEl.style.display = 'none';

  if (!pendingPosts || pendingPosts.length === 0) {
    container.innerHTML = '<p>No pending posts.</p>';
    return;
  }

  container.innerHTML = pendingPosts.map(post => `
    <div class="pending-card" data-id="${post.id}">
      <div>
        <strong>${escapeHtml(post.title)}</strong> - KSh ${post.price}
        <br><small>${escapeHtml(post.category)} · ${escapeHtml(post.contact)}</small>
        <p>${escapeHtml(post.description?.substring(0,100))}...</p>
        ${post.image_urls?.map(url => `<img src="${url}" width="60" height="60" style="object-fit:cover;">`).join('')}
      </div>
      <div class="pending-actions">
        <button class="btn btn--small" onclick="approvePost(${post.id})">Approve</button>
        <button class="btn btn--small btn--danger" onclick="rejectPost(${post.id})">Reject</button>
      </div>
    </div>
  `).join('');
}

window.approvePost = async (id) => {
  if (!confirm('Approve this post?')) return;
  const { error } = await supabase
    .from('posts')
    .update({ status: 'approved' })
    .eq('id', id);
  if (error) alert('Error: ' + error.message);
  else location.reload();
};

window.rejectPost = async (id) => {
  if (!confirm('Reject this post? It will be deleted.')) return;
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);
  if (error) alert('Error: ' + error.message);
  else location.reload();
};

// ========== MANAGE POSTS ==========
if (window.location.pathname.includes('/manage')) {
  document.addEventListener('DOMContentLoaded', loadManage);
}

async function loadManage() {
  const loadingEl = document.getElementById('loading');
  const container = document.getElementById('manage-list');

  if (!container) {
    console.error('Error: #manage-list element not found!');
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/admin/index.html';
    return;
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    container.innerHTML = `<p class="error">Error loading posts: ${error.message}</p>`;
    if (loadingEl) loadingEl.style.display = 'none';
    return;
  }

  if (loadingEl) loadingEl.style.display = 'none';

  if (!posts || posts.length === 0) {
    container.innerHTML = '<p>No posts yet.</p>';
    return;
  }

  container.innerHTML = posts.map(post => `
    <div class="post-item" data-id="${post.id}">
      <div>
        <strong>${escapeHtml(post.title)}</strong> - KSh ${post.price}
        <br><small>Status: ${post.status} | Category: ${escapeHtml(post.category)} | Contact: ${escapeHtml(post.contact)}</small>
        <p>${escapeHtml(post.description?.substring(0,100))}...</p>
        ${post.image_urls?.map(url => `<img src="${url}" width="60" height="60" style="object-fit:cover;">`).join('')}
      </div>
      <div class="post-actions">
        <button class="btn btn--small" onclick="editPost(${post.id})">Edit</button>
        <button class="btn btn--small btn--danger" onclick="deletePost(${post.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

window.deletePost = async (id) => {
  if (!confirm('Delete this post permanently?')) return;
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);
  if (error) alert('Error: ' + error.message);
  else location.reload();
};

window.editPost = async (id) => {
  const newTitle = prompt('Enter new title:');
  if (!newTitle) return;
  const { error } = await supabase
    .from('posts')
    .update({ title: newTitle })
    .eq('id', id);
  if (error) alert('Error: ' + error.message);
  else location.reload();
};

// ========== MAINTENANCE MODE ==========
async function loadMaintenanceStatus() {
  const toggle = document.getElementById('maintenance-toggle');
  if (!toggle) return;
  
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single();
  
  if (!error && data) {
    toggle.checked = data.value;
    const statusText = document.getElementById('maintenance-status-text');
    if (statusText) {
      statusText.textContent = data.value ? '🔧 Enabled (Visitors see maintenance page)' : '✅ Live (Site visible to visitors)';
    }
  }
}

async function toggleMaintenanceMode(checked) {
  const { error } = await supabase
    .from('settings')
    .update({ value: checked, updated_at: new Date() })
    .eq('key', 'maintenance_mode');
  
  if (error) {
    console.error('Error updating maintenance mode:', error);
    alert('Failed to update maintenance mode');
    return false;
  }
  
  const statusText = document.getElementById('maintenance-status-text');
  if (statusText) {
    statusText.textContent = checked ? '🔧 Enabled (Visitors see maintenance page)' : '✅ Live (Site visible to visitors)';
  }
  return true;
}

// Add maintenance toggle event listener
if (document.getElementById('maintenance-toggle')) {
  document.getElementById('maintenance-toggle').addEventListener('change', async (e) => {
    const success = await toggleMaintenanceMode(e.target.checked);
    if (!success) {
      e.target.checked = !e.target.checked;
    } else {
      alert(e.target.checked ? 'Maintenance mode ENABLED. Visitors will see the maintenance page.' : 'Maintenance mode DISABLED. Site is live again.');
    }
  });
  loadMaintenanceStatus();
}

// ========== ANNOUNCEMENT MANAGEMENT ==========
async function loadAnnouncementText() {
  const textarea = document.getElementById('announcement-text');
  if (!textarea) return;
  
  const { data, error } = await supabase
    .from('settings')
    .select('value_text')
    .eq('key', 'announcement_text')
    .single();
  
  if (!error && data && data.value_text) {
    textarea.value = data.value_text;
  }
}

async function saveAnnouncementText() {
  const textarea = document.getElementById('announcement-text');
  const statusSpan = document.getElementById('announcement-status');
  
  if (!textarea) return;
  
  const newText = textarea.value.trim();
  
  if (!newText) {
    statusSpan.textContent = '❌ Please enter a message';
    statusSpan.style.color = '#ffcccc';
    setTimeout(() => {
      statusSpan.textContent = '';
    }, 3000);
    return;
  }
  
  statusSpan.textContent = 'Saving...';
  statusSpan.style.color = 'white';
  
  const { error } = await supabase
    .from('settings')
    .update({ value_text: newText, updated_at: new Date() })
    .eq('key', 'announcement_text');
  
  if (error) {
    console.error('Error saving announcement:', error);
    statusSpan.textContent = '❌ Save failed';
    statusSpan.style.color = '#ffcccc';
  } else {
    statusSpan.textContent = '✅ Saved!';
    statusSpan.style.color = '#ccffcc';
    setTimeout(() => {
      statusSpan.textContent = '';
    }, 3000);
  }
}

function previewAnnouncement() {
  const textarea = document.getElementById('announcement-text');
  const modal = document.getElementById('preview-modal');
  const previewMessage = document.getElementById('preview-message');
  
  if (!textarea || !modal || !previewMessage) return;
  
  const message = textarea.value.trim();
  previewMessage.textContent = message || 'Your announcement will appear here';
  modal.style.display = 'flex';
}

function closePreviewModal() {
  const modal = document.getElementById('preview-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Add announcement event listeners
if (document.getElementById('save-announcement-btn')) {
  document.getElementById('save-announcement-btn').addEventListener('click', saveAnnouncementText);
  document.getElementById('preview-announcement-btn').addEventListener('click', previewAnnouncement);
  const closeModalBtn = document.getElementById('close-modal-btn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closePreviewModal);
  }
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('preview-modal');
    if (e.target === modal) {
      closePreviewModal();
    }
  });
  loadAnnouncementText();
}

// ========== HELPER FUNCTION ==========
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[&<>"']/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    if (m === "'") return '&#039;';
  });
}