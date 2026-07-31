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


export{
  setUserRole
}