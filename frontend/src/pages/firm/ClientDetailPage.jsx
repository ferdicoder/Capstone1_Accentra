import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Pencil } from "lucide-react"

import { PageNotFound, PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/usePageMeta"
import {
  useFetchBusinesses,
  useToggleClientStatus,
  useUpdateBusinessType,
} from "@/hooks/useBusinesses"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { useFetchBillings } from "@/hooks/useBillings"
import { authStore } from "@/store/authStore"
import { can } from "@/config/roles"
import { ClientDetailsCard } from "@/components/firm/clients/client-details-card"
import { ClientEngagementHistory } from "@/components/firm/clients/client-engagement-history"
import { FirmUserStatusDialog } from "@/components/firm/users/firm-user-status-dialog"
import { BillingStatusBadge } from "@/components/firm/billing/billing-status-badge"
import {
  formatPeso,
  invoiceTypeLabels,
  paymentMethodLabels,
} from "@/components/firm/billing/billing-variants"
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
import { formatRevenue } from "@/components/firm/service-requests/service-request-variants"

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/billing-officer")
    ? "/billing-officer"
    : location.pathname.startsWith("/firm")
      ? "/firm"
      : "/admin"
  const backHref = `${basePath}/clients`

  // Firm Admin can edit; Firm Staff sees the same page read-only (no edit UI rendered).
  const role = authStore((state) => state.role)
  const canManageClients = can(role, "manage_clients")
  const canViewPaymentHistory = can(role, "manage_billing")

  // Resolved from the route param + existing data, never from navigation state,
  // so refresh, direct URLs, new tabs and Back/Forward all work.
  const { data: businesses = [], isLoading: businessesLoading, error } = useFetchBusinesses()
  const { data: engagements = [], isLoading: engagementsLoading } = useFetchEngagements()
  const {
    data: billings = [],
    isLoading: billingsLoading,
    error: billingsError,
  } = useFetchBillings({ enabled: canViewPaymentHistory })
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
  const toggleClientStatus = useToggleClientStatus()

  const [editing, setEditing] = useState(false)
  const [selectedClientType, setSelectedClientType] = useState("")
  const [retainerFee, setRetainerFee] = useState("")
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [deactivationOpen, setDeactivationOpen] = useState(false)
  const [billingTypeFilter, setBillingTypeFilter] = useState("")
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

  const resetEditState = () => {
    setSelectedClientType(client.clientType)
    setRetainerFee(client.retainerFee != null ? String(client.retainerFee) : "")
  }

  const typeChanged = Boolean(selectedClientType) && selectedClientType !== client.clientType
  // Switching a client onto retainer requires a fee before the change can be saved.
  const requiresRetainerFee = selectedClientType === "retainer" && client.clientType !== "retainer"
  const retainerFeeNumber = Number(retainerFee)
  const retainerFeeValid =
    !requiresRetainerFee ||
    (retainerFee.trim() !== "" && Number.isFinite(retainerFeeNumber) && retainerFeeNumber > 0)

  const handleConfirmClientType = () => {
    if (!typeChanged || !retainerFeeValid) return

    const fee = selectedClientType === "retainer" ? retainerFeeNumber : null

    updateBusinessType.mutate(
      { businessId: client.id, clientType: selectedClientType, retainerFee: fee },
      {
        onSuccess: () => {
          updateClient(client.id, { clientType: selectedClientType, retainerFee: fee })
          setEditing(false)
          setConfirmationOpen(false)
          setNotice("Client details updated")
          setTimeout(() => setNotice(""), 3000)
        },
        onError: (err) => {
          setNotice(err?.message ?? "Failed to update client type")
          setTimeout(() => setNotice(""), 3000)
        },
      }
    )
  }

  const clientBillings = billings.filter(
    (billing) =>
      String(billing.business_id) === String(client.id) &&
      (!billingTypeFilter || billing.invoice_type === billingTypeFilter)
  )
  const clientPaymentHistory = clientBillings.flatMap((billing) =>
    billing.payments?.length
      ? billing.payments.map((payment) => ({ billing, payment }))
      : [{ billing, payment: null }]
  ).sort((first, second) => {
    const getMostRecentDate = ({ billing, payment }) =>
      payment?.payment_proofs
        ?.map((proof) => proof.files?.created_at)
        .filter(Boolean)
        .sort()
        .at(-1) ?? billing.due_date ?? ""
    return getMostRecentDate(second).localeCompare(getMostRecentDate(first))
  })

  const handleConfirmDeactivation = () => {
    const nextStatus = client.status === "deactivated" ? "active" : "deactivated"
    toggleClientStatus.mutate(
      { ownerId: client.ownerId, status: nextStatus },
      {
        onSuccess: () => {
          updateClient(client.id, { deactivated: nextStatus === "deactivated" })
          setDeactivationOpen(false)
          setNotice(nextStatus === "deactivated" ? "Client deactivated" : "Client reactivated")
          setTimeout(() => setNotice(""), 3000)
        },
        onError: (statusError) => {
          setNotice(statusError?.message ?? "Failed to update client status")
          setTimeout(() => setNotice(""), 3000)
        },
      }
    )
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
                resetEditState()
                setEditing(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-forest-900 text-white hover:opacity-90"
              disabled={!typeChanged || !retainerFeeValid}
              onClick={() => setConfirmationOpen(true)}
            >
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={client.status === "deactivated" ? "default" : "destructive"}
              className={`h-9 gap-1.5 rounded-lg ${client.status === "deactivated" ? "bg-forest-900 text-white hover:opacity-90" : ""}`}
              onClick={() => setDeactivationOpen(true)}
            >
              {client.status === "deactivated" ? "Reactivate" : "Deactivate"}
            </Button>
            {/* Editing the client type writes to businesses.type — only
                possible once the client has added a business. */}
            {client.hasBusiness !== false && (
              <Button
                type="button"
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
                onClick={() => {
                  resetEditState()
                  setEditing(true)
                }}
              >
                <Pencil className="size-4" />
                Edit Client
              </Button>
            )}
          </div>
        ))}
      </div>

      <ClientDetailsCard
        client={client}
        editing={canManageClients && editing}
        clientType={selectedClientType}
        onClientTypeChange={setSelectedClientType}
        retainerFee={retainerFee}
        onRetainerFeeChange={setRetainerFee}
        retainerFeeRequired={requiresRetainerFee}
        retainerFeeError={requiresRetainerFee && !retainerFeeValid}
      />

      <ClientEngagementHistory
        engagements={history}
        onViewEngagement={(engagement) => navigate(`${basePath}/engagements/${engagement.id}`)}
      />

      {canViewPaymentHistory && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Payment History</h2>
            <label className="mt-3 flex max-w-xs flex-col gap-1 text-xs font-medium text-muted-foreground">
              Filter by billing type
              <select
                value={billingTypeFilter}
                onChange={(event) => setBillingTypeFilter(event.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground"
              >
                <option value="">All billing types</option>
                <option value="service_fee">Service Fee</option>
                <option value="retainer_fee">Retainer Fee</option>
              </select>
            </label>
          </div>
          {billingsLoading ? (
            <p className="text-sm text-muted-foreground">Loading payment history…</p>
          ) : billingsError ? (
            <p role="alert" className="text-sm text-destructive">
              Payment history could not be loaded: {billingsError.message}
            </p>
          ) : clientBillings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-foreground">
                    <th className="px-3 py-2 font-semibold">Billing ID</th>
                    <th className="px-3 py-2 font-semibold">Billing Type</th>
                    <th className="px-3 py-2 font-semibold">Payment Date</th>
                    <th className="px-3 py-2 font-semibold">Amount</th>
                    <th className="px-3 py-2 font-semibold">Payment Method</th>
                    <th className="px-3 py-2 font-semibold">Reference ID</th>
                    <th className="px-3 py-2 font-semibold">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clientPaymentHistory.map(({ billing, payment }, index) => {
                    const paymentDate = payment?.payment_proofs
                      ?.map((proof) => proof.files?.created_at)
                      .filter(Boolean)
                      .sort()
                      .at(-1)

                    return (
                    <tr
                      key={`${billing.id}-${payment?.payment_id ?? index}`}
                      className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                      onClick={() => navigate(`${basePath}/billing/${billing.id}`)}
                    >
                      <td className="px-3 py-3 font-medium text-foreground">{billing.id}</td>
                      <td className="px-3 py-3">
                        {invoiceTypeLabels[billing.invoice_type] ?? billing.invoice_type}
                      </td>
                      <td className="px-3 py-3">
                        {paymentDate ? new Date(paymentDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {formatPeso(payment?.amount ?? billing.amount)}
                      </td>
                      <td className="px-3 py-3">
                        {paymentMethodLabels[payment?.payment_method] ??
                          payment?.payment_method ??
                          "—"}
                      </td>
                      <td className="px-3 py-3">{payment?.reference_id ?? "—"}</td>
                      <td className="px-3 py-3">
                        {billing.status ? (
                          <BillingStatusBadge status={billing.status} />
                        ) : (
                          "No payment submitted"
                        )}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No billing or payment records are available for this client.
            </p>
          )}
        </section>
      )}

      <FirmUserStatusDialog
        open={deactivationOpen}
        onOpenChange={setDeactivationOpen}
        user={client}
        entityType="client"
        action={client.status === "deactivated" ? "reactivate" : "deactivate"}
        onConfirm={handleConfirmDeactivation}
        submitting={toggleClientStatus.isPending}
      />

      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent data-slot="client-type-confirmation">
          <DialogHeader>
            <DialogTitle>Confirm client type change</DialogTitle>
            <DialogDescription>
              Change this client&apos;s type from{" "}
              <span className="font-medium text-foreground">
                {client.type == null
                  ? "Not set"
                  : clientTypeLabels[client.clientType] ?? client.clientType}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {clientTypeLabels[selectedClientType] ?? selectedClientType}
              </span>
              ?
            </DialogDescription>
            {requiresRetainerFee && (
              <p className="text-sm text-muted-foreground">
                A retainer fee of{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {formatRevenue(retainerFeeNumber)}
                </span>{" "}
                will be applied to this client.
              </p>
            )}
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetEditState()
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
