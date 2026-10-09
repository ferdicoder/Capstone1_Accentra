import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/usePageMeta"
import { EngagementFilters } from "@/components/firm/engagements/engagement-filters"
import { EngagementList } from "@/components/firm/engagements/engagement-list"
import { CreateEngagementDialog } from "@/components/firm/service-requests/create-engagement-dialog"
import {
  getEngagementDisplayStatus,
  statusFilterOptions,
} from "@/components/firm/engagements/engagement-variants"
import { useCreateStandaloneEngagement, useFetchEngagements } from "@/hooks/useEngagements"
import { authStore } from "@/store/authStore"
import { can } from "@/config/roles"

export default function EngagementsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/billing-officer")
    ? "/billing-officer"
    : location.pathname.startsWith("/firm")
      ? "/firm"
      : "/admin"
  const role = authStore((state) => state.role)
  const canManageEngagements = can(role, "manage_engagements")
  const isBillingOfficer = role === "billing_officer"

  const { data: engagements = [], isLoading, error } = useFetchEngagements({
    includeTasks: canManageEngagements,
  })

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [notice, setNotice] = useState("")
  const [newEngagementOpen, setNewEngagementOpen] = useState(false)
  const createEngagement = useCreateStandaloneEngagement()

  const statusOptions = useMemo(
    () =>
      statusFilterOptions.map((option) => ({
        ...option,
        count:
          option.value === "all"
            ? engagements.length
            : engagements.filter(
                (e) => getEngagementDisplayStatus(e.status) === option.value
              ).length,
      })),
    [engagements]
  )

  const allEngagements = engagements

  const filteredEngagements = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allEngagements.filter((engagement) => {
      const matchesStatus =
        statusFilter === "all" || getEngagementDisplayStatus(engagement.status) === statusFilter
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
  }, [allEngagements, search, statusFilter])

  const handleNewEngagementSubmit = (values) => {
    createEngagement.mutate(
      {
        businessId: values.business.id,
        serviceId: values.serviceId,
        assignedStaff: values.assignedStaff,
        startDate: values.startDate,
        dueDate: values.targetEndDate,
        fee: values.serviceFee,
      },
      {
        onSuccess: () => {
          setNewEngagementOpen(false)
          setNotice("Engagement created successfully.")
          setTimeout(() => setNotice(""), 5000)
        },
      }
    )
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
        resultCount={`${filteredEngagements.length} of ${allEngagements.length} engagements`}
        actions={canManageEngagements && (
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 rounded-lg bg-[#02353C] text-white hover:opacity-90"
            onClick={() => setNewEngagementOpen(true)}
          >
            <Plus className="size-4" />
            New Engagement
          </Button>
        )}
      />

      <EngagementList
        engagements={filteredEngagements}
        loading={isLoading}
        onRowClick={!isBillingOfficer ? (engagement) => {
          navigate(`${basePath}/engagements/${engagement.id}`)
        } : undefined}
        actions={isBillingOfficer ? (engagement) => (
          <Button
            type="button"
            size="sm"
            className="h-9 cursor-pointer gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
            onClick={() => navigate(`${basePath}/billing`, {
              state: { createBillingFor: engagement },
            })}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Create Billing</span>
          </Button>
        ) : undefined}
        emptyMessage="No engagements match your filters."
        emptyDescription="Try clearing the search or changing the status filter."
      />

      {canManageEngagements && (
        <CreateEngagementDialog
          open={newEngagementOpen}
          onOpenChange={setNewEngagementOpen}
          onSubmit={handleNewEngagementSubmit}
          submitting={createEngagement.isPending}
          error={createEngagement.error?.message}
        />
      )}
    </>
  )
}