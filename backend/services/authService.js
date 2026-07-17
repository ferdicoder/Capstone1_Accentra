import { supabase } from "../config/supabase.js";

/*
  fix: orphaned state of auth creation before insertion
    if auth created and the insertion failed the user is basically registered
  leave for testing 
*/
async function registerClient(email, password, profile) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });
  if(authError) return { authData: null, error: authError.message }; 
   
  const userId = authData.user?.id; 
  const { data: userData , error: insertError } = await supabase
    .from("users")
    .insert({
      user_id: userId, 
      ...profile
    });
  if(insertError) return { userData: null, error: insertError.message }
  
  return { data: userData, error: insertError.message };
}

/*
async function signInUser(email, password, profile){
  const { data, error } = await supabase.auth.signInWithPassword({
    email, 
    password
  }); 

  return {data, error}
}

async function insertUser(userId, userData) {
  const { role_id, first_name, last_name, email, middle_name, birthdate, contact_no, business_id } = userData;
  
  const { data , error } = await supabase
    .from("users")
    .insert({
      user_id: userId,
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
*/

export{
  registerClient
}