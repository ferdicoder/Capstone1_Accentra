// CSV helpers for report exports.
// Columns use the shape { label, value: (row) => any } shared with the table and PDF.

const BOM = "\uFEFF" // lets Excel read UTF-8 (names, ₱) correctly
const EOL = "\r\n"

// Cells starting with these characters can be run as formulas in Excel.
// Prefixing a single quote keeps them as plain text.
const FORMULA_START = /^[=+\-@\t\r]/

export function csvCell(raw) {
  if (raw === null || raw === undefined) return ""
  let text = String(raw)
  if (FORMULA_START.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) {
    text = `'${text}`
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function csvRow(cells) {
  return cells.map(csvCell).join(",")
}

// One table: header row + data rows. Uses column.value, not column.display,
// so amounts export as plain numbers (e.g. 1500.00) instead of "₱1,500.00".
export function toCsv(columns, rows) {
  const header = csvRow(columns.map((c) => c.label))
  const body = rows.map((row) => csvRow(columns.map((c) => c.value(row))))
  return [header, ...body].join(EOL)
}

// Trigger a browser download. Adds the BOM and a .csv extension if missing.
export function downloadCsv(filename, csv) {
  const name = filename.endsWith(".csv") ? filename : `${filename}.csv`
  const blob = new Blob([BOM, csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}