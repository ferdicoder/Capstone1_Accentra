import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronRight, MoreHorizontal, Plus, CheckCircle2, Pause, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { EngagementFilters } from "@/components/firm/engagements/engagement-filters"
import { EngagementList } from "@/components/firm/engagements/engagement-list"
import { engagementStore } from "@/components/firm/engagements/engagement-store"
import { statusFilterOptions, generateEngagementNumber } from "@/components/firm/engagements/engagement-variants"
import { CreateEngagementDialog } from "@/components/firm/service-requests/create-engagement-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function EngagementsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"
  const engagements = engagementStore((state) => state.engagements)
  const addEngagement = engagementStore((state) => state.addEngagement)
  const setEngagementStatus = engagementStore((state) => state.setEngagementStatus)

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [newEngagementOpen, setNewEngagementOpen] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

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

  const handleNewEngagementSubmit = (values) => {
    const newEngagement = {
      id: `eng-${Date.now()}`,
      engagementNumber: generateEngagementNumber(),
      serviceName: values.serviceName ?? "—",
      serviceFee: values.serviceFee ?? 0,
      startDate: values.startDate ?? "",
      targetEndDate: values.targetEndDate ?? "",
      status: "active",
      assignedStaff: values.assignedStaff ?? "",
      internalNotes: "",
      documents: [],
      notes: [],
      reviewHistory: [],
      requestNumber: values.requestNumber ?? null,
      client: values.client ?? {},
      business: values.business ?? {},
      clientDescription: values.clientDescription ?? values.client?.description ?? "",
    }

    addEngagement(newEngagement)
    setNewEngagementOpen(false)
    navigate(`${basePath}/engagements/${newEngagement.id}`)
  }

  const handleStatusChange = (engagement, newStatus) => {
    setEngagementStatus(engagement.id, newStatus)
    const labels = { completed: "completed", on_hold: "put on hold", cancelled: "cancelled" }
    setNotice(`${engagement.business?.businessName ?? engagement.engagementNumber} ${labels[newStatus]}`)
    setTimeout(() => setNotice(""), 3000)
  }

  usePageMeta({
    title: "Engagements",
    breadcrumbs: [
      { label: basePath === "/firm" ? "Firm Staff" : "Firm Admin", href: `${basePath}/dashboard` },
      { label: "Engagements", href: `${basePath}/engagements` },
    ],
  })

  return (
    <>
      {loading ? (
        <PageSkeleton type="service-requests" />
      ) : (
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
          </div>

          <EngagementFilters
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by client, engagement no., or service..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={statusOptions}
            resultCount={`${filteredEngagements.length} of ${engagements.length} engagements`}
            actions={
              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-lg bg-[#02353C] text-white hover:opacity-90"
                onClick={() => setNewEngagementOpen(true)}
              >
                <Plus className="size-4" />
                New Engagement
              </Button>
            }
          />

          <EngagementList
            engagements={filteredEngagements}
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
                    {engagement.status !== "on_hold" && engagement.status !== "completed" && (
                      <DropdownMenuItem onClick={() => handleStatusChange(engagement, "on_hold")}>
                        <Pause className="size-4 text-amber-600" />
                        Put On Hold
                      </DropdownMenuItem>
                    )}
                    {engagement.status !== "cancelled" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(engagement, "cancelled")}
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

          <CreateEngagementDialog
            open={newEngagementOpen}
            onOpenChange={setNewEngagementOpen}
            onSubmit={handleNewEngagementSubmit}
          />
        </>
      )}
    </>
  )
}
