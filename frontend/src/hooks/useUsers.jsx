import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/config/queryKeys"

import { 
  getUsers, 
  updateUser, 
  updateUserStatus, 
  createStaff,
  fetchRoleOptions
} from "@/services/api/userAPI"


export function useFetchUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: getUsers,
  })
}

export function useFetchRoleOptions() {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: fetchRoleOptions,
    staleTime: 5 * 60 * 1000
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUser, 
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.users, (old = []) =>
        old.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      )
    },
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createStaff, 
    onSuccess: (newUser) => {
      queryClient.setQueryData(queryKeys.users, (old = []) => [...old, newUser] )
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUserStatus, 
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users })
      const previous = queryClient.getQueryData(queryKeys.users)
      queryClient.setQueryData(queryKeys.users, (old = []) =>
        old.map((u) => (u.id === id ? { ...u, status } : u))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKeys.users, context.previous)
    },
  })
}


