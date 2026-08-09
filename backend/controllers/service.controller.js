import { supabaseAdmin } from "../config/supabaseAdmin.js";

async function createService(req, res) {
  const { price, serviceName, category, description, estimatedTime, isRecurring, isActive, tasks } = req.body;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ message: 'At least one task is required.' });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('create_service_with_template_tasks', {
      p_price: price,
      p_service_name: serviceName,
      p_category: category,
      p_description: description,
      p_estimated_time: estimatedTime,
      p_is_recurring: isRecurring,
      p_is_active: isActive,
      p_tasks: tasks.map(t => ({
        title: t.title,
        has_reference: t.hasReference,
        is_required: t.isRequired
      }))
    });
    if (error) throw new Error(error.message);

    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }

}

export{
  createService
}