import { useQuery } from "@tanstack/react-query";
import { getRecentAuditLogs } from "@/services/api/auditAPI";
import { queryKeys } from "@/config/queryKeys";

// Firm-wide audit trail (audit_logs), newest first. Entries look like:
//   { id, type, actorName, message, createdAt }
// `type` is one of the keys in lib/activity-log.js. Backed by the DB
// triggers in backend/sql/audit_logs_triggers.sql.
export function useFetchRecentActivity({ limit = 50 } = {}) {
  return useQuery({
    queryKey: queryKeys.auditLogs(limit),
    queryFn: () => getRecentAuditLogs(limit),
    staleTime: 1000 * 10,
  });
}
