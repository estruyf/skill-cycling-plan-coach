import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
  );
}

// Browser-only client. Session (from magic-link sign-in) is persisted to
// localStorage and read back from the URL hash on redirect by supabase-js
// itself (detectSessionInUrl), so no server-side auth callback route is needed.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
