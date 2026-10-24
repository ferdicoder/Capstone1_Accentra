import { useMemo, useState } from "react"
import { Ban, CheckCircle2, Pencil, Trash2 } from "lucide-react"

import { usePageMeta } from "@/hooks/usePageMeta"
import {
  ServiceManagementActionsMenu,
  ServiceManagementTable,
  ServiceDetailsDialog,
  ServiceManagementToolbar,
  ServiceDeleteDialog,
  ServiceStatsCards,
} from "@/components/firm/service-management/service-list"
import {
  ServiceCreateDialog,
  ServiceCreateFailureDialog,
  ServiceDuplicateDialog,
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
import { authStore } from "@/store/authStore"

const categoryLabel = (value, options) =>
  options.find((option) => option.value === value)?.label ?? value ?? ""

const normalizeTemplateValue = (value) =>
  String(value ?? "").toLowerCase().replace(/[\s\p{Pd}]+/gu, "")

const hasSameTemplateDetails = (service, values) => {
  const sameText = (first, second) =>
    normalizeTemplateValue(first) === normalizeTemplateValue(second)

  const existingTasks = service.workflowTasks ?? []
  const newTasks = values.workflowTasks ?? []
  const sameTasks =
    existingTasks.length === newTasks.length &&
    existingTasks.every((task, index) => {
      const newTask = newTasks[index]
      const existingDocumentName =
        task.referenceDocument?.name ?? task.referenceDocument?.file?.name
      const newDocumentName =
        newTask.referenceDocument?.name ?? newTask.referenceDocument?.file?.name

      return (
        sameText(task.name, newTask.name) &&
        Boolean(task.required) === Boolean(newTask.required) &&
        Boolean(task.hasReferenceDocument) === Boolean(newTask.hasReferenceDocument) &&
        sameText(existingDocumentName, newDocumentName)
      )
    })

  return (
    sameText(service.category, values.category) &&
    sameText(service.description, values.description) &&
    Number(service.basePrice) === Number(values.basePrice) &&
    Number(service.estimatedTime) === Number(values.estimatedTime) &&
    Boolean(service.isRecurring) === Boolean(values.isRecurring) &&
    sameTasks
  )
}

const isDuplicateServiceTemplate = (service, values) =>
  normalizeTemplateValue(service.name) === normalizeTemplateValue(values.name) ||
  hasSameTemplateDetails(service, values)

export default function ServiceManagementPage() {
  const role = authStore((state) => state.role)
  const canManageServices = role === "admin"
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [createFailureOpen, setCreateFailureOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [viewingService, setViewingService] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingService, setDeletingService] = useState(null)
  const [notice, setNotice] = useState(null)
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false)
  const [categoryManagementOpen, setCategoryManagementOpen] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState(categoryFilterOptions)
  const [createProgress, setCreateProgress] = useState({
    active: false,
    percent: 0,
    phase: "Saving service…",
    uploadingTaskIndexes: [],
  })

  const { data: services = [], isLoading, error, refetch: refetchServices } = useFetchServices()
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
    if (categoryFilter === value) {
      setCategoryFilter("")
      setCurrentPage(1)
    }
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
    if (canManageServices) {
      if (isLoading || error) {
        setNotice({
          tone: "danger",
          message: "Unable to check existing service templates. Please try again.",
        })
        return
      }

      if (services.some((service) => isDuplicateServiceTemplate(service, values))) {
        setDuplicateDialogOpen(true)
        return
      }
    }

    const tasksWithFiles = values.workflowTasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => task.hasReferenceDocument && task.referenceDocument?.file)
    const totalBytes = tasksWithFiles.reduce((total, { task }) => total + task.referenceDocument.file.size, 0)

    setCreateProgress({
      active: true,
      percent: 0,
      phase: "Saving service…",
      uploadingTaskIndexes: tasksWithFiles.map(({ index }) => index),
    })
    createService.mutate(values, {
      onSuccess: async (newService) => {
        const failedUploads = []

        try {
          if (tasksWithFiles.length === 0) {
            setCreateOpen(false)
            setNotice({ tone: "success", message: `${newService.name} added` })
            return
          }

          setCreateProgress({
            active: true,
            percent: 10,
            phase: "Uploading reference documents…",
            uploadingTaskIndexes: tasksWithFiles.map(({ index }) => index),
          })
          const uploadedBytes = new Map()

          await Promise.all(
            tasksWithFiles.map(async ({ task, index }) => {
              const matchedTask = newService.workflowTasks?.[index]
              if (!matchedTask?.id) {
                failedUploads.push(task.name)
                setCreateProgress((current) => ({
                  ...current,
                  uploadingTaskIndexes: current.uploadingTaskIndexes.filter(
                    (taskIndex) => taskIndex !== index
                  ),
                }))
                return
              }
              try {
                await uploadTemplateDocument(matchedTask.id, task.referenceDocument.file, (event) => {
                  uploadedBytes.set(index, event.loaded)
                  const loaded = [...uploadedBytes.values()].reduce((total, bytes) => total + bytes, 0)
                  const uploadPercent = totalBytes > 0 ? loaded / totalBytes : 1
                  setCreateProgress((current) => ({
                    ...current,
                    active: true,
                    percent: Math.min(99, Math.round(10 + uploadPercent * 90)),
                    phase: "Uploading reference documents…",
                  }))
                })
              } catch (err) {
                console.error(`Reference document upload failed for "${task.name}":`, err)
                failedUploads.push(task.name)
              } finally {
                setCreateProgress((current) => ({
                  ...current,
                  uploadingTaskIndexes: current.uploadingTaskIndexes.filter(
                    (taskIndex) => taskIndex !== index
                  ),
                }))
              }
            })
          )

          await refetchServices()
          setCreateOpen(false)

          // The service is only reported as added once its reference documents
          // have finished uploading, so the completion state matches reality.
          if (failedUploads.length > 0) {
            setNotice({
              tone: "danger",
              message: `Service saved, but reference document(s) failed to upload: ${failedUploads.join(", ")}`,
            })
          } else {
            setNotice({ tone: "success", message: `${newService.name} added` })
          }
        } catch (err) {
          console.error(err)
          setCreateOpen(false)
          setNotice({
            tone: "danger",
            message: err?.message || "Service saved, but the reference documents could not be uploaded.",
          })
        } finally {
          // Always release the loading state so the progress bar and the
          // submit button cannot stay stuck on "Saving…".
          setCreateProgress({
            active: false,
            percent: 0,
            phase: "Saving service…",
            uploadingTaskIndexes: [],
          })
        }
      },
      onError: (err) => {
        setCreateProgress({
          active: false,
          percent: 0,
          phase: "Saving service…",
          uploadingTaskIndexes: [],
        })
        setCreateFailureOpen(true)
        console.error("Service creation failed:", err)
      },
    })
  }

  const openCreateDialog = () => {
    // Start from a clean progress state so a previous run's phase is never
    // shown on a freshly opened form.
    setCreateProgress({
      active: false,
      percent: 0,
      phase: "Saving service…",
      uploadingTaskIndexes: [],
    })
    setCreateOpen(true)
  }
  const openEdit = (service) => {
    setEditingService(service)
    setEditOpen(true)
  }

  const openDetails = (service) => {
    setViewingService(service)
    setDetailsOpen(true)
  }

  const handleSave = (values) => {
    const tasksWithFiles = values.workflowTasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => task.hasReferenceDocument && task.referenceDocument?.file)

    updateService.mutate(values, {
      onSuccess: async (updated) => {
        setEditOpen(false)
        setNotice({ tone: "success", message: `${updated.name} updated` })

        if (tasksWithFiles.length === 0) return

        const failedUploads = []

        await Promise.all(
          tasksWithFiles.map(async ({ task, index }) => {
            const matchedTask =
              updated.workflowTasks?.find((updatedTask) => updatedTask.id === task.id) ??
              updated.workflowTasks?.[index]

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

        await refetchServices()

        if (failedUploads.length > 0) {
          setNotice({
            tone: "danger",
            message: `Service updated, but reference document(s) failed to upload: ${failedUploads.join(", ")}`,
          })
        }
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
      // { label: basePath === "/firm" ? "Firm Staff" : "Firm Admin", href: `${basePath}/dashboard` },
      // { label: "Service Management", href: `${basePath}/services` },
    ],
  })

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 py-1">
        <p className="text-sm text-muted-foreground">
          {canManageServices
            ? "Manage your firm's service catalog. You can add new service templates, edit existing ones, and activate or deactivate services as needed."
            : "View your firm's service catalog. Service changes can only be made by an administrator."}
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
        onSearchChange={(value) => {
          setSearch(value)
          setCurrentPage(1)
        }}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(value) => {
          setCategoryFilter(value)
          setCurrentPage(1)
        }}
        categoryOptions={categoryOptions}
        onManageCategories={canManageServices ? () => setCategoryManagementOpen(true) : undefined}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        }}
        onAddService={canManageServices ? openCreateDialog : undefined}
        resultCount={`${filteredServices.length} of ${services.length} services`}
      />

      <ServiceManagementTable
        services={filteredServices}
        loading={isLoading}
        emptyMessage="No services match your filters."
        emptyDescription="Try clearing the search or filters."
        onRowClick={canManageServices ? undefined : openDetails}
        page={currentPage}
        onPageChange={setCurrentPage}
        actions={canManageServices ? (service) => (
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
        ) : undefined}
      />

      {!canManageServices && (
        <ServiceDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          service={viewingService}
          categoryOptions={categoryOptions}
        />
      )}

      {canManageServices && (
        <>
          <ServiceCreateDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={handleCreate}
            categoryOptions={categoryOptions}
            submitting={createService.isPending || createProgress.active}
            progress={createProgress}
          />

          <ServiceCreateFailureDialog
            open={createFailureOpen}
            onOpenChange={setCreateFailureOpen}
          />

          <ServiceDuplicateDialog
            open={duplicateDialogOpen}
            onOpenChange={setDuplicateDialogOpen}
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
      )}
    </>
  )
}