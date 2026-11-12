import { supabase } from "@/config/supabase";
import { authStore } from "@/store/authStore";
import { apiBaseUrl } from "@/config/api";

async function authHeaders() {
  const { data: { session: currentSession }, error: sessionError } =
    await supabase.auth.getSession()
  if (sessionError) throw sessionError

  let session = currentSession
  const expiresSoon =
    session?.expires_at &&
    session.expires_at * 1000 <= Date.now() + 30_000

  if (!session || expiresSoon) {
    const { data: { session: refreshedSession }, error: refreshError } =
      await supabase.auth.refreshSession()
    if (refreshError) throw refreshError
    session = refreshedSession
  }

  if (!session?.access_token) {
    throw new Error("Your login session has expired. Please sign in again.")
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  }
}

async function parseError(response, fallback) {
  const body = await response.json().catch(() => null)
  return new Error(body?.message ?? body?.error ?? fallback)
}

async function setUserRole(user, persist = true) {
  const [{ data: roleData, error: roleError }, { data: userData, error: userError }] =
    await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("users")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle(),
    ])

  if (roleError || userError || userData?.status === "deactivated") {
    if (persist) authStore.getState().clearAuth();
    return null;
  }

  if (persist) authStore.getState().setAuth(user, roleData.role, userData?.status ?? "active");
  return roleData.role;
}

function mapUserRow(row, roleOverride) {
  return {
    id: row.user_id,
    firstName: row.first_name ?? "",
    middleName: row.middle_name ?? "",
    lastName: row.last_name ?? "",
    name: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" "),
    email: row.email ?? "",
    contactNumber: row.contact_no ?? "",
    role: roleOverride ?? row.user_roles?.role ?? "",
    status: row.status ?? "inactive",
  }
}

/**
 * to be refactor later:
 * - slice to paginate in FE
 * - admin and staff only
 */
const firmRoles = ['admin', 'staff', 'billing_officer']

async function getUsers() {
  const { data, error } = await supabase
    .from("users")
    .select(`
      user_id,
      email,
      contact_no,
      first_name,
      middle_name,
      last_name,
      status,
      user_roles!inner(role)
    `)
    .in("user_roles.role", firmRoles)
  if (error) throw error

  return (data ?? []).map((row) => {
    const roleEntry = Array.isArray(row.user_roles) ? row.user_roles[0] : row.user_roles
    return mapUserRow(row, roleEntry?.role)
  })
}

/**
 * Profile fields only. Role changes go through updateUserRole.
 * refactor: update only changed fields
 */
async function updateUser(user) {
  const { data, error } = await supabase
    .from("users")
    .update({
      first_name: user.firstName,
      middle_name: user.middleName,
      last_name: user.lastName,
      email: user.email,
      contact_no: user.contactNumber,
    })
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) throw error
  return mapUserRow(data, user.role)
}

async function updateUserRole({ id, role }) {
  const response = await fetch(`${apiBaseUrl}/staffs/${id}/role`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ role }),
  })

  if (!response.ok) throw await parseError(response, "User role update failed")
  return { id, role }
}

async function updateUserStatus({ id, status }) {
  const { data, error } = await supabase
    .from("users")
    .update({ status })
    .eq("user_id", id)
    .select()
    .single()

  if (error) throw error
  return mapUserRow(data)
}

async function updateClientStatus({ ownerId, status }) {
  const { data, error } = await supabase
    .from("users")
    .update({ status })
    .eq("user_id", ownerId)
    .select()
    .single()

  if (error) throw error
  return { ownerId: data.user_id, status: data.status }
}

function mapAuthUserRow(authUser, fallback = {}) {
  const meta = authUser.user_metadata ?? {}
  return {
    id: authUser.id,
    firstName: meta.first_name ?? fallback.firstName ?? "",
    middleName: meta.middle_name ?? fallback.middleName ?? "",
    lastName: meta.last_name ?? fallback.lastName ?? "",
    name: [meta.first_name, meta.middle_name, meta.last_name].filter(Boolean).join(" "),
    email: authUser.email ?? fallback.email ?? "",
    contactNumber: meta.contact_no ?? fallback.contactNumber ?? "",
    role: fallback.role ?? authUser.app_metadata?.role ?? "",
    status: "inactive", // new staff hasn't signed in yet
  }
}

// url from backend with postgrest wrapped in express
async function createStaff(user) {
  const response = await fetch(`${apiBaseUrl}/staffs/create`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      email: user.email,
      password: user.temporaryPassword,
      role: user.role,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      extension: user.extension,
      contactNumber: user.contactNumber,
      birthdate: user.birthdate,
    }),
  })

  if (!response.ok) throw await parseError(response, "Staff creation failed")

  const { user: createdUser } = await response.json()
  return mapAuthUserRow(createdUser, user)
}

async function fetchFirmRoles() {
  const { data, error } = await supabase
    .from("roles")
    .select("role_id, role_name, description")
    .in("role_id", firmRoles)
    .order("role_name")

  if (error) throw error
  return data
}

async function changeOwnPassword({ currentPassword, newPassword }) {
  const response = await fetch(`${apiBaseUrl}/staffs/password`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  })

  if (!response.ok) throw await parseError(response, "Password update failed")
  return response.json()
}

export {
  setUserRole,
  getUsers,
  updateUser,
  updateUserRole,
  updateUserStatus,
  updateClientStatus,
  createStaff,
  fetchFirmRoles,
  changeOwnPassword,
}