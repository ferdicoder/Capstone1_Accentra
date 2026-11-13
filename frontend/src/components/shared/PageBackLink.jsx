import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export function PageBackLink({ to, children = "Back", className }) {
  return (
    <Link
      to={to}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "cursor-pointer gap-1.5 text-muted-foreground",
        className
      )}
    >
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  )
}
