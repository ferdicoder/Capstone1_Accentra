import { Check, ChevronDown, Filter, Plus, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { billingStatusFilterOptions, invoiceTypeFilterOptions } from "./billing-variants"

/**
 * Presentational toolbar for billing lists. Fully controlled — all state
 * lives in the parent page.
 *
 * @param {string} searchValue - Current search query.
 * @param {Function} onSearchChange - (value: string) => void.
 * @param {string} statusFilter - Active status filter value, "" for all.
 * @param {Function} onStatusFilterChange - (value: string) => void.
 * @param {string} typeFilter - Active invoice type filter value, "" for all.
 * @param {Function} onTypeFilterChange - (value: string) => void.
 * @param {Function} onCreateBilling - Optional (event) => void for the create button.
 * @param {string} resultCount - Optional helper text.
 * @param {string} createLabel - Create button label. Default "Create Billing".
 */
export function BillingToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search billing...",
  statusFilter = "",
  onStatusFilterChange,
  typeFilter = "",
  onTypeFilterChange,
  onCreateBilling,
  resultCount,
  createLabel = "Create Billing",
  className,
  ...props
}) {
  const activeStatus = billingStatusFilterOptions.find((o) => o.value === statusFilter)
  const activeType = invoiceTypeFilterOptions.find((o) => o.value === typeFilter)

  return (
    <div
      data-slot="billing-toolbar"
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
        <FilterDropdown
          label="Status"
          options={billingStatusFilterOptions}
          value={statusFilter}
          onChange={onStatusFilterChange}
          active={activeStatus}
          allLabel="All statuses"
          filterLabel="Filter by status"
        />
        <FilterDropdown
          label="Type"
          options={invoiceTypeFilterOptions}
          value={typeFilter}
          onChange={onTypeFilterChange}
          active={activeType}
          allLabel="All types"
          filterLabel="Filter by invoice type"
        />

        {onCreateBilling && (
          <Button
            size="sm"
            className="h-9 cursor-pointer gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
            onClick={onCreateBilling}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{createLabel}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

function FilterDropdown({ label, options, value, onChange, active, allLabel, filterLabel }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "cursor-pointer gap-1.5",
              active && "border-forest-900/40 text-forest-900 dark:border-emerald-500/40 dark:text-emerald-300"
            )}
          />
        }
      >
        <Filter className="size-3.5" />
        {active ? active.label : label}
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{filterLabel}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onChange?.("")}
            className={cn("cursor-pointer", !value && "font-medium")}
          >
            <span className="flex w-4 shrink-0 justify-center">
              {!value && <Check className="size-4" />}
            </span>
            {allLabel}
          </DropdownMenuItem>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange?.(option.value)}
              className={cn("cursor-pointer", option.value === value && "font-medium")}
            >
              <span className="flex w-4 shrink-0 justify-center">
                {option.value === value && <Check className="size-4" />}
              </span>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
