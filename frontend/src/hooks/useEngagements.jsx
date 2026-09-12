import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getEngagements,
  getMyEngagements,
  getEngagement,
  createEngagementFromRequest,
  updateEngagementStatus,
  toggleEngagementTask,
} from "@/services/api/engagementAPI"
import { queryKeys } from "@/config/queryKeys"

export function useFetchEngagements() {
  return useQuery({
    queryKey: queryKeys.engagements,
    queryFn: getEngagements,
  })
}

export function useFetchMyEngagements(businessId) {
  return useQuery({
    queryKey: queryKeys.myEngagements(businessId),
    queryFn: () => getMyEngagements(businessId),
    enabled: !!businessId,
  })
}

export function useFetchEngagement(id) {
  return useQuery({
    queryKey: queryKeys.engagement(id),
    queryFn: () => getEngagement(id),
    enabled: !!id,
  })
}

export function useCreateEngagementFromRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEngagementFromRequest,
    onSuccess: (newEngagement) => {
      queryClient.setQueryData(queryKeys.engagements, (old = []) => [newEngagement, ...old])
      // The originating service_request flipped to "approved" server-side — refresh that list too.
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceRequests })
    },
  })
}

export function useUpdateEngagementStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEngagementStatus,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.engagements, (old = []) =>
        old.map((e) => (e.id === updated.id ? updated : e))
      )
      queryClient.setQueryData(queryKeys.engagement(updated.id), updated)
    },
  })
}

export function useToggleEngagementTask(engagementId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleEngagementTask,
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(queryKeys.engagement(engagementId), (old) =>
        old
          ? { ...old, tasks: old.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)) }
          : old
      )
    },
  })
}