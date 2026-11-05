import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getBusinesses,
  searchClients,
  getMyBusiness,
  updateBusinessType,
  updateMyBusiness,
} from "@/services/api/businessAPI"
import { updateClientStatus } from "@/services/api/userAPI"
import { queryKeys } from "@/config/queryKeys"

export function useFetchBusinesses({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.businesses,
    queryFn: getBusinesses,
    staleTime: 1000 * 30,
    enabled,
  })
}

export function useSearchClients(query) {
  const normalizedQuery = query.trim()

  return useQuery({
    queryKey: queryKeys.clientsSearch(normalizedQuery),
    queryFn: () => searchClients(normalizedQuery),
    enabled: normalizedQuery.length >= 2,
    staleTime: 1000 * 30,
  })
}

export function useFetchMyBusiness(userId) {
  return useQuery({
    queryKey: queryKeys.myBusiness(userId),
    queryFn: () => getMyBusiness(userId),
    enabled: !!userId,
  })
}

export function useUpdateBusinessType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateBusinessType,
    onSuccess: (updatedBusiness) => {
      queryClient.setQueryData(queryKeys.businesses, (businesses = []) =>
        businesses.map((business) =>
          business.id === updatedBusiness.id ? updatedBusiness : business
        )
      )
    },
  })
}

export function useUpdateMyBusiness(userId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMyBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myBusiness(userId) })
    },
  })
}

export function useToggleClientStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateClientStatus,
    onSuccess: ({ ownerId, status }) => {
      queryClient.setQueryData(queryKeys.businesses, (businesses = []) =>
        businesses.map((business) =>
          business.ownerId === ownerId ? { ...business, ownerStatus: status } : business
        )
      )
    },
  })
}
