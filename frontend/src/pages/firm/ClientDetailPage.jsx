import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Pencil } from "lucide-react"

import { PageNotFound, PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchBusinesses, useUpdateBusinessType } from "@/hooks/useBusinesses"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { authStore } from "@/store/authStore"
import { can } from "@/config/roles"
import { ClientDetailsCard } from "@/components/firm/clients/client-details-card"
import { ClientEngagementHistory } from "@/components/firm/clients/client-engagement-history"
import { EditClientDialog } from "@/components/firm/clients/edit-client-dialog"
import { clientStore } from "@/components/firm/clients/client-store"

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"
  const backHref = `${basePath}/clients`

  // Firm Admin can edit; Firm Staff sees the same page read-only (no edit UI rendered).
  const role = authStore((state) => state.role)
  const canManageClients = can(role, "manage_clients")

  // Resolved from the route param + existing data, never from navigation state,
  // so refresh, direct URLs, new tabs and Back/Forward all work.
  const { data: businesses = [], isLoading: businessesLoading, error } = useFetchBusinesses()
  const { data: engagements = [], isLoading: engagementsLoading } = useFetchEngagements()
  const overrides = clientStore((state) => state.overrides)
  const client = useMemo(() => {
    const business = businesses.find((item) => item.id === id)
    if (!business) return null

    const merged = { ...business, ...(overrides[id] ?? {}) }
    return {
      ...merged,
      name: [merged.firstName, merged.middleName, merged.lastName].filter(Boolean).join(" "),
      status: merged.deactivated ? "deactivated" : merged.ownerStatus,
    }
  }, [businesses, id, overrides])
  const history = engagements
    .filter((engagement) => engagement.business?.id === id)
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
  const isLoading = businessesLoading || engagementsLoading
  const updateClient = clientStore((state) => state.updateClient)
  const updateBusinessType = useUpdateBusinessType()

  const [editOpen, setEditOpen] = useState(false)
  const [notice, setNotice] = useState("")

  usePageMeta({
    title: client?.name || "Client Details",
    breadcrumbs: [{ label: "Client Management", href: backHref }],
  })

  const backButton = (
    <Link
      to={backHref}
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className: "cursor-pointer gap-1.5 text-muted-foreground",
      })}
    >
      <ArrowLeft className="size-4" />
      Back
    </Link>
  )

  if (isLoading) return <PageSkeleton />

  if (error || !client) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-3 py-1">{backButton}</div>
        <PageNotFound
          title="Client Not Found"
          message="The requested client could not be found."
          actionLabel="Back to Client Management"
          actionHref={backHref}
        />
      </>
    )
  }

  const handleSave = (values) => {
    const typeChanged = values.clientType !== client.clientType
    updateClient(client.id, values)

    if (typeChanged) {
      updateBusinessType.mutate(
        { businessId: client.id, clientType: values.clientType },
        {
          onSuccess: () => {
            setNotice("Client type updated")
            setTimeout(() => setNotice(""), 3000)
          },
          onError: () => {
            updateClient(client.id, { clientType: client.clientType })
            setNotice("Failed to update client type")
            setTimeout(() => setNotice(""), 3000)
          },
        }
      )
    }

    setEditOpen(false)
    if (!typeChanged) setNotice("Client information updated")
    setTimeout(() => setNotice(""), 3000)
  }

  const handleToggleDeactivate = () => {
    const deactivating = client.status !== "deactivated"
    updateClient(client.id, { deactivated: deactivating })
    setEditOpen(false)
    setNotice(`Client ${deactivating ? "deactivated" : "reactivated"}`)
    setTimeout(() => setNotice(""), 3000)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 py-1">
        {backButton}
        {notice && (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {notice}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">Client Details</h2>
          <p className="text-sm text-muted-foreground">
            Client information and engagement history.
          </p>
        </div>

        {canManageClients && (
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" />
            Edit Client
          </Button>
        )}
      </div>

      <ClientDetailsCard client={client} />

      <ClientEngagementHistory
        engagements={history}
        onViewEngagement={(engagement) => navigate(`${basePath}/engagements/${engagement.id}`)}
      />

      {canManageClients && (
        <EditClientDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          client={client}
          onSubmit={handleSave}
          onDeactivate={handleToggleDeactivate}
        />
      )}
    </>
  )
}
