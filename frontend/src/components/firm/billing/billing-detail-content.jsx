import { Button } from "@/components/ui/button"
import {
  formatDate,
  getClientFullName,
} from "@/components/firm/engagements/engagement-variants"
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

const monthLabels = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
}

function getBillingPeriod(billing) {
  if (!billing.billing_month || !billing.billing_year) {
    return "—"
  }

  return `${monthLabels[billing.billing_month] ?? billing.billing_month} ${billing.billing_year}`
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
  const isServiceFee = billing.invoice_type === "service_fee"
  const isRetainerFee = billing.invoice_type === "retainer_fee"

  const retainerClient = isRetainerFee ? client : null

  const retainerClientName = retainerClient
    ? getClientFullName(retainerClient)
    : "—"

  const retainerBusinessName =
    retainerClient?.business?.businessName ?? "—"

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Billing Information */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Billing Information
          </h3>

          <div className="flex flex-col gap-2.5">
            <InfoRow label="Invoice Type">
              {invoiceTypeLabels[billing.invoice_type] ??
                billing.invoice_type}
            </InfoRow>

            {isRetainerFee && (
              <InfoRow label="Billing Period">
                {getBillingPeriod(billing)}
              </InfoRow>
            )}

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
          </div>

          {verifiable && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Review the uploaded payment proof and enter the reference ID
                shown in the proof before verifying the payment.
              </p>

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

      {/* Service Fee → Related Engagements */}
      {isServiceFee && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Related Engagements
            </h3>

            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {engagements.length}{" "}
              {engagements.length === 1 ? "engagement" : "engagements"}
            </span>
          </div>

          {engagements.length > 0 ? (
            <div className="flex flex-col divide-y divide-border">
              {engagements.map((engagement) => (
                <div
                  key={engagement.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {engagement.engagementNumber ?? "Engagement"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <InfoRow label="Service">
                      {engagement.serviceName ?? "—"}
                    </InfoRow>

                    <InfoRow label="Client">
                      {engagement.client &&
                      Object.keys(engagement.client).length > 0
                        ? getClientFullName(engagement.client)
                        : "—"}
                    </InfoRow>

                    <InfoRow label="Business">
                      {engagement.business?.businessName ?? "—"}
                    </InfoRow>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No engagements are linked to this invoice.
            </p>
          )}
        </div>
      )}

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
    </div>
  )
}