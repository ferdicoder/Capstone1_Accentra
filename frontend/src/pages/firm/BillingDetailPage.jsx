import { useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { PageNotFound } from "@/components/shared/loading/page-skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  isFinalBillingStatus,
} from "@/components/firm/billing/billing-variants"
import { useFetchBilling, useUpdateBillingStatus, useUpdatePaymentStatus } from "@/hooks/useBillings"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { useFetchBusinesses } from "@/hooks/useBusinesses"

function BillingDetailSkeleton({ backHref }) {
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
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((card) => (
          <div
            key={card}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <Skeleton className="mb-5 h-4 w-40" />
            <div className="flex flex-col gap-4">
              {[0, 1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between gap-4"
                >
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function BillingDetailPage() {
  const { id } = useParams()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/billing-officer")
    ? "/billing-officer"
    : "/admin"

  const backHref = `${basePath}/billing`

  const { data: billing, isLoading, error } = useFetchBilling(id)
  const { data: allEngagements = [] } = useFetchEngagements({ includeTasks: false })
  const { data: clients = [] } = useFetchBusinesses()
  const updateStatus = useUpdateBillingStatus()
  const updatePayment = useUpdatePaymentStatus()

  const [verifyOpen, setVerifyOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState("")
  const [notice, setNotice] = useState("")

  const engagementIds =
    billing?.engagement_ids?.length > 0
      ? billing.engagement_ids
      : billing?.engagement_id
        ? [billing.engagement_id]
        : []
  const engagements = allEngagements.filter((engagement) =>
    engagementIds.includes(engagement.id)
  )

  const client =
    billing?.invoice_type === "retainer_fee"
      ? clients.find((item) => item.id === billing.business_id) ?? null
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

    updateStatus.mutate(
      { id: billing.id, status: pendingStatus },
      {
        onSuccess: () => {
          setPendingStatus("")
          showNotice(`Status updated to "${billingStatusLabels[pendingStatus] ?? pendingStatus}"`)
        },
        onError: (err) => {
          setPendingStatus("")
          showNotice(err?.message ?? "Failed to update billing status.")
        },
      }
    )
  }

  const handleConfirmVerification = (paymentMethod, referenceId) => {
    if (!billing || !paymentMethod) return

    if (paymentMethod !== "cash" && !referenceId) {
      return
    }

    const paymentId = billing.payment_id ?? billing.payments?.[0]?.payment_id
    if (!paymentId) return
    updatePayment.mutate({ paymentId, billingId: billing.id, status: "verified", referenceId }, {
      onSuccess: () => { setNotice(`${billing.id} payment verified`); setVerifyOpen(false); setTimeout(() => setNotice(""), 3000) },
      onError: (err) => showNotice(err.message),
    })
  }

  const handleConfirmRejection = (remarks) => {
    if (!billing) return

    const paymentId = billing.payment_id ?? billing.payments?.[0]?.payment_id
    if (!paymentId) return
    updatePayment.mutate({ paymentId, billingId: billing.id, status: "rejected", remark: remarks }, {
      onSuccess: () => { setVerifyOpen(false); showNotice(`${billing.id} payment rejected. Reason: ${remarks}`) },
      onError: (err) => showNotice(err.message),
    })
  }

  if (isLoading) {
    return <BillingDetailSkeleton backHref={backHref} />
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

        {error && <p className="px-2 text-sm text-destructive">{error.message}</p>}
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
            {billing.id}
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
        engagements={engagements}
        client={client}
        onVerifyPayment={() => setVerifyOpen(true)}
      />

      <VerifyPaymentDialog
        billing={billing}
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onConfirm={handleConfirmVerification}
        onReject={handleConfirmRejection}
        submitting={updatePayment.isPending}
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