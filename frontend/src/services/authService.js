import { supabase } from '../config/supabase.js';
import { setUserRole } from './api/userAPI.js';
import toISODateString from '@/utils/formatDate.js';
import { canUsePortal } from '@/config/roles.js';
import { authStore } from '@/store/authStore';

export async function signinToPortal(portal, email, password) {
  const result = await signinUser(email, password)
  if (result?.error) throw new Error("The email or password you entered is incorrect.")

  if (!canUsePortal(portal, result.role)) {
    await supabase.auth.signOut()
    authStore.getState().clearAuth()
    throw new Error("Invalid credentials please try again.")
  }

  authStore.getState().setAuth(result.data.user, result.role)
  return result
}

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

    const role = await setUserRole(data.user, false);
    if (!role) {
      throw new Error("Your account does not have a valid firm role assigned.")
    }
    console.log("Login Successful"); 
    return { data, role }; 

    }catch(err){
      console.error(err); 
      throw err;
    }
}

/**
 * Number of digits in the recovery code that is emailed to the account owner.
 *
 * Matches the length the app already uses for its OTP step (see
 * components/client/ForgotPasswordModal.jsx) and Supabase Auth's 6-digit
 * email OTP.
 */
const PASSWORD_RECOVERY_OTP_LENGTH = 6
const PASSWORD_REUSE_MESSAGE = "This password has already been used. Try another."

function getPasswordReuseMessage(error) {
  const message = `${error?.code ?? ""} ${error?.message ?? ""}`
  return /password.{0,40}(reuse|used before|previous|same as|different from old)|(?:reuse|used before|previous).{0,40}password/i.test(
    message
  )
    ? PASSWORD_REUSE_MESSAGE
    : null
}

/**
 * Asks Supabase Auth to email a recovery code to the given address.
 *
 * The response is intentionally not used to tell the caller whether the
 * address is registered — the caller must show the same confirmation either
 * way.
 *
 * @param {{ email: string, redirectTo?: string }} params
 * @returns {Promise<void>}
 */
async function requestPasswordRecovery({ email, redirectTo }) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    redirectTo ? { redirectTo } : undefined
  )
  if (error) throw error
}

/**
 * Verifies the emailed recovery code and opens a recovery session.
 *
 * @param {{ email: string, token: string }} params
 * @returns {Promise<void>}
 */
async function verifyPasswordRecoveryOtp({ email, token }) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  })
  if (error) throw error
}

/**
 * Sets the new password for the account that owns the recovery session.
 *
 * @param {{ password: string }} params
 * @returns {Promise<void>}
 */
async function updateRecoveredPassword({ password }) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

async function changeAuthenticatedPassword({ currentPassword, newPassword }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user?.email) throw new Error("No authenticated account was found.")

  const { error: verificationError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verificationError) {
    if (
      verificationError.code === "invalid_credentials" ||
      verificationError.message === "Invalid login credentials"
    ) {
      throw new Error("Current password is incorrect.")
    }
    throw verificationError
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (updateError) throw updateError
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
        house_no: formData.houseNo,
        street: formData.streetName,
        barangay: formData.barangay, 
        district: formData.district, 
        city: formData.city,
        zip_code: formData.zipCode
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
  signinUser,
  PASSWORD_RECOVERY_OTP_LENGTH,
  requestPasswordRecovery,
  verifyPasswordRecoveryOtp,
  updateRecoveredPassword,
  changeAuthenticatedPassword,
  getPasswordReuseMessage
}