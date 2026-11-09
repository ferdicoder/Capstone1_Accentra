import { uploadFile, deleteFileVersion, downloadFile } from '../services/b2Services.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

const PAYMENT_METHODS = new Set(['gcash', 'bank_transfer']);

export async function submitPayment(req, res) {
  const { billingId } = req.params;
  const { paymentMethod, uploadedBy } = req.body ?? {};

  if (!req.file) {
    return res.status(400).json({ error: 'No payment proof file was provided' });
  }
  if (!PAYMENT_METHODS.has(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  let payment;
  let b2Result;
  let storageKey;
  let fileId;

  try {
    const { data: billing, error: billingError } = await supabaseAdmin
      .from('billings')
      .select('billing_id, total_amount, status')
      .eq('billing_id', billingId)
      .single();

    if (billingError) throw billingError;
    if (!billing || !['pending', 'overdue', 'for resubmission'].includes(billing.status)) {
      return res.status(400).json({ error: 'This billing record is not available for payment' });
    }

    const { data, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        billing_id: billingId,
        amount: billing.total_amount,
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;
    payment = data;
    storageKey = `payments/${billingId}/${payment.payment_id}-${Date.now()}-${req.file.originalname}`;
    b2Result = await uploadFile(req.file.buffer, storageKey, req.file.mimetype);

    // Two-step insert: `files` metadata first, then the payment_proofs link.
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .insert({
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        storage_key: storageKey,
        b2_file_id: b2Result.fileId,
        file_size: req.file.size,
        uploaded_by: uploadedBy || null,
      })
      .select()
      .single();
    if (fileError) throw fileError;
    fileId = file.file_id;

    const { error: documentError } = await supabaseAdmin
      .from('payment_proofs')
      .insert({
        file_id: fileId,
        payment_id: payment.payment_id,
      });

    if (documentError) throw documentError;

    // A submitted proof always moves the billing into review.
    const { error: billingUpdateError } = await supabaseAdmin
      .from('billings')
      .update({ status: 'for verification', remark: null })
      .eq('billing_id', billingId);
    if (billingUpdateError) throw billingUpdateError;

    const { data: updatedPayment, error: updateError } = await supabaseAdmin
      .from('payments')
      .select()
      .eq('payment_id', payment.payment_id)
      .single();

    if (updateError) throw updateError;
    return res.status(201).json(updatedPayment);
  } catch (err) {
    console.error('Payment submission failed:', err);

    // Drop the `files` row first — it cascades to payment_proofs (and the
    // payment row below cascades to it too if the proof link was written).
    if (fileId) {
      const { error: fileDeleteError } = await supabaseAdmin
        .from('files')
        .delete()
        .eq('file_id', fileId);
      if (fileDeleteError) console.error('files cleanup failed:', fileDeleteError);
    }
    if (b2Result && storageKey) {
      try {
        await deleteFileVersion(storageKey, b2Result.fileId);
      } catch (cleanupError) {
        console.error('B2 cleanup also failed — orphaned file:', storageKey, cleanupError);
      }
    }
    if (payment?.payment_id) {
      const { error: deleteError } = await supabaseAdmin
        .from('payments')
        .delete()
        .eq('payment_id', payment.payment_id);
      if (deleteError) console.error('Payment cleanup failed:', deleteError);
    }

    return res.status(500).json({ error: 'Could not submit payment proof' });
  }
}

export async function downloadPaymentProof(req, res) {
  const { paymentId } = req.params;

  try {
    const { data: proofs, error } = await supabaseAdmin
      .from('payment_proofs')
      .select('file_id, payment_id, files(file_name, mime_type, storage_key, created_at)')
      .eq('payment_id', paymentId);

    if (error) throw error;
    // Newest proof wins — the junction table has no created_at of its own.
    const latest = [...(proofs ?? [])].sort(
      (first, second) =>
        new Date(second.files?.created_at ?? 0).getTime() -
        new Date(first.files?.created_at ?? 0).getTime()
    )[0];
    if (!latest?.files) {
      return res.status(404).json({ error: 'Payment proof not found' });
    }

    const fileBuffer = await downloadFile(latest.files.storage_key);
    res.setHeader('Content-Type', latest.files.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(latest.files.file_name)}"`);
    return res.send(Buffer.from(fileBuffer));
  } catch (err) {
    console.error('Payment proof download failed:', err);
    return res.status(500).json({ error: 'Could not retrieve payment proof' });
  }
}
