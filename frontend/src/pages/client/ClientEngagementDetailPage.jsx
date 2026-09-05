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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { supabase } from "@/config/supabase.js"
import { WorkflowProgress } from "@/components/client/ClientEngagementWorkflow"
import { TaskList } from "@/components/client/ClientEngagementTaskList"
import { ActivityUpdates } from "@/components/client/ClientEngagementActivityUpdates"


// --- Inline data access (no separate service files) --------------------
//
// Table assumption: "engagement_activity"
//   id, engagement_id, type, message, actor, created_at
//
// Table assumption: "metadata_document" (per the ERD) — this now covers
// BOTH client uploads and firm deliverables, distinguished by a
// `document_type` / `uploaded_by_role` column (guessed name below):
//   document_id, engagement_id, business_id, bucket_name, object_key,
//   file_name, file_size, status, document_type, uploaded_by_role,
//   uploaded_by_name, remark, created_at, updated_at
//
// Adjust table/column names below to match your actual schema.

const ACTIVITY_TABLE = "engagement_activity"
const DOCUMENT_TABLE = "metadata_document"
const SIGNED_URL_EXPIRY_SECONDS = 60 * 10 // matches the "10 minutes" copy in the UI below

async function fetchEngagementActivity(engagementId) {
  try {
    const { data, error } = await supabase
      .from(ACTIVITY_TABLE)
      .select("*")
      .eq("engagement_id", engagementId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

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

// Fetches ALL documents for this engagement — both client uploads and firm
// deliverables — as one consolidated list, per the "merge Documents and
// Files into one section" requirement.
async function fetchEngagementDocuments(engagementId) {
  try {
    const { data, error } = await supabase
      .from(DOCUMENT_TABLE)
      .select("*")
      .eq("engagement_id", engagementId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

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
  id: "eng-2024-0041",
  code: "ENG-2024-0041",
  status: "Active",
  type: "Tax Filing",
  serviceName: "Tax Filing",
  title: "Annual Income Tax Return (BIR Form 1701)",
  due: "Apr 15, 2025",
  workflowStage: "document-verification",
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

// Consolidated document list — both client uploads and firm deliverables,
// each tagged with `owner`. Only files that actually exist show up here;
// still-missing required items are tracked in the Task List instead
// (which already has its own "Upload Files" action per task).
const initialDocuments = [
  {
    id: "doc-1",
    name: "BIR Form 1701 – Signed Copy",
    file: "BIR_1701_2024.pdf",
    owner: "Client",
    uploadedBy: "Maria S.",
    uploadedDate: "Dec 6, 2024",
    reviewStatus: "Approved",
    signedUrl: null,
  },
  {
    id: "doc-2",
    name: "Bank Statements (Jan–Dec 2024)",
    file: "BankStatements_2024.pdf",
    owner: "Client",
    uploadedBy: "Maria S.",
    uploadedDate: "Dec 6, 2024",
    reviewStatus: "Approved",
    signedUrl: null,
  },
  {
    id: "doc-3",
    name: "Official Receipts / Invoice Booklet",
    file: "OR_Booklet.pdf",
    owner: "Client",
    uploadedBy: "Maria S.",
    uploadedDate: "Dec 6, 2024",
    reviewStatus: "For Revision",
    remark:
      "Incomplete — Jan to Jun ORs are missing. Please upload the complete booklet covering January–December 2024.",
    signedUrl: null,
  },
  {
    id: "del-1",
    name: "Filed_ITR_2024.pdf",
    file: "Filed_ITR_2024.pdf",
    owner: "Firm",
    uploadedBy: "Atty. Roland Reyes, CPA",
    uploadedDate: "Apr 18, 2025",
    reviewStatus: "Approved",
    signedUrl: null,
  },
  {
    id: "del-2",
    name: "BIR_Acknowledgement_Receipt.pdf",
    file: "BIR_Acknowledgement_Receipt.pdf",
    owner: "Firm",
    uploadedBy: "Atty. Roland Reyes, CPA",
    uploadedDate: "Apr 18, 2025",
    reviewStatus: "Approved",
    signedUrl: null,
  },
]

const reviewStatusStyles = {
  Approved: "bg-green-50 text-green-700 border border-green-200",
  "For Revision": "bg-amber-50 text-amber-700 border border-amber-200",
}

function DocumentViewDialog({ open, onOpenChange, document: doc }) {
  const [showRemarks, setShowRemarks] = useState(false)

  if (!doc) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setShowRemarks(false)
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{doc.name}</DialogTitle>
          <DialogDescription>Document details</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Owner</span>
            <span className="text-sm font-medium text-foreground">
              {doc.owner}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Uploaded Date
            </span>
            <span className="text-sm font-medium text-foreground">
              {doc.uploadedDate}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${reviewStatusStyles[doc.reviewStatus]}`}
            >
              {doc.reviewStatus}
            </span>
          </div>

          {doc.reviewStatus === "For Revision" && (
            <div>
              {!showRemarks ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowRemarks(true)}
                >
                  View Remarks
                </Button>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  {doc.remark}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
  const [documents, setDocuments] = useState(initialDocuments)
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [viewDoc, setViewDoc] = useState(null)
  const [isDocViewOpen, setIsDocViewOpen] = useState(false)

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(documentSearch.toLowerCase())
  )

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

    async function loadDocuments() {
      setIsDocumentsLoading(true)
      const { data, error } = await fetchEngagementDocuments(id)
      if (!isMounted) return
      if (error) {
        console.error("Failed to load documents:", error)
      } else if (data) {
        setDocuments(data)
      }
      setIsDocumentsLoading(false)
    }

    loadDocuments()
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

      {/* Tabs — Files/Deliverables removed, merged into Documents */}
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
            {documents.length}
          </span>
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <TaskList engagement={engagement} />
          <ActivityUpdates engagement={{ ...engagement, activityUpdates }} />
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

            {/* Primary action for this tab, per spec */}
            <Button className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
              <Upload className="size-4" />
              Document Upload
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border bg-background">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] table-fixed text-sm">
                <colgroup>
                  <col className="w-[40%]" />
                  <col className="w-[16%]" />
                  <col className="w-[20%]" />
                  <col className="w-[24%]" />
                </colgroup>
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3.5 align-middle font-medium">
                      Document Name
                    </th>
                    <th className="px-4 py-3.5 align-middle font-medium">
                      Owner
                    </th>
                    <th className="px-4 py-3.5 align-middle font-medium">
                      Uploaded Date
                    </th>
                    <th className="px-4 py-3.5 text-right align-middle font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isDocumentsLoading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        Loading documents...
                      </td>
                    </tr>
                  )}

                  {!isDocumentsLoading &&
                    filteredDocuments.map((doc) => (
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
                            {doc.owner}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle text-muted-foreground">
                          {doc.uploadedDate ?? "—"}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              title="View"
                              onClick={() => {
                                setViewDoc(doc)
                                setIsDocViewOpen(true)
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                            >
                              <Eye className="size-3.5" />
                              View
                            </button>

                            {doc.signedUrl ? (
                              <a
                                href={doc.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                              >
                                <Download className="size-3.5" />
                                Download
                              </a>
                            ) : (
                              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-muted-foreground/50">
                                <Download className="size-3.5" />
                                Download
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!isDocumentsLoading && filteredDocuments.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
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

      <DocumentViewDialog
        open={isDocViewOpen}
        onOpenChange={setIsDocViewOpen}
        document={viewDoc}
      />

      {/* ================================================================
          VIEW DETAILS MODAL — Left: Task, Right: Service Information
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

            <div className="min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <section className="border-b px-6 py-7 sm:px-8 sm:py-8 md:border-b-0 md:border-r">
                  <div className="mb-7">
                    <h3 className="text-base font-semibold">Task</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Client and task information
                    </p>
                  </div>

                  <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Client Name
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.clientName}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Business Name
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.businessName}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        TIN
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.tin}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        RDO
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.rdo}
                      </dd>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Email
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.task.email}
                      </dd>
                    </div>
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
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Service Type
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.serviceType}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Tax Form
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.taxForm}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Compliance Category
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.complianceCategory}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Period Covered
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.periodCovered}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Filing Deadline
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-semibold text-red-600">
                        {engagement.serviceInfo.filingDeadline}
                      </dd>
                    </div>
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