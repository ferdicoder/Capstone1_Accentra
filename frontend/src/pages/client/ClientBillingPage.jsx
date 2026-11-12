
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Search,
  X,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchBusinessBillings } from "@/hooks/useBillings"
import { NoBusinessBanner } from "@/components/client/NoBusinessBanner"
import { authStore } from "@/store/authStore"
import { billingDisplayId, billingStatusLabels } from "@/components/firm/billing/billing-variants"
import { BillingStatusBadge } from "@/components/firm/billing/billing-status-badge"

const statusFilters = [
  "pending",
  "for verification",
  "for resubmission",
  "paid",
  "cancelled",
]

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
  const [activeFilter, setActiveFilter] = useState("")

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
    (invoice) => ["pending", "overdue", "for resubmission"].includes(invoice.status)
  )

  const outstandingAmount = invoices
    .filter((invoice) =>
      ["pending", "overdue", "for resubmission"].includes(
        invoice.status
      )
    )
    .reduce((total, invoice) => total + invoice.amount, 0)

  const pendingVerificationCount = invoices.filter(
    (invoice) => invoice.status === "for verification"
  ).length

  const filteredInvoices = invoices.filter((invoice) => {
    const query = search.trim().toLowerCase()
    const matchesFilter = !activeFilter || invoice.status === activeFilter
    const matchesSearch = [invoice.billingCode, invoice.id, invoice.engagement_id, invoice.billing_type]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    return matchesFilter && matchesSearch
  })

  return (
    <div className="flex flex-1 flex-col gap-6 px-2 py-2 sm:px-4 lg:px-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          My Billing
        </h1>
      </div>

      {business === null && <NoBusinessBanner />}

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
              {filteredInvoices.length} of {invoices.length} billing records
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoices..."
                aria-label="Search invoices"
                className="pl-9"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className={`w-full justify-between gap-2 sm:w-auto ${
                      activeFilter
                        ? "border-forest-900/40 text-forest-900"
                        : ""
                    }`}
                  />
                }
              >
                <span className="flex items-center gap-2">
                  <Filter className="size-4" />
                  {activeFilter
                    ? billingStatusLabels[activeFilter]
                    : "All statuses"}
                </span>
                <ChevronRight className="size-4 rotate-90 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter by billing status</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setActiveFilter("")}
                    className="cursor-pointer"
                  >
                    <span className="flex w-4 shrink-0 justify-center">
                      {!activeFilter && <Check className="size-4" />}
                    </span>
                    <span className="flex-1">All statuses</span>
                    <span className="text-xs text-muted-foreground">
                      {invoices.length}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {statusFilters.map((status) => {
                    const count = invoices.filter(
                      (invoice) => invoice.status === status
                    ).length
                    return (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => setActiveFilter(status)}
                        className="cursor-pointer"
                      >
                        <span className="flex w-4 shrink-0 justify-center">
                          {activeFilter === status && (
                            <Check className="size-4" />
                          )}
                        </span>
                        <span className="flex-1">
                          {billingStatusLabels[status]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {count}
                        </span>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {(search || activeFilter) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch("")
                  setActiveFilter("")
                }}
                className="gap-1.5"
              >
                <X className="size-4" />
                Clear
              </Button>
            )}
          </div>
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
                    {billingDisplayId(invoice)}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {invoice.billing_type}
                  </p>
                  <div className="mt-2">
                    <BillingStatusBadge status={invoice.status} />
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
