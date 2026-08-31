import { Check, ChevronDown, Filter, Search } from "lucide-react"

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

export function EngagementFilters({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search engagements...",
  statusFilter = "",
  onStatusFilterChange,
  statusOptions = [],
  resultCount,
  actions,
  className,
  ...props
}) {
  const activeStatus = statusOptions.find((option) => option.value === statusFilter)
  const hasActiveFilter = Boolean(statusFilter && statusFilter !== "all")

  return (
    <div
      data-slot="engagement-filters"
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 gap-1.5",
                  hasActiveFilter &&
                    "border-forest-900/40 text-forest-900 dark:border-emerald-500/40 dark:text-emerald-300"
                )}
              />
            }
          >
            <Filter className="size-3.5" />
            {activeStatus ? activeStatus.label : "Status"}
            <ChevronDown className="size-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              {statusOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onStatusFilterChange?.(option.value)}
                  className={cn(option.value === statusFilter && "font-medium")}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {option.value === statusFilter && <Check className="size-4" />}
                  </span>
                  {option.label}
                  {typeof option.count === "number" && (
                    <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                      {option.count}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {actions}
      </div>
    </div>
  )
}
