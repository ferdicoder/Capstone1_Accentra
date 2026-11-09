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
import { VerifyPaymentDialog } from "@/components/firm/billing/verify-payment-dialog"
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <Skeleton className="h-9 w-40" />
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2].map((field) => (
                <Skeleton key={field} className="h-10 w-full" />
              ))}
            </div>
          </div>
          {[0, 1].map((section) => (
            <div key={section} className="flex flex-col gap-4 p-5 sm:p-6">
              <Skeleton className="h-4 w-32" />
              <div className="grid gap-5 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
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
  const [cancelOpen, setCancelOpen] = useState(false)
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

  // A bill can be cancelled at any stage except once it is paid (or already cancelled).
  const canCancel = Boolean(billing) && !["paid", "cancelled"].includes(billing.status)

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

  const handleConfirmCancel = () => {
    if (!billing || !canCancel) {
      setCancelOpen(false)
      return
    }

    updateStatus.mutate(
      { id: billing.id, status: "cancelled" },
      {
        onSuccess: () => {
          setCancelOpen(false)
          showNotice(`${billing.id} cancelled`)
        },
        onError: (err) => {
          setCancelOpen(false)
          showNotice(err?.message ?? "Failed to cancel billing.")
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
    if (!paymentId) {
      setVerifyOpen(false)
      return showNotice("No payment has been submitted for this billing yet.")
    }
    updatePayment.mutate({ paymentId, billingId: billing.id, status: "verified", referenceId }, {
      onSuccess: () => { setNotice(`${billing.id} payment verified`); setVerifyOpen(false); setTimeout(() => setNotice(""), 3000) },
      onError: (err) => showNotice(err.message),
    })
  }

  const handleConfirmRejection = (remarks) => {
    if (!billing) return

    const paymentId = billing.payment_id ?? billing.payments?.[0]?.payment_id
    if (!paymentId) {
      setVerifyOpen(false)
      return showNotice("No payment has been submitted for this billing yet.")
    }
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

      </div>

      <BillingDetailContent
        billing={billing}
        engagements={engagements}
        client={client}
        onVerifyPayment={() => setVerifyOpen(true)}
        canCancel={canCancel}
        onCancel={() => setCancelOpen(true)}
      />

      <VerifyPaymentDialog
        billing={billing}
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onConfirm={handleConfirmVerification}
        onReject={handleConfirmRejection}
        submitting={updatePayment.isPending}
      />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent data-slot="billing-cancel-confirmation">
          <DialogHeader>
            <DialogTitle>Cancel this bill?</DialogTitle>
            <DialogDescription>
              This will cancel{" "}
              <span className="font-medium text-foreground">{billing.id}</span>.
              Any linked engagements will be released for rebilling. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
            >
              Keep Bill
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={updateStatus.isPending}
              onClick={handleConfirmCancel}
            >
              Cancel Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}