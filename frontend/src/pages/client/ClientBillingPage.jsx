
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  ChevronRight,
  Clock,
  FileText,
  Search,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchBusinessBillings } from "@/hooks/useBillings"
import { authStore } from "@/store/authStore"

// Replace with the authenticated client's billing records from your API.
const statusStyles = {
  issued: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-blue-200 bg-blue-50 text-blue-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  Unpaid:
    "border-amber-200 bg-amber-50 text-amber-700",
  "Under Verification":
    "border-blue-200 bg-blue-50 text-blue-700",
  "Revision Requested":
    "border-orange-200 bg-orange-50 text-orange-700",
  Paid:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const filters = [
  "All",
  "issued", "pending", "overdue", "paid", "cancelled",
]

const statusLabels = { issued: "Issued", pending: "Pending Payment", overdue: "Overdue", paid: "Paid", cancelled: "Cancelled" }

function formatCurrency(amount) {
  return `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function ClientBillingPage() {
  const navigate = useNavigate()
  const user = authStore((state) => state.user)
  const { data: business } = useFetchMyBusiness(user?.id)
  const { data: invoices = [], isLoading, error } = useFetchBusinessBillings(business?.id)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")

  usePageMeta({
    title: "My Billing",
    breadcrumbs: [
      { label: "Home", href: "/client/dashboard" },
    ],
    hasUnreadNotifications: true,
    onRequestServiceClick: () =>
      navigate("/client/service-requests"),
  })

  const unpaidInvoices = invoices.filter(
    (invoice) =>     ["issued", "pending", "overdue"].includes(invoice.status)
  )

  const outstandingAmount = invoices
    .filter((invoice) =>
      ["issued", "pending", "overdue"].includes(
        invoice.status
      )
    )
    .reduce((total, invoice) => total + invoice.amount, 0)

  const pendingVerificationCount = invoices.filter(
    (invoice) =>     invoice.status === "pending"
  ).length

  const filteredInvoices = invoices.filter((invoice) => {
    const query = search.trim().toLowerCase()
    const matchesFilter = activeFilter === "All" || invoice.status === activeFilter
    const matchesSearch = [invoice.id, invoice.engagement_id, invoice.billing_type]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    return matchesFilter && matchesSearch
  })

  return (
    <div className="flex flex-1 flex-col gap-6 px-2 py-2 sm:px-4 lg:px-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          My Billing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your invoices and manage your payments.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-background p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="size-4" />
            Outstanding Billing
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(outstandingAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {unpaidInvoices.length} unpaid invoice
            {unpaidInvoices.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            Awaiting Verification
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {pendingVerificationCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Payment submissions being reviewed
          </p>
        </div>
      </div>

      {/* Invoice list */}
      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Billing History</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Select an invoice to view its details.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoices..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b px-4 py-3">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === filter
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {isLoading ? <p className="p-8 text-center text-sm text-muted-foreground">Loading billing…</p> : error ? <p className="p-8 text-center text-sm text-destructive">{error.message}</p> : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="font-medium">No invoices found</p>
            <p className="text-sm text-muted-foreground">
              Try another search term or status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredInvoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() =>
                  navigate(`/client/billing/${invoice.id}`)
                }
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="size-5 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {invoice.id}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {invoice.billing_type}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                        statusStyles[invoice.status] ??
                        "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {statusLabels[invoice.status] ?? invoice.status}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="text-sm font-semibold">
                    {formatCurrency(invoice.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.dueDate
                      ? `Due ${invoice.dueDate}`
                      : `Issued ${invoice.invoiceDate}`}
                  </p>
                </div>

                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
      </section>
    </div>
  )
}
