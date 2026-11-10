import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/config/queryKeys"

import {
  getUsers,
  updateUser,
  updateUserRole,
  updateUserStatus,
  createStaff,
  fetchFirmRoles,
  changeOwnPassword,
} from "@/services/api/userAPI"

export function useChangeOwnPassword() {
  return useMutation({ mutationFn: changeOwnPassword })
}

export function useFetchUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: getUsers,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60
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
        old.map((u) =>
          u.id === updatedUser.id
            ? { ...u, ...updatedUser, role: updatedUser.role || u.role }
            : u
        )
      )
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: ({ id, role }) => {
      queryClient.setQueryData(queryKeys.users, (old = []) =>
        old.map((u) => (u.id === id ? { ...u, role } : u))
      )
    },
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
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