import { useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { PageNotFound } from "@/components/shared/loading/page-skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePageMeta } from "@/hooks/usePageMeta"
import { BillingDetailContent } from "@/components/firm/billing/billing-detail-content"
import { BillingStatusBadge } from "@/components/firm/billing/billing-status-badge"
import { BillingStatusDropdown } from "@/components/firm/billing/billing-status-dropdown"
import { VerifyPaymentDialog } from "@/components/firm/billing/verify-payment-dialog"
import {
  billingStatusLabels,
  invoiceTypeLabels,
  isFinalBillingStatus,
} from "@/components/firm/billing/billing-variants"
import {
  getMockBillings,
  mockClients,
  mockEngagements,
  rejectMockPayment,
  updateMockBillingStatus,
  verifyMockPayment,
} from "@/components/firm/billing/billing-mock-data"

export default function BillingDetailPage() {
  const { id } = useParams()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/billing-officer")
    ? "/billing-officer"
    : "/admin"

  const backHref = `${basePath}/billing`

  const [billings, setBillings] = useState(getMockBillings)

  const [verifyOpen, setVerifyOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState("")
  const [notice, setNotice] = useState("")

  const billing =
    billings.find((billing) => billing.id === id) ?? null

  const engagement =
    billing?.invoice_type === "service_fee"
      ? mockEngagements.find(
          (engagement) => engagement.id === billing.engagement_id
        ) ?? null
      : null

  const client =
    billing?.invoice_type === "retainer_fee"
      ? mockClients.find(
          (client) => client.id === billing.client_id
        ) ?? null
      : null

  usePageMeta({
    title: billing?.id ?? "Billing Details",
    breadcrumbs: [
      {
        label: "Billing",
        href: backHref,
      },
    ],
  })

  const showNotice = (message) => {
    setNotice(message)
    setTimeout(() => setNotice(""), 3000)
  }

  const handleStatusChange = (status) => {
    if (!billing || isFinalBillingStatus(billing.status) || billing.status === status) return
    setPendingStatus(status)
  }

  const handleConfirmStatusChange = () => {
    if (!billing || !pendingStatus || isFinalBillingStatus(billing.status)) {
      setPendingStatus("")
      return
    }

    if (!updateMockBillingStatus(billing.id, pendingStatus)) {
      setPendingStatus("")
      return
    }

    setBillings(getMockBillings())
    showNotice(
      `${billing.id} status updated to "${billingStatusLabels[pendingStatus] ?? pendingStatus}"`
    )
    setPendingStatus("")
  }

 const handleConfirmVerification = (paymentMethod, referenceId) => {
  if (!billing || !paymentMethod) return

  if (paymentMethod !== "cash" && !referenceId) {
    return
  }

  verifyMockPayment(
    billing.id,
    paymentMethod,
    referenceId
  )

  setBillings(getMockBillings())
  setNotice(`${billing.id} payment verified`)
  setVerifyOpen(false)

  setTimeout(() => setNotice(""), 3000)
}

  const handleConfirmRejection = () => {
    if (!billing) return

    rejectMockPayment(billing.id)
    setBillings(getMockBillings())
    setVerifyOpen(false)

    showNotice(`${billing.id} payment rejected`)
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
              className:
                "cursor-pointer gap-1.5 text-muted-foreground",
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

  const invoiceLabel =
    invoiceTypeLabels[billing.invoice_type] ??
    billing.invoice_type

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 py-1">
        <Link
          to={backHref}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className:
              "cursor-pointer gap-1.5 text-muted-foreground",
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
            <h2 className="text-lg font-semibold text-foreground">
              Billing Detail
            </h2>

            <BillingStatusBadge status={billing.status} />
          </div>

          <p className="text-sm text-muted-foreground">
            {billing.id} · {invoiceLabel} Invoice
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <BillingStatusDropdown
            billing={billing}
            onStatusChange={handleStatusChange}
          />
          {isFinalBillingStatus(billing.status) && (
            <p className="text-xs text-muted-foreground">
              Paid or cancelled billing statuses cannot be changed.
            </p>
          )}
        </div>
      </div>

      <BillingDetailContent
        billing={billing}
        engagement={engagement}
        client={client}
        onVerifyPayment={() => setVerifyOpen(true)}
      />

      <VerifyPaymentDialog
        billing={billing}
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onConfirm={handleConfirmVerification}
        onReject={handleConfirmRejection}
      />

      <Dialog
        open={Boolean(pendingStatus)}
        onOpenChange={(open) => !open && setPendingStatus("")}
      >
        <DialogContent data-slot="billing-status-confirmation">
          <DialogHeader>
            <DialogTitle>Confirm billing status change</DialogTitle>
            <DialogDescription>
              Change this billing status from{" "}
              <span className="font-medium text-foreground">
                {billingStatusLabels[billing.status] ?? billing.status}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {billingStatusLabels[pendingStatus] ?? pendingStatus}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingStatus("")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-forest-900 text-white hover:opacity-90"
              onClick={handleConfirmStatusChange}
            >
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}