import { useRef, useState } from "react"
import { FileText, FileSpreadsheet, FileImage, File, Upload, X, Download, Eye } from "lucide-react"

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
import { formatDate } from "./engagement-variants"

// ── File icon helpers ─────────────────────────────────────────────────────────

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
  ZIP: File,
}

function getFileIcon(fileType) {
  return fileIconMap[resolveFileType(fileType)] ?? FileText
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

// ── Compact Document Row (for the card) ──────────────────────────────────────

function CompactDocumentRow({ document, onPreview }) {
  const Icon = getFileIcon(document)

  return (
    <button
      type="button"
      onClick={onPreview}
      className="flex w-full items-center gap-3 px-6 py-2.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02353C]/40 focus-visible:ring-offset-2 cursor-pointer"
      aria-label={`Preview ${document?.name ?? "document"}`}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
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

function DocumentPreviewDialog({ open, onOpenChange, document }) {
  if (!document) return null

  const Icon = getFileIcon(document)
  const fileType = resolveFileType(document)
  const previewUrl = document.downloadUrl ? `${document.downloadUrl}?inline=true` : null
  const isPdf = fileType === "PDF"
  const isImage = ["PNG", "JPG", "JPEG", "GIF", "WEBP"].includes(fileType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="truncate">{document.name}</DialogTitle>
          <DialogDescription>
            {document.fileType ?? "Document"} · {document.fileSize ?? "Unknown size"}
            {document.uploadedDate ? ` · Uploaded ${formatDate(document.uploadedDate)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-background/80 px-3 py-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{document.name}</p>
              <p className="text-xs text-muted-foreground">{document.uploadedBy ?? "Uploaded document"}</p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-background/70">
            {previewUrl && isPdf && (
              <iframe
                src={previewUrl}
                title={`Preview of ${document.name}`}
                className="h-[60vh] w-full"
              />
            )}
            {previewUrl && isImage && (
              <div className="flex max-h-[60vh] items-center justify-center overflow-auto p-2">
                <img src={previewUrl} alt={document.name} className="max-h-[56vh] max-w-full object-contain" />
              </div>
            )}
            {(!previewUrl || (!isPdf && !isImage)) && (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
                <FileText className="size-5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {previewUrl ? "Preview isn't available for this file type" : "File isn't available"}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            asChild
          >
            <a href={document.downloadUrl} download={document.name}>
              <Download className="size-3.5" />
              Download
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── All Deliverables Dialog Row ──────────────────────────────────────────────

function DeliverableDialogRow({ document, onPreview }) {
  const Icon = getFileIcon(document)

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
        <Icon className="size-4" />
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

export function UploadDeliverables({
  deliverables = [],
  isUploading = false,
  onUpload,
  className,
}) {
  const inputRef = useRef(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [allDocsOpen, setAllDocsOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])

  const allDeliverables = deliverables
  const hasDocuments = allDeliverables.length > 0
  const previewDocs = allDeliverables.slice(-1)

  const openUploadDialog = () => {
    setSelectedFiles([])
    setDialogOpen(true)
  }

  const handleFileSelect = (event) => {
    setSelectedFiles(Array.from(event.target.files ?? []).map(toFileRecord))
    event.target.value = ""
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
              className="size-7 shrink-0 rounded-md text-muted-foreground hover:text-foreground"
              onClick={openUploadDialog}
              aria-label="Upload deliverables"
              title="Upload deliverables"
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
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex flex-col gap-3">
            <Button type="button" variant="outline" className="gap-1.5" onClick={() => inputRef.current?.click()}>
              <Upload className="size-3.5" />
              Choose files
            </Button>
            {selectedFiles.length > 0 && (
              <div className="flex flex-col gap-2">
                {selectedFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setSelectedFiles((current) => current.filter((item) => item.id !== file.id))}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleUpload} disabled={selectedFiles.length === 0 || isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentPreviewDialog open={Boolean(previewDoc)} onOpenChange={(isOpen) => !isOpen && setPreviewDoc(null)} document={previewDoc} />

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
                <DeliverableDialogRow key={doc.id} document={doc} onPreview={() => setPreviewDoc(doc)} />
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
