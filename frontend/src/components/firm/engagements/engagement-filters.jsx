import { useState } from "react"
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatStartDateFilterLabel, startDateFilterOptions } from "./engagement-variants"

/**
 * Presentational filter bar for the engagements list: search input on the
 * left and one dropdown per filter on the right — the same pattern used by
 * the Billing toolbar. Fully controlled — all state lives in the parent page.
 */
export function EngagementFilters({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search engagements...",
  statusFilter = "",
  onStatusFilterChange,
  statusOptions = [],
  clientTypeFilter = "",
  onClientTypeFilterChange,
  clientTypeOptions = [],
  startDateFilter = "",
  onStartDateFilterChange,
  dateSort = "",
  onDateSortChange,
  dateSortOptions = [],
  resultCount,
  actions,
  className,
  ...props
}) {
  return (
    <div
      data-slot="engagement-filters"
      className={cn("flex min-w-0 flex-wrap items-center gap-3", className)}
      {...props}
    >
      <div className="relative w-full min-w-0 sm:w-64">
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
        <p className="text-sm text-muted-foreground">{resultCount}</p>
      )}

      <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
        {statusOptions.length > 0 && (
          <FilterDropdown
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={onStatusFilterChange}
            filterLabel="Filter by status"
          />
        )}
        {clientTypeOptions.length > 0 && (
          <FilterDropdown
            label="Client Type"
            options={clientTypeOptions}
            value={clientTypeFilter}
            onChange={onClientTypeFilterChange}
            filterLabel="Filter by client type"
          />
        )}
        <StartDateFilter value={startDateFilter} onChange={onStartDateFilterChange} />
        {dateSortOptions.length > 0 && (
          <FilterDropdown
            label="Due Date"
            icon={ArrowUpDown}
            options={dateSortOptions}
            value={dateSort}
            onChange={onDateSortChange}
            filterLabel="Sort by due date"
            clearable
          />
        )}

        {actions}
      </div>
    </div>
  )
}

function FilterDropdown({
  label,
  icon: Icon = Filter,
  options = [],
  value,
  onChange,
  filterLabel,
  clearable = false,
}) {
  const activeOption = options.find((option) => option.value === value && option.value !== "all")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 cursor-pointer gap-1.5",
              activeOption &&
                "border-forest-900/40 text-forest-900 dark:border-emerald-500/40 dark:text-emerald-300"
            )}
          />
        }
      >
        <Icon className="size-3.5" />
        {activeOption?.label ?? label}
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{filterLabel}</DropdownMenuLabel>
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
              {typeof option.count === "number" && (
                <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                  {option.count}
                </span>
              )}
            </DropdownMenuItem>
          ))}
          {clearable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!value}
                onClick={() => onChange?.("")}
                className="cursor-pointer text-muted-foreground"
              >
                <span className="flex w-4 shrink-0 justify-center">
                  {!value && <Check className="size-4" />}
                </span>
                Clear
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * Start-date filter: quick presets plus a month/year picker so users can jump
 * to any specific month or whole year. The picker lives in a popover (rather
 * than a menu) so its internal navigation does not close it on click.
 */
function StartDateFilter({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const selectedMonth = /^\d{4}-\d{2}$/.test(value) ? value : ""
  const selectedYear = /^\d{4}$/.test(value)
    ? Number(value)
    : selectedMonth
      ? Number(selectedMonth.slice(0, 4))
      : null
  const [pickerYear, setPickerYear] = useState(
    () => selectedYear ?? new Date().getFullYear()
  )

  const select = (nextValue) => {
    onChange?.(nextValue)
    setOpen(false)
  }

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setPickerYear(selectedYear ?? new Date().getFullYear())
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 cursor-pointer gap-1.5",
              value &&
                "border-forest-900/40 text-forest-900 dark:border-emerald-500/40 dark:text-emerald-300"
            )}
          />
        }
      >
        <CalendarDays className="size-3.5" />
        {formatStartDateFilterLabel(value)}
        <ChevronDown className="size-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <p className="text-xs font-medium text-muted-foreground">Filter by start date</p>

        <div className="flex flex-col gap-0.5">
          {startDateFilterOptions.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              aria-pressed={option.value === value}
              onClick={() => select(option.value)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                option.value === value && "font-medium"
              )}
            >
              <span className="flex w-4 shrink-0 justify-center">
                {option.value === value && <Check className="size-4" />}
              </span>
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t pt-2.5">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Previous year"
              onClick={() => setPickerYear((year) => year - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-semibold tabular-nums">{pickerYear}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Next year"
              onClick={() => setPickerYear((year) => year + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant={value === String(pickerYear) ? "default" : "outline"}
            size="sm"
            aria-pressed={value === String(pickerYear)}
            className="w-full justify-center"
            onClick={() => select(String(pickerYear))}
          >
            Whole year
          </Button>

          <div className="grid grid-cols-3 gap-1">
            {MONTH_LABELS.map((month, index) => {
              const monthValue = `${pickerYear}-${String(index + 1).padStart(2, "0")}`
              return (
                <Button
                  key={monthValue}
                  type="button"
                  variant={value === monthValue ? "default" : "ghost"}
                  size="sm"
                  aria-pressed={value === monthValue}
                  className="h-8 justify-center"
                  onClick={() => select(monthValue)}
                >
                  {month}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
