import { cn } from "@/lib/utils"
import { roleBadgeStyles } from "./firm-user-variants"

const defaultRoleLabels = {
  admin: "Admin",
  staff: "Staff",
}

/**
 * Presentational pill that renders a user's role with a distinct color.
 * Only Admin and Staff roles are used by the User Management module.
 *
 * @param {string} role - Raw role value, e.g. "admin" or "staff".
 * @param {Object} roleLabels - Optional { value: label } overrides for display text.
 * @param {string} className - Extra classes merged onto the badge.
 */
export function FirmUserRoleBadge({ role, roleLabels, className, ...props }) {
  const labels = { ...defaultRoleLabels, ...roleLabels }
  const value = typeof role === "string" ? role.toLowerCase() : role
  const label = labels[value] ?? role ?? "Unknown"

  return (
    <span
      data-slot="firm-user-role-badge"
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        roleBadgeStyles[value] ?? "bg-muted text-muted-foreground ring-border",
        className
      )}
      {...props}
    >
      {label}
    </span>
  )
}
