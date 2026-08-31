import {
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ServiceCategoryBadge, ServiceStatusBadge } from "./service-badges"
import {
  categoryFilterOptions,
  formatBasePrice,
  statusFilterOptions,
} from "./service-management-variants"

/**
 * Presentational stats row: derives 4 summary cards directly from the
 * services array. Values are computed on every render, so they stay in sync
 * with the page's state without any manual refresh.
 */
export function ServiceStatsCards({ services = [], className }) {
  const total = services.length
  const active = services.filter((service) => service.status === "active").length
  const activeEngagements = services.reduce(
    (sum, service) => sum + (Number(service.activeEngagements) || 0),
    0
  )
  // "Inactive / Archived" covers both drafts (inactive) and turned-off
  // services (deactivated), so every non-active service is accounted for.
  const inactiveArchived = services.filter(
    (service) => service.status === "inactive" || service.status === "deactivated"
  ).length

  const stats = [
    {
      label: "Total Services",
      value: total,
      valueClassName: "text-forest-900 dark:text-emerald-300",
    },
    {
      label: "Active Services",
      value: active,
      valueClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Active Engagements",
      value: activeEngagements,
      valueClassName: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Inactive / Archived",
      value: inactiveArchived,
      valueClassName: "text-muted-foreground",
    },
  ]

  return (
    <div
      data-slot="service-stats-cards"
      className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {stat.label}
          </p>
          <p className={cn("mt-1.5 text-3xl font-bold", stat.valueClassName)}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  )
}

const defaultServiceColumns = [
  {
    key: "name",
    label: "Service Name",
    render: (service) => (
      <p className="truncate text-sm font-medium text-foreground">{service?.name}</p>
    ),
  },
  {
    key: "category",
    label: "Category",
    render: (service) => <ServiceCategoryBadge category={service?.category} />,
  },
  {
    key: "description",
    label: "Description",
    render: (service) => (
      <p className="line-clamp-1 max-w-56 text-xs text-muted-foreground">
        {service?.description}
      </p>
    ),
  },
  {
    key: "basePrice",
    label: "Base Price",
    render: (service) => (
      <span className="text-sm font-medium tabular-nums text-foreground">
        {formatBasePrice(service?.basePrice)}
      </span>
    ),
  },
  {
    key: "estimatedTime",
    label: "Estimated Time",
    render: (service) => (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="size-3.5 shrink-0" />
        {service?.estimatedTime}
      </span>
    ),
  },
  {
    key: "activeEngagements",
    label: "Active Engagements",
    render: (service) => (
      <span className="text-sm font-medium tabular-nums text-foreground">
        {service?.activeEngagements ?? 0}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (service) => <ServiceStatusBadge status={service?.status} />,
  },
]

/** Presentational row used by <ServiceManagementTable />. */
function ServiceManagementRow({ service, columns = [], onRowClick, children, className, ...props }) {
  const clickable = typeof onRowClick === "function"

  const handleKeyDown = (event) => {
    if (!clickable) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onRowClick(service, event)
    }
  }

  return (
    <tr
      data-slot="service-management-row"
      className={cn(
        "border-b border-border/60 transition-colors last:border-b-0",
        clickable && "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
        className
      )}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? (event) => onRowClick(service, event) : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      {...props}
    >
      {columns.map((column) => {
        const content = column.render ? column.render(service) : service?.[column.key]
        return (
          <td
            key={column.key ?? column.label}
            className={cn("px-4 py-3 align-middle", column.cellClassName)}
          >
            {content}
          </td>
        )
      })}
      {children}
    </tr>
  )
}

/** Presentational, data-driven service table. Receives everything through props. */
export function ServiceManagementTable({
  services = [],
  columns = defaultServiceColumns,
  getRowKey = (service, index) => service?.id ?? index,
  loading = false,
  skeletonRows = 5,
  emptyMessage = "No services found.",
  emptyDescription,
  actions,
  onRowClick,
  className,
  ...props
}) {
  const showActions = typeof actions === "function"
  const isEmpty = !loading && services.length === 0
  const columnCount = columns.length + (showActions ? 1 : 0)

  return (
    <div
      data-slot="service-management-table"
      className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-sm", className)}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
              {columns.map((column) => (
                <th
                  key={column.key ?? column.label}
                  scope="col"
                  className={cn("px-4 py-3 font-semibold", column.headerClassName)}
                >
                  {column.label}
                </th>
              ))}
              {showActions && (
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }, (_, index) => (
                  <tr
                    key={`service-skeleton-${index}`}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <td colSpan={columnCount} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-3.5 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-3 w-1/5" />
                      </div>
                    </td>
                  </tr>
                ))
              : isEmpty
                ? (
                    <tr>
                      <td colSpan={columnCount} className="px-6 py-12">
                        <div className="flex flex-col items-center justify-center gap-2 text-center">
                          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                            <ClipboardList className="size-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
                          {emptyDescription && (
                            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                : services.map((service, index) => (
                    <ServiceManagementRow
                      key={getRowKey(service, index)}
                      service={service}
                      columns={columns}
                      onRowClick={onRowClick}
                    >
                      {showActions && (
                        <td
                          className="px-4 py-3 text-right align-middle"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {actions(service)}
                        </td>
                      )}
                    </ServiceManagementRow>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Presentational toolbar: search + category/status filters + primary action. Fully controlled. */
export function ServiceManagementToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search services...",
  categoryFilter = "",
  onCategoryFilterChange,
  categoryOptions = categoryFilterOptions,
  statusFilter = "",
  onStatusFilterChange,
  statusOptions = statusFilterOptions,
  onAddService,
  addServiceLabel = "Add Service",
  resultCount,
  children,
  className,
  ...props
}) {
  const activeCategory = categoryOptions.find((option) => option.value === categoryFilter)
  const activeStatus = statusOptions.find((option) => option.value === statusFilter)

  const filters = [
    { label: "Category", value: categoryFilter, active: activeCategory, options: categoryOptions, onChange: onCategoryFilterChange },
    { label: "Status", value: statusFilter, active: activeStatus, options: statusOptions, onChange: onStatusFilterChange },
  ].filter((filter) => filter.options.length > 0)

  return (
    <div
      data-slot="service-management-toolbar"
      className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center", className)}
      {...props}
    >
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="pl-8"
        />
      </div>

      {resultCount && (
        <p className="hidden text-sm text-muted-foreground md:block">{resultCount}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        {filters.map((filter) => (
          <DropdownMenu key={filter.label}>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-1.5",
                    filter.active &&
                      "border-forest-900/40 text-forest-900 dark:border-emerald-500/40 dark:text-emerald-300"
                  )}
                />
              }
            >
              <Filter className="size-3.5" />
              {filter.active ? filter.active.label : filter.label}
              <ChevronDown className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter by {filter.label.toLowerCase()}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => filter.onChange?.("")}
                  className={cn(!filter.value && "font-medium")}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {!filter.value && <Check className="size-4" />}
                  </span>
                  All {filter.label.toLowerCase()}s
                </DropdownMenuItem>
                {filter.options.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => filter.onChange?.(option.value)}
                    className={cn(option.value === filter.value && "font-medium")}
                  >
                    <span className="flex w-4 shrink-0 justify-center">
                      {option.value === filter.value && <Check className="size-4" />}
                    </span>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}

        {children}

        {onAddService && (
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
            onClick={onAddService}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{addServiceLabel}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

/** Presentational per-row actions menu. Config-driven via `items`. */
export function ServiceManagementActionsMenu({ service, items = [], align = "end", className, ...props }) {
  if (!items.length) return null

  return (
    <DropdownMenu data-slot="service-management-actions-menu" {...props}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="More actions"
            className="rounded-lg"
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className={cn("min-w-40", className)}>
        <DropdownMenuGroup>
          {items.map((item, index) => {
            if (item.type === "separator") {
              return <DropdownMenuSeparator key={`separator-${index}`} />
            }
            if (item.type === "label") {
              return <DropdownMenuLabel key={item.label}>{item.label}</DropdownMenuLabel>
            }

            const Icon = item.icon
            return (
              <DropdownMenuItem
                key={item.key ?? item.label ?? index}
                variant={item.destructive ? "destructive" : "default"}
                disabled={item.disabled}
                onClick={(event) => {
                  event.stopPropagation()
                  item.onSelect?.(service)
                }}
              >
                {Icon && <Icon className="size-4" />}
                {item.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Presentational delete confirmation dialog. Fully controlled. */
export function ServiceDeleteDialog({
  open = false,
  onOpenChange,
  service,
  onConfirm,
  deleting = false,
  title = "Delete Service",
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
  className,
  ...props
}) {
  const hasEngagements = Number(service?.activeEngagements) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent data-slot="service-delete-dialog" className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{service?.name}</span>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {hasEngagements && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 ring-1 ring-red-500/20 ring-inset dark:text-red-400">
            This service currently has {service.activeEngagements} active engagement
            {service.activeEngagements === 1 ? "" : "s"}. Deleting it will remove it from the
            catalog.
          </div>
        )}

        <DialogFooter className="flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange?.(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {deleting ? "Deleting…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
