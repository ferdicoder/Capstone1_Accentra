// Who leads an engagement. VERIFY the field names against your API.
export const getEngagementLeadId = (engagement) =>
  engagement.leadId ??
  engagement.lead_id ??
  engagement.assignedStaff?.id ??
  engagement.assignedStaff ??
  null

export const isLedBy = (engagement, userId) => {
  const leadId = getEngagementLeadId(engagement)
  return userId != null && leadId != null && String(leadId) === String(userId)
}