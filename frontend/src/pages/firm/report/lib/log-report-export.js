import { supabase } from "@/config/supabase"

const REPORTS = ["engagements", "billing", "clients"]
const FORMATS = ["csv", "pdf"]

// Records that an export happened (who, which report, format, rows, filters)
// via the log_report_export RPC, which forces actor_id = auth.uid().
// Never throws: logging must not stop the download.
export async function logReportExport({ report, format, rowCount, filters }) {
  if (!REPORTS.includes(report) || !FORMATS.includes(format)) return

  try {
    const { error } = await supabase.rpc("log_report_export", {
      p_report: report,
      p_format: format,
      p_row_count: Number.isInteger(rowCount) ? rowCount : 0,
      p_filters: filters ?? {},
    })
    if (error) console.error("report export log failed:", error.message)
  } catch {
    // Intentionally ignored.
  }
}
