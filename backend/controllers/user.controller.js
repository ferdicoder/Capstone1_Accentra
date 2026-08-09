import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { toISODateString } from "../utils/formatDate.js";

async function createStaff(req, res){

  const { email, password, role, firstName, middleName, lastName, contactNumber, birthdate } = req.body; 

  try{
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      app_metadata: {
        role: role
      },
      user_metadata: {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName, 
        contact_no: contactNumber,
        birth_date: toISODateString(birthdate)
      }, 
      email_confirm: true
    });
    if(error) throw Error(error.message);
    
    return res.status(201).json(data)
  }catch(err){ 
    console.error(err); 
    return res.status(500).json({ message: err.message }); 
  }
}

export { 
  createStaff
}