import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { deleteFileByName, deleteFileVersion } from "../services/b2Services.js";

async function createService(req, res) {
  const {
    price,
    serviceName,
    category,
    description,
    estimatedTime,
    isRecurring,
    isRetainerCovered,
    status,
    tasks
  } = req.body;

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
      p_is_retainer_covered: isRetainerCovered,
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
      .eq('service_id', serviceId)
      .order('template_id', { foreignTable: 'template_tasks' })  
      .single();
    if (fetchError) throw new Error(fetchError.message);

    return res.status(201).json({ service: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

async function deleteService(req, res) {
  const { id } = req.params;

  try {
    // Prefetch B2 storage keys before the transactional delete removes the
    // rows (the RPC does guard + deletes atomically; see backend/sql/).
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('template_tasks')
      .select('template_id')
      .eq('service_id', id);
    if (tasksError) throw new Error(tasksError.message);

    const taskIds = (tasks ?? []).map((task) => task.template_id);
    const { data: documents, error: documentsError } = taskIds.length
      ? await supabaseAdmin
          .from('template_task_documents')
          .select('files(storage_key, b2_file_id)')
          .in('template_task_id', taskIds)
      : { data: [], error: null };
    if (documentsError) throw new Error(documentsError.message);

    const { data: serviceId, error } = await supabaseAdmin.rpc('delete_service_with_cleanup', {
      p_service_id: id,
    });
    if (error) {
      const message = error.message ?? '';
      if (/service not found/i.test(message)) {
        return res.status(404).json({ message: 'Service not found.' });
      }
      if (/referenced by/i.test(message)) {
        return res.status(409).json({ message });
      }
      // A reference from a table the guard doesn't check aborts the RPC's
      // transaction — treat it the same as the usage guard.
      if (/violates foreign key constraint/i.test(message)) {
        return res.status(409).json({
          message: 'This service is still referenced by an engagement or service request and cannot be deleted.',
        });
      }
      throw new Error(message);
    }

    // Best-effort B2 cleanup — the DB rows are already gone, so a failed file
    // delete must not fail the request (the file would just be orphaned).
    await Promise.all(
      (documents ?? []).map(async (document) => {
        const file = document.files;
        if (!file?.storage_key) return;
        try {
          if (file.b2_file_id) {
            await deleteFileVersion(file.storage_key, file.b2_file_id);
          } else {
            await deleteFileByName(file.storage_key);
          }
        } catch (cleanupErr) {
          console.error('B2 cleanup failed for orphaned template file:', file.storage_key, cleanupErr);
        }
      })
    );

    return res.status(200).json({ serviceId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

export {
  createService,
  deleteService
}