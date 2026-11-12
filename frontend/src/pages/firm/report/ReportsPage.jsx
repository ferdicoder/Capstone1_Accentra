import { useCallback, useEffect, useMemo, useState } from "react"

import { PageNotFound } from "@/components/shared/loading/page-skeleton"
import { FilePreviewDialog } from "@/components/shared/file-preview-dialog"
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
  ENGAGEMENT_BILLING_OPTIONS,
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

  // PDF is preview only: it opens in the shared preview dialog on this page
  // and is never saved. Closing the dialog releases the in-browser copy.
  const closePreview = useCallback(
    () =>
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current.url)
        return null
      }),
    []
  )

  // The generated PDF, in the shape the shared preview dialog reads.
  // Kept in a memo so the dialog gets the same object between renders.
  const previewFiles = useMemo(
    () =>
      preview
        ? [
            {
              id: `report-${preview.slug}`,
              name: `${preview.title}.pdf`,
              mimeType: "application/pdf",
              downloadUrl: preview.url,
            },
          ]
        : [],
    [preview]
  )

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

  // Runs when the user clicks Download in the PDF preview.
  const handlePdfDownload = () => {
    if (!preview) return
    logExport(preview.report, "pdf", preview.rowCount)
    setNotice(`${preview.title} PDF downloaded (${plural(preview.rowCount, "row")}).`)
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
            description="Engagements with their current status and billing status, filtered by creation date."
            {...shellProps("engagements")}
            invalid={Boolean(rangeError(f.engagements.created))}
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

      {/* The generated PDF opens in the same preview dialog used everywhere else.
          Its Download button saves the PDF and records the export. */}
      <FilePreviewDialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && closePreview()}
        files={previewFiles}
        subtitle="PDF preview"
        downloadName={preview ? `accentra-${preview.slug}-${fileStamp()}.pdf` : undefined}
        onDownload={handlePdfDownload}
      />
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