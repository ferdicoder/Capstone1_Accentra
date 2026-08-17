import { Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { EngagementDocumentRow } from "./engagement-document-row"

export function EngagementDocumentsTab({ engagement, className, ...props }) {
  const documents = engagement?.documents ?? []
  const isEmpty = documents.length === 0

  return (
    <div data-slot="engagement-documents-tab" className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground">All Documents</h3>
          {!isEmpty && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
              {documents.length} total
            </span>
          )}
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Inbox className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No documents uploaded yet</p>
            <p className="text-sm text-muted-foreground">
              Documents submitted by the client will appear here once uploaded.
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <EngagementDocumentRow key={doc.id} document={doc} />
          ))
        )}
      </div>
    </div>
  )
}
