import { supabase } from "../config/supabase.js";

export default async function createAuthUser(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { data, error };
}
