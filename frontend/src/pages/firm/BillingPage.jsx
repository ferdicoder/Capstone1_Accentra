import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye, ShieldCheck } from "lucide-react"

import { FirmUserActionsMenu } from "@/components/firm/users/firm-user-actions-menu"
import { usePageMeta } from "@/hooks/usePageMeta"
import { BillingToolbar } from "@/components/firm/billing/billing-toolbar"
import { BillingTable } from "@/components/firm/billing/billing-table"
import { BillingSummaryCards } from "@/components/firm/billing/billing-summary-cards"
import { buildBillingSummaryItems } from "@/components/firm/billing/billing-utils"
import { CreateBillingDialog } from "@/components/firm/billing/create-billing-dialog"
import { VerifyPaymentDialog } from "@/components/firm/billing/verify-payment-dialog"
import { isVerifiable } from "@/components/firm/billing/billing-variants"
import {
  createMockBilling,
  getMockBillings,
  mockEngagements,
  verifyMockPayment,
  mockClients,
} from "@/components/firm/billing/billing-mock-data"

export default function BillingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/billing-officer") ? "/billing-officer" : "/admin"
  const [engagementForBilling, setEngagementForBilling] = useState(
    () => location.state?.createBillingFor ?? null
  )

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(
    () => Boolean(location.state?.createBillingFor)
  )
  const [verifying, setVerifying] = useState(null)
  const [notice, setNotice] = useState("")
  const [billings, setBillings] = useState(getMockBillings)

  useEffect(() => {
    if (location.state?.createBillingFor) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const billingEngagements = useMemo(
    () => engagementForBilling
      ? [
          engagementForBilling,
          ...mockEngagements.filter((engagement) => engagement.id !== engagementForBilling.id),
        ]
      : mockEngagements,
    [engagementForBilling]
  )

  const filteredBillings = useMemo(() => {
  const query = search.trim().toLowerCase()

  return billings.filter((billing) => {
    const matchesStatus =
      !statusFilter || billing.status === statusFilter

    const matchesType =
      !typeFilter || billing.invoice_type === typeFilter

    if (!matchesStatus || !matchesType) return false

    if (!query) return true

    const engagement = mockEngagements.find(
      (e) => e.id === billing.engagement_id
    )

    const client = mockClients.find(
      (c) => c.id === billing.client_id
    )

    const clientName = client
      ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
      : ""

    return [
      billing.id,
      billing.payment_reference,
      billing.invoice_type,
      billing.billing_month?.toString(),
      billing.billing_year?.toString(),

      // Engagement information
      engagement?.engagementNumber,
      engagement?.serviceName,
      engagement?.business?.businessName,

      // Client information
      clientName,
      client?.email,
      client?.business?.businessName,
    ].some((field) =>
      field?.toLowerCase().includes(query)
    )
  })
}, [
  billings,
  search,
  statusFilter,
  typeFilter,
])

  const summaryItems = useMemo(() => buildBillingSummaryItems(billings), [billings])

  const showNotice = (message) => {
    setNotice(message)
    setTimeout(() => setNotice(""), 3000)
  }

  const handleCreate = (values) => {
    const record = createMockBilling(values)
    setBillings(getMockBillings())
    setCreateOpen(false)
    setEngagementForBilling(null)
    showNotice(`${record.id} created`)
  }

  const handleCreateDialogOpenChange = (open) => {
    setCreateOpen(open)
    if (!open) setEngagementForBilling(null)
  }

  const handleConfirmVerification = () => {
    if (!verifying) return
    verifyMockPayment(verifying.id)
    setBillings(getMockBillings())
    showNotice(`${verifying.id} payment verified`)
    setVerifying(null)
  }

  usePageMeta({
    title: "Billing",
    breadcrumbs: [
      { label: "Firm Admin", href: "/admin/dashboard" },
      { label: "Billing", href: "/admin/billing" },
    ],
  })

  return (
    <>
          <div className="flex flex-wrap items-center gap-3 py-1">
            {notice && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
                {notice}
              </span>
            )}
          </div>

          <BillingSummaryCards items={summaryItems} />

          <BillingToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by invoice, engagement, service, or reference..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            onCreateBilling={() => setCreateOpen(true)}
            resultCount={`${filteredBillings.length} of ${billings.length} records`}
          />

          <BillingTable
            billings={filteredBillings}
            engagements={mockEngagements}
            clients={mockClients}
            emptyMessage={
              billings.length === 0
                ? "No billing records exist."
                : "No billing records match your current filters."
            }
            emptyDescription={
              billings.length === 0
                ? "Create a billing record to get started."
                : "Try clearing the search or filters."
            }
            onRowClick={(billing) => navigate(`${basePath}/billing/${billing.id}`)}
            actions={(billing) => (
              <FirmUserActionsMenu
                user={billing}
                items={[
                  {
                    key: "view",
                    label: "View Details",
                    icon: Eye,
                    onSelect: () => navigate(`${basePath}/billing/${billing.id}`),
                  },
                  ...(isVerifiable(billing)
                    ? [
                        { type: "separator" },
                        {
                          key: "verify",
                          label: "Verify Payment",
                          icon: ShieldCheck,
                          onSelect: () => setVerifying(billing),
                        },
                      ]
                    : []),
                ]}  
              />
            )}
          />

          <CreateBillingDialog
            open={createOpen}
            onOpenChange={handleCreateDialogOpenChange}
            onSubmit={handleCreate}
            engagements={billingEngagements}
            clients={mockClients}
            billings={billings}
            initialEngagementId={engagementForBilling?.id ?? ""}
          />

          <VerifyPaymentDialog
            billing={verifying}
            open={Boolean(verifying)}
            onOpenChange={(open) => !open && setVerifying(null)}
            onConfirm={handleConfirmVerification}
          />
    </>
  )
}
