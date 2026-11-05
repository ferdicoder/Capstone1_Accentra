import axios from 'axios'
import { supabase } from "@/config/supabase"
import { apiBaseUrl } from "@/config/api"

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function uploadTemplateDocument(templateTaskId, file, onUploadProgress) {
  const formData = new FormData()
  formData.append('document', file)
  const token = await getAccessToken()
  const res = await axios.post(`${apiBaseUrl}/documents/template/${templateTaskId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...authHeaders(token) },
    onUploadProgress,
  })
  return res.data
}

function mapDocumentRow(row) {
  const uploader = row.uploader
  return {
    id: row.doc_id,
    name: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    uploadedBy: uploader ? [uploader.first_name, uploader.last_name].filter(Boolean).join(" ") : "—",
    uploadedDate: row.created_at,
    engagementTaskId: row.engagement_task_id,
    downloadUrl: `${apiBaseUrl}/documents/${row.doc_id}/download`,
  }
}

function mapDeliverableRow(row) {
  return { ...row, downloadUrl: `${apiBaseUrl}${row.downloadUrl}` }
}

async function getEngagementDeliverables(engagementId) {
  const token = await getAccessToken()
  const response = await fetch(`${apiBaseUrl}/documents/engagement/${engagementId}/deliverables`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw new Error("Could not load deliverables")
  return (await response.json()).map(mapDeliverableRow)
}

async function uploadEngagementDeliverable({ engagementId, file }) {
  const token = await getAccessToken()
  const formData = new FormData()
  formData.append("document", file)
  const response = await fetch(`${apiBaseUrl}/documents/engagement/${engagementId}/deliverables`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Deliverable upload failed")
  }
  return mapDeliverableRow(await response.json())
}

async function getEngagementDocuments(engagementId) {
  const { data, error } = await supabase
    .from("engagement_documents")
    .select(`
      doc_id, file_name, mime_type, file_size, created_at, engagement_task_id,
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
  const token = await getAccessToken()
  const response = await fetch(`${apiBaseUrl}/documents/engagement-task/${engagementTaskId}`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Document upload failed")
  }
  return mapDocumentRow({ ...(await response.json()), uploader: null })
}

async function deleteEngagementDocument(docId) {
  const token = await getAccessToken()
  const response = await fetch(`${apiBaseUrl}/documents/${docId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Document deletion failed")
  }
}

// Firm-provided guide file attached to an engagement task (staff upload).
async function uploadEngagementTaskReferenceDocument({ engagementTaskId, file }) {
  const formData = new FormData()
  formData.append("document", file)
  const token = await getAccessToken()
  const response = await fetch(
    `${apiBaseUrl}/documents/engagement-task/${engagementTaskId}/reference`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: formData,
    }
  )
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Reference document upload failed")
  }
  return response.json()
}

async function deleteEngagementTaskReferenceDocument(docId) {
  const token = await getAccessToken()
  const response = await fetch(`${apiBaseUrl}/documents/reference/${docId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Reference document deletion failed")
  }
}

export {
  uploadTemplateDocument,
  getEngagementDocuments,
  uploadEngagementDocument,
  deleteEngagementDocument,
  getEngagementDeliverables,
  uploadEngagementDeliverable,
  uploadEngagementTaskReferenceDocument,
  deleteEngagementTaskReferenceDocument,
}
