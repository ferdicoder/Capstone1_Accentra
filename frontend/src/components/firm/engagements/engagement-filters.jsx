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
  clientTypeFilter = "",
  onClientTypeFilterChange,
  clientTypeOptions = [],
  resultCount,
  actions,
  className,
  ...props
}) {
  const activeStatus = statusOptions.find((option) => option.value === statusFilter)
  const activeClientType = clientTypeOptions.find((option) => option.value === clientTypeFilter)
  const hasActiveFilter =
    Boolean(statusFilter && statusFilter !== "all") ||
    Boolean(clientTypeFilter && clientTypeFilter !== "all")

  return (
    <div
      data-slot="engagement-filters"
      className={cn("flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto whitespace-nowrap", className)}
      {...props}
    >
      <div className="relative w-64 shrink-0">
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
        <p className="hidden shrink-0 whitespace-nowrap text-sm text-muted-foreground md:block">{resultCount}</p>
      )}

      <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2">
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
            {activeStatus?.value !== "all"
              ? activeStatus?.label
              : activeClientType?.value !== "all"
                ? activeClientType?.label
                : "Filter"}
            <ChevronDown className="size-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {statusOptions.length > 0 && (
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
            )}
            {clientTypeOptions.length > 0 && (
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter by client type</DropdownMenuLabel>
                {clientTypeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onClientTypeFilterChange?.(option.value)}
                    className={cn(option.value === clientTypeFilter && "font-medium")}
                  >
                    <span className="flex w-4 shrink-0 justify-center">
                      {option.value === clientTypeFilter && <Check className="size-4" />}
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
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {actions}
      </div>
    </div>
  )
}
