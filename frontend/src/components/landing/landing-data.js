import { Briefcase, Users } from "lucide-react"

export const landingContainer = "mx-auto w-full max-w-[1800px] px-5 sm:px-8"

// Brand        #02353C primary · #062c31 nav/footer · #0A4B52 hover
// Accent       #10B981 actions · #34D399 hover · #6EE7B7 on dark · #047857 text on light · #E6F7EF tint
// Surfaces     #FAFBF9 canvas · #F2F7F4 alternate · #FFFFFF
// Borders      #DCE9E5 default · #B9D9CE strong
// Text (light) #02353C headings · #3D5F5A body · #557570 secondary

const buttonBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-[0.9375rem] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4"

export const ui = {
  h1: "text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-balance",
  h2: "text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-balance",
  h3: "text-lg font-semibold leading-snug tracking-[-0.01em]",
  lead: "text-lg leading-[1.7]",
  small: "text-[0.9375rem] leading-6",

  btn: `${buttonBase} px-5 py-3`,
  btnSm: `${buttonBase} px-4 py-2.5`,
  btnPrimary:
    "bg-[#10B981] text-[#02353C] hover:bg-[#34D399] focus-visible:outline-[#6EE7B7]",
  btnSolid:
    "bg-[#02353C] text-white hover:bg-[#0A4B52] focus-visible:outline-[#02353C]",
  btnOutline:
    "border border-[#B9D9CE] text-[#02353C] hover:bg-[#F2F7F4] focus-visible:outline-[#02353C]",
  btnOutlineDark:
    "border border-white/25 text-white hover:border-white/45 hover:bg-white/5 focus-visible:outline-[#6EE7B7]",
  btnGhostDark:
    "text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-[#6EE7B7]",

  navLink:
    "py-2 text-[0.9375rem] text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6EE7B7]",
  footerLink:
    "block text-[0.9375rem] text-white/55 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6EE7B7]",

  iconTile:
    "flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E6F7EF] text-[#047857]",
}

export const navigationLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#workflow" },
  { label: "For firms", href: "#for-firms" },
  { label: "For clients", href: "#for-clients" },
]

export const features = [
  {
    title: "Client management",
    description:
      "Maintain organized client profiles with essential information and engagement records.",
  },
  {
    title: "Service requests",
    description:
      "Clients submit requests for accounting services, and the firm reviews and manages them.",
  },
  {
    title: "Service templates",
    description:
      "Create reusable templates with descriptions, predefined tasks, document requirements, and billing details.",
  },
  {
    title: "Engagement management",
    description:
      "Create client engagements from service templates, with flexibility for specific requirements.",
  },
  {
    title: "Document management and review",
    description:
      "Clients submit documents; staff review, approve, or request revisions in one place.",
  },
  {
    title: "Task and progress monitoring",
    description:
      "Manage engagement tasks and give clients visibility into the progress of their services.",
  },
  {
    title: "Billing management",
    description:
      "Organize billing records, record retainer fees, and monitor payment statuses.",
  },
  {
    title: "Client portal",
    description:
      "A dedicated space to request services, upload documents, track progress, view billing, and download deliverables.",
  },
]

export const workflow = [
  {
    number: "01",
    tag: "Client",
    title: "Request a service",
    description:
      "Clients submit their desired accounting service through the client portal.",
  },
  {
    number: "02",
    tag: "Firm",
    title: "Review and create an engagement",
    description:
      "The firm reviews the request and creates an engagement from the right service template.",
  },
  {
    number: "03",
    tag: "Staff",
    title: "Manage tasks and documents",
    description:
      "Staff handle assigned tasks, review submitted documents, and update activities.",
  },
  {
    number: "04",
    tag: "Client",
    title: "Monitor and complete",
    description:
      "Clients follow progress, view billing, and access completed deliverables.",
  },
]

export const roles = [
  {
    label: "Firm Admin",
    description:
      "Oversees firm operations, manages user accounts, configures service templates, and supervises engagements and billing.",
    anchor: "for-firms",
  },
  {
    label: "Firm Staff",
    description:
      "Handles assigned client engagements, manages tasks, reviews submitted documents, and updates engagement progress.",
  },
  {
    label: "Billing Officer",
    description:
      "Manages billing records, retainer fees, and payment status monitoring.",
  },
  {
    label: "Client",
    description:
      "Requests services, submits documents, monitors progress, views billing, and retrieves completed deliverables.",
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