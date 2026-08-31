import { useState } from "react"
import { useRef } from "react"
import { AlertCircle, CheckCircle2, Download, FileText, Inbox, Paperclip, Upload, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ReviewStatusBadge } from "./review-status-badge"
import { engagementStore } from "./engagement-store"
import { getReviewDocuments, formatTimestamp, firmStaffMap } from "./engagement-variants"

const getInitials = (name) => {
  if (!name) return "AC"
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")
}

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
        <ReviewStatusBadge status={document.status} />
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

export function EngagementDocumentReviewTab({ engagement, className, ...props }) {
  const documents = getReviewDocuments(engagement)
  const history = engagement.reviewHistory ?? []
  const [selectedDoc, setSelectedDoc] = useState(documents[0] ?? null)
  const [remarks, setRemarks] = useState("")
  const [remarksError, setRemarksError] = useState("")
  const [actionNotice, setActionNotice] = useState("")
  const [referenceFiles, setReferenceFiles] = useState([])
  const fileInputRef = useRef(null)

  const updateDocumentStatus = engagementStore((state) => state.updateDocumentStatus)
  const addReviewHistoryEntry = engagementStore((state) => state.addReviewHistoryEntry)
  const staffLabel = firmStaffMap[engagement?.assignedStaff] ?? "You"

  const handleApprove = () => {
    if (!selectedDoc) return
    updateDocumentStatus(engagement.id, selectedDoc.id, "approved")
    addReviewHistoryEntry(engagement.id, {
      id: `hist-${Date.now()}`, userName: staffLabel, action: "approved",
      comment: remarks.trim() || "Document approved.", timestamp: new Date().toISOString(),
    })
    setSelectedDoc({ ...selectedDoc, status: "approved" })
    setRemarks("")
    setRemarksError("")
    setActionNotice(`${selectedDoc.name} approved`)
    setTimeout(() => setActionNotice(""), 3000)
  }

  const handleRequestRevision = () => {
    if (!remarks.trim()) { setRemarksError("Remarks are required when requesting revision."); return }
    if (!selectedDoc) return
    updateDocumentStatus(engagement.id, selectedDoc.id, "revision_requested")
    addReviewHistoryEntry(engagement.id, {
      id: `hist-${Date.now()}`, userName: staffLabel, action: "revision_requested",
      comment: remarks.trim(), references: referenceFiles.length > 0 ? [...referenceFiles] : undefined,
      timestamp: new Date().toISOString(),
    })
    setSelectedDoc({ ...selectedDoc, status: "revision_requested" })
    setRemarks("")
    setRemarksError("")
    setReferenceFiles([])
    setActionNotice(`${selectedDoc.name} sent for revision`)
    setTimeout(() => setActionNotice(""), 3000)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const newFiles = files.map((file) => {
      const ext = file.name.split(".").pop()?.toUpperCase() ?? ""
      return { id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: file.name, type: ext, size: file.size }
    })
    setReferenceFiles((prev) => [...prev, ...newFiles])
    e.target.value = ""
  }

  const removeReferenceFile = (id) => {
    setReferenceFiles((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div data-slot="engagement-document-review-tab" className={cn("grid gap-6 lg:grid-cols-[280px_1fr_300px]", className)} {...props}>
      <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
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
              <ReviewQueueItem key={doc.id} document={doc} isSelected={selectedDoc?.id === doc.id} onSelect={setSelectedDoc} />
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {actionNotice && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {actionNotice}
          </div>
        )}
        {selectedDoc ? (
          <>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedDoc.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Submitted by {selectedDoc.uploadedBy} · {selectedDoc.uploadedDate ? `${selectedDoc.uploadedDate} · 10:30 AM` : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">{selectedDoc.fileType}</p>
                    <p className="text-xs text-muted-foreground">{selectedDoc.fileSize}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                    <Download className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-16 shadow-sm">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <FileText className="size-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Document Preview</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5">
                  <Download className="size-3.5" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg">Open Full Document</Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Review Decision</h4>
                <ReviewStatusBadge status={selectedDoc.status} />
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
                    {referenceFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-md bg-background px-2.5 py-1.5">
                        <span className="flex items-center gap-1.5 text-xs text-foreground">
                          <Paperclip className="size-3 text-muted-foreground" />
                          {file.name}
                        </span>
                        <button type="button" onClick={() => removeReferenceFile(file.id)} className="text-muted-foreground hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.zip"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="size-3" />
                      Upload File
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1.5 rounded-lg bg-[#02353C] text-white hover:opacity-90" onClick={handleApprove} disabled={selectedDoc.status === "approved"}>
                    <CheckCircle2 className="size-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800" onClick={handleRequestRevision} disabled={selectedDoc.status === "approved" || selectedDoc.status === "revision_requested"}>
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

      <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
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
    </div>
  )
}
