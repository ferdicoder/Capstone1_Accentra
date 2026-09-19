import { supabase } from "@/config/supabase"

function mapTaskRow(t) {
  return {
    id: t.engagement_task_id,
    engagementId: t.engagement_id,
    name: t.title,
    hasReferenceDocument: t.has_reference ?? false,
    required: t.is_required ?? false,
    status: t.status,
    completed: t.status === "approved",
    remark: t.remark,
    deadline: t.due_date,
  }
}

function mapEngagementRow(row) {
  const business = row.businesses
  const owner = business?.owner
  const staff = row.assignedStaffUser
  const tasks = Array.isArray(row.engagement_tasks) ? row.engagement_tasks : []

  return {
    id: row.engagement_id,
    engagementNumber: row.engagement_code,
    status: row.status,
    serviceFee: row.fee ?? 0,
    startDate: row.start_date,
    targetEndDate: row.due_date,
    createdAt: row.created_at,
    serviceId: row.service_id,
    serviceName: row.services?.service_name ?? "",
    category: row.services?.category ?? "",
    assignedStaffId: row.assigned_staff,
    assignedStaff: staff ? [staff.first_name, staff.last_name].filter(Boolean).join(" ") : "",
    business: business
      ? {
          id: business.business_id,
          businessName: business.name ?? "",
          businessType: business.business_type ?? "",
          tinNo: business.tin_no ?? "",
          industry: business.industry ?? "",
          contactNo: business.contact_no ?? "",
          address: [business.house_no, business.street, business.barangay, business.district, business.city, business.zip_code]
            .filter(Boolean)
            .join(", "),
        }
      : {},
    client: owner
      ? {
          firstName: owner.first_name ?? "",
          middleName: owner.middle_name ?? "",
          lastName: owner.last_name ?? "",
          email: owner.email ?? "",
          contactNo: owner.contact_no ?? "",
        }
      : {},
    tasks: tasks.map((t) => mapTaskRow({ ...t, engagement_id: row.engagement_id })),
  }
}

const ENGAGEMENT_SELECT = `
  engagement_id, engagement_code, status, fee, start_date, due_date, created_at,
  business_id, service_id, assigned_staff,
  services(service_id, service_name, category, estimated_time),
  businesses(
    business_id, name, business_type, tin_no, industry, contact_no,
    house_no, street, barangay, district, city, zip_code,
    owner:users(user_id, first_name, middle_name, last_name, email, contact_no)
  ),
  assignedStaffUser:users!engagements_assigned_staff_fkey(user_id, first_name, last_name),
  engagement_tasks(engagement_task_id, title, has_reference, is_required, status, remark, due_date)
`

async function logEngagementActivity(engagementId, type, message) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from("engagement_activity").insert({
    engagement_id: engagementId,
    type,
    message,
    actor_id: user?.id ?? null,
  })
  if (error) console.error("Failed to log engagement activity:", error)
}

export async function getEngagements() {
  const { data, error } = await supabase.from("engagements").select(ENGAGEMENT_SELECT).order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapEngagementRow)
}

export async function getMyEngagements(businessId) {
  const { data, error } = await supabase.from("engagements").select(ENGAGEMENT_SELECT).eq("business_id", businessId).order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapEngagementRow)
}

export async function getEngagement(id) {
  const { data, error } = await supabase.from("engagements").select(ENGAGEMENT_SELECT).eq("engagement_id", id).single()
  if (error) throw error
  return mapEngagementRow(data)
}

export async function createEngagementFromRequest({ serviceRequestId, assignedStaff, startDate, dueDate, fee }) {
  const { data: engagementId, error } = await supabase.rpc("create_engagement", {
    p_service_request_id: serviceRequestId,
    p_assigned_staff: assignedStaff,
    p_start_date: startDate,
    p_due_date: dueDate,
    p_fee: fee,
  })
  if (error) throw error
  return getEngagement(engagementId)
}

export async function updateEngagementStatus({ id, status }) {
  const { data, error } = await supabase.from("engagements").update({ status }).eq("engagement_id", id).select(ENGAGEMENT_SELECT).single()
  if (error) throw error
  return mapEngagementRow(data)
}

// Docless checklist tasks — firm marks done directly.
export async function setTaskCompleted({ taskId, completed }) {
  const { data, error } = await supabase
    .from("engagement_tasks")
    .update({ status: completed ? "approved" : "missing" })
    .eq("engagement_task_id", taskId)
    .select()
    .single()
  if (error) throw error

  if (data.status === "approved") {
    await logEngagementActivity(data.engagement_id, "task_completed", data.title)
  }
  return mapTaskRow(data)
}

// Document-backed tasks — firm approves or sends back with a remark.
export async function reviewEngagementTask({ taskId, status, remark }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("engagement_tasks")
    .update({
      status,
      remark: remark ?? null,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("engagement_task_id", taskId)
    .select()
    .single()
  if (error) throw error

  await logEngagementActivity(
    data.engagement_id,
    status === "approved" ? "task_approved" : "task_revision_requested",
    data.title
  )
  return mapTaskRow(data)
}

// Firm adds a custom task to an existing engagement.
export async function createEngagementTask({ engagementId, title, hasReferenceDocument, required, dueDate }) {
  const { data, error } = await supabase
    .from("engagement_tasks")
    .insert({
      engagement_id: engagementId,
      title,
      has_reference: hasReferenceDocument,
      is_required: required,
      due_date: dueDate || null,
      status: "missing",
    })
    .select()
    .single()
  if (error) throw error

  await logEngagementActivity(engagementId, "task_added", title)
  return mapTaskRow(data)
}

// Firm edits an existing task's definition (name/required/reference/deadline).
export async function updateEngagementTask({ taskId, title, hasReferenceDocument, required, dueDate }) {
  const { data, error } = await supabase
    .from("engagement_tasks")
    .update({
      title,
      has_reference: hasReferenceDocument,
      is_required: required,
      due_date: dueDate || null,
    })
    .eq("engagement_task_id", taskId)
    .select()
    .single()
  if (error) throw error
  return mapTaskRow(data)
}

// Lightweight single-field update for the inline deadline editor.
export async function updateEngagementTaskDeadline({ taskId, dueDate }) {
  const { data, error } = await supabase
    .from("engagement_tasks")
    .update({ due_date: dueDate || null })
    .eq("engagement_task_id", taskId)
    .select()
    .single()
  if (error) throw error
  return mapTaskRow(data)
}

function mapActivityRow(row) {
  const actor = row.actor
  return {
    id: row.activity_id,
    type: row.type,
    message: row.message,
    createdAt: row.created_at,
    actorName: actor ? [actor.first_name, actor.last_name].filter(Boolean).join(" ") : "Unknown user",
  }
}

export async function getEngagementActivity(engagementId) {
  const { data, error } = await supabase
    .from("engagement_activity")
    .select("activity_id, type, message, created_at, actor:users(user_id, first_name, last_name)")
    .eq("engagement_id", engagementId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapActivityRow)
}