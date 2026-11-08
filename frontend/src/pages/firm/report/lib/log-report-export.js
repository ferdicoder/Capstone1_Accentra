import { authStore } from "@/store/authStore"

const API_URL = import.meta.env.VITE_API_URL ?? "" // TODO: use your existing API base URL
const ENDPOINT = `${API_URL}/api/audit/report-exports`

const REPORTS = ["engagements", "billing", "clients"]
const FORMATS = ["csv", "pdf"]

// Records that an export happened (who, which report, format, rows, filters).
// Never throws: logging must not stop the download.
export async function logReportExport({ report, format, rowCount, filters }) {
  if (!REPORTS.includes(report) || !FORMATS.includes(format)) return

  try {
    const { token } = authStore.getState() // TODO: match your auth store's token field
    await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        report,
        format,
        rowCount: Number.isInteger(rowCount) ? rowCount : 0,
        filters: filters ?? {},
      }),
    })
  } catch {
    // Intentionally ignored.
  }
} 