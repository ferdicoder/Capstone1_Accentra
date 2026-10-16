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

  try {
    const { data: billing, error: billingError } = await supabaseAdmin
      .from('billings')
      .select('billing_id, total_amount, status')
      .eq('billing_id', billingId)
      .single();

    if (billingError) throw billingError;
    if (!billing || !['pending', 'overdue'].includes(billing.status)) {
      return res.status(400).json({ error: 'This billing record is not available for payment' });
    }

    const { data, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        billing_id: billingId,
        amount: billing.total_amount,
        payment_method: paymentMethod,
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) throw paymentError;
    payment = data;
    storageKey = `payments/${billingId}/${payment.payment_id}-${Date.now()}-${req.file.originalname}`;
    b2Result = await uploadFile(req.file.buffer, storageKey, req.file.mimetype);

    const { error: documentError } = await supabaseAdmin
      .from('payment_documents')
      .insert({
        payment_id: payment.payment_id,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        storage_key: storageKey,
        b2_file_id: b2Result.fileId,
        file_size: req.file.size,
        uploaded_by: uploadedBy || null,
      });

    if (documentError) throw documentError;

    const { data: updatedPayment, error: updateError } = await supabaseAdmin
      .from('payments')
      .select()
      .eq('payment_id', payment.payment_id)
      .single();

    if (updateError) throw updateError;
    return res.status(201).json(updatedPayment);
  } catch (err) {
    console.error('Payment submission failed:', err);

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
    const { data: document, error } = await supabaseAdmin
      .from('payment_documents')
      .select('file_name, mime_type, storage_key')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) throw error;
    if (!document) {
      return res.status(404).json({ error: 'Payment proof not found' });
    }

    const fileBuffer = await downloadFile(document.storage_key);
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.file_name)}"`);
    return res.send(Buffer.from(fileBuffer));
  } catch (err) {
    console.error('Payment proof download failed:', err);
    return res.status(500).json({ error: 'Could not retrieve payment proof' });
  }
}
