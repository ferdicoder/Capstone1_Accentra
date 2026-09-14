import axios from 'axios'
import { supabase } from "@/config/supabase"
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

const reviewStatusLabels = { pending: "Pending", approved: "Approved", for_revision: "For Revision" }

function mapDocumentRow(row) {
  const uploader = row.uploader
  return {
    id: row.doc_id,
    name: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    uploadedBy: uploader ? [uploader.first_name, uploader.last_name].filter(Boolean).join(" ") : "—",
    uploadedDate: row.created_at,
    reviewStatus: reviewStatusLabels[row.review_status] ?? row.review_status,
    remark: row.remark,
    engagementTaskId: row.engagement_task_id,
    downloadUrl: `${import.meta.env.VITE_API_BASE_URL}/documents/${row.doc_id}/download`,
  }
}

async function getEngagementDocuments(engagementId) {
  const { data, error } = await supabase
    .from("engagement_documents")
    .select(`
      doc_id, file_name, mime_type, file_size, review_status, remark, created_at, engagement_task_id,
      engagement_tasks!inner(engagement_id),
      uploader:users!engagement_documents_uploaded_by_fkey(user_id, first_name, last_name)
    `)
    .eq("engagement_tasks.engagement_id", engagementId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapDocumentRow)
}

async function uploadEngagementDocument({ engagementTaskId, file, uploadedBy }) {
  const formData = new FormData()
  formData.append("document", file)
  if (uploadedBy) formData.append("uploadedBy", uploadedBy)

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/documents/engagement-task/${engagementTaskId}`,
    { method: "POST", body: formData }
  )
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Document upload failed")
  }

  return mapDocumentRow({ ...(await response.json()), uploader: null })
}

export{
  uploadTemplateDocument,
  getEngagementDocuments,
  uploadEngagementDocument
}