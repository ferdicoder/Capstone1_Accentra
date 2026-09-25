import { useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import { XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { ClientServiceDetailsDialog } from "@/components/firm/engagements/ClientServiceDetailsDialog"
import { TaskList } from "@/components/firm/engagements/TaskList"
import { UploadDeliverables } from "@/components/firm/engagements/UploadDeliverables"
import { CancelEngagementDialog } from "@/components/firm/engagements/cancel-engagement-dialog"
import { WorkflowProgress } from "@/components/firm/engagements/WorkflowProgress"
import { ActivityLogItem } from "@/components/firm/engagements/ActivityLogItem"
import { EngagementDocumentReviewTab } from "@/components/firm/engagements/engagement-document-review-tab"
import { formatDate } from "@/components/firm/engagements/engagement-variants"
import { workflowStages, isEngagementActive } from "@/lib/workflow-stages"
import {
  useFetchEngagement,
  useUpdateEngagementStatus,
  useSetTaskCompleted,
  useReviewEngagementTask,
  useCreateEngagementTask,
  useUpdateEngagementTask,
  useUpdateEngagementTaskDeadline,
  useFetchEngagementActivity,
  useFetchEngagementDocuments,
} from "@/hooks/useEngagements"

export default function EngagementDetailsPage() {
  const { id } = useParams()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"
  const sectionLabel = basePath === "/firm" ? "Firm Staff" : "Firm Admin"

  const { data: engagement, isLoading, error } = useFetchEngagement(id)
  const { data: activity = [], isLoading: activityLoading } = useFetchEngagementActivity(id)
  const { data: documents = [] } = useFetchEngagementDocuments(id)
  const updateStatus = useUpdateEngagementStatus()
  const setTaskCompleted = useSetTaskCompleted(id)
  const reviewTask = useReviewEngagementTask(id)

  const createTask = useCreateEngagementTask(id)
  const updateTask = useUpdateEngagementTask(id)
  const updateDeadline = useUpdateEngagementTaskDeadline(id)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  usePageMeta({
    title: engagement?.engagementNumber ?? "Engagement Details",
    breadcrumbs: [
      { label: sectionLabel, href: `${basePath}/dashboard` },
      { label: "Engagements", href: `${basePath}/engagements` },
    ],
  })

  if (isLoading) return <PageSkeleton type="service-requests" />
  if (error || !engagement) return null

  const showNotice = (message) => {
    setNotice(message)
    setTimeout(() => setNotice(""), 3000)
  }

  const handleStageChange = (stageKey) => {
    updateStatus.mutate(
      { id: engagement.id, status: stageKey },
      {
        onSuccess: () => {
          const label = workflowStages.find((s) => s.key === stageKey)?.label ?? stageKey
          showNotice(`Status updated to "${label}"`)
        },
      }
    )
  }

  const handleMarkCompleted = () => {
    updateStatus.mutate(
      { id: engagement.id, status: "completed" },
      { onSuccess: () => showNotice("Engagement marked completed") }
    )
  }

  const handleCancelEngagement = () => {
    updateStatus.mutate(
      { id: engagement.id, status: "cancelled" },
      {
        onSuccess: () => {
          setCancelDialogOpen(false)
          showNotice("Engagement cancelled")
        },
      }
    )
  }

  const handleTaskComplete = (taskId, completed) => {
    setTaskCompleted.mutate({ taskId, completed })
  }

  const handleTaskReview = (taskId, status, remark) => {
    reviewTask.mutate(
      { taskId, status, remark },
      { onSuccess: () => showNotice(status === "approved" ? "Task approved" : "Revision requested") }
    )
  }

  const handleTaskCreate = (fields) =>
  createTask.mutateAsync({ engagementId: engagement.id, ...fields })
    .then(() => showNotice(`Task "${fields.title}" added`))

  const handleTaskUpdate = (taskId, fields) =>
    updateTask.mutateAsync({ taskId, ...fields })
      .then(() => showNotice("Task updated"))

  const handleDeadlineChange = (taskId, dueDate) => {
    updateDeadline.mutate({ taskId, dueDate })
  }

  const reviewDocuments = documents.map((document) => {
    const task = engagement.tasks?.find((item) => item.id === document.engagementTaskId)
    return {
      ...document,
      taskId: task?.id,
      taskName: task?.name,
      status: task?.status ?? "missing",
      remark: task?.remark,
    }
  })

  const reviewHistory = activity.map((entry) => ({
    id: entry.id,
    userName: entry.actorName,
    action: entry.type === "task_approved" ? "approved" : entry.type === "task_revision_requested" ? "revision_requested" : "submitted",
    comment: entry.message,
    timestamp: entry.createdAt,
  }))

  const handleDocumentReview = (document, status, remark) => {
    if (!document.taskId) return
    reviewTask.mutate(
      { taskId: document.taskId, status, remark },
      { onSuccess: () => showNotice(status === "approved" ? "Document approved" : "Revision requested") }
    )
  }


  return (
    <>
      <div className="flex flex-col gap-4">
        {/* ── Header ─────────────────────────────────────────────────────── */}
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
            <Button
              variant="outline"
              size="default"
              className="h-9 rounded-lg px-3 text-sm"
              onClick={() => setDetailsOpen(true)}
            >
              View Details
            </Button>

            {isEngagementActive(engagement.status) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="default" className="h-9 gap-1.5 rounded-lg px-3 text-sm" />}
                >
                  Change Status
                  <span className="size-3.5 opacity-60">▾</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  {workflowStages.map((stage) => (
                    <DropdownMenuItem
                      key={stage.key}
                      onClick={() => handleStageChange(stage.key)}
                      className={cn(
                        engagement.status === stage.key && "bg-[#02353C]/10 text-[#02353C] font-medium"
                      )}
                    >
                      {stage.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
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

        {/* ── Workflow Progress ─────────────────────────────────────────── */}
        <WorkflowProgress
          workflowStage={engagement.status}
        />

        <div className="flex gap-4 overflow-x-auto border-b sm:gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors",
              activeTab === "overview"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors",
              activeTab === "documents"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Documents
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {documents.length}
            </span>
          </button>
        </div>

        {/* ── Notice ────────────────────────────────────────────────────── */}
        {notice && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {notice}
          </div>
        )}

        {/* ── Main content ──────────────────────────────────────────────── */}
        {activeTab === "overview" && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-5">
            <UploadDeliverables engagement={engagement} />
            <TaskList
              engagement={engagement}
              documents={documents}
              onTaskComplete={handleTaskComplete}
              onTaskReview={handleTaskReview}
              onTaskCreate={handleTaskCreate}
              onTaskUpdate={handleTaskUpdate}
              onDeadlineChange={handleDeadlineChange}
            />
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Activity Log</h3>

              {activityLoading && (
                <p className="text-sm text-muted-foreground">Loading activity…</p>
              )}

              {!activityLoading && activity.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}

              {!activityLoading && activity.length > 0 && (
                <div className="space-y-4">
                  {activity.map((entry) => (
                    <ActivityLogItem key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>}

        {activeTab === "documents" && (
          <EngagementDocumentReviewTab
            engagement={engagement}
            documents={reviewDocuments}
            history={reviewHistory}
            onReview={handleDocumentReview}
          />
        )}
      </div>

      <ClientServiceDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} engagement={engagement} />
      <CancelEngagementDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen} onConfirm={handleCancelEngagement} />
    </>
  )
}