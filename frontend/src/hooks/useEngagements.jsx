import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getEngagements,
  getMyEngagements,
  getEngagement,
  createEngagementFromRequest,
  updateEngagementStatus,
  toggleEngagementTask,
  getEngagementActivity,
} from "@/services/api/engagementAPI"
import {
  getEngagementDocuments,
  uploadEngagementDocument,
  deleteEngagementDocument,
} from "@/services/api/documentAPI"
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

export function useFetchEngagementActivity(engagementId) {
  return useQuery({
    queryKey: queryKeys.engagementActivity(engagementId),
    queryFn: () => getEngagementActivity(engagementId),
    enabled: !!engagementId,
  })
}

export function useFetchEngagementDocuments(engagementId) {
  return useQuery({
    queryKey: queryKeys.engagementDocuments(engagementId),
    queryFn: () => getEngagementDocuments(engagementId),
    enabled: !!engagementId,
  })
}

export function useUploadEngagementDocument(engagementId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadEngagementDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engagementDocuments(engagementId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.engagementActivity(engagementId) })
    },
  })
}

export function useDeleteEngagementDocument(engagementId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEngagementDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engagementDocuments(engagementId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.engagementActivity(engagementId) })
    },
  })
}