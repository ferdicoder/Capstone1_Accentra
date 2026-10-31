import { uploadFile, deleteFileVersion, downloadFile } from '../services/b2Services.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

const deliverableSelect = `
  deliverable_doc_id, engagment_id, file_name, mime_type, storage_key,
  b2_file_id, file_size, uploaded_by, created_at,
  uploader:users!deliverable_documents_uploaded_by_fkey(user_id, first_name, last_name)
`;

function mapDeliverable(row) {
  const uploader = row.uploader;
  return {
    id: row.deliverable_doc_id,
    name: row.file_name,
    fileType: row.mime_type,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    uploadedBy: uploader
      ? [uploader.first_name, uploader.last_name].filter(Boolean).join(' ')
      : '—',
    uploadedDate: row.created_at,
    downloadUrl: `/documents/deliverables/${row.deliverable_doc_id}/download`,
  };
}

async function getEngagement(engagementId) {
  const { data, error } = await supabaseAdmin
    .from('engagements')
    .select('engagement_id')
    .eq('engagement_id', engagementId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getEngagementDeliverables(req, res) {
  const { engagementId } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('deliverable_documents')
      .select(deliverableSelect)
      .eq('engagment_id', engagementId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json((data ?? []).map(mapDeliverable));
  } catch (err) {
    console.error('Deliverables fetch failed:', err);
    return res.status(500).json({ error: 'Could not retrieve deliverables' });
  }
}

export async function uploadEngagementDeliverable(req, res) {
  const { engagementId } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'No deliverable file was provided' });
  }

  let engagement;
  try {
    engagement = await getEngagement(engagementId);
  } catch (err) {
    console.error('Engagement lookup failed:', err);
    return res.status(500).json({ error: 'Could not verify engagement' });
  }
  if (!engagement) return res.status(404).json({ error: 'Engagement not found' });

  const storageKey = `deliverables/${engagementId}/${Date.now()}-${req.file.originalname}`;
  let b2Result;
  try {
    b2Result = await uploadFile(req.file.buffer, storageKey, req.file.mimetype);
  } catch (err) {
    console.error('B2 deliverable upload failed:', err);
    return res.status(500).json({ error: 'File upload failed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('deliverable_documents')
      .insert({
        engagment_id: engagementId,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        storage_key: storageKey,
        b2_file_id: b2Result.fileId,
        file_size: req.file.size,
        uploaded_by: req.user.id,
      })
      .select(deliverableSelect)
      .single();
    if (error) throw error;
    return res.status(201).json(mapDeliverable(data));
  } catch (err) {
    console.error('Deliverable DB insert failed, rolling back B2 upload:', err);
    try {
      await deleteFileVersion(storageKey, b2Result.fileId);
    } catch (cleanupErr) {
      console.error('B2 cleanup also failed — orphaned file:', storageKey, cleanupErr);
    }
    return res.status(500).json({ error: 'Could not save deliverable record' });
  }
}

export async function downloadEngagementDeliverable(req, res) {
  const { deliverableId } = req.params;

  try {
    const { data: doc, error } = await supabaseAdmin
      .from('deliverable_documents')
      .select('file_name, mime_type, storage_key')
      .eq('deliverable_doc_id', deliverableId)
      .maybeSingle();
    if (error) throw error;
    if (!doc) return res.status(404).json({ error: 'Deliverable not found' });

    const fileBuffer = await downloadFile(doc.storage_key);
    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.file_name)}`
    );
    return res.send(Buffer.from(fileBuffer));
  } catch (err) {
    console.error('Deliverable download failed:', err);
    return res.status(500).json({ error: 'Could not retrieve deliverable' });
  }
}

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

const referenceSelect = `
  doc_id, engagement_task_id, file_name, mime_type, storage_key,
  b2_file_id, file_size, uploaded_by, created_at
`;

export async function uploadEngagementTaskReference(req, res) {
  const { engagementTaskId } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'No reference document was provided' });
  }

  let engagementTask;
  try {
    const { data, error } = await supabaseAdmin
      .from('engagement_tasks')
      .select('engagement_task_id')
      .eq('engagement_task_id', engagementTaskId)
      .maybeSingle();
    if (error) throw error;
    engagementTask = data;
  } catch (err) {
    console.error('Engagement task lookup failed:', err);
    return res.status(500).json({ error: 'Could not verify engagement task' });
  }
  if (!engagementTask) return res.status(404).json({ error: 'Engagement task not found' });

  const storageKey = `engagement-references/${engagementTaskId}/${Date.now()}-${req.file.originalname}`;

  let b2Result;
  try {
    b2Result = await uploadFile(req.file.buffer, storageKey, req.file.mimetype);
  } catch (err) {
    console.error('B2 reference upload failed:', err);
    return res.status(500).json({ error: 'File upload failed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('engagement_task_documents')
      .insert({
        engagement_task_id: engagementTaskId,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        storage_key: storageKey,
        b2_file_id: b2Result.fileId,
        file_size: req.file.size,
        uploaded_by: req.user?.id ?? null,
      })
      .select(referenceSelect)
      .single();
    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    console.error('DB insert failed, rolling back B2 upload:', err);
    try {
      await deleteFileVersion(storageKey, b2Result.fileId);
    } catch (cleanupErr) {
      console.error('B2 cleanup also failed — orphaned file:', storageKey, cleanupErr);
    }
    return res.status(500).json({ error: 'Could not save reference document record' });
  }
}

export async function downloadEngagementTaskReference(req, res) {
  const { docId } = req.params;

  try {
    const { data: doc, error } = await supabaseAdmin
      .from('engagement_task_documents')
      .select('file_name, mime_type, storage_key')
      .eq('doc_id', docId)
      .single();
    if (error) throw error;
    if (!doc) return res.status(404).json({ error: 'Reference document not found' });

    const fileBuffer = await downloadFile(doc.storage_key);

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name)}"`);
    return res.send(Buffer.from(fileBuffer));
  } catch (err) {
    console.error('Reference download failed:', err);
    return res.status(500).json({ error: 'Could not retrieve reference document' });
  }
}

export async function deleteEngagementTaskReference(req, res) {
  const { docId } = req.params;

  try {
    const { data: doc, error } = await supabaseAdmin
      .from('engagement_task_documents')
      .select('storage_key, b2_file_id')
      .eq('doc_id', docId)
      .single();
    if (error) throw error;
    if (!doc) return res.status(404).json({ error: 'Reference document not found' });

    await deleteFileVersion(doc.storage_key, doc.b2_file_id);

    const { error: deleteError } = await supabaseAdmin
      .from('engagement_task_documents')
      .delete()
      .eq('doc_id', docId);
    if (deleteError) throw deleteError;

    return res.sendStatus(204);
  } catch (err) {
    console.error('Reference delete failed:', err);
    return res.status(500).json({ error: 'Could not delete reference document' });
  }
}