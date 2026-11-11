import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useFetchServices } from "@/hooks/useServices"
import { useCreateServiceRequest } from "@/hooks/useServiceRequests"
import { getZodFieldErrors } from "@/lib/form-validation"
import { serviceRequestSchema } from "@/schemas/serviceRequestSchema"
import { CATEGORY_META } from "@/lib/service-categories"

const initialFormState = {
  category: "",
  description: "",
}

export function NewServiceRequestForm({
  businessId,
  clientType,
  hasExistingServiceRequest,
  hasUnpaidBills,
  onSubmitted,
  onCancel,
}) {
  const [formData, setFormData] = useState(initialFormState)
  const [error, setError] = useState(null)

  const { data: services = [], isLoading: servicesLoading } = useFetchServices()
  const createRequest = useCreateServiceRequest()
  const isBlockedNonRetainer = clientType !== "retainer" && hasExistingServiceRequest
  const isBlockedByUnpaidBills = hasUnpaidBills
  const isSubmissionBlocked = isBlockedNonRetainer || isBlockedByUnpaidBills

  // Only categories that have at least one active template, so a request never
  // lands on a category the firm can't fulfil.
  const availableCategories = [
    ...new Set(services.filter((s) => s.status === "active").map((s) => s.category).filter(Boolean)),
  ]
  const noCategories = !servicesLoading && availableCategories.length === 0
  const selectedMeta = CATEGORY_META[formData.category]

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError(null)

    if (!businessId) {
      setError("You haven't added a business yet. Add your business in your profile to request services.")
      return
    }
    if (isBlockedByUnpaidBills) {
      setError("Please settle your outstanding balance before submitting another service request.")
      return
    }
    if (clientType !== "retainer" && hasExistingServiceRequest) {
      setError(
        "You have already submitted your initial service request. Please contact the firm to discuss establishing a retainer arrangement before requesting another service."
      )
      return
    }
    const validationErrors = getZodFieldErrors(serviceRequestSchema, formData)
    if (Object.keys(validationErrors).length > 0) {
      setError(validationErrors.category)
      return
    }

    createRequest.mutate(
      {
        businessId,
        category: formData.category,
        description: formData.description,
      },
      {
        onSuccess: () => {
          setFormData(initialFormState)
          onSubmitted?.()
        },
        onError: (err) => {
          console.error(err)
          setError("Something went wrong submitting your request. Please try again.")
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isBlockedByUnpaidBills && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          You have an outstanding unpaid bill. Please settle the balance before submitting another
          service request.
        </div>
      )}

      {isBlockedNonRetainer && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have already submitted your initial service request. To request another service,
          please contact the firm to discuss establishing a retainer arrangement.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-background p-5">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="category">Service Category</FieldLabel>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={updateField}
              required
              disabled={servicesLoading || noCategories || isSubmissionBlocked}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">
                {servicesLoading ? "Loading categories..." : "Select a category"}
              </option>
              {availableCategories.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_META[value]?.label ?? value}
                </option>
              ))}
            </select>
            {selectedMeta?.description && (
              <p className="text-xs text-muted-foreground">{selectedMeta.description}</p>
            )}
            {noCategories && (
              <p className="text-xs text-muted-foreground">
                No services are available right now. Please contact your firm.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Your firm will assign the exact service when they review your request.
            </p>
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Anything the firm should know before starting this request..."
              value={formData.description}
              onChange={updateField}
              disabled={isSubmissionBlocked}
              className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </Field>
        </FieldGroup>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => onCancel?.()}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createRequest.isPending || isSubmissionBlocked || noCategories}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {isBlockedByUnpaidBills
            ? "Balance must be settled"
            : isBlockedNonRetainer
            ? "Request limit reached"
            : createRequest.isPending
              ? "Submitting..."
              : "Submit Request"}
        </Button>
      </div>
    </form>
  )
}