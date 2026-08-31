import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getServiceRequests,
  getMyServiceRequests,
  createServiceRequest,
  updateServiceRequestStatus,
  cancelServiceRequest,
} from "@/services/api/serviceRequestAPI"
import { queryKeys } from "@/config/queryKeys.js"

// Firm side
export function useFetchServiceRequests() {
  return useQuery({
    queryKey: queryKeys.serviceRequests,
    queryFn: getServiceRequests,
  })
}

// Client side — scoped, so businessId is part of the key
export function useFetchMyServiceRequests(businessId) {
  return useQuery({
    queryKey: ["serviceRequests", businessId],
    queryFn: () => getMyServiceRequests(businessId),
    enabled: !!businessId,
  })
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createServiceRequest,
    onSuccess: () => {
      // Two possible cache slots (firm's full list, client's scoped list) —
      // invalidate rather than manually splice both.
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceRequests })
    },
  })
}

export function useUpdateServiceRequestStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateServiceRequestStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceRequests })
    },
  })
}

export function useCancelServiceRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceRequests })
    },
  })
}