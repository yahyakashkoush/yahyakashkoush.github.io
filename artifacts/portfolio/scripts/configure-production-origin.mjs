import { pathToFileURL } from "node:url";
import { managementClient } from "./supabase-management.mjs";

export function productionOrigin(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error("Supply a full HTTPS Render URL or custom domain."); }
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash ||
      url.pathname !== "/" || url.hostname.includes("*") || url.hostname === "localhost" || url.hostname.startsWith("127.")) {
    throw new Error("Production URLs must be exact HTTPS origins, without paths, wildcards, credentials, or query parameters.");
  }
  return url.origin;
}

async function main() {
  const origins = process.argv.filter((arg) => arg.startsWith("--origin=")).map((arg) => productionOrigin(arg.slice(9)));
  if (!origins.length) throw new Error("Provide --origin=https://YOUR-ACTUAL-SERVICE.onrender.com; no domain is guessed.");
  const { api, ref } = managementClient();
  const current = await api("/config/auth");
  const redirects = new Set((current.uri_allow_list || "").split(",").filter(Boolean));
  const allowed = new Set(origins);
  // Preserve existing exact callback/site origins, including the Replit preview.
  for (const callback of [...redirects, current.site_url]) {
    try { allowed.add(productionOrigin(new URL(callback).origin)); } catch { /* Not an exact production origin. */ }
  }
  for (const origin of origins) {
    redirects.add(`${origin}/admin`);
    redirects.add(`${origin}/admin?setup=1`);
  }
  console.log("Primary site origin:", origins[0]);
  console.log("Existing redirect entries will be retained. Exact CORS origins:", [...allowed].join(", "));
  if (!process.argv.includes("--apply")) {
    console.log("Read-only preview; add --apply to update auth redirects and submission CORS.");
    return;
  }
  await api("/config/auth", {
    method: "PATCH",
    body: { site_url: origins[0], uri_allow_list: [...redirects].join(",") },
  });
  const verified = await api("/config/auth");
  if (verified.site_url !== origins[0] || !origins.every((origin) =>
    verified.uri_allow_list.split(",").includes(`${origin}/admin`) &&
    verified.uri_allow_list.split(",").includes(`${origin}/admin?setup=1`))) {
    throw new Error("Auth configuration did not retain the requested callbacks. Do not send new login emails yet.");
  }
  await api("/secrets", {
    method: "POST",
    body: [{ name: "ALLOWED_ORIGINS", value: [...allowed].join(",") }],
  });
  for (const origin of origins) {
    let accepted = false;
    for (let attempt = 0; attempt < 10 && !accepted; attempt++) {
      const response = await fetch(`https://${ref}.supabase.co/functions/v1/portfolio-submit`, {
        method: "OPTIONS",
        headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "apikey,content-type" },
      });
      accepted = response.ok && response.headers.get("access-control-allow-origin") === origin;
      if (!accepted) await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!accepted) throw new Error("Submission CORS has not become active for an origin. Recheck before accepting inquiries.");
  }
  console.log("Verified auth callbacks and live submission preflight. No users, passwords, or bookings were changed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
