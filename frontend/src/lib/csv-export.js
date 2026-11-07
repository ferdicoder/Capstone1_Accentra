// CSV helpers used by the Reports page.
//
//   toCsv(columns, rows)   -> CSV string
//   downloadCsv(name, csv) -> triggers a browser download
//
// `columns` is an array of { label, value: (row) => any }.

const NUMERIC_LIKE = /^[+-]?\d+(\.\d+)?$/

function escapeCell(raw) {
  if (raw === null || raw === undefined) return ""

  let text = typeof raw === "string" ? raw : String(raw)

  // Guard against spreadsheet formula injection: a text cell that starts with
  // = + - @ (or tab / CR) can be run as a formula by Excel or Sheets.
  // Numeric-looking values (amounts, phone numbers like +63917...) are left alone.
  if (typeof raw === "string" && /^[=+\-@\t\r]/.test(text) && !NUMERIC_LIKE.test(text)) {
    text = `'${text}`
  }

  // Quote when the cell contains a comma, quote, or line break.
  if (/[",\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv(columns, rows) {
  const header = columns.map((col) => escapeCell(col.label)).join(",")
  const body = rows.map((row) =>
    columns.map((col) => escapeCell(col.value(row))).join(",")
  )
  return [header, ...body].join("\r\n")
}

export function downloadCsv(filename, csv) {
  // The BOM (\uFEFF) makes Excel read the file as UTF-8, so characters
  // like "ñ" display correctly.
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Give the browser a moment to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}