import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public browser credentials only. Authorization is enforced by database RLS.
export const supabaseUrl = "https://ckgdktknigrrwkjfnkqm.supabase.co";
export const supabasePublicKey = "sb_publishable_Z_PSWfvlqnyxxG82mAlUWw_yG13JQEq";
export const submissionKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ2RrdGtuaWdycndramZua3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDYwMjEsImV4cCI6MjEwNTQ4MjAyMX0.EQTggdONHTk_i0mqoAb7LWIRP7zTWQEC3FHL14yki_A";
let client: SupabaseClient | undefined;
export function getSupabase() {
  if (!client) client = createClient(supabaseUrl, supabasePublicKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "portfolio-admin-auth" } });
  return client;
}
