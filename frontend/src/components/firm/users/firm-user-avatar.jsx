import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUserInitials } from "./firm-user-variants"

/**
 * Presentational avatar for a user, falling back to initials when no image
 * is available. Thin wrapper over the shared `ui/avatar` primitives.
 *
 * @param {string} name - Full name used for the initials fallback + alt text.
 * @param {string} avatarUrl - Optional avatar image URL.
 * @param {"default"|"sm"|"lg"} size - Avatar size variant. Default "default".
 * @param {string} className - Extra classes merged onto the avatar.
 */
export function FirmUserAvatar({ name, avatarUrl, size = "default", className, ...props }) {
  return (
    <Avatar size={size} className={cn("shrink-0", className)} {...props}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? "User avatar"} /> : null}
      <AvatarFallback className="text-xs">{getUserInitials(name)}</AvatarFallback>
    </Avatar>
  )
}
