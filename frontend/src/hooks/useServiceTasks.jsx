import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/config/queryKeys"
import { getServiceTemplateTasks } from "@/services/api/serviceAPI"

export function useFetchServiceTasks(serviceId) {
  return useQuery({
    queryKey: queryKeys.serviceTasks(serviceId),
    queryFn: () => getServiceTemplateTasks(serviceId),
    enabled: !!serviceId,
  })
}
