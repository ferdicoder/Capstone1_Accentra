import { supabase } from "@/config/supabase";
import { authStore } from "@/store/authStore";

async function setUserRole(user) {
  const { data: roleData, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (error) {
    authStore.getState().clearAuth();
    return null;
  }

  authStore.getState().setAuth(user, roleData.role);
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
async function getUsers() {
  const { data, error } = await supabase
    .from("users")
    .select(`
      user_id, email, contact_no, first_name, middle_name, last_name,
      status, user_roles(role)
    `)
  if (error) throw error

  return (data ?? []).map((row) => {
    const roleEntry = Array.isArray(row.user_roles) ? row.user_roles[0] : row.user_roles
    return mapUserRow(row, roleEntry?.role)
  })
}

/**
 * 
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
  return mapUserRow(data, user.role) // role isn't in this update, so carry it over
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

export{
  setUserRole,
  getUsers, 
  updateUser,
  updateUserStatus
}