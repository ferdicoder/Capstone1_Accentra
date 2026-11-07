// Returns an async function: (clientId) => Promise<UnpaidBill[]>
//
// Firm Staff has no billing access, so this cannot reuse useFetchBillings.
// TODO (Ced): add a read-only endpoint available to Firm Staff, e.g.
//   GET /api/clients/:clientId/unpaid-bills
// returning only { id, invoice_type, amount, due_date, status } for bills that
// are not paid, cancelled or refunded (see backend-reference/hasOutstandingBill.js).
// Then replace the body below with the real call.
//
// Until then it returns [], so the warning dialog never appears for Staff.
export function useUnpaidBillsLookup() {
  return async () => []
}