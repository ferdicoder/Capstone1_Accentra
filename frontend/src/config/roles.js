const roles = {
  client:          { portal: "client", home: "/client/dashboard", can: ["view_engagements", "view_billing"] },
  admin:           { portal: "firm",   home: "/admin/dashboard", can: ["manage_engagements", "cancel_engagement", "manage_billing"] },
  staff:           { portal: "firm",   home: "/firm/dashboard", can: ["manage_engagements"] },
  billing_officer: { portal: "firm",   home: "/billing-officer/dashboard", can: ["view_engagements", "manage_billing"] },
}

const signinPath = {
  client: "/client/signin",
  firm: "/firm/signin",
}


const getHome = (role) => roles[role]?.home
const canUsePortal = (portal, role) => roles[role]?.portal === portal
const can = (role, permission) => roles[role]?.can.includes(permission) ?? false

export{
  roles,
  signinPath,
  getHome,
  canUsePortal,
  can
}