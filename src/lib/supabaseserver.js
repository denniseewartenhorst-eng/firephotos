// Server-side Supabase client used in API routes.
// We're using the anon key + custom auth (name+password in users table),
// and RLS is disabled in the schema for simplicity.
import { createClient } from '@supabase/supabase-js';

export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}
