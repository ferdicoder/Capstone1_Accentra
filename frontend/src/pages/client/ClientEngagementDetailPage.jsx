import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  Download,
  Eye,
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
import { PageSkeleton } from "@/components/shared/loading/page-skeleton"

import { WorkflowProgress } from "@/components/firm/engagements/WorkflowProgress"
import { ActivityLogItem } from "@/components/firm/engagements/ActivityLogItem"
import { TaskList } from "@/components/client/ClientEngagementTaskList"
import { authStore } from "@/store/authStore"
import { formatDate } from "@/components/firm/engagements/engagement-variants"
import {
  useFetchEngagement,
  useFetchEngagementActivity,
  useFetchEngagementDocuments,
  useDeleteEngagementDocument,
  useUploadEngagementDocument,
} from "@/hooks/useEngagements"


const reviewStatusStyles = {
  Approved: "bg-green-50 text-green-700 border border-green-200",
  "For Revision": "bg-amber-50 text-amber-700 border border-amber-200",
}

const reviewStatusHelp = {
  Approved: "This document has been reviewed and accepted by the firm.",
  "For Revision": "This document needs changes before it can be accepted. See Validation Remarks for details.",
}

// Per-status theme for the Status card — header banner, tooltip icon, and
// the Validation Remarks button all switch color together based on
// doc.reviewStatus, instead of always being green regardless of status.
const statusDialogTheme = {
  Approved: {
    header: "bg-emerald-600",
    icon: "text-emerald-600",
    button: "bg-emerald-600 hover:bg-emerald-700",
    remarkBox: "border-green-200 bg-green-50 text-green-800",
  },
  "For Revision": {
    header: "bg-amber-500",
    icon: "text-amber-600",
    button: "bg-amber-500 hover:bg-amber-600",
    remarkBox: "border-amber-200 bg-amber-50 text-amber-800",
  },
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
  const theme = statusDialogTheme[doc.reviewStatus] ?? statusDialogTheme.Approved

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden p-0">
        <div className={`px-6 py-4 text-center ${theme.header}`}>
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
                <span title={helpText} className={`cursor-help ${theme.icon}`}>
                  <HelpCircle className="size-4" />
                </span>
              </div>

              <Button
                className={`w-full py-6 text-base font-semibold text-white ${theme.button}`}
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
              <div className={`w-full rounded-lg border px-3 py-2.5 text-sm ${theme.remarkBox}`}>
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
  const user = authStore((state) => state.user)
  const [activeTab, setActiveTab] = useState("overview")
  const [documentSearch, setDocumentSearch] = useState("")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [statusDoc, setStatusDoc] = useState(null)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const { data: engagement, isLoading, error } = useFetchEngagement(id)
  const { data: activity = [], isLoading: activityLoading } = useFetchEngagementActivity(id)
  const { data: documents = [], isLoading: isDocumentsLoading } = useFetchEngagementDocuments(id)
  const uploadDocument = useUploadEngagementDocument(id)
  const deleteDocument = useDeleteEngagementDocument(id)

  const filteredDocuments = documents.filter((doc) =>
    (doc.name ?? "").toLowerCase().includes(documentSearch.toLowerCase())
  )

  usePageMeta({
    title: engagement?.engagementNumber ?? "Engagement Details",
    breadcrumbs: [
      { label: "Home", href: "/client/dashboard" },
      { label: "Engagements", href: "/client/engagements" },
    ],
    hasUnreadNotifications: true,
  })

  if (isLoading) return <PageSkeleton type="service-requests" />
  if (error || !engagement) return null

  const openStatus = (doc) => {
    setStatusDoc(doc)
    setIsStatusOpen(true)
  }

  const handleUploadFiles = async (task, files) => Promise.all(
    files.map((file) => uploadDocument.mutateAsync({
      engagementTaskId: task.id,
      file,
      uploadedBy: user?.id,
    }))
  )

  const handleDeleteFile = async (task, files) => {
    await Promise.all((files ?? []).map((file) => deleteDocument.mutateAsync(file.id)))
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
            {engagement.serviceName}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Due <span className="font-medium text-red-600">{formatDate(engagement.targetEndDate)}</span>
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

      <WorkflowProgress
        workflowStage={engagement.status}
      />

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
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <TaskList
              engagement={engagement}
              documents={documents}
              onUploadFiles={handleUploadFiles}
              onDeleteFile={handleDeleteFile}
            />
          </div>
          <div className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Activity Log</h3>
            {activityLoading && <p className="text-sm text-muted-foreground">Loading activity...</p>}
            {!activityLoading && activity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            {!activityLoading && activity.length > 0 && (
              <div className="space-y-4">
                {activity.map((entry) => <ActivityLogItem key={entry.id} entry={entry} />)}
              </div>
            )}
          </div>
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
              <table className="w-full min-w-[600px] table-fixed text-sm">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[22%]" />
                  <col className="w-[20%]" />
                  <col className="w-[24%]" />
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
                        </td>
                        <td className="px-4 py-4 align-middle text-muted-foreground">
                          {doc.uploadedBy}
                        </td>
                        <td className="px-4 py-4 align-middle text-muted-foreground">
                          {doc.uploadedDate ?? "—"}
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col items-start gap-1.5">
                            <button
                              type="button"
                              onClick={() => openStatus(doc)}
                              title="View Status"
                              className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80 ${reviewStatusStyles[doc.reviewStatus]}`}
                            >
                              {doc.reviewStatus}
                            </button>

                            <div className="flex items-center gap-1">
                              {doc.downloadUrl ? (
                                <a
                                  href={doc.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View File"
                                  className="flex size-6 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted"
                                >
                                  <Eye className="size-3.5" />
                                </a>
                              ) : (
                                <span
                                  title="View File"
                                  className="flex size-6 shrink-0 cursor-not-allowed items-center justify-center rounded-md border text-muted-foreground/40"
                                >
                                  <Eye className="size-3.5" />
                                </span>
                              )}

                              {doc.downloadUrl ? (
                                <a
                                  href={doc.downloadUrl}
                                  download={doc.name}
                                  title="Download"
                                  className="flex size-6 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                                >
                                  <Download className="size-3.5" />
                                </a>
                              ) : (
                                <span
                                  title="Download"
                                  className="flex size-6 shrink-0 cursor-not-allowed items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-muted-foreground/40"
                                >
                                  <Download className="size-3.5" />
                                </span>
                              )}
                            </div>
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
                        {[engagement.client?.firstName, engagement.client?.middleName, engagement.client?.lastName].filter(Boolean).join(" ") || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Email
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.client?.email || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Contact Number
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.client?.contactNo || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Business Name
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.business?.businessName || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Business Type
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.business?.businessType || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        TIN
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.business?.tinNo || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Industry
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.business?.industry || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Address
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.business?.address || "—"}
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
                        {engagement.category || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Service Name
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.serviceName || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Notes (From Service Request)
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {"—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Assigned Staff
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
                        {engagement.assignedStaff || "—"}
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