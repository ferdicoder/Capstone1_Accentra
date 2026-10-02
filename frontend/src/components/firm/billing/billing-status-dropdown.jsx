import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { billingStatusFilterOptions } from "./billing-variants"

/**
 * @param {Object} billing - Current billing record.
 * @param {Function} onStatusChange - (status: string) => void
 */
export function BillingStatusDropdown({ billing, onStatusChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="default" className="h-9 gap-1.5 rounded-lg px-3 text-sm" />}
      >
        Change Status
        <ChevronDown aria-hidden="true" className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52 border border-border">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Billing Status</DropdownMenuLabel>
          {billingStatusFilterOptions.map((option) => {
            const isCancelOption = option.value === "cancelled"
            const isSelected = billing?.status === option.value

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onStatusChange?.(option.value)}
                className={`cursor-pointer ${isCancelOption ? "text-red-600 focus:text-red-700" : ""} ${isSelected ? (isCancelOption ? "bg-red-500/10 font-medium text-red-700" : "bg-[#02353C]/10 font-medium text-[#02353C]") : ""}`}
              >
                <span className="flex w-4 shrink-0 justify-center">
                  {isSelected && <Check aria-hidden="true" className="size-4" />}
                </span>
                {isCancelOption ? "Cancel" : option.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
