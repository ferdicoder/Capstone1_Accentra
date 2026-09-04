import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
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
import { WorkflowProgress } from "@/components/client/ClientEngagementWorkflow"
import { TaskList } from "@/components/client/ClientEngagementTaskList"
import { ActivityUpdates } from "@/components/client/ClientEngagementActivityUpdates"


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

    // Normalize raw rows into the shape ActivityUpdates expects.
    // Adjust the field mapping below once the real column names are confirmed.
    const normalized = (data ?? []).map((row) => ({
      id: row.id,
      title: row.type ?? "Activity Update",
      createdAt: row.created_at,
      description: row.message ?? "",
      author: row.actor ?? "—",
    }))

    return { data: normalized, error: null }
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
  id: "eng-2024-0041", // TaskList/ActivityUpdates key off this + serviceName
  code: "ENG-2024-0041",
  status: "Active",
  type: "Tax Filing",
  serviceName: "Tax Filing", // TaskList.generateMockTasks() matches on this text
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

const initialActivityUpdates = [
  {
    id: "log-1",
    title: "Request Submitted",
    createdAt: "2024-11-28T09:00:00",
    description: "Client submitted via portal",
    author: "Maria Santos",
  },
  {
    id: "log-2",
    title: "Request Approved",
    createdAt: "2024-11-28T14:30:00",
    description: "Approved by R&A CPA",
    author: "Atty. Roland Reyes, CPA",
  },
  {
    id: "log-3",
    title: "Document Checklist Sent",
    createdAt: "2024-11-30T10:00:00",
    description: "5 required documents listed",
    author: "Atty. Roland Reyes, CPA",
  },
  {
    id: "log-4",
    title: "Documents Submitted",
    createdAt: "2024-12-06T11:15:00",
    description: "3 of 5 submitted",
    author: "Maria Santos",
  },
  {
    id: "log-5",
    title: "Documents Reviewed",
    createdAt: "2024-12-08T16:45:00",
    description: "2 documents flagged for revision",
    author: "Atty. Roland Reyes, CPA",
  },
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
  const [activityUpdates, setActivityUpdates] = useState(initialActivityUpdates)
  const [deliverables, setDeliverables] = useState(initialDeliverables)
  const [isDeliverablesLoading, setIsDeliverablesLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const filteredDocuments = initialDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(documentSearch.toLowerCase())
  )

  const flaggedForReview = initialDocuments.filter(
    (d) => d.status === "For Review"
  ).length

  useEffect(() => {
    let isMounted = true

    async function loadActivity() {
      const { data, error } = await fetchEngagementActivity(id)

      if (!isMounted) return

      if (error) {
        console.error("Failed to load activity log:", error)
      } else if (data) {
        setActivityUpdates(data)
      }
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
    <div className="flex flex-1 flex-col gap-4 px-2 py-2 sm:px-4 lg:px-6">
      <Link
        to="/client/engagements"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Engagements
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold sm:text-xl">
            {engagement.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Due{" "}
            <span className="font-medium text-red-600">
              {engagement.due}
            </span>
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
      <div className="flex gap-4 overflow-x-auto border-b sm:gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors ${
            activeTab === "overview"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={`-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors ${
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
          className={`-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors ${
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
          <TaskList engagement={engagement} />

          <ActivityUpdates
            engagement={{ ...engagement, activityUpdates }}
          />
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-fixed text-sm">
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
                      Due Date
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
                              <span className="ml-0.5 text-red-500">
                                *
                              </span>
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
                          {doc.deadline ?? "—"}
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
                        <tr
                          key={`${doc.id}-remark`}
                          className="border-b bg-amber-50/60"
                        >
                          <td
                            colSpan={5}
                            className="px-4 py-2.5 text-xs text-amber-800"
                          >
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
            <p className="text-sm text-muted-foreground">
              Loading...
            </p>
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

      {/* ================================================================
          VIEW DETAILS MODAL
          ================================================================ */}
      {detailsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6"
          onClick={() => setDetailsOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ----------------------------------------------------------
                MODAL HEADER
                ---------------------------------------------------------- */}
            <div className="flex shrink-0 items-center justify-between border-b px-6 py-5 sm:px-8">
              <div>
                <h2 className="text-lg font-semibold sm:text-xl">
                  Engagement Details
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  View task and service information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                aria-label="Close engagement details"
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* ----------------------------------------------------------
                DETAILS CONTENT
                Desktop: two columns
                Mobile: one column
                ---------------------------------------------------------- */}
            <div className="min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2">

                {/* ======================================================
                    LEFT COLUMN — TASK
                    ====================================================== */}
                <section className="border-b px-6 py-7 sm:px-8 sm:py-8 md:border-b-0 md:border-r">
                  <div className="mb-7">
                    <h3 className="text-base font-semibold">
                      Task
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Client and task information
                    </p>
                  </div>

                  <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    {/* Client Name */}
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Client Name
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.clientName}
                      </dd>
                    </div>

                    {/* Business Name */}
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Business Name
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.businessName}
                      </dd>
                    </div>

                    {/* TIN */}
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        TIN
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.tin}
                      </dd>
                    </div>

                    {/* RDO */}
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        RDO
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.rdo}
                      </dd>
                    </div>

                    {/* Email */}
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Email
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.email}
                      </dd>
                    </div>

                    {/* Phone */}
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Phone
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.phone}
                      </dd>
                    </div>
                  </dl>
                </section>

                {/* ======================================================
                    RIGHT COLUMN — SERVICE INFORMATION
                    ====================================================== */}
                <section className="px-6 py-7 sm:px-8 sm:py-8">
                  <div className="mb-7">
                    <h3 className="text-base font-semibold">
                      Service Information
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Details about the selected service
                    </p>
                  </div>

                  <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    {/* Service Type */}
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Service Type
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.serviceType}
                      </dd>
                    </div>

                    {/* Tax Form */}
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Tax Form
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.taxForm}
                      </dd>
                    </div>

                    {/* Compliance Category */}
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Compliance Category
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.complianceCategory}
                      </dd>
                    </div>

                    {/* Period Covered */}
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Period Covered
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.periodCovered}
                      </dd>
                    </div>

                    {/* Filing Deadline */}
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Filing Deadline
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-semibold text-red-600">
                        {engagement.serviceInfo.filingDeadline}
                      </dd>
                    </div>

                    {/* Assigned CPA */}
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Assigned CPA
                      </dt>

                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.assignedCpa}
                      </dd>
                    </div>
                  </dl>
                </section>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}