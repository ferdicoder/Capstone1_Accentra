import { useCallback, useEffect, useState } from "react"
import { X } from "lucide-react"

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
  assignedEngagementColumns,
  billingColumns,
  clientEngagementColumns,
  clientListColumns,
  clientPaymentColumns,
  engagementColumns,
  infoColumns,
  paymentColumns,
  summaryColumns,
  userListColumns,
} from "./lib/columns"
import {
  BILLING_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COVERAGE_OPTIONS,
  INITIAL_FILTERS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "./lib/constants"
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
  const [preview, setPreview] = useState(null) // { title, slug, url } for the PDF preview

  usePageMeta({ title: "Reports", breadcrumbs: [] })

  const f = filters
  const {
    status,
    clientOptions,
    userOptions,
    clientStatusOptions,
    userRoleOptions,
    userStatusOptions,
    engagementStatusOptions,
    serviceOptions,
    engagementResult,
    engagementSummary,
    clientResult,
    userResult,
    billingResult,
    billingSummary,
    paymentResult,
    paymentSummary,
    selectedClient,
    clientInfoRows,
    clientEngagementRows,
    clientPaymentRows,
    selectedUser,
    userInfoRows,
    assignedRows,
  } = useReportData(f)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(""), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  // PDF is preview only: it opens in a viewer on this page and is never saved.
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
  const exportCsv = (slug, label, csv, rowCount) => {
    downloadCsv(`accentra-${slug}-${fileStamp()}.csv`, csv)
    setNotice(`${label} exported (${plural(rowCount, "row")}).`)
  }
  const exportPdf = (slug, label, sections) => {
    const url = URL.createObjectURL(buildPdf(label, sections))
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url)
      return { title: label, slug, url }
    })
  }

  const shellProps = (key) => ({
    ...status[key],
    hasFilters: !isDefault(key, f[key]),
    onReset: () => reset(key),
  })

  // --- Views -----------------------------------------------------------------
  const renderView = () => {
    switch (view) {
      case "engagements":
        return (
          <ReportShell
            title="Engagement Summary"
            description="Engagements with their current status. Created and completion dates are separate filters."
            {...shellProps("engagements")}
            invalid={Boolean(rangeError(f.engagements.created) || rangeError(f.engagements.completed))}
            rowCount={engagementResult.length}
            summary={engagementSummary}
            onExport={() =>
              exportCsv(
                "engagement-summary",
                "Engagement Summary",
                sectionsCsv([
                  { title: "Summary", columns: summaryColumns, rows: engagementSummary },
                  { title: "Engagements", columns: engagementColumns, rows: engagementResult },
                ]),
                engagementResult.length
              )
            }
            onExportPdf={() =>
              exportPdf("engagement-summary", "Engagement Summary", [
                { title: "Summary", columns: summaryPdfColumns, rows: engagementSummary },
                { title: "Engagements", columns: engagementColumns, rows: engagementResult },
              ])
            }
            filters={
              <>
                <DateRange label="Date created" value={f.engagements.created} onChange={(created) => update("engagements", { created })} />
                <DateRange label="Completion date" value={f.engagements.completed} onChange={(completed) => update("engagements", { completed })} />
                <SelectField label="Status" value={f.engagements.status} onChange={(status) => update("engagements", { status })} options={engagementStatusOptions} allLabel="All statuses" />
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

      case "clients":
        return (
          <ReportShell
            title="Client List"
            description="Registered clients and their account classifications."
            {...shellProps("clients")}
            rowCount={clientResult.length}
            onExport={() =>
              exportCsv("client-list", "Client List", toCsv(clientListColumns, clientResult), clientResult.length)
            }
            onExportPdf={() =>
              exportPdf("client-list", "Client List", [
                { title: "Clients", columns: clientListColumns, rows: clientResult },
              ])
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

      case "clientRecord": {
        const rowCount = selectedClient ? 1 + clientEngagementRows.length + clientPaymentRows.length : 0
        const sections = [
          { title: "Client Information", columns: infoColumns, rows: clientInfoRows },
          { title: "Engagement History", columns: clientEngagementColumns, rows: clientEngagementRows },
          { title: "Payment History", columns: clientPaymentColumns, rows: clientPaymentRows },
        ]
        return (
          <ReportShell
            title="Client Record"
            description="One client's information with their engagement and payment history. Billing amounts are the amounts saved on each invoice."
            {...shellProps("clientRecord")}
            rowCount={rowCount}
            onExport={() =>
              exportCsv(`client-record-${selectedClient.id}`, "Client Record", sectionsCsv(sections), rowCount)
            }
            onExportPdf={() => exportPdf(`client-record-${selectedClient.id}`, "Client Record", sections)}
            filters={
              <SelectField label="Client" value={f.clientRecord.client} onChange={(client) => update("clientRecord", { client })} options={clientOptions} allLabel="Select a client" />
            }
          >
            {!selectedClient ? (
              <p className="text-xs text-muted-foreground">Select a client to view their record.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold">Client Information</h3>
                  <DataTable columns={infoColumns} rows={clientInfoRows} rowKey={(r) => r.label} />
                </div>
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold">Engagement History</h3>
                  <DataTable columns={clientEngagementColumns} rows={clientEngagementRows} rowKey={(r, i) => `${r.id}-${i}`} />
                </div>
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold">Payment History</h3>
                  <DataTable columns={clientPaymentColumns} rows={clientPaymentRows} rowKey={(r, i) => `${r.id}-${i}`} />
                </div>
              </div>
            )}
          </ReportShell>
        )
      }

      case "users":
        return (
          <ReportShell
            title="Firm User List"
            description="Admin, staff, and billing officer accounts."
            {...shellProps("users")}
            invalid={Boolean(rangeError(f.users.created))}
            rowCount={userResult.length}
            onExport={() =>
              exportCsv("firm-user-list", "Firm User List", toCsv(userListColumns, userResult), userResult.length)
            }
            onExportPdf={() =>
              exportPdf("firm-user-list", "Firm User List", [
                { title: "Firm Users", columns: userListColumns, rows: userResult },
              ])
            }
            filters={
              <>
                <SearchField label="Search" value={f.users.q} onChange={(q) => update("users", { q })} placeholder="Full name or email" />
                <SelectField label="Firm role" value={f.users.role} onChange={(role) => update("users", { role })} options={userRoleOptions} allLabel="All roles" />
                <SelectField label="Account status" value={f.users.status} onChange={(status) => update("users", { status })} options={userStatusOptions} allLabel="All statuses" />
                <DateRange label="Date created" value={f.users.created} onChange={(created) => update("users", { created })} />
              </>
            }
          >
            <DataTable columns={userListColumns} rows={userResult} rowKey={(u, i) => `${u.id}-${i}`} />
          </ReportShell>
        )

      case "userRecord": {
        const rowCount = selectedUser ? 1 + assignedRows.length : 0
        const sections = [
          { title: "Firm User Information", columns: infoColumns, rows: userInfoRows },
          { title: "Currently Assigned Engagements", columns: assignedEngagementColumns, rows: assignedRows },
        ]
        return (
          <ReportShell
            title="Firm User Record"
            description="One firm user's information and the engagements currently assigned to them. Past assignments are not tracked."
            {...shellProps("userRecord")}
            rowCount={rowCount}
            onExport={() =>
              exportCsv(`firm-user-record-${selectedUser.id}`, "Firm User Record", sectionsCsv(sections), rowCount)
            }
            onExportPdf={() => exportPdf(`firm-user-record-${selectedUser.id}`, "Firm User Record", sections)}
            filters={
              <SelectField label="Firm user" value={f.userRecord.user} onChange={(user) => update("userRecord", { user })} options={userOptions} allLabel="Select a firm user" />
            }
          >
            {!selectedUser ? (
              <p className="text-xs text-muted-foreground">Select a firm user to view their record.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold">Firm User Information</h3>
                  <DataTable columns={infoColumns} rows={userInfoRows} rowKey={(r) => r.label} />
                </div>
                <div>
                  <h3 className="mb-1.5 text-xs font-semibold">Currently Assigned Engagements</h3>
                  <DataTable columns={assignedEngagementColumns} rows={assignedRows} rowKey={(r, i) => `${r.id}-${i}`} />
                </div>
              </div>
            )}
          </ReportShell>
        )
      }

      case "billing":
        return (
          <ReportShell
            title="Billing Summary"
            description="Recorded invoices and their statuses. Billed totals leave out voided invoices and are not revenue."
            {...shellProps("billing")}
            invalid={Boolean(rangeError(f.billing.range))}
            rowCount={billingResult.length}
            summary={billingSummary}
            onExport={() =>
              exportCsv(
                "billing-summary",
                "Billing Summary",
                sectionsCsv([
                  { title: "Summary", columns: summaryColumns, rows: billingSummary },
                  { title: "Billings", columns: billingColumns, rows: billingResult },
                ]),
                billingResult.length
              )
            }
            onExportPdf={() =>
              exportPdf("billing-summary", "Billing Summary", [
                { title: "Summary", columns: summaryPdfColumns, rows: billingSummary },
                { title: "Billings", columns: billingColumns, rows: billingResult },
              ])
            }
            filters={
              <>
                <DateRange label="Billing date" value={f.billing.range} onChange={(range) => update("billing", { range })} />
                <SelectField label="Billing type" value={f.billing.type} onChange={(type) => update("billing", { type })} options={BILLING_TYPE_OPTIONS} allLabel="All billing types" />
                <SelectField label="Billing status" value={f.billing.status} onChange={(status) => update("billing", { status })} options={PAYMENT_STATUS_OPTIONS} allLabel="All statuses" />
                <SelectField label="Client" value={f.billing.client} onChange={(client) => update("billing", { client })} options={clientOptions} allLabel="All clients" />
              </>
            }
          >
            <DataTable columns={billingColumns} rows={billingResult} rowKey={(r, i) => `${r.id}-${i}`} />
          </ReportShell>
        )

      case "payments":
        return (
          <ReportShell
            title="Payment Monitoring"
            description="Billing payment statuses and recorded payments. Unpaid and For Verification invoices are never counted as paid."
            {...shellProps("payments")}
            invalid={Boolean(rangeError(f.payments.verified))}
            rowCount={paymentResult.length}
            summary={paymentSummary}
            onExport={() =>
              exportCsv(
                "payment-monitoring",
                "Payment Monitoring",
                sectionsCsv([
                  { title: "Summary", columns: summaryColumns, rows: paymentSummary },
                  { title: "Payments", columns: paymentColumns, rows: paymentResult },
                ]),
                paymentResult.length
              )
            }
            onExportPdf={() =>
              exportPdf("payment-monitoring", "Payment Monitoring", [
                { title: "Summary", columns: summaryPdfColumns, rows: paymentSummary },
                { title: "Payments", columns: paymentColumns, rows: paymentResult },
              ])
            }
            filters={
              <>
                <SelectField label="Billing type" value={f.payments.type} onChange={(type) => update("payments", { type })} options={BILLING_TYPE_OPTIONS} allLabel="All billing types" />
                <SelectField label="Payment status" value={f.payments.status} onChange={(status) => update("payments", { status })} options={PAYMENT_STATUS_OPTIONS} allLabel="All statuses" />
                <SelectField label="Payment method" value={f.payments.method} onChange={(method) => update("payments", { method })} options={PAYMENT_METHOD_OPTIONS} allLabel="All methods" />
                <SelectField label="Client" value={f.payments.client} onChange={(client) => update("payments", { client })} options={clientOptions} allLabel="All clients" />
                <DateRange label="Payment verification date" value={f.payments.verified} onChange={(verified) => update("payments", { verified })} />
              </>
            }
          >
            <DataTable columns={paymentColumns} rows={paymentResult} rowKey={(r, i) => `${r.id}-${i}`} />
          </ReportShell>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-2 py-2 sm:px-4 lg:px-6">
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
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">{preview.title}</h2>
                <p className="text-xs text-muted-foreground">PDF preview</p>
              </div>
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

// Admin only. The guard lives in a wrapper so non-admins never trigger the
// data fetches inside ReportsContent. The backend must enforce this too.
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