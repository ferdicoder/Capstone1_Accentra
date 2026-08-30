import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Briefcase, Eye, FileText, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { usePageMeta } from "@/hooks/usePageMeta"

const engagements = [
  {
    code: "ENG-2024-0041",
    type: "Tax Filing",
    icon: FileText,
    service: "Annual ITR Filing",
    status: "Documents Needed",
    statusTone: "amber",
    created: "Nov 28, 2024",
    due: "Apr 15, 2025",
  },
  {
    code: "ENG-2024-0038",
    type: "Business Permit",
    icon: Briefcase,
    service: "Business Permit Renewal",
    status: "Under Review",
    statusTone: "blue",
    created: "Nov 15, 2024",
    due: "Jan 20, 2025",
  },
  {
    code: "ENG-2024-0031",
    type: "Tax Filing",
    icon: FileText,
    service: "Quarterly VAT Return Q4",
    status: "For Payment",
    statusTone: "purple",
    created: "Nov 01, 2024",
    due: "Dec 31, 2024",
  },
  {
    code: "ENG-2024-0027",
    type: "Tax Filing",
    icon: FileText,
    service: "Quarterly ITR Q3",
    status: "Completed",
    statusTone: "green",
    created: "Sep 15, 2024",
    due: "Oct 31, 2024",
  },
  {
    code: "ENG-2024-0022",
    type: "Business Permit",
    icon: Briefcase,
    service: "Business Permit Renewal",
    status: "Completed",
    statusTone: "green",
    created: "Jan 05, 2024",
    due: "Jan 31, 2024",
  },
]
 
const statusStyles = {
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  blue: "bg-blue-50 text-blue-700 border border-blue-200",
  purple: "bg-purple-50 text-purple-700 border border-purple-200",
  green: "bg-green-50 text-green-700 border border-green-200",
}
 
const iconToneStyles = {
  "Tax Filing": "bg-blue-50 text-blue-600",
  "Business Permit": "bg-blue-50 text-blue-600",
}
 
const STATUS_OPTIONS = [
  "All Statuses",
  "Documents Needed",
  "Under Review",
  "For Payment",
  "Completed",
]
 
const TYPE_OPTIONS = ["All Services", "Tax Filing", "Business Permit"]
 
export default function ClientEngagementsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [typeFilter, setTypeFilter] = useState("All Services")
 
  const filteredEngagements = useMemo(() => {
    return engagements.filter((e) => {
      const matchesSearch = [e.code, e.service, e.type].some((field) =>
        field.toLowerCase().includes(search.toLowerCase())
      )
      const matchesStatus =
        statusFilter === "All Statuses" || e.status === statusFilter
      const matchesType =
        typeFilter === "All Services" || e.type === typeFilter
 
      return matchesSearch && matchesStatus && matchesType
    })
  }, [search, statusFilter, typeFilter])
 
  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "All Statuses" ||
    typeFilter !== "All Services"
 
  const clearFilters = () => {
    setSearch("")
    setStatusFilter("All Statuses")
    setTypeFilter("All Services")
  }

  usePageMeta({
    title: "Engagements",
    breadcrumbs: [{ label: "Home", href: "/client/dashboard" }],
    hasUnreadNotifications: true,
  })

  return (
    <div className="flex flex-1 flex-col gap-5 px-2 py-2">
          <div>
            <h1 className="text-xl font-semibold">My Engagements</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {engagements.length} total engagements
            </p>
          </div>
 
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search engagements..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
 
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
 
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
 
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
              >
                Clear filters
              </button>
            )}
          </div>
 
          <div className="overflow-hidden rounded-xl border bg-background">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[26%]" />
                <col className="w-[16%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3.5 align-middle font-medium">
                    Engagement
                  </th>
                  <th className="px-4 py-3.5 align-middle font-medium">
                    Service
                  </th>
                  <th className="px-4 py-3.5 align-middle font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3.5 align-middle font-medium">
                    Created
                  </th>
                  <th className="px-4 py-3.5 align-middle font-medium">
                    Due Date
                  </th>
                  <th className="px-4 py-3.5 text-center align-middle font-medium">
                    View
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEngagements.map((e) => {
                  const Icon = e.icon
                  return (
                    <tr
                      key={e.code}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconToneStyles[e.type]}`}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{e.code}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {e.type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle font-medium">
                        <span className="line-clamp-2">{e.service}</span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyles[e.statusTone]
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle text-muted-foreground">
                        {e.created}
                      </td>
                      <td className="px-4 py-4 align-middle text-muted-foreground">
                        {e.due}
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <button
                          onClick={() => navigate(`/client/engagements/${e.code}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                        >
                          <Eye className="size-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
 
                {filteredEngagements.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No engagements match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
  )
}