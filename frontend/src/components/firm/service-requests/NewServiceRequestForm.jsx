import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useFetchServices } from "@/hooks/useServices"
import { useCreateServiceRequest } from "@/hooks/useServiceRequests"

const initialFormState = {
  serviceId: "",
  description: "",
}

export function NewServiceRequestForm({
  businessId,
  clientType,
  hasExistingServiceRequest,
  onSubmitted,
  onCancel,
}) {
  const [formData, setFormData] = useState(initialFormState)
  const [error, setError] = useState(null)

  const { data: services = [], isLoading: servicesLoading } = useFetchServices()
  const createRequest = useCreateServiceRequest()
  const isBlockedNonRetainer = clientType !== "retainer" && hasExistingServiceRequest

  const activeServices = services.filter((s) => s.status === "active")

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError(null)

    if (!businessId) {
      setError("No business found for your account. Please contact support.")
      return
    }
    if (clientType !== "retainer" && hasExistingServiceRequest) {
      setError(
        "You have already submitted your initial service request. Please contact the firm to discuss establishing a retainer arrangement before requesting another service."
      )
      return
    }
    if (!formData.serviceId) {
      setError("Please select a service.")
      return
    }

    createRequest.mutate(
      {
        businessId,
        serviceId: formData.serviceId,
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
            <FieldLabel htmlFor="serviceId">Service</FieldLabel>
            <select
              id="serviceId"
              name="serviceId"
              value={formData.serviceId}
              onChange={updateField}
              required
              disabled={servicesLoading || isBlockedNonRetainer}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">
                {servicesLoading ? "Loading services..." : "Select a service"}
              </option>
              {activeServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
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
              disabled={isBlockedNonRetainer}
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
          disabled={createRequest.isPending || isBlockedNonRetainer}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {isBlockedNonRetainer
            ? "Request limit reached"
            : createRequest.isPending
              ? "Submitting..."
              : "Submit Request"}
        </Button>
      </div>
    </form>
  )
}