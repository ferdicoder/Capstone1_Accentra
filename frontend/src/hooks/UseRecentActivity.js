// TODO (Ced): replace this stub with the real endpoint, e.g.
//   GET /api/activity?limit=10  (newest first, firm-wide)
// Each entry should look like:
//   { id, type, actorName, message, createdAt }
// `type` is one of the keys in lib/activity-log.js. Until then the Admin
// dashboard shows the empty state for Recent Activity.
export function useFetchRecentActivity() {
  return { data: [], isLoading: false, error: null }
}