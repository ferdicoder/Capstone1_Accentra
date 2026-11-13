import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deleteFirmLogoFile,
  getFirmSettings,
  updateFirmSettings,
  uploadFirmLogo,
} from "@/services/api/firmSettingsAPI"
import { queryKeys } from "@/config/queryKeys"

export function useFetchFirmSettings({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.firmSettings,
    queryFn: getFirmSettings,
    enabled,
  })
}

export function useUpdateFirmSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateFirmSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.firmSettings }),
  })
}

export function useUploadFirmLogo() {
  return useMutation({ mutationFn: uploadFirmLogo })
}

export function useDeleteFirmLogoFile() {
  return useMutation({
    mutationFn: ({ storageKey, fileId }) => deleteFirmLogoFile(storageKey, fileId),
  })
}
