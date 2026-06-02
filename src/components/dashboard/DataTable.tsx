import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Column = {
  key: string
  label: string
  bold?: boolean
}

type DataTableProps = {
  title?: string
  columns: Column[]
  data: any[]
  primaryKey?: string
  onAdd?: () => void
  renderActions?: (row: any) => React.ReactNode
  isLoading?: boolean
}

export default function DataTable({
  title = "Records",
  columns,
  data,
  primaryKey = "id",
  onAdd,
  renderActions,
  isLoading = false,
}: DataTableProps) {
  return (
    <Card className="panel-surface overflow-hidden rounded-[1.75rem] border-0 bg-card/90 shadow-[var(--shadow-soft)]">
      <CardHeader className="border-b border-border/70 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</CardTitle>
          {onAdd && (
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" className="rounded-full" onClick={onAdd}>
                Add New
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop / tablet: table view */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full table-auto border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-10 bg-muted/40 backdrop-blur-sm">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="border-b border-border/70 bg-muted/40 px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    {c.label}
                  </th>
                ))}
                {renderActions && (
                  <th className="border-b border-border/70 bg-muted/40 px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>

            {isLoading ? (
              <tbody>
                <tr>
                  <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      <div className="text-sm text-muted-foreground">Loading…</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {data.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-6 py-14 text-center text-sm text-muted-foreground">
                      No records found.
                    </td>
                  </tr>
                )}

                {data.map((row, idx) => (
                  <tr
                    key={row[primaryKey] ?? idx}
                    className="border-b border-border/60 bg-card/70 transition-colors hover:bg-secondary/35"
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`border-b border-border/60 px-5 py-4 text-sm align-middle text-foreground ${c.bold ? "font-semibold whitespace-nowrap" : ""}`}
                      >
                        {c.key === "status" ? (
                          <StatusBadge status={row[c.key]} />
                        ) : (
                          row[c.key]
                        )}
                      </td>
                    ))}

                    {renderActions && (
                      <td className="border-b border-border/60 px-5 py-4 text-sm">
                        <div className="flex items-center gap-2 justify-end">
                          {renderActions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Mobile: stacked cards view */}
        <div className="space-y-3 p-3 md:hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <svg className="animate-spin h-6 w-6 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <div className="text-sm text-muted-foreground mt-2">Loading…</div>
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">No records found.</div>
          ) : (
            data.map((row, idx) => (
              <div key={row[primaryKey] ?? idx} className="rounded-[1.5rem] border border-border/70 bg-card/80 p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {columns.map((c) => (
                      <div key={c.key} className="mb-2 last:mb-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{c.label}</div>
                        <div className={`mt-1 text-sm ${c.bold ? 'font-semibold' : ''} truncate`}>{c.key === "status" ? <StatusBadge status={row[c.key]} /> : row[c.key]}</div>
                      </div>
                    ))}
                  </div>
                  {renderActions && (
                    <div className="flex flex-col items-end gap-2">
                      {renderActions(row)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string | undefined }) {
  if (!status) return null
  const s = String(status).toLowerCase()
  if (s === "paid") return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">Paid</span>
  if (s === "pending" || s === "sent") return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">{status}</span>
  if (s === "overdue") return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 dark:bg-red-500/15 dark:text-red-300">Overdue</span>
  if (s === "draft") return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-500/15 dark:text-slate-300">Draft</span>
  return <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground/75">{status}</span>
}
