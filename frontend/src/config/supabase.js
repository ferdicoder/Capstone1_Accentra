import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'; 

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);

export const sbAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
   auth:{
    flowType: 'pkce', 
    detectSessionInUrl: true
  }
});