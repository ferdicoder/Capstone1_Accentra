import { useState } from "react"
import { AlertCircle, CheckCircle2, Download, Eye, FileText, Inbox, Paperclip } from "lucide-react"

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

const reviewStatusMap = {
  approved: "approved",
  for_review: "in_review",
  for_revision: "revision_requested",
  missing: "pending",
}

const formatFileSize = (size) => {
  if (!size) return "—"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const getFileType = (document) =>
  document.fileType || document.mimeType?.split("/").pop()?.toUpperCase() || "FILE"

const getInitials = (name) => {
  if (!name) return "AC"
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")
}

// Reference documents the reviewer can attach are not limited to PDF/images,
// so the type check is skipped here. The 10 MB size limit still applies.
const REFERENCE_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.zip"

function ReviewQueueItem({ document, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(document)}
      className={cn(
        "flex w-full flex-col gap-1 border-l-2 px-4 py-3 text-left transition-colors",
        isSelected ? "border-l-[#02353C] bg-[#02353C]/5" : "border-l-transparent hover:bg-muted/50"
      )}
    >
      <p className={cn("truncate text-sm font-medium", isSelected ? "text-[#02353C]" : "text-foreground")}>
        {document.name}
      </p>
      <p className="text-xs text-muted-foreground">{document.uploadedBy}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {document.uploadedDate ? `${document.uploadedDate} · 10:30 AM` : "—"}
        </p>
        <ReviewStatusBadge status={reviewStatusMap[document.status] ?? document.status} />
      </div>
    </button>
  )
}

function HistoryItem({ item, isLast }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px]">{getInitials(item.userName)}</AvatarFallback>
        </Avatar>
        {!isLast && <div className="mt-2 w-px flex-1 bg-border" />}
      </div>
      <div className={cn("flex-1", !isLast && "pb-4")}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{item.userName}</p>
          <ReviewStatusBadge status={item.action} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{item.comment}</p>
        {item.references && item.references.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.references.map((ref) => (
              <span key={ref.id} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Paperclip className="size-2.5" />
                {ref.name}
              </span>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground/70">{formatTimestamp(item.timestamp)}</p>
      </div>
    </div>
  )
}

export function EngagementDocumentReviewTab({
  documents: providedDocuments = [],
  history = [],
  onReview,
  className,
  preselectedDocName,
  ...props
}) {
  const documents = providedDocuments
  const [selectedDocument, setSelectedDocument] = useState(() => {
    if (preselectedDocName) {
      const match = documents.find((d) => d.name === preselectedDocName)
      if (match) return match
    }
    return documents[0] ?? null
  })
  const selectedDoc =
    documents.find((document) => document.id === selectedDocument?.id)
      ? selectedDocument
      : documents[0] ?? null
  const [remarks, setRemarks] = useState("")
  const [remarksError, setRemarksError] = useState("")
  const [actionNotice, setActionNotice] = useState("")
  const [referenceFiles, setReferenceFiles] = useState([])
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleApprove = () => {
    if (!selectedDoc) return
    onReview?.(selectedDoc, "approved", remarks.trim() || "Document approved.")
    setSelectedDocument({ ...selectedDoc, status: "approved" })
    setRemarks("")
    setRemarksError("")
    setActionNotice(`${selectedDoc.name} approved`)
    setTimeout(() => setActionNotice(""), 3000)
  }

  const handleRequestRevision = () => {
    if (!remarks.trim()) { setRemarksError("Remarks are required when requesting revision."); return }
    if (!selectedDoc) return
    onReview?.(selectedDoc, "for_revision", remarks.trim())
    setSelectedDocument({ ...selectedDoc, status: "for_revision" })
    setRemarks("")
    setRemarksError("")
    setReferenceFiles([])
    setActionNotice(`${selectedDoc.name} sent for revision`)
    setTimeout(() => setActionNotice(""), 3000)
  }

  // Files come from the shared <FileDropzone />, which has already checked
  // their size. Keep the original File so it can be previewed before sending.
  const handleFilesSelected = (files) => {
    const newFiles = files.map((file) => {
      const ext = file.name.split(".").pop()?.toUpperCase() ?? ""
      return {
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        type: file.type,
        ext,
        size: file.size,
        file,
      }
    })
    setReferenceFiles((prev) => [...prev, ...newFiles])
  }

  const removeReferenceFile = (index) => {
    setReferenceFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const selectedStatus = selectedDoc ? reviewStatusMap[selectedDoc.status] ?? selectedDoc.status : null

  // The same shape the shared preview dialog reads everywhere else.
  // The documents endpoint only shows a file inline when asked with
  // "?inline=true", so that link is passed as `previewUrl`. The download link
  // stays exactly as it is.
  const previewFile = selectedDoc
    ? {
        id: selectedDoc.id,
        name: selectedDoc.name,
        mimeType: selectedDoc.mimeType ?? null,
        fileType: selectedDoc.fileType ?? null,
        size: selectedDoc.fileSize ?? null,
        downloadUrl: selectedDoc.downloadUrl ?? null,
        previewUrl: selectedDoc.downloadUrl ? `${selectedDoc.downloadUrl}?inline=true` : null,
      }
    : null

  return (
    <div data-slot="engagement-document-review-tab" className={cn("grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_300px]", className)} {...props}>
      <div className="flex min-h-[320px] max-h-[70vh] min-w-0 flex-col rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Review Queue</h3>
            <p className="text-xs text-muted-foreground">{documents.length} documents</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <Inbox className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">No documents to review</p>
            </div>
          ) : (
            documents.map((doc) => (
              <ReviewQueueItem key={doc.id} document={doc} isSelected={selectedDoc?.id === doc.id} onSelect={setSelectedDocument} />
            ))
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {actionNotice && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {actionNotice}
          </div>
        )}
        {selectedDoc ? (
          <>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-all text-sm font-medium text-foreground">{selectedDoc.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Submitted by {selectedDoc.uploadedBy} · {selectedDoc.uploadedDate ? `${selectedDoc.uploadedDate} · 10:30 AM` : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">{getFileType(selectedDoc)}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedDoc.fileSize)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    title="View document"
                    disabled={!selectedDoc.downloadUrl}
                    onClick={() => setPreviewOpen(true)}
                  >
                    <Eye className="size-3.5" />
                    View
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={selectedDoc.downloadUrl} download={selectedDoc.name} title="Download document">
                      <Download className="size-3.5" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {selectedDoc.downloadUrl && getFileType(selectedDoc) === "PDF" ? (
                <iframe
                  src={`${selectedDoc.downloadUrl}?inline=true`}
                  title={`Preview of ${selectedDoc.name}`}
                  className="h-[55vh] min-h-[320px] w-full"
                />
              ) : selectedDoc.downloadUrl && ["PNG", "JPG", "JPEG", "GIF", "WEBP"].includes(getFileType(selectedDoc)) ? (
                <div className="flex max-h-[65vh] min-h-[320px] items-center justify-center overflow-auto bg-muted/20 p-4">
                  <img
                    src={selectedDoc.downloadUrl}
                    alt={selectedDoc.name}
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Preview unavailable</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Use View to open this file or Download to save a copy.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Review Decision</h4>
                    <ReviewStatusBadge status={selectedStatus} />
              </div>

              {selectedDoc.status === "approved" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-700">This document has already been approved.</p>
                  </div>
                </div>
              ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <textarea
                    value={remarks}
                    onChange={(e) => { setRemarks(e.target.value); if (remarksError) setRemarksError("") }}
                    placeholder="Add remarks for the client, or note internal observations..."
                    rows={3}
                    className={cn(
                      "min-h-20 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      remarksError && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {remarksError && <p className="text-xs text-red-500">{remarksError}</p>}
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-medium text-foreground">Attach Reference Documents (optional)</p>
                  <div className="flex flex-col gap-2">
                    <SelectedFileList
                      files={referenceFiles}
                      onRemove={removeReferenceFile}
                    />
                    <FileDropzone
                      multiple
                      accept={REFERENCE_ACCEPT}
                      allowedTypes={null}
                      typeLabel="PDF, Word, Excel, CSV, image, TXT, or ZIP"
                      onSelect={handleFilesSelected}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1.5 rounded-lg bg-[#02353C] text-white hover:opacity-90" onClick={handleApprove} disabled={selectedDoc.status === "approved"}>
                    <CheckCircle2 className="size-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800" onClick={handleRequestRevision} disabled={selectedDoc.status === "approved" || selectedDoc.status === "for_revision"}>
                    <AlertCircle className="size-4" /> Request Revision
                  </Button>
                </div>
              </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-16 text-center shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Select a document to review</p>
            <p className="text-sm text-muted-foreground">Choose a document from the review queue to begin.</p>
          </div>
        )}
      </div>

      <div className="flex min-h-[320px] max-h-[70vh] min-w-0 flex-col rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">History</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="text-xs text-muted-foreground">No review history yet</p>
            </div>
          ) : (
            history.map((item, index) => (
              <HistoryItem key={item.id} item={item} isLast={index === history.length - 1} />
            ))
          )}
        </div>
      </div>

      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        files={previewFile ? [previewFile] : []}
        subtitle={selectedDoc ? `Submitted by ${selectedDoc.uploadedBy ?? "client"}` : undefined}
      />
    </div>
  )
}