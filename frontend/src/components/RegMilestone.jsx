import { cn } from "@/lib/utils"

const signupSteps = ["Account", "Firm Info", "OTP"];

export default function RegMilestone(){
  return(
    <div className="flex items-center justify-between">
      {signupSteps.map((step, index) => (
        <div key={step} className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2">
            <span // step number
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-sm font-semibold",
                index === 0
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground"
              )}
            >
              {index + 1}
            </span>
            <h3 className="text-xs font-bold">{step}</h3>
          </div>
        </div>
      ))}
    </div>
  )
}