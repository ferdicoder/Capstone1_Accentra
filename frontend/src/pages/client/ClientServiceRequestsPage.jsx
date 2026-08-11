import { useEffect, useState } from "react"
import { Briefcase, Eye, FileText, MessageSquare, Search, X } from "lucide-react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NewServiceRequestForm } from "@/components/new-service-request-form"


const currentUser = {
  name: "Maria Santos",
  email: "maria@santosretail.com",
  avatar: "",
}

const serviceRequests = [
  {
    code: "SR-2024-0052",
    type: "Tax Filing",
    icon: FileText,
    service: "Request Annual ITR Filing",
    status: "Pending Review",
    statusTone: "amber",
    requested: "Jul 02, 2025",
    expected: "Jul 09, 2025",
  },
  {
    code: "SR-2024-0049",
    type: "Business Permit",
    icon: Briefcase,
    service: "Request Business Permit Renewal",
    status: "In Progress",
    statusTone: "blue",
    requested: "Jun 20, 2025",
    expected: "Jul 04, 2025",
  },
  {
    code: "SR-2024-0044",
    type: "Consultation",
    icon: MessageSquare,
    service: "Request Tax Advisory Consultation",
    status: "Scheduled",
    statusTone: "purple",
    requested: "Jun 10, 2025",
    expected: "Jun 18, 2025",
  },
  {
    code: "SR-2024-0038",
    type: "Tax Filing",
    icon: FileText,
    service: "Request Quarterly VAT Filing",
    status: "Completed",
    statusTone: "green",
    requested: "May 28, 2025",
    expected: "Jun 05, 2025",
  },
  {
    code: "SR-2024-0031",
    type: "Business Permit",
    icon: Briefcase,
    service: "Request Barangay Clearance Assistance",
    status: "Declined",
    statusTone: "red",
    requested: "May 12, 2025",
    expected: "May 20, 2025",
  },
]

const iconToneStyles = {
  "Tax Filing": "bg-blue-50 text-blue-600",
  "Business Permit": "bg-blue-50 text-blue-600",
  Consultation: "bg-purple-50 text-purple-600",
}

// Only requests that haven't started work yet can still be cancelled by the client.
const CANCELLABLE_STATUSES = ["Pending Review", "Scheduled"]

export default function ClientServiceRequestsPage() {
  const [search, setSearch] = useState("")
  const [requests, setRequests] = useState(serviceRequests)
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)

  // Close the popup on Escape, same behavior Sheet gave us for free.
  useEffect(() => {
    if (!isNewRequestOpen) return
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsNewRequestOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isNewRequestOpen])

  const handleCancelRequest = (code) => {

    setRequests((current) =>
      current.map((r) =>
        r.code === code
          ? { ...r, status: "Cancelled", statusTone: "gray" }
          : r
      )
    )
    // TODO: call the API to persist the cancellation, e.g.
    // await cancelServiceRequest(code)
  }

  const filteredRequests = requests.filter((r) =>
    [r.code, r.service, r.type].some((field) =>
      field.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <SidebarProvider>
      <AppSidebar role="client" user={currentUser} />
      <SidebarInset>
        <DashboardHeader
          role="client"
          user={currentUser}
          breadcrumbs={[{ label: "Home", href: "/client/dashboard" }]}
          title="Service Requests"
          hasUnreadNotifications
          onNotificationsClick={() => {}}
          onRequestServiceClick={() => setIsNewRequestOpen(true)}
        />

        <div className="flex flex-1 flex-col gap-5 px-6 py-6">
          <div>
            <h1 className="text-xl font-semibold">My Service Requests</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {serviceRequests.length} total requests
            </p>
          </div>

          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              aria-label="Search requests"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[32%]" />
                <col className="w-[16%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3.5 align-middle font-semibold">
                    Request
                  </th>
                  <th className="px-4 py-3.5 align-middle font-semibold">
                    Service
                  </th>
                  <th className="px-4 py-3.5 align-middle font-semibold">
                    Requested
                  </th>
                  <th className="px-4 py-3.5 text-center align-middle font-semibold">
                    View
                  </th>
                  <th className="px-4 py-3.5 text-center align-middle font-semibold">
                    Cancel
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => {
                  const Icon = r.icon
                  const canCancel = CANCELLABLE_STATUSES.includes(r.status)
                  return (
                    <tr
                      key={r.code}
                      className="border-b border-border/60 last:border-b-0 hover:bg-muted/50"
                    >
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconToneStyles[r.type]}`}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{r.code}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {r.type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle font-medium">
                        <span className="line-clamp-2">{r.service}</span>
                      </td>
                      <td className="px-4 py-4 align-middle text-muted-foreground">
                        {r.requested}
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                        >
                          <Eye className="size-3.5" />
                          View
                        </Button>
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        {canCancel ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelRequest(r.code)}
                            className="gap-1.5"
                          >
                            <X className="size-3.5" />
                            Cancel
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="gap-1.5"
                          >
                            <X className="size-3.5" />
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {filteredRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No service requests match "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
       </div>
      </SidebarInset>

      {/* Centered popup, inlined directly here instead of a separate Modal component */}
      {isNewRequestOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsNewRequestOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-y-auto rounded-2xl bg-background p-6 shadow-lg"
          >
            <div className="mb-2 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">New Service Request</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Tell us what you need and we'll get started.
                </p>
              </div>
              <button
                onClick={() => setIsNewRequestOpen(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <NewServiceRequestForm
              onSubmitted={() => setIsNewRequestOpen(false)}
              onCancel={() => setIsNewRequestOpen(false)}
            />
          </div>
        </div>
      )}
    </SidebarProvider>
  )
}