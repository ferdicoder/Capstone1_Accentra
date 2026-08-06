import { supabase } from '../config/supabase.js';
import { setUserRole } from './userAPI.js';
import toISODateString from '@/utils/formatDate.js';

/**
 * fix: every role can login to every auth routes signins
 */
async function signinUser(email, password){
  try{
      const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    }); 
    if(error) throw new Error(error.message)

    const role = await setUserRole(data.user);
    console.log("Login Successful"); 
    return { data, role }; 

    }catch(err){
      console.error(err); 
      throw err;
    }
}

/*
  add: password hashing
*/
async function registerClient(formData) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        first_name: formData.firstName, 
        last_name: formData.lastName, 
        middle_name: formData.middleName,
        birth_date: toISODateString(formData.birthDate),
        contact_no: formData.contactNumber,
        business_name: formData.businessName,
        business_type: formData.businessType,
        tin_no: formData.tin,
        industry: formData.industry,
        address: formData.address
      }
    }
  });

  if (authError) return { data: null, error: authError.message };
  if (!authData.user) return { data: null, error: 'No user returned from signUp' };

  return { data: authData, error: null };
}

/* will be added: after admin UI is done

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

async function insertUser(userId, formData){
   const { data: userData , error: insertError } = await supabase
    .from("users")
    .insert({
      user_id: userId, 
      ...formData
    })
    .select();
  if(insertError) return { insertError: insertError.message }

  return { userData }
}


async function createStaff(email, password, formData){
  const { data: authData, error: authError } = await sbAdmin.auth.admin.createUser({
    email: email,
    password: password, 
    app_metadata: { role: "staff" },
    email_confirm: true
  })
  if(authError) return { authError: Autherror.message }; 

  const userId = authData.user?.id;
  if(!userId) return { authData: null, authError: authError.message }; 

  const user = await insertUser(userId, formData); 
  if(user.insertError) return { error: user.insertError }

  console.log('Staff created successfully'); 
  return { authData, data: user.userData }; 
}
*/

export{
  registerClient, 
  signinUser
}