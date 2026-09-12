import { supabase } from "@/config/supabase"

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
    tasks: tasks.map((t) => ({
      id: t.engagement_task_id,
      name: t.title,
      hasReferenceDocument: t.has_reference ?? false,
      required: t.is_required ?? false,
      completed: t.is_completed ?? false,
    })),
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
  engagement_tasks(engagement_task_id, title, has_reference, is_required, is_completed)
`

export async function getEngagements() {
  const { data, error } = await supabase
    .from("engagements")
    .select(ENGAGEMENT_SELECT)
    .order("created_at", { ascending: false })
  if (error) throw error

  return (data ?? []).map(mapEngagementRow)
}

export async function getMyEngagements(businessId) {
  const { data, error } = await supabase
    .from("engagements")
    .select(ENGAGEMENT_SELECT)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
  if (error) throw error

  return (data ?? []).map(mapEngagementRow)
}

export async function getEngagement(id) {
  const { data, error } = await supabase
    .from("engagements")
    .select(ENGAGEMENT_SELECT)
    .eq("engagement_id", id)
    .single()
  if (error) throw error

  return mapEngagementRow(data)
}

// Approves a pending service_request into an active engagement (see create_engagement RPC).
export async function createEngagementFromRequest({ serviceRequestId, assignedStaff, startDate, dueDate, fee }) {
  const { data: engagementId, error } = await supabase.rpc("create_engagement", {
    p_service_request_id: serviceRequestId,
    p_assigned_staff: assignedStaff,
    p_start_date: startDate,
    p_due_date: dueDate,
    p_fee: fee,
  })
  if (error) throw error

  // RPC only returns the new engagement_id — same pattern as create/update service,
  // fetch the full row (with joins + tasks) before handing it back.
  return getEngagement(engagementId)
}

export async function updateEngagementStatus({ id, status }) {
  const { data, error } = await supabase
    .from("engagements")
    .update({ status })
    .eq("engagement_id", id)
    .select(ENGAGEMENT_SELECT)
    .single()
  if (error) throw error

  return mapEngagementRow(data)
}

export async function toggleEngagementTask({ taskId, completed }) {
  const { data, error } = await supabase
    .from("engagement_tasks")
    .update({ is_completed: completed })
    .eq("engagement_task_id", taskId)
    .select()
    .single()
  if (error) throw error

  return {
    id: data.engagement_task_id,
    name: data.title,
    hasReferenceDocument: data.has_reference ?? false,
    required: data.is_required ?? false,
    completed: data.is_completed ?? false,
  }
}