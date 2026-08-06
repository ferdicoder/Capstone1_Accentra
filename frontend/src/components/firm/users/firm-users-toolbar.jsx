import { ChevronDown, Filter, Plus, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  roleFilterOptions as defaultRoleFilterOptions,
  statusFilterOptions as defaultStatusFilterOptions,
} from "./firm-user-variants"

/**
 * Presentational toolbar for a firm user list. Fully controlled — all state
 * lives in the parent page and is passed back in through props/callbacks.
 *
 * @param {string} searchValue - Current search query.
 * @param {Function} onSearchChange - (value: string) => void.
 * @param {string} searchPlaceholder - Search input placeholder. Default "Search users...".
 * @param {string} roleFilter - Active role filter value, or "" for "All roles".
 * @param {Function} onRoleFilterChange - (value: string) => void.
 * @param {Array} roleOptions - [{ value, label }]. Pass [] to hide the role filter.
 * @param {string} statusFilter - Active status filter value, or "" for "All statuses".
 * @param {Function} onStatusFilterChange - (value: string) => void.
 * @param {Array} statusOptions - [{ value, label }]. Pass [] to hide the status filter.
 * @param {Function} onAddUser - Optional (event) => void fired by the "Add User" button.
 * @param {string} addUserLabel - Label for the add button. Default "Add User".
 * @param {string} resultCount - Optional helper text, e.g. "12 users".
 * @param {ReactNode} children - Extra actions rendered before the add button.
 * @param {string} className - Extra classes merged onto the toolbar.
 */
export function FirmUsersToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search users...",
  roleFilter = "",
  onRoleFilterChange,
  roleOptions = defaultRoleFilterOptions,
  statusFilter = "",
  onStatusFilterChange,
  statusOptions = defaultStatusFilterOptions,
  onAddUser,
  addUserLabel = "Add User",
  resultCount,
  children,
  className,
  ...props
}) {
  const activeRole = roleOptions.find((option) => option.value === roleFilter)
  const activeStatus = statusOptions.find((option) => option.value === statusFilter)

  return (
    <div
      data-slot="firm-users-toolbar"
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
        {roleOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-1.5",
                    activeRole && "border-forest-900/40 text-forest-900 dark:border-emerald-500/40 dark:text-emerald-300"
                  )}
                />
              }
            >
              <Filter className="size-3.5" />
              {activeRole ? activeRole.label : "Role"}
              <ChevronDown className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuLabel>Filter by role</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onRoleFilterChange?.("")}>
                All roles
              </DropdownMenuItem>
              {roleOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onRoleFilterChange?.(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {statusOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-1.5",
                    activeStatus &&
                      "border-forest-900/40 text-forest-900 dark:border-emerald-500/40 dark:text-emerald-300"
                  )}
                />
              }
            >
              <Filter className="size-3.5" />
              {activeStatus ? activeStatus.label : "Status"}
              <ChevronDown className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onStatusFilterChange?.("")}>
                All statuses
              </DropdownMenuItem>
              {statusOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onStatusFilterChange?.(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {children}

        {onAddUser && (
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
            onClick={onAddUser}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{addUserLabel}</span>
          </Button>
        )}
      </div>
    </div>
  )
}
