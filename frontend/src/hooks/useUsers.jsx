import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsers, updateUser, updateUserStatus, createStaff} from "@/services/api/userAPI"


export function useFetchUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  })
}

// 
export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUser, 
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["users"], (old = []) =>
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
      queryClient.setQueryData(["users"], (old = []) => [...old, newUser] )
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUserStatus, 
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["users"] })
      const previous = queryClient.getQueryData(["users"])
      queryClient.setQueryData(["users"], (old = []) =>
        old.map((u) => (u.id === id ? { ...u, status } : u))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["users"], context.previous)
    },
  })
}

