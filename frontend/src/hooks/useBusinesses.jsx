import { useQuery } from "@tanstack/react-query"
import { getMyBusiness } from "@/services/api/businessAPI"
import { queryKeys } from "@/config/queryKeys"

export function useFetchMyBusiness(userId) {
  return useQuery({
    queryKey: queryKeys.myBusiness(userId),
    queryFn: () => getMyBusiness(userId),
    enabled: !!userId,
  })
}