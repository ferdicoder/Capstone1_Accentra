import { Button } from "@/components/ui/button"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { formatDate, getClientFullName } from "@/components/firm/engagements/engagement-variants"
import { formatPeso, invoiceTypeLabels, isVerifiable } from "./billing-variants"

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground sm:text-right">{children}</span>
    </div>
  )
}

/**
 * Billing detail content, shown on the Firm Admin billing detail page.
 * Single-status rule: the billing status lives only in the page header —
 * this component never repeats it.
 *
 * @param {Object} billing - Billing record (ERD shape).
 * @param {Object} engagement - Derived engagement, if available.
 * @param {Function} onVerifyPayment - Opens the verify confirmation dialog.
 * @param {Function} onRejectPayment - Opens the reject confirmation dialog.
 */
export function BillingDetailContent({ billing, engagement, onVerifyPayment, onRejectPayment }) {
  if (!billing) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Billing record not found.
      </div>
    )
  }

  const verifiable = isVerifiable(billing)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Billing Information */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Billing Information</h3>
          <div className="flex flex-col gap-2.5">
            <InfoRow label="Invoice Type">
              {invoiceTypeLabels[billing.invoice_type] ?? billing.invoice_type}
            </InfoRow>
            <InfoRow label="Amount">
              <span style={{ color: "#02353C" }}>{formatPeso(billing.amount)}</span>
            </InfoRow>
            <InfoRow label="Due Date">{formatDate(billing.due_date)}</InfoRow>
          </div>
        </div>

        {/* Payment Information */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Payment Information</h3>
          <div className="flex flex-col gap-2.5">
            <InfoRow label="Payment Reference">
              <span className="break-all">
                {billing.payment_reference ? billing.payment_reference : "Not yet submitted"}
              </span>
            </InfoRow>
          </div>

          {verifiable && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Review the submitted payment reference before marking this billing as paid.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {onRejectPayment && (
                  <Button variant="outline" onClick={onRejectPayment} className="cursor-pointer">
                    Reject
                  </Button>
                )}
                {onVerifyPayment && (
                  <Button
                    onClick={onVerifyPayment}
                    className="cursor-pointer bg-forest-900 text-white hover:opacity-90"
                  >
                    Verify Payment
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Engagement */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Related Engagement</h3>
        <div className="flex flex-col gap-2.5">
          <InfoRow label="Engagement Number">{engagement?.engagementNumber ?? "—"}</InfoRow>
          <InfoRow label="Service">{engagement?.serviceName ?? "—"}</InfoRow>
          <InfoRow label="Client">
            {engagement?.client && Object.keys(engagement.client).length > 0
              ? getClientFullName(engagement.client)
              : "—"}
          </InfoRow>
          <InfoRow label="Business">{engagement?.business?.businessName ?? "—"}</InfoRow>
          <InfoRow label="Engagement Status">
            {engagement?.status ? (
              <EngagementStatusBadge status={engagement.status} />
            ) : (
              "—"
            )}
          </InfoRow>
        </div>
      </div>
    </div>
  )
}
