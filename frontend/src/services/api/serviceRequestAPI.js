import { supabase } from '@/config/supabase'; 

// wiht joins
const SERVICE_REQUEST_SELECT = `
  service_request_id,
  description,
  status,
  request_code,
  created_at,
  business_id,
  service_id,
  services(service_id, service_name, category, estimated_time, price),
  businesses(
    business_id, name, business_type, tin_no, industry, contact_no,
    house_no, street, barangay, district, city, zip_code,
    owner:users(user_id, first_name, middle_name, last_name, email, contact_no)
  )
`

function mapServiceRequestRow(row) {
  const business = row.businesses
  const owner = business?.owner

  return {
    id: row.service_request_id,
    requestNumber: row.request_code,
    serviceName: row.services?.service_name ?? "",
    category: row.services?.category ?? "",
    estimatedTime: row.services?.estimated_time ?? "",
    revenue: row.services?.price ?? null,
    submittedDate: row.created_at ? row.created_at.slice(0, 10) : null, // "YYYY-MM-DD" for formatSubmittedDate
    createdAt: row.created_at, // full timestamp kept for sorting elsewhere
    notes: row.description ?? "",
    status: row.status,
    serviceId: row.service_id,
    client: owner
      ? {
          firstName: owner.first_name ?? "",
          middleName: owner.middle_name ?? "",
          lastName: owner.last_name ?? "",
          email: owner.email ?? "",
          contactNo: owner.contact_no ?? "",
        }
      : null,
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
      : null,
  }
}

// Firm side — all requests
export async function getServiceRequests() {
  const { data, error } = await supabase
    .from("service_requests")
    .select(SERVICE_REQUEST_SELECT)
    .order("created_at", { ascending: false })
  if (error) throw error

  return (data ?? []).map(mapServiceRequestRow)
}

// Client side — scoped to their own business
export async function getMyServiceRequests(businessId) {
  const { data, error } = await supabase
    .from("service_requests")
    .select(SERVICE_REQUEST_SELECT)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
  if (error) throw error

  return (data ?? []).map(mapServiceRequestRow)
}

export async function createServiceRequest(request) {
  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      business_id: request.businessId,
      service_id: request.serviceId,
      description: request.description,
    })
    .select(SERVICE_REQUEST_SELECT)
    .single()
  if (error) throw error

  return mapServiceRequestRow(data)
}

export async function updateServiceRequestStatus({ id, status }) {
  const { data, error } = await supabase
    .from("service_requests")
    .update({ status })
    .eq("service_request_id", id)
    .select(SERVICE_REQUEST_SELECT)
    .single()
  if (error) throw error

  return mapServiceRequestRow(data)
}

export async function cancelServiceRequest(id) {
  return updateServiceRequestStatus({ id, status: "cancelled" })
}