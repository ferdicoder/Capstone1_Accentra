import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { toISODateString } from "../utils/formatDate.js";

async function createStaff(req, res){
  try{
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: req.body.email,
      password: req.body.password,
      app_metadata: {
        role: req.body.role
      },
      user_metadata: {
        first_name: req.body.firstName,
        middle_name: req.body.middleName,
        last_name: req.body.lastName, 
        contact_no: req.body.contactNumber,
        birth_date: toISODateString(req.body.birthdate)
      }, 
      email_confirm: true
    });
    if(error) throw error;
    
    return res.status(201).json(data)
  }catch(err){ 
    console.error(err); 
    return res.sendStatus(500); 
  }
}

export { 
  createStaff
}