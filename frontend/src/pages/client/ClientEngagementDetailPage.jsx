import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Download,
  Eye,
  FileText,
  Search,
  Upload,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { usePageMeta } from "@/hooks/usePageMeta"
import { Button } from "@/components/ui/button"

import { getEngagementActivity } from "@/services/engagementActivityService"
import { getEngagementDeliverables } from "@/services/engagementDeliverablesService"

const engagement = {
  code: "ENG-2024-0041",
  status: "Active",
  type: "Tax Filing",
  title: "Annual Income Tax Return (BIR Form 1701)",
  due: "Apr 15, 2025",
  percentComplete: 55,
  task: {
    clientName: "Maria Santos",
    businessName: "Santos Retail Trading",
    tin: "123-456-789-000",
    rdo: "RDO 052 – Pasig City",
    email: "maria.santos@santosretail.com",
    phone: "+63 917 555 1234",
  },
  serviceInfo: {
    serviceType: "Tax Filing",
    taxForm: "BIR Form 1701",
    complianceCategory: "Income Tax",
    periodCovered: "Taxable Year 2024",
    filingDeadline: "April 15, 2025",
    assignedCpa: "Atty. Roland Reyes, CPA",
  },
}

const WORKFLOW_STEPS = [
  "Documentation Collection",
  "Document Verification",
  "Processing",
  "Approval",
  "Payment",
]
const CURRENT_STEP_INDEX = 2 // "Processing" — swap for real workflow state from the API

const initialActivityLog = [
  {
    id: "log-1",
    title: "Request Submitted",
    date: "Nov 28, 2024",
    description: "Client submitted via portal",
    done: true,
  },
  {
    id: "log-2",
    title: "Request Approved",
    date: "Nov 28, 2024",
    description: "Approved by R&A CPA",
    done: true,
  },
  {
    id: "log-3",
    title: "Document Checklist Sent",
    date: "Nov 30, 2024",
    description: "5 required documents listed",
    done: true,
  },
  {
    id: "log-4",
    title: "Documents Submitted",
    date: "Dec 6, 2024",
    description: "3 of 5 submitted",
    done: true,
  },
  {
    id: "log-5",
    title: "Documents Reviewed",
    date: "Dec 8, 2024",
    description: "2 documents flagged for revision",
    done: true,
  },
  { id: "log-6", title: "Processing / Filing", done: false },
  { id: "log-7", title: "Billing Issued", done: false },
  { id: "log-8", title: "Payment Confirmed", done: false },
  { id: "log-9", title: "Service Completed", done: false },
]

const initialDocuments = [
  {
    id: "doc-1",
    name: "BIR Form 1701 – Signed Copy",
    file: "BIR_1701_2024.pdf",
    required: true,
    status: "Approved",
    uploadedBy: "Maria S.",
    date: "Dec 6, 2024",
    size: "1.2 MB",
  },
  {
    id: "doc-2",
    name: "Bank Statements (Jan–Dec 2024)",
    file: "BankStatements_2024.pdf",
    required: true,
    status: "Approved",
    uploadedBy: "Maria S.",
    date: "Dec 6, 2024",
    size: "4.8 MB",
  },
  {
    id: "doc-3",
    name: "Official Receipts / Invoice Booklet",
    file: "OR_Booklet.pdf",
    required: true,
    status: "For Review",
    uploadedBy: "Maria S.",
    date: "Dec 6, 2024",
    size: "2.1 MB",
    remark:
      "Incomplete — Jan to Jun ORs are missing. Please upload the complete booklet covering January–December 2024.",
  },
  {
    id: "doc-4",
    name: "Books of Accounts",
    required: true,
    status: "Missing",
  },
  {
    id: "doc-5",
    name: "Certificate of Withholding Tax (2316)",
    required: true,
    status: "Missing",
  },
]

const documentStatusStyles = {
  Approved: "bg-green-50 text-green-700 border border-green-200",
  "For Review": "bg-amber-50 text-amber-700 border border-amber-200",
  Missing: "bg-red-50 text-red-700 border border-red-200",
}

const initialDeliverables = [
  {
    id: "del-1",
    file_name: "Filed_ITR_2024.pdf",
    file_size: 842000,
    created_at: "Apr 18, 2025",
    signedUrl: null,
  },
  {
    id: "del-2",
    file_name: "BIR_Acknowledgement_Receipt.pdf",
    file_size: 210000,
    created_at: "Apr 18, 2025",
    signedUrl: null,
  },
]

function formatBytes(bytes) {
  if (!bytes) return "—"
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

export default function ClientEngagementDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [documentSearch, setDocumentSearch] = useState("")
  const [activityLog, setActivityLog] = useState(initialActivityLog)
  const [isActivityLoading, setIsActivityLoading] = useState(false)
  const [deliverables, setDeliverables] = useState(initialDeliverables)
  const [isDeliverablesLoading, setIsDeliverablesLoading] = useState(false)

  const filteredDocuments = initialDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(documentSearch.toLowerCase())
  )

  const flaggedForReview = initialDocuments.filter(
    (d) => d.status === "For Review"
  ).length

  const isCompleted = engagement.status === "Completed"
  const activeStepIndex = isCompleted
    ? WORKFLOW_STEPS.length - 1
    : CURRENT_STEP_INDEX
  const percentComplete = isCompleted ? 100 : engagement.percentComplete

  // Read-only: per S4-13, the client sees the activity timeline but never
  // posts or deletes entries — that's S4-11/S4-12, firm-side only. This
  // just loads the log; falls back to the mock data above if the fetch
  // fails, so the page still has something to show during development.
  useEffect(() => {
    let isMounted = true

    async function loadActivity() {
      setIsActivityLoading(true)
      const { data, error } = await getEngagementActivity(id)

      if (!isMounted) return

      if (error) {
        console.error("Failed to load activity log:", error)
        // keep showing the mock/initial data as a fallback
      } else if (data) {
        setActivityLog(data)
      }

      setIsActivityLoading(false)
    }

    loadActivity()

    return () => {
      isMounted = false
    }
  }, [id])

  // Deliverables: read-only, client-side, per S4-16's DoD ("Client can
  // see and download deliverables via signed URL"). Uploading/deleting
  // is S4-14/S4-15, firm-side only.
  useEffect(() => {
    let isMounted = true

    async function loadDeliverables() {
      setIsDeliverablesLoading(true)
      const { data, error } = await getEngagementDeliverables(id)

      if (!isMounted) return

      if (error) {
        console.error("Failed to load deliverables:", error)
        // keep showing the mock/initial data as a fallback
      } else if (data) {
        setDeliverables(data)
      }

      setIsDeliverablesLoading(false)
    }

    loadDeliverables()

    return () => {
      isMounted = false
    }
  }, [id])

  usePageMeta({
    title: engagement.code,
    breadcrumbs: [
      { label: "Home", href: "/client/dashboard" },
      { label: "Engagements", href: "/client/engagements" },
    ],
    hasUnreadNotifications: true,
  })

  return (
    <div className="flex flex-1 flex-col gap-4 px-2 py-2">
          <Link
            to="/client/engagements"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Engagements
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {engagement.code}
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {engagement.status}
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {engagement.type}
                </span>
              </div>
              <h1 className="mt-2 text-xl font-semibold">
                {engagement.title}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Due <span className="font-medium text-red-600">{engagement.due}</span>
            </p>
          </div>

          {/* Workflow progress */}
          <div className="rounded-xl border bg-background p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Workflow Progress</h2>
              <span className="text-sm font-medium text-emerald-700">
                {isCompleted ? "Completed" : `${percentComplete}% complete`}
              </span>
            </div>
            <div className="flex items-center">
              {WORKFLOW_STEPS.map((step, i) => {
                const isDone = i <= activeStepIndex
                const isLast = i === WORKFLOW_STEPS.length - 1
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      {isDone ? (
                        <CheckCircle2 className="size-5 text-emerald-600" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground/40" />
                      )}
                      <span
                        className={`whitespace-nowrap text-xs ${
                          isDone
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={`mx-1 h-px flex-1 ${
                          i < activeStepIndex
                            ? "bg-emerald-400"
                            : "bg-muted-foreground/20"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`-mb-px border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === "documents"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Documents
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {initialDocuments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`-mb-px border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === "activity"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab("deliverables")}
              className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === "deliverables"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Deliverables
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {deliverables.length}
              </span>
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-background p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  Task
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Client Name
                    </dt>
                    <dd className="font-medium">
                      {engagement.task.clientName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Business Name
                    </dt>
                    <dd className="font-medium">
                      {engagement.task.businessName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">TIN</dt>
                    <dd className="font-medium">{engagement.task.tin}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">RDO</dt>
                    <dd className="font-medium">{engagement.task.rdo}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Email</dt>
                    <dd className="font-medium">{engagement.task.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{engagement.task.phone}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border bg-background p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  Service Information
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Service Type
                    </dt>
                    <dd className="font-medium">
                      {engagement.serviceInfo.serviceType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Tax Form
                    </dt>
                    <dd className="font-medium">
                      {engagement.serviceInfo.taxForm}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Compliance Category
                    </dt>
                    <dd className="font-medium">
                      {engagement.serviceInfo.complianceCategory}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Period Covered
                    </dt>
                    <dd className="font-medium">
                      {engagement.serviceInfo.periodCovered}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Filing Deadline
                    </dt>
                    <dd className="font-medium text-red-600">
                      {engagement.serviceInfo.filingDeadline}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Assigned CPA
                    </dt>
                    <dd className="font-medium">
                      {engagement.serviceInfo.assignedCpa}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="rounded-xl border bg-background p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Activity Timeline</h3>
                <span className="text-xs text-muted-foreground">
                  Read only — updates are posted by your firm
                </span>
              </div>

              {isActivityLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <ul className="space-y-5">
                  {activityLog.map((log) => (
                    <li key={log.id} className="flex items-start gap-3">
                      {log.done ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/30" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${
                            log.done
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {log.title}
                        </p>
                        {log.date && (
                          <p className="text-xs text-muted-foreground">
                            {log.date}
                          </p>
                        )}
                        {log.description && (
                          <p className="text-xs text-muted-foreground">
                            {log.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}

                  {activityLog.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No activity yet.
                    </p>
                  )}
                </ul>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative max-w-sm flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    className="pl-9"
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                  />
                </div>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                  Review Documents ({flaggedForReview})
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border bg-background">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[26%]" />
                    <col className="w-[10%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[8%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-3.5 align-middle font-medium">
                        Document Name
                      </th>
                      <th className="px-4 py-3.5 align-middle font-medium">
                        Required
                      </th>
                      <th className="px-4 py-3.5 align-middle font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3.5 align-middle font-medium">
                        Uploaded By
                      </th>
                      <th className="px-4 py-3.5 align-middle font-medium">
                        Date
                      </th>
                      <th className="px-4 py-3.5 align-middle font-medium">
                        Size
                      </th>
                      <th className="px-4 py-3.5 text-right align-middle font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <>
                        <tr
                          key={doc.id}
                          className="border-b last:border-b-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-4 align-middle">
                            <p className="truncate font-medium">{doc.name}</p>
                            {doc.file && (
                              <p className="truncate text-xs text-muted-foreground">
                                {doc.file}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                              {doc.required ? "Required" : "Optional"}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <span
                              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${documentStatusStyles[doc.status]}`}
                            >
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle text-muted-foreground">
                            {doc.uploadedBy ?? "—"}
                          </td>
                          <td className="px-4 py-4 align-middle text-muted-foreground">
                            {doc.date ?? "—"}
                          </td>
                          <td className="px-4 py-4 align-middle text-muted-foreground">
                            {doc.size ?? "—"}
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <div className="flex items-center justify-end gap-2">
                              {doc.status === "For Review" && (
                                <button
                                  title="Preview"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Eye className="size-4" />
                                </button>
                              )}
                              <button
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                                  doc.status === "For Review"
                                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                <Upload className="size-3.5" />
                                {doc.status === "For Review"
                                  ? "Re-upload"
                                  : "Upload"}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {doc.remark && (
                          <tr key={`${doc.id}-remark`} className="border-b bg-amber-50/60">
                            <td colSpan={7} className="px-4 py-2.5 text-xs text-amber-800">
                              <span className="font-medium">
                                Firm Remark — Revision Required:
                              </span>{" "}
                              {doc.remark}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}

                    {filteredDocuments.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-sm text-muted-foreground"
                        >
                          No documents match "{documentSearch}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "deliverables" && (
            <div className="rounded-xl border bg-background p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Final Deliverables</h3>
                <span className="text-xs text-muted-foreground">
                  Files uploaded by your firm — download links expire after
                  10 minutes
                </span>
              </div>

              {isDeliverablesLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : deliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No deliverables have been uploaded yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {deliverables.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {file.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.created_at} · {formatBytes(file.file_size)}
                        </p>
                      </div>
                      {file.signedUrl ? (
                        <a
                          href={file.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                        >
                          <Download className="size-3.5" />
                          Download
                        </a>
                      ) : (
                        <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-muted-foreground/50">
                          <Download className="size-3.5" />
                          Unavailable
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
  )
}