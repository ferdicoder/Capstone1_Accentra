import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getMyProfile, updateMyProfile } from "@/services/api/myProfileAPI"

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
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: myProfileKey(variables.userId) }),
  })
}