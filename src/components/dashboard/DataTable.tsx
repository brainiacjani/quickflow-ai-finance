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
}

export default function DataTable({
  title = "Records",
  columns,
  data,
  primaryKey = "id",
  onAdd,
  renderActions,
}: DataTableProps) {
  return (
    <Card className="rounded-xl bg-white shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">{title}</CardTitle>
          {onAdd && (
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={onAdd}>
                Add New
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] table-auto">
            <thead>
              <tr className="sticky top-0 z-10">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-3 text-left text-sm font-bold bg-[#f9fafb] border-b border-gray-200"
                  >
                    {c.label}
                  </th>
                ))}
                {renderActions && (
                  <th className="px-4 py-3 text-left text-sm font-bold bg-[#f9fafb] border-b border-gray-200">Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No records found.
                  </td>
                </tr>
              )}

              {data.map((row, idx) => (
                <tr
                  key={row[primaryKey] ?? idx}
                  className={`border-b border-gray-200 bg-white even:bg-[#f9fafb] hover:bg-gray-100`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 text-sm ${c.bold ? "font-semibold whitespace-nowrap" : ""}`}
                    >
                      {c.key === "status" ? (
                        <StatusBadge status={row[c.key]} />
                      ) : (
                        row[c.key]
                      )}
                    </td>
                  ))}

                  {renderActions && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2 justify-end">
                        {renderActions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string | undefined }) {
  if (!status) return null
  const s = String(status).toLowerCase()
  if (s === "paid") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>
  if (s === "pending") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
  if (s === "overdue") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
}
