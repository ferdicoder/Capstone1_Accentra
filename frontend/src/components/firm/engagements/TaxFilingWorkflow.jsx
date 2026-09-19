import { useState } from "react"
import { CheckCircle2, Circle, FileText, Send, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ComputeTaxDialog } from "./ComputeTaxDialog"
import { TaxComputationDialog } from "./TaxComputationDialog"
import { FileTaxDialog } from "./FileTaxDialog"
import {
  getRequiredDocsForService,
  isVatService,
  computationStatusStyles,
  computationStatusLabels,
  approvalStatusStyles,
  approvalStatusLabels,
  filingStatusStyles,
  filingStatusLabels,
  nonVatTaxTreatments,
  vatFilingPeriods,
} from "./tax-filing-variants"
import { firmStaffMap } from "./engagement-variants"

function StatusBadge({ label, styles }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", styles)}>
      {label}
    </span>
  )
}

function RequiredDocsStage({ serviceName, documents }) {
  const requiredDocs = getRequiredDocsForService(serviceName) ?? []
  const docs = documents ?? []

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Required Documents</h3>
        <span className="text-xs text-muted-foreground">
          {requiredDocs.filter((rd) => docs.some((d) => d.name === rd.name && d.status === "approved")).length} / {requiredDocs.length} Approved
        </span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        All required documents must be approved before proceeding to tax computation.
      </p>
      <div className="flex flex-col gap-2">
        {requiredDocs.map((rd) => {
          const doc = docs.find((d) => d.name === rd.name)
          const status = doc?.status ?? "pending"
          const isApproved = status === "approved"
          return (
            <div key={rd.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{rd.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{status.replace("_", " ")}</p>
                </div>
              </div>
              {isApproved ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <Circle className="size-4 text-gray-300" />
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Upload and submit documents in the <span className="font-medium">Documents</span> tab, then review in the <span className="font-medium">Document Review</span> tab.
      </p>
    </div>
  )
}

function ComputationStage({ serviceName, computation, allDocsApproved, onGenerate }) {
  const isVat = isVatService(serviceName)
  const statusKey = computation.status ?? "pending"
  const showReadyButton = allDocsApproved && statusKey === "pending"

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Tax Computation</h3>
        <StatusBadge
          label={statusKey === "pending" && allDocsApproved ? "Ready to Generate" : computationStatusLabels[statusKey] ?? "Pending"}
          styles={statusKey === "pending" && allDocsApproved ? "bg-blue-50 text-blue-700" : computationStatusStyles[statusKey] ?? computationStatusStyles.pending}
        />
      </div>

      {statusKey === "pending" && !allDocsApproved && (
        <p className="text-xs text-muted-foreground">
          Waiting for all required documents to be approved before generating the {isVat ? "VAT" : "tax"} computation.
        </p>
      )}

      {showReadyButton && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            All required documents are approved. You can now generate the {isVat ? "VAT" : "tax"} computation.
          </p>
          <Button
            size="sm"
            className="h-9 w-fit gap-1.5 rounded-lg bg-[#02353C] text-white hover:opacity-90"
            onClick={onGenerate}
          >
            Generate {isVat ? "VAT" : "Tax"} Computation
          </Button>
        </div>
      )}

      {statusKey !== "pending" && (
        <div className="flex flex-col gap-3">
          {computation.filingPeriod && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Filing Period</span>
              <span className="text-sm font-medium text-foreground">{computation.filingPeriod}</span>
            </div>
          )}
          {computation.filingType && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5">
              <span className="text-xs text-muted-foreground">{isVat ? "VAT Filing Period" : "Tax Treatment"}</span>
              <span className="text-sm font-medium text-foreground">{computation.filingTypeLabel ?? computation.filingType}</span>
            </div>
          )}
          {computation.assignedStaff && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Assigned Staff</span>
              <span className="text-sm font-medium text-foreground">{firmStaffMap[computation.assignedStaff] ?? "—"}</span>
            </div>
          )}
          {computation.internalNotes && (
            <div className="rounded-lg border border-border bg-background px-4 py-2.5">
              <p className="text-xs text-muted-foreground mb-1">Internal Notes</p>
              <p className="text-sm text-foreground">{computation.internalNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ApprovalStage({ serviceName, approval, computationReady, onApprove, onReject, onSendToClient }) {
  const isVat = isVatService(serviceName)
  const statusKey = approval.status ?? "waiting_approval"
  const waitingForComputation = !computationReady

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Client Approval</h3>
        <StatusBadge
          label={waitingForComputation ? "Waiting for Computation" : approvalStatusLabels[statusKey] ?? "Waiting Approval"}
          styles={waitingForComputation ? "bg-gray-50 text-gray-500" : approvalStatusStyles[statusKey] ?? approvalStatusStyles.waiting_approval}
        />
      </div>

      {waitingForComputation && (
        <p className="text-xs text-muted-foreground">
          Complete the tax computation before sending for client approval.
        </p>
      )}

      {!waitingForComputation && statusKey === "waiting_approval" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Send the {isVat ? "VAT" : "tax"} computation to the client for review and approval.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-lg bg-[#02353C] text-white hover:opacity-90"
              onClick={onSendToClient}
            >
              <Send className="size-3.5" />
              Send To Client
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 rounded-lg"
              onClick={onApprove}
            >
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 rounded-lg border-red-300 text-red-600 hover:bg-red-50"
              onClick={onReject}
            >
              <XCircle className="size-3.5" />
              Reject
            </Button>
          </div>
        </div>
      )}

      {!waitingForComputation && statusKey === "approved" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">Client approved the {isVat ? "VAT" : "tax"} computation.</p>
          </div>
        </div>
      )}

      {!waitingForComputation && statusKey === "rejected" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3">
            <XCircle className="size-4 text-red-600" />
            <p className="text-sm font-medium text-red-600">Client rejected the {isVat ? "VAT" : "tax"} computation.</p>
          </div>
          <Button
            size="sm"
            className="h-9 w-fit gap-1.5 rounded-lg bg-[#02353C] text-white hover:opacity-90"
            onClick={onSendToClient}
          >
            <Send className="size-3.5" />
            Resend To Client
          </Button>
        </div>
      )}
    </div>
  )
}

function FilingStage({ serviceName, filing, approvalApproved, onFileTax }) {
  const isVat = isVatService(serviceName)
  const statusKey = filing.status ?? "pending_filing"
  const waitingForApproval = !approvalApproved

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{isVat ? "VAT Filing" : "Tax Filing"}</h3>
        <StatusBadge
          label={waitingForApproval ? "Waiting for Approval" : filingStatusLabels[statusKey] ?? "Pending Filing"}
          styles={waitingForApproval ? "bg-gray-50 text-gray-500" : filingStatusStyles[statusKey] ?? filingStatusStyles.pending_filing}
        />
      </div>

      {waitingForApproval && (
        <p className="text-xs text-muted-foreground">
          Waiting for client approval before filing the {isVat ? "VAT" : "tax"} return.
        </p>
      )}

      {!waitingForApproval && statusKey === "pending_filing" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            File the {isVat ? "VAT" : "tax"} return with the BIR.
          </p>
          <Button
            size="sm"
            className="h-9 w-fit gap-1.5 rounded-lg bg-[#02353C] text-white hover:opacity-90"
            onClick={onFileTax}
          >
            File {isVat ? "VAT Return" : "Tax"}
          </Button>
        </div>
      )}

      {!waitingForApproval && statusKey === "filed" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">
              {isVat ? "VAT return" : "Tax filing"} completed successfully.
            </p>
          </div>
          {filing.filingDate && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Filing Date</span>
              <span className="text-sm font-medium text-foreground">{filing.filingDate}</span>
            </div>
          )}
          {filing.filingNotes && (
            <div className="rounded-lg border border-border bg-background px-4 py-2.5">
              <p className="text-xs text-muted-foreground mb-1">Filing Notes</p>
              <p className="text-sm text-foreground">{filing.filingNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CompletedStage({ serviceName, isEngagementComplete }) {
  const isVat = isVatService(serviceName)

  if (!isEngagementComplete) return null

  const outputs = [
    "Tax Computation Summary",
    "BIR Tax Return Document",
    "Filing Confirmation",
    "Proof of Payment",
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{isVat ? "VAT" : "Tax"} Filing Completed</h3>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          100% Complete
        </span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        All stages are complete. Below are the filing outputs.
      </p>
      <div className="flex flex-col gap-2">
        {outputs.map((output) => (
          <div key={output} className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span className="text-sm font-medium text-foreground">{output}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TaxFilingWorkflow({ engagement, serviceName, taxFilingState, onTaxFilingStateChange, onNotice }) {
  const [setupDialogOpen, setSetupDialogOpen] = useState(false)
  const [computationDialogOpen, setComputationDialogOpen] = useState(false)
  const [setupData, setSetupData] = useState(null)
  const [fileDialogOpen, setFileDialogOpen] = useState(false)
  const isVat = isVatService(serviceName)
  const documents = engagement.documents ?? []

  const computation = taxFilingState.computation ?? { status: "pending" }
  const approval = taxFilingState.approval ?? { status: "waiting_approval" }
  const filing = taxFilingState.filing ?? { status: "pending_filing" }

  const requiredDocs = getRequiredDocsForService(serviceName) ?? []
  const allDocsApproved = requiredDocs.length > 0 && requiredDocs.every((rd) => {
    const doc = documents.find((d) => d.name === rd.name)
    return doc && doc.status === "approved"
  })
  const computationReady = computation.status === "ready_for_approval"
  const approvalApproved = approval.status === "approved"
  const isEngagementComplete = engagement.status === "completed"

  const handleSetupContinue = (data) => {
    // Resolve the label for the filing type
    let filingTypeLabel = data.filingType
    if (isVat) {
      const period = vatFilingPeriods.find(p => p.value === data.filingType)
      filingTypeLabel = period?.label ?? data.filingType
    } else {
      const treatment = nonVatTaxTreatments.find(t => t.value === data.filingType)
      filingTypeLabel = treatment?.label ?? data.filingType
    }
    setSetupData({ ...data, filingTypeLabel })
    setSetupDialogOpen(false)
    setComputationDialogOpen(true)
  }

  const handleSaveComputation = (data) => {
    onTaxFilingStateChange?.({
      ...taxFilingState,
      computation: { ...computation, ...data, status: "ready_for_approval" },
    })
    setComputationDialogOpen(false)
    setSetupData(null)
    onNotice?.("Tax computation generated.")
  }

  const handleSendToClient = () => {
    onTaxFilingStateChange?.({
      ...taxFilingState,
      approval: { ...approval, status: "waiting_approval" },
    })
    onNotice?.(`${isVat ? "VAT" : "Tax"} computation sent to client.`)
  }

  const handleApprove = () => {
    onTaxFilingStateChange?.({
      ...taxFilingState,
      approval: { ...approval, status: "approved" },
    })
    onNotice?.(`Client approved ${isVat ? "VAT" : "tax"} computation.`)
  }

  const handleReject = () => {
    onTaxFilingStateChange?.({
      ...taxFilingState,
      approval: { ...approval, status: "rejected" },
    })
    onNotice?.(`Client rejected ${isVat ? "VAT" : "tax"} computation.`)
  }

  const handleFileTax = (data) => {
    onTaxFilingStateChange?.({
      ...taxFilingState,
      filing: { ...filing, ...data, status: "filed" },
    })
    onNotice?.(`${isVat ? "VAT" : "Tax"} filing completed.`)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <RequiredDocsStage serviceName={serviceName} documents={documents} />
        <ComputationStage serviceName={serviceName} computation={computation} allDocsApproved={allDocsApproved} onGenerate={() => setSetupDialogOpen(true)} />
        <ApprovalStage
          serviceName={serviceName}
          approval={approval}
          computationReady={computationReady}
          onApprove={handleApprove}
          onReject={handleReject}
          onSendToClient={handleSendToClient}
        />
        <FilingStage serviceName={serviceName} filing={filing} approvalApproved={approvalApproved} onFileTax={() => setFileDialogOpen(true)} />
        <CompletedStage serviceName={serviceName} isEngagementComplete={isEngagementComplete} />
      </div>

      <ComputeTaxDialog
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        isVat={isVat}
        onContinue={handleSetupContinue}
      />
      <TaxComputationDialog
        open={computationDialogOpen}
        onOpenChange={setComputationDialogOpen}
        isVat={isVat}
        setupData={setupData}
        onSave={handleSaveComputation}
      />
      <FileTaxDialog
        open={fileDialogOpen}
        onOpenChange={setFileDialogOpen}
        isVat={isVat}
        onSave={handleFileTax}
      />
    </>
  )
}
