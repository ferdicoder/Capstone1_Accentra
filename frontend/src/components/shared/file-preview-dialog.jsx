import { useEffect, useMemo, useState } from "react"
import { ExternalLink, FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/file-utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const fileKey = (file, index) => String(file.id ?? `${file.name}-${index}`)

// ── File Preview Dialog ────────────────────────────────────────────────────────
// Lets a user click a file chip and see what the file actually contains:
// images render inline, PDFs render in an iframe, everything else falls back
// to "open in new tab". Works for uploaded documents, deliverables, and
// firm-provided guide/reference files alike.
//
// The selected file is tracked by key, not index: when the file list is
// swapped for a different task's, an unknown key simply resolves to the first
// file — no reset effect needed (keeps react-hooks' set-state-in-effect happy).
export function FilePreviewDialog({ open, onOpenChange, files = [], taskName, subtitle }) {
  const [selectedKey, setSelectedKey] = useState(null)

  const activeIndex = Math.max(
    files.findIndex((file, index) => fileKey(file, index) === selectedKey),
    0
  )
  const selectedFile = files[activeIndex] ?? null

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
  const caption = subtitle ?? (taskName ? `Uploaded for "${taskName}"` : "Uploaded file")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">{selectedFile.name}</DialogTitle>
          <DialogDescription>
            {caption}
            {formatFileSize(selectedFile.size) && ` · ${formatFileSize(selectedFile.size)}`}
          </DialogDescription>
        </DialogHeader>

        {files.length > 1 && (
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
            {files.map((file, index) => (
              <button
                key={fileKey(file, index)}
                type="button"
                onClick={() => setSelectedKey(fileKey(file, index))}
                className={cn(
                  "max-w-[160px] truncate rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                  index === activeIndex
                    ? "border-[#02353C]/30 bg-[#02353C]/10 text-[#02353C]"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
                title={file.name}
              >
                {file.name}
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
