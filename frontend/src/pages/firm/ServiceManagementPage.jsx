import { useLocation } from "react-router-dom"
import { useMemo, useState } from "react"
import { Ban, CheckCircle2, Pencil, Trash2 } from "lucide-react"

import { usePageMeta } from "@/hooks/usePageMeta"
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
  CategoryCreateDialog,
  CategoryManagementDialog,
} from "@/components/firm/service-management/service-template-form"
import { categoryFilterOptions } from "@/components/firm/service-management/service-management-variants"
import {
  useFetchServices,
  useCreateService,
  useUpdateService,
  useToggleServiceStatus,
  useDeleteService,
} from "@/hooks/useServices"

import { uploadTemplateDocument } from "@/services/api/documentAPI"

const categoryLabel = (value, options) =>
  options.find((option) => option.value === value)?.label ?? value ?? ""

export default function ServiceManagementPage() {
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingService, setDeletingService] = useState(null)
  const [notice, setNotice] = useState(null)
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false)
  const [categoryManagementOpen, setCategoryManagementOpen] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState(categoryFilterOptions)

  const { data: services = [], isLoading, error } = useFetchServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const toggleStatus = useToggleServiceStatus()
  const deleteService = useDeleteService()

  const createCategory = (name) => {
    const value = name.toLowerCase().trim().replace(/\s+/g, "-")
    setCategoryOptions((current) => [...current, { value, label: name }])
    setNotice({ tone: "success", message: `${name} category created` })
  }

  const renameCategory = (value, name) => {
    setCategoryOptions((current) =>
      current.map((category) => (category.value === value ? { ...category, label: name } : category))
    )
    setNotice({ tone: "success", message: `${name} category updated` })
  }

  const removeCategory = (value) => {
    const category = categoryOptions.find((option) => option.value === value)
    setCategoryOptions((current) => current.filter((option) => option.value !== value))
    if (categoryFilter === value) setCategoryFilter("")
    setNotice({ tone: "success", message: `${category?.label ?? "Category"} removed` })
  }

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase()
    return services.filter((service) => {
      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query) ||
        categoryLabel(service.category, categoryOptions).toLowerCase().includes(query)
      const matchesCategory = !categoryFilter || service.category === categoryFilter
      const matchesStatus = !statusFilter || service.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [services, search, categoryFilter, statusFilter, categoryOptions])

  const handleCreate = (values) => {
  const tasksWithFiles = values.workflowTasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => task.hasReferenceDocument && task.referenceDocument?.file)

  createService.mutate(values, {
    onSuccess: async (newService) => {
      setCreateOpen(false)
      setNotice({ tone: "success", message: `${newService.name} added` })

      if (tasksWithFiles.length === 0) return

      const failedUploads = []

      await Promise.all(
        tasksWithFiles.map(async ({ task, index }) => {
          const matchedTask = newService.workflowTasks?.[index]
          if (!matchedTask?.id) {
            failedUploads.push(task.name)
            return
          }
          try {
            await uploadTemplateDocument(matchedTask.id, task.referenceDocument.file)
          } catch (err) {
            console.error(`Reference document upload failed for "${task.name}":`, err)
            failedUploads.push(task.name)
          }
        })
      )

      if (failedUploads.length > 0) {
        setNotice({
          tone: "danger",
          message: `Service saved, but reference document(s) failed to upload: ${failedUploads.join(", ")}`,
        })
      }
    },
  })
}
  const openEdit = (service) => {
    setEditingService(service)
    setEditOpen(true)
  }

  const handleSave = (values) => {
    updateService.mutate(values, {
      onSuccess: (updated) => {
        setEditOpen(false)
        setNotice({ tone: "success", message: `${updated.name} updated` })
      },
    })
  }

  const handleToggleStatus = (service) => {
    const nextStatus = service.status === "active" ? "deactivated" : "active"
    toggleStatus.mutate(
      { id: service.id, status: nextStatus },
      {
        onSuccess: () => {
          setNotice({
            tone: "success",
            message: `${service.name} ${nextStatus === "active" ? "activated" : "deactivated"}`,
          })
        },
      }
    )
  }

  const openDeleteDialog = (service) => {
    setDeletingService(service)
    setDeleteOpen(true)
  }

  const handleDelete = () => {
    if (!deletingService) return
    deleteService.mutate(deletingService.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setNotice({ tone: "danger", message: `${deletingService.name} deleted` })
        setDeletingService(null)
      },
    })
  }

  usePageMeta({
    title: "Services",
    breadcrumbs: [
      { label: basePath === "/firm" ? "Firm Staff" : "Firm Admin", href: `${basePath}/dashboard` },
      { label: "Service Management", href: `${basePath}/services` },
    ],
  })

  return (
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
        {error && (
          <span className="text-xs text-destructive">Failed to load services</span>
        )}
      </div>

      <ServiceStatsCards services={services} className="mb-4" />

      <ServiceManagementToolbar
        searchValue={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categoryOptions={categoryOptions}
        onManageCategories={() => setCategoryManagementOpen(true)}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddService={() => setCreateOpen(true)}
        resultCount={`${filteredServices.length} of ${services.length} services`}
      />

      <ServiceManagementTable
        services={filteredServices}
        loading={isLoading}
        emptyMessage="No services match your filters."
        emptyDescription="Try clearing the search or filters."
        actions={(service) => (
          <ServiceManagementActionsMenu
            service={service}
            items={[
              { key: "edit", label: "Edit service", icon: Pencil, onSelect: openEdit },
              { type: "separator" },
              service.status === "active"
                ? { key: "deactivate", label: "Deactivate", icon: Ban, destructive: true, onSelect: handleToggleStatus }
                : { key: "activate", label: "Activate", icon: CheckCircle2, onSelect: handleToggleStatus },
              { type: "separator" },
              { key: "delete", label: "Delete", icon: Trash2, destructive: true, onSelect: openDeleteDialog },
            ]}
          />
        )}
      />

      <ServiceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        categoryOptions={categoryOptions}
        submitting={createService.isPending}
      />

      <ServiceEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        service={editingService}
        onSubmit={handleSave}
        categoryOptions={categoryOptions}
        submitting={updateService.isPending}
      />

      <ServiceDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        service={deletingService}
        onConfirm={handleDelete}
        deleting={deleteService.isPending}
      />

      <CategoryCreateDialog
        open={categoryCreateOpen}
        onOpenChange={setCategoryCreateOpen}
        onSubmit={createCategory}
        existingCategories={categoryOptions}
      />

      <CategoryManagementDialog
        open={categoryManagementOpen}
        onOpenChange={setCategoryManagementOpen}
        categories={categoryOptions}
        onAdd={() => {
          setCategoryManagementOpen(false)
          setCategoryCreateOpen(true)
        }}
        onRename={renameCategory}
        onRemove={removeCategory}
      />
    </>
  )
}