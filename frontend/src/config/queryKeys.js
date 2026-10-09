// TODO: stale time ng mga data base sa relevancy
export const queryKeys = {
  users: ["users"],
  services: ["services"],
  roles: ["roles"],
  businesses: ["businesses"],
  clientsSearch: (query) => ["clients", "search", query],
  serviceRequests: ["serviceRequests"],
  myServiceRequests: (businessId) => ["serviceRequests", businessId],
  myBusiness: (userId) => ["business", "me", userId],
  engagements: ["engagements"],
  engagementSummaries: ["engagements", "summary"],
  myEngagements: (businessId) => ["engagements", businessId],
  engagement: (id) => ["engagements", id],
  engagementSummary: (id) => ["engagements", id, "summary"],
  engagementActivity: (engagementId) => ["engagementActivity", engagementId],
  engagementDocuments: (engagementId) => ["engagementDocuments", engagementId],
}