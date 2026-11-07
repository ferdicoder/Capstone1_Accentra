import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

/**
 * Shown on client portal pages when the signed-in client has no businesses
 * row (they signed up without a business). Business-scoped lists stay empty
 * until they add one from the profile page.
 */
export function NoBusinessBanner({ className }) {
  return (
    <div
      className={`flex flex-col items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <div className="text-sm text-muted-foreground">
        <p className="font-medium text-foreground">You haven't added a business yet.</p>
        <p>Add your business in your profile to request services and see engagements and billing.</p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/client/profile">Go to Profile</Link>
      </Button>
    </div>
  )
}
