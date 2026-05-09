import { supabase } from './config.js';

export async function loadAnnouncement() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value_text')
      .eq('key', 'announcement_text')
      .single();
    
    if (error) {
      console.warn('Could not load announcement:', error);
      return;
    }
    
    if (data && data.value_text) {
      displayAnnouncement(data.value_text);
    }
  } catch (err) {
    console.warn('Announcement error:', err);
  }
}

function displayAnnouncement(message) {
  // Check if announcement bar already exists
  let announcementBar = document.getElementById('announcement-bar');
  
  if (!announcementBar) {
    announcementBar = document.createElement('div');
    announcementBar.id = 'announcement-bar';
    announcementBar.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      position: relative;
      z-index: 1000;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    // Insert at the top of body
    document.body.insertBefore(announcementBar, document.body.firstChild);
  }
  
  announcementBar.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;">
      <span style="font-size: 18px;">📢</span>
      <span style="flex: 1; text-align: center;">${escapeHtml(message)}</span>
      <button id="close-announcement" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        transition: background 0.3s;
      " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">✕ Dismiss</button>
    </div>
  `;
  
  // Add close functionality
  const closeBtn = document.getElementById('close-announcement');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      announcementBar.style.display = 'none';
    });
  }
}

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

// Auto-load announcement on page load
if (!window.location.pathname.includes('/admin')) {
  loadAnnouncement();
}