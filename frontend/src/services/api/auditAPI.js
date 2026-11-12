import { supabase } from "@/config/supabase";

const AUDIT_SELECT = "log_id, actor_id, action, entity_type, entity_id, details, created_at";

const REPORT_LABELS = {
  engagements: "Engagement",
  billing: "Billing",
  clients: "Client List",
};

const feeLabel = (value) =>
  value == null ? "none" : `₱${Number(value).toLocaleString("en-US")}`;

// Human-readable line under the title, built from the row's details jsonb.
function describeDetails(row) {
  const { action, details, entity_id: entityId } = row;
  const d = details ?? {};
  switch (action) {
    case "user_created":
      return d.role ? `Role assigned: ${d.role}` : null;
    case "user_role_changed":
      return d.from && d.to ? `Role changed from ${d.from} to ${d.to}` : null;
    case "password_changed":
      return d.first_login ? "First login — account activated" : "Password updated";
    case "client_retainer_changed": {
      const from = d.from ?? {};
      const to = d.to ?? {};
      const parts = [];
      if (from.type !== to.type) {
        parts.push(`Type: ${from.type ?? "—"} → ${to.type ?? "—"}`);
      }
      if (from.retainer_fee !== to.retainer_fee) {
        parts.push(`Fee: ${feeLabel(from.retainer_fee)} → ${feeLabel(to.retainer_fee)}`);
      }
      return parts.length ? parts.join(" · ") : null;
    }
    case "report_exported": {
      const name = REPORT_LABELS[entityId] ?? entityId ?? "Report";
      const format = d.format ? String(d.format).toUpperCase() : "";
      const rows = Number.isFinite(d.row_count) ? d.row_count : 0;
      return [name, format && `${format} · ${rows} row${rows === 1 ? "" : "s"}`]
        .filter(Boolean)
        .join(" · ");
    }
    default:
      return null;
  }
}

// audit_logs.actor_id references auth.users (not exposed to PostgREST), so
// actor display names are resolved with a second query against public.users.
function actorNameOf(row, actorNames) {
  if (!row.actor_id) return null;
  return actorNames.get(row.actor_id) ?? null;
}

export function mapAuditRow(row, actorNames) {
  return {
    id: row.log_id,
    type: row.action,
    actorName: actorNameOf(row, actorNames),
    message: describeDetails(row),
    createdAt: row.created_at,
  };
}

// Newest-first audit trail for the Admin dashboard Audit Logs panel.
export async function getRecentAuditLogs(limit = 50) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select(AUDIT_SELECT)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;

  const actorIds = [...new Set(data.map((row) => row.actor_id).filter(Boolean))];
  const actorNames = new Map();
  if (actorIds.length) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("user_id, first_name, last_name")
      .in("user_id", actorIds);
    if (usersError) throw usersError;
    users.forEach((user) => {
      const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
      actorNames.set(user.user_id, name || null);
    });
  }

  return data
    .map((row) => mapAuditRow(row, actorNames))
    .sort(
      (a, b) =>
        (Date.parse(b.createdAt ?? "") || 0) -
        (Date.parse(a.createdAt ?? "") || 0)
    );
}
