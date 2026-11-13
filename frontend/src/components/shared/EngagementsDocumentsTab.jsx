import { useState } from "react"
import { Check, Clock, Download, Eye, MessageSquareText, RotateCcw, Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import {
  LOCKED_STATUSES,
  normalizeStatus,
  normalizeDocument,
  latestSubmission,
} from "@/components/client/ClientEngagementTaskList"

// Shared Documents tab for the client and firm engagement pages.
// Place at: src/components/shared/engagements/EngagementDocumentsTab.jsx
//
// Usage:
//   const visibleDocuments = getVisibleDocuments(documents, engagement.tasks)
//   <EngagementDocumentsTab
//     documents={visibleDocuments}
//     tasks={engagement.tasks}
//     isLoading={isDocumentsLoading}
//     audience="client" | "firm"
//   />

const statusLabels = {
  approved: "Approved",
  for_review: "For Review",
  for_revision: "For Revision",
  missing: "Missing",
}

const statusBadgeStyles = {
  approved: "bg-green-50 text-green-700 border border-green-200",
  for_review: "bg-amber-50 text-amber-700 border border-amber-200",
  for_revision: "bg-orange-50 text-orange-700 border border-orange-200",
  missing: "bg-red-50 text-red-700 border border-red-200",
}

// Per-status theme for the Status dialog. Every color is the same hue as the
// status badge in the Actions column, so the popup you open from a badge looks
// like a bigger version of it.
//   bar      → thin strip across the top of the popup
//   soft     → big blob behind the illustration
//   softDark → header strip on the little document
//   docBorder / docLine → the document outline and its text lines
//   solid    → round status badge on the document
//   deco     → the small decorative lines / dots around the illustration
//   button   → the pill "Close" button
const statusDialogTheme = {
  approved: {
    title: "Document approved",
    Icon: Check,
    bar: "bg-green-500",
    soft: "bg-green-50",
    softDark: "bg-green-100",
    docBorder: "border-green-500",
    docLine: "bg-green-200",
    solid: "bg-green-500",
    decoLine: "bg-green-300",
    decoRing: "border-green-300",
    decoPlus: "text-green-300",
    button: "bg-green-600 hover:bg-green-700",
  },
  for_review: {
    title: "Waiting for review",
    Icon: Clock,
    bar: "bg-amber-500",
    soft: "bg-amber-50",
    softDark: "bg-amber-100",
    docBorder: "border-amber-500",
    docLine: "bg-amber-200",
    solid: "bg-amber-500",
    decoLine: "bg-amber-300",
    decoRing: "border-amber-300",
    decoPlus: "text-amber-300",
    button: "bg-amber-500 hover:bg-amber-600",
  },
  for_revision: {
    title: "Revision requested",
    Icon: RotateCcw,
    bar: "bg-orange-500",
    soft: "bg-orange-50",
    softDark: "bg-orange-100",
    docBorder: "border-orange-500",
    docLine: "bg-orange-200",
    solid: "bg-orange-500",
    decoLine: "bg-orange-300",
    decoRing: "border-orange-300",
    decoPlus: "text-orange-300",
    button: "bg-orange-500 hover:bg-orange-600",
  },
  missing: {
    title: "Nothing submitted yet",
    Icon: X,
    bar: "bg-red-500",
    soft: "bg-red-50",
    softDark: "bg-red-100",
    docBorder: "border-red-500",
    docLine: "bg-red-200",
    solid: "bg-red-500",
    decoLine: "bg-red-300",
    decoRing: "border-red-300",
    decoPlus: "text-red-300",
    button: "bg-red-500 hover:bg-red-600",
  },
}

// What the remarks box says for each status, worded for whoever is reading.
function getRemarkText(status, remark, audience) {
  if (audience === "firm") {
    switch (status) {
      case "approved":
        return remark || "Approved without remarks."
      case "for_review":
        return "Not reviewed yet. Approve it or request a revision from the Overview tab."
      case "for_revision":
        return remark || "Revision requested. Waiting for the client to upload a new copy."
      default:
        return "The client hasn't submitted this requirement yet."
    }
  }

  switch (status) {
    case "approved":
      return "No revisions needed — this document was approved as submitted."
    case "for_review":
      return "Your firm hasn't reviewed this document yet. Remarks will appear here once they have."
    case "for_revision":
      return remark || "Your firm asked for changes to this document. Please upload a revised copy."
    default:
      return "Nothing has been submitted for this requirement yet."
  }
}

// The tab only lists files from the LATEST submission of a requirement that is
// For Review or Approved. Files from a submission that was rejected for
// revision (and anything on a Missing / For Revision requirement) are hidden,
// so a resubmission replaces the old files instead of stacking on top of them.
// Plain function (no hooks) so pages can call it anywhere; memoize at the call
// site if needed.

function formatUploadedDate(value) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
export function getVisibleDocuments(documents = [], tasks = []) {
  const taskById = new Map(tasks.map((t) => [t.id, t]))
  const byTask = new Map()
  documents.forEach((doc) => {
    const list = byTask.get(doc.engagementTaskId) ?? []
    list.push(doc)
    byTask.set(doc.engagementTaskId, list)
  })

  const visibleIds = new Set()
  byTask.forEach((taskDocs, taskId) => {
    const task = taskById.get(taskId)
    if (!task || !LOCKED_STATUSES.includes(normalizeStatus(task.status))) return
    latestSubmission(taskDocs.map((doc) => normalizeDocument(doc))).forEach((file) =>
      visibleIds.add(file.id)
    )
  })

  return documents.filter((doc) => visibleIds.has(doc.id))
}

// Small document drawing with a round status badge, tinted per status.
function StatusIllustration({ theme }) {
  const { Icon } = theme
  return (
    <div className="relative mx-auto h-36 w-64" aria-hidden="true">
      {/* blob */}
      <div className={`absolute inset-x-10 top-3 bottom-4 rounded-[50%] ${theme.soft}`} />

      {/* decorations */}
      <span className={`absolute left-2 top-[46%] h-0.5 w-14 rounded opacity-60 ${theme.decoLine}`} />
      <span className={`absolute right-1 top-[52%] h-0.5 w-12 rounded opacity-60 ${theme.decoLine}`} />
      <span className={`absolute left-[26%] top-2 text-base font-light leading-none ${theme.decoPlus}`}>+</span>
      <span className={`absolute left-[16%] top-[30%] size-3 rounded-full border-2 ${theme.decoRing}`} />
      <span className={`absolute right-[18%] top-2 size-3 rounded-full border-2 ${theme.decoRing}`} />
      <span className={`absolute right-[26%] bottom-2 text-base font-light leading-none ${theme.decoPlus}`}>+</span>

      {/* shadow */}
      <div className="absolute bottom-1.5 left-1/2 h-2 w-28 -translate-x-1/2 rounded-[50%] bg-black/10" />

      {/* document */}
      <div
        className={`absolute left-1/2 top-3 h-[92px] w-[76px] -translate-x-1/2 overflow-hidden rounded-lg border-2 bg-white ${theme.docBorder}`}
      >
        <div className={`h-3.5 ${theme.softDark}`} />
        <div className="flex flex-col gap-1.5 px-2.5 pt-3">
          <span className={`h-1 w-full rounded ${theme.docLine}`} />
          <span className={`h-1 w-4/5 rounded ${theme.docLine}`} />
          <span className={`h-1 w-3/5 rounded ${theme.docLine}`} />
        </div>
      </div>

      {/* status badge */}
      <div
        className={`absolute left-[55%] top-[64px] flex size-11 items-center justify-center rounded-full border-4 border-white text-white ${theme.solid}`}
      >
        <Icon className="size-5" strokeWidth={3} />
      </div>
    </div>
  )
}

function DocumentStatusDialog({ open, onOpenChange, status, remark, doc, audience }) {
  if (!status) return null

  const theme = statusDialogTheme[status] ?? statusDialogTheme.missing
  const isFirm = audience === "firm"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* `[&>button]:hidden` hides the dialog's default corner X so only our own shows. */}
      <DialogContent className="max-w-xl gap-0 overflow-hidden rounded-3xl border-0 p-0 [&>button]:hidden">
        <div className={`h-1.5 w-full ${theme.bar}`} />

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="absolute right-5 top-6 flex size-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col px-6 pb-6 pt-8 sm:px-8">
          <StatusIllustration theme={theme} />

          <div className="mt-4 text-center">
            <DialogTitle className="text-2xl font-bold">{theme.title}</DialogTitle>
            <DialogDescription asChild>
              <div>
                {doc?.name && (
                  <p className="mt-2 break-words text-base text-muted-foreground">{doc.name}</p>
                )}
                {doc && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {doc.uploadedBy ?? "—"} · Uploaded {doc.uploadedDate ?? "—"}
                  </p>
                )}
              </div>
            </DialogDescription>
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {isFirm ? "Remarks sent to the client" : "Remarks from your firm"}
          </p>
          <div className="mt-2 flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-3.5 text-base text-muted-foreground">
            <MessageSquareText className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 break-words">{getRemarkText(status, remark, audience)}</p>
          </div>

          <Button
            className={`mx-auto mt-6 h-11 w-44 rounded-full text-base font-semibold text-white shadow-none ${theme.button}`}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          {!isFirm && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Questions about this document? Contact your firm.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// View + download icon buttons for one document. `large` gives phone-sized
// (32px) touch targets; the table keeps the compact 24px version.
// View + download icon buttons for one document. `large` gives phone-sized
// (40px) touch targets; the table uses 36px.
function DocumentFileActions({ doc, large = false }) {
  const box = large ? "size-10" : "size-9"
  const icon = large ? "size-5" : "size-[18px]"

  return (
    <div className="flex items-center gap-2">
      {doc.downloadUrl ? (
        <a
          href={doc.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View File"
          aria-label={`View ${doc.name} in a new tab`}
          className={`flex ${box} shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-100`}
        >
          <Eye className={icon} />
        </a>
      ) : (
        <span
          title="View File"
          aria-label="View file unavailable"
          aria-disabled="true"
          className={`flex ${box} shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-300`}
        >
          <Eye className={icon} />
        </span>
      )}

      {doc.downloadUrl ? (
        <a
          href={doc.downloadUrl}
          download={doc.name}
          title="Download"
          aria-label={`Download ${doc.name}`}
          className={`flex ${box} shrink-0 items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700`}
        >
          <Download className={icon} />
        </a>
      ) : (
        <span
          title="Download"
          aria-label="Download unavailable"
          aria-disabled="true"
          className={`flex ${box} shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-300`}
        >
          <Download className={icon} />
        </span>
      )}
    </div>
  )
}
export function EngagementDocumentsTab({
  documents = [],
  tasks = [],
  isLoading = false,
  audience = "client",
}) {
  const [search, setSearch] = useState("")
  const [statusDoc, setStatusDoc] = useState(null)
  const [isStatusOpen, setIsStatusOpen] = useState(false)

  const taskById = new Map(tasks.map((t) => [t.id, t]))
  const filteredDocuments = documents.filter((doc) =>
    (doc.name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const openStatus = (doc) => {
    setStatusDoc(doc)
    setIsStatusOpen(true)
  }

  const statusDocTask = statusDoc ? taskById.get(statusDoc.engagementTaskId) : null
  const emptyText = search.trim()
    ? `No documents match "${search}".`
    : "No documents submitted for review yet."

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          aria-label="Search documents"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        {/* ── Phones: stacked cards ─────────────────────────────────── */}
        <div className="md:hidden">
          {isLoading && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Loading documents...
            </p>
          )}

          {!isLoading && filteredDocuments.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">{emptyText}</p>
          )}

          {!isLoading && filteredDocuments.length > 0 && (
            // Scrolls inside the card once the list gets long.
            <ul className="max-h-[32rem] divide-y overflow-y-auto">
              {filteredDocuments.map((doc) => {
                const task = taskById.get(doc.engagementTaskId)
                const status = normalizeStatus(task?.status) || "missing"
                return (
                  <li key={doc.id} className="flex flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">{doc.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {doc.uploadedBy ?? "—"} · {doc.uploadedDate ?? "—"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => openStatus(doc)}
                        aria-label={`View status of ${doc.name}`}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80 ${statusBadgeStyles[status]}`}
                      >
                        {statusLabels[status]}
                      </button>
                      <DocumentFileActions doc={doc} large />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── Tablet and up: table ──────────────────────────────────── */}
        {/* Scrolls both ways inside the card; the header row stays pinned. */}
        <div className="hidden max-h-[32rem] overflow-auto md:block">
         <table className="w-full min-w-[720px] table-fixed text-sm">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b bg-muted/40 text-left text-xs uppercase text-foreground">
                <th className="px-4 py-3.5 align-middle font-medium">Document Name</th>
                <th className="px-4 py-3.5 align-middle font-medium">Uploaded By</th>
                <th className="px-4 py-3.5 align-middle font-medium">Uploaded Date</th>
                <th className="px-4 py-3.5 align-middle font-medium">Status</th>
                <th className="px-4 py-3.5 align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading documents...
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredDocuments.map((doc) => {
                  const task = taskById.get(doc.engagementTaskId)
                  const status = normalizeStatus(task?.status) || "missing"
                  return (
                    <tr key={doc.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-4 align-middle">
                        <p className="truncate font-medium">{doc.name}</p>
                      </td>
                      <td className="px-4 py-4 align-middle text-muted-foreground">
                        {doc.uploadedBy}
                      </td>
                      <td className="px-4 py-4 align-middle text-muted-foreground">
                        {formatUploadedDate(doc.uploadedDate)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 align-middle">
                        <button
                          type="button"
                          onClick={() => openStatus(doc)}
                          title="View Status"
                          className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80 ${statusBadgeStyles[status]}`}
                        >
                          {statusLabels[status]}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 align-middle">
                        <DocumentFileActions doc={doc} />
                      </td>
                    </tr>
                  )
                })}

              {!isLoading && filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DocumentStatusDialog
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        status={normalizeStatus(statusDocTask?.status) || undefined}
        remark={statusDocTask?.remark}
        doc={statusDoc}
        audience={audience}
      />
    </div>
  )
}