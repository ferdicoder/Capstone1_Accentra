import { uploadFile } from '../services/b2Upload.js';
import { deleteFileVersion } from '../services/b2Delete.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

// TODO: lagay to sa services kasi andoon yung template task?
export async function uploadFileTemplate(req, res){
  const { templateTaskId } = req.params;
  const storageKey = `templates/${templateTaskId}/${Date.now()}-${req.file.originalname}`;

  let b2Result;
  try {
    // Upload to B2 
    b2Result = await uploadFile(req.file.buffer, storageKey, req.file.mimetype);
  } catch (err) {
    console.error('B2 upload failed:', err);
    return res.status(500).json({ error: 'File upload failed' });
  }

  try {
    // Insert the DB row
    const { data, error } = await supabaseAdmin
      .from('template_documents')
      .insert({
        template_task_id: templateTaskId,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        storage_key: storageKey,
        file_size: req.file.size
        // uploaded_by: req.user?.id, // assuming you have auth middleware setting req.user
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    console.error('DB insert failed, rolling back B2 upload:', err);
    // Compensate: remove the orphaned B2 object 
    // toast na lang sa FE to mwewhehwhe para ma reupload?
    try {
      await deleteFileVersion(storageKey, b2Result.fileId);
    } catch (cleanupErr) {
      // If cleanup itself fails, at least log it clearly — this file is now orphaned
      console.error('B2 cleanup also failed — orphaned file:', storageKey, cleanupErr);
    }
    return res.status(500).json({ error: 'Could not save document record' });
  }
}
