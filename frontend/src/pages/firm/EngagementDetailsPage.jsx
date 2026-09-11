import { useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { ClientServiceDetailsDialog } from "@/components/firm/engagements/ClientServiceDetailsDialog"
import { TaskList } from "@/components/firm/engagements/TaskList"
import { UploadDeliverables } from "@/components/firm/engagements/UploadDeliverables"
import { CancelEngagementDialog } from "@/components/firm/engagements/cancel-engagement-dialog"
import { formatDate } from "@/components/firm/engagements/engagement-variants"
import { useFetchEngagement, useUpdateEngagementStatus, useToggleEngagementTask } from "@/hooks/useEngagements"

export default function EngagementDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"
  const sectionLabel = basePath === "/firm" ? "Firm Staff" : "Firm Admin"

  const { data: engagement, isLoading, error } = useFetchEngagement(id)
  const updateStatus = useUpdateEngagementStatus()
  const toggleTask = useToggleEngagementTask(id)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [notice, setNotice] = useState("")

  usePageMeta({
    title: engagement?.engagementNumber ?? "Engagement Details",
    breadcrumbs: [
      { label: sectionLabel, href: `${basePath}/dashboard` },
      { label: "Engagements", href: `${basePath}/engagements` },
    ],
  })

  if (isLoading) return <PageSkeleton type="service-requests" />
  if (error || !engagement) return null

  const handleCancelEngagement = () => {
    updateStatus.mutate(
      { id: engagement.id, status: "cancelled" },
      {
        onSuccess: () => {
          setCancelDialogOpen(false)
          setNotice("Engagement cancelled")
          setTimeout(() => setNotice(""), 3000)
        },
      }
    )
  }

  const handleMarkCompleted = () => {
    updateStatus.mutate(
      { id: engagement.id, status: "completed" },
      {
        onSuccess: () => {
          setNotice("Engagement marked completed")
          setTimeout(() => setNotice(""), 3000)
        },
      }
    )
  }

  const handleToggleTask = (task) => {
    toggleTask.mutate({ taskId: task.id, completed: !task.completed })
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold sm:text-xl text-foreground">
                {engagement.serviceName}
              </h1>
              <EngagementStatusBadge status={engagement.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Due <span className="font-semibold text-red-600">{formatDate(engagement.targetEndDate)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="default" className="h-9 rounded-lg px-3 text-sm" onClick={() => setDetailsOpen(true)}>
              View Details
            </Button>
            {engagement.status === "active" && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="default" className="h-9 gap-1.5 rounded-lg px-3 text-sm" />}
                >
                  Change Status
                  <span className="size-3.5 opacity-60">▾</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  <DropdownMenuItem onClick={handleMarkCompleted}>Mark Completed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCancelDialogOpen(true)} className="text-red-600">
                    <XCircle className="size-4" />
                    Cancel Engagement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {notice && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {notice}
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-5">
          <UploadDeliverables engagement={engagement} />
          <TaskList engagement={engagement} onTaskToggle={handleToggleTask} />
        </div>
      </div>

      <ClientServiceDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} engagement={engagement} />
      <CancelEngagementDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen} onConfirm={handleCancelEngagement} />
    </>
  )
}