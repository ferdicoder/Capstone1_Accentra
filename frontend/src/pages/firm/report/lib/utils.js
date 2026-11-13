import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

import { toCsv } from "@/lib/csv-export"
import { INITIAL_FILTERS, METHOD_LABELS, UNAVAILABLE } from "./constants"

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------
export const labelize = (value) =>
  String(value ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
export const optionLabel = (options, value) => options.find((o) => o.value === value)?.label ?? labelize(value)

export function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[\s_-]+/g, " ").trim()
}

// Collapses the app's many bill statuses into the report's status groups.
// Unpaid and For Verification stay separate; cancelled bills remain Cancelled.
export function paymentGroup(status) {
  const s = normalize(status)
  if (["cancelled", "canceled"].includes(s)) return "cancelled"
  if (["paid", "verified"].includes(s)) return "paid"
  if (["for verification", "under review"].includes(s)) return "for_verification"
  return "unpaid" // pending, overdue, for resubmission
}

export function methodGroup(method) {
  const m = normalize(method).replace(/ /g, "_")
  if (!m) return ""
  return m
}
export const methodLabel = (method) => {
  const key = normalize(method).replace(/ /g, "_")
  return METHOD_LABELS[key] ?? (key ? labelize(key) : "")
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------
export const pad = (n) => String(n).padStart(2, "0")

// Date-only strings ("2026-03-01") are parsed as LOCAL dates so they never
// land on the previous day.
export const toDate = (value) => {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = match ? new Date(+match[1], +match[2] - 1, +match[3]) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
export const isoDate = (value) => {
  const d = toDate(value)
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : ""
}
// Missing dates are shown as unavailable, never inferred.
export const dateOrUnavailable = (value) => isoDate(value) || UNAVAILABLE

export const rangeError = (range) =>
  range.from && range.to && range.from > range.to ? "“From” date is after “To” date." : ""
export const inRange = (value, range) => {
  if (!range.from && !range.to) return true
  const date = toDate(value)
  if (!date) return false // undated rows can't match a date range
  if (range.from && date < toDate(range.from)) return false
  if (range.to) {
    const end = toDate(range.to)
    end.setHours(23, 59, 59, 999)
    if (date > end) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Filtering, sorting, formatting
// ---------------------------------------------------------------------------
export const matchesSearch = (query, ...fields) => {
  const q = query.trim().toLowerCase()
  return !q || fields.some((field) => String(field ?? "").toLowerCase().includes(q))
}
export const byDateDesc = (getDate) => (a, b) =>
  (toDate(getDate(b))?.getTime() ?? 0) - (toDate(getDate(a))?.getTime() ?? 0)
export const byText = (getText) => (a, b) => String(getText(a)).localeCompare(String(getText(b)))

export const formatCurrency = (amount) =>
  `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export const fileStamp = () => isoDate(new Date())
export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`

export const isDefault = (report, value) => JSON.stringify(value) === JSON.stringify(INITIAL_FILTERS[report])
export const uniqueOptions = (values, labelOf) =>
  [...new Set(values.filter(Boolean))]
    .map((value) => ({ value, label: labelOf(value) }))
    .sort((a, b) => a.label.localeCompare(b.label))

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

// One CSV with several titled sections (used by summaries and record views).
export const sectionsCsv = (sections) =>
  sections.map((s) => `${s.title}\r\n${toCsv(s.columns, s.rows)}`).join("\r\n\r\n")

// PDF columns/rows use plain text only (the built-in PDF font has no peso sign).
export const summaryPdfColumns = [
  { label: "Measure", value: (r) => r.label },
  {
    label: "Value",
    value: (r) =>
      r.csv !== undefined
        ? `PHP ${Number(r.csv).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : r.value,
  },
]
const pdfCell = (column, row) => {
  const value = column.value(row)
  return value === null || value === undefined || value === "" ? "—" : String(value)
}

// Builds one landscape A4 PDF with one titled table per section and returns it
// as a Blob for the on-screen preview (it is not saved to disk).
export const buildPdf = (title, sections) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
  const margin = 36
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(20)
  doc.text(`Accentra - ${title}`, margin, 42)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(
    `Generated ${isoDate(new Date())}. Confidential: contains personal information (RA 10173).`,
    margin,
    58
  )

  let y = 80
  sections.forEach((section) => {
    if (y > pageHeight - 90) {
      doc.addPage()
      y = 44
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(20)
    doc.text(section.title, margin, y)
    autoTable(doc, {
      startY: y + 6,
      head: [section.columns.map((c) => c.label)],
      body: section.rows.map((row) => section.columns.map((c) => pdfCell(c, row))),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [16, 68, 52], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 246] },
    })
    y = doc.lastAutoTable.finalY + 26
  })

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 18, { align: "right" })
  }
  return doc.output("blob")
}