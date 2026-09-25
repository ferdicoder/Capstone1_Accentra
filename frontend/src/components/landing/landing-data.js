import {
  Briefcase,
  ClipboardList,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react"

// The single source of horizontal width for the whole landing page.
//
// `w-full` is deliberate: a percentage such as 94vw would actually NARROW the
// layout between roughly 1100px and 1500px, where the viewport minus padding
// is already wider than 94% of the viewport. Letting the container run at full
// width and stopping it only at a high cap means the content never shrinks as
// the window grows - it expands continuously to 1800px, then holds. The
// padding supplies the side margin, which lands at roughly 5% on a large
// desktop instead of the 8-10% a tighter cap produced.
export const landingContainer =
  "mx-auto w-full max-w-[1800px] px-5 sm:px-8"

export const navigationLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#workflow" },
  { label: "For firms", href: "#for-firms" },
  { label: "For clients", href: "#for-clients" },
]

export const problemItems = [
  {
    title: "Scattered files",
    description: "Important documents live across too many places.",
  },
  {
    title: "Unclear progress",
    description: "Clients and staff lose track of what happens next.",
  },
  {
    title: "Manual follow-up",
    description: "Updates and coordination take time away from the work.",
  },
]

export const solutionNodes = [
  {
    label: "Client",
    description: "Requests, files, and updates",
    icon: Users,
  },
  {
    label: "Accounting firm",
    description: "Services, people, and workflow",
    icon: ShieldCheck,
  },
  {
    label: "Firm staff",
    description: "Assigned work and progress",
    icon: ClipboardList,
  },
]

export const solutionDetails = [
  "Service requests",
  "Engagements",
  "Documents",
  "Tasks",
  "Workflow progress",
  "Activity updates",
  "Deliverables",
  "Audit logs",
  "Billing-related processes where applicable",
]

export const solutionHighlights = [
  "Client and firm communication",
  "Documents, tasks, and deliverables",
  "Workflow progress and activity updates",
]

export const features = [
  {
    icon: ClipboardList,
    title: "Service requests",
    description:
      "Give clients a clear way to request accounting work and keep the request connected to the engagement it starts.",
  },
  {
    icon: Briefcase,
    title: "Engagement management",
    description:
      "See active engagements, assigned staff, dates, and progress without losing the wider practice context.",
  },
  {
    icon: FileText,
    title: "Documents and review",
    description:
      "Organize required files, review submissions, and keep deliverables connected to the work they belong to.",
  },
  {
    icon: ClipboardList,
    title: "Tasks and workflow",
    description:
      "Track assigned tasks and move each engagement through its shared workflow with clear ownership.",
  },
  {
    icon: MessageSquareText,
    title: "Activity updates and audit log",
    description:
      "Keep client communication, activity updates, approvals, and revision requests close to the engagement.",
  },
  {
    icon: ShieldCheck,
    title: "Services and firm context",
    description:
      "Bring service templates, firm users, client information, and role-based views into one practical workspace.",
  },
]

export const workflow = [
  {
    number: "01",
    title: "Documentation Collection",
    description: "Gather the documents and information the engagement needs.",
  },
  {
    number: "02",
    title: "Document Verification",
    description:
      "Review submissions for completeness before the work moves forward.",
  },
  {
    number: "03",
    title: "Processing",
    description: "Keep assigned tasks, documents, and progress moving together.",
  },
  {
    number: "04",
    title: "Approval",
    description: "Review completed work and confirm the next step with clarity.",
  },
  {
    number: "05",
    title: "Payment",
    description: "Close the engagement with a visible, manageable final step.",
  },
]

export const roles = [
  {
    label: "Firm Admin",
    title: "A clearer view of the whole firm.",
    description:
      "Manage users, services, engagements, and the workflows that keep the practice moving.",
    icon: ShieldCheck,
    anchor: "for-firms",
  },
  {
    label: "Firm Staff",
    title: "Less hunting. More doing.",
    description:
      "Handle assigned engagements, review documents, manage tasks, and update progress in context.",
    icon: ClipboardList,
  },
  {
    label: "Client",
    title: "Know what happens next.",
    description:
      "Request services, submit documents, track progress, and receive updates from the firm.",
    icon: Users,
    anchor: "for-clients",
  },
]

export const workspaceOptions = [
  {
    key: "client",
    label: "Client",
    description:
      "For business owners and clients managing accounting services.",
    cta: "Continue as Client",
    href: "/client/signin",
    icon: Users,
  },
  {
    key: "firm",
    label: "Firm",
    description:
      "For accounting firms, administrators, and staff managing engagements.",
    cta: "Continue as Firm",
    href: "/firm/signin",
    icon: Briefcase,
  },
]
