import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getMyProfile, updateMyProfile } from "@/services/api/myProfileAPI"
import { queryKeys } from "@/config/queryKeys"

// Move this into @/config/queryKeys if you prefer all keys in one place.
const myProfileKey = (userId) => ["myProfile", userId]

export function useFetchMyProfile(userId) {
  return useQuery({
    queryKey: myProfileKey(userId),
    queryFn: () => getMyProfile(userId),
    enabled: Boolean(userId),
  })
}

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updatedProfile, variables) => {
      // Use the row the server returned so the cache is never stale.
      qc.setQueryData(myProfileKey(variables.userId), updatedProfile)
      // Keep the Teams list in sync for the Admin view.
      qc.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}