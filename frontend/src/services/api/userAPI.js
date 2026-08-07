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

/**
 * to be refactor later: 
 * - slice to paginate in FE
 * - admin and staff only
 */
async function getUsers(){
  const { data, error } = await supabase
    .from('users')
    .select(`
      user_id,
      email,
      contact_no,
      first_name, 
      middle_name, 
      last_name,
      status,
      user_roles(role)
    `)
  if(error) throw error; 

  return (data ?? []).map((user) => {
    const roleEntry = Array.isArray(user.user_roles) ? user.user_roles[0] : user.user_roles

    return {
      id: user.user_id,
      firstName: user.first_name ?? "",
      middleName: user.middle_name ?? "",
      lastName: user.last_name ?? "",
      name: [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" "), // fullname
      email: user.email ?? "",
      contactNumber: user.contact_no ?? "",
      role: roleEntry?.role ?? "",
      status: user.status ?? "inactive",
    }
  })

}

/**
 * 
 * refactor: update only changed fields 
 */
async function updateUser(user){
  const { data, error } = await supabase 
    .from('users')
    .update({
      first_name: user.firstName,
      middle_name: user.middleName,
      last_name: user.lastName,
      email: user.email,
      contact_no: user.contactNumber,
    })
    .eq('user_id', user.id)
    .select()
    .single()
  if(error) throw error; 
  
  return data
}

async function updateUserStatus({ id, status }){
  const { data, error } = await supabase 
    .from('users')
    .update({ status: user.status })
    .eq('user_id', user.id)
    .select()
    .single()
  if(error) throw error; 
  
  return data
}

export{
  setUserRole,
  getUsers, 
  updateUser,
  updateUserStatus
}