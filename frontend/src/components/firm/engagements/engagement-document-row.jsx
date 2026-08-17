import { Download, FileText, FileSpreadsheet, FileImage, File } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatDate, getDocumentStatusStyles, getDocumentStatusDots, documentStatusLabels } from "./engagement-variants"

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
  return fileIconMap[fileType?.toUpperCase()] ?? FileText
}

export function EngagementDocumentRow({ document, className, ...props }) {
  const status = document?.status ?? "pending"
  const label = documentStatusLabels[status] ?? status
  const Icon = getFileIcon(document?.fileType)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = "#"
    link.download = document?.name ?? "document"
    link.click()
  }

  return (
    <div
      data-slot="engagement-document-row"
      className={cn(
        "flex items-center gap-4 border-b border-border/60 px-6 py-4 transition-colors last:border-b-0 hover:bg-muted/30",
        className
      )}
      {...props}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {document?.name ?? "—"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {document?.uploadedBy ?? "—"} · {formatDate(document?.uploadedDate)} · {document?.fileType ?? "—"} · {document?.fileSize ?? "—"}
        </p>
      </div>

      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
          getDocumentStatusStyles(status)
        )}
      >
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", getDocumentStatusDots(status))}
        />
        {label}
      </span>

      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={handleDownload}
      >
        <Download className="size-3.5" />
        Download
      </Button>
    </div>
  )
}
