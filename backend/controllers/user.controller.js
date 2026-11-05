import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { toISODateString } from "../utils/formatDate.js";

async function createStaff(req, res){

  const { email, password, role, firstName, middleName, lastName, contactNumber, birthdate } = req.body; 

  try{
    const { data: roleRecord, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("role_id")
      .eq("role_id", role)
      .in("role_id", ["admin", "staff", "billing_officer"])
      .maybeSingle();

    if (roleError) throw roleError;
    if (!roleRecord) {
      return res.status(400).json({ message: "Invalid firm user role" });
    }

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

    const { error: userRoleError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        {
          user_id: data.user.id,
          role,
        },
        { onConflict: "user_id" }
      );

    if (userRoleError) throw userRoleError;
    
    return res.status(201).json(data)
  }catch(err){ 
    console.error(err); 
    return res.status(500).json({ message: err.message }); 
  }
}

async function updateUserRole(req, res) {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    const { data: roleRecord, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("role_id")
      .eq("role_id", role)
      .in("role_id", ["admin", "staff", "billing_officer"])
      .maybeSingle();

    if (roleError) throw roleError;
    if (!roleRecord) {
      return res.status(400).json({ message: "Invalid firm user role" });
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });

    if (error) throw error;
    return res.status(200).json({ userId, role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

export { 
  createStaff,
  updateUserRole
}