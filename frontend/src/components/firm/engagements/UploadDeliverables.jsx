import { useState } from "react"
import { FileText, FileSpreadsheet, FileImage, File, Upload, Download, Eye, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileDropzone,
  FilePreviewDialog,
  SelectedFileList,
} from "@/components/shared/file-preview-dialog"
import { formatDate } from "./engagement-variants"

// ── File icon helpers ─────────────────────────────────────────────────────────

function FileTypeIcon({ fileType, className }) {
  const resolvedType = resolveFileType(fileType)
  if (["XLS", "XLSX", "CSV"].includes(resolvedType)) {
    return <FileSpreadsheet className={className} />
  }
  if (["PNG", "JPG", "JPEG", "GIF", "WEBP"].includes(resolvedType)) {
    return <FileImage className={className} />
  }
  if (resolvedType === "ZIP") return <File className={className} />
  return <FileText className={className} />
}

function resolveFileType(file) {
  const value = typeof file === "string" ? file : file?.fileType ?? file?.mimeType
  const normalized = value?.toString().toLowerCase()
  if (normalized === "application/pdf") return "PDF"
  if (normalized?.startsWith("image/")) return normalized.split("/").pop().toUpperCase()
  if (normalized?.includes("spreadsheet") || normalized?.includes("excel")) return "XLSX"
  if (normalized?.includes("word")) return "DOCX"
  if (normalized?.startsWith("text/csv")) return "CSV"
  if (normalized?.includes("/")) return null
  return normalized?.toUpperCase()
}

// The shared preview dialog reads one shape for every file in the app.
// (fileSize here is a display string like "2.1 MB", so it is not passed as a size.)
// The deliverables endpoint only shows a file inline when asked with
// "?inline=true", so that link is passed as `previewUrl`. The download link
// stays exactly as it is.
function toPreviewFile(document) {
  return {
    id: document.id,
    name: document.name,
    mimeType: document.mimeType ?? null,
    fileType: document.fileType ?? null,
    downloadUrl: document.downloadUrl ?? null,
    previewUrl: document.downloadUrl ? `${document.downloadUrl}?inline=true` : null,
  }
}

// ── Compact Document Row (for the card) ──────────────────────────────────────

function CompactDocumentRow({ document, onPreview }) {
  return (
    <button
      type="button"
      onClick={onPreview}
      className="flex w-full items-center gap-3 px-6 py-2.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02353C]/40 focus-visible:ring-offset-2 cursor-pointer"
      aria-label={`Preview ${document?.name ?? "document"}`}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FileTypeIcon fileType={document} className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground underline-offset-2 hover:underline">{document?.name ?? "—"}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {document?.fileType ?? "—"} · {document?.fileSize ?? "—"}
        </p>
      </div>
      <Eye className="size-3.5 shrink-0 text-muted-foreground" />
    </button>
  )
}

// ── All Deliverables Dialog Row ──────────────────────────────────────────────

function DeliverableDialogRow({ document, onPreview, onDelete, canDelete, isDeleting }) {
  const handleDownload = () => {
    const link = window.document.createElement("a")
    link.href = document.downloadUrl
    link.download = document?.name ?? "document"
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.click()
  }

  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-muted/30">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FileTypeIcon fileType={document} className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onPreview}
          className="max-w-full cursor-pointer truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02353C]/40 focus-visible:ring-offset-2"
          aria-label={`Preview ${document?.name ?? "document"}`}
        >
          {document?.name ?? "—"}
        </button>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {document?.fileType ?? "—"} · {document?.fileSize ?? "—"} · Uploaded {formatDate(document?.uploadedDate)}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="size-7 shrink-0 rounded-md text-muted-foreground hover:text-foreground" />
          }
        >
          <span className="text-lg leading-none">⋯</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="size-4" />
            Download
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(document)}
          disabled={isDeleting}
          aria-label={`Delete ${document?.name ?? "deliverable"}`}
          title="Delete deliverable"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  )
}

// ── Helper to create a file record ───────────────────────────────────────────

function toFileRecord(file) {
  return {
    id: `deliverable-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    type: file.type,
    file,
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

const MAX_PREVIEW_DOCS = 1

// Deliverables can be any file type, so the type check is skipped.
// The shared dropzone's default size limit (10 MB) still applies.
export function UploadDeliverables({
  deliverables = [],
  isUploading = false,
  isDeleting = false,
  canDelete = false,
  onUpload,
  onDelete,
  disabled = false,
  onBlockedAction,
  className,
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [allDocsOpen, setAllDocsOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [deleteDoc, setDeleteDoc] = useState(null)

  const allDeliverables = deliverables
  const hasDocuments = allDeliverables.length > 0
  const previewDocs = allDeliverables.slice(-1)

  const openUploadDialog = () => {
    if (disabled) {
      onBlockedAction?.()
      return
    }
    setSelectedFiles([])
    setDialogOpen(true)
  }

  const handleFilesSelected = (files) => {
    setSelectedFiles(files.map(toFileRecord))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    await onUpload?.(selectedFiles.map((item) => item.file))
    setSelectedFiles([])
    setDialogOpen(false)
  }

  return (
    <>
      <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {hasDocuments ? "Deliverables" : "Upload Deliverables"}
          </h3>
          <div className="flex items-center gap-3">
            {hasDocuments && (
              <button
                type="button"
                onClick={() => setAllDocsOpen(true)}
                className="cursor-pointer text-xs font-medium text-[#02353C] transition-colors hover:underline hover:text-[#02353C]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02353C]/50 focus-visible:ring-offset-2 rounded"
              >
                See All
              </button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                "size-7 shrink-0 rounded-md text-muted-foreground hover:text-foreground",
                disabled && "opacity-50"
              )}
              onClick={openUploadDialog}
              aria-disabled={disabled}
              title={disabled ? "Completed or cancelled engagements cannot accept deliverables" : "Upload deliverables"}
              aria-label="Upload deliverables"
            >
              <Upload className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!hasDocuments && !isUploading ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileText className="size-4" />
            </div>
            <p className="text-sm text-muted-foreground">No deliverables uploaded</p>
          </div>
        ) : (
          /* Document preview list */
          <div className="divide-y divide-border/60">
            {previewDocs.map((doc) => (
              <CompactDocumentRow key={doc.id} document={doc} onPreview={() => setPreviewDoc(doc)} />
            ))}
            {allDeliverables.length > MAX_PREVIEW_DOCS && (
              <div className="px-6 py-2.5">
                <p className="text-xs text-muted-foreground">
                  +{allDeliverables.length - MAX_PREVIEW_DOCS} more deliverable{allDeliverables.length - MAX_PREVIEW_DOCS === 1 ? "" : "s"}
                </p>
              </div>
            )}
            {isUploading &&
              Array.from({ length: Math.max(1, selectedFiles.length) }, (_, index) => (
                <div
                  key={`uploading-${index}`}
                  className="flex items-center gap-3 px-6 py-2.5"
                  role="status"
                  aria-label="Uploading deliverable"
                >
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── Upload Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Deliverables</DialogTitle>
            <DialogDescription>
              Select files to make available for this engagement.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <FileDropzone
              multiple
              accept=""
              allowedTypes={null}
              typeLabel="Any file type"
              disabled={isUploading}
              onSelect={handleFilesSelected}
            />
            <SelectedFileList
              files={selectedFiles}
              disabled={isUploading}
              onRemove={(index) =>
                setSelectedFiles((current) => current.filter((_, i) => i !== index))
              }
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleUpload} disabled={selectedFiles.length === 0 || isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilePreviewDialog
        open={Boolean(previewDoc)}
        onOpenChange={(isOpen) => !isOpen && setPreviewDoc(null)}
        files={previewDoc ? [toPreviewFile(previewDoc)] : []}
        subtitle={
          previewDoc
            ? `${previewDoc.uploadedBy ?? "Deliverable"}${
                previewDoc.uploadedDate ? ` · Uploaded ${formatDate(previewDoc.uploadedDate)}` : ""
              }`
            : undefined
        }
      />

      <Dialog open={Boolean(deleteDoc)} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete deliverable?</DialogTitle>
            <DialogDescription>
              This will permanently delete {deleteDoc?.name ?? "this deliverable"} from the engagement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDoc(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                const deleted = await onDelete?.(deleteDoc.id)
                if (deleted === false) return
                setDeleteDoc(null)
                setAllDocsOpen(false)
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── All Deliverables Dialog ────────────────────────────────────────── */}
      <Dialog open={allDocsOpen} onOpenChange={setAllDocsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>All Deliverables</DialogTitle>
            <DialogDescription>
              All documents uploaded for this engagement.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-1">
            {allDeliverables.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No deliverables uploaded yet.</p>
            ) : (
              allDeliverables.map((doc) => (
                <DeliverableDialogRow
                  key={doc.id}
                  document={doc}
                  onPreview={() => setPreviewDoc(doc)}
                  onDelete={setDeleteDoc}
                  canDelete={canDelete}
                  isDeleting={isDeleting}
                />
              ))
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAllDocsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}