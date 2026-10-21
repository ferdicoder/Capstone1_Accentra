import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Search,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { usePageMeta } from "@/hooks/usePageMeta"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

const statusHelp = {
  approved: "This document has been reviewed and accepted by the firm.",
  for_review: "This document has been submitted and is waiting for the firm to review it.",
  for_revision: "This document needs changes before it can be accepted. See Validation Remarks for details.",
  missing: "This requirement hasn't been submitted yet.",
}

// Per-status theme for the Status card — header banner, tooltip icon, and
// the Validation Remarks button all switch color together based on the
// parent task's status.
const statusDialogTheme = {
  approved: {
    header: "bg-emerald-600",
    icon: "text-emerald-600",
    button: "bg-emerald-600 hover:bg-emerald-700",
    remarkBox: "border-green-200 bg-green-50 text-green-800",
  },
  for_review: {
    header: "bg-amber-500",
    icon: "text-amber-600",
    button: "bg-amber-500 hover:bg-amber-600",
    remarkBox: "border-amber-200 bg-amber-50 text-amber-800",
  },
  for_revision: {
    header: "bg-orange-500",
    icon: "text-orange-600",
    button: "bg-orange-500 hover:bg-orange-600",
    remarkBox: "border-orange-200 bg-orange-50 text-orange-800",
  },
  missing: {
    header: "bg-red-500",
    icon: "text-red-600",
    button: "bg-red-500 hover:bg-red-600",
    remarkBox: "border-red-200 bg-red-50 text-red-800",
  },
}

// What the Validation Remarks box says for each status.
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

// ── Deliverables ──────────────────────────────────────────────────────────────
// Files the firm uploaded for this engagement.

const fileIconMap = {
  PDF: FileText,
  DOC: FileText,
  DOCX: FileText,
  XLS: FileSpreadsheet,
  XLSX: FileSpreadsheet,
  CSV: FileSpreadsheet,
  PNG: FileImage,
  JPG: FileImage,
  JPEG: FileImage,
  GIF: FileImage,
  WEBP: FileImage,
  ZIP: File,
}

const IMAGE_TYPES = ["PNG", "JPG", "JPEG", "GIF", "WEBP"]
const MAX_PREVIEW_DELIVERABLES = 1

// Prefer the stored file type, fall back to the file extension.
function resolveFileType(file) {
  const explicit = file?.fileType?.toString().toUpperCase()
  if (explicit) return explicit
  const ext = file?.name?.split(".").pop()
  return ext && ext !== file?.name ? ext.toUpperCase() : null
}

function getFileIcon(file) {
  return fileIconMap[resolveFileType(file)] ?? FileText
}

function sortNewestFirst(files) {
  return [...files].sort((a, b) => {
    const aTime = a?.uploadedDate ? new Date(a.uploadedDate).getTime() : 0
    const bTime = b?.uploadedDate ? new Date(b.uploadedDate).getTime() : 0
    return bTime - aTime
  })
}

// Remember which deliverables the client has already opened so new ones can
// be flagged. Stored per engagement in this browser only.
function useSeenDeliverables(engagementId) {
  const storageKey = `client-deliverables-seen:${engagementId}`
  const [seenIds, setSeenIds] = useState(() => new Set())

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      setSeenIds(new Set(raw ? JSON.parse(raw) : []))
    } catch {
      setSeenIds(new Set())
    }
  }, [storageKey])

  const markSeen = (ids) => {
    const list = Array.isArray(ids) ? ids : [ids]
    setSeenIds((current) => {
      if (list.every((id) => current.has(id))) return current
      const next = new Set(current)
      list.forEach((id) => next.add(id))
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]))
      } catch {
        // Storage can be blocked; the badge simply won't persist.
      }
      return next
    })
  }

  return { seenIds, markSeen }
}

function NewBadge() {
  return (
    <span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-white">
      New
    </span>
  )
}

function DeliverableRow({ file, isNew, onPreview, onDownloaded }) {
  const Icon = getFileIcon(file)
  const hasUrl = Boolean(file.downloadUrl)
  const uploader = file.uploadedBy ?? file.releasedBy
  const description = file.description ?? file.note

  return (
    <div className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="min-w-0 cursor-pointer truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2"
            aria-label={`Preview ${file.name ?? "file"}`}
          >
            {file.name ?? "—"}
          </button>
          {isNew && <NewBadge />}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {resolveFileType(file) ?? "—"} · {file.fileSize ?? "—"} · Uploaded {formatDate(file.uploadedDate)}
          {uploader ? ` by ${uploader}` : ""}
        </p>
        {description && (
          <p className="mt-1 line-clamp-2 text-xs text-foreground/80">{description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onPreview}
          title="Preview"
          aria-label={`Preview ${file.name ?? "file"}`}
          className="flex size-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted"
        >
          <Eye className="size-3.5" />
        </button>

        {hasUrl ? (
          <a
            href={file.downloadUrl}
            download={file.name}
            onClick={onDownloaded}
            title="Download"
            aria-label={`Download ${file.name ?? "file"}`}
            className="flex size-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Download className="size-3.5" />
          </a>
        ) : (
          <span
            title="Download unavailable"
            aria-label="Download unavailable"
            aria-disabled="true"
            className="flex size-7 cursor-not-allowed items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-muted-foreground/40"
          >
            <Download className="size-3.5" />
          </span>
        )}
      </div>
    </div>
  )
}

function DeliverablePreviewDialog({ file, onOpenChange }) {
  const open = Boolean(file)
  const lastFile = useRef(file)
  if (file) lastFile.current = file
  const shown = file ?? lastFile.current

  if (!shown) return null

  const Icon = getFileIcon(shown)
  const type = resolveFileType(shown)
  const hasUrl = Boolean(shown.downloadUrl)
  const isPdf = type === "PDF"
  const isImage = IMAGE_TYPES.includes(type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{shown.name}</DialogTitle>
          <DialogDescription>
            {type ?? "Document"} · {shown.fileSize ?? "Unknown size"}
            {shown.uploadedDate ? ` · Uploaded ${formatDate(shown.uploadedDate)}` : ""}
            {(shown.uploadedBy ?? shown.releasedBy) ? ` by ${shown.uploadedBy ?? shown.releasedBy}` : ""}
          </DialogDescription>
        </DialogHeader>

        {(shown.description ?? shown.note) && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {shown.description ?? shown.note}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
          {hasUrl && isPdf && (
            <iframe
              src={shown.downloadUrl}
              title={`Preview of ${shown.name}`}
              className="h-[60vh] w-full bg-background"
            />
          )}
          {hasUrl && isImage && (
            <div className="flex max-h-[60vh] items-center justify-center overflow-auto bg-background p-2">
              <img
                src={shown.downloadUrl}
                alt={shown.name}
                className="max-h-[56vh] w-auto max-w-full object-contain"
              />
            </div>
          )}
          {(!hasUrl || (!isPdf && !isImage)) && (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {hasUrl ? "Preview isn't available for this file type" : "This file isn't available right now"}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasUrl
                  ? "Download it to open it on your device."
                  : "Please contact your firm if you were expecting to download it."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {hasUrl && (
              <Button asChild type="button" variant="outline" className="gap-2">
                <a
                  href={shown.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${shown.name} in a new tab`}
                >
                  <ExternalLink className="size-3.5" />
                  Open in new tab
                </a>
              </Button>
            )}
            {hasUrl ? (
              <Button asChild type="button" variant="secondary" className="gap-2">
                <a href={shown.downloadUrl} download={shown.name}>
                  <Download className="size-3.5" />
                  Download
                </a>
              </Button>
            ) : (
              <Button type="button" variant="secondary" className="gap-2" disabled>
                <Download className="size-3.5" />
                Download
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeliverablesCard({
  engagementId,
  deliverables = [],
  isLoading = false,
  workflowStage,
}) {
  const [allOpen, setAllOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const { seenIds, markSeen } = useSeenDeliverables(engagementId)

  const sorted = useMemo(() => sortNewestFirst(deliverables), [deliverables])
  const total = sorted.length
  const hasFiles = total > 0
  const previewList = sorted.slice(0, MAX_PREVIEW_DELIVERABLES)
  const hiddenCount = total - MAX_PREVIEW_DELIVERABLES
  const newCount = sorted.filter((d) => !seenIds.has(d.id)).length
  const downloadable = sorted.filter((d) => d.downloadUrl)

  const isFinished = /complet|closed|done|released/i.test(String(workflowStage ?? ""))

  const openPreview = (file) => {
    markSeen(file.id)
    setPreviewFile(file)
  }

  const openAll = () => {
    setAllOpen(true)
  }

  const handleDownloadAll = () => {
    downloadable.forEach((file, index) => {
      // Stagger the clicks so the browser doesn't drop the extra downloads.
      window.setTimeout(() => {
        const link = window.document.createElement("a")
        link.href = file.downloadUrl
        link.download = file.name ?? ""
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        window.document.body.appendChild(link)
        link.click()
        link.remove()
      }, index * 400)
    })
    markSeen(downloadable.map((file) => file.id))
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Deliverables</h3>
            {hasFiles && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {total}
              </span>
            )}
            {newCount > 0 && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                {newCount} new
              </span>
            )}
          </div>
          {hasFiles && (
            <button
              type="button"
              onClick={openAll}
              className="cursor-pointer rounded text-xs font-medium text-emerald-700 transition-colors hover:text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 focus-visible:ring-offset-2"
            >
              See All
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col gap-3 px-5 py-4" aria-busy="true" aria-label="Loading deliverables">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-9 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-3/5 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasFiles ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileText className="size-4" />
            </div>
            <p className="text-sm font-medium text-foreground">No deliverables yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {isFinished
                ? "Your firm hasn't attached any files to this engagement. Contact them if you were expecting something."
                : "Your firm is still working on this engagement. Completed files will appear here as soon as they're released."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {previewList.map((file) => (
              <DeliverableRow
                key={file.id}
                file={file}
                isNew={!seenIds.has(file.id)}
                onPreview={() => openPreview(file)}
                onDownloaded={() => markSeen(file.id)}
              />
            ))}
            {hiddenCount > 0 && (
              <div className="px-5 py-2.5">
                <button
                  type="button"
                  onClick={openAll}
                  className="cursor-pointer text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  +{hiddenCount} more deliverable{hiddenCount === 1 ? "" : "s"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── All Deliverables Dialog ───────────────────────────────────────── */}
      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-xl flex-col">
          <DialogHeader>
            <DialogTitle>All Deliverables</DialogTitle>
            <DialogDescription>
              Files your firm has released for this engagement, newest first.
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-1 flex-1 divide-y divide-border/60 overflow-y-auto">
            {sorted.map((file) => (
              <DeliverableRow
                key={file.id}
                file={file}
                isNew={!seenIds.has(file.id)}
                onPreview={() => openPreview(file)}
                onDownloaded={() => markSeen(file.id)}
              />
            ))}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setAllOpen(false)}>
              Close
            </Button>
            {downloadable.length > 1 && (
              <Button type="button" variant="secondary" className="gap-2" onClick={handleDownloadAll}>
                <Download className="size-3.5" />
                Download all ({downloadable.length})
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeliverablePreviewDialog
        file={previewFile}
        onOpenChange={(isOpen) => !isOpen && setPreviewFile(null)}
      />
    </>
  )
}

function DocumentStatusDialog({ open, onOpenChange, status, remark }) {
  const [showRemarks, setShowRemarks] = useState(false)

  const handleOpenChange = (next) => {
    if (!next) setShowRemarks(false)
    onOpenChange(next)
  }

  if (!status) return null

  const label = statusLabels[status] ?? statusLabels.missing
  const badgeClass = statusBadgeStyles[status] ?? statusBadgeStyles.missing
  const helpText = statusHelp[status] ?? ""
  const theme = statusDialogTheme[status] ?? statusDialogTheme.missing

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
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${badgeClass}`}>
                  {label}
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
                {getRemarkText(status, remark)}
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

  // TODO: point this at your Supabase deliverables data (hook or field).
  // If you move this to its own hook, pass that hook's isLoading below.
  const deliverables = engagement?.deliverables ?? []
  const isDeliverablesLoading = false

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
            <DeliverablesCard
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

                              <div className="flex items-center gap-1">
                                {doc.downloadUrl ? (
                                  <a
                                    href={doc.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View File"
                                    aria-label={`View ${doc.name} in a new tab`}
                                    className="flex size-6 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted"
                                  >
                                    <Eye className="size-3.5" />
                                  </a>
                                ) : (
                                  <span
                                    title="View File"
                                    aria-label="View file unavailable"
                                    aria-disabled="true"
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
                                    aria-label={`Download ${doc.name}`}
                                    className="flex size-6 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                                  >
                                    <Download className="size-3.5" />
                                  </a>
                                ) : (
                                  <span
                                    title="Download"
                                    aria-label="Download unavailable"
                                    aria-disabled="true"
                                    className="flex size-6 shrink-0 cursor-not-allowed items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-muted-foreground/40"
                                  >
                                    <Download className="size-3.5" />
                                  </span>
                                )}
                              </div>
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
        status={statusDocTask?.status}
        remark={statusDocTask?.remark}
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