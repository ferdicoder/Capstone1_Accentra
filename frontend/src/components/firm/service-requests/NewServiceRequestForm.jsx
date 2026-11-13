import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useFetchServiceCategories } from "@/hooks/useServiceCategories"
import { useCreateServiceRequest } from "@/hooks/useServiceRequests"
import { getZodFieldErrors } from "@/lib/form-validation"
import { serviceRequestSchema } from "@/schemas/serviceRequestSchema"

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

  const {
    data: availableCategories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useFetchServiceCategories()
  const createRequest = useCreateServiceRequest()
  const isBlockedNonRetainer = clientType !== "retainer" && hasExistingServiceRequest
  const isBlockedByUnpaidBills = hasUnpaidBills
  const isSubmissionBlocked = isBlockedNonRetainer || isBlockedByUnpaidBills

  const noCategories =
    !categoriesLoading && !categoriesError && availableCategories.length === 0
  const selectedCategory = availableCategories.find(
    (category) => category.value === formData.category
  )

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
              disabled={
                categoriesLoading || Boolean(categoriesError) || noCategories || isSubmissionBlocked
              }
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">
                {categoriesLoading ? "Loading categories..." : "Select a category"}
              </option>
              {availableCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {selectedCategory?.description && (
              <p className="text-xs text-muted-foreground">{selectedCategory.description}</p>
            )}
            {categoriesError && (
              <p className="text-xs text-red-600">
                Categories could not be loaded. Please try again.
              </p>
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