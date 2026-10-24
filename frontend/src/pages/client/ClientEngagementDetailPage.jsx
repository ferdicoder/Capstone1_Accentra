import { useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  Check,
  Clock,
  Download,
  Eye,
  MessageSquareText,
  RotateCcw,
  Search,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { usePageMeta } from "@/hooks/usePageMeta"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { PageSkeleton } from "@/components/shared/loading/page-skeleton"

import { WorkflowProgress } from "@/components/firm/engagements/WorkflowProgress"
import { ActivityLogItem } from "@/components/firm/engagements/ActivityLogItem"
import { TaskList } from "@/components/client/ClientEngagementTaskList"
import { ClientEngagementDeliverables } from "@/components/client/ClientEngagementDeliverables"
import { authStore } from "@/store/authStore"
import { formatDate } from "@/components/firm/engagements/engagement-variants"
import {
  useFetchEngagement,
  useFetchEngagementActivity,
  useFetchEngagementDocuments,
  useFetchEngagementDeliverables,
  useDeleteEngagementDocument,
  useUploadEngagementDocument,
} from "@/hooks/useEngagements"


const statusLabels = {
  approved: "Approved",
  for_review: "For Review",
  for_revision: "For Revision",
  missing: "Missing",
}

const statusBadgeStyles = {
  approved: "bg-green-50 text-green-700 border border-green-200",
  for_review: "bg-amber-50 text-amber-700 border border-amber-200",
  for_revision: "bg-orange-50 text-orange-700 border border-orange-200",
  missing: "bg-red-50 text-red-700 border border-red-200",
}

// Per-status theme for the Status dialog. Every color is the same hue as the
// status badge in the Actions column, so the popup you open from a badge looks
// like a bigger version of it.
//   bar      → thin strip across the top of the popup
//   soft     → big blob behind the illustration
//   softDark → header strip on the little document
//   docBorder / docLine → the document outline and its text lines
//   solid    → round status badge on the document
//   deco     → the small decorative lines / dots around the illustration
//   button   → the pill "Close" button
const statusDialogTheme = {
  approved: {
    title: "Document approved",
    Icon: Check,
    bar: "bg-green-500",
    soft: "bg-green-50",
    softDark: "bg-green-100",
    docBorder: "border-green-500",
    docLine: "bg-green-200",
    solid: "bg-green-500",
    decoLine: "bg-green-300",
    decoRing: "border-green-300",
    decoPlus: "text-green-300",
    button: "bg-green-600 hover:bg-green-700",
  },
  for_review: {
    title: "Waiting for review",
    Icon: Clock,
    bar: "bg-amber-500",
    soft: "bg-amber-50",
    softDark: "bg-amber-100",
    docBorder: "border-amber-500",
    docLine: "bg-amber-200",
    solid: "bg-amber-500",
    decoLine: "bg-amber-300",
    decoRing: "border-amber-300",
    decoPlus: "text-amber-300",
    button: "bg-amber-500 hover:bg-amber-600",
  },
  for_revision: {
    title: "Revision requested",
    Icon: RotateCcw,
    bar: "bg-orange-500",
    soft: "bg-orange-50",
    softDark: "bg-orange-100",
    docBorder: "border-orange-500",
    docLine: "bg-orange-200",
    solid: "bg-orange-500",
    decoLine: "bg-orange-300",
    decoRing: "border-orange-300",
    decoPlus: "text-orange-300",
    button: "bg-orange-500 hover:bg-orange-600",
  },
  missing: {
    title: "Nothing submitted yet",
    Icon: X,
    bar: "bg-red-500",
    soft: "bg-red-50",
    softDark: "bg-red-100",
    docBorder: "border-red-500",
    docLine: "bg-red-200",
    solid: "bg-red-500",
    decoLine: "bg-red-300",
    decoRing: "border-red-300",
    decoPlus: "text-red-300",
    button: "bg-red-500 hover:bg-red-600",
  },
}

// What the remarks box says for each status.
function getRemarkText(status, remark) {
  switch (status) {
    case "approved":
      return "No revisions needed — this document was approved as submitted."
    case "for_review":
      return "Your firm hasn't reviewed this document yet. Remarks will appear here once they have."
    case "for_revision":
      return remark || "Your firm asked for changes to this document. Please upload a revised copy."
    default:
      return "Nothing has been submitted for this requirement yet."
  }
}

// Small document drawing with a round status badge, tinted per status.
function StatusIllustration({ theme }) {
  const { Icon } = theme
  return (
    <div className="relative mx-auto h-36 w-64" aria-hidden="true">
      {/* blob */}
      <div className={`absolute inset-x-10 top-3 bottom-4 rounded-[50%] ${theme.soft}`} />

      {/* decorations */}
      <span className={`absolute left-2 top-[46%] h-0.5 w-14 rounded opacity-60 ${theme.decoLine}`} />
      <span className={`absolute right-1 top-[52%] h-0.5 w-12 rounded opacity-60 ${theme.decoLine}`} />
      <span className={`absolute left-[26%] top-2 text-base font-light leading-none ${theme.decoPlus}`}>+</span>
      <span className={`absolute left-[16%] top-[30%] size-3 rounded-full border-2 ${theme.decoRing}`} />
      <span className={`absolute right-[18%] top-2 size-3 rounded-full border-2 ${theme.decoRing}`} />
      <span className={`absolute right-[26%] bottom-2 text-base font-light leading-none ${theme.decoPlus}`}>+</span>

      {/* shadow */}
      <div className="absolute bottom-1.5 left-1/2 h-2 w-28 -translate-x-1/2 rounded-[50%] bg-black/10" />

      {/* document */}
      <div
        className={`absolute left-1/2 top-3 h-[92px] w-[76px] -translate-x-1/2 overflow-hidden rounded-lg border-2 bg-white ${theme.docBorder}`}
      >
        <div className={`h-3.5 ${theme.softDark}`} />
        <div className="flex flex-col gap-1.5 px-2.5 pt-3">
          <span className={`h-1 w-full rounded ${theme.docLine}`} />
          <span className={`h-1 w-4/5 rounded ${theme.docLine}`} />
          <span className={`h-1 w-3/5 rounded ${theme.docLine}`} />
        </div>
      </div>

      {/* status badge */}
      <div
        className={`absolute left-[55%] top-[64px] flex size-11 items-center justify-center rounded-full border-4 border-white text-white ${theme.solid}`}
      >
        <Icon className="size-5" strokeWidth={3} />
      </div>
    </div>
  )
}

function DocumentStatusDialog({ open, onOpenChange, status, remark, doc }) {
  if (!status) return null

  const theme = statusDialogTheme[status] ?? statusDialogTheme.missing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* `[&>button]:hidden` hides the dialog's default corner X so only our own shows. */}
      <DialogContent className="max-w-xl gap-0 overflow-hidden rounded-3xl border-0 p-0 [&>button]:hidden">
        <div className={`h-1.5 w-full ${theme.bar}`} />

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="absolute right-5 top-6 flex size-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col px-6 pb-6 pt-8 sm:px-8">
          <StatusIllustration theme={theme} />

          <div className="mt-4 text-center">
            <DialogTitle className="text-2xl font-bold">{theme.title}</DialogTitle>
            <DialogDescription asChild>
              <div>
                {doc?.name && (
                  <p className="mt-2 break-words text-base text-muted-foreground">{doc.name}</p>
                )}
                {doc && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {doc.uploadedBy ?? "—"} · Uploaded {doc.uploadedDate ?? "—"}
                  </p>
                )}
              </div>
            </DialogDescription>
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Remarks from your firm
          </p>
          <div className="mt-2 flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-3.5 text-base text-muted-foreground">
            <MessageSquareText className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 break-words">{getRemarkText(status, remark)}</p>
          </div>

          <Button
            className={`mx-auto mt-6 h-11 w-44 rounded-full text-base font-semibold text-white shadow-none ${theme.button}`}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Questions about this document? Contact your firm.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// View + download icon buttons for one document. `large` gives phone-sized
// (32px) touch targets; the table keeps the compact 24px version.
function DocumentFileActions({ doc, large = false }) {
  const box = large ? "size-8" : "size-6"
  const icon = large ? "size-4" : "size-3.5"

  return (
    <div className="flex items-center gap-1.5">
      {doc.downloadUrl ? (
        <a
          href={doc.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View File"
          aria-label={`View ${doc.name} in a new tab`}
          className={`flex ${box} shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted`}
        >
          <Eye className={icon} />
        </a>
      ) : (
        <span
          title="View File"
          aria-label="View file unavailable"
          aria-disabled="true"
          className={`flex ${box} shrink-0 cursor-not-allowed items-center justify-center rounded-md border text-muted-foreground/40`}
        >
          <Eye className={icon} />
        </span>
      )}

      {doc.downloadUrl ? (
        <a
          href={doc.downloadUrl}
          download={doc.name}
          title="Download"
          aria-label={`Download ${doc.name}`}
          className={`flex ${box} shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100`}
        >
          <Download className={icon} />
        </a>
      ) : (
        <span
          title="Download"
          aria-label="Download unavailable"
          aria-disabled="true"
          className={`flex ${box} shrink-0 cursor-not-allowed items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-muted-foreground/40`}
        >
          <Download className={icon} />
        </span>
      )}
    </div>
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

  const { data: deliverables = [], isLoading: isDeliverablesLoading } =
    useFetchEngagementDeliverables(id)

  // Documents no longer carry their own review status — it lives on the
  // parent task now. Look each document's task up once per render.
  const taskById = useMemo(
    () => new Map((engagement?.tasks ?? []).map((t) => [t.id, t])),
    [engagement?.tasks]
  )

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

  const statusDocTask = statusDoc ? taskById.get(statusDoc.engagementTaskId) : null

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

      <div className="flex gap-4  overflow-x-auto max-w-full scrollbar-none border-b sm:gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "-mb-px shrink-0 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors",
            activeTab === "overview"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={cn(
            "-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors",
            activeTab === "documents"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Documents
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {documents.length}
          </span>
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-5">
            {/* Deliverables sit above Document Requirements, same as the admin view */}
            <ClientEngagementDeliverables
              engagementId={id}
              deliverables={deliverables}
              isLoading={isDeliverablesLoading}
              workflowStage={engagement.status}
            />
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
              aria-label="Search documents"
              className="pl-9"
              value={documentSearch}
              onChange={(e) => setDocumentSearch(e.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-xl border bg-background">
            {/* ── Phones: stacked cards ─────────────────────────────────── */}
            <div className="md:hidden">
              {isDocumentsLoading && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Loading documents...
                </p>
              )}

              {!isDocumentsLoading && filteredDocuments.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {documentSearch.trim()
                    ? `No documents match "${documentSearch}".`
                    : "No documents uploaded yet."}
                </p>
              )}

              {!isDocumentsLoading && filteredDocuments.length > 0 && (
                <ul className="divide-y">
                  {filteredDocuments.map((doc) => {
                    const task = taskById.get(doc.engagementTaskId)
                    const status = task?.status ?? "missing"
                    return (
                      <li key={doc.id} className="flex flex-col gap-3 p-4">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium">{doc.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {doc.uploadedBy ?? "—"} · {doc.uploadedDate ?? "—"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => openStatus(doc)}
                            aria-label={`View status of ${doc.name}`}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80 ${statusBadgeStyles[status]}`}
                          >
                            {statusLabels[status]}
                          </button>
                          <DocumentFileActions doc={doc} large />
                        </div>

                        {/* Revision feedback visible without extra taps. */}
                        {status === "for_revision" && (
                          <p className="rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs text-orange-800">
                            <span className="font-semibold">Your firm asked for changes: </span>
                            {task?.remark || "Please upload a revised copy."}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* ── Tablet and up: table ──────────────────────────────────── */}
            <div className="hidden overflow-x-auto md:block">
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
                    filteredDocuments.map((doc) => {
                      const task = taskById.get(doc.engagementTaskId)
                      const status = task?.status ?? "missing"
                      return (
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
                                className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80 ${statusBadgeStyles[status]}`}
                              >
                                {statusLabels[status]}
                              </button>

                              <DocumentFileActions doc={doc} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                  {!isDocumentsLoading && filteredDocuments.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        {documentSearch.trim()
                          ? `No documents match "${documentSearch}".`
                          : "No documents uploaded yet."}
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
        status={statusDocTask?.status}
        remark={statusDocTask?.remark}
        doc={statusDoc}
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