import { useCallback, useEffect, useState } from "react"
import { Download, X } from "lucide-react"

import { PageNotFound } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { downloadCsv, toCsv } from "@/lib/csv-export"
import { authStore } from "@/store/authStore"

import { DataTable } from "./components/data-table"
import { DateRange } from "./components/date-range"
import { SearchField, SelectField } from "./components/form-fields"
import { ReportShell } from "./components/report-shell"
import { ReportTabs } from "./components/report-tabs"
import {
  billingColumns,
  clientListColumns,
  engagementColumns,
  summaryColumns,
} from "./lib/columns"
import {
  BILLING_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COVERAGE_OPTIONS,
  ENGAGEMENT_BILLING_OPTIONS, // NEW constant
  INITIAL_FILTERS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "./lib/constants"
import { logReportExport } from "./lib/log-report-export" // NEW file
import { useReportData } from "./lib/use-report-data"
import {
  buildPdf,
  fileStamp,
  isDefault,
  plural,
  rangeError,
  sectionsCsv,
  summaryPdfColumns,
} from "./lib/utils"

function ReportsContent() {
  const [view, setView] = useState("engagements")
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [notice, setNotice] = useState("")
  // { title, slug, url, report, rowCount } for the PDF preview
  const [preview, setPreview] = useState(null)

  usePageMeta({ title: "Reports", breadcrumbs: [] })

  const f = filters
  const {
    status,
    clientOptions,
    userOptions,
    clientStatusOptions,
    engagementStatusOptions,
    serviceOptions,
    engagementResult,
    engagementSummary,
    clientResult,
    billingResult,
    billingSummary,
  } = useReportData(f, view) // pass `view` so only the active report loads

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(""), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  const closePreview = useCallback(
    () =>
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current.url)
        return null
      }),
    []
  )

  useEffect(() => {
    if (!preview) return
    const onKey = (e) => {
      if (e.key === "Escape") closePreview()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [preview, closePreview])

  const update = (report, patch) =>
    setFilters((current) => ({ ...current, [report]: { ...current[report], ...patch } }))
  const reset = (report) =>
    setFilters((current) => ({ ...current, [report]: INITIAL_FILTERS[report] }))

  // --- Export ----------------------------------------------------------------
  // Audit entry for every export. Non-blocking so a logging failure never
  // stops the download; the backend still records what it receives.
  const logExport = (report, format, rowCount) => {
    Promise.resolve(
      logReportExport({ report, format, rowCount, filters: filters[report] })
    ).catch(() => {})
  }

  const exportCsv = (report, slug, label, csv, rowCount) => {
    downloadCsv(`accentra-${slug}-${fileStamp()}.csv`, csv)
    logExport(report, "csv", rowCount)
    setNotice(`${label} exported (${plural(rowCount, "row")}).`)
  }

  const exportPdf = (report, slug, label, sections, rowCount) => {
    const url = URL.createObjectURL(buildPdf(label, sections))
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url)
      return { title: label, slug, url, report, rowCount }
    })
  }

  const shellProps = (key) => ({
    ...status[key],
    hasFilters: !isDefault(key, f[key]),
    onReset: () => reset(key),
  })

  // --- Views (3 operational reports) -----------------------------------------
  const renderView = () => {
    switch (view) {
      case "engagements": {
        const sections = [
          { title: "Summary", columns: summaryPdfColumns, rows: engagementSummary },
          { title: "Engagements", columns: engagementColumns, rows: engagementResult },
        ]
        return (
          <ReportShell
            title="Engagement Report"
            description="Engagements with their current status and billing status. Created and completion dates are separate filters."
            {...shellProps("engagements")}
            invalid={Boolean(rangeError(f.engagements.created) || rangeError(f.engagements.completed))}
            rowCount={engagementResult.length}
            summary={engagementSummary}
            onExport={() =>
              exportCsv(
                "engagements",
                "engagement-report",
                "Engagement Report",
                sectionsCsv([
                  { title: "Summary", columns: summaryColumns, rows: engagementSummary },
                  { title: "Engagements", columns: engagementColumns, rows: engagementResult },
                ]),
                engagementResult.length
              )
            }
            onExportPdf={() =>
              exportPdf("engagements", "engagement-report", "Engagement Report", sections, engagementResult.length)
            }
            filters={
              <>
                <DateRange label="Date created" value={f.engagements.created} onChange={(created) => update("engagements", { created })} />
                <DateRange label="Completion date" value={f.engagements.completed} onChange={(completed) => update("engagements", { completed })} />
                <SelectField label="Status" value={f.engagements.status} onChange={(status) => update("engagements", { status })} options={engagementStatusOptions} allLabel="All statuses" />
                <SelectField label="Billing status" value={f.engagements.billing} onChange={(billing) => update("engagements", { billing })} options={ENGAGEMENT_BILLING_OPTIONS} allLabel="All billing statuses" />
                <SelectField label="Service" value={f.engagements.service} onChange={(service) => update("engagements", { service })} options={serviceOptions} allLabel="All services" />
                <SelectField label="Client" value={f.engagements.client} onChange={(client) => update("engagements", { client })} options={clientOptions} allLabel="All clients" />
                <SelectField label="Assigned firm user" value={f.engagements.lead} onChange={(lead) => update("engagements", { lead })} options={userOptions} allLabel="All firm users" />
                <SelectField label="Coverage type" value={f.engagements.coverage} onChange={(coverage) => update("engagements", { coverage })} options={COVERAGE_OPTIONS} allLabel="All coverage types" />
              </>
            }
          >
            <DataTable columns={engagementColumns} rows={engagementResult} rowKey={(r, i) => `${r.e.id ?? r.id}-${i}`} />
          </ReportShell>
        )
      }

      case "billing": {
        // Billing Report = old Billing Summary + Payment Monitoring merged.
        const sections = [
          { title: "Summary", columns: summaryPdfColumns, rows: billingSummary },
          { title: "Billings", columns: billingColumns, rows: billingResult },
        ]
        return (
          <ReportShell
            title="Billing Report"
            description="Recorded bills, their statuses, and recorded payments. Unpaid and For Verification bills are never counted as paid. Billed totals leave out voided bills and are not revenue."
            {...shellProps("billing")}
            invalid={Boolean(rangeError(f.billing.range))}
            rowCount={billingResult.length}
            summary={billingSummary}
            onExport={() =>
              exportCsv(
                "billing",
                "billing-report",
                "Billing Report",
                sectionsCsv([
                  { title: "Summary", columns: summaryColumns, rows: billingSummary },
                  { title: "Billings", columns: billingColumns, rows: billingResult },
                ]),
                billingResult.length
              )
            }
            onExportPdf={() =>
              exportPdf("billing", "billing-report", "Billing Report", sections, billingResult.length)
            }
            filters={
              <>
                <DateRange label="Billing date" value={f.billing.range} onChange={(range) => update("billing", { range })} />
                <SelectField label="Billing type" value={f.billing.type} onChange={(type) => update("billing", { type })} options={BILLING_TYPE_OPTIONS} allLabel="All billing types" />
                <SelectField label="Billing status" value={f.billing.status} onChange={(status) => update("billing", { status })} options={PAYMENT_STATUS_OPTIONS} allLabel="All statuses" />
                <SelectField label="Payment method" value={f.billing.method} onChange={(method) => update("billing", { method })} options={PAYMENT_METHOD_OPTIONS} allLabel="All methods" />
                <SelectField label="Client" value={f.billing.client} onChange={(client) => update("billing", { client })} options={clientOptions} allLabel="All clients" />
              </>
            }
          >
            <DataTable columns={billingColumns} rows={billingResult} rowKey={(r, i) => `${r.id}-${i}`} />
          </ReportShell>
        )
      }

      case "clients":
        return (
          <ReportShell
            title="Client List"
            description="Registered clients, their classification, and Retainer Charge."
            {...shellProps("clients")}
            rowCount={clientResult.length}
            onExport={() =>
              exportCsv("clients", "client-list", "Client List", toCsv(clientListColumns, clientResult), clientResult.length)
            }
            onExportPdf={() =>
              exportPdf(
                "clients",
                "client-list",
                "Client List",
                [{ title: "Clients", columns: clientListColumns, rows: clientResult }],
                clientResult.length
              )
            }
            filters={
              <>
                <SearchField label="Search" value={f.clients.q} onChange={(q) => update("clients", { q })} placeholder="Client or business name" />
                <SelectField label="Client type" value={f.clients.type} onChange={(type) => update("clients", { type })} options={CLIENT_TYPE_OPTIONS} allLabel="All client types" />
                <SelectField label="Account status" value={f.clients.status} onChange={(status) => update("clients", { status })} options={clientStatusOptions} allLabel="All statuses" />
              </>
            }
          >
            <DataTable columns={clientListColumns} rows={clientResult} rowKey={(c, i) => `${c.id}-${i}`} />
          </ReportShell>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-2 py-4 sm:px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        {notice && (
          <p
            role="status"
            className="mt-2 inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset"
          >
            {notice}
          </p>
        )}
      </div>

      <ReportTabs view={view} onChange={setView} />

      {renderView()}

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${preview.title} PDF preview`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePreview()
          }}
        >
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="mr-auto">
                <h2 className="text-sm font-semibold">{preview.title}</h2>
                <p className="text-xs text-muted-foreground">PDF preview</p>
              </div>
              <a
                href={preview.url}
                download={`accentra-${preview.slug}-${fileStamp()}.pdf`}
                onClick={() => {
                  logExport(preview.report, "pdf", preview.rowCount)
                  setNotice(`${preview.title} PDF downloaded (${plural(preview.rowCount, "row")}).`)
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
              >
                <Download className="size-3.5" aria-hidden="true" />
                Download PDF
              </a>
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close preview"
                className="flex size-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <iframe
              title={`${preview.title} PDF preview`}
              src={`${preview.url}#toolbar=0&navpanes=0`}
              className="h-full w-full flex-1 bg-muted/30"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Admin only. The backend must enforce this on every report endpoint too.
export default function ReportsPage() {
  const role = authStore((state) => state.role)

  if (role !== "admin") {
    return (
      <PageNotFound
        title="Not Available"
        message="Reports are available to Firm Admin accounts only."
        actionLabel="Back to Dashboard"
        actionHref="/admin/dashboard"
      />
    )
  }

  return <ReportsContent />
}