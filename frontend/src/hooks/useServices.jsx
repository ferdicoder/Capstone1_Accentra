import { queryKeys } from "@/config/queryKeys";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getServices,
  createService,
  updateService,
  updateServiceStatus,
  deleteService,
} from "@/services/api/serviceAPI"

export function useFetchServices() {
  return useQuery({
    queryKey: queryKeys.services,
    queryFn: getServices,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createService,
    onSuccess: (newService) => {
      queryClient.setQueryData(queryKeys.services, (old = []) => [newService, ...old])
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateService,
    onSuccess: (updatedService) => {
      queryClient.setQueryData(queryKeys.services, (old = []) =>
        old.map((s) => (s.id === updatedService.id ? updatedService : s))
      )
    },
  })
}

export function useToggleServiceStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateServiceStatus,
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.services })
      const previous = queryClient.getQueryData(queryKeys.services)
      queryClient.setQueryData(queryKeys.services, (old = []) =>
        old.map((s) => (s.id === id ? { ...s, status } : s))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKeys.services, context.previous)
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteService,
    onSuccess: (deletedId) => {
      queryClient.setQueryData(queryKeys.services, (old = []) =>
        old.filter((s) => s.id !== deletedId)
      )
    },
  })
}