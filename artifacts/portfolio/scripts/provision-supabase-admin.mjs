import { managementClient } from "./supabase-management.mjs";

const { api, query, ref } = managementClient();
const email = (process.argv.find((arg) => arg.startsWith("--email=")) || "").slice(8).trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Supply the explicitly approved administrator email via --email=.");
const previewDomain = process.env.REPLIT_DEV_DOMAIN;
if (!previewDomain) throw new Error("A development preview origin is required for the secure invitation redirect.");
const origin = `https://${previewDomain}`;
const config = await api("/config/auth");
const redirectUrls = new Set([
  ...(config.uri_allow_list || "").split(",").filter(Boolean),
  `${origin}/admin`, `${origin}/admin?setup=1`,
]);
await api("/config/auth", {
  method: "PATCH",
  body: { uri_allow_list: [...redirectUrls].join(","), ...(config.site_url?.includes("localhost") ? { site_url: origin } : {}) },
});
const literal = email.replaceAll("'", "''");
await query(`insert into public.portfolio_admins(email) values ('${literal}') on conflict (email) do nothing;`);
const keys = await api("/api-keys");
const service = keys.find((key) => key.name === "service_role");
if (!service?.api_key) throw new Error("No provider service credential was available for the secure invitation.");
const response = await fetch(`https://${ref}.supabase.co/auth/v1/invite?redirect_to=${encodeURIComponent(`${origin}/admin?setup=1`)}`, {
  method: "POST",
  headers: { apikey: service.api_key, Authorization: `Bearer ${service.api_key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});
if (!response.ok) {
  const data = await response.json().catch(() => ({}));
  if (data.code === "email_exists" || data.code === "user_already_exists") {
    throw new Error("The account already exists. It is approved; use the normal sign-in or password-reset screen. No password was changed.");
  }
  throw new Error(`Administrator approved, but invitation delivery failed (${response.status}, ${data.code || "email-provider"}). No account password was invented or logged.`);
}
console.log("Approved administrator and sent a secure password-setup invitation. No credential or invitation link was logged.");
