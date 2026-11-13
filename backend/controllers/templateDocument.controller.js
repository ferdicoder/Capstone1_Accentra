import { uploadFile, deleteFileVersion } from '../services/b2Services.js';
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

  // Two-step insert: metadata into `files`, then the template_task_documents
  // link. On failure, drop the `files` row (cascades any link) and the B2
  // object so nothing is left orphaned.
  let fileId;
  try {
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .insert({
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        storage_key: storageKey,
        b2_file_id: b2Result.fileId,
        file_size: req.file.size,
        uploaded_by: req.user?.id ?? null,
      })
      .select()
      .single();
    if (fileError) throw fileError;
    fileId = file.file_id;

    const { data, error } = await supabaseAdmin
      .from('template_task_documents')
      .insert({
        file_id: fileId,
        template_task_id: templateTaskId,
      })
      .select('file_id, template_task_id, files(file_id, file_name, mime_type, file_size, created_at)')
      .single();
    if (error) throw error;

    // Flatten back to the flat row shape the frontend already consumes.
    return res.status(201).json({
      file_id: data.file_id,
      template_task_id: data.template_task_id,
      ...data.files,
    });
  } catch (err) {
    console.error('DB insert failed, rolling back B2 upload:', err);
    if (fileId) {
      try {
        const { error: cleanupError } = await supabaseAdmin
          .from('files')
          .delete()
          .eq('file_id', fileId);
        if (cleanupError) throw cleanupError;
      } catch (cleanupErr) {
        console.error('files row cleanup also failed:', fileId, cleanupErr);
      }
    }
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
