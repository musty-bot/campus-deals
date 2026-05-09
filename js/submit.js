import { supabase } from './config.js'

const form = document.getElementById('post-form')
const submitBtn = document.getElementById('submit-btn')
const messageEl = document.getElementById('form-message')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  submitBtn.disabled = true
  messageEl.textContent = 'Submitting...'
  messageEl.style.color = 'blue'

  const title = document.getElementById('title').value.trim()
  const description = document.getElementById('description').value.trim()
  const price = parseFloat(document.getElementById('price').value)
  const category = document.getElementById('category').value
  const contact = document.getElementById('contact').value.trim()
  const imageInput = document.getElementById('images')
  const imageFiles = Array.from(imageInput.files).slice(0, 3)

  if (!title || !price || !category || !contact || imageFiles.length === 0) {
    messageEl.textContent = 'Please fill all fields and upload at least one image'
    messageEl.style.color = 'red'
    submitBtn.disabled = false
    return
  }

  try {
    // Upload images
    const imageUrls = []
    for (const file of imageFiles) {
      const fileName = Date.now() + '-' + file.name
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, file)
      
      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Image upload failed: ' + uploadError.message)
      }
      
      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName)
      
      imageUrls.push(urlData.publicUrl)
    }

    // Save to database
    const { error: insertError } = await supabase
      .from('posts')
      .insert({
        title: title,
        description: description,
        price: price,
        category: category,
        contact: contact,
        image_urls: imageUrls,
        status: 'pending'
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error('Database error: ' + insertError.message)
    }

    messageEl.textContent = '✅ Success! Your ad is pending approval.'
    messageEl.style.color = 'green'
    form.reset()
    document.getElementById('image-preview').innerHTML = ''

  } catch (err) {
    console.error('Submission error:', err)
    messageEl.textContent = '❌ Submission failed: ' + err.message
    messageEl.style.color = 'red'
  } finally {
    submitBtn.disabled = false
  }
})

// Image preview
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
      img.style.width = '80px'
      img.style.height = '80px'
      img.style.objectFit = 'cover'
      img.style.margin = '5px'
      img.style.borderRadius = '8px'
      previewContainer.appendChild(img)
    }
    reader.readAsDataURL(file)
  })
})