import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'; 

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);


export { supabaseAdmin }
