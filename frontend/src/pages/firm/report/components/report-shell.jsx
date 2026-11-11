import { Download, FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { plural } from "../lib/utils"
import { SummaryGrid } from "./data-table"

export function ReportShell({
  title,
  description,
  loading,
  error,
  invalid,
  rowCount,
  hasFilters,
  onReset,
  onExport,
  onExportPdf,
  filters,
  summary,
  children,
}) {
  const blocked = loading || error || invalid || rowCount === 0
  const status = loading
    ? "Loading data…"
    : error
      ? "We couldn't load this data. Refresh the page and try again."
      : invalid
        ? "Fix the date range to export."
        : rowCount === 0
          ? "Nothing to export for these filters."
          : `${plural(rowCount, "row")} will be exported to CSV or shown in the PDF preview.`

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-background p-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>

      {filters && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filters}</div>}
      {summary && <SummaryGrid items={summary} />}
      {!loading && !error && children}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <p
          className={cn("text-xs", error || invalid ? "text-red-600" : "text-muted-foreground")}
          aria-live="polite"
        >
          {status}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              Reset filters
            </button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={blocked}
            onClick={onExportPdf}
            className="h-8 gap-1.5 rounded-lg"
          >
            <FileText className="size-4" aria-hidden="true" />
            Preview PDF
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={blocked}
            onClick={onExport}
            className="h-8 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>
    </section>
  )
}