import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Briefcase, Eye, FileText, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchMyEngagements } from "@/hooks/useEngagements"
import { authStore } from "@/store/authStore"

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
 
const statusMeta = {
  pending: { label: "Under Review", tone: "blue" },
  active: { label: "Documents Needed", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "gray" },
}

const statusOptions = ["All Statuses", ...Object.values(statusMeta).map(({ label }) => label)]
const TYPE_OPTIONS = ["All Services", "Tax Filing", "Business Permit"]

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—"

const getStatusMeta = (status) =>
  statusMeta[status] ?? { label: status || "Unknown", tone: "gray" }
 
export default function ClientEngagementsPage() {
  const user = authStore((state) => state.user)
  const { data: business } = useFetchMyBusiness(user?.id)
  const businessId = business?.id
  const { data: engagements = [], isLoading, error } = useFetchMyEngagements(businessId)
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [typeFilter, setTypeFilter] = useState("All Services")
 
  const filteredEngagements = useMemo(() => {
    return engagements.filter((e) => {
      const status = getStatusMeta(e.status)
      const matchesSearch = [e.engagementNumber, e.serviceName, e.category].some((field) =>
        field?.toLowerCase().includes(search.toLowerCase())
      )
      const matchesStatus =
        statusFilter === "All Statuses" || status.label === statusFilter
      const matchesType =
        typeFilter === "All Services" || e.category === typeFilter
 
      return matchesSearch && matchesStatus && matchesType
    })
  }, [engagements, search, statusFilter, typeFilter])
 
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
            <div className="relative min-w-55 max-w-sm flex-1">
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
              {statusOptions.map((status) => (
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

          {error && (
            <p className="text-sm text-destructive">
              Failed to load your engagements.
            </p>
          )}
 
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
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Loading your engagements...
                    </td>
                  </tr>
                )}

                {!isLoading && filteredEngagements.map((e) => {
                  const type = e.category || "Service"
                  const Icon = type === "Tax Filing" ? FileText : Briefcase
                  const status = getStatusMeta(e.status)
                  return (
                    <tr
                      key={e.id}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconToneStyles[type] ?? "bg-blue-50 text-blue-600"}`}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{e.engagementNumber}</p>
                            <p className="truncate text-xs text-muted-foreground">
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle font-medium">
                        <span className="line-clamp-2">{e.serviceName}</span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyles[status.tone] ?? "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle text-muted-foreground">
                        {formatDate(e.createdAt)}
                      </td>
                      <td className="px-4 py-4 align-middle text-muted-foreground">
                        {formatDate(e.targetEndDate)}
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <button
                          onClick={() => navigate(`/client/engagements/${e.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                        >
                          <Eye className="size-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
 
                {!isLoading && filteredEngagements.length === 0 && (
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