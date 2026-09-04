import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { engagementStore } from "@/components/firm/engagements/engagement-store"
import { EngagementDocumentReviewTab } from "@/components/firm/engagements/engagement-document-review-tab"
import { AddNoteDialog } from "@/components/firm/engagements/add-note-dialog"
import { WorkflowProgress } from "@/components/firm/engagements/WorkflowProgress"
import { ClientServiceDetailsDialog } from "@/components/firm/engagements/ClientServiceDetailsDialog"
import { ActivityUpdates } from "@/components/firm/engagements/ActivityUpdates"
import { TaskList } from "@/components/firm/engagements/TaskList"
import {
  workflowStageOptions,
} from "@/components/firm/engagements/engagement-variants"

export default function EngagementDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"
  const sectionLabel = basePath === "/firm" ? "Firm Staff" : "Firm Admin"
  const engagements = engagementStore((state) => state.engagements)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [addNoteOpen, setAddNoteOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [preselectedDocName, setPreselectedDocName] = useState(null)
  const [notice, setNotice] = useState("")
  const addNote = engagementStore((state) => state.addNote)
  const setEngagementStatus = engagementStore((state) => state.setEngagementStatus)
  const setWorkflowStage = engagementStore((state) => state.setWorkflowStage)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const engagement = engagements.find((e) => e.id === id) ?? null

  useEffect(() => {
    if (!loading && !engagement) {
      navigate(`${basePath}/engagements`)
    }
  }, [loading, engagement, navigate, basePath])

  usePageMeta({
    title: engagement?.engagementNumber ?? "Engagement Details",
    breadcrumbs: [
      { label: sectionLabel, href: `${basePath}/dashboard` },
      { label: "Engagements", href: `${basePath}/engagements` },
    ],
  })

  if (loading) {
    return <PageSkeleton type="service-requests" />
  }

  if (!engagement) return null

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "document-review", label: "Document Review" },
  ]

  const handleStageChange = (stage) => {
    setWorkflowStage(engagement.id, stage)
    const stageLabel = workflowStageOptions.find((s) => s.value === stage)?.label ?? stage
    setNotice(`Workflow stage updated to "${stageLabel}"`)
    setTimeout(() => setNotice(""), 3000)
  }

  const handleCompleted = () => {
    setWorkflowStage(engagement.id, "completed")
    setEngagementStatus(engagement.id, "completed")
    setNotice("Engagement marked as completed")
    setTimeout(() => setNotice(""), 3000)
  }

  const handleCancelEngagement = () => {
    setWorkflowStage(engagement.id, "cancelled")
    setEngagementStatus(engagement.id, "cancelled")
    setNotice("Engagement cancelled")
    setTimeout(() => setNotice(""), 3000)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* ── Main Header + Actions ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold sm:text-xl text-foreground">
              {engagement.serviceName}
            </h1>
            <EngagementStatusBadge status={engagement.status} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => setDetailsOpen(true)}
            >
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => setAddNoteOpen(true)}
            >
              Add Note
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-[#02353C] text-white text-xs hover:opacity-90"
              onClick={() => {
                setNotice("Billing created successfully")
                setTimeout(() => setNotice(""), 3000)
              }}
            >
              Create Billing
            </Button>
            {engagement.status === "active" && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs" />
                  }
                >
                  Actions
                  <span className="size-3.5 opacity-60">▾</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  <DropdownMenuItem onClick={handleCompleted}>
                    ✓ Completed
                  </DropdownMenuItem>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="min-w-52">
                      {workflowStageOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => handleStageChange(option.value)}
                        >
                          {engagement.workflowStage === option.value && (
                            <span className="mr-1.5 text-[#02353C]">✓</span>
                          )}
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCancelEngagement} className="text-red-600">
                    <XCircle className="size-4" />
                    Cancel Engagement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* ── Workflow Progress (always visible) ──────────────────────────── */}
        <WorkflowProgress workflowStage={engagement.workflowStage} />

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex gap-5 border-b border-border pt-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (tab.key === "overview") setPreselectedDocName(null)
                setActiveTab(tab.key)
              }}
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "text-[#02353C]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#02353C]" />
              )}
            </button>
          ))}
        </div>

        {/* ── Notice ─────────────────────────────────────────────────────── */}
        {notice && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {notice}
          </div>
        )}

        {/* ── Overview Tab ───────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <TaskList engagement={engagement} onTaskClick={(task) => {
              setPreselectedDocName(task.name)
              setActiveTab("document-review")
            }} />
            <ActivityUpdates engagement={engagement} />
          </div>
        )}

        {/* ── Document Review Tab ────────────────────────────────────────── */}
        {activeTab === "document-review" && (
          <EngagementDocumentReviewTab engagement={engagement} preselectedDocName={preselectedDocName} />
        )}
      </div>

      {/* ── Add Note Dialog ──────────────────────────────────────────────── */}
      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        engagement={engagement}
        onSubmit={(note) => {
          addNote(engagement.id, note)
          setAddNoteOpen(false)
        }}
      />

      {/* ── Client + Service Details Dialog ──────────────────────────────── */}
      <ClientServiceDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        engagement={engagement}
      />
    </>
  )
}
