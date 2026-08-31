import { supabase } from "@/config/supabase"; 

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
    status: row.status ?? "deactivated",
    workflowTasks: tasks.map((t) => ({
      id: t.template_id,
      name: t.title ?? "",
      required: t.is_required ?? false,
      hasReferenceDocument: t.has_reference ?? false,
      referenceDocument: null,
    })),
  }
}

// refactor: paginate 
async function getServices() {
  const { data, error } = await supabase
    .from("services")
    .select(`
      service_id, price, service_name, category, description,
      estimated_time, is_recurring, status,
      template_tasks(template_id, title, has_reference, is_required)
    `)
    
  if (error) throw error
  return (data ?? []).map(mapServiceRow)
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
      status,
      template_tasks(template_id, title, has_reference, is_required)
    `)
    .eq("service_id", serviceId)
    .single()
    .order('template_id', { foreignTable: 'template_tasks' }) 
  if (fetchError) throw fetchError

  return mapServiceRow(updated)
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
      is_recurring, status,
      template_tasks(template_id, title, has_reference, is_required)
    `)
    .single()
    .order('template_id', { foreignTable: 'template_tasks' }) 
  if (error) throw error
  return mapServiceRow(data)
}
// Soft delete 
async function deleteService(id) {
  return updateServiceStatus({ id, status: "deactivated" })
}

async function createService(service) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/services/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      price: service.basePrice,
      serviceName: service.name,
      category: service.category,
      description: service.description,
      estimatedTime: service.estimatedTime,
      isRecurring: service.isRecurring ?? false,
      status: service.status,
      tasks: service.workflowTasks.map((t) => ({
        title: t.name,
        hasReference: t.hasReferenceDocument,
        isRequired: t.required,
      })),
    }),
  })
  if (!response.ok) throw new Error('Service creation failed')
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