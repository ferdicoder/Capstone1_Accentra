import { createClient } from '@supabase/supabase-js'

export const supabase = createClient( import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,{
   auth:{
    flowType: 'pkce', 
    detectSessionInUrl: true
  }
});



// export const sbAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
