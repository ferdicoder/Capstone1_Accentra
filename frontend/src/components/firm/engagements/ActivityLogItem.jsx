import { describeActivity } from "@/lib/activity-log"

export function ActivityLogItem({ entry }) {
  const { title, description } = describeActivity(entry)

  return (
    <div className="border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
      <p className="break-words text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 break-words text-sm text-muted-foreground">{description}</p>
      <p className="mt-1 text-xs text-muted-foreground/80">
        {new Date(entry.createdAt).toLocaleString("en-US", {
          month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit",
        })}
      </p>
    </div>
  )
}