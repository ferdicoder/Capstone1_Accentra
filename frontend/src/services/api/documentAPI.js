import axios from 'axios'
// TODO: edit form UI if there is attached file 
async function uploadTemplateDocument(templateTaskId, file) {
  const formData = new FormData()
  formData.append('document', file)

  const res = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/documents/template/${templateTaskId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return res.data
}

export{
  uploadTemplateDocument
}