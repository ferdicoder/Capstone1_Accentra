import { ReceiptText } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { BillingStatusBadge } from "./billing-status-badge"
import { formatDate } from "@/components/firm/engagements/engagement-variants"
import { formatPeso, invoiceTypeLabels } from "./billing-variants"
import { getEngagementDisplay } from "./billing-utils"

function InvoiceTypeBadge({ type }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border ring-inset">
      {invoiceTypeLabels[type] ?? type}
    </span>
  )
}

function getClientDisplay(clients, clientId) {
  const client = clients.find(
    (item) => item.id === clientId
  )

  if (!client) {
    return {
      title: "Unknown business",
      subtitle: null,
    }
  }

  const clientName =
    `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()

  return {
    title:
      client.business?.businessName ||
      "Unnamed business",
    subtitle:
      clientName ||
      client.email ||
      null,
  }
}

function getBillingForDisplay({
  billing,
  engagements,
  clients,
}) {
  let client = null
  let businessName = null

  if (billing.invoice_type === "retainer_fee") {
    // Retainer Fee → Client
    client = clients.find(
      (item) => item.id === billing.client_id
    )

    businessName = client?.business?.businessName
  } else {
    // Service Fee → Engagement → Client/Business
    const engagement = engagements.find(
      (item) => item.id === billing.engagement_id
    )

    client = engagement?.client
    businessName = engagement?.business?.businessName
  }

  if (!client && !businessName) {
    return {
      title: "Unknown business",
      subtitle: null,
    }
  }

  const clientName = client
    ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
    : ""

  return {
    title: businessName || "Unnamed business",
    subtitle: clientName || null,
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
  className,
  ...props
}) {
  const showActions = typeof actions === "function"
  const isEmpty = !loading && billings.length === 0
  const columnCount = 6 + (showActions ? 1 : 0)

  return (
    <div
      data-slot="billing-table"
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className
      )}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
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
              billings.map((billing) => {
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
                      {billing.id}
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
  )
}