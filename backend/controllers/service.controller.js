import { supabaseAdmin } from "../config/supabaseAdmin.js";

async function createService(req, res) {
  const { price, serviceName, category, description, estimatedTime, isRecurring, status, tasks } = req.body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ message: 'At least one task is required.' });
  }

  try {
    const { data: serviceId, error } = await supabaseAdmin.rpc('create_service_with_template_tasks', {
      p_price: price,
      p_service_name: serviceName,
      p_category: category,
      p_description: description,
      p_estimated_time: estimatedTime,
      p_is_recurring: isRecurring,
      p_status: status,
      p_tasks: tasks.map(t => ({
        title: t.title,
        has_reference: t.hasReference,
        is_required: t.isRequired
      }))
    });
    if (error) throw new Error(error.message);

    // refetch whole row 
    const { data: created, error: fetchError } = await supabaseAdmin
      .from('services')
      .select(`
        service_id, price, 
        service_name, 
        category, 
        description,
        estimated_time, 
        is_recurring, status,
        template_tasks(template_id, title, has_reference, is_required)
      `)
      .eq('service_id', serviceId)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    return res.status(201).json({ service: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

export {
  createService
}