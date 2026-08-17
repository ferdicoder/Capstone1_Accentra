import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "./service-request-variants"

/** Presentational avatar for a client company, falling back to initials. */
export function ServiceRequestAvatar({ name, avatarUrl, size = "default", className, ...props }) {
  return (
    <Avatar size={size} className={cn("shrink-0", className)} {...props}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? "Client avatar"} /> : null}
      <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}
