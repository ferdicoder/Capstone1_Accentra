import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"

// import { submitServiceRequest } from "@/services/serviceRequestService"

// From the `services` table (service_id, service_name). The select's value becomes
// `service_id` (FK, INT) on the service_request row.
const SERVICES = [
  { value: "1", label: "Annual ITR Filing" },
  { value: "2", label: "Business Permit Renewal" },
  { value: "3", label: "Quarterly VAT Filing" },
  { value: "4", label: "Tax Advisory Consultation" },
  { value: "5", label: "Barangay Clearance Assistance" },
]

const initialFormState = {
  serviceId: "",
  description: "",
}

export function NewServiceRequestForm({ onSubmitted, onCancel }) {
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    if (!formData.serviceId) {
      setError("Please select a service.")
      return
    }

    setIsSubmitting(true)
    try {
      // business_id comes from the authenticated client's session, not the form.
      // req_status_id defaults to whatever request_statuses row means "Pending" on the backend.
      // await submitServiceRequest({
      //   service_id: Number(formData.serviceId),
      //   description: formData.description,
      // })
      onSubmitted?.()
    } catch (err) {
      console.error(err)
      setError("Something went wrong submitting your request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">Select a service</option>
              {SERVICES.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </select>
            <FieldDescription>
              Maps to <code>service_id</code> (FK → services.service_id) on the service_request row.
            </FieldDescription>
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
              className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
            <FieldDescription>
              Maps directly to the <code>description</code> column.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => onCancel?.()}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  )
}