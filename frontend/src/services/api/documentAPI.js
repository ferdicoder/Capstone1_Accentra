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

// Accepts either a flat row (backend responses put file fields at the top
// level) or a nested PostgREST row from engagement_task_submissions, where
// file metadata lives under `files`.
function mapDocumentRow(row) {
  const file = row.files ?? row
  const uploader = file.uploader ?? row.uploader
  const fileId = row.file_id ?? file.file_id ?? row.doc_id
  return {
    id: fileId,
    name: file.file_name,
    mimeType: file.mime_type,
    fileSize: file.file_size,
    uploadedBy: uploader ? [uploader.first_name, uploader.last_name].filter(Boolean).join(" ") : "—",
    uploadedDate: file.created_at,
    engagementTaskId: row.engagement_task_id,
    reviewStatus: row.review_status ?? null,
    remark: row.remark ?? null,
    downloadUrl: `${apiBaseUrl}/documents/${fileId}/download`,
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

async function deleteEngagementDeliverable(deliverableId) {
  const token = await getAccessToken()
  const response = await fetch(`${apiBaseUrl}/documents/deliverables/${deliverableId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Deliverable deletion failed")
  }
}

async function getEngagementDocuments(engagementId) {
  const { data, error } = await supabase
    .from("engagement_task_submissions")
    .select(`
      file_id, engagement_task_id, review_status, remark,
      files(
        file_id, file_name, mime_type, file_size, created_at, uploaded_by,
        uploader:users!files_uploaded_by_fkey(user_id, first_name, last_name)
      ),
      engagement_tasks!inner(engagement_id)
    `)
    .eq("engagement_tasks.engagement_id", engagementId)
  if (error) throw error
  // Junction rows carry no created_at — order by the embedded file instead.
  const rows = [...(data ?? [])].sort(
    (first, second) =>
      new Date(second.files?.created_at ?? 0).getTime() -
      new Date(first.files?.created_at ?? 0).getTime()
  )
  return rows.map(mapDocumentRow)
}

async function uploadEngagementDocument({ engagementTaskId, file }) {
  const formData = new FormData()
  formData.append("document", file)
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
  return mapDocumentRow(await response.json())
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

// Copies the service template's reference documents onto a freshly created
// engagement's tasks — the create_engagement RPCs copy task rows but not files.
async function copyTemplateReferences(engagementId) {
  const token = await getAccessToken()
  const response = await fetch(
    `${apiBaseUrl}/documents/engagement/${engagementId}/template-references`,
    {
      method: "POST",
      headers: authHeaders(token),
    }
  )
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Template reference copy failed")
  }
  return response.json()
}

export {
  uploadTemplateDocument,
  getEngagementDocuments,
  uploadEngagementDocument,
  deleteEngagementDocument,
  getEngagementDeliverables,
  uploadEngagementDeliverable,
  deleteEngagementDeliverable,
  uploadEngagementTaskReferenceDocument,
  deleteEngagementTaskReferenceDocument,
  copyTemplateReferences,
}
