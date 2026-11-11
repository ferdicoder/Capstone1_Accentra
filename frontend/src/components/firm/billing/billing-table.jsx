import { ReceiptText } from "lucide-react"

import { cn } from "@/lib/utils"
import { PaginationFooter, PAGE_SIZE } from "@/components/shared/pagination-footer"
import { Skeleton } from "@/components/ui/skeleton"
import { BillingStatusBadge } from "./billing-status-badge"
import { formatDate } from "@/components/firm/engagements/engagement-variants"
import { billingDisplayId, formatPeso, invoiceTypeLabels } from "./billing-variants"

function InvoiceTypeBadge({ type }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border ring-inset">
      {invoiceTypeLabels[type] ?? type}
    </span>
  )
}

function BillingCard({ billing, engagements, clients, onRowClick }) {
  const billingFor = getBillingForDisplay({ billing, engagements, clients })

  const cardProps =
    typeof onRowClick === "function"
      ? {
          onClick: () => onRowClick(billing),
          onKeyDown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onRowClick(billing)
            }
          },
          tabIndex: 0,
        }
      : {}

  return (
    <li
      {...cardProps}
      className={cn(
        "flex flex-col gap-2 p-4 transition-colors",
        onRowClick && "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-foreground">
          {billingDisplayId(billing)}
        </p>
        <BillingStatusBadge status={billing.status} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{billingFor.title}</p>
        {billingFor.subtitle && (
          <p className="truncate text-xs text-muted-foreground">{billingFor.subtitle}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <InvoiceTypeBadge type={billing.invoice_type} />
        <span>Due {formatDate(billing.due_date)}</span>
      </div>

      <p className="text-sm font-medium text-foreground">{formatPeso(billing.amount)}</p>
    </li>
  )
}

function getBillingForDisplay({ billing, engagements, clients }) {
  const client = clients.find((item) => item.id === billing.business_id)

  const engagementIds = billing.engagement_ids?.length
    ? billing.engagement_ids
    : billing.engagement_id
      ? [billing.engagement_id]
      : []
  const engagement = engagements.find((item) => engagementIds.includes(item.id))

  const person = client ?? engagement?.client
  const businessName =
    client?.businessName || engagement?.business?.businessName

  if (!person && !businessName) {
    return { title: "Unknown business", subtitle: null }
  }

  const personName = person
    ? `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim()
    : ""

  return {
    title: businessName || "Unnamed business",
    subtitle: personName || null,
  }
}

/**
 * Presentational, data-driven billing table.
 *
 * Service Fee:
 *   billing.engagement_id → displays engagement.
 *
 * Retainer Fee:
 *   billing.client_id + billing_month + billing_year
 *   → displays client and billing period.
 *
 * @param {Array} billings - Billing records to display.
 * @param {Array} engagements - Engagement records used for Service Fees.
 * @param {Array} clients - Client records used for Retainer Fees.
 * @param {boolean} loading - Shows skeleton rows when true.
 * @param {string} emptyMessage - Message shown when list is empty.
 * @param {string} emptyDescription - Secondary empty-state line.
 * @param {Function} actions - (billing) => ReactNode for the Actions column.
 * @param {Function} onRowClick - Optional (billing) => void.
 */
export function BillingTable({
  billings = [],
  engagements = [],
  clients = [],
  loading = false,
  skeletonRows = 5,
  emptyMessage = "No billing records found.",
  emptyDescription,
  actions,
  onRowClick,
  page = 1,
  onPageChange,
  className,
  ...props
}) {
  const showActions = typeof actions === "function"
  const isEmpty = !loading && billings.length === 0
  const columnCount = 6 + (showActions ? 1 : 0)
  const totalPages = Math.max(1, Math.ceil(billings.length / PAGE_SIZE))
  const visiblePage = Math.min(page, totalPages)
  const paginatedBillings = billings.slice(
    (visiblePage - 1) * PAGE_SIZE,
    visiblePage * PAGE_SIZE
  )

  return (
    <>
      <div
        data-slot="billing-table"
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
          className
        )}
        {...props}
      >
        {/* Phones: stacked cards, so six columns never have to share 360px. */}
        <div className="md:hidden">
          {loading && (
            <ul className="divide-y divide-border/60" aria-hidden="true">
              {Array.from({ length: 3 }, (_, index) => (
                <li key={`billing-card-skeleton-${index}`} className="flex flex-col gap-2.5 p-4">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </li>
              ))}
            </ul>
          )}

          {!loading && paginatedBillings.length > 0 && (
            <ul className="divide-y divide-border/60">
              {paginatedBillings.map((billing) => (
                <BillingCard
                  key={billing.id}
                  billing={billing}
                  engagements={engagements}
                  clients={clients}
                  onRowClick={onRowClick}
                />
              ))}
            </ul>
          )}

          {isEmpty && (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <ReceiptText className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
              {emptyDescription && (
                <p className="text-xs text-muted-foreground">{emptyDescription}</p>
              )}
            </div>
          )}
        </div>

        {/* Tablet and up: the existing table, with a floor so columns stay readable. */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-foreground uppercase">
              <th scope="col" className="px-4 py-3 font-semibold">
                Bill ID
              </th>

              <th scope="col" className="px-4 py-3 font-semibold">
                Billing For
              </th>

              <th scope="col" className="px-4 py-3 font-semibold">
                Type
              </th>

              <th scope="col" className="px-4 py-3 font-semibold">
                Amount
              </th>

              <th scope="col" className="px-4 py-3 font-semibold">
                Due Date
              </th>

              <th scope="col" className="px-4 py-3 font-semibold">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from(
                { length: skeletonRows },
                (_, index) => (
                  <tr
                    key={`billing-skeleton-${index}`}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <td
                      colSpan={columnCount}
                      className="px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full" />

                        <div className="flex flex-1 flex-col gap-1.5">
                          <Skeleton className="h-3.5 w-1/3" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              )
            ) : isEmpty ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-6 py-12"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <ReceiptText className="size-5 text-muted-foreground" />
                    </div>

                    <p className="text-sm font-medium text-foreground">
                      {emptyMessage}
                    </p>

                    {emptyDescription && (
                      <p className="text-sm text-muted-foreground">
                        {emptyDescription}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedBillings.map((billing) => {
                const billingFor =
                  getBillingForDisplay({
                    billing,
                    engagements,
                    clients,
                  })

                return (
                  <tr
                    key={billing.id}
                    onClick={
                      onRowClick
                        ? () => onRowClick(billing)
                        : undefined
                    }
                    className={cn(
                      "border-b border-border/60 last:border-b-0 hover:bg-muted/30",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {/* BILL ID */}
                    <td className="px-4 py-3 align-middle font-medium text-foreground">
                      {billingDisplayId(billing)}
                    </td>

                    {/* BILLING FOR */}
                    <td className="px-4 py-3 align-middle">
                      <p className="font-medium text-foreground">
                        {billingFor.title}
                      </p>

                      {billingFor.subtitle && (
                        <p className="text-xs text-muted-foreground">
                          {billingFor.subtitle}
                        </p>
                      )}
                    </td>

                    {/* TYPE */}
                    <td className="px-4 py-3 align-middle">
                      <InvoiceTypeBadge
                        type={billing.invoice_type}
                      />
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-3 align-middle font-medium text-foreground">
                      {formatPeso(billing.amount)}
                    </td>

                    {/* DUE DATE */}
                    <td className="px-4 py-3 align-middle text-muted-foreground">
                      {formatDate(billing.due_date)}
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3 align-middle">
                      <BillingStatusBadge
                        status={billing.status}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
      <PaginationFooter
        page={visiblePage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  )
}