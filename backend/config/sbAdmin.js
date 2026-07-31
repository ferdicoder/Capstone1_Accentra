import { createClient } from '@supabase/supabase-js'

import 'dotenv/config'; 

export const sbAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
