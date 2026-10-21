import { useEffect, useMemo, useRef, useState } from "react"
import {
  Download,
  ExternalLink,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/components/firm/engagements/engagement-variants"

// ── File helpers ──────────────────────────────────────────────────────────────

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
  const mimeType = file?.mimeType?.toString().toLowerCase()
  const mimeExtension = mimeType?.split("/").pop()?.toUpperCase()
  const normalizedMimeType = mimeType === "application/pdf"
    ? "PDF"
    : mimeType?.startsWith("image/")
      ? mimeExtension
      : mimeType?.startsWith("text/csv")
        ? "CSV"
        : mimeType?.includes("spreadsheet") || mimeType?.includes("excel")
          ? "XLSX"
          : mimeType?.includes("word")
            ? "DOCX"
            : null
  if (explicit?.includes("/")) return normalizedMimeType
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

// ── "New" tracking ────────────────────────────────────────────────────────────
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

// ── Row ───────────────────────────────────────────────────────────────────────

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

// ── Preview dialog ────────────────────────────────────────────────────────────

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
  const previewUrl = hasUrl ? `${shown.downloadUrl}?inline=true` : null
  const uploader = shown.uploadedBy ?? shown.releasedBy
  const description = shown.description ?? shown.note

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{shown.name}</DialogTitle>
          <DialogDescription>
            {type ?? "Document"} · {shown.fileSize ?? "Unknown size"}
            {shown.uploadedDate ? ` · Uploaded ${formatDate(shown.uploadedDate)}` : ""}
            {uploader ? ` by ${uploader}` : ""}
          </DialogDescription>
        </DialogHeader>

        {description && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {description}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
          {hasUrl && isPdf && (
            <iframe
              src={previewUrl}
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

// ── Main component ────────────────────────────────────────────────────────────

export function ClientEngagementDeliverables({
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
              onClick={() => setAllOpen(true)}
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
                  onClick={() => setAllOpen(true)}
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

export default ClientEngagementDeliverables