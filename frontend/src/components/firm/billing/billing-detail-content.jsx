import { Button } from "@/components/ui/button"
import {
  formatDate,
  getClientFullName,
} from "@/components/firm/engagements/engagement-variants"
import { BillingEngagementHistory } from "./billing-engagement-history"
import {
  formatPeso,
  invoiceTypeLabels,
  isVerifiable,
  paymentMethodLabels,
} from "./billing-variants"

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground sm:text-right">
        {children}
      </span>
    </div>
  )
}

/**
 * Billing detail content shown on the Firm Admin / Billing Officer
 * billing detail page.
 *
 * Service Fee:
 *   Billing → Multiple Engagements → Client / Business
 *
 * Retainer Fee:
 *   Billing → Client / Business
 *
 * Billing status is shown only in the page header.
 */
export function BillingDetailContent({
  billing,
  engagements = [],
  client,
  onVerifyPayment,
}) {
  if (!billing) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Billing record not found.
      </div>
    )
  }

  const verifiable = isVerifiable(billing)
  const isRetainerFee = billing.invoice_type === "retainer_fee"

  const retainerClient = isRetainerFee ? client : null

  const retainerClientName = retainerClient
    ? getClientFullName(retainerClient)
    : "—"

  const retainerBusinessName =
    retainerClient?.business?.businessName ?? "—"
  const engagementNumbers = engagements
    .map((engagement) => engagement.engagementNumber)
    .filter(Boolean)
    .join(", ")

  return (
    <div className="flex flex-col gap-5">
      {/* Retainer Fee → Billing For */}
      {isRetainerFee && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Billing For
          </h3>

          <div className="flex flex-col gap-2.5">
            <InfoRow label="Business">
              {retainerBusinessName}
            </InfoRow>

            <InfoRow label="Client">
              {retainerClientName}
            </InfoRow>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Billing Information */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Billing Information
          </h3>

          <div className="flex flex-col gap-2.5">
            <InfoRow label="Billing Type">
              {invoiceTypeLabels[billing.invoice_type] ??
                billing.invoice_type}
            </InfoRow>

            <InfoRow label="Engagement">
              {engagementNumbers || "—"}
            </InfoRow>

            <InfoRow label="Amount">
              <span style={{ color: "#02353C" }}>
                {formatPeso(billing.amount)}
              </span>
            </InfoRow>

            <InfoRow label="Due Date">
              {formatDate(billing.due_date)}
            </InfoRow>
          </div>
        </div>

        {/* Payment Information */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Payment Information
          </h3>

          <div className="flex flex-col gap-2.5">
            <InfoRow label="Payment Method">
              {billing.payment_method
                ? paymentMethodLabels[billing.payment_method] ??
                  billing.payment_method
                : "Not yet selected"}
            </InfoRow>

            <InfoRow label="Payment Status">
              {billing.status === "for verification"
                ? "For Verification"
                : billing.status === "for resubmission"
                  ? "For Resubmission"
                  : billing.status === "paid"
                    ? "Paid"
                    : "No payment submitted"}
            </InfoRow>

            <InfoRow label="Payment Proof">
              {billing.payment_proof_url ? (
                <a
                  href={billing.payment_proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-forest-900 hover:underline"
                >
                  View Uploaded Proof
                </a>
              ) : (
                "Not yet submitted"
              )}
            </InfoRow>

            <InfoRow label="Reference ID">
              {billing.payment_reference
                ? billing.payment_reference
                : "Not yet verified"}
            </InfoRow>

            {billing.remark && (
              <InfoRow label="Remark">
                <span className="text-orange-700">{billing.remark}</span>
              </InfoRow>
            )}
          </div>

          {verifiable && (
            <div className="mt-4 border-t border-border pt-4">
              {onVerifyPayment && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    onClick={onVerifyPayment}
                    className="cursor-pointer bg-forest-900 text-white hover:opacity-90"
                  >
                    Verify Payment
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Engagements linked to this billing */}
      <BillingEngagementHistory engagements={engagements} />
    </div>
  )
}