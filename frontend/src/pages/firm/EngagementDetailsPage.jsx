import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, XCircle } from "lucide-react"

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
import { ClientServiceInfoCard } from "@/components/firm/engagements/ClientServiceInfoCard"
import { ActivityUpdates } from "@/components/firm/engagements/ActivityUpdates"
import { ReviewSummaryCard } from "@/components/firm/engagements/ReviewSummaryCard"
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
      ...(engagement
        ? [{ label: engagement.engagementNumber, href: `${basePath}/engagements/${engagement.id}` }]
        : []),
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
      <div className="flex flex-col gap-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/engagements`)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>

          <span className="inline-flex items-center rounded-md bg-[#02353C]/10 px-2 py-0.5 text-xs font-medium text-[#02353C] ring-1 ring-inset ring-[#02353C]/20">
            {engagement.engagementNumber}
          </span>

          <EngagementStatusBadge status={engagement.status} />

          <span className="inline-flex items-center rounded-md bg-[#02353C]/10 px-2 py-0.5 text-xs font-medium text-[#02353C] ring-1 ring-inset ring-[#02353C]/20">
            {engagement.serviceName}
          </span>
        </div>

        <h1 className="text-[22px] font-bold tracking-tight text-foreground">
          {engagement.serviceName}
        </h1>

        {/* ── Tabs + Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
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
          <div className="flex items-center gap-2">
            {engagement.status === "active" && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className="h-10 gap-1.5 rounded-lg" />
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
            <Button variant="outline" size="sm" className="h-10 rounded-lg" onClick={() => setAddNoteOpen(true)}>
              Add Note
            </Button>
            <Button
              size="sm"
              className="h-10 rounded-lg bg-[#02353C] text-white hover:opacity-90"
              onClick={() => {
                setNotice("Billing created successfully")
                setTimeout(() => setNotice(""), 3000)
              }}
            >
              Create Billing
            </Button>
          </div>
        </div>

        {/* ── Notice ─────────────────────────────────────────────────────── */}
        {notice && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {notice}
          </div>
        )}

        {/* ── Overview Tab ───────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {/* Workflow Progress */}
            <WorkflowProgress workflowStage={engagement.workflowStage} />

            {/* Client + Service Info (left) + Activity Updates (right) */}
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <ClientServiceInfoCard engagement={engagement} />
              <ActivityUpdates engagement={engagement} />
            </div>

            {/* Review Summary */}
            <ReviewSummaryCard
              engagement={engagement}
              onViewDetails={() => setActiveTab("document-review")}
            />
          </>
        )}

        {/* ── Document Review Tab ────────────────────────────────────────── */}
        {activeTab === "document-review" && (
          <EngagementDocumentReviewTab engagement={engagement} />
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
    </>
  )
}
