import { useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Pencil } from "lucide-react"

import { PageNotFound, PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchClient } from "@/hooks/useClients"
import { authStore } from "@/store/authStore"
import { can } from "@/config/roles"
import { ClientDetailsCard } from "@/components/firm/clients/client-details-card"
import { ClientEngagementHistory } from "@/components/firm/clients/client-engagement-history"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { clientTypeLabels } from "@/components/firm/clients/client-variants"
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
  const { client, history, isLoading } = useFetchClient(id)
  const updateClient = clientStore((state) => state.updateClient)

  const [editing, setEditing] = useState(false)
  const [selectedClientType, setSelectedClientType] = useState("")
  const [confirmationOpen, setConfirmationOpen] = useState(false)
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

  if (!client) {
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

  const handleConfirmClientType = () => {
    updateClient(client.id, { clientType: selectedClientType })
    setEditing(false)
    setConfirmationOpen(false)
    setNotice("Client type updated")
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

        {canManageClients && (editing ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedClientType(client.clientType)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-forest-900 text-white hover:opacity-90"
              disabled={!selectedClientType || selectedClientType === client.clientType}
              onClick={() => setConfirmationOpen(true)}
            >
              Save Changes
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
            onClick={() => {
              setSelectedClientType(client.clientType)
              setEditing(true)
            }}
          >
            <Pencil className="size-4" />
            Edit Client Type
          </Button>
        ))}
      </div>

      <ClientDetailsCard
        client={client}
        editing={canManageClients && editing}
        clientType={selectedClientType}
        onClientTypeChange={setSelectedClientType}
      />

      <ClientEngagementHistory
        engagements={history}
        onViewEngagement={(engagement) => navigate(`${basePath}/engagements/${engagement.id}`)}
      />

      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent data-slot="client-type-confirmation">
          <DialogHeader>
            <DialogTitle>Confirm client type change</DialogTitle>
            <DialogDescription>
              Change this client&apos;s type from{" "}
              <span className="font-medium text-foreground">
                {clientTypeLabels[client.clientType] ?? client.clientType}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {clientTypeLabels[selectedClientType] ?? selectedClientType}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedClientType(client.clientType)
                setEditing(false)
                setConfirmationOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-forest-900 text-white hover:opacity-90"
              onClick={handleConfirmClientType}
            >
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
