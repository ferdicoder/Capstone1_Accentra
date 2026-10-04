const roles = {
  client:          { portal: "client", home: "/client/dashboard" },
  admin:           { portal: "firm",   home: "/admin/dashboard" },
  staff:           { portal: "firm",   home: "/firm/dashboard" },
  billing_officer: { portal: "firm",   home: "/billing-officer/dashboard" },
}

const signinPath = {
  client: "/client/signin",
  firm: "/firm/signin",
}

const getHome = (role) => roles[role]?.home
const canUsePortal = (portal, role) => roles[role]?.portal === portal


export{
  roles,
  signinPath,
  getHome,
  canUsePortal
}