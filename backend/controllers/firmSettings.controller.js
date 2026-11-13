import { uploadFile, deleteFileVersion, downloadFile } from '../services/b2Services.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

// POST /api/v1/firm-settings/logo — admin only.
// Uploads the new logo to B2 and returns the keys; the caller persists them
// on firm_settings, then calls DELETE with the previous keys to clean up.
export async function uploadFirmLogo(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No logo file provided' });
  }

  const storageKey = `firm/logo/${Date.now()}-${req.file.originalname}`;

  try {
    const b2Result = await uploadFile(req.file.buffer, storageKey, req.file.mimetype);
    return res.status(201).json({
      storageKey,
      b2FileId: b2Result.fileId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    console.error('B2 logo upload failed:', err);
    return res.status(500).json({ error: 'Logo upload failed' });
  }
}

// DELETE /api/v1/firm-settings/logo?storageKey=&fileId= — admin only.
// Called after the firm_settings row has been repointed to the new (or no)
// logo, so it cleans up the superseded file. Only keys under firm/logo/ can
// be targeted, keeping this endpoint from touching other B2 documents.
export async function deleteFirmLogo(req, res) {
  const { storageKey, fileId } = req.query;
  if (!storageKey || !fileId) {
    return res.status(400).json({ error: 'storageKey and fileId are required' });
  }
  if (!storageKey.startsWith('firm/logo/')) {
    return res.status(403).json({ error: 'Not a firm logo key' });
  }

  try {
    await deleteFileVersion(storageKey, fileId);
    return res.status(204).end();
  } catch (err) {
    console.error('B2 logo delete failed:', err);
    return res.status(500).json({ error: 'Could not delete logo' });
  }
}

// GET /api/v1/firm-settings/logo — public (landing page / sidebar <img src>).
// Streams the current logo bytes with the stored content type.
export async function getFirmLogo(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('firm_settings')
      .select('logo_storage_key, logo_mime_type')
      .eq('singleton', true)
      .maybeSingle();
    if (error) throw error;

    if (!data?.logo_storage_key) {
      return res.status(404).json({ error: 'No logo set' });
    }

    const buffer = await downloadFile(data.logo_storage_key);
    res.set('Content-Type', data.logo_mime_type || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=300');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('B2 logo download failed:', err);
    return res.status(404).json({ error: 'Logo not found' });
  }
}
