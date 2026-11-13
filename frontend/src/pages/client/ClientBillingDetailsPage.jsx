import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Upload,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BillingStatusBadge } from "@/components/firm/billing/billing-status-badge"
import {
  billingDisplayId,
  invoiceTypeLabels,
  paymentMethodOptions,
} from "@/components/firm/billing/billing-variants"
import {
  FileDropzone,
  FilePreviewDialog,
  SelectedFileList,
} from "@/components/shared/file-preview-dialog"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchBilling, useUploadPaymentProof } from "@/hooks/useBillings"
import { authStore } from "@/store/authStore"
import { getZodFieldErrors, scrollToFirstInvalidField } from "@/lib/form-validation"
import { clientPaymentProofSchema } from "@/schemas/billingSchema"

function formatCurrency(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return "Fee unavailable"
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Date-only strings ("2026-03-01") are read as LOCAL dates so they never
// show as the previous day.
function formatDate(value) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = match ? new Date(+match[1], +match[2] - 1, +match[3]) : new Date(value)
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const billingTypeLabel = (type) => invoiceTypeLabels[type] ?? type ?? "Billing"

const paymentStatusLabels = {
  "for verification": "Payment Under Review",
  "for resubmission": "Payment Proof Rejected",
}

const paymentStatusStyles = {
  "for verification": "bg-blue-50 text-blue-700 border-blue-200",
  "for resubmission": "bg-orange-50 text-orange-700 border-orange-200",
}

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

// Proof of payment rules: JPG, PNG, WEBP or PDF, up to 5 MB.
const PROOF_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf"
const PROOF_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const PROOF_MAX_SIZE = 5 * 1024 * 1024

function BackLink() {
  return (
    <Link
      to="/client/billing"
      className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to My Billing
    </Link>
  )
}

export default function ClientBillingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [proofFile, setProofFile] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState("gcash")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  // True when the proof of payment is the field that is missing / invalid.
  // Drives the red outline and the auto-locate scroll.
  const [proofInvalid, setProofInvalid] = useState(false)
  // Which file the shared preview dialog is showing (null = closed).
  const [previewFile, setPreviewFile] = useState(null)

  const user = authStore((state) => state.user)
  const { data: business, isLoading: businessLoading } = useFetchMyBusiness(user?.id)
  const { data: invoice, isLoading, error: queryError } = useFetchBilling(id)
  const uploadProof = useUploadPaymentProof()

  const paymentStatus = ["for verification", "for resubmission"].includes(invoice?.status)
    ? invoice.status
    : null
  const paymentStatusLabel = paymentStatusLabels[paymentStatus]
  const hasUploadedProof = Boolean(invoice?.payment_proof_url)
  const canSubmitPayment =
    ["pending", "overdue", "for resubmission"].includes(invoice?.status)
  const typeLabel = billingTypeLabel(invoice?.billing_type ?? invoice?.invoice_type)
  const isRetainerFee = (invoice?.billing_type ?? invoice?.invoice_type) === "retainer_fee"
  const amountDue = isRetainerFee
    ? invoice?.retainerFee ?? business?.retainerFee ?? invoice?.amount
    : invoice?.amount

  usePageMeta({
    title: invoice ? billingDisplayId(invoice) : "Billing Details",
    breadcrumbs: [
      { label: "Home", href: "/client/dashboard" },
      { label: "My Billing", href: "/client/billing" },
    ],
    hasUnreadNotifications: true,
    onRequestServiceClick: () =>
      navigate("/client/service-requests"),
  })

  const clearErrors = () => {
    setError("")
    setProofInvalid(false)
  }

  // The shared <FileDropzone /> already checked the file type and the 5 MB
  // limit and shows its own message for a rejected file.
  const handleFileSelected = ([file]) => {
    clearErrors()
    if (file) setProofFile(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    // Keep a reference now: event.currentTarget is cleared after the first await.
    const form = event.currentTarget
    clearErrors()
    setSuccess("")

    if (!canSubmitPayment) return

    const validationErrors = getZodFieldErrors(clientPaymentProofSchema, {
      paymentMethod,
      proofFile,
    })
    if (Object.keys(validationErrors).length > 0) {
      setError(
        validationErrors.proofFile ??
          validationErrors.paymentMethod
      )
      setProofInvalid(Boolean(validationErrors.proofFile))
      scrollToFirstInvalidField(form)
      return
    }

    setIsSubmitting(true)

    try {
      if (invoice.business_id !== business?.id) throw new Error("This billing record does not belong to your business.")
      await uploadProof.mutateAsync({
        file: proofFile,
        billingId: invoice.id,
        paymentMethod,
        uploadedBy: user?.id,
      })
      setSuccess("Payment submitted for verification.")
      // Clear the form so the same proof can't be submitted twice by accident.
      setProofFile(null)
    } catch (err) {
      setError(err?.message ?? "Unable to submit your payment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || businessLoading) {
    return <p className="p-8 text-sm text-muted-foreground">Loading billing…</p>
  }

  // A client must only ever see their own invoices. This hides another
  // client's invoice in the UI; the backend must also refuse to return it.
  const notMine = invoice && invoice.business_id !== business?.id

  if (!invoice || queryError || notMine) {
    return (
      <div className="space-y-4 px-2 py-2 sm:px-4 lg:px-6">
        <BackLink />

        <div className="rounded-xl border p-8 text-center">
          <FileText className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-3 font-semibold">
            Billing Record Not Found
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This invoice may no longer be available.
          </p>
        </div>
      </div>
    )
  }

  const engagementList = invoice.billing_engagements
    ?.map((item) => item.engagement_id)
    .join(", ")

  // The already-submitted proof, in the shape the shared preview dialog reads.
  // The file type is worked out from the file name when no mime type is saved.
  const uploadedProofFile = hasUploadedProof
    ? {
        id: `payment-proof-${invoice.id}`,
        name: invoice.payment_proof_name ?? "Payment proof",
        mimeType: invoice.payment_proof_mime_type ?? null,
        size: invoice.payment_proof_size ?? null,
        downloadUrl: invoice.payment_proof_url,
      }
    : null

  return (
    <div className="flex flex-1 flex-col gap-5 px-2 py-2 sm:px-4 lg:px-6">
      <BackLink />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Invoice Details
          </p>
          <h1 className="mt-1 text-xl font-semibold">
            {billingDisplayId(invoice)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {typeLabel}
          </p>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Invoice details */}
        <section className="overflow-hidden rounded-xl border bg-background">
          <div className="border-b p-5">
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="size-5 text-muted-foreground" />
              <h2 className="font-semibold">Billing Summary</h2>
              <BillingStatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <p className="text-xs text-muted-foreground">
                Service / Engagement
              </p>
              <p className="mt-1 font-medium">
                {invoice.billing_engagements?.[0]?.service_name ?? typeLabel}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRetainerFee ? formatCurrency(amountDue) : engagementList || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Description
              </p>
              <p className="mt-1 text-sm">
                Billing for {typeLabel}
              </p>
            </div>

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  Invoice Date
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(invoice.invoiceDate ?? invoice.created_at) ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Due Date
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(invoice.dueDate) ?? "Not specified"}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">
                Total Amount Due
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatCurrency(amountDue)}
              </p>
            </div>
          </div>
        </section>

        {/* Payment submission */}
        <section className="rounded-xl border bg-background p-5">
          <h2 className="font-semibold">
            {paymentStatusLabel
              ? paymentStatusLabel
              : invoice.status === "paid"
                ? "Payment Confirmed"
                : invoice.status === "cancelled"
                  ? "Billing Cancelled"
                  : "Submit Payment"}
          </h2>

          {hasUploadedProof && (
            <div className="mt-4 flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">
                Attached payment proof
              </p>
              <SelectedFileList
                files={[uploadedProofFile]}
                onPreview={(file) => setPreviewFile(file)}
              />
            </div>
          )}

          {!canSubmitPayment ? (
            <div className="mt-4 rounded-lg bg-muted/40 p-4">
              {paymentStatus === "for verification" ? (
                <>
                  <Clock className="size-5 text-blue-600" />
                  <p className="mt-2 text-sm font-medium">
                    Awaiting verification
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your payment submission is being reviewed by the firm.
                  </p>
                </>
              ) : invoice.status === "paid" ? (
                <>
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <p className="mt-2 text-sm font-medium">
                    Payment verified
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    No further payment action is required for this invoice.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This invoice is not available for payment submission.
                </p>
              )}
            </div>
          ) : (
            <>
              {paymentStatus && (
                <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                  paymentStatusStyles[paymentStatus] ?? "border-border"
                }`}>
                  {paymentStatusLabel ?? paymentStatus}
                </div>
              )}

              {paymentStatus === "for resubmission" && (
                <div className="mt-3">
                  <p className="text-sm text-orange-700">
                    {invoice.remark ||
                      "Your previous payment proof was rejected."}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload a new proof to submit another payment attempt.
                  </p>
                </div>
              )}

              <p className="mt-1 text-sm text-muted-foreground">
                Pay using an accepted method, then upload your proof of payment.
              </p>

              <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Payment Instructions
                </p>
                <p className="mt-2">
                  GCash: Use the firm's confirmed payment number.
                </p>
                <p className="mt-1">
                  Bank Transfer: Use the firm's confirmed bank details.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="client-payment-method" className="text-sm font-medium">
                    Payment Method
                  </label>
                  <select
                    id="client-payment-method"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    disabled={isSubmitting}
                    className={inputClass}
                  >
                    {paymentMethodOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* data-invalid-field is what scrollToFirstInvalidField looks for. */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Proof of Payment
                    <span className="ml-0.5 text-red-500">*</span>
                  </label>

                  {proofFile ? (
                    <SelectedFileList
                      files={[proofFile]}
                      disabled={isSubmitting}
                      onRemove={() => setProofFile(null)}
                      onPreview={(file) => setPreviewFile(file)}
                    />
                  ) : (
                    <div
                      aria-invalid={proofInvalid || undefined}
                      data-invalid-field={proofInvalid ? "true" : undefined}
                      className={cn(
                        "rounded-lg",
                        proofInvalid && "ring-1 ring-red-500"
                      )}
                    >
                      <FileDropzone
                        accept={PROOF_ACCEPT}
                        allowedTypes={PROOF_ALLOWED_TYPES}
                        maxSize={PROOF_MAX_SIZE}
                        typeLabel="JPG, PNG, WEBP, or PDF"
                        title="Upload payment screenshot"
                        disabled={isSubmitting}
                        onSelect={handleFileSelected}
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-600">
                    {error}
                  </p>
                )}

                {success && (
                  <p role="status" className="text-sm text-emerald-700">
                    {success}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Your payment will remain pending until the firm verifies it.
                </p>
              </form>
            </>
          )}
        </section>
      </div>

      <FilePreviewDialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        files={previewFile ? [previewFile] : []}
        subtitle={`Payment proof for ${billingDisplayId(invoice)}`}
        allowDownload={Boolean(previewFile?.downloadUrl)}
      />
    </div>
  )
}