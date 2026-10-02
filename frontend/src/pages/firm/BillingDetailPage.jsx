import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { PageNotFound } from "@/components/shared/loading/page-skeleton"
import { buttonVariants } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/usePageMeta"
import { BillingDetailContent } from "@/components/firm/billing/billing-detail-content"
import { BillingStatusBadge } from "@/components/firm/billing/billing-status-badge"
import { BillingStatusDropdown } from "@/components/firm/billing/billing-status-dropdown"
import { VerifyPaymentDialog } from "@/components/firm/billing/verify-payment-dialog"
import { RejectPaymentDialog } from "@/components/firm/billing/reject-payment-dialog"
import { CancelBillingDialog } from "@/components/firm/billing/cancel-billing-dialog"
import { billingStatusLabels, invoiceTypeLabels } from "@/components/firm/billing/billing-variants"
import {
  getMockBillings,
  mockEngagements,
  rejectMockPayment,
  updateMockBillingStatus,
  verifyMockPayment,
} from "@/components/firm/billing/billing-mock-data"

export default function BillingDetailPage() {
  const { id } = useParams()
  const backHref = "/admin/billing"

  const [billings, setBillings] = useState(getMockBillings)

  const [verifyOpen, setVerifyOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [notice, setNotice] = useState("")

  const billing = billings.find((b) => b.id === id) ?? null
  const engagement = mockEngagements.find((e) => e.id === billing?.engagement_id) ?? null

  usePageMeta({
    title: billing?.id ?? "Billing Details",
    breadcrumbs: [{ label: "Billing", href: backHref }],
  })

  const handleStatusChange = (status) => {
    if (!billing || billing.status === status) return
    if (status === "cancelled") {
      setCancelOpen(true)
      return
    }
    if (!updateMockBillingStatus(billing.id, status)) return
    setBillings(getMockBillings())
    setNotice(`Status updated to "${billingStatusLabels[status] ?? status}"`)
    setTimeout(() => setNotice(""), 3000)
  }

  const handleConfirmCancellation = () => {
    if (!billing) return
    updateMockBillingStatus(billing.id, "cancelled")
    setBillings(getMockBillings())
    setNotice(`${billing.id} cancelled`)
    setCancelOpen(false)
    setTimeout(() => setNotice(""), 3000)
  }

  const handleConfirmVerification = () => {
    if (!billing) return
    verifyMockPayment(billing.id)
    setBillings(getMockBillings())
    setNotice(`${billing.id} payment verified`)
    setVerifyOpen(false)
    setTimeout(() => setNotice(""), 3000)
  }

  const handleConfirmRejection = () => {
    if (!billing) return
    rejectMockPayment(billing.id)
    setBillings(getMockBillings())
    setNotice(`${billing.id} payment rejected`)
    setRejectOpen(false)
    setTimeout(() => setNotice(""), 3000)
  }

  if (!billing) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-3 py-1">
          <Link
            to={backHref}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "cursor-pointer gap-1.5 text-muted-foreground",
            })}
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          {notice && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
              {notice}
            </span>
          )}
        </div>
        <PageNotFound
          title="Billing Record Not Found"
          message="The requested billing record could not be found."
          actionLabel="Back to Billing"
          actionHref={backHref}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 py-1">
        <Link
          to={backHref}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "cursor-pointer gap-1.5 text-muted-foreground",
          })}
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        {notice && (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {notice}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Billing Detail</h2>
            <BillingStatusBadge status={billing.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {billing.id} · {invoiceTypeLabels[billing.invoice_type] ?? billing.invoice_type} Invoice
          </p>
        </div>
        <BillingStatusDropdown billing={billing} onStatusChange={handleStatusChange} />
      </div>

      <BillingDetailContent
        billing={billing}
        engagement={engagement}
        onVerifyPayment={() => setVerifyOpen(true)}
        onRejectPayment={() => setRejectOpen(true)}
      />

      <VerifyPaymentDialog
        billing={billing}
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onConfirm={handleConfirmVerification}
      />

      <RejectPaymentDialog
        billing={billing}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleConfirmRejection}
      />

      <CancelBillingDialog
        billing={billing}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleConfirmCancellation}
      />
    </>
  )
}
