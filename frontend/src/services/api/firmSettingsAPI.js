import { supabase } from "@/config/supabase"
import { apiBaseUrl } from "@/config/api"

const FIRM_SETTINGS_SELECT = [
  "singleton",
  "firm_name",
  "logo_storage_key",
  "logo_b2_file_id",
  "logo_file_name",
  "logo_mime_type",
  "contact_email",
  "about",
  "terms_and_conditions",
  "updated_at",
  "updated_by",
].join(", ")

// Public URL served by GET /api/v1/firm-settings/logo (404 when no logo set).
export const firmLogoUrl = `${apiBaseUrl}/firm-settings/logo`

function mapFirmSettingsRow(row) {
  if (!row) return null
  return {
    firmName: row.firm_name ?? "",
    logoStorageKey: row.logo_storage_key ?? null,
    logoB2FileId: row.logo_b2_file_id ?? null,
    logoFileName: row.logo_file_name ?? null,
    logoMimeType: row.logo_mime_type ?? null,
    contactEmail: row.contact_email ?? "",
    about: row.about ?? "",
    termsAndConditions: row.terms_and_conditions ?? "",
    updatedAt: row.updated_at ?? null,
    updatedBy: row.updated_by ?? null,
  }
}

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getFirmSettings() {
  const { data, error } = await supabase
    .from("firm_settings")
    .select(FIRM_SETTINGS_SELECT)
    .eq("singleton", true)
    .maybeSingle()

  if (error) throw error
  return mapFirmSettingsRow(data)
}

export async function updateFirmSettings(fields) {
  const { data, error } = await supabase
    .from("firm_settings")
    .update({
      firm_name: fields.firmName,
      contact_email: fields.contactEmail,
      about: fields.about ?? "",
      terms_and_conditions: fields.termsAndConditions ?? "",
      logo_storage_key: fields.logoStorageKey ?? null,
      logo_b2_file_id: fields.logoB2FileId ?? null,
      logo_file_name: fields.logoFileName ?? null,
      logo_mime_type: fields.logoMimeType ?? null,
    })
    .eq("singleton", true)
    .select(FIRM_SETTINGS_SELECT)
    .single()

  if (error) throw error
  return mapFirmSettingsRow(data)
}

// Returns { storageKey, b2FileId, fileName, mimeType }. Persist the keys on
// firm_settings, then call deleteFirmLogoFile with the previous ones.
export async function uploadFirmLogo(file) {
  const formData = new FormData()
  formData.append("document", file)

  const token = await getAccessToken()
  const response = await fetch(`${apiBaseUrl}/firm-settings/logo`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Logo upload failed")
  }
  return response.json()
}

export async function deleteFirmLogoFile(storageKey, fileId) {
  const token = await getAccessToken()
  const params = new URLSearchParams({ storageKey, fileId })

  const response = await fetch(`${apiBaseUrl}/firm-settings/logo?${params}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })

  if (!response.ok && response.status !== 404) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Logo cleanup failed")
  }
}
