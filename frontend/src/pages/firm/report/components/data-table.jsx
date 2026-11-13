import { MAX_SCREEN_ROWS } from "../lib/constants"

export function SummaryGrid({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-2">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="text-sm font-semibold break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

const cellText = (column, row) => {
  const value = column.display ? column.display(row) : column.value(row)
  return value === null || value === undefined || value === "" ? "—" : value
}

export function DataTable({ columns, rows, rowKey }) {
  const shown = rows.slice(0, MAX_SCREEN_ROWS)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="overflow-hidden rounded-lg border md:hidden">
        {shown.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No records match these filters.
          </p>
        ) : (
          <ul className="divide-y">
            {shown.map((row, index) => (
              <li key={rowKey ? rowKey(row, index) : index} className="p-3 sm:p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {columns[0]?.label}
                </p>
                <p className="break-words text-sm font-semibold">
                  {columns[0] ? cellText(columns[0], row) : "—"}
                </p>
                {columns.length > 1 && (
                  <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {columns.slice(1).map((column) => (
                      <div key={column.label} className="min-w-0">
                        <dt className="text-xs text-muted-foreground">{column.label}</dt>
                        <dd className="break-words text-sm">
                          {cellText(column, row)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Keep wide tables inside their own scroll area so they don't widen the
          page on tablets or desktop layouts with a narrow content column. */}
      <div className="hidden overflow-x-auto rounded-lg border [contain:inline-size] md:block">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.label} className="whitespace-nowrap px-3 py-2 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
                  No records match these filters.
                </td>
              </tr>
            ) : (
              shown.map((row, index) => (
                <tr key={rowKey ? rowKey(row, index) : index} className="border-t">
                  {columns.map((column) => (
                    <td key={column.label} className="whitespace-nowrap px-3 py-2">
                      {cellText(column, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > MAX_SCREEN_ROWS && (
        <p className="text-xs text-muted-foreground">
          Showing the first {MAX_SCREEN_ROWS} of {rows.length} rows. The CSV contains all {rows.length}.
        </p>
      )}
    </div>
  )
}