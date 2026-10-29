import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBilling, createPayment, getBilling, getBillings, getBusinessBillings, updateBillingStatus, updatePaymentStatus, uploadPaymentProof } from "@/services/api/billingAPI"
import { queryKeys } from "@/config/queryKeys"

export const useFetchBillings = ({ enabled = true } = {}) => useQuery({
   queryKey: queryKeys.billings, 
   queryFn: getBillings,
   enabled
})

export const useFetchBilling = (id) => useQuery({ 
  queryKey: queryKeys.billing(id), 
  queryFn: () => getBilling(id), 
  enabled: !!id 
})

export const useFetchBusinessBillings = (businessId) => useQuery({ 
  queryKey: queryKeys.businessBillings(businessId), 
  queryFn: () => getBusinessBillings(businessId), 
  enabled: !!businessId 
})


export function useCreateBilling() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBilling,
    onSuccess: () => qc.invalidateQueries({
      queryKey: queryKeys.billings
    })
  })
}

export function useUpdateBillingStatus() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: updateBillingStatus, 
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: queryKeys.billings }); 
      qc.invalidateQueries({ queryKey: queryKeys.billing }); 
    } 
  })
}
export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: createPayment, 
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: queryKeys.billing(vars.billingId) }); qc.invalidateQueries({ queryKey: queryKeys.billings }); qc.invalidateQueries({ queryKey: queryKeys.businessBillings }) } })
}
export function useUpdatePaymentStatus() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: updatePaymentStatus, 
    onSuccess: (_, vars) => { 
        qc.invalidateQueries({ queryKey: queryKeys.billing(vars.billingId) }); 
        qc.invalidateQueries({ queryKey: queryKeys.billings }) 
      } 
    })
}
export function useUploadPaymentProof() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, billingId, paymentMethod, uploadedBy }) => uploadPaymentProof(file, billingId, paymentMethod, uploadedBy),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.billing(vars.billingId) })
      qc.invalidateQueries({ queryKey: queryKeys.billings })
      qc.invalidateQueries({ queryKey: queryKeys.businessBillings })
    },
  })
}
