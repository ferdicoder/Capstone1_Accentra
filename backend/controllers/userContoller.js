import { insertUser } from "../models/userModel.js";
import createAuthUser from "../services/authService.js"

async function createUser(req, res) {
  if (!req?.body) {
    return res.status(400).json({
      status: 'Bad Request',
      message: 'Invalid Input'
    });
  }
  
  try {
    const { email, password, first_name, last_name, role_id } = req.body;

    // Create Supabase Auth user
    const { data: authData, error: authError } = await createAuthUser(email, password);
    if (authError) throw new Error(`Auth creation failed: ${authError.message}`);

    const userId = authData?.user?.id;
    if (!userId) throw new Error('Failed to get user ID from auth');

    // Insert into users table
    const { data: userData, error: userError } = await insertUser(userId, req.body);
    if (userError) throw new Error(`User insertion failed: ${userError.message}`);
    
    return res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: userData
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'User creation failed'
    });
  }
}

export{
  createUser
}