import { uploadFile, deleteFileVersion, downloadFile } from '../services/b2Services.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

// Shared `files` columns plus the uploader display name. Junction tables
// (engagement_deliverables / engagement_task_submissions /
// engagement_task_references) only store the file_id FK — file metadata
// lives in `files`.
const fileColumns = `
  file_id, file_name, mime_type, storage_key, b2_file_id, file_size,
  uploaded_by, created_at,
  uploader:users!files_uploaded_by_fkey(user_id, first_name, last_name)
`;

function uploaderName(uploader) {
  return uploader ? [uploader.first_name, uploader.last_name].filter(Boolean).join(' ') : '—';
}

function fileCreatedAt(row) {
  return new Date(row?.files?.created_at ?? 0).getTime();
}

// Junction tables have no created_at of their own — order by the embedded
// file's created_at instead of relying on insert order.
function latestFileFirst(rows) {
  return [...(rows ?? [])].sort((first, second) => fileCreatedAt(second) - fileCreatedAt(first));
}

// Two-step insert: `files` row first, then the junction row that links it.
// Returns the inserted `files` row so callers can clean it up on failure.
async function insertFileRow({ fileName, mimeType, storageKey, b2FileId, fileSize, uploadedBy }) {
  const { data, error } = await supabaseAdmin
    .from('files')
    .insert({
      file_name: fileName,
      mime_type: mimeType,
      storage_key: storageKey,
      b2_file_id: b2FileId,
      file_size: fileSize,
      uploaded_by: uploadedBy ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Best-effort rollback for a failed upload: drop the (possibly orphaned)
// `files` row — which cascades to any junction row already written — then
// remove the B2 object. Never throws.
async function rollbackUpload({ fileId, storageKey, b2FileId }) {
  if (fileId) {
    try {
      const { error } = await supabaseAdmin.from('files').delete().eq('file_id', fileId);
      if (error) throw error;
    } catch (cleanupErr) {
      console.error('files row cleanup failed:', fileId, cleanupErr);
    }
  }
  if (storageKey && b2FileId) {
    try {
      await deleteFileVersion(storageKey, b2FileId);
    } catch (cleanupErr) {
      console.error('B2 cleanup also failed — orphaned file:', storageKey, cleanupErr);
    }
  }
}

// Deletes the B2 object first, then the junction row (the `files` row goes
// away via ON DELETE CASCADE). A B2 failure aborts before the junction delete,
// so the metadata survives for a retry.
async function deleteLinkedFile({ junctionTable, fileId, storageKey, b2FileId }) {
  if (storageKey && b2FileId) {
    await deleteFileVersion(storageKey, b2FileId);
  }
  const { error } = await supabaseAdmin.from(junctionTable).delete().eq('file_id', fileId);
  if (error) throw error;
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

async function getEngagementTask(engagementTaskId) {
  const { data, error } = await supabaseAdmin
    .from('engagement_tasks')
    .select('engagement_task_id, status')
    .eq('engagement_task_id', engagementTaskId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function mapDeliverable(row) {
  const file = row.files ?? {};
  return {
    id: row.file_id,
    name: file.file_name,
    fileType: file.mime_type,
    mimeType: file.mime_type,
    fileSize: file.file_size,
    uploadedBy: uploaderName(file.uploader),
    uploadedDate: file.created_at,
    downloadUrl: `/documents/deliverables/${row.file_id}/download`,
  };
}

export async function getEngagementDeliverables(req, res) {
  const { engagementId } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('engagement_deliverables')
      .select(`file_id, engagement_id, files(${fileColumns})`)
      .eq('engagement_id', engagementId);
    if (error) throw error;
    return res.json(latestFileFirst(data).map(mapDeliverable));
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

  let fileId;
  try {
    const file = await insertFileRow({
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      storageKey,
      b2FileId: b2Result.fileId,
      fileSize: req.file.size,
      uploadedBy: req.user?.id,
    });
    fileId = file.file_id;

    const { data, error } = await supabaseAdmin
      .from('engagement_deliverables')
      .insert({ file_id: fileId, engagement_id: engagementId })
      .select(`file_id, engagement_id, files(${fileColumns})`)
      .single();
    if (error) throw error;

    return res.status(201).json(mapDeliverable(data));
  } catch (err) {
    console.error('Deliverable DB insert failed, rolling back:', err);
    await rollbackUpload({ fileId, storageKey, b2FileId: b2Result.fileId });
    return res.status(500).json({ error: 'Could not save deliverable record' });
  }
}

export async function downloadEngagementDeliverable(req, res) {
  const { deliverableId } = req.params;

  try {
    const { data: doc, error } = await supabaseAdmin
      .from('engagement_deliverables')
      .select('file_id, files(file_name, mime_type, storage_key)')
      .eq('file_id', deliverableId)
      .maybeSingle();
    if (error) throw error;
    if (!doc?.files) return res.status(404).json({ error: 'Deliverable not found' });

    const fileBuffer = await downloadFile(doc.files.storage_key);
    res.setHeader('Content-Type', doc.files.mime_type || 'application/octet-stream');
    const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.files.file_name)}`
    );
    return res.send(Buffer.from(fileBuffer));
  } catch (err) {
    console.error('Deliverable download failed:', err);
    return res.status(500).json({ error: 'Could not retrieve deliverable' });
  }
}

export async function deleteEngagementDeliverable(req, res) {
  const { deliverableId } = req.params;

  try {
    const { data: doc, error } = await supabaseAdmin
      .from('engagement_deliverables')
      .select('file_id, files(storage_key, b2_file_id)')
      .eq('file_id', deliverableId)
      .maybeSingle();
    if (error) throw error;
    if (!doc?.files) return res.status(404).json({ error: 'Deliverable not found' });

    await deleteLinkedFile({
      junctionTable: 'engagement_deliverables',
      fileId: deliverableId,
      storageKey: doc.files.storage_key,
      b2FileId: doc.files.b2_file_id,
    });

    return res.sendStatus(204);
  } catch (err) {
    console.error('Deliverable delete failed:', err);
    return res.status(500).json({ error: 'Could not delete deliverable' });
  }
}

// Client uploads for an engagement task — stored as engagement_task_submissions.
// Flattens the junction + embedded `files` row into the flat shape the
// frontend's mapDocumentRow expects (file fields at the top level).
function flattenSubmission(row) {
  const file = row.files ?? {};
  return {
    file_id: row.file_id,
    engagement_task_id: row.engagement_task_id,
    review_status: row.review_status,
    remark: row.remark,
    file_name: file.file_name,
    mime_type: file.mime_type,
    file_size: file.file_size,
    created_at: file.created_at,
    uploaded_by: file.uploaded_by,
    uploader: file.uploader ?? null,
  };
}

const submissionSelect = `
  file_id, engagement_task_id, review_status, remark,
  files(${fileColumns})
`;

export async function uploadEngagementDocument(req, res) {
  const { engagementTaskId } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'No document file was provided' });
  }

  let engagementTask;
  try {
    engagementTask = await getEngagementTask(engagementTaskId);
  } catch (err) {
    console.error('Engagement task lookup failed:', err);
    return res.status(500).json({ error: 'Could not verify engagement task' });
  }
  if (!engagementTask) return res.status(404).json({ error: 'Engagement task not found' });

  const storageKey = `engagements/${engagementTaskId}/${Date.now()}-${req.file.originalname}`;

  let b2Result;
  try {
    b2Result = await uploadFile(req.file.buffer, storageKey, req.file.mimetype);
  } catch (err) {
    console.error('B2 upload failed:', err);
    return res.status(500).json({ error: 'File upload failed' });
  }

  let fileId;
  try {
    const file = await insertFileRow({
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      storageKey,
      b2FileId: b2Result.fileId,
      fileSize: req.file.size,
      uploadedBy: req.user?.id,
    });
    fileId = file.file_id;

    const { data, error } = await supabaseAdmin
      .from('engagement_task_submissions')
      .insert({ file_id: fileId, engagement_task_id: engagementTaskId })
      .select(submissionSelect)
      .single();
    if (error) throw error;

    // A saved submission means the requirement is now waiting on the firm.
    // Flip Missing / For Revision → For Review so the client's Documents tab
    // (which only shows files for locked statuses) and the firm's review list
    // pick the upload up after a refresh. For Review / Approved uploads are
    // left alone — the status is already correct (and multi-file batches hit
    // this path again with the status already flipped by the first file).
    if (['missing', 'for_revision'].includes(engagementTask.status)) {
      const { error: statusError } = await supabaseAdmin
        .from('engagement_tasks')
        .update({ status: 'for_review' })
        .eq('engagement_task_id', engagementTaskId)
        .eq('status', engagementTask.status);
      if (statusError) throw statusError;
    }

    return res.status(201).json(flattenSubmission(data));
  } catch (err) {
    console.error('DB insert failed, rolling back:', err);
    await rollbackUpload({ fileId, storageKey, b2FileId: b2Result.fileId });
    return res.status(500).json({ error: 'Could not save document record' });
  }
}

export async function downloadEngagementDocument(req, res) {
  const { docId } = req.params;

  try {
    const { data: doc, error } = await supabaseAdmin
      .from('engagement_task_submissions')
      .select('file_id, files(file_name, mime_type, storage_key)')
      .eq('file_id', docId)
      .maybeSingle();
    if (error) throw error;
    if (!doc?.files) return res.status(404).json({ error: 'Document not found' });

    const fileBuffer = await downloadFile(doc.files.storage_key);

    res.setHeader('Content-Type', doc.files.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.files.file_name)}"`);
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
      .from('engagement_task_submissions')
      .select('file_id, files(storage_key, b2_file_id)')
      .eq('file_id', docId)
      .maybeSingle();
    if (error) throw error;
    if (!doc?.files) return res.status(404).json({ error: 'Document not found' });

    await deleteLinkedFile({
      junctionTable: 'engagement_task_submissions',
      fileId: docId,
      storageKey: doc.files.storage_key,
      b2FileId: doc.files.b2_file_id,
    });

    return res.sendStatus(204);
  } catch (err) {
    console.error('Delete failed:', err);
    return res.status(500).json({ error: 'Could not delete document' });
  }
}

const referenceSelect = `
  file_id, engagement_task_id, files(${fileColumns})
`;

export async function uploadEngagementTaskReference(req, res) {
  const { engagementTaskId } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'No reference document was provided' });
  }

  let engagementTask;
  try {
    engagementTask = await getEngagementTask(engagementTaskId);
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

  let fileId;
  try {
    const file = await insertFileRow({
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      storageKey,
      b2FileId: b2Result.fileId,
      fileSize: req.file.size,
      uploadedBy: req.user?.id,
    });
    fileId = file.file_id;

    const { data, error } = await supabaseAdmin
      .from('engagement_task_references')
      .insert({ file_id: fileId, engagement_task_id: engagementTaskId })
      .select(referenceSelect)
      .single();
    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    console.error('DB insert failed, rolling back:', err);
    await rollbackUpload({ fileId, storageKey, b2FileId: b2Result.fileId });
    return res.status(500).json({ error: 'Could not save reference document record' });
  }
}

export async function downloadEngagementTaskReference(req, res) {
  const { docId } = req.params;

  try {
    const { data: doc, error } = await supabaseAdmin
      .from('engagement_task_references')
      .select('file_id, files(file_name, mime_type, storage_key)')
      .eq('file_id', docId)
      .maybeSingle();
    if (error) throw error;
    if (!doc?.files) return res.status(404).json({ error: 'Reference document not found' });

    const fileBuffer = await downloadFile(doc.files.storage_key);

    res.setHeader('Content-Type', doc.files.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.files.file_name)}"`);
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
      .from('engagement_task_references')
      .select('file_id, files(storage_key, b2_file_id)')
      .eq('file_id', docId)
      .maybeSingle();
    if (error) throw error;
    if (!doc?.files) return res.status(404).json({ error: 'Reference document not found' });

    await deleteLinkedFile({
      junctionTable: 'engagement_task_references',
      fileId: docId,
      storageKey: doc.files.storage_key,
      b2FileId: doc.files.b2_file_id,
    });

    return res.sendStatus(204);
  } catch (err) {
    console.error('Reference delete failed:', err);
    return res.status(500).json({ error: 'Could not delete reference document' });
  }
}

// Task titles are copied verbatim by the create_engagement RPCs, so a
// normalized comparison pairs engagement tasks back to their template tasks.
function normalizeTaskTitle(title) {
  return String(title ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

// The create_engagement / create_standalone_engagement RPCs copy task rows
// (including has_reference) from the service template but cannot touch B2, so
// the guide files are copied in here afterwards: template doc → new B2 object
// under engagement-references/… → new `files` row → engagement_task_references.
// A full copy (rather than sharing the template's file_id) keeps service
// delete/update and engagement-reference delete lifecycles independent.
// Idempotent: tasks that already have a reference are skipped.
export async function copyTemplateReferencesToEngagement(req, res) {
  const { engagementId } = req.params;

  let engagement;
  try {
    const { data, error } = await supabaseAdmin
      .from('engagements')
      .select('engagement_id, service_id')
      .eq('engagement_id', engagementId)
      .maybeSingle();
    if (error) throw error;
    engagement = data;
  } catch (err) {
    console.error('Engagement lookup failed:', err);
    return res.status(500).json({ error: 'Could not verify engagement' });
  }
  if (!engagement) return res.status(404).json({ error: 'Engagement not found' });
  if (!engagement.service_id) return res.json({ copied: 0, skipped: 0, failed: [] });

  try {
    const { data: templateTasks, error: templateError } = await supabaseAdmin
      .from('template_tasks')
      .select(
        `template_id, title,
         template_task_documents(file_id, files(file_name, mime_type, storage_key, file_size, created_at))`
      )
      .eq('service_id', engagement.service_id);
    if (templateError) throw templateError;

    const { data: engagementTasks, error: tasksError } = await supabaseAdmin
      .from('engagement_tasks')
      .select('engagement_task_id, title, has_reference')
      .eq('engagement_id', engagementId);
    if (tasksError) throw tasksError;

    // One doc per template task (the newest, matching what the service UI
    // shows), then pair engagement tasks back to them by title.
    const templateDocs = (templateTasks ?? []).flatMap((task) => {
      const doc = latestFileFirst(task.template_task_documents)[0];
      if (!doc?.files) return [];
      return [{ templateTaskId: task.template_id, title: task.title, file: doc.files }];
    });

    const referenceTasks = (engagementTasks ?? []).filter((task) => task.has_reference);
    const taskIds = (engagementTasks ?? []).map((task) => task.engagement_task_id);
    const { data: existingRefs, error: refsError } = taskIds.length
      ? await supabaseAdmin
          .from('engagement_task_references')
          .select('engagement_task_id')
          .in('engagement_task_id', taskIds)
      : { data: [] };
    if (refsError) throw refsError;
    const existingTaskIds = new Set((existingRefs ?? []).map((ref) => ref.engagement_task_id));

    const needsCopy = referenceTasks.filter((task) => !existingTaskIds.has(task.engagement_task_id));

    const docsByTitle = new Map();
    for (const doc of templateDocs) {
      const key = normalizeTaskTitle(doc.title);
      if (!docsByTitle.has(key)) docsByTitle.set(key, []);
      docsByTitle.get(key).push(doc);
    }

    const usedTemplateIds = new Set();
    const pairs = [];
    for (const task of needsCopy) {
      const queue = docsByTitle.get(normalizeTaskTitle(task.title)) ?? [];
      const doc = queue.find((candidate) => !usedTemplateIds.has(candidate.templateTaskId));
      if (doc) {
        usedTemplateIds.add(doc.templateTaskId);
        pairs.push([task, doc]);
      }
    }
    // Positional fallback for titles that no longer match exactly.
    const unmatched = needsCopy.filter((task) => !pairs.some(([paired]) => paired === task));
    const spareDocs = templateDocs.filter((doc) => !usedTemplateIds.has(doc.templateTaskId));
    unmatched.forEach((task, index) => {
      if (spareDocs[index]) pairs.push([task, spareDocs[index]]);
    });

    const summary = {
      copied: 0,
      skipped: referenceTasks.length - pairs.length,
      failed: [],
    };

    // Sequential on purpose: a handful of small files, and it keeps B2/DB
    // rollback logic simple per task.
    for (const [task, doc] of pairs) {
      const storageKey = `engagement-references/${task.engagement_task_id}/${Date.now()}-${doc.file.file_name}`;
      let b2Result;
      let fileId;
      try {
        const buffer = await downloadFile(doc.file.storage_key);
        b2Result = await uploadFile(buffer, storageKey, doc.file.mime_type);

        const file = await insertFileRow({
          fileName: doc.file.file_name,
          mimeType: doc.file.mime_type,
          storageKey,
          b2FileId: b2Result.fileId,
          fileSize: doc.file.file_size ?? buffer.length,
          uploadedBy: req.user?.id,
        });
        fileId = file.file_id;

        const { error } = await supabaseAdmin
          .from('engagement_task_references')
          .insert({ file_id: fileId, engagement_task_id: task.engagement_task_id });
        if (error) throw error;

        summary.copied += 1;
      } catch (err) {
        console.error(`Template reference copy failed for task "${task.title}":`, err);
        await rollbackUpload({ fileId, storageKey, b2FileId: b2Result?.fileId });
        summary.failed.push(task.title);
      }
    }

    return res.json(summary);
  } catch (err) {
    console.error('Template reference copy failed:', err);
    return res.status(500).json({ error: 'Could not copy template reference documents' });
  }
}
