import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is missing.\nCheck that your .env file exists in apps/backend and contains SUPABASE_URL=...');
}
if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY is missing.\nCheck that your .env file exists in apps/backend and contains SUPABASE_ANON_KEY=...');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 