import { createClient } from "npm:@supabase/supabase-js@2";
import { validateSubmission } from "./validation.ts";

const allowedOrigins = new Set(["https://kashkoush.me", "https://www.kashkoush.me", "https://yahyakashkoush.github.io", "http://localhost:3000", "http://127.0.0.1:3000"]);
Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") || "";
  const cors = { "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://kashkoush.me", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin", "Content-Type": "application/json" };
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
  if (!allowedOrigins.has(origin)) return respond({ error: "Origin not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405);
  if (!request.headers.get("content-type")?.includes("application/json")) return respond({ error: "JSON required." }, 415);
  if (Number(request.headers.get("content-length") || 0) > 32768) return respond({ error: "Message too large." }, 413);
  try {
    const raw = await request.text();
    if (raw.length > 32768) return respond({ error: "Message too large." }, 413);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return respond({ error: "Invalid request." }, 400); }
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(Deno.env.get("SUPABASE_URL")!, secret, { auth: { persistSession: false } });
    const { data: settings, error: settingsError } = await client.from("portfolio_content").select("content").eq("id", "published").single();
    if (settingsError) return respond({ error: "Messages are temporarily unavailable. Please try again." }, 503);
    let message: ReturnType<typeof validateSubmission>;
    try { message = validateSubmission(body, settings.content.start); } catch (error) { return respond({ error: error instanceof Error ? error.message : "Check the form fields." }, 400); }
    // Only an HMAC is retained, not the visitor's IP address.
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("cf-connecting-ip") || "unknown";
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(address));
    const limitKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { data, error } = await client.rpc("accept_portfolio_message", { p_key: limitKey, p_id: message.id, p_kind: message.kind, p_name: message.name, p_email: message.email, p_message: message.message, p_details: message.details });
    if (error) return respond({ error: error.code === "P0001" ? "Too many messages. Please try again in an hour, or contact me by email." : "Your message could not be saved. Please try again." }, error.code === "P0001" ? 429 : 503);
    return respond({ id: data }, 201);
  } catch { return respond({ error: "Your message could not be sent. Please try again." }, 503); }
});
