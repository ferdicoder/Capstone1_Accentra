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

async function signinClient(email, password){
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  }); 
  if(error){
    console.log(`Error: ${error.message}`)
    return { error }
  }
  
  console.log("Login Successful"); 
  return { data }; 
}


export{
  registerClient, 
  signinClient
}