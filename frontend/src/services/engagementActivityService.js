import { supabase } from '../config/supabase.js';

/**
 * Table assumption: "engagement_activity" with at least these columns:
 *   id            uuid, primary key
 *   engagement_id uuid/text, foreign key -> engagements.id
 *   type          text   (e.g. "Documents Submitted")
 *   message       text   (e.g. "3 of 5 submitted")
 *   actor         text   (who performed the action, optional)
 *   created_at    timestamptz, default now()
 *
 * Adjust the table/column names below to match your actual schema —
 * these are guesses based on the shape used in ClientEngagementDetailPage.jsx.
 */
const TABLE = 'engagement_activity';

/**
 * Fetch the full activity/audit log for one engagement, newest first.
 */
async function getEngagementActivity(engagementId) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return { data, error: null };
  } catch (err) {
    console.error(err);
    return { data: null, error: err.message };
  }
}

/**
 * Append a new activity/audit log entry.
 *
 * @param {string} engagementId
 * @param {{ type: string, message?: string, actor?: string }} entry
 */
async function postEngagementActivity(engagementId, entry) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        engagement_id: engagementId,
        type: entry.type,
        message: entry.message ?? null,
        actor: entry.actor ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return { data, error: null };
  } catch (err) {
    console.error(err);
    return { data: null, error: err.message };
  }
}

/**
 * Delete a single activity/audit log entry.
 *
 * Compliance note (same as before): for a CPA firm, activity logs are
 * usually meant to be an audit trail. A hard delete via Supabase's
 * `.delete()` removes the row permanently with no history that it ever
 * existed. If that's not what you want, consider a soft delete instead —
 * add a `deleted_at` column and use `.update({ deleted_at: new Date() })`
 * here rather than `.delete()`, then filter `deleted_at is null` in
 * getEngagementActivity above. Confirm which approach your team wants
 * before wiring the delete button up to anything in the UI.
 */
async function deleteEngagementActivity(engagementId, logId) {
  try {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', logId)
      .eq('engagement_id', engagementId);

    if (error) throw new Error(error.message);

    return { error: null };
  } catch (err) {
    console.error(err);
    return { error: err.message };
  }
}

export {
  getEngagementActivity,
  postEngagementActivity,
  deleteEngagementActivity,
};