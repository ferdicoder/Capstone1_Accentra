import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Presentational per-row actions menu for a firm user list.
 * Config-driven via `items` so it stays reusable and dumb — no API/auth/routing.
 *
 * @param {Object} user - The user record the menu acts on.
 * @param {Array} items - Menu entries. Each item:
 *   - { type: "separator" } or { type: "label", label }
 *   - { key?, label, icon?, destructive?, disabled?, onSelect(user) }
 * @param {"start"|"end"} align - Menu alignment. Default "end".
 * @param {string} className - Extra classes merged onto the menu content.
 */
export function FirmUserActionsMenu({ user, items = [], align = "end", className, ...props }) {
  if (!items.length) return null

  return (
    <DropdownMenu data-slot="firm-user-actions-menu" {...props}>
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
                item.onSelect?.(user)
              }}
            >
              {Icon && <Icon className="size-4" />}
              {item.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
