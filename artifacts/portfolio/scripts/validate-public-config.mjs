import { pathToFileURL } from "node:url";

export function validatePublicConfig(env) {
  const forbidden = Object.keys(env).some((name) => name.startsWith("VITE_") && /SECRET|SERVICE_ROLE|PRIVATE|ACCESS_TOKEN/i.test(name));
  if (forbidden) throw new Error("Private credentials must not be exposed through VITE_ environment variables.");
  let url;
  try { url = new URL(env.VITE_SUPABASE_URL); } catch { throw new Error("Set VITE_SUPABASE_URL to your Supabase HTTPS project URL."); }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("VITE_SUPABASE_URL must be an HTTPS origin without credentials or a path.");
  }
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  if (key.startsWith("sb_publishable_") && key.length > 25) return;
  // Existing anon JWTs are also public; legacy service-role JWTs are not.
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1] || "", "base64url").toString());
    if (key.split(".").length === 3 && payload.role === "anon") return;
  } catch { /* Invalid key. Never print its value. */ }
  throw new Error("Use a Supabase publishable key (or legacy anon key), never a secret/service-role key.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validatePublicConfig(process.env);
  console.log("Public production configuration validated; private credentials are not required by this build.");
}
