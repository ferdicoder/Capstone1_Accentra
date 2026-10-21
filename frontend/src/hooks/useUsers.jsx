import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/config/queryKeys"

import {
  getUsers,
  updateUser,
  updateUserStatus,
  createStaff,
  fetchFirmRoles
} from "@/services/api/userAPI"
import { fetchUserBirthdays, saveUserBirthday } from "@/lib/userBirthday"


export function useFetchUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: getUsers,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60
  })
}

// Birthdays live in the users table but are not part of the user list query.
export function useUserBirthdays(userIds = []) {
  return useQuery({
    queryKey: queryKeys.userBirthdays(userIds),
    queryFn: () => fetchUserBirthdays(userIds),
    enabled: userIds.length > 0,
    staleTime: 1000 * 60,
  })
}

export function useSaveUserBirthday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveUserBirthday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useFetchFirmRoles() {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: fetchFirmRoles,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
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

