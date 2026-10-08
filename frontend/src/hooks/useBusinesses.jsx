import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getBusinesses,
  getMyBusiness,
  updateBusinessType,
  updateMyBusiness,
} from "@/services/api/businessAPI"
import { queryKeys } from "@/config/queryKeys"

export function useFetchBusinesses() {
  return useQuery({
    queryKey: queryKeys.businesses,
    queryFn: getBusinesses,
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
