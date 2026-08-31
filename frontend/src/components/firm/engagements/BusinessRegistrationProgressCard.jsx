import { useState } from "react"

import { RegistrationMilestoneItem } from "./RegistrationMilestoneItem"
import { RegistrationMilestoneDialog } from "./RegistrationMilestoneDialog"

export function BusinessRegistrationProgressCard({ businessType, milestones, onMilestonesChange }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)

  const total = milestones.length
  const completed = milestones.filter((m) => m.status === "completed").length
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  const handleUpdateMilestone = (milestone) => {
    setEditingMilestone(milestone)
    setDialogOpen(true)
  }

  const handleSaveMilestone = (updatedMilestone) => {
    onMilestonesChange?.(
      milestones.map((m) => (m.id === updatedMilestone.id ? updatedMilestone : m))
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Business Registration Progress</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Track registration milestones and government compliance requirements.
          </p>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {completed} / {total} Completed
        </span>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{businessType}</span>
          <span className="text-xs font-semibold text-[#02353C]">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#02353C] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {milestones.map((milestone) => (
          <RegistrationMilestoneItem
            key={milestone.id}
            milestone={milestone}
            onUpdate={handleUpdateMilestone}
          />
        ))}
      </div>

      <RegistrationMilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        milestone={editingMilestone}
        onSave={handleSaveMilestone}
      />
    </div>
  )
}
