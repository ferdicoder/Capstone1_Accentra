// TODO: stale time ng mga data base sa relevancy
export const queryKeys = {
  users: ["users"],
  services: ["services"],
  roles: ["roles"],
  serviceRequests: ["serviceRequests"],
  myServiceRequests: (businessId) => ["serviceRequests", businessId],
  myBusiness: (userId) => ["business", "me", userId],
}