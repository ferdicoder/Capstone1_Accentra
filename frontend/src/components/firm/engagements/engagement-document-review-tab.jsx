import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileImage,
  FileText,
  History as HistoryIcon,
  Inbox,
  Info,
  ListChecks,
  Paperclip,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  FileDropzone,
  FilePreviewDialog,
  SelectedFileList,
} from "@/components/shared/file-preview-dialog"
import { ReviewStatusBadge } from "./review-status-badge"
import { formatTimestamp } from "./engagement-variants"

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const EMPTY = []

// Backend / local status -> ReviewStatusBadge status.
const reviewStatusMap = {
  approved: "approved",
  submitted: "in_review",
  resubmitted: "in_review",
  for_review: "in_review",
  in_review: "in_review",
  for_revision: "revision_requested",
  revision_requested: "revision_requested",
  missing: "pending",
  pending: "pending",
}

// A document that already has a file behind it can't be "missing" or "pending":
// the client has uploaded it and it is waiting on the firm. This fixes rows that
// show "Missing" next to a real uploaded file.
const effectiveStatus = (doc) => {
  const raw = doc.status
  const hasFile = Boolean(doc.downloadUrl || doc.uploadedDate)
  if ((raw === "missing" || raw === "pending" || !raw) && hasFile) return "submitted"
  return raw
}

const toBadgeStatus = (status) => reviewStatusMap[status] ?? "pending"
const needsReview = (doc) => toBadgeStatus(effectiveStatus(doc)) === "in_review"

// History rows with these actions are document reviews. Everything else is an
// engagement status change or a posted update.
const REVIEW_ACTIONS = new Set([
  "approved",
  "for_revision",
  "revision_requested",
  "submitted",
  "resubmitted",
])

const humanize = (value) =>
  value ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : ""

const isStatusToken = (value) => /^[a-z]+(_[a-z]+)*$/.test(value ?? "")

const formatFileSize = (size) => {
  if (!size) return "-"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const IMAGE_TYPES = ["PNG", "JPG", "JPEG", "GIF", "WEBP"]

const getFileType = (document) =>
  document.fileType || document.mimeType?.split("/").pop()?.toUpperCase() || "FILE"

const getInitials = (name) => {
  if (!name) return "AC"
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")
}

// Name of the engagement task this document was submitted for.
// Adjust the field names to whatever the documents endpoint returns.
const getTaskName = (document) =>
  document.taskName ?? document.taskTitle ?? document.task?.name ?? document.task?.title ?? null

// The documents endpoint only shows a file inline when asked with "inline=true".
// Handles URLs that already carry a query string (signed URLs), which the old
// `${url}?inline=true` broke.
const withInline = (url) => {
  if (!url) return null
  return `${url}${url.includes("?") ? "&" : "?"}inline=true`
}

const REFERENCE_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.zip"

const FILTERS = [
  { key: "all", label: "All" },
  { key: "review", label: "To review" },
  { key: "done", label: "Reviewed" },
]

/* -------------------------------------------------------------------------- */
/* Review queue                                                               */
/* -------------------------------------------------------------------------- */

function ReviewQueueItem({ document, isSelected, onSelect }) {
  const isImage = IMAGE_TYPES.includes(getFileType(document))
  const Icon = isImage ? FileImage : FileText

  return (
    <button
      type="button"
      onClick={() => onSelect(document)}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors",
        isSelected ? "border-l-[#02353C] bg-[#02353C]/5" : "border-l-transparent hover:bg-muted/50"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
          isSelected ? "bg-[#02353C]/10 text-[#02353C]" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p
          title={document.name}
          className={cn("truncate text-sm font-medium", isSelected ? "text-[#02353C]" : "text-foreground")}
        >
          {document.name}
        </p>
        {getTaskName(document) && (
          <p
            title={getTaskName(document)}
            className="flex min-w-0 items-center gap-1 text-xs text-foreground/80"
          >
            <ListChecks className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{getTaskName(document)}</span>
          </p>
        )}
        <p className="truncate text-xs text-muted-foreground">
          {document.uploadedBy ?? "Client"}
          {document.uploadedDate ? `, ${formatTimestamp(document.uploadedDate)}` : ""}
        </p>
        <div className="pt-0.5">
          <ReviewStatusBadge status={toBadgeStatus(effectiveStatus(document))} />
        </div>
      </div>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* History (inline timeline, replaces the slide-over drawer)                  */
/* -------------------------------------------------------------------------- */

function HistoryItem({ item, isLast }) {
  const isReview = REVIEW_ACTIONS.has(item.action)
  const comment = item.comment ?? ""
  const commentIsStatus = isStatusToken(comment)

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px]">{getInitials(item.userName)}</AvatarFallback>
        </Avatar>
        {!isLast && <div className="mt-2 w-px flex-1 bg-border" />}
      </div>
      <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{item.userName}</p>
          {isReview ? (
            <ReviewStatusBadge status={toBadgeStatus(item.action)} />
          ) : (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {commentIsStatus ? "Status change" : "Update"}
            </span>
          )}
          <span className="text-xs text-muted-foreground/70">{formatTimestamp(item.timestamp)}</span>
        </div>
        {comment && (
          <p className="mt-1 break-words text-xs text-muted-foreground">
            {!isReview && commentIsStatus ? `Moved to ${humanize(comment)}` : comment}
          </p>
        )}
        {item.references && item.references.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.references.map((ref) => (
              <span
                key={ref.id}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                <Paperclip className="size-2.5" />
                {ref.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryDrawer({ open, onClose, history }) {
  return (
    <aside
      aria-label="Activity history"
      aria-hidden={!open}
      className={cn(
        "fixed inset-y-4 right-4 z-40 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-border bg-card shadow-xl",
        "transition-[transform,visibility] duration-200 ease-out motion-reduce:transition-none",
        open ? "visible translate-x-0" : "invisible translate-x-[110%]"
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">History</h3>
          <p className="text-xs text-muted-foreground">Reviews, status changes, and updates</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label="Close history">
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {history.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No history yet</p>
        ) : (
          history.map((item, index) => (
            <HistoryItem key={item.id} item={item} isLast={index === history.length - 1} />
          ))
        )}
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/* Main tab                                                                   */
/* -------------------------------------------------------------------------- */

export function EngagementDocumentReviewTab({
  documents: providedDocuments = EMPTY,
  history = EMPTY,
  onReview,
  className,
  preselectedDocName,
  engagementStatus, // optional: "completed" | "cancelled" | ... (shows an info note only)
  ...props
}) {
  // Optimistic status per document so the queue and badges update instantly.
  const [statusOverrides, setStatusOverrides] = useState({})
  const documents = providedDocuments.map((doc) => ({
    ...doc,
    status: statusOverrides[doc.id] ?? doc.status,
  }))

  const [selectedId, setSelectedId] = useState(() => {
    const byName = preselectedDocName && providedDocuments.find((d) => d.name === preselectedDocName)
    if (byName) return byName.id
    const firstPending = providedDocuments.find((d) => needsReview(d))
    return (firstPending ?? providedDocuments[0])?.id ?? null
  })
  const selectedDoc = documents.find((d) => d.id === selectedId) ?? documents[0] ?? null

  const [filter, setFilter] = useState("all")
  const [remarks, setRemarks] = useState("")
  const [remarksError, setRemarksError] = useState("")
  const [actionNotice, setActionNotice] = useState("")
  const [referenceFiles, setReferenceFiles] = useState([])
  const [showAttach, setShowAttach] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  // Esc closes the history drawer.
  useEffect(() => {
    if (!historyOpen) return
    const onKey = (e) => e.key === "Escape" && setHistoryOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [historyOpen])

  const pendingCount = documents.filter(needsReview).length
  const isClosedEngagement = engagementStatus === "completed" || engagementStatus === "cancelled"

  const counts = {
    all: documents.length,
    review: pendingCount,
    done: documents.length - pendingCount,
  }

  const visibleDocuments = useMemo(() => {
    if (filter === "review") return documents.filter(needsReview)
    if (filter === "done") return documents.filter((d) => !needsReview(d))
    return documents
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, filter])

  const resetDraft = () => {
    setRemarks("")
    setRemarksError("")
    setReferenceFiles([])
    setShowAttach(false)
  }

  const handleSelect = (doc) => {
    if (doc.id === selectedDoc?.id) return
    setSelectedId(doc.id)
    resetDraft() // remarks belong to one document, never carry them over
  }

  const finishReview = (doc, status, notice) => {
    setStatusOverrides((prev) => ({ ...prev, [doc.id]: status }))
    resetDraft()

    // Move on to the next document that still needs a decision.
    const next = documents.find((d) => d.id !== doc.id && needsReview(d))
    if (next) setSelectedId(next.id)

    setActionNotice(next ? `${notice}. Showing the next document to review.` : notice)
    setTimeout(() => setActionNotice(""), 3500)
  }

  const handleApprove = () => {
    if (!selectedDoc) return
    onReview?.(selectedDoc, "approved", remarks.trim() || "Document approved.")
    finishReview(selectedDoc, "approved", `${selectedDoc.name} approved`)
  }

  const handleRequestRevision = () => {
    if (!remarks.trim()) {
      setRemarksError("Add remarks so the client knows what to fix.")
      return
    }
    if (!selectedDoc) return
    onReview?.(selectedDoc, "for_revision", remarks.trim())
    finishReview(selectedDoc, "for_revision", `Revision requested for ${selectedDoc.name}`)
  }

  const handleFilesSelected = (files) => {
    const newFiles = files.map((file) => ({
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      type: file.type,
      ext: file.name.split(".").pop()?.toUpperCase() ?? "",
      size: file.size,
      file,
    }))
    setReferenceFiles((prev) => [...prev, ...newFiles])
  }

  const removeReferenceFile = (index) => {
    setReferenceFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const fileType = selectedDoc ? getFileType(selectedDoc) : null

  // Same shared preview dialog the Reports page uses. Preview is a dialog,
  // not an inline card, so the page never needs a fixed-height viewer.
  const previewFile = selectedDoc
    ? {
        id: selectedDoc.id,
        name: selectedDoc.name,
        mimeType: selectedDoc.mimeType ?? null,
        fileType: selectedDoc.fileType ?? null,
        size: selectedDoc.fileSize ?? null,
        downloadUrl: selectedDoc.downloadUrl ?? null,
        previewUrl: withInline(selectedDoc.downloadUrl),
      }
    : null

  const selectedStatus = toBadgeStatus(effectiveStatus(selectedDoc ?? {}))
  const isApproved = selectedStatus === "approved"
  const isAwaitingRevision = selectedStatus === "revision_requested"
  const FileIcon = IMAGE_TYPES.includes(fileType) ? FileImage : FileText

  return (
    <div
      data-slot="engagement-document-review-tab"
      className={cn(
        "grid min-w-0 grid-cols-1 gap-4 lg:min-h-[520px] lg:grid-cols-[320px_minmax(0,1fr)]",
        className
      )}
      {...props}
    >
      {/* ------------------------------ Queue ------------------------------ */}
      <section className="relative min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex h-full max-h-[320px] flex-col lg:absolute lg:inset-0 lg:max-h-none">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Review queue</h3>
            <p className="text-xs text-muted-foreground">
              {documents.length === 0
                ? "No documents yet"
                : pendingCount > 0
                  ? `${pendingCount} of ${documents.length} waiting for review`
                  : `All ${documents.length} reviewed`}
            </p>
          </div>
          {documents.length > 1 && (
            <div className="flex gap-1 rounded-lg bg-muted p-0.5" role="tablist" aria-label="Filter documents">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.key}
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    filter === item.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label} <span className="text-muted-foreground/70">{counts[item.key]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col divide-y divide-border overflow-y-auto">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <Inbox className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">The client hasn't submitted any documents yet.</p>
            </div>
          ) : visibleDocuments.length === 0 ? (
            <p className="px-4 py-10 text-center text-xs text-muted-foreground">
              No documents in this view.
            </p>
          ) : (
            visibleDocuments.map((doc) => (
              <ReviewQueueItem
                key={doc.id}
                document={doc}
                isSelected={selectedDoc?.id === doc.id}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
        </div>
      </section>

      {/* ---------------------------- Detail column ------------------------ */}
      <section className="flex min-w-0 flex-col gap-4">
        {isClosedEngagement && (
          <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <p>
              This engagement is {engagementStatus}. Reviews recorded here are saved to the document
              history and don't change the engagement status.
            </p>
          </div>
        )}

        {actionNotice && (
          <div
            role="status"
            className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset"
          >
            {actionNotice}
          </div>
        )}

        {selectedDoc ? (
          <>
            {/* One card: the uploaded file on top, the review decision below */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p title={selectedDoc.name} className="truncate text-sm font-semibold text-foreground">
                        {selectedDoc.name}
                      </p>
                      <ReviewStatusBadge status={selectedStatus} />
                    </div>
                    {getTaskName(selectedDoc) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Task: <span className="font-medium text-foreground">{getTaskName(selectedDoc)}</span>
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {fileType} · {formatFileSize(selectedDoc.fileSize)}
                      {selectedDoc.uploadedBy ? ` · Submitted by ${selectedDoc.uploadedBy}` : ""}
                      {selectedDoc.uploadedDate ? ` on ${formatTimestamp(selectedDoc.uploadedDate)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={!selectedDoc.downloadUrl}
                    onClick={() => setPreviewOpen(true)}
                  >
                    <Eye className="size-3.5" />
                    Preview
                  </Button>
                  {selectedDoc.downloadUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={selectedDoc.downloadUrl} download={selectedDoc.name} className="inline-flex items-center gap-1.5">
                        <Download className="size-3.5" />
                        Download
                      </a>
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled>
                      <Download className="size-3.5" />
                      Download
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant={historyOpen ? "secondary" : "outline"}
                    size="sm"
                    className="gap-1.5"
                    aria-expanded={historyOpen}
                    onClick={() => setHistoryOpen((open) => !open)}
                  >
                    <HistoryIcon className="size-3.5" />
                    History
                    {history.length > 0 && (
                      <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                        {history.length}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-1 flex-col border-t border-border bg-muted/20 p-4">
                {isApproved ? (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-700">This document has been approved.</p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label htmlFor="review-remarks" className="text-sm font-semibold text-foreground">
                          Review decision
                        </label>
                        <span className="text-xs text-muted-foreground">Remarks are shown to the client</span>
                      </div>
                      <textarea
                        id="review-remarks"
                        value={remarks}
                        onChange={(e) => {
                          setRemarks(e.target.value)
                          if (remarksError) setRemarksError("")
                        }}
                        placeholder="Optional for approval. Required to request a revision."
                        rows={3}
                        aria-invalid={!!remarksError}
                        className={cn(
                          "min-h-[88px] w-full flex-1 resize-none rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                          remarksError && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                      {remarksError && <p className="text-xs text-red-500">{remarksError}</p>}
                    </div>

                    {showAttach && (
                      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
                        <SelectedFileList files={referenceFiles} onRemove={removeReferenceFile} />
                        <FileDropzone
                          multiple
                          accept={REFERENCE_ACCEPT}
                          allowedTypes={null}
                          typeLabel="PDF, Word, Excel, CSV, image, TXT, or ZIP"
                          onSelect={handleFilesSelected}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground"
                        aria-expanded={showAttach}
                        onClick={() => setShowAttach((open) => !open)}
                      >
                        <Paperclip className="size-4" />
                        {referenceFiles.length > 0 ? `Reference files (${referenceFiles.length})` : "Attach reference files"}
                      </Button>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                          onClick={handleRequestRevision}
                          disabled={isAwaitingRevision}
                          title={isAwaitingRevision ? "Waiting for the client to resubmit" : undefined}
                        >
                          <AlertCircle className="size-4" /> Request revision
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-lg bg-[#02353C] text-white hover:opacity-90"
                          onClick={handleApprove}
                        >
                          <CheckCircle2 className="size-4" /> Approve
                        </Button>
                      </div>
                    </div>
                    {isAwaitingRevision && (
                      <p className="text-xs text-muted-foreground">
                        A revision was already requested. You can approve once the client resubmits.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-16 text-center shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Select a document to review</p>
            <p className="text-sm text-muted-foreground">Choose a document from the review queue to begin.</p>
          </div>
        )}
      </section>

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} history={history} />

      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        files={previewFile ? [previewFile] : []}
        subtitle={selectedDoc ? `Submitted by ${selectedDoc.uploadedBy ?? "client"}` : undefined}
      />
    </div>
  )
}