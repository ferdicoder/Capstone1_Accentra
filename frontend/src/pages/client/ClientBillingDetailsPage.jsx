
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

import { Button } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/usePageMeta"

// Temporary mock data. Replace with an authenticated API fetch.
const mockInvoices = [
  {
    id: "INV-2026-0038",
    engagementCode: "ENG-2026-0038",
    engagementTitle: "Business Registration",
    description: "Professional service fee for business registration.",
    amount: 5000,
    status: "Unpaid",
    invoiceDate: "Oct 1, 2026",
    dueDate: "Oct 15, 2026",
  },
  {
    id: "INV-2026-0039",
    engagementCode: "ENG-2026-0039",
    engagementTitle: "Tax Filing",
    description: "Professional service fee for tax filing.",
    amount: 3500,
    status: "Under Verification",
    invoiceDate: "Oct 3, 2026",
    dueDate: "Oct 17, 2026",
  },
  {
    id: "INV-2026-0028",
    engagementCode: "ENG-2026-0028",
    engagementTitle: "BIR Compliance",
    description: "Professional service fee for BIR compliance.",
    amount: 2800,
    status: "Paid",
    invoiceDate: "Sep 10, 2026",
    dueDate: "Sep 24, 2026",
  },
]

function formatCurrency(amount) {
  return `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const statusStyles = {
  Unpaid: "bg-amber-50 text-amber-700 border-amber-200",
  "Under Verification": "bg-blue-50 text-blue-700 border-blue-200",
  "Revision Requested": "bg-orange-50 text-orange-700 border-orange-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-slate-100 text-slate-600 border-slate-200",
}

export default function ClientBillingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [proofFile, setProofFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // TODO: fetch this invoice from the API and verify client ownership.
  const invoice = mockInvoices.find((item) => item.id === id)

  const canSubmitPayment = [
    "Unpaid",
    "Revision Requested",
  ].includes(invoice?.status)

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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setError("")

    if (!file) return

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]

    if (!allowedTypes.includes(file.type)) {
      setError("Upload a JPG, PNG, WEBP, or PDF file.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The file must be 5 MB or smaller.")
      return
    }

    setProofFile(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!canSubmitPayment) return

    if (!proofFile) {
      setError("Upload your proof of payment before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Upload proofFile to Supabase Storage.
      // Then insert a payment submission record containing:
      // invoice ID, payment method, proof file path, and pending status.
      // The backend must verify invoice ownership and allowed status.

      console.log("Payment submission draft", {
        invoiceId: invoice.id,
        proofFile,
      })

      setSuccess(
        "Your proof is ready, but submission must be connected to the backend."
      )
    } catch (err) {
      setError(err?.message ?? "Unable to submit your payment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!invoice) {
    return (
      <div className="space-y-4 px-2 py-2 sm:px-4 lg:px-6">
        <Link
          to="/client/billing"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to My Billing
        </Link>

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

  return (
    <div className="flex flex-1 flex-col gap-5 px-2 py-2 sm:px-4 lg:px-6">
      <Link
        to="/client/billing"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to My Billing
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Invoice Details
          </p>
          <h1 className="mt-1 text-xl font-semibold">
            {invoice.id}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoice.engagementCode} · {invoice.engagementTitle}
          </p>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Invoice details */}
        <section className="overflow-hidden rounded-xl border bg-background">
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-muted-foreground" />
              <h2 className="font-semibold">Billing Summary</h2>

                <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                  statusStyles[invoice.status] ?? "border-border"
                }`}>
                {invoice.status}
              </span>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <p className="text-xs text-muted-foreground">
                Service / Engagement
              </p>
              <p className="mt-1 font-medium">
                {invoice.engagementTitle}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {invoice.engagementCode}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Description
              </p>
              <p className="mt-1 text-sm">
                {invoice.description}
              </p>
            </div>

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  Invoice Date
                </p>
                <p className="mt-1 text-sm font-medium">
                  {invoice.invoiceDate}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Due Date
                </p>
                <p className="mt-1 text-sm font-medium">
                  {invoice.dueDate ?? "Not specified"}
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
            {invoice.status === "Under Verification"
              ? "Payment Under Review"
              : invoice.status === "Paid"
                ? "Payment Confirmed"
                : invoice.status === "Cancelled"
                  ? "Billing Cancelled"
                  : "Submit Payment"}
          </h2>

          {!canSubmitPayment ? (
            <div className="mt-4 rounded-lg bg-muted/40 p-4">
              {invoice.status === "Under Verification" ? (
                <>
                  <Clock className="size-5 text-blue-600" />
                  <p className="mt-2 text-sm font-medium">
                    Awaiting verification
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your payment submission is being reviewed by the firm.
                  </p>
                </>
              ) : invoice.status === "Paid" ? (
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

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Proof of Payment
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
                      className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors hover:bg-muted/40"
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
