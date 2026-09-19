import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getEngagements,
  getMyEngagements,
  getEngagement,
  createEngagementFromRequest,
  updateEngagementStatus,
  setTaskCompleted,
  reviewEngagementTask,
  createEngagementTask,
  updateEngagementTask,
  updateEngagementTaskDeadline,
  getEngagementActivity,
} from "@/services/api/engagementAPI"
import {
  getEngagementDocuments,
  uploadEngagementDocument,
  deleteEngagementDocument,
} from "@/services/api/documentAPI"
import { queryKeys } from "@/config/queryKeys"

export function useFetchEngagements() {
  return useQuery({ queryKey: queryKeys.engagements, queryFn: getEngagements })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceRequests })
    },
  })
}

export function useUpdateEngagementStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEngagementStatus,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.engagements, (old = []) => old.map((e) => (e.id === updated.id ? updated : e)))
      queryClient.setQueryData(queryKeys.engagement(updated.id), updated)
    },
  })
}

function patchTaskInCache(queryClient, engagementId, updatedTask) {
  queryClient.setQueryData(queryKeys.engagement(engagementId), (old) =>
    old ? { ...old, tasks: old.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)) } : old
  )
}

export function useSetTaskCompleted(engagementId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setTaskCompleted,
    onSuccess: (updatedTask) => patchTaskInCache(queryClient, engagementId, updatedTask),
  })
}

export function useReviewEngagementTask(engagementId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reviewEngagementTask,
    onSuccess: (updatedTask) => patchTaskInCache(queryClient, engagementId, updatedTask),
  })
}

export function useCreateEngagementTask(engagementId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEngagementTask,
    onSuccess: (newTask) => {
      queryClient.setQueryData(queryKeys.engagement(engagementId), (old) =>
        old ? { ...old, tasks: [...old.tasks, newTask] } : old
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.engagementActivity(engagementId) })
    },
  })
}

export function useUpdateEngagementTask(engagementId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEngagementTask,
    onSuccess: (updatedTask) => patchTaskInCache(queryClient, engagementId, updatedTask),
  })
}

export function useUpdateEngagementTaskDeadline(engagementId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEngagementTaskDeadline,
    onSuccess: (updatedTask) => patchTaskInCache(queryClient, engagementId, updatedTask),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.engagement(engagementId) })
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