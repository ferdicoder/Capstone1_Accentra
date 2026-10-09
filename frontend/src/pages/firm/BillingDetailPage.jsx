import { useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { PageNotFound } from "@/components/shared/loading/page-skeleton"
import { buttonVariants } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/usePageMeta"
import { BillingDetailContent } from "@/components/firm/billing/billing-detail-content"
import { BillingStatusBadge } from "@/components/firm/billing/billing-status-badge"
import { BillingStatusDropdown } from "@/components/firm/billing/billing-status-dropdown"
import { VerifyPaymentDialog } from "@/components/firm/billing/verify-payment-dialog"
import { CancelBillingDialog } from "@/components/firm/billing/cancel-billing-dialog"
import {
  billingStatusLabels,
  invoiceTypeLabels,
} from "@/components/firm/billing/billing-variants"
import { useFetchBilling, useUpdateBillingStatus, useUpdatePaymentStatus } from "@/hooks/useBillings"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { useFetchBusinesses } from "@/hooks/useBusinesses"

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

  const engagements =
  billing?.invoice_type === "service_fee"
    ? allEngagements.filter((engagement) => {
        const engagementIds =
          billing.engagement_ids?.length > 0
            ? billing.engagement_ids
            : billing.engagement_id
              ? [billing.engagement_id]
              : []

        return engagementIds.includes(engagement.id)
      })
    : []

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
    if (!billing || billing.status === status) return

    if (status === "cancelled") {
      setCancelOpen(true)
      return
    }

    updateStatus.mutate({ id: billing.id, status }, {
      onSuccess: () => showNotice(`Status updated to "${billingStatusLabels[status] ?? status}"`),
      onError: (err) => showNotice(err.message),
    })
  }

  const handleConfirmCancellation = () => {
    if (!billing) return

    updateStatus.mutate({ id: billing.id, status: "cancelled" }, {
      onSuccess: () => { setCancelOpen(false); showNotice(`${billing.id} cancelled`) },
      onError: (err) => showNotice(err.message),
    })
  }

 const handleConfirmVerification = (paymentMethod, referenceId) => {
  if (!billing || !paymentMethod) return

  if (paymentMethod !== "cash" && !referenceId) {
    return
  }

  const payment = billing.payments?.find((item) => item.status === "pending")
  if (!payment) return
  updatePayment.mutate({ paymentId: payment.payment_id, billingId: billing.id, status: "verified", referenceId }, {
    onSuccess: () => { setNotice(`${billing.id} payment verified`); setVerifyOpen(false); setTimeout(() => setNotice(""), 3000) },
    onError: (err) => showNotice(err.message),
  })
}

  const handleConfirmRejection = () => {
    if (!billing) return

    const payment = billing.payments?.find((item) => item.status === "pending")
    if (!payment) return
    updatePayment.mutate({ paymentId: payment.payment_id, billingId: billing.id, status: "rejected" }, {
      onSuccess: () => { setVerifyOpen(false); showNotice(`${billing.id} payment rejected`) },
      onError: (err) => showNotice(err.message),
    })
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

        {isLoading && <p className="px-2 text-sm text-muted-foreground">Loading billing record…</p>}
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

        <BillingStatusDropdown
          billing={billing}
          onStatusChange={handleStatusChange}
        />
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