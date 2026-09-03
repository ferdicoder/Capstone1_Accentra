import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  Clock,
  Download,
  Eye,
  FileText,
  Search,
  Upload,
  X,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { usePageMeta } from "@/hooks/usePageMeta"
import { Button } from "@/components/ui/button"
import { supabase } from "@/config/supabase.js"
import { WorkflowProgress } from "@/components/firm/engagements/WorkflowProgress"


// --- Inline data access (no separate service files) --------------------
//
// Table assumption: "engagement_activity"
//   id, engagement_id, type, message, actor, created_at
//
// Table assumption: "metadata_document" (per the ERD), filtered to
// document_type = 'deliverables' for this engagement:
//   document_id, engagement_id, business_id, bucket_name, object_key,
//   file_name, file_size, status, document_type, created_at, updated_at
//
// Adjust table/column names below to match your actual schema.

const ACTIVITY_TABLE = "engagement_activity"
const DOCUMENT_TABLE = "metadata_document"
const DELIVERABLE_TYPE = "deliverables"
const SIGNED_URL_EXPIRY_SECONDS = 60 * 10 // matches the "10 minutes" copy in the UI below

async function fetchEngagementActivity(engagementId) {
  try {
    const { data, error } = await supabase
      .from(ACTIVITY_TABLE)
      .select("*")
      .eq("engagement_id", engagementId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return { data, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err.message }
  }
}

async function fetchEngagementDeliverables(engagementId) {
  try {
    const { data, error } = await supabase
      .from(DOCUMENT_TABLE)
      .select("*")
      .eq("engagement_id", engagementId)
      .eq("document_type", DELIVERABLE_TYPE)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

    // Each row only stores where the file lives (bucket_name/object_key), not
    // a public URL, so mint a short-lived signed URL per file here.
    const withSignedUrls = await Promise.all(
      (data ?? []).map(async (doc) => {
        if (!doc.bucket_name || !doc.object_key) {
          return { ...doc, signedUrl: null }
        }

        const { data: signed, error: signError } = await supabase.storage
          .from(doc.bucket_name)
          .createSignedUrl(doc.object_key, SIGNED_URL_EXPIRY_SECONDS)

        if (signError) {
          console.error(`Failed to sign URL for ${doc.object_key}:`, signError)
          return { ...doc, signedUrl: null }
        }

        return { ...doc, signedUrl: signed?.signedUrl ?? null }
      })
    )

    return { data: withSignedUrls, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err.message }
  }
}
// -------------------------------------------------------------------------


const engagement = {
  code: "ENG-2024-0041",
  status: "Active",
  type: "Tax Filing",
  title: "Annual Income Tax Return (BIR Form 1701)",
  due: "Apr 15, 2025",
  workflowStage: "document-verification", // must match a `key` in workflowStages (engagement-variants)
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

const initialActivityLog = [
  {
    id: "log-1",
    title: "Request Submitted",
    date: "Nov 28, 2024",
    description: "Client submitted via portal",
    actor: "Maria Santos",
    done: true,
  },
  {
    id: "log-2",
    title: "Request Approved",
    date: "Nov 28, 2024",
    description: "Approved by R&A CPA",
    actor: "Atty. Roland Reyes, CPA",
    done: true,
  },
  {
    id: "log-3",
    title: "Document Checklist Sent",
    date: "Nov 30, 2024",
    description: "5 required documents listed",
    actor: "Atty. Roland Reyes, CPA",
    done: true,
  },
  {
    id: "log-4",
    title: "Documents Submitted",
    date: "Dec 6, 2024",
    description: "3 of 5 submitted",
    actor: "Maria Santos",
    done: true,
  },
  {
    id: "log-5",
    title: "Documents Reviewed",
    date: "Dec 8, 2024",
    description: "2 documents flagged for revision",
    actor: "Atty. Roland Reyes, CPA",
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
    size: "1.2 MB",
    deadline: "Dec 5, 2024",
  },
  {
    id: "doc-2",
    name: "Bank Statements (Jan–Dec 2024)",
    file: "BankStatements_2024.pdf",
    required: true,
    status: "Approved",
    uploadedBy: "Maria S.",
    size: "4.8 MB",
    deadline: "Dec 5, 2024",
  },
  {
    id: "doc-3",
    name: "Official Receipts / Invoice Booklet",
    file: "OR_Booklet.pdf",
    required: true,
    status: "For Review",
    uploadedBy: "Maria S.",
    size: "2.1 MB",
    deadline: "Dec 10, 2024",
    remark:
      "Incomplete — Jan to Jun ORs are missing. Please upload the complete booklet covering January–December 2024.",
  },
  {
    id: "doc-4",
    name: "Books of Accounts",
    required: true,
    status: "Missing",
    deadline: "Dec 12, 2024",
  },
  {
    id: "doc-5",
    name: "Certificate of Withholding Tax (2316)",
    required: true,
    status: "Missing",
    deadline: "Dec 15, 2024",
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
  const [detailsOpen, setDetailsOpen] = useState(false)

  const filteredDocuments = initialDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(documentSearch.toLowerCase())
  )

  const flaggedForReview = initialDocuments.filter(
    (d) => d.status === "For Review"
  ).length

  const totalTasks = initialDocuments.length
  const completedTasks = initialDocuments.filter(
    (d) => d.status === "Approved"
  ).length
  const requiredTasks = initialDocuments.filter((d) => d.required).length

  useEffect(() => {
    let isMounted = true

    async function loadActivity() {
      setIsActivityLoading(true)
      const { data, error } = await fetchEngagementActivity(id)

      if (!isMounted) return

      if (error) {
        console.error("Failed to load activity log:", error)
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

  useEffect(() => {
    let isMounted = true

    async function loadDeliverables() {
      setIsDeliverablesLoading(true)
      const { data, error } = await fetchEngagementDeliverables(id)

      if (!isMounted) return

      if (error) {
        console.error("Failed to load deliverables:", error)
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
          <h1 className="text-xl font-semibold">{engagement.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Due{" "}
            <span className="font-medium text-red-600">{engagement.due}</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => setDetailsOpen(true)}
          >
            View Details
          </Button>
        </div>
      </div>

      {/* Workflow progress */}
      <WorkflowProgress workflowStage={engagement.workflowStage} />

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
          onClick={() => setActiveTab("deliverables")}
          className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition-colors ${
            activeTab === "deliverables"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Files
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {deliverables.length}
          </span>
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Task List */}
          <div className="rounded-xl border bg-background p-5">
            <h3 className="text-sm font-semibold">Task List</h3>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">
              {completedTasks} of {totalTasks} completed · {requiredTasks}{" "}
              required
            </p>

            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Deadline</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {initialDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-medium">
                          {doc.name}
                          {doc.required && (
                            <span className="ml-0.5 text-red-500">*</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${documentStatusStyles[doc.status]}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <Clock className="size-3.5" />
                          {doc.deadline ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setActiveTab("documents")}
                          className="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          {doc.status === "Missing" ? "Upload" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Updates */}
          <div className="rounded-xl border bg-background p-5">
            <h3 className="mb-4 text-sm font-semibold">Activity</h3>
            {isActivityLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet.
              </p>
            ) : (
              <ul>
                {activityLog.map((log, idx) => (
                  <li key={log.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {idx !== activityLog.length - 1 && (
                      <span className="absolute left-[8px] top-5 h-full w-px bg-border" />
                    )}
                    <div
                      className={`relative z-10 mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full ring-4 ring-background ${
                        log.done
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-muted text-muted-foreground/40"
                      }`}
                    >
                      <FileText className="size-3" />
                    </div>
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
                        <p className="mt-1 text-xs text-muted-foreground">
                          {log.description}
                        </p>
                      )}
                      {log.actor && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          — {log.actor}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
                <col className="w-[34%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[24%]" />
              </colgroup>
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3.5 align-middle font-medium">
                    Document Name
                  </th>
                  <th className="px-4 py-3.5 align-middle font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3.5 align-middle font-medium">
                    Uploaded By
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
                        <p className="truncate font-medium">
                          {doc.name}
                          {doc.required && (
                            <span className="ml-0.5 text-red-500">*</span>
                          )}
                        </p>
                        {doc.file && (
                          <p className="truncate text-xs text-muted-foreground">
                            {doc.file}
                          </p>
                        )}
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
                        <td colSpan={5} className="px-4 py-2.5 text-xs text-amber-800">
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
                      colSpan={5}
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
            <h3 className="text-sm font-semibold">Files</h3>
            <span className="text-xs text-muted-foreground">
              Files uploaded by your firm — download links expire after 10
              minutes
            </span>
          </div>

          {isDeliverablesLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : deliverables.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No files have been uploaded yet.
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

      {/* Client + Service Details modal (kept from the old Overview cards) */}
      {detailsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDetailsOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold">Engagement Details</h2>
              <button
                onClick={() => setDetailsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
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

              <div>
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
          </div>
        </div>
      )}
    </div>
  )
}