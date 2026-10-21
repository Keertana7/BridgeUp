import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn clearly in development so the developer knows to fill in .env
  console.warn(
    '[BridgeUp] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set in .env. ' +
      'Authentication will not work until these are configured.'
  );
}

// Creates a Supabase client using only the public anon key.
// The service-role key is never used on the frontend.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
