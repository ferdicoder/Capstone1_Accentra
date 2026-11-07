import { useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  ImagePlus,
  Loader2,
  Upload,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BillingStatusBadge } from "@/components/firm/billing/billing-status-badge"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchBilling, useUploadPaymentProof } from "@/hooks/useBillings"
import { authStore } from "@/store/authStore"
import { getZodFieldErrors, scrollToFirstInvalidField } from "@/lib/form-validation"
import { clientPaymentProofSchema } from "@/schemas/billingSchema"

function formatCurrency(amount) {
  return `₱${Number(amount).toLocaleString("en-PH", {
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

const BILLING_TYPE_LABELS = { service_fee: "Service Fee", retainer_fee: "Retainer Fee" }
const billingTypeLabel = (type) => BILLING_TYPE_LABELS[type] ?? type ?? "Billing"

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
  const fileInputRef = useRef(null)

  const [proofFile, setProofFile] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState("gcash")
  const [referenceId, setReferenceId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  // True when the proof of payment is the field that is missing / invalid.
  // Drives the red outline and the auto-locate scroll.
  const [proofInvalid, setProofInvalid] = useState(false)
  const [referenceInvalid, setReferenceInvalid] = useState(false)

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

  usePageMeta({
    title: invoice?.id ?? "Billing Details",
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
    setReferenceInvalid(false)
  }

  const handleFileChange = (event) => {
    const input = event.target
    const file = input.files?.[0] ?? null
    clearErrors()

    if (!file) return

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]

    // Reset the input on a rejected file so picking the same file again
    // still triggers a change event.
    if (!allowedTypes.includes(file.type)) {
      setError("Upload a JPG, PNG, WEBP, or PDF file.")
      setProofInvalid(true)
      input.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The file must be 5 MB or smaller.")
      setProofInvalid(true)
      input.value = ""
      return
    }

    setProofFile(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    // Keep a reference now: event.currentTarget is cleared after the first await.
    const form = event.currentTarget
    clearErrors()
    setSuccess("")

    if (!canSubmitPayment) return

    const cleanReference = referenceId.trim()
    const validationErrors = getZodFieldErrors(clientPaymentProofSchema, {
      paymentMethod,
      referenceId: cleanReference,
      proofFile,
    })
    if (Object.keys(validationErrors).length > 0) {
      setError(
        validationErrors.proofFile ??
          validationErrors.referenceId ??
          validationErrors.paymentMethod
      )
      setProofInvalid(Boolean(validationErrors.proofFile))
      setReferenceInvalid(Boolean(validationErrors.referenceId))
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
        referenceId: cleanReference,
      })
      setSuccess("Payment submitted for verification.")
      // Clear the form so the same proof can't be submitted twice by accident.
      setProofFile(null)
      setReferenceId("")
      if (fileInputRef.current) fileInputRef.current.value = ""
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

  return (
    <div className="flex flex-1 flex-col gap-5 px-2 py-2 sm:px-4 lg:px-6">
      <BackLink />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Invoice Details
          </p>
          <h1 className="mt-1 text-xl font-semibold">
            {invoice.id}
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
                {engagementList || "—"}
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
                {formatCurrency(invoice.amount)}
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
            <div className="mt-4 flex items-center gap-3 rounded-lg border p-3">
              <FileText className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  Attached payment proof
                </p>
                <a
                  href={invoice.payment_proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm font-medium text-forest-900 hover:underline"
                >
                  {invoice.payment_proof_name ?? "View uploaded document"}
                </a>
                {invoice.payment_proof_size && (
                  <p className="text-xs text-muted-foreground">
                    {(invoice.payment_proof_size / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>
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
                    <option value="gcash">GCash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* data-invalid-field is what scrollToFirstInvalidField looks for. */}
                <div className="space-y-1.5 rounded-lg">
                  <label htmlFor="client-payment-reference" className="text-sm font-medium">
                    Payment Reference
                    <span className="ml-0.5 text-red-500">*</span>
                  </label>
                  <input
                    id="client-payment-reference"
                    value={referenceId}
                    onChange={(event) => {
                      setReferenceId(event.target.value)
                      if (referenceInvalid) setReferenceInvalid(false)
                    }}
                    aria-invalid={referenceInvalid || undefined}
                    data-invalid-field={referenceInvalid ? "true" : undefined}
                    placeholder="Enter your payment reference"
                    disabled={isSubmitting}
                    className={cn(inputClass, referenceInvalid && "border-red-500")}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Proof of Payment
                    <span className="ml-0.5 text-red-500">*</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />

                  {proofFile ? (
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <FileText className="size-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {proofFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(proofFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProofFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ""
                          }
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Remove uploaded file"
                        disabled={isSubmitting}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-invalid={proofInvalid}
                      data-invalid-field={proofInvalid ? "true" : undefined}
                      className={`flex w-full flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors hover:bg-muted/40 ${
                        proofInvalid ? "border-red-500 bg-red-50/50" : ""
                      }`}
                      disabled={isSubmitting}
                    >
                      <ImagePlus className="size-6 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Upload payment screenshot
                      </span>
                      <span className="text-xs text-muted-foreground">
                        JPG, PNG, WEBP, or PDF · Max 5 MB
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <Upload className="size-3.5" />
                        Choose file
                      </span>
                    </button>
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
    </div>
  )
}