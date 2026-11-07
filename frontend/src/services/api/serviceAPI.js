import { supabase } from "@/config/supabase"; 
import { apiBaseUrl } from "@/config/api"

function mapServiceRow(row) {
  const tasks = Array.isArray(row.template_tasks) ? row.template_tasks : []
  return {
    id: row.service_id,
    name: row.service_name ?? "",
    category: row.category ?? "",
    description: row.description ?? "",
    basePrice: row.price ?? 0,
    estimatedTime: row.estimated_time ?? "",
    isRecurring: row.is_recurring ?? false,
    isRetainerCovered: row.is_retainer_covered ?? false,
    status: row.status ?? "deactivated",
    workflowTasks: tasks.map((t) => ({
      id: t.template_id,
      name: t.title ?? "",
      required: t.is_required ?? false,
      hasReferenceDocument: t.has_reference ?? false,
      referenceDocument: mapTemplateDocument(t.template_task_documents),
    })),
  }
}

function mapTemplateDocument(documents) {
  const list = Array.isArray(documents) ? documents : [documents]
  // Junction rows (template_task_documents) link to the shared `files` table
  // — metadata lives there, and the junction has no created_at of its own.
  const document = list
    .filter(Boolean)
    .sort(
      (first, second) =>
        new Date(second.files?.created_at ?? second.created_at ?? 0).getTime() -
        new Date(first.files?.created_at ?? first.created_at ?? 0).getTime()
    )[0]
  if (!document) return null

  const file = document.files ?? document
  return {
    id: document.file_id ?? file.file_id ?? file.doc_id,
    name: file.file_name ?? "Reference document",
    size: file.file_size,
    type: file.mime_type,
  }
}

// Counts how many engagements / service requests reference each service, so the
// UI can tell "used" services (deactivate only) from unused ones (hard delete).
async function fetchUsageCounts() {
  const [engagementsResult, requestsResult] = await Promise.all([
    supabase.from("engagements").select("service_id"),
    supabase.from("service_requests").select("service_id"),
  ])
  if (engagementsResult.error) throw engagementsResult.error
  if (requestsResult.error) throw requestsResult.error

  const tally = (rows) => {
    const counts = new Map()
    for (const row of rows ?? []) {
      if (!row.service_id) continue
      counts.set(row.service_id, (counts.get(row.service_id) ?? 0) + 1)
    }
    return counts
  }

  return {
    engagementCounts: tally(engagementsResult.data),
    requestCounts: tally(requestsResult.data),
  }
}

async function attachUsage(mappedRows) {
  const { engagementCounts, requestCounts } = await fetchUsageCounts()
  return mappedRows.map((service) => ({
    ...service,
    activeEngagements: engagementCounts.get(service.id) ?? 0,
    serviceRequestCount: requestCounts.get(service.id) ?? 0,
  }))
}

// refactor: paginate 
async function getServices() {
  const { data, error } = await supabase
    .from("services")
    .select(`
      service_id, price, service_name, category, description,
      estimated_time, is_recurring, is_retainer_covered, status,
      template_tasks(
        template_id, title, has_reference, is_required,
        template_task_documents(file_id, files(file_name, mime_type, file_size, created_at))
      )
    `)
    
  if (error) throw error
  return attachUsage((data ?? []).map(mapServiceRow))
}

async function updateService(service) {
  const { data: serviceId, error } = await supabase.rpc('update_service_with_template_tasks', {
    p_service_id: service.id,
    p_price: service.basePrice,
    p_service_name: service.name,
    p_category: service.category,
    p_description: service.description,
    p_estimated_time: service.estimatedTime,
    p_is_recurring: service.isRecurring ?? false,
    p_is_retainer_covered: service.isRetainerCovered ?? false,
    p_status: service.status,
    p_tasks: service.workflowTasks.map((t) => ({
      template_id: t.id ?? null,
      title: t.name,
      has_reference: t.hasReferenceDocument,
      is_required: t.required,
    })),
  })
  if (error) throw error

  const { data: updated, error: fetchError } = await supabase
    .from("services")
    .select(`
      service_id, 
      price, 
      service_name, 
      category, 
      description,
      estimated_time, 
      is_recurring,
      is_retainer_covered,
      status,
      template_tasks(
        template_id, title, has_reference, is_required,
        template_task_documents(file_id, files(file_name, mime_type, file_size, created_at))
      )
    `)
    .eq("service_id", serviceId)
    .single()
    .order('template_id', { foreignTable: 'template_tasks' }) 
  if (fetchError) throw fetchError

  return attachUsage([mapServiceRow(updated)]).then(([service]) => service)
}

// to be refactor: just one fn if the frontend remove the inactive
async function updateServiceStatus({ id, status }) {
  const { data, error } = await supabase
    .from("services")
    .update({ status })
    .eq("service_id", id)
    .select(`
      service_id, 
      price, 
      service_name, 
      category, 
      description,
      estimated_time, 
      is_recurring, is_retainer_covered, status,
      template_tasks(
        template_id, title, has_reference, is_required,
        template_task_documents(file_id, files(file_name, mime_type, file_size, created_at))
      )
    `)
    .single()
    .order('template_id', { foreignTable: 'template_tasks' }) 
  if (error) throw error
  return mapServiceRow(data)
}

// Hard delete — only allowed by the backend when the service has never been
// used by an engagement or service request.
async function deleteService(id) {
  const { data: { session } } = await supabase.auth.getSession()
  const response = await fetch(`${apiBaseUrl}/services/${id}`, {
    method: "DELETE",
    headers: {
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || body.error || "Service deletion failed")
  }
  return id
}

async function createService(service) {
  const { data: { session } } = await supabase.auth.getSession()
  const response = await fetch(`${apiBaseUrl}/services/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({
      price: service.basePrice,
      serviceName: service.name,
      category: service.category,
      description: service.description,
      estimatedTime: service.estimatedTime,
      isRecurring: service.isRecurring ?? false,
      isRetainerCovered: service.isRetainerCovered ?? false,
      status: service.status,
      tasks: service.workflowTasks.map((t) => ({
        title: t.name,
        hasReference: t.hasReferenceDocument,
        isRequired: t.required,
      })),
    }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || body.error || "Service creation failed")
  }
  const { service: createdService } = await response.json()
  return mapServiceRow(createdService)
}


export { 
  getServices, 
  updateService, 
  updateServiceStatus, 
  createService, 
  deleteService 
}