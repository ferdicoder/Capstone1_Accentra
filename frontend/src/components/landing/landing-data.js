import { Briefcase, Users } from "lucide-react"
import businessRegistrationImage from "@/assets/BusinessReg.png"
import taxFilingImage from "@/assets/TaxFiling.png"

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
  { label: "Home", href: "#home" },
  { label: "Service", href: "#features" },
  { label: "How it works", href: "#workflow" },
  { label: "About", href: "#about" },
]

export const features = [
  {
    title: "Business Registration",
    description:
      "Reliable support with business registration and essential setup requirements.",
    startingPrice: 1000,
    image: businessRegistrationImage,
  },
  {
    title: "Tax Filing",
    description:
      "Reliable support with tax filing and managing essential tax requirements.",
    startingPrice: 2500,
    image: taxFilingImage,
  },
]

export const workflow = [
  {
    number: "01",
    title: "Create Your Account",
    description:
      "Register your account and provide your personal information to get started with Accentra.",
  },
  {
    number: "02",
    title: "Choose a Service",
    description:
      "Explore JOBAL's available services, including Tax Filing and Business Registration Assistance, and submit your service request.",
  },
  {
    number: "03",
    title: "Submit Required Documents",
    description:
      "Provide the necessary information and upload the documents requested by JOBAL. The firm will review your submissions and inform you if anything else is needed.",
  },
  {
    number: "04",
    title: "Track Your Progress",
    description:
      "Stay informed about your service request, review updates from the firm, and access your completed deliverables through Accentra.",
  },
  {
    number: "05",
    title: "Review Your Bill and Submit Payment Reference",
    description:
      "View your invoice and submit your payment reference through Accentra. The firm will verify your payment and update its status.",
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