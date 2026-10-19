import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars are missing we still export a supabase object so the app can
// render. Auth calls will fail gracefully and show an error message rather
// than crashing the whole page with a blank screen.
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/** True when the required env vars are present */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
