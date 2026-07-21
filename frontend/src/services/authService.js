import { supabase, sbAdmin } from "../config/supabase.js";

async function signinClient(email, password){
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
    app_metadata: { role: "client" }
  }); 
  if(error){
    console.log(`Error: ${error.message}`)
    return { error }
  }
  
  console.log("Login Successful"); 
  return { data }; 
}

async function signinStaff(email, password){
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
    app_metadata: { role: "staff" }
  }); 
  if(error){
    console.log(`Error: ${error.message}`)
    return { error }
  }
  
  console.log("Login Successful"); 
  return { data }; 
}

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
  if(!userId) return { authData: null, authError: authError.message }; 
  
  const user = await insertUser(userId, profile); 
  if(user.insertError) return { error: user.insertError }

  return { authData, data: user.userData  };
}


async function insertUser(userId, profile){
   const { data: userData , error: insertError } = await supabase
    .from("users")
    .insert({
      user_id: userId, 
      ...profile
    })
    .select();
  if(insertError) return { insertError: insertError.message }

  return { userData }
}



async function createStaff(email, password, profile){
  const { data: authData, error: authError } = await sbAdmin.auth.admin.createUser({
    email: email,
    password: password, 
    app_metadata: { role: "staff" },
    email_confirm: true
  })
  if(authError) return { authError: Autherror.message }; 

  const userId = authData.user?.id;
  if(!userId) return { authData: null, authError: authError.message }; 

  const user = await insertUser(userId, profile); 
  if(user.insertError) return { error: user.insertError }

  console.log('Staff created successfully'); 
  return { authData, data: user.userData }; 
}

export{
  registerClient, 
  signinClient,
  createStaff
}