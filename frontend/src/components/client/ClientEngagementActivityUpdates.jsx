import { useState } from "react"
import { ChevronRight, StickyNote } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatTimestamp } from "@/components/firm/engagements/engagement-variants"

function ActivityUpdateItem({ item, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const hasLongDescription = item.description && item.description.length > 80

  return (
    <>
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-[#02353C] bg-white text-[#02353C]">
            <StickyNote className="size-3" />
          </div>
          {!isLast && <div className="mt-2 w-0.5 flex-1 min-h-8 bg-[#02353C]/30" />}
        </div>
        <div className={cn("flex-1 min-w-0", !isLast && "pb-6")}>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatTimestamp(item.createdAt)}</p>
            </div>
            {hasLongDescription && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#02353C] transition-colors hover:bg-[#02353C]/10"
                title="View full description"
              >
                <ChevronRight className="size-5" />
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">— {item.author}</p>
        </div>
      </div>

      {/* Expanded dialog with blurry backdrop */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{item.title}</DialogTitle>
            <DialogDescription>
              {formatTimestamp(item.createdAt)} · {item.author}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {item.description}
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}

// View-only — no Add Update button, no dialog, no engagementStore dependency.
export function ActivityUpdates({ engagement, className }) {
  const updates = engagement?.activityUpdates ?? []

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Activity Updates</h3>
      </div>

      {updates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <StickyNote className="size-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">No activity updates yet</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {updates.map((item, index) => (
            <ActivityUpdateItem
              key={item.id}
              item={item}
              isLast={index === updates.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}