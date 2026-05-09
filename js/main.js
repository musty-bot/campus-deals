import { supabase } from './config.js'

const dealsGrid = document.getElementById('deals-grid')
const loadingEl = document.getElementById('loading')
const noResultsEl = document.getElementById('no-results')
const searchInput = document.getElementById('search')
const categorySelect = document.getElementById('category')

let allPosts = []

async function loadPosts() {
  loadingEl.classList.remove('hidden')
  dealsGrid.innerHTML = ''
  noResultsEl.classList.add('hidden')

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) throw error

    allPosts = data || []

    if (allPosts.length === 0) {
      noResultsEl.classList.remove('hidden')
      return
    }

    renderPosts(allPosts)
  } catch (err) {
    console.error('Error:', err)
    dealsGrid.innerHTML = '<p style="color:red;">Failed to load deals. Please refresh.</p>'
  } finally {
    loadingEl.classList.add('hidden')
  }
}

function renderPosts(posts) {
  dealsGrid.innerHTML = posts.map(post => {
    const imageUrl = post.image_urls?.[0] || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\' viewBox=\'0 0 400 400\'%3E%3Crect width=\'400\' height=\'400\' fill=\'%23cccccc\'/%3E%3Ctext x=\'100\' y=\'200\' font-family=\'Arial\' font-size=\'30\' fill=\'%23333\'%3ENo Image%3C/text%3E%3C/svg%3E'
    
    return `
      <a href="/post.html?id=${post.id}" class="deal-card" style="text-decoration:none; color:inherit;">
        <img src="${imageUrl}" alt="${post.title}" class="deal-card__image">
        <div class="deal-card__content">
          <h3 class="deal-card__title">${escapeHtml(post.title)}</h3>
          <div class="deal-card__price">KSh ${Number(post.price).toFixed(2)}</div>
          <div class="deal-card__meta">
            <span>${escapeHtml(post.category)}</span>
            <span>${timeAgo(post.created_at)}</span>
          </div>
        </div>
      </a>
    `
  }).join('')
}

function escapeHtml(text) {
  if (!text) return ''
  return text.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;'
    if (m === '<') return '&lt;'
    if (m === '>') return '&gt;'
  })
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return minutes + 'm ago'
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  return days + 'd ago'
}

function filterPosts() {
  const searchTerm = searchInput.value.toLowerCase()
  const category = categorySelect.value
  
  let filtered = allPosts
  if (searchTerm) {
    filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTerm))
  }
  if (category) {
    filtered = filtered.filter(p => p.category === category)
  }
  
  if (filtered.length === 0) {
    noResultsEl.classList.remove('hidden')
    dealsGrid.innerHTML = ''
  } else {
    noResultsEl.classList.add('hidden')
    renderPosts(filtered)
  }
}

searchInput.addEventListener('input', filterPosts)
categorySelect.addEventListener('change', filterPosts)

loadPosts()