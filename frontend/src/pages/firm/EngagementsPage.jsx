import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronRight, MoreHorizontal, Plus, CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/usePageMeta"
import { EngagementFilters } from "@/components/firm/engagements/engagement-filters"
import { EngagementList } from "@/components/firm/engagements/engagement-list"
import { statusFilterOptions } from "@/components/firm/engagements/engagement-variants"
import { CancelEngagementDialog } from "@/components/firm/engagements/cancel-engagement-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFetchEngagements, useUpdateEngagementStatus } from "@/hooks/useEngagements"

// NOTE: "New Engagement" (CreateEngagementDialog) intentionally left off this
// page for now — creation only happens via approving a service_request on
// ServiceRequestsPage, per create_engagement's design (it requires a pending
// service_request_id as input, not a blank form).

export default function EngagementsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"

  const { data: engagements = [], isLoading, error } = useFetchEngagements()
  const updateStatus = useUpdateEngagementStatus()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cancelEngagement, setCancelEngagement] = useState(null)
  const [notice, setNotice] = useState("")

  const statusOptions = useMemo(
    () =>
      statusFilterOptions.map((option) => ({
        ...option,
        count:
          option.value === "all"
            ? engagements.length
            : engagements.filter((e) => e.status === option.value).length,
      })),
    [engagements]
  )

  const filteredEngagements = useMemo(() => {
    const query = search.trim().toLowerCase()
    return engagements.filter((engagement) => {
      const matchesStatus = statusFilter === "all" || engagement.status === statusFilter
      const matchesSearch =
        !query ||
        [
          engagement.business?.businessName,
          engagement.engagementNumber,
          engagement.serviceName,
          engagement.client?.firstName,
          engagement.client?.lastName,
        ].some((field) => field?.toLowerCase().includes(query))
      return matchesStatus && matchesSearch
    })
  }, [engagements, search, statusFilter])

  const handleStatusChange = (engagement, newStatus) => {
    updateStatus.mutate(
      { id: engagement.id, status: newStatus },
      {
        onSuccess: () => {
          const labels = { completed: "completed", cancelled: "cancelled" }
          setNotice(`${engagement.business?.businessName ?? engagement.engagementNumber} ${labels[newStatus]}`)
          setTimeout(() => setNotice(""), 3000)
        },
      }
    )
  }

  const handleCancelEngagement = () => {
    if (!cancelEngagement) return
    handleStatusChange(cancelEngagement, "cancelled")
    setCancelEngagement(null)
  }

  usePageMeta({
    title: "Engagements",
    breadcrumbs: [
      // { label: basePath === "/firm" ? "Firm Staff" : "Firm Admin", href: `${basePath}/dashboard` },
      // { label: "Engagements", href: `${basePath}/engagements` },
    ],
  })

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 py-1">
        <p className="text-sm text-muted-foreground">
          View and manage all active client engagements created from approved service requests.
        </p>
        {notice && (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {notice}
          </span>
        )}
        {error && <span className="text-xs text-destructive">Failed to load engagements</span>}
      </div>

      <EngagementFilters
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by client, engagement no., or service..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={statusOptions}
        resultCount={`${filteredEngagements.length} of ${engagements.length} engagements`}
      />

      <EngagementList
        engagements={filteredEngagements}
        loading={isLoading}
        emptyMessage="No engagements match your filters."
        emptyDescription="Try clearing the search or changing the status filter."
        actions={(engagement) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/engagements/${engagement.id}`)}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Details
              <ChevronRight className="size-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem onClick={() => navigate(`${basePath}/engagements/${engagement.id}`)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {engagement.status !== "completed" && (
                  <DropdownMenuItem onClick={() => handleStatusChange(engagement, "completed")}>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Mark Completed
                  </DropdownMenuItem>
                )}
                {engagement.status !== "cancelled" && (
                  <DropdownMenuItem
                    onClick={() => setCancelEngagement(engagement)}
                    className="text-red-600"
                  >
                    <XCircle className="size-4" />
                    Cancel Engagement
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      />

      <CancelEngagementDialog
        open={Boolean(cancelEngagement)}
        onOpenChange={(open) => !open && setCancelEngagement(null)}
        onConfirm={handleCancelEngagement}
      />
    </>
  )
}