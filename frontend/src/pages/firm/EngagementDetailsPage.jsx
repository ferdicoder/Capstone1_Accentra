import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Check, CheckCircle2, Circle, Pause, StickyNote, XCircle } from "lucide-react"

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
import { DashboardLayout } from "@/layout/DashboardLayout"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { engagementStore } from "@/components/firm/engagements/engagement-store"
import { EngagementDocumentsTab } from "@/components/firm/engagements/engagement-documents-tab"
import { EngagementDocumentReviewTab } from "@/components/firm/engagements/engagement-document-review-tab"
import { AddNoteDialog } from "@/components/firm/engagements/add-note-dialog"
import { getReviewDocuments } from "@/components/firm/engagements/engagement-variants"
import {
  formatRevenue,
  formatDate,
  getClientFullName,
  firmStaffMap,
  workflowStages,
  getWorkflowProgress,
  getWorkflowTimeline,
  getServiceCategoryLabel,

} from "@/components/firm/engagements/engagement-variants"

const noteTypeLabels = {
  internal: "Internal Note",
  client_communication: "Client Communication",
  follow_up: "Follow-up Reminder",
  compliance: "Compliance Note",
  billing: "Billing Note",
  document_review: "Document Review Note",
}

const noteTypeLabel = (type) => noteTypeLabels[type] ?? "Note"

function InfoField({ label, children, className }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  )
}

function WorkflowStageIndicator({ stage, index, total, progressIndex }) {
  const isCompleted = index < progressIndex
  const isCurrent = index === progressIndex
  const isFuture = index > progressIndex

  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
          isCompleted && "border-[#02353C] bg-[#02353C] text-white",
          isCurrent && "border-[#02353C] bg-white text-[#02353C]",
          isFuture && "border-gray-300 bg-gray-100 text-gray-400"
        )}
      >
        {isCompleted ? (
          <Check className="size-4" />
        ) : (
          <Circle className="size-3" />
        )}
      </div>
      <span
        className={cn(
          "text-xs font-medium text-center leading-tight",
          isCompleted && "text-[#02353C]",
          isCurrent && "text-[#02353C] font-semibold",
          isFuture && "text-muted-foreground"
        )}
      >
        {stage.label}
      </span>
    </div>
  )
}

function TimelineItem({ item, isLast }) {
  const isCompleted = item.status === "completed"
  const isCurrent = item.status === "current"

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
            isCompleted && "border-[#02353C] bg-[#02353C] text-white",
            isCurrent && "border-[#02353C] bg-white text-[#02353C]",
            !isCompleted && !isCurrent && "border-gray-300 bg-gray-100 text-gray-400"
          )}
        >
          {isCompleted ? (
            <Check className="size-3" />
          ) : (
            <Circle className="size-2" />
          )}
        </div>
        {!isLast && (
          <div className={cn(
            "w-0.5 flex-1 min-h-8",
            isCompleted ? "bg-[#02353C]/30" : "bg-gray-200"
          )} />
        )}
      </div>
      <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
        <p className={cn(
          "text-sm font-medium",
          isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
        )}>
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground">{item.date}</p>
        <p className={cn(
          "text-xs mt-0.5",
          isCompleted || isCurrent ? "text-muted-foreground" : "text-muted-foreground/60"
        )}>
          {item.description}
        </p>
      </div>
    </div>
  )
}

export default function EngagementDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const engagements = engagementStore((state) => state.engagements)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [addNoteOpen, setAddNoteOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const addNote = engagementStore((state) => state.addNote)
  const setEngagementStatus = engagementStore((state) => state.setEngagementStatus)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const engagement = engagements.find((e) => e.id === id) ?? null

  useEffect(() => {
    if (!loading && !engagement) {
      navigate("/firm-admin/engagements")
    }
  }, [loading, engagement, navigate])

  if (loading) {
    return (
      <DashboardLayout
        role="firm-admin"
        title="Engagement Details"
        breadcrumbs={[
          { label: "Firm Admin", href: "/admin/dashboard" },
          { label: "Engagements", href: "/firm-admin/engagements" },
          { label: "Details", href: "#" },
        ]}
      >
        <PageSkeleton type="service-requests" />
      </DashboardLayout>
    )
  }

  if (!engagement) return null

  const staffLabel = firmStaffMap[engagement.assignedStaff] ?? "—"
  const progressIndex = getWorkflowProgress(engagement)
  const progressPercent = Math.round((progressIndex / (workflowStages.length - 1)) * 100)
  const timeline = getWorkflowTimeline(engagement)
  const serviceCategory = getServiceCategoryLabel(engagement.serviceName)

  const documents = engagement.documents ?? []
  const reviewDocuments = getReviewDocuments(engagement)

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "documents", label: `Documents (${documents.length})` },
    { key: "document-review", label: `Document Review (${reviewDocuments.length})` },
  ]

  return (
    <DashboardLayout
      role="firm-admin"
      title="Engagement Details"
      breadcrumbs={[
        { label: "Firm Admin", href: "/admin/dashboard" },
        { label: "Engagements", href: "/firm-admin/engagements" },
        { label: engagement.engagementNumber, href: "#" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/firm-admin/engagements")}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>

          <span className="inline-flex items-center rounded-md bg-[#02353C]/10 px-2 py-0.5 text-xs font-medium text-[#02353C] ring-1 ring-inset ring-[#02353C]/20">
            {engagement.engagementNumber}
          </span>

          <EngagementStatusBadge status={engagement.status} />

          <span className="inline-flex items-center rounded-md bg-[#02353C]/10 px-2 py-0.5 text-xs font-medium text-[#02353C] ring-1 ring-inset ring-[#02353C]/20">
            {serviceCategory}
          </span>
        </div>

        <h1 className="text-[22px] font-bold tracking-tight text-foreground">
          {engagement.serviceName}
        </h1>

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
                  <DropdownMenuItem onClick={() => {
                    setEngagementStatus(engagement.id, "completed")
                    setNotice("Engagement marked as completed")
                    setTimeout(() => setNotice(""), 3000)
                  }}>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Mark Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setEngagementStatus(engagement.id, "on_hold")
                    setNotice("Engagement put on hold")
                    setTimeout(() => setNotice(""), 3000)
                  }}>
                    <Pause className="size-4 text-amber-600" />
                    Put On Hold
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setEngagementStatus(engagement.id, "cancelled")
                    setNotice("Engagement cancelled")
                    setTimeout(() => setNotice(""), 3000)
                  }} className="text-red-600">
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

        {notice && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {notice}
          </div>
        )}

        {activeTab === "overview" && (
          <>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Workflow Progress</h3>
                <span className="text-sm font-semibold text-[#02353C]">{progressPercent}% complete</span>
              </div>

              <div className="relative px-2">
                <div className="absolute top-4 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-0.5 bg-gray-200">
                  <div
                    className="h-full bg-[#02353C] transition-all duration-500"
                    style={{ width: `${(progressIndex / (workflowStages.length - 1)) * 100}%` }}
                  />
                </div>

                <div className="relative flex items-start justify-between">
                  {workflowStages.map((stage, index) => (
                    <WorkflowStageIndicator
                      key={stage.key}
                      stage={stage}
                      index={index}
                      total={workflowStages.length}
                      progressIndex={progressIndex}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-5 text-sm font-semibold text-foreground">Client Information</h3>
                <div className="flex flex-1 flex-col gap-4">
                  <InfoField label="Client Name">{getClientFullName(engagement.client)}</InfoField>
                  <InfoField label="Contact Person">{getClientFullName(engagement.client)}</InfoField>
                  <InfoField label="Email">{engagement.client?.email ?? "—"}</InfoField>
                  <InfoField label="TIN">{engagement.business?.tinNo ?? "—"}</InfoField>
                </div>
              </div>

              <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-5 text-sm font-semibold text-foreground">Service Information</h3>
                <div className="flex flex-1 flex-col gap-4">
                  <InfoField label="Service Type">{engagement.serviceName}</InfoField>
                  <InfoField label="Compliance Category">{serviceCategory}</InfoField>
                  <InfoField label="Period Covered">Taxable Year 2024</InfoField>
                  <InfoField label="Assigned Staff">{staffLabel}</InfoField>
                  <InfoField label="Filing Deadline">
                    <span className="text-red-600">{formatDate(engagement.targetEndDate)}</span>
                  </InfoField>
                </div>
              </div>

              <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-5 text-sm font-semibold text-foreground">Workflow Timeline</h3>
                <div className="flex flex-1 flex-col">
                  {timeline.map((item, index) => (
                    <TimelineItem
                      key={index}
                      item={item}
                      isLast={index === (timeline.length - 1) + (engagement.notes?.length ?? 0)}
                    />
                  ))}
                  {(engagement.notes ?? []).map((note, index) => {
                    const noteDate = note.createdAt ? new Date(note.createdAt) : null
                    const dateStr = noteDate
                      ? noteDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                      : "—"
                    const timeStr = noteDate
                      ? noteDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                      : ""
                    const typeLabel = noteTypeLabel(note.type)
                    return (
                      <div key={note.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-[#02353C] bg-white text-[#02353C]">
                            <StickyNote className="size-3" />
                          </div>
                          {index < (engagement.notes?.length ?? 0) - 1 && (
                            <div className="mt-2 w-0.5 flex-1 min-h-8 bg-[#02353C]/30" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="text-sm font-medium text-foreground">{note.author}</p>
                          <p className="text-xs text-muted-foreground">{typeLabel} Added</p>
                          <p className="mt-1 text-xs text-muted-foreground">{note.content}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground/70">{dateStr} · {timeStr}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "documents" && (
          <EngagementDocumentsTab engagement={engagement} />
        )}

        {activeTab === "document-review" && (
          <EngagementDocumentReviewTab engagement={engagement} />
        )}
      </div>

      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        engagement={engagement}
        onSubmit={(note) => {
          addNote(engagement.id, note)
          setAddNoteOpen(false)
        }}
      />
    </DashboardLayout>
  )
}
