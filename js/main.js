import { supabase } from './config.js'

const dealsGrid = document.getElementById('deals-grid')
const loadingEl = document.getElementById('loading')
const noResultsEl = document.getElementById('no-results')
const searchInput = document.getElementById('search')
const categorySelect = document.getElementById('category')

let currentFilter = { search: '', category: '' }

async function loadApprovedPosts() {
  loadingEl.classList.remove('hidden')
  dealsGrid.innerHTML = ''
  noResultsEl.classList.add('hidden')

  try {
    let query = supabase
      .from('posts')
      .select('id, title, price, category, image_urls, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (currentFilter.category) {
      query = query.eq('category', currentFilter.category)
    }

    if (currentFilter.search) {
      query = query.ilike('title', `%${currentFilter.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    if (!data || data.length === 0) {
      noResultsEl.classList.remove('hidden')
      return
    }

    renderPosts(data)
  } catch (err) {
    console.error('Error loading posts:', err)
    dealsGrid.innerHTML = '<p class="error">Failed to load deals. Please refresh.</p>'
  } finally {
    loadingEl.classList.add('hidden')
  }
}

function renderPosts(posts) {
  dealsGrid.innerHTML = posts.map(post => {
    // Data URI fallback for placeholder image
    const imageUrl = post.image_urls?.[0] || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\' viewBox=\'0 0 400 400\'%3E%3Crect width=\'400\' height=\'400\' fill=\'%23cccccc\'/%3E%3Ctext x=\'100\' y=\'200\' font-family=\'Arial\' font-size=\'30\' fill=\'%23333\'%3ENo Image%3C/text%3E%3C/svg%3E'
    const timeAgo = timeSince(new Date(post.created_at))
    return `
      <a href="/post.html?id=${post.id}" class="deal-card">
        <img src="${imageUrl}" alt="${escapeHtml(post.title)}" class="deal-card__image" loading="lazy">
        <div class="deal-card__content">
          <h3 class="deal-card__title">${escapeHtml(post.title)}</h3>
          <div class="deal-card__price">$${Number(post.price).toFixed(2)}</div>
          <div class="deal-card__meta">
            <span>${escapeHtml(post.category)}</span>
            <span>${timeAgo}</span>
          </div>
        </div>
      </a>
    `
  }).join('')
}

function escapeHtml(unsafe) {
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

let debounceTimer
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentFilter.search = searchInput.value.trim()
    loadApprovedPosts()
  }, 300)
})

categorySelect.addEventListener('change', () => {
  currentFilter.category = categorySelect.value
  loadApprovedPosts()
})

loadApprovedPosts()