import { supabase } from './config.js'
import { trackPostView, trackContactClick } from './tracking.js'

const postDetailEl = document.getElementById('post-detail')
const loadingEl = document.getElementById('loading')

const urlParams = new URLSearchParams(window.location.search)
const postId = urlParams.get('id')

if (!postId) {
  window.location.href = '/404.html'
}

async function loadPost() {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('status', 'approved')
      .single()

    if (error || !post) throw new Error('Post not found')

    trackPostView(post.id)

    renderPost(post)
  } catch (err) {
    postDetailEl.innerHTML = '<p class="error">Deal not found or not available.</p>'
  } finally {
    loadingEl.style.display = 'none'
  }
}

function renderPost(post) {
  const imagesHtml = post.image_urls?.map(url =>
    `<img src="${url}" alt="${post.title}" loading="lazy">`
  ).join('') || '<p>No images</p>'

  const timeAgo = timeSince(new Date(post.created_at))

  postDetailEl.innerHTML = `
    <div class="post-detail">
      <div class="post-detail__images">
        ${imagesHtml}
      </div>
      <h1 class="post-detail__title">${escapeHtml(post.title)}</h1>
      <div class="post-detail__price">$${Number(post.price).toFixed(2)}</div>
      <div class="post-detail__meta">
        <span>${escapeHtml(post.category)}</span>
        <span>Posted ${timeAgo}</span>
      </div>
      <p class="post-detail__description">${escapeHtml(post.description || 'No description provided.')}</p>
      <div class="contact-section">
        <h3>Contact Seller</h3>
        <button id="show-contact-btn" class="btn btn--primary">Show Contact Info</button>
        <div id="contact-info" class="contact-info" style="display:none;">${escapeHtml(post.contact)}</div>
      </div>
    </div>
  `

  document.getElementById('show-contact-btn').addEventListener('click', () => {
    const contactDiv = document.getElementById('contact-info')
    contactDiv.style.display = 'block'
    trackContactClick(post.id)
  })
}

function escapeHtml(unsafe) {
  if (!unsafe) return unsafe
  return unsafe.replace(/[&<>"']/g, function(m) {
    if(m === '&') return '&amp;'
    if(m === '<') return '&lt;'
    if(m === '>') return '&gt;'
    if(m === '"') return '&quot;'
    if(m === "'") return '&#039;'
  })
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + 'y ago'
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + 'mo ago'
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + 'd ago'
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + 'h ago'
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + 'm ago'
  return 'just now'
}

loadPost()