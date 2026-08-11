import { useEffect, useMemo, useState } from "react"
import { Ban, CheckCircle2, Pencil, Trash2 } from "lucide-react"
import { create } from "zustand"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { DashboardLayout } from "@/layout/DashboardLayout"
import {
  ServiceManagementActionsMenu,
  ServiceManagementTable,
  ServiceManagementToolbar,
  ServiceDeleteDialog,
  ServiceStatsCards,
} from "@/components/firm/service-management/service-list"
import {
  ServiceCreateDialog,
  ServiceEditDialog,
} from "@/components/firm/service-management/service-template-form"
import {
  categoryFilterOptions,
  getServiceTemplatePrice,
} from "@/components/firm/service-management/service-management-variants"

/* ------------------------------------------------------------------ */
/* Store — mock client-side state. Swap actions with real API later.  */
/* Status: active = published, inactive = draft, deactivated = off.   */
/* ------------------------------------------------------------------ */
const mockServices = [
  {
    id: "1",
    name: "Tax Filing - Non VAT",
    category: "tax-filing",
    description:
      "Complete preparation and e-filing of non-VAT tax returns with the BIR, including attachments and summary schedules.",
    basePrice: getServiceTemplatePrice("Tax Filing - Non VAT"),
    estimatedTime: "3 business days",
    activeEngagements: 12,
    status: "active",
    workflowTasks: [
      { id: "t1", name: "Submit Valid Government-issued ID", required: true, hasReferenceDocument: false, referenceDocument: null },
      { id: "t2", name: "BIR Form 2307", required: true, hasReferenceDocument: false, referenceDocument: null },
      { id: "t3", name: "Official Receipts / Sales Summary", required: false, hasReferenceDocument: false, referenceDocument: null },
    ],
  },
  {
    id: "2",
    name: "Tax Filing - VAT",
    category: "tax-filing",
    description:
      "Preparation and e-filing of VAT returns, including monthly 2550M and quarterly 2550Q submissions.",
    basePrice: getServiceTemplatePrice("Tax Filing - VAT"),
    estimatedTime: "3 business days",
    activeEngagements: 8,
    status: "active",
    workflowTasks: [
      { id: "t4", name: "Submit Valid Government-issued ID", required: true, hasReferenceDocument: false, referenceDocument: null },
      { id: "t5", name: "Previous Year Tax Return", required: false, hasReferenceDocument: false, referenceDocument: null },
      { id: "t6", name: "Official Receipts / Sales Summary", required: false, hasReferenceDocument: false, referenceDocument: null },
    ],
  },
  {
    id: "3",
    name: "Business Registration - Sole Proprietorship",
    category: "business-registration",
    description:
      "End-to-end registration of a sole proprietorship covering DTI, BIR, barangay, and mayor's permits.",
    basePrice: getServiceTemplatePrice("Business Registration - Sole Proprietorship"),
    estimatedTime: "7 business days",
    activeEngagements: 5,
    status: "active",
    workflowTasks: [
      { id: "t7", name: "Submit Valid Government-issued ID", required: true, hasReferenceDocument: false, referenceDocument: null },
      { id: "t8", name: "Audited Financial Statements", required: false, hasReferenceDocument: false, referenceDocument: null },
    ],
  },
  {
    id: "4",
    name: "Business Registration - Corporation",
    category: "business-registration",
    description:
      "SEC incorporation for domestic corporations, including name reservation, articles of incorporation, and bylaws.",
    basePrice: getServiceTemplatePrice("Business Registration - Corporation"),
    estimatedTime: "10 business days",
    activeEngagements: 3,
    status: "inactive",
    workflowTasks: [
      { id: "t9", name: "General Information Sheet", required: true, hasReferenceDocument: false, referenceDocument: null },
    ],
  },
  {
    id: "5",
    name: "Business Registration - Partnership",
    category: "business-registration",
    description:
      "SEC registration for general and limited partnerships, including partnership agreement drafting.",
    basePrice: getServiceTemplatePrice("Business Registration - Partnership"),
    estimatedTime: "10 business days",
    activeEngagements: 0,
    status: "deactivated",
    workflowTasks: [],
  },
]

const serviceStore = create((set) => ({
  services: mockServices,
  addService: (service) =>
    set((state) => ({ services: [service, ...state.services] })),
  updateService: (id, updates) =>
    set((state) => ({
      services: state.services.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  removeService: (id) =>
    set((state) => ({ services: state.services.filter((item) => item.id !== id) })),
  toggleServiceStatus: (id) =>
    set((state) => ({
      services: state.services.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "active" ? "deactivated" : "active" }
          : item
      ),
    })),
}))

const categoryLabel = (value) =>
  categoryFilterOptions.find((option) => option.value === value)?.label ?? value ?? ""

export default function ServiceManagementPage() {
  const services = serviceStore((state) => state.services)
  const addService = serviceStore((state) => state.addService)
  const updateService = serviceStore((state) => state.updateService)
  const removeService = serviceStore((state) => state.removeService)
  const toggleServiceStatus = serviceStore((state) => state.toggleServiceStatus)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingService, setDeletingService] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)

  // Simulated load so the shared skeleton system has something to show.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase()
    return services.filter((service) => {
      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query) ||
        categoryLabel(service.category).toLowerCase().includes(query)
      const matchesCategory = !categoryFilter || service.category === categoryFilter
      const matchesStatus = !statusFilter || service.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [services, search, categoryFilter, statusFilter])

  const handleCreate = (values) => {
    setCreating(true)
    // Simulated request — swap for a real API call later.
    setTimeout(() => {
      addService({ ...values, id: String(Date.now()), activeEngagements: 0 })
      setCreating(false)
      setCreateOpen(false)
      setNotice({ tone: "success", message: `${values.name} added` })
    }, 600)
  }

  const openEdit = (service) => {
    setEditingService(service)
    setEditOpen(true)
  }

  const handleSave = (values) => {
    setEditing(true)
    // Simulated request — swap for a real API call later.
    setTimeout(() => {
      updateService(values.id, values)
      setEditing(false)
      setEditOpen(false)
      setNotice({ tone: "success", message: `${values.name} updated` })
    }, 600)
  }

  const toggleStatus = (service) => {
    const nextStatus = service.status === "active" ? "deactivated" : "active"
    toggleServiceStatus(service.id)
    setNotice({
      tone: "success",
      message: `${service.name} ${nextStatus === "active" ? "activated" : "deactivated"}`,
    })
  }

  const openDeleteDialog = (service) => {
    setDeletingService(service)
    setDeleteOpen(true)
  }

  const handleDelete = () => {
    if (!deletingService) return
    setDeleting(true)
    // Simulated request — swap for a real API call later.
    setTimeout(() => {
      removeService(deletingService.id)
      setDeleting(false)
      setDeleteOpen(false)
      setNotice({ tone: "danger", message: `${deletingService.name} deleted` })
      setDeletingService(null)
    }, 600)
  }

  return (
    <DashboardLayout
      role="firm-admin"
      title="Services"
      breadcrumbs={[
        { label: "Firm Admin", href: "/admin/dashboard" },
        { label: "Service Management", href: "/admin/services" },
      ]      }      >
      {loading ? (
        <PageSkeleton type="services" />
      ) : (
        <>
      <div className="flex flex-wrap items-center gap-3 py-1">
        <p className="text-sm text-muted-foreground">
          Manage your firm's service catalog. You can add new service templates, edit existing
          ones, and activate or deactivate services as needed.
        </p>
        {notice && (
          <span
            className={
              notice.tone === "danger"
                ? "inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600 ring-1 ring-red-500/20 ring-inset"
                : "inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset"
            }
          >
            {notice.message}
          </span>
        )}
      </div>

      <ServiceStatsCards services={services} className="mb-4" />

      <ServiceManagementToolbar
        searchValue={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddService={() => setCreateOpen(true)}
        resultCount={`${filteredServices.length} of ${services.length} services`}
      />

      <ServiceManagementTable
        services={filteredServices}
        emptyMessage="No services match your filters."
        emptyDescription="Try clearing the search or filters."
        actions={(service) => (
          <ServiceManagementActionsMenu
            service={service}
            items={[
              {
                key: "edit",
                label: "Edit service",
                icon: Pencil,
                onSelect: openEdit,
              },
              { type: "separator" },
              service.status === "active"
                ? {
                    key: "deactivate",
                    label: "Deactivate",
                    icon: Ban,
                    destructive: true,
                    onSelect: toggleStatus,
                  }
                : {
                    key: "activate",
                    label: "Activate",
                    icon: CheckCircle2,
                    onSelect: toggleStatus,
                  },
              { type: "separator" },
              {
                key: "delete",
                label: "Delete",
                icon: Trash2,
                destructive: true,
                onSelect: openDeleteDialog,
              },
            ]}
          />
        )}
      />

      <ServiceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        submitting={creating}
      />

      <ServiceEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        service={editingService}
        onSubmit={handleSave}
        submitting={editing}
      />

      <ServiceDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        service={deletingService}
        onConfirm={handleDelete}
        deleting={deleting}
      />
        </>
      )}
    </DashboardLayout>
  )
}
