import { FirmUserAvatar } from "./firm-user-avatar"
import { FirmUserRoleBadge } from "./firm-user-role-badge"
import { FirmUserStatusBadge } from "./firm-user-status-badge"

const getUserDisplayName = (user) => {
  if (!user) return ""
  if (user.name) return user.name
  return [user.first_name, user.last_name].filter(Boolean).join(" ").trim()
}

/**
 * Default columns for a firm user list: Name (avatar + email), Role and Status.
 * Spread it and append your own columns to customize, e.g.
 * `columns={[...defaultUserColumns, { key: "actions", ... }]}`.
 */
export const defaultUserColumns = [
  {
    key: "name",
    label: "Name",
    render: (user) => (
      <div className="flex items-center gap-3">
        <FirmUserAvatar
          name={getUserDisplayName(user)}
          avatarUrl={user?.avatar_url ?? user?.avatar}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {getUserDisplayName(user)}
          </p>
          {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        </div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    render: (user) => <FirmUserRoleBadge role={user?.role} />,
  },
  {
    key: "status",
    label: "Status",
    render: (user) => <FirmUserStatusBadge status={user?.status} />,
  },
]
