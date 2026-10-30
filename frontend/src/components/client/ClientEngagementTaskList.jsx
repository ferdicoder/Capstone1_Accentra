import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Inbox,
  Info,
  Loader2,
  Lock,
  Upload,
  UploadCloud,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatDate } from "@/components/firm/engagements/engagement-variants"

// ── Status Helpers ────────────────────────────────────────────────────────────

const statusConfig = {
  approved: {
    label: "Approved",
    dotColor: "bg-emerald-500",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25",
  },
  for_review: {
    label: "For Review",
    dotColor: "bg-amber-500",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/25",
  },
  for_revision: {
    label: "For Revision",
    dotColor: "bg-orange-500",
    className: "bg-orange-500/10 text-orange-700 ring-orange-500/25",
  },
  missing: {
    label: "Missing",
    dotColor: "bg-red-500",
    className: "bg-red-500/10 text-red-600 ring-red-500/25",
  },
}

// "For Review", "for-review" and "for_review" all mean the same status.
// Exported so the Documents tab reads statuses the same way.
export const normalizeStatus = (status) =>
  String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")

// Only these two are locked. Everything else (Missing, For Revision, and any
// status the badge shows as Missing) can be uploaded to.
// Exported: these are also the only statuses whose documents the Documents tab shows.
export const LOCKED_STATUSES = ["approved", "for_review"]

const canUploadFiles = (task) =>
  Boolean(task) && !LOCKED_STATUSES.includes(task.status)

// Shown instead of the upload actions when a task is locked.
const lockedNotes = {
  approved: "Approved. No further action needed.",
  for_review: "Waiting for your firm to review.",
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"]

// The backend takes one file per request, so files picked together are
// uploaded one after another and can be saved minutes apart. Files saved this
// close to the newest one count as the same submission.
const SAME_SUBMISSION_WINDOW_MS = 10 * 60 * 1000

// ── Document Helpers ──────────────────────────────────────────────────────────

// One shape for every file in this component. A document can arrive as:
//   - a row straight from the upload endpoint (file_name, doc_id, created_at, ...)
//   - a mapped document from the documents list (name, id, downloadUrl, ...)
// Pass the original File as the second argument for a file that was just
// uploaded, so it can still be previewed before it has a download link.
export function normalizeDocument(source, file = null) {
  const raw = source ?? {}
  const downloadUrl = raw.downloadUrl ?? null
  return {
    id: raw.id ?? raw.doc_id ?? null,
    taskId: raw.engagementTaskId ?? raw.engagement_task_id ?? null,
    name: raw.name ?? raw.file_name ?? raw.fileName ?? file?.name ?? "Untitled file",
    mimeType: raw.mimeType ?? raw.mime_type ?? raw.fileType ?? file?.type ?? null,
    size: raw.size ?? raw.fileSize ?? raw.file_size ?? file?.size ?? null,
    uploadedAt: raw.uploadedAt ?? raw.created_at ?? raw.uploadedDate ?? null,
    downloadUrl,
    file: downloadUrl ? null : file,
  }
}

const toTime = (value) => {
  const time = value ? new Date(value).getTime() : NaN
  return Number.isNaN(time) ? null : time
}

// Every upload is kept on the server, so a task that was rejected and
// resubmitted has the old files and the new ones. Only the newest submission
// is shown. When files carry no upload time there's nothing to compare, so
// all of them are kept.
// Exported so the Documents tab applies the same rule.
export function latestSubmission(files) {
  const times = files.map((file) => toTime(file.uploadedAt))
  const newest = Math.max(...times.filter((time) => time !== null))
  if (!Number.isFinite(newest)) return files
  return files.filter(
    (_, index) => times[index] === null || newest - times[index] <= SAME_SUBMISSION_WINDOW_MS
  )
}

function TaskStatusBadge({ status }) {
  const config = statusConfig[status] ?? statusConfig.missing
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        config.className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  )
}

function LockedNote({ status }) {
  const note = lockedNotes[status]
  if (!note) return null
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Lock className="size-3 shrink-0" aria-hidden="true" />
      {note}
    </span>
  )
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return null
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

function summarizeFiles(files) {
  if (!files || files.length === 0) return ""
  return files.length === 1
    ? files[0].name
    : `${files[0].name} +${files.length - 1} more`
}

// ── Task Detail Dialog (view-only) ─────────────────────────────────────────────

function TaskDetailDialog({ open, onOpenChange, task }) {
  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task.name}</DialogTitle>
          <DialogDescription>Requirement details for this engagement</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <TaskStatusBadge status={task.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Required</span>
            <span className="text-sm font-medium text-foreground">{task.required ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Deadline</span>
            <span className="text-sm font-medium text-foreground">
              {task.deadline ? formatDate(task.deadline) : "No deadline"}
            </span>
          </div>
          {task.status === "for_revision" && task.remark && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-800">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-orange-600">What needs to change</p>
              {task.remark}
            </div>
          )}
          {lockedNotes[task.status] && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {lockedNotes[task.status]} Uploads are turned off for this requirement unless your
                firm asks for a revision.
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Upload Files Dialog ────────────────────────────────────────────────────────
// Step 1: pick the file(s) and click "Attach". Clicking Attach opens the
// confirmation dialog below. Nothing is sent to the firm until it's confirmed.

function TaskFilePickerDialog({ open, onOpenChange, task, onFilesChosen }) {
  const [files, setFiles] = useState([])
  const [error, setError] = useState("")

  const handleChange = (e) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = "" // lets the same file be picked again later

    const accepted = []
    const rejected = []
    picked.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) rejected.push(`${file.name} (not a PDF, JPG, or PNG)`)
      else if (file.size > MAX_FILE_SIZE) rejected.push(`${file.name} (over 10MB)`)
      else accepted.push(file)
    })

    setError(rejected.length ? `Can't attach: ${rejected.join(", ")}` : "")
    setFiles(accepted)
  }

  const handleClose = (next) => {
    if (!next) {
      setFiles([])
      setError("")
    }
    onOpenChange(next)
  }

  const handleAttach = () => {
    if (files.length === 0 || !canUploadFiles(task)) return
    onFilesChosen?.(task, files)
    setFiles([])
    setError("")
    onOpenChange(false)
  }

  if (!task) return null

  // The task can change while this dialog is open (for example after a refresh).
  const locked = !canUploadFiles(task)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Choose the file(s) needed for &ldquo;{task.name}&rdquo;. You&rsquo;ll be asked to confirm
            before anything is sent to your firm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {locked ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
            >
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              This requirement is no longer open for uploads.
            </p>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-[#02353C]/40 hover:bg-muted/30">
              <UploadCloud className="size-6 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Click to choose file(s)</span>
              <span className="text-xs text-muted-foreground">PDF, JPG, or PNG — up to 10MB each</span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={handleChange}
              />
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          {files.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs text-foreground"
                >
                  <FileCheck className="size-3.5 shrink-0 text-emerald-600" />
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="shrink-0 text-muted-foreground">{formatFileSize(f.size)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={locked || files.length === 0}
            onClick={handleAttach}
          >
            Attach
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Attach Confirmation Dialog ─────────────────────────────────────────────────
// Step 2: shown right after "Attach". Same layout as the "Request declined"
// dialog, in the brand colors. "Yes, attach" is where the file is
// actually uploaded.

function WarningIllustration() {
  return (
    <svg viewBox="0 0 320 170" className="mx-auto h-32 w-auto" fill="none" aria-hidden="true">
      {/* soft blob */}
      <ellipse cx="160" cy="84" rx="82" ry="58" className="fill-[#02353C]/5" />
      {/* sparkles */}
      <circle cx="62" cy="40" r="7" className="stroke-emerald-300" strokeWidth="2" />
      <circle cx="262" cy="44" r="6" className="stroke-emerald-300" strokeWidth="2" />
      <circle cx="268" cy="108" r="4" className="fill-emerald-300" />
      <path d="M96 22v10M91 27h10" className="stroke-emerald-300" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 100v8M68 104h8" className="stroke-emerald-300" strokeWidth="2" strokeLinecap="round" />
      <path d="M232 128v8M228 132h8" className="stroke-emerald-300" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 70h42" className="stroke-[#02353C]/10" strokeWidth="3" strokeLinecap="round" />
      <path d="M258 78h44" className="stroke-[#02353C]/10" strokeWidth="3" strokeLinecap="round" />
      {/* ground shadow */}
      <ellipse cx="160" cy="150" rx="40" ry="5" className="fill-[#02353C]/10" />
      {/* document */}
      <rect x="122" y="30" width="76" height="104" rx="8" className="fill-white stroke-[#02353C]" strokeWidth="3" />
      <path d="M122 38a8 8 0 0 1 8-8h60a8 8 0 0 1 8 8v14h-76z" className="fill-[#02353C]/10" />
      <path d="M136 70h48M136 84h48M136 98h30" className="stroke-[#02353C]/20" strokeWidth="3" strokeLinecap="round" />
      {/* warning badge */}
      <circle cx="198" cy="116" r="22" className="fill-[#02353C]" />
      <path d="M198 104v13" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <circle cx="198" cy="126" r="2.5" fill="white" />
    </svg>
  )
}

function AttachConfirmDialog({
  open,
  onOpenChange,
  taskName,
  files = [],
  isSubmitting,
  progress,
  error,
  onConfirm,
}) {
  const handleOpenChange = (next) => {
    if (!next && isSubmitting) return // don't close mid-upload
    onOpenChange(next)
  }

  const plural = files.length > 1
  const done = progress?.done ?? 0

  // Files go up one at a time, so show which one is in flight.
  const submittingLabel =
    progress && progress.total > 1
      ? `Uploading ${Math.min(done + 1, progress.total)} of ${progress.total}…`
      : "Attaching…"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md overflow-hidden">
        {/* brand bar across the top */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#02353C]" aria-hidden="true" />

        <DialogHeader className="items-center gap-1 pt-3 text-center">
          <WarningIllustration />
          <DialogTitle className="text-center text-lg">
            Attach {plural ? "these files" : "this file"}?
          </DialogTitle>
          {taskName && (
            <DialogDescription className="text-center">
              For <span className="font-medium text-foreground">{taskName}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Files being attached */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {plural ? `Files to attach (${files.length})` : "File to attach"}
          </p>
          <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#02353C]/10 text-[#02353C]">
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground" title={f.name}>
                    {f.name}
                  </span>
                  {formatFileSize(f.size) && (
                    <span className="block text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
                  )}
                </span>
                {isSubmitting && i < done && (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-label="Uploaded" />
                )}
                {isSubmitting && i === done && (
                  <Loader2 className="size-4 shrink-0 animate-spin text-[#02353C]" aria-label="Uploading" />
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* What happens next */}
        <div className="flex items-start gap-2 rounded-lg border border-[#02353C]/15 bg-[#02353C]/5 px-3 py-2.5 text-xs text-[#02353C]">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            Your firm will be notified to review {plural ? "them" : "it"}. You won&rsquo;t be able to
            change or delete {plural ? "them" : "it"} unless your firm asks for a revision.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="mt-1 grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Go back
          </Button>
          <Button
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? submittingLabel : error ? "Try again" : "Yes, attach"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── File Preview Dialog ────────────────────────────────────────────────────────
// Lets the client click an uploaded file chip and see what they actually
// submitted. Files come from normalizeDocument().

function FilePreviewDialog({ open, onOpenChange, files = [], taskName }) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Start on the first file each time the dialog opens.
  useEffect(() => {
    if (open) setSelectedIndex(0)
  }, [open, taskName])

  const selectedFile = files[selectedIndex] ?? files[0] ?? null

  // A file that was just uploaded has no download link yet, so preview the
  // copy that is still in the browser.
  const objectUrl = useMemo(() => {
    if (!selectedFile || selectedFile.downloadUrl || !selectedFile.file) return null
    return URL.createObjectURL(selectedFile.file)
  }, [selectedFile])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  if (!selectedFile) return null

  const fileType = selectedFile.mimeType
  const fileUrl = selectedFile.downloadUrl ?? objectUrl
  const isImage = fileType?.startsWith("image/")
  const isPdf = fileType === "application/pdf"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">{selectedFile.name}</DialogTitle>
          <DialogDescription>
            {taskName ? `Uploaded for "${taskName}"` : "Uploaded file"}
            {formatFileSize(selectedFile.size) && ` · ${formatFileSize(selectedFile.size)}`}
          </DialogDescription>
        </DialogHeader>

        {files.length > 1 && (
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
            {files.map((f, i) => (
              <button
                key={`${f.name}-${i}`}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "max-w-[160px] truncate rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                  i === selectedIndex
                    ? "border-[#02353C]/30 bg-[#02353C]/10 text-[#02353C]"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
                title={f.name}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex max-h-[80vh] min-h-[320px] items-center justify-center overflow-auto rounded-lg border border-border bg-muted/30">
          {isImage && fileUrl ? (
            <img
              src={fileUrl}
              alt={selectedFile.name}
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />
          ) : isPdf && fileUrl ? (
            <iframe
              src={fileUrl}
              title={selectedFile.name}
              className="h-[80vh] w-full rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No inline preview available for this file type.
              </p>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#02353C]/20 bg-[#02353C]/5 px-3 py-1.5 text-xs font-medium text-[#02353C] transition-colors hover:bg-[#02353C]/10"
                >
                  <ExternalLink className="size-3.5" />
                  Open in new tab
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Task Row ────────────────────────────────────────────────────────────────────
//
// Actions cell:
//   • Missing / For Revision      → "Upload Files" is the only action. Files
//                                   from an earlier, rejected submission are
//                                   not shown.
//   • For Review / Approved       → locked. No upload, no resubmit. The latest
//                                   submission is view-only, with a note
//                                   explaining why.

function TaskRow({
  task,
  uploadedFiles,
  onOpenDetail,
  onOpenUpload,
  onPreviewUploaded,
}) {
  const canUpload = canUploadFiles(task)
  const hasUploaded = uploadedFiles && uploadedFiles.length > 0

  const uploadedChip = hasUploaded && (
    <button
      type="button"
      title="View uploaded file"
      onClick={onPreviewUploaded}
      className="inline-flex min-w-0 max-w-[200px] items-center gap-1 truncate rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
    >
      <CheckCircle2 className="size-3.5 shrink-0" />
      <span className="truncate underline-offset-2 hover:underline">{summarizeFiles(uploadedFiles)}</span>
    </button>
  )

  return (
    <tr className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/30">
      {/* Requirement Name */}
      <td className="px-6 py-2.5 pr-4">
        <button
          type="button"
          onClick={onOpenDetail}
          className="text-left text-sm font-medium text-foreground hover:text-[#02353C] transition-colors"
        >
          {task.name}
          {task.required && (
            <span className="ml-1 text-xs text-red-500 font-semibold">*</span>
          )}
        </button>
      </td>

      {/* Status */}
      <td className="w-[120px] py-2.5 pr-4">
        <TaskStatusBadge status={task.status} />
      </td>

      {/* Deadline (display only) */}
      <td className="w-[140px] py-2.5 pr-4">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3 shrink-0" />
          {task.deadline ? formatDate(task.deadline) : "No deadline"}
        </span>
      </td>

      {/* Actions */}
      <td className="w-[280px] py-2.5 pr-6">
        {canUpload ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {uploadedChip}
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#02353C]/20 bg-[#02353C]/5 px-2.5 py-1 text-xs font-medium text-[#02353C] transition-colors hover:bg-[#02353C]/10"
            >
              <Upload className="size-3.5" />
              {task.status === "for_revision" ? "Upload Revision" : "Upload Files"}
            </button>
          </div>
        ) : lockedNotes[task.status] || hasUploaded ? (
          <div className="flex flex-col items-start gap-1">
            {uploadedChip}
            <LockedNote status={task.status} />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  )
}

// ── Main ClientEngagementTaskList Component ────────────────────────────────────

const omitKeys = (object, keys) => {
  const next = { ...object }
  keys.forEach((key) => delete next[key])
  return next
}

// onUploadFiles(task, files) must upload the given files and resolve to the
// server's response for them (one entry per file, in the same order). This
// component calls it with ONE file at a time, because the upload endpoint
// accepts a single file per request.
export function TaskList({ engagement, documents = [], className, onUploadFiles }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTaskId, setDetailTaskId] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTaskId, setPickerTaskId] = useState(null)
  // taskId -> File[] (chosen with "Attach", waiting on the confirmation dialog)
  const [pendingByTask, setPendingByTask] = useState({})
  const [uploadedByTask, setUploadedByTask] = useState({}) // taskId -> normalized docs (uploaded)
  // taskId -> files that were saved before a later file in the same upload
  // failed. They are already on the server, so a retry only sends the rest.
  const [partialByTask, setPartialByTask] = useState({})
  // taskId -> the status the task had when the client uploaded. Until the
  // server reports a new status, the row is treated as "For Review" so the
  // client can't upload for the same requirement twice.
  const [submittedFrom, setSubmittedFrom] = useState({})
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTaskId, setPreviewTaskId] = useState(null)
  const [confirmTaskId, setConfirmTaskId] = useState(null) // task waiting on the "are you sure?" dialog
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null) // { done, total } while uploading
  const [submitError, setSubmitError] = useState("")

  const rawTasks = engagement?.tasks

  // Statuses are cleaned up here once, so every check below sees the same value.
  // Tasks the client just uploaded for show as "For Review" until the server catches up.
  const tasks = useMemo(
    () =>
      (rawTasks ?? []).map((task) => {
        const status = normalizeStatus(task.status)
        return submittedFrom[task.id] !== undefined && submittedFrom[task.id] === status
          ? { ...task, status: "for_review" }
          : { ...task, status }
      }),
    [rawTasks, submittedFrom]
  )

  const findTask = (taskId) => tasks.find((t) => t.id === taskId) ?? null
  const detailTask = findTask(detailTaskId)
  const pickerTask = findTask(pickerTaskId)
  const previewTask = findTask(previewTaskId)
  const confirmTask = findTask(confirmTaskId)

  // When the server reports a different status than the one we uploaded from,
  // drop the local lock and the local copy of the files (the persisted
  // documents take over).
  useEffect(() => {
    const serverTasks = rawTasks ?? []

    const released = Object.keys(submittedFrom).filter((id) => {
      const task = serverTasks.find((t) => String(t.id) === id)
      return !task || normalizeStatus(task.status) !== submittedFrom[id]
    })
    if (released.length > 0) {
      setSubmittedFrom((prev) => omitKeys(prev, released))
      setUploadedByTask((prev) => omitKeys(prev, released))
      setPartialByTask((prev) => omitKeys(prev, released))
    }
  }, [rawTasks, submittedFrom])

  // Drop chosen-but-unsent files for any task that can no longer be uploaded to.
  useEffect(() => {
    const stalePending = Object.keys(pendingByTask).filter((id) => {
      const task = tasks.find((t) => String(t.id) === id)
      return !task || !canUploadFiles(task)
    })
    if (stalePending.length > 0) {
      setPendingByTask((prev) => omitKeys(prev, stalePending))
    }
  }, [tasks, pendingByTask])

  // Saved documents grouped by task, in one shape (see normalizeDocument).
  const persistedFilesByTask = useMemo(() => {
    const grouped = {}
    documents.forEach((document) => {
      const file = normalizeDocument(document)
      if (file.taskId === null || file.taskId === undefined) return
      if (!grouped[file.taskId]) grouped[file.taskId] = []
      grouped[file.taskId].push(file)
    })
    return grouped
  }, [documents])

  // The files to show for a task:
  //   - just uploaded this session -> exactly those files
  //   - Missing / For Revision     -> none (what is on file was rejected,
  //                                   or nothing was ever sent)
  //   - For Review / Approved      -> the latest submission only
  const filesFor = (task) => {
    const local = uploadedByTask[task.id]
    if (local) return local
    if (!LOCKED_STATUSES.includes(task.status)) return []
    return latestSubmission(persistedFilesByTask[task.id] ?? [])
  }

  const handleOpenDetail = (task) => {
    setDetailTaskId(task.id)
    setDetailOpen(true)
  }

  const handleOpenUpload = (task) => {
    // Uploading is for a first submission (missing) or a revision only.
    if (!canUploadFiles(task)) return
    setPickerTaskId(task.id)
    setPickerOpen(true)
  }

  const clearPending = (taskId) => {
    setPendingByTask((prev) => omitKeys(prev, [taskId]))
  }

  // "Attach": hold the files and open the "are you sure?" warning.
  // Nothing is uploaded yet.
  const handleFilesChosen = (task, files) => {
    if (!canUploadFiles(findTask(task.id))) return
    setPendingByTask((prev) => ({ ...prev, [task.id]: files }))
    setSubmitError("")
    setConfirmTaskId(task.id)
  }

  // "Yes, attach": this is where the upload actually happens.
  // The backend saves one file per request, so the files go up one after
  // another. If one fails, the files before it are already saved, so only the
  // rest stay pending. Retrying then can't create duplicates.
  const handleConfirmSubmit = async () => {
    if (isSubmitting) return

    const task = confirmTask
    const files = task ? pendingByTask[task.id] : null
    if (!task || !files || files.length === 0) return

    if (!onUploadFiles) {
      setSubmitError("Uploading isn't available right now.")
      return
    }

    // The task may have been locked since the dialog opened.
    if (!canUploadFiles(task)) {
      setSubmitError("This requirement is no longer open for uploads.")
      return
    }

    setSubmitError("")
    setIsSubmitting(true)
    setUploadProgress({ done: 0, total: files.length })

    const saved = []
    try {
      for (const file of files) {
        const result = await onUploadFiles(task, [file])
        const record = Array.isArray(result) ? result[0] : result
        saved.push(normalizeDocument(record, file))
        setUploadProgress({ done: saved.length, total: files.length })
      }

      setUploadedByTask((prev) => ({
        ...prev,
        [task.id]: [...(partialByTask[task.id] ?? []), ...saved],
      }))
      setPartialByTask((prev) => omitKeys(prev, [task.id]))
      setSubmittedFrom((prev) => ({ ...prev, [task.id]: task.status }))
      clearPending(task.id)
      setConfirmTaskId(null)
    } catch (error) {
      console.error("Task upload failed:", error)
      const message = error?.message || "File upload failed."

      if (saved.length > 0) {
        const remaining = files.slice(saved.length)
        setPartialByTask((prev) => ({
          ...prev,
          [task.id]: [...(prev[task.id] ?? []), ...saved],
        }))
        setPendingByTask((prev) => ({ ...prev, [task.id]: remaining }))
        setSubmitError(
          `${saved.length} of ${files.length} files uploaded. ${message} Try again to send the remaining ${
            remaining.length === 1 ? "file" : "files"
          }.`
        )
      } else {
        setSubmitError(`${message} Please try again.`)
      }
    } finally {
      setIsSubmitting(false)
      setUploadProgress(null)
    }
  }

  // "Go back" / close: nothing was sent, so drop the chosen files.
  const handleConfirmDialogChange = (next) => {
    if (next) return
    if (confirmTaskId !== null) clearPending(confirmTaskId)
    setConfirmTaskId(null)
    setSubmitError("")
  }

  const handlePreviewUploaded = (task) => {
    setPreviewTaskId(task.id)
    setPreviewOpen(true)
  }

  const requiredCount = tasks.filter((t) => t.required).length
  const completedCount = tasks.filter((t) => t.status === "approved").length

  return (
    <div className={cn("min-w-0 rounded-xl border border-border bg-card shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Requirements</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completedCount} of {tasks.length} completed
            {requiredCount > 0 && ` · ${requiredCount} required`}
          </p>
        </div>
      </div>

      {/* Upload rules, so clients know when they can and can't upload */}
      {tasks.length > 0 && (
        <div className="flex items-start gap-2 border-b border-border bg-muted/30 px-6 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            You can upload files for requirements that are{" "}
            <span className="font-medium text-foreground">Missing</span> or{" "}
            <span className="font-medium text-foreground">For Revision</span>. Requirements that are{" "}
            <span className="font-medium text-foreground">For Review</span> or{" "}
            <span className="font-medium text-foreground">Approved</span> are locked, so you can&rsquo;t
            upload or replace files for them.
          </p>
        </div>
      )}

      {/* Table */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">No requirements available</p>
          <p className="text-xs text-muted-foreground/70">
            There are currently no requirements assigned to this engagement.
          </p>
        </div>
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[680px] table-fixed">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-2.5 text-xs font-medium text-muted-foreground">Requirement</th>
                <th className="w-[120px] px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="w-[140px] px-4 py-2.5 text-xs font-medium text-muted-foreground">Deadline</th>
                <th className="w-[280px] px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  uploadedFiles={filesFor(task)}
                  onOpenDetail={() => handleOpenDetail(task)}
                  onOpenUpload={() => handleOpenUpload(task)}
                  onPreviewUploaded={() => handlePreviewUploaded(task)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={detailTask}
      />

      <TaskFilePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        task={pickerTask}
        onFilesChosen={handleFilesChosen}
      />

      <AttachConfirmDialog
        open={Boolean(confirmTask)}
        onOpenChange={handleConfirmDialogChange}
        taskName={confirmTask?.name}
        files={confirmTask ? pendingByTask[confirmTask.id] ?? [] : []}
        isSubmitting={isSubmitting}
        progress={uploadProgress}
        error={submitError}
        onConfirm={handleConfirmSubmit}
      />

      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        files={previewTask ? filesFor(previewTask) : []}
        taskName={previewTask?.name}
      />
    </div>
  )
}