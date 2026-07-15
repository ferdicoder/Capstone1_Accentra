import { supabase } from "../config/supabase.js";


async function insertUser(userId, userData) {
  const { role_id, first_name, last_name, email, middle_name, birthdate, contact_no, business_id } = userData;
  
  const { data, error } = await supabase
    .from("users")
    .insert({
      user_id: userId,
      role_id: Number(role_id),
      first_name,
      last_name,
      email,
      middle_name: middle_name || null,
      birthdate: birthdate || null,
      contact_no: contact_no || null,
      business_id: business_id || null,
    });

  return { data, error };
}

export {
  insertUser
}