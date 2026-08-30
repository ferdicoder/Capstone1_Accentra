import { supabase } from '../config/supabase.js';

/**
 * Table assumption: "engagement_deliverables" with at least these columns:
 *   id            uuid, primary key
 *   engagement_id uuid/text, foreign key -> engagements.id
 *   file_name     text
 *   file_path     text   (path inside the Supabase Storage bucket)
 *   file_size     bigint (bytes, optional)
 *   uploaded_by   text   (optional)
 *   created_at    timestamptz, default now()
 *
 * Storage bucket assumption: "deliverables"
 *
 * Adjust the table/column/bucket names below to match your actual schema —
 * these are guesses based on how S4-14/S4-15 describe the firm-side upload
 * (POST/DELETE /engagements/:id/deliverables + Supabase Storage).
 */
const TABLE = 'engagement_deliverables';
const BUCKET = 'deliverables';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 10; // 10 minutes

/**
 * Fetch all deliverables for one engagement, each with a fresh signed
 * download URL. Client-side only — read access, per S4-16's DoD
 * ("Client can see and download... via signed URL"). Uploading/deleting
 * deliverables is S4-14/S4-15, firm-side only.
 */
async function getEngagementDeliverables(engagementId) {
  try {
    const { data: rows, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return { data: [], error: null };

    // Attach a signed URL to each row so the UI can just render a
    // download link directly, without a second round trip per click.
    const withSignedUrls = await Promise.all(
      rows.map(async (row) => {
        const { data: signed, error: signError } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(row.file_path, SIGNED_URL_EXPIRY_SECONDS);

        if (signError) {
          console.error(
            `Failed to sign URL for ${row.file_name}:`,
            signError.message
          );
          return { ...row, signedUrl: null };
        }

        return { ...row, signedUrl: signed.signedUrl };
      })
    );

    return { data: withSignedUrls, error: null };
  } catch (err) {
    console.error(err);
    return { data: null, error: err.message };
  }
}

export { getEngagementDeliverables };