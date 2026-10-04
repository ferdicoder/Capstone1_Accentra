import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getMyBusiness, updateMyBusiness } from "@/services/api/businessAPI"
import { queryKeys } from "@/config/queryKeys"

export function useFetchMyBusiness(userId) {
  return useQuery({
    queryKey: queryKeys.myBusiness(userId),
    queryFn: () => getMyBusiness(userId),
    enabled: !!userId,
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