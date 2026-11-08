import { useEffect, useMemo, useRef, useState } from "react"
import { FileCheck, FileText, UploadCloud, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/file-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// ─────────────────────────────────────────────────────────────────────────────
// SHARED FILE UI
//
// This file is the single source of truth for how files look in the app:
//   • <FileDropzone />        – the "Click to choose file(s)" upload box
//   • <SelectedFileList />    – the list of chosen files (with optional remove)
//   • <FilePreviewDialog />   – the preview popup (image / PDF / fallback)
//
// Use these everywhere instead of a raw <input type="file"> or a custom
// preview, so every upload and preview looks and behaves the same.
// ─────────────────────────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"]

const fileKey = (file, index) => String(file.id ?? `${file.name}-${index}`)

// Works with a browser File, a normalized document, or a raw server row.
function getExtension(file) {
  const name = file?.name ?? file?.file_name ?? file?.fileName ?? ""
  return name.includes(".") ? name.split(".").pop().toLowerCase() : ""
}

function resolveKind(file) {
  const mime = String(file?.mimeType ?? file?.type ?? file?.fileType ?? "").toLowerCase()
  const ext = getExtension(file)
  if (mime === "application/pdf" || mime === "pdf" || ext === "pdf") return "pdf"
  if (mime.startsWith("image/") || IMAGE_EXTENSIONS.includes(mime) || IMAGE_EXTENSIONS.includes(ext)) {
    return "image"
  }
  return "other"
}

// ── Upload: dropzone ─────────────────────────────────────────────────────────
// Validates type and size, then hands only the accepted files to `onSelect`.
// Rejected files show a red message under the box.

export const DEFAULT_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
export const DEFAULT_ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"]
export const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export function FileDropzone({
  onSelect,
  accept = DEFAULT_ACCEPT,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  multiple = false,
  disabled = false,
  title,
  hint,
  typeLabel = "PDF, JPG, or PNG",
  error: externalError,
  className,
}) {
  const [error, setError] = useState("")
  const inputRef = useRef(null)

  const maxSizeLabel = `${Math.round(maxSize / (1024 * 1024))}MB`
  const resolvedTitle = title ?? (multiple ? "Click to choose file(s)" : "Click to choose a file")
  const resolvedHint = hint ?? `${typeLabel} — up to ${maxSizeLabel}${multiple ? " each" : ""}`

  const handleChange = (event) => {
    const picked = Array.from(event.target.files ?? [])
    event.target.value = "" // lets the same file be picked again later
    if (picked.length === 0) return

    const accepted = []
    const rejected = []
    picked.forEach((file) => {
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        rejected.push(`${file.name} (not a ${typeLabel} file)`)
      } else if (file.size > maxSize) {
        rejected.push(`${file.name} (over ${maxSizeLabel})`)
      } else {
        accepted.push(file)
      }
    })

    setError(rejected.length ? `Can't attach: ${rejected.join(", ")}` : "")
    if (accepted.length > 0) onSelect?.(multiple ? accepted : accepted.slice(0, 1))
  }

  const shownError = externalError || error

  return (
    <div className={className}>
      <label
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-center transition-colors",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-[#02353C]/40 hover:bg-muted/30",
          shownError && "border-red-300"
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">{resolvedTitle}</span>
        <span className="text-xs text-muted-foreground">{resolvedHint}</span>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          className="hidden"
          onChange={handleChange}
        />
      </label>

      {shownError && (
        <p
          role="alert"
          className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {shownError}
        </p>
      )}
    </div>
  )
}

// ── Upload: chosen-file list ─────────────────────────────────────────────────
// Same row design everywhere. Pass `onRemove(index)` to show the X button.
// Pass `onPreview(file, index)` to make the name clickable.

export function SelectedFileList({ files = [], onRemove, onPreview, disabled = false, className }) {
  if (files.length === 0) return null

  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {files.map((file, index) => (
        <li
          key={`${file.name}-${index}`}
          className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs text-foreground"
        >
          <FileCheck className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
          {onPreview ? (
            <button
              type="button"
              onClick={() => onPreview(file, index)}
              className="min-w-0 flex-1 truncate text-left underline-offset-2 hover:underline"
              title={file.name}
            >
              {file.name}
            </button>
          ) : (
            <span className="min-w-0 flex-1 truncate" title={file.name}>
              {file.name}
            </span>
          )}
          {formatFileSize(file.size) && (
            <span className="shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span>
          )}
          {onRemove && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(index)}
              aria-label={`Remove ${file.name}`}
              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
            >
              <X className="size-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

// ── Preview dialog ───────────────────────────────────────────────────────────
// Accepts any of these in `files`:
//   - a normalized document  ({ name, mimeType, size, downloadUrl, file })
//   - a deliverable          ({ name, fileType, downloadUrl, previewUrl })
//   - a plain browser File   (previewed from the browser, no upload needed)
//   - a generated blob       ({ name, mimeType: "application/pdf", downloadUrl: blobUrl })
//
// The file's link is used exactly as it is. If a file needs a different link
// to show inline (for example the deliverables endpoint wants "?inline=true"),
// the caller passes it as `previewUrl`; the dialog never edits a URL itself.
//
// The selected file is tracked by key, not index: when the file list is
// swapped for a different task's, an unknown key simply resolves to the first
// file — no reset effect needed.
export function FilePreviewDialog({
  open,
  onOpenChange,
  files = [],
  taskName,
  subtitle,
  allowDownload = true,
  downloadName,
  onDownload,
}) {
  const [selectedKey, setSelectedKey] = useState(null)

  const activeIndex = Math.max(
    files.findIndex((file, index) => fileKey(file, index) === selectedKey),
    0
  )
  const selectedFile = files[activeIndex] ?? null

  // The browser File to preview when there is no server link yet. A plain
  // File passed directly counts too.
  const localFile = useMemo(() => {
    if (!selectedFile || selectedFile.downloadUrl) return null
    if (typeof File !== "undefined" && selectedFile instanceof File) return selectedFile
    return selectedFile.file ?? null
  }, [selectedFile])

  const objectUrl = useMemo(
    () => (localFile ? URL.createObjectURL(localFile) : null),
    [localFile]
  )

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  if (!selectedFile) return null

  const kind = resolveKind(selectedFile)
  const fileUrl = selectedFile.downloadUrl ?? objectUrl
  const previewUrl = selectedFile.previewUrl ?? fileUrl
  const fileName = selectedFile.name ?? selectedFile.file_name ?? "Untitled file"
  const size = formatFileSize(selectedFile.size ?? selectedFile.fileSize)
  const caption = subtitle ?? (taskName ? `Uploaded for "${taskName}"` : "Uploaded file")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">{fileName}</DialogTitle>
          <DialogDescription>
            {caption}
            {size && ` · ${size}`}
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
          {kind === "image" && previewUrl ? (
            <img
              src={previewUrl}
              alt={fileName}
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />
          ) : kind === "pdf" && previewUrl ? (
            <iframe
              src={previewUrl}
              title={fileName}
              className="h-[80vh] w-full rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {fileUrl
                  ? "No inline preview available for this file type."
                  : "This file isn't available."}
              </p>
            </div>
          )}
        </div>

        {/* Text-only buttons, same everywhere. */}
        {fileUrl && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </Button>
            {allowDownload && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={fileUrl}
                  download={downloadName ?? fileName}
                  onClick={() => onDownload?.(selectedFile)}
                >
                  Download
                </a>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="bg-[#02353C] text-white hover:bg-[#02353C]/90"
              onClick={() => onOpenChange?.(false)}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}