import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  HelpCircle,
  Search,
  X,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { usePageMeta } from "@/hooks/usePageMeta"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

import { supabase } from "@/config/supabase.js"
import { WorkflowProgress } from "@/components/client/ClientEngagementWorkflow"
import { TaskList } from "@/components/client/ClientEngagementTaskList"
import { ActivityUpdates } from "@/components/client/ClientEngagementActivityUpdates"


// --- Inline data access (no separate service files) --------------------
const ACTIVITY_TABLE = "engagement_activity"
const DOCUMENT_TABLE = "metadata_document"
const SIGNED_URL_EXPIRY_SECONDS = 60 * 10

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
  serviceName: "Tax Filing", // used by TaskList's mock task generator — do not remove
  title: "Annual Income Tax Return (BIR Form 1701)",
  due: "Apr 15, 2025",
  workflowStage: "document-verification",

  clientInfo: {
    fullName: "Maria Santos",
    email: "maria.santos@santosretail.com",
    contactNumber: "+63 917 555 1234",
    businessName: "Santos Retail Trading",
    businessType: "Sole Proprietorship",
    tin: "123-456-789-000",
    industry: "Retail",
    address: "12 Mercado St., Unit 4B, Brgy. Sta. Ana, District 6, Manila, 1009",
  },

  serviceInfo: {
    serviceType: "Tax Filing",
    serviceName: "Annual ITR Filing",
    notes:
      "Please prioritize — client needs this filed before the April 15 deadline.",
    filingDeadline: "April 15, 2025",
    assignedStaff: "Atty. Roland Reyes, CPA",
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
    uploadedBy: "Maria Santos",
    uploadedDate: "Dec 6, 2024",
    reviewStatus: "Approved",
    signedUrl: null,
  },
  {
    id: "doc-2",
    name: "Bank Statements (Jan–Dec 2024)",
    file: "BankStatements_2024.pdf",
    uploadedBy: "Maria Santos",
    uploadedDate: "Dec 6, 2024",
    reviewStatus: "Approved",
    signedUrl: null,
  },
  {
    id: "doc-3",
    name: "Official Receipts / Invoice Booklet",
    file: "OR_Booklet.pdf",
    uploadedBy: "Maria Santos",
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
    uploadedBy: "Atty. Roland Reyes, CPA",
    uploadedDate: "Apr 18, 2025",
    reviewStatus: "Approved",
    signedUrl: null,
  },
  {
    id: "del-2",
    name: "BIR_Acknowledgement_Receipt.pdf",
    file: "BIR_Acknowledgement_Receipt.pdf",
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

const reviewStatusHelp = {
  Approved: "This document has been reviewed and accepted by the firm.",
  "For Revision": "This document needs changes before it can be accepted. See Validation Remarks for details.",
}

function DocumentStatusDialog({ open, onOpenChange, document: doc }) {
  const [showRemarks, setShowRemarks] = useState(false)

  const handleOpenChange = (next) => {
    if (!next) setShowRemarks(false)
    onOpenChange(next)
  }

  if (!doc) return null

  const badgeClass = reviewStatusStyles[doc.reviewStatus] ?? reviewStatusStyles.Approved
  const helpText = reviewStatusHelp[doc.reviewStatus] ?? ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden p-0">
        <div className="bg-blue-600 px-6 py-4 text-center">
          <h2 className="text-base font-semibold text-white">Status</h2>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-6">
          {!showRemarks ? (
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${badgeClass}`}
                >
                  {doc.reviewStatus}
                </span>
                <span title={helpText} className="cursor-help text-blue-500">
                  <HelpCircle className="size-4" />
                </span>
              </div>

              <Button
                className="w-full bg-blue-600 py-6 text-base font-semibold text-white hover:bg-blue-700"
                onClick={() => setShowRemarks(true)}
              >
                Validation Remarks
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Click "Validation Remarks" for more specific updates
              </p>
            </>
          ) : (
            <>
              <div
                className={`w-full rounded-lg border px-3 py-2.5 text-sm ${
                  doc.reviewStatus === "For Revision"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-green-200 bg-green-50 text-green-800"
                }`}
              >
                {doc.reviewStatus === "For Revision"
                  ? doc.remark
                  : "No revisions needed — this document was approved as submitted."}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowRemarks(false)}
              >
                Back to Status
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ClientEngagementDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [documentSearch, setDocumentSearch] = useState("")
  const [activityUpdates, setActivityUpdates] = useState(initialActivityUpdates)
  const [documents, setDocuments] = useState(initialDocuments)
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [statusDoc, setStatusDoc] = useState(null)
  const [isStatusOpen, setIsStatusOpen] = useState(false)

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

  const openStatus = (doc) => {
    setStatusDoc(doc)
    setIsStatusOpen(true)
  }

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
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-9"
              value={documentSearch}
              onChange={(e) => setDocumentSearch(e.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-xl border bg-background">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] table-fixed text-sm">
                <colgroup>
                  <col className="w-[38%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3.5 align-middle font-medium">
                      Document Name
                    </th>
                    <th className="px-4 py-3.5 align-middle font-medium">
                      Uploaded By
                    </th>
                    <th className="px-4 py-3.5 align-middle font-medium">
                      Uploaded Date
                    </th>
                    <th className="px-4 py-3.5 align-middle font-medium">
                      Status
                    </th>
                    {/* Left-aligned + narrower now that these are icon-only,
                        instead of being pushed hard right with two wide
                        text buttons. */}
                    <th className="px-4 py-3.5 align-middle font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isDocumentsLoading && (
                    <tr>
                      <td
                        colSpan={5}
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
                        <td className="px-4 py-4 align-middle text-muted-foreground">
                          {doc.uploadedBy}
                        </td>
                        <td className="px-4 py-4 align-middle text-muted-foreground">
                          {doc.uploadedDate ?? "—"}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <button
                            type="button"
                            onClick={() => openStatus(doc)}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${reviewStatusStyles[doc.reviewStatus]}`}
                          >
                            {doc.reviewStatus}
                          </button>
                        </td>
                        {/* Icon-only actions, left-aligned in their own
                            compact column instead of two wide text buttons
                            crammed against the right edge. */}
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-1">
                            {doc.signedUrl ? (
                              <a
                                href={doc.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View File"
                                className="flex size-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted"
                              >
                                <Eye className="size-4" />
                              </a>
                            ) : (
                              <span
                                title="View File"
                                className="flex size-8 cursor-not-allowed items-center justify-center rounded-lg border text-muted-foreground/40"
                              >
                                <Eye className="size-4" />
                              </span>
                            )}

                            {doc.signedUrl ? (
                              <a
                                href={doc.signedUrl}
                                download
                                title="Download"
                                className="flex size-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                              >
                                <Download className="size-4" />
                              </a>
                            ) : (
                              <span
                                title="Download"
                                className="flex size-8 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-muted-foreground/40"
                              >
                                <Download className="size-4" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!isDocumentsLoading && filteredDocuments.length === 0 && (
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

      <DocumentStatusDialog
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        document={statusDoc}
      />

      {/* ================================================================
          VIEW DETAILS MODAL — Left: Client Information, Right: Service Information
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
                  View client and service information
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
                    <h3 className="text-base font-semibold">
                      Client Information
                    </h3>
                  </div>

                  <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Full Name
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.clientInfo.fullName}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Email
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.clientInfo.email}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Contact Number
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.clientInfo.contactNumber}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Business Name
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.clientInfo.businessName}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Business Type
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.clientInfo.businessType}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        TIN
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.clientInfo.tin}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Industry
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.clientInfo.industry}
                      </dd>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Address
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.clientInfo.address}
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
                        Service Name
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.serviceName}
                      </dd>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Notes (From Service Request)
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.notes}
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
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Assigned Staff
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceInfo.assignedStaff}
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