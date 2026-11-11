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

import { roleFilterOptions as defaultRoleFilterOptions } from "./firm-user-variants"

const activeFilterClass =
  "border-forest-900/40 text-forest-900 dark:border-emerald-500/40 dark:text-emerald-300"

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
 *   Status is derived from system activity, so there is no status filter.
 * @param {string} typeFilter - Active type filter value, or "" for all types.
 * @param {Function} onTypeFilterChange - (value: string) => void.
 * @param {Array} typeOptions - [{ value, label }]. Pass [] to hide the type filter.
 * @param {string} typeFilterLabel - Trigger label when no type filter is active. Default "Type".
 * @param {string} typeFilterHeading - Type dropdown heading. Default "Filter by type".
 * @param {string} allTypeOptionLabel - Label of the clear type option. Default "All types".
 * @param {string} filterLabel - Trigger label when no filter is active. Default "Role".
 * @param {string} filterHeading - Dropdown heading. Default "Filter by role".
 * @param {string} allOptionLabel - Label of the clear-filter option. Default "All roles".
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
  typeFilter = "",
  onTypeFilterChange,
  typeOptions = [],
  typeFilterLabel = "Type",
  typeFilterHeading = "Filter by type",
  allTypeOptionLabel = "All types",
  filterLabel = "Role",
  filterHeading = "Filter by role",
  allOptionLabel = "All roles",
  onAddUser,
  addUserLabel = "Add User",
  resultCount,
  children,
  className,
  ...props
}) {
  const activeRole = roleOptions.find((option) => option.value === roleFilter)
  const activeType = typeOptions.find((option) => option.value === typeFilter)

  return (
    <div
      data-slot="firm-users-toolbar"
      className={cn(
        "flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
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
          className="w-full pl-8"
        />
      </div>

      {/* Shown at every size now; it used to disappear below md. */}
      {resultCount && (
        <p className="text-sm text-muted-foreground">{resultCount}</p>
      )}

      {/* On phones the filters share the row equally; from sm up they sit on the right. */}
      <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto sm:flex-wrap sm:items-center">
        {typeOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full min-w-0 justify-between gap-1.5 sm:w-auto sm:justify-center",
                    activeType && activeFilterClass
                  )}
                />
              }
            >
              <Filter className="size-3.5 shrink-0" />
              <span className="min-w-0 truncate">
                {activeType ? activeType.label : typeFilterLabel}
              </span>
              <ChevronDown className="size-3.5 shrink-0 opacity-60" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{typeFilterHeading}</DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => onTypeFilterChange?.("")}
                  className={cn(!typeFilter && "font-medium")}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {!typeFilter && <Check className="size-4" />}
                  </span>
                  {allTypeOptionLabel}
                </DropdownMenuItem>

                {typeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onTypeFilterChange?.(option.value)}
                    className={cn(option.value === typeFilter && "font-medium")}
                  >
                    <span className="flex w-4 shrink-0 justify-center">
                      {option.value === typeFilter && <Check className="size-4" />}
                    </span>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {roleOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full min-w-0 justify-between gap-1.5 sm:w-auto sm:justify-center",
                    activeRole && activeFilterClass
                  )}
                />
              }
            >
              <Filter className="size-3.5 shrink-0" />
              <span className="min-w-0 truncate">
                {activeRole ? activeRole.label : filterLabel}
              </span>
              <ChevronDown className="size-3.5 shrink-0 opacity-60" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{filterHeading}</DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => onRoleFilterChange?.("")}
                  className={cn(!roleFilter && "font-medium")}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {!roleFilter && <Check className="size-4" />}
                  </span>
                  {allOptionLabel}
                </DropdownMenuItem>

                {roleOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onRoleFilterChange?.(option.value)}
                    className={cn(option.value === roleFilter && "font-medium")}
                  >
                    <span className="flex w-4 shrink-0 justify-center">
                      {option.value === roleFilter && <Check className="size-4" />}
                    </span>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {children}

        {onAddUser && (
          <Button
            size="sm"
            className="col-span-2 h-9 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90 sm:col-span-1"
            onClick={onAddUser}
          >
            <Plus className="size-4" />
            <span>{addUserLabel}</span>
          </Button>
        )}
      </div>
    </div>
  )
}