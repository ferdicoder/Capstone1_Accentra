import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Bell, Briefcase, Eye, FileText, Search } from "lucide-react"
 
const engagements = [
  {
    code: "ENG-2024-0041",
    type: "Tax Filing",
    icon: FileText,
    service: "Annual ITR Filing",
    status: "Documents Needed",
    statusTone: "amber",
    created: "Nov 28, 2024",
    due: "Apr 15, 2025",
  },
  {
    code: "ENG-2024-0038",
    type: "Business Permit",
    icon: Briefcase,
    service: "Business Permit Renewal",
    status: "Under Review",
    statusTone: "blue",
    created: "Nov 15, 2024",
    due: "Jan 20, 2025",
  },
  {
    code: "ENG-2024-0031",
    type: "Tax Filing",
    icon: FileText,
    service: "Quarterly VAT Return Q4",
    status: "For Payment",
    statusTone: "purple",
    created: "Nov 01, 2024",
    due: "Dec 31, 2024",
  },
  {
    code: "ENG-2024-0027",
    type: "Tax Filing",
    icon: FileText,
    service: "Quarterly ITR Q3",
    status: "Completed",
    statusTone: "green",
    created: "Sep 15, 2024",
    due: "Oct 31, 2024",
  },
  {
    code: "ENG-2024-0022",
    type: "Business Permit",
    icon: Briefcase,
    service: "Business Permit Renewal",
    status: "Completed",
    statusTone: "green",
    created: "Jan 05, 2024",
    due: "Jan 31, 2024",
  },
]
 
const statusStyles = {
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  blue: "bg-blue-50 text-blue-700 border border-blue-200",
  purple: "bg-purple-50 text-purple-700 border border-purple-200",
  green: "bg-green-50 text-green-700 border border-green-200",
}
 
const iconToneStyles = {
  "Tax Filing": "bg-blue-50 text-blue-600",
  "Business Permit": "bg-blue-50 text-blue-600",
}
 
export default function EngagementsPage() {
  return (
    <SidebarProvider>
      <AppSidebar activeItem="Engagement" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Engagements</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
 
          <div className="flex items-center gap-3 px-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
            </Button>
            <Button className="bg-emerald-800 text-white hover:bg-emerald-700">
              + Request Service
            </Button>
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-white">
              MS
            </div>
          </div>
        </header>
 
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold">My Engagements</h1>
              <p className="text-sm text-muted-foreground">
                {engagements.length} total engagements
              </p>
            </div>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
              + New Request
            </Button>
          </div>
 
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search engagements..." className="pl-9" />
          </div>
 
          <div className="overflow-hidden rounded-xl border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Engagement</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {engagements.map((e) => {
                  const Icon = e.icon
                  return (
                    <tr
                      key={e.code}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-lg p-2 ${iconToneStyles[e.type]}`}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium">{e.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {e.type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{e.service}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyles[e.statusTone]
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {e.created}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {e.due}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800">
                          <Eye className="size-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}