import { supabase } from './config.js'

const form = document.getElementById('post-form')
const messageEl = document.getElementById('form-message')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  messageEl.innerHTML = 'Submitting...'
  messageEl.style.color = 'blue'

  const title = document.getElementById('title').value
  const description = document.getElementById('description').value
  const price = document.getElementById('price').value
  const category = document.getElementById('category').value
  const contact = document.getElementById('contact').value
  const imageFile = document.getElementById('images').files[0]

  if (!title || !price || !category || !contact || !imageFile) {
    messageEl.innerHTML = 'Please fill all fields'
    return
  }

  try {
    // Upload image
    const fileName = Date.now() + '-' + imageFile.name
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(fileName, imageFile)
    
    if (uploadError) {
      messageEl.innerHTML = 'Upload failed: ' + uploadError.message
      return
    }
    
    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName)
    
    // Insert into database with explicit columns
    const { data, error: insertError } = await supabase
      .from('posts')
      .insert({
        title: title,
        description: description,
        price: price,
        category: category,
        contact: contact,
        image_urls: [urlData.publicUrl],
        status: 'pending'
      })
      .select()
    
    if (insertError) {
      messageEl.innerHTML = 'Database error: ' + insertError.message
      console.error('Full error:', insertError)
      return
    }
    
    messageEl.innerHTML = '✅ Success! Pending approval.'
    messageEl.style.color = 'green'
    form.reset()
    
  } catch (err) {
    messageEl.innerHTML = 'Error: ' + err.message
    console.error(err)
  }
})