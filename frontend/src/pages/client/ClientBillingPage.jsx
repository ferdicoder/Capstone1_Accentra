import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Upload,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/usePageMeta"

// --- Mock data (swap for real fetches once wired to Supabase) ------------

const initialInvoices = [
  {
    id: "INV-2024-0038",
    engagementCode: "ENG-2024-0038",
    engagementTitle: "Business Permit Renewal",
    amount: 2800,
    status: "Paid",
    paidDate: "Dec 12, 2024",
    invoiceDate: "Dec 1, 2024",
    items: [
      { label: "Permit Renewal Processing Fee", amount: 2300 },
      { label: "LGU Filing Fee", amount: 500 },
    ],
  },
]

const paymentHistory = [
  {
    id: "PAY-0038",
    date: "Dec 12, 2024",
    method: "GCash",
    amount: 2800,
    status: "Confirmed",
  },
  {
    id: "PAY-0031",
    date: "Nov 5, 2024",
    method: "BPI Online",
    amount: 1800,
    status: "Confirmed",
  },
  {
    id: "PAY-0027",
    date: "Oct 15, 2024",
    method: "GCash",
    amount: 1500,
    status: "Confirmed",
  },
]

const statusStyles = {
  Unpaid: "bg-amber-50 text-amber-700 border border-amber-200",
  Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
}

function formatCurrency(amount) {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
}

export default function ClientBillingPage() {
  const navigate = useNavigate()
  const [invoices] = useState(initialInvoices)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(
    initialInvoices.find((inv) => inv.status === "Unpaid")?.id ??
      initialInvoices[0]?.id ??
      null
  )
  const [referenceNumber, setReferenceNumber] = useState("")
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")

  const selectedInvoice =
    invoices.find((inv) => inv.id === selectedInvoiceId) ?? null

  const unpaidCount = invoices.filter((inv) => inv.status === "Unpaid").length

  usePageMeta({
    title: "Billing & Payment",
    breadcrumbs: [{ label: "Home", href: "/client/dashboard" }],
    hasUnreadNotifications: true,
    onRequestServiceClick: () => navigate("/client/service-requests"),
  })

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setScreenshotFile(file)
    setSubmitError("")
  }

  const handleSubmitPayment = (e) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitSuccess("")

    if (!selectedInvoice || selectedInvoice.status !== "Unpaid") {
      setSubmitError("Select an unpaid invoice before submitting payment.")
      return
    }
    if (!screenshotFile) {
      setSubmitError("Please attach a screenshot of your payment.")
      return
    }

    // TODO: replace with real upload + insert into the payments table.
    setSubmitSuccess(
      `Payment proof for ${selectedInvoice.id} submitted. The firm will confirm it shortly.`
    )
    setReferenceNumber("")
    setScreenshotFile(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-2 py-2 sm:px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold sm:text-xl">
            Billing &amp; Payment
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your invoices and submit proof of payment
          </p>
        </div>

        {unpaidCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <AlertCircle className="size-3.5" />
            {unpaidCount} unpaid invoice{unpaidCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* LEFT: invoice list + selected invoice detail */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {invoices.map((invoice) => {
              const isSelected = invoice.id === selectedInvoiceId
              return (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  className={`flex items-start justify-between gap-3 rounded-xl border bg-background p-4 text-left transition-colors hover:bg-muted/40 ${
                    isSelected
                      ? "border-emerald-300 ring-1 ring-emerald-200"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {invoice.id}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {invoice.engagementCode} · {invoice.engagementTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[invoice.status]}`}
                    >
                      {invoice.status}
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(invoice.amount)}
                    </p>
                    <p
                      className={`text-xs ${
                        invoice.status === "Unpaid"
                          ? "text-red-600"
                          : "text-emerald-700"
                      }`}
                    >
                      {invoice.status === "Unpaid"
                        ? `Due ${invoice.dueDate}`
                        : `Paid ${invoice.paidDate}`}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {selectedInvoice && (
            <div className="rounded-xl border bg-background p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Invoice Detail — {selectedInvoice.id}
                </h3>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline"
                  onClick={() =>
                    console.log("Open PDF for", selectedInvoice.id)
                  }
                >
                  <Eye className="size-3.5" />
                  View PDF
                </button>
              </div>

              <div className="divide-y divide-border text-sm">
                {selectedInvoice.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2 text-muted-foreground"
                  >
                    <span>{item.label}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2.5 text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.amount)}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 rounded-lg bg-muted/40 p-3.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Invoice Date</span>
                  <span className="font-medium text-foreground">
                    {selectedInvoice.invoiceDate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium text-foreground">
                    {selectedInvoice.dueDate ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Engagement</span>
                  <span className="font-medium text-foreground">
                    {selectedInvoice.engagementCode} ·{" "}
                    {selectedInvoice.engagementTitle}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: submit payment + payment history */}
        <div className="flex flex-col gap-4">
          <form
            onSubmit={handleSubmitPayment}
            className="rounded-xl border bg-background p-5"
          >
            <h3 className="text-sm font-semibold text-foreground">
              Submit Payment
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Transfer to the firm&rsquo;s account and submit your reference
              number.
            </p>

            <div className="mt-4 rounded-lg border bg-muted/30 p-3.5 text-xs text-muted-foreground">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                Payment Methods
              </p>
              <p>GCash: 0917-555-1234</p>
              <p>BPI: 1234-5678-90</p>
              <p>Account Name: Reyes &amp; Associates CPA</p>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label
                htmlFor="referenceNumber"
                className="text-xs font-medium text-foreground"
              >
                Reference Number{" "}
                <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Input
                id="referenceNumber"
                placeholder="e.g. GCash Ref. #1234567890"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">
                Payment Screenshot{" "}
                <span className="text-red-500">(Required)</span>
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground transition-colors hover:border-emerald-300 hover:bg-muted/30">
                <Upload className="size-4 shrink-0" />
                <span className="truncate">
                  {screenshotFile ? screenshotFile.name : "Upload screenshot"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScreenshotChange}
                />
              </label>
            </div>

            {submitError && (
              <p className="mt-3 text-xs text-red-600">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                {submitSuccess}
              </p>
            )}

            <Button
              type="submit"
              disabled={!selectedInvoice || selectedInvoice.status !== "Unpaid"}
              className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Submit Payment
              {selectedInvoice ? ` — ${formatCurrency(selectedInvoice.amount)}` : ""}
            </Button>
          </form>

          <div className="rounded-xl border bg-background p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Payment History
            </h3>
            <ul className="divide-y divide-border">
              {paymentHistory.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {payment.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.date} · {payment.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="flex items-center justify-end gap-1 text-xs text-emerald-700">
                      <CheckCircle2 className="size-3 shrink-0" />
                      {payment.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}