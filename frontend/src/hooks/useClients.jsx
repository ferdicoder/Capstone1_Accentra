import { useMemo } from "react"

import { useFetchEngagements } from "@/hooks/useEngagements"
import { useFetchServiceRequests } from "@/hooks/useServiceRequests"
import { clientStore } from "@/components/firm/clients/client-store"
import {
  deriveClients,
  getClientEngagements,
} from "@/components/firm/clients/client-variants"

/**
 * Firm-side client records, derived from the existing engagement and service
 * request queries (no separate client dataset) plus local Admin edits.
 */
export function useFetchClients() {
  const engagementsQuery = useFetchEngagements()
  const requestsQuery = useFetchServiceRequests()
  const overrides = clientStore((state) => state.overrides)

  const engagements = engagementsQuery.data
  const serviceRequests = requestsQuery.data

  const clients = useMemo(
    () => deriveClients({ engagements, serviceRequests, overrides }),
    [engagements, serviceRequests, overrides]
  )

  return {
    clients,
    engagements: engagements ?? [],
    isLoading: engagementsQuery.isLoading || requestsQuery.isLoading,
    error: engagementsQuery.error || requestsQuery.error,
  }
}

/** One client resolved from the route param, plus that client's engagement history. */
export function useFetchClient(id) {
  const { clients, engagements, isLoading, error } = useFetchClients()

  const client = useMemo(() => clients.find((item) => item.id === id) ?? null, [clients, id])
  const history = useMemo(() => getClientEngagements(engagements, id), [engagements, id])

  return { client, history, isLoading, error }
}
