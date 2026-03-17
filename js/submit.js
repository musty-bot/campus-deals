import { supabase } from './config.js'

const form = document.getElementById('post-form')
const submitBtn = document.getElementById('submit-btn')
const messageEl = document.getElementById('form-message')
const imageInput = document.getElementById('images')
const previewContainer = document.getElementById('image-preview')

imageInput.addEventListener('change', () => {
  previewContainer.innerHTML = ''
  const files = Array.from(imageInput.files).slice(0, 3)
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = document.createElement('img')
      img.src = e.target.result
      previewContainer.appendChild(img)
    }
    reader.readAsDataURL(file)
  })
})

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  submitBtn.disabled = true
  messageEl.textContent = 'Submitting...'

  const title = document.getElementById('title').value.trim()
  const description = document.getElementById('description').value.trim()
  const price = parseFloat(document.getElementById('price').value)
  const category = document.getElementById('category').value
  const contact = document.getElementById('contact').value.trim()
  const imageFiles = Array.from(imageInput.files).slice(0, 3)

  if (!title || !price || !category || !contact || imageFiles.length === 0) {
    messageEl.textContent = 'Please fill all required fields and upload at least one image.'
    submitBtn.disabled = false
    return
  }

  try {
    const imageUrls = []
    for (const file of imageFiles) {
      const optimizedFile = await optimizeImage(file, 1200)
      const fileName = `${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, optimizedFile, { cacheControl: '3600' })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName)
      imageUrls.push(publicUrl)
    }

    const { error: insertError } = await supabase
      .from('posts')
      .insert({
        title,
        description,
        price,
        category,
        contact,
        image_urls: imageUrls,
        status: 'pending',
      })

    if (insertError) throw insertError

    messageEl.textContent = 'Your ad has been submitted and is pending approval. Thank you!'
    form.reset()
    previewContainer.innerHTML = ''
  } catch (err) {
    console.error(err)
    messageEl.textContent = 'Submission failed. Please try again later.'
  } finally {
    submitBtn.disabled = false
  }
})

async function optimizeImage(file, maxWidth) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          resolve(blob)
        }, file.type, 0.8)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}