import { uploadFile } from '../services/b2Upload.js';
import { deleteFileVersion } from '../services/b2Delete.js';
import { downloadFile } from '../services/b2Download.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

export async function uploadEngagementDocument(req, res) {
  const { engagementTaskId } = req.params;
  const { uploadedBy } = req.body ?? {};
  if (!req.file) {
    return res.status(400).json({ error: 'No document file was provided' });
  }
  const storageKey = `engagements/${engagementTaskId}/${Date.now()}-${req.file.originalname}`;

  let b2Result;
  let documentId;
  try {
    b2Result = await uploadFile(req.file.buffer, storageKey, req.file.mimetype);
  } catch (err) {
    console.error('B2 upload failed:', err);
    return res.status(500).json({ error: 'File upload failed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('engagement_documents')
      .insert({
        engagement_task_id: engagementTaskId,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        storage_key: storageKey,
        b2_file_id: b2Result.fileId,
        file_size: req.file.size,
        uploaded_by: uploadedBy || null,
      })
      .select()
      .single();

    if (error) throw error;
    documentId = data.doc_id;

    return res.status(201).json(data);
  } catch (err) {
    console.error('DB insert failed, rolling back B2 upload:', err);
    try {
      await deleteFileVersion(storageKey, b2Result.fileId);
    } catch (cleanupErr) {
      console.error('B2 cleanup also failed — orphaned file:', storageKey, cleanupErr);
    }
    if (documentId) {
      await supabaseAdmin.from('engagement_documents').delete().eq('doc_id', documentId);
    }
    return res.status(500).json({ error: 'Could not save document record' });
  }
}

export async function downloadEngagementDocument(req, res) {
  const { docId } = req.params;

  try {
    const { data: doc, error } = await supabaseAdmin
      .from('engagement_documents')
      .select('file_name, mime_type, storage_key')
      .eq('doc_id', docId)
      .single();
    if (error) throw error;
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const fileBuffer = await downloadFile(doc.storage_key);

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name)}"`);
    return res.send(Buffer.from(fileBuffer));
  } catch (err) {
    console.error('Download failed:', err);
    return res.status(500).json({ error: 'Could not retrieve document' });
  }
}

export async function deleteEngagementDocument(req, res) {
  const { docId } = req.params;

  try {
    const { data: doc, error } = await supabaseAdmin
      .from('engagement_documents')
      .select('storage_key, b2_file_id')
      .eq('doc_id', docId)
      .single();
    if (error) throw error;
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await deleteFileVersion(doc.storage_key, doc.b2_file_id);

    const { error: deleteError } = await supabaseAdmin.from('engagement_documents').delete().eq('doc_id', docId);
    if (deleteError) throw deleteError;

    return res.sendStatus(204);
  } catch (err) {
    console.error('Delete failed:', err);
    return res.status(500).json({ error: 'Could not delete document' });
  }
}