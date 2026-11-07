import { useMemo } from "react"
import { FileText, Briefcase, CheckCircle2, Users } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import {
  EmptyState,
  InlineError,
  ListRowLink,
  MoreLink,
  Panel,
  StatCard,
} from "@/components/shared/dashboard"
// Reused as-is from the Engagements page.
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { useFetchBusinesses } from "@/hooks/useBusinesses"
import { authStore } from "@/store/authStore"
import {
  canViewEngagementDocuments,
} from "@/lib/workflow-stages"
import { isEngagementActive, stageLabel, stageTone } from "@/lib/vocab"
import { describeDueDate, parseDate, useToday } from "@/lib/date-utils"

const BASE = "/firm"
const ROUTES = {
  engagements: `${BASE}/engagements`,
  engagement: (id) => `${BASE}/engagements/${id}`,
  client: (id) => `${BASE}/clients/${id}`,
}

// Rows shown per section on the dashboard. "View all" goes to the full page.
const MAX_ROWS = 4
const DUE_SOON_DAYS = 7

// Task statuses meaning "the client uploaded it and the firm has not reviewed it".
// VERIFY: must match the task status values your API returns.
const SUBMITTED_TASK_STATUSES = ["submitted", "for_review", "pending_review"]

// ---------------------------------------------------------------------------
// FIELD MAP: the only place that knows API field names. Names marked VERIFY
// are guesses; change them here if your responses differ.
// ---------------------------------------------------------------------------
const fullName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ")

const F = {
  engagement: {
    // Who leads the engagement. VERIFY the field name.
    leadId: (e) =>
      e.leadId ?? e.lead_id ?? e.assignedStaff?.id ?? e.assignedStaff ?? null,
    clientId: (e) => e.client?.id ?? e.clientId ?? e.client_id,
    businessId: (e) => e.business?.id ?? e.businessId,
    dueDate: (e) => e.targetEndDate ?? e.dueDate ?? e.due_date ?? null,
    clientName: (e) =>
      e.business?.businessName || fullName(e.client) || "Client",
  },
  task: {
    name: (t) => t.name ?? t.title ?? t.documentName ?? "Document",
    // When it was submitted, for oldest-first sorting. VERIFY.
    submittedAt: (t) => t.submittedAt ?? t.submitted_at ?? t.updatedAt ?? null,
  },
  client: {
    name: (c) => c.business?.businessName || fullName(c) || "Client",
    isRetainer: (c) =>
      (c.business?.clientType ?? c.clientType) === "retainer", // VERIFY
    businessId: (c) => c.business?.id,
    // Id the client details route expects (/firm/clients/:id).
    // VERIFY: use the same id ClientManagementPage passes when a row is clicked.
    detailId: (c) => c.id,
  },
}

const belongsToClient = (engagement, client) =>
  F.engagement.clientId(engagement) === client.id ||
  Boolean(
    F.engagement.businessId(engagement) &&
      F.engagement.businessId(engagement) === F.client.businessId(client)
  )

const timeOf = (value) => parseDate(value)?.getTime() ?? null

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default function FirmStaffDashboard() {
  const today = useToday()
  const user = authStore((state) => state.user)
  const authLoading = authStore((state) => state.loading)

  // Tasks are needed to find submitted documents.
  const engagementsQuery = useFetchEngagements({ includeTasks: true })
  const clientsQuery = useFetchBusinesses()

  const engagements = engagementsQuery.data ?? []
  const clients = clientsQuery.data ?? []

  usePageMeta({
    title: "Dashboard",
    breadcrumbs: [{ label: "Firm Staff", href: `${BASE}/dashboard` }],
  })

  const firstName =
    user?.firstName ?? user?.user_metadata?.first_name ?? user?.name ?? ""

  const dueSoonLimit = useMemo(() => {
    const limit = new Date(today)
    limit.setDate(limit.getDate() + DUE_SOON_DAYS)
    return limit
  }, [today])

  // --- Only engagements I lead -------------------------------------------------
  const mine = useMemo(
    () =>
      engagements.filter(
        (e) =>
          isEngagementActive(e.status) &&
          user?.id != null &&
          String(F.engagement.leadId(e)) === String(user.id)
      ),
    [engagements, user?.id]
  )

  const stageCounts = useMemo(
    () => ({
      collecting: mine.filter((e) => e.status === "document_collection").length,
      validating: mine.filter((e) => e.status === "for_validation").length,
      inProgress: mine.filter((e) => e.status === "in_progress").length,
    }),
    [mine]
  )

  const overdue = useMemo(
    () =>
      mine.filter((e) => {
        const due = parseDate(F.engagement.dueDate(e))
        return due && due < today
      }),
    [mine, today]
  )

  const dueSoon = useMemo(
    () =>
      mine
        .filter((e) => {
          const due = parseDate(F.engagement.dueDate(e))
          return due && due <= dueSoonLimit
        })
        .sort((a, b) => (timeOf(F.engagement.dueDate(a)) ?? 0) - (timeOf(F.engagement.dueDate(b)) ?? 0)),
    [mine, dueSoonLimit]
  )

  // --- Submissions to review ---------------------------------------------------
  // Client uploads stay hidden until the engagement reaches For Validation
  // (canViewEngagementDocuments), so only those engagements are counted.
  const submissions = useMemo(() => {
    const items = []
    mine
      .filter((e) => canViewEngagementDocuments(e.status))
      .forEach((engagement) => {
        const tasks = Array.isArray(engagement.tasks) ? engagement.tasks : []
        tasks
          .filter((task) => SUBMITTED_TASK_STATUSES.includes(task.status))
          .forEach((task, index) =>
            items.push({
              key: `${engagement.id}-${task.id ?? index}`,
              engagement,
              task,
            })
          )
      })
    // Oldest first; unknown dates go last.
    return items.sort(
      (a, b) =>
        (timeOf(F.task.submittedAt(a.task)) ?? Infinity) -
        (timeOf(F.task.submittedAt(b.task)) ?? Infinity)
    )
  }, [mine])

  const submissionEngagementCount = useMemo(
    () => new Set(submissions.map((item) => item.engagement.id)).size,
    [submissions]
  )

  // --- Retainer clients I currently handle -----------------------------------
  // Handled = I lead an active engagement for the client. Derived only: nothing
  // is stored or scheduled.
  const handledClients = useMemo(
    () =>
      clients
        .filter(F.client.isRetainer)
        .map((client) => ({
          client,
          activeCount: mine.filter((e) => belongsToClient(e, client)).length,
        }))
        .filter((row) => row.activeCount > 0)
        .sort((a, b) =>
          F.client.name(a.client).localeCompare(F.client.name(b.client))
        ),
    [clients, mine]
  )

  // --- Render ----------------------------------------------------------------
  if (authLoading || engagementsQuery.isLoading || clientsQuery.isLoading) {
    return <PageSkeleton type="dashboard" />
  }

  const engagementsError = engagementsQuery.error
  const clientsError = clientsQuery.error
  const loadError = engagementsError || clientsError

  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex flex-1 flex-col gap-6 px-2 py-4 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {todayLabel}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
          {firstName ? `${greeting()}, ${firstName}` : greeting()}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          The engagements you lead and the documents waiting for your review.
        </p>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          Some information could not be loaded. Refresh the page to try again.
        </div>
      )}

      {/* KPI cards: only engagements I lead */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard
          label="Submissions to Review"
          value={engagementsError ? "—" : submissions.length}
          hint={submissions.length ? "Documents waiting for you" : "Nothing to review"}
          breakdown={[
            { label: "Documents", value: submissions.length },
            { label: "Engagements", value: submissionEngagementCount },
          ]}
          to={ROUTES.engagements}
        />
        <StatCard
          label="My Active Engagements"
          value={engagementsError ? "—" : mine.length}
          alert={overdue.length > 0}
          hint={overdue.length ? `${overdue.length} overdue` : "On track"}
          breakdown={[
            { label: "Collecting", value: stageCounts.collecting },
            { label: "Validating", value: stageCounts.validating },
            { label: "In progress", value: stageCounts.inProgress },
          ]}
          to={ROUTES.engagements}
        />
      </div>

      {/* Submissions (left) + Deadlines (right) */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel
          title="Submissions Awaiting My Review"
          description="Oldest first, from engagements you lead."
          count={engagementsError ? undefined : submissions.length}
          to={ROUTES.engagements}
        >
          {engagementsError ? (
            <InlineError />
          ) : submissions.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing to review" positive>
              Documents clients submit for engagements you lead appear here.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {submissions.slice(0, MAX_ROWS).map(({ key, engagement, task }) => (
                <ListRowLink
                  key={key}
                  to={ROUTES.engagement(engagement.id)}
                  icon={FileText}
                  iconTone="bg-blue-50 text-blue-700"
                  title={F.task.name(task)}
                  subtitle={`${engagement.serviceName} · ${F.engagement.clientName(engagement)}`}
                  badge={{ label: "Submitted", tone: "bg-blue-50 text-blue-700" }}
                />
              ))}
            </ul>
          )}
          {!engagementsError && submissions.length > MAX_ROWS && (
            <MoreLink to={ROUTES.engagements} count={submissions.length - MAX_ROWS} />
          )}
        </Panel>

        <Panel
          title="My Deadlines"
          description={`Overdue or due within ${DUE_SOON_DAYS} days, earliest first.`}
          count={engagementsError ? undefined : dueSoon.length}
          to={ROUTES.engagements}
        >
          {engagementsError ? (
            <InlineError />
          ) : dueSoon.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No upcoming deadlines" positive>
              Engagements you lead that are late or due this week appear here.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {dueSoon.slice(0, MAX_ROWS).map((engagement) => {
                const due = parseDate(F.engagement.dueDate(engagement))
                const late = due && due < today
                return (
                  <ListRowLink
                    key={engagement.id}
                    to={ROUTES.engagement(engagement.id)}
                    icon={Briefcase}
                    iconTone={late ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}
                    title={engagement.serviceName}
                    subtitle={`${F.engagement.clientName(engagement)} · ${describeDueDate(due, today)}`}
                    urgent={Boolean(late)}
                    badge={{
                      label: stageLabel(engagement.status),
                      tone: stageTone(engagement.status),
                    }}
                  />
                )
              })}
            </ul>
          )}
          {!engagementsError && dueSoon.length > MAX_ROWS && (
            <MoreLink to={ROUTES.engagements} count={dueSoon.length - MAX_ROWS} />
          )}
        </Panel>
      </div>

      {/* Retainer clients I handle (derived, nothing stored or scheduled) */}
      <Panel
        title="My Retainer Clients"
        description="Retainer clients you currently lead an active engagement for."
        count={engagementsError || clientsError ? undefined : handledClients.length}
      >
        {engagementsError || clientsError ? (
          <InlineError />
        ) : handledClients.length === 0 ? (
          <EmptyState icon={Users} title="No Retainer clients yet">
            Retainer clients with an active engagement you lead appear here.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3 p-4">
            {handledClients.map(({ client, activeCount }) => (
              <ListRowLink
                key={client.id}
                to={ROUTES.client(F.client.detailId(client))}
                icon={Users}
                iconTone="bg-emerald-50 text-emerald-700"
                title={F.client.name(client)}
                subtitle={`${activeCount} active engagement${activeCount === 1 ? "" : "s"} with you`}
              />
            ))}
          </ul>
        )}
      </Panel>

    </div>
  )
}