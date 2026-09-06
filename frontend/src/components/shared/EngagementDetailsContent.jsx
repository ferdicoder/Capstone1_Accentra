import { cn } from "@/lib/utils"

function InfoField({ label, children, fullWidth, valueClassName }) {
  return (
    <div className={cn("min-w-0", fullWidth && "sm:col-span-2")}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("mt-1.5 break-words text-sm font-medium text-foreground", valueClassName)}>
        {children}
      </dd>
    </div>
  )
}

export function EngagementDetailsContent({
  engagement,
  clientInfo,
  serviceInfo,
  className,
}) {
  if (!engagement) return null

  return (
    <div className={cn("min-h-0 overflow-y-auto", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Client Information */}
        <section className="border-b px-6 py-7 sm:px-8 sm:py-8 md:border-b-0 md:border-r">
          <div className="mb-7">
            <h3 className="text-base font-semibold">Client Information</h3>
          </div>

          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {clientInfo?.fields?.map((field, index) => (
              <InfoField
                key={field.label}
                label={field.label}
                fullWidth={field.fullWidth}
                valueClassName={field.valueClassName}
              >
                {field.value}
              </InfoField>
            ))}
          </dl>
        </section>

        {/* Right Column: Service Information */}
        <section className="px-6 py-7 sm:px-8 sm:py-8">
          <div className="mb-7">
            <h3 className="text-base font-semibold">Service Information</h3>
            {serviceInfo?.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {serviceInfo.description}
              </p>
            )}
          </div>

          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {serviceInfo?.fields?.map((field, index) => (
              <InfoField
                key={field.label}
                label={field.label}
                fullWidth={field.fullWidth}
                valueClassName={field.valueClassName}
              >
                {field.value}
              </InfoField>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
