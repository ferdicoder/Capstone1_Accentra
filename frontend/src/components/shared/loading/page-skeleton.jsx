import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { CardSkeleton } from "./card-skeleton"
import { FormSkeleton } from "./form-skeleton"
import { TableSkeleton } from "./table-skeleton"

/**
 * Full-page loading placeholder. Composes the granular shared skeletons into
 * ready-made layouts that mirror real pages, so pages never duplicate
 * skeleton markup. Type presets: "service-requests", "users", "services",
 * "dashboard", "profile", "page".
 */
function PageHeaderSkeleton({ subtitle = true }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-48 max-w-full" />
      {subtitle && <Skeleton className="h-3.5 w-80 max-w-full" />}
    </div>
  )
}

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2.5 h-7 w-16" />
        </div>
      ))}
    </div>
  )
}

function ToolbarSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <div className="flex items-center gap-2 sm:ml-auto">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  )
}

export function PageSkeleton({ type = "page", subtitle = true, className, ...props }) {
  let body

  switch (type) {
    case "dashboard":
      body = (
        <>
          <PageHeaderSkeleton subtitle={subtitle} />
          <StatsCardsSkeleton />
          <TableSkeleton rows={5} />
        </>
      )
      break
    case "services":
      body = (
        <>
          <PageHeaderSkeleton subtitle={subtitle} />
          <StatsCardsSkeleton />
          <ToolbarSkeleton />
          <TableSkeleton rows={5} />
        </>
      )
      break
    case "users":
      body = (
        <>
          <PageHeaderSkeleton subtitle={subtitle} />
          <ToolbarSkeleton />
          <TableSkeleton rows={5} />
        </>
      )
      break
    case "service-requests":
      body = (
        <>
          <PageHeaderSkeleton subtitle={subtitle} />
          <ToolbarSkeleton />
          <TableSkeleton rows={5} />
        </>
      )
      break
    case "profile":
      body = (
        <>
          <PageHeaderSkeleton subtitle={subtitle} />
          <div className="grid gap-5 lg:grid-cols-2">
            <FormSkeleton fields={3} />
            <FormSkeleton fields={3} />
          </div>
        </>
      )
      break
    default:
      body = (
        <>
          <PageHeaderSkeleton subtitle={subtitle} />
          <div className="grid gap-5 lg:grid-cols-2">
            <CardSkeleton rows={4} />
            <CardSkeleton rows={4} />
          </div>
        </>
      )
  }

  return (
    <div data-slot="page-skeleton" className={cn("flex flex-col gap-5", className)} {...props}>
      {body}
    </div>
  )
}
