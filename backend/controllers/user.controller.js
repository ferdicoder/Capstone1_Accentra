import { supabaseAdmin } from "../config/supabaseAdmin";

async function createStaff(req, res){
  try{
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: req.body.email,
      password: req.body.password,
      app_metadata: {
        role: 'staff'
      },
      user_metadata: {
        first_name: req.body.firstName,
        middle_name: req.body.middleName,
        last_name: req.body.middleName, 
        contact_no: req.body.contactNumber,
        birth_date: toISODateString(req.body.birthDate)
      }, 
      email_confirm: true
    });
    if(error) throw error;
    
    return data 
  }catch(err){ 
    console.error(err); 
    return res.sendStatus(500); 
  }
}