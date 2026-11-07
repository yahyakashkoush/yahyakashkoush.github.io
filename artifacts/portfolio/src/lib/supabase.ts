import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Only the public project URL and publishable key may enter the browser bundle.
// Administrative/management credentials are NEVER read from VITE_ variables.
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
export const supabasePublicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
if (!supabaseUrl || !supabasePublicKey) throw new Error("Supabase public configuration is missing.");
const project = new URL(supabaseUrl).hostname.split(".")[0];
let client: SupabaseClient | undefined;

export function getSupabase() {
  if (!client) {
    client = createClient(supabaseUrl, supabasePublicKey, {
      auth: {
        persistSession: true, autoRefreshToken: true, detectSessionInUrl: true,
        // Sessions from a previous project must not be sent to the new one.
        storageKey: `portfolio-admin-auth:${project}`,
      },
    });
  }
  return client;
}
