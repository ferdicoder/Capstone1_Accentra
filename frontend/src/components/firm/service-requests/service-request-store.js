import { create } from "zustand"

import { mockServiceRequests } from "./service-request-variants"

/**
 * Mock store shared by the list and detail views so approve/reject from the
 * modal is reflected back in the list. Swap with a real API call later.
 */
export const serviceRequestStore = create((set) => ({
  requests: mockServiceRequests,
  setRequestStatus: (id, status) =>
    set((state) => ({
      requests: state.requests.map((request) =>
        request.id === id ? { ...request, status } : request
      ),
    })),
}))
