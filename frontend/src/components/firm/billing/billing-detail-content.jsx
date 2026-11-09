import { ExternalLink, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  formatDate,
  getClientFullName,
} from "@/components/firm/engagements/engagement-variants"
import { BillingEngagementHistory } from "./billing-engagement-history"
import {
  formatPeso,
  invoiceTypeLabels,
  paymentMethodLabels,
} from "./billing-variants"

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Label above value, so long values wrap cleanly on any width. */
function Field({ label, children, className = "" }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground break-words">
        {children}
      </dd>
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <section className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

const paymentStatusDisplay = {
  "for verification": {
    label: "For Verification",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
  },
  "for resubmission": {
    label: "For Resubmission",
    className: "bg-orange-500/10 text-orange-700 ring-orange-500/20",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
  },
}

function getDueHint(billing) {
  if (billing.status !== "pending" || !billing.due_date) return null

  const due = new Date(billing.due_date)
  if (Number.isNaN(due.getTime())) return null
  due.setHours(23, 59, 59, 999)

  const diff = due.getTime() - Date.now()
  if (diff < 0) {
    const days = Math.max(1, Math.ceil(Math.abs(diff) / MS_PER_DAY))
    return {
      text: `Overdue by ${days} ${days === 1 ? "day" : "days"}`,
      className: "text-destructive",
    }
  }

  const days = Math.ceil(diff / MS_PER_DAY)
  if (days > 7) return null
  return {
    text: days <= 1 ? "Due today" : `Due in ${days} days`,
    className: "text-amber-700",
  }
}

/**
 * Billing detail content shown on the Firm Admin / Billing Officer
 * billing detail page. One card, four sections:
 *   1. Summary (amount, type, due date)
 *   2. Billing For (client / business)
 *   3. Payment (method, status, proof, reference)
 *   4. Related Engagements
 *
 * Billing status is shown only in the page header.
 */
export function BillingDetailContent({
  billing,
  engagements = [],
  client,
  onVerifyPayment,
  canCancel = false,
  onCancel,
}) {
  if (!billing) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Billing record not found.
      </div>
    )
  }

  const isRetainerFee = billing.invoice_type === "retainer_fee"

  // Retainer bills carry the client directly; service fee bills take it
  // from their linked engagements.
  const billedClient = isRetainerFee ? client : engagements[0]?.client
  const clientName = billedClient ? getClientFullName(billedClient) : "—"
  const businessName = billedClient?.business?.businessName ?? "—"

  const engagementNumbers = engagements
    .map((engagement) => engagement.engagementNumber)
    .filter(Boolean)
    .join(", ")

  const dueHint = getDueHint(billing)
  const paymentStatus = paymentStatusDisplay[billing.status]

  // Verify is available at any stage except once the bill is paid or cancelled.
  const canVerify = Boolean(
    onVerifyPayment && !["paid", "cancelled"].includes(billing.status)
  )
  const canCancelBill = Boolean(canCancel && onCancel)
  const hasActions = canVerify || canCancelBill

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* Card 1: billing details */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="divide-y divide-border">
        {/* Actions: verify payment / cancel bill (only when applicable) */}
        {hasActions && (
          <div className="flex flex-wrap items-center justify-end gap-2 bg-muted/30 px-5 py-3 sm:px-6">
            {canCancelBill && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer text-destructive hover:text-destructive"
                onClick={onCancel}
              >
                Cancel Bill
              </Button>
            )}
            {canVerify && (
              <Button
                type="button"
                size="sm"
                onClick={onVerifyPayment}
                className="cursor-pointer gap-1.5 bg-forest-900 text-white hover:opacity-90"
              >
                <ShieldCheck className="size-4" />
                Verify Payment
              </Button>
            )}
          </div>
        )}

        {/* 1. Summary */}
        <section className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Amount
            </span>
            <span className="text-3xl font-semibold tabular-nums text-forest-900">
              {formatPeso(billing.amount)}
            </span>
          </div>

          <dl className="grid gap-5 sm:grid-cols-3">
            <Field label="Billing Type">
              {invoiceTypeLabels[billing.invoice_type] ?? billing.invoice_type}
            </Field>

            <Field label="Due Date">
              <span className="flex flex-col gap-0.5">
                <span>{formatDate(billing.due_date)}</span>
                {dueHint && (
                  <span className={`text-xs font-medium ${dueHint.className}`}>
                    {dueHint.text}
                  </span>
                )}
              </span>
            </Field>

            <Field label="Engagement">{engagementNumbers || "—"}</Field>
          </dl>
        </section>

        {/* 2. Billing For */}
        {(isRetainerFee || billedClient) && (
          <Section title="Billing For">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Business">{businessName}</Field>
              <Field label="Client">{clientName}</Field>
            </dl>
          </Section>
        )}

        {/* 3. Payment */}
        <Section title="Payment">
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="Method">
              {billing.payment_method ? (
                paymentMethodLabels[billing.payment_method] ??
                billing.payment_method
              ) : (
                <span className="font-normal text-muted-foreground">
                  Not yet selected
                </span>
              )}
            </Field>

            <Field label="Status">
              {paymentStatus ? (
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${paymentStatus.className}`}
                >
                  {paymentStatus.label}
                </span>
              ) : (
                <span className="font-normal text-muted-foreground">
                  Awaiting client payment
                </span>
              )}
            </Field>

            <Field label="Proof">
              {billing.payment_proof_url ? (
                <a
                  href={billing.payment_proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-forest-900 hover:underline"
                >
                  View uploaded proof
                  <ExternalLink className="size-3.5" />
                </a>
              ) : (
                <span className="font-normal text-muted-foreground">
                  Not yet submitted
                </span>
              )}
            </Field>

          </dl>

          {billing.remark && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2.5 text-sm text-orange-800">
              <span className="font-medium">Remark: </span>
              {billing.remark}
            </div>
          )}
        </Section>

        </div>
      </div>

      {/* Card 2: related engagements */}
      <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <BillingEngagementHistory engagements={engagements} />
      </div>
    </div>
  )
}