import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/config/queryKeys"
import { getServiceCategories } from "@/services/api/serviceCategoryAPI"

export function useFetchServiceCategories({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.serviceCategories,
    queryFn: getServiceCategories,
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}
