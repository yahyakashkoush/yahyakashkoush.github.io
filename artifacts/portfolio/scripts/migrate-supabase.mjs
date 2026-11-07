import { readFile } from "node:fs/promises";
import { managementClient } from "./supabase-management.mjs";

const { api, query, ref } = managementClient();
const applying = process.argv.includes("--apply");
const tables = await query("select tablename from pg_tables where schemaname = 'public' order by tablename;");
console.log(`Destination inventory: ${tables.length} public tables.`);
if (!applying) {
  console.log("Read-only inspection complete. --apply initializes an EMPTY destination only.");
  process.exit(0);
}
if (tables.length) throw new Error("Destination is not empty. Nothing changed; inspect its data before proceeding.");
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [base, conflicts, reservationUpgrade, snapshot] = await Promise.all([
  read("../../../.migration-backup/supabase/migrations/20260920_portfolio_cms.sql"),
  read("../../../.migration-backup/supabase/migrations/20260920_content_conflicts.sql"),
  read("../supabase/migrations/20261107_booking_reservations.sql"),
  read("../src/content/portfolio.json"),
]);
const content = JSON.parse(snapshot);
const literal = JSON.stringify(content).replaceAll("'", "''");
const upgrade = reservationUpgrade.replace(/^begin;\s*$/m, "").replace(/^commit;\s*$/m, "");
// One transaction. On any error the original destination remains unchanged.
await query(`begin;
${base}
${conflicts}
insert into public.portfolio_content(id, content) values
  ('published', '${literal}'::jsonb), ('draft', '${literal}'::jsonb);
${upgrade}
notify pgrst, 'reload schema';
commit;`);
console.log(`Initialized CMS and reservations; copied ${content.projects.length} projects plus all public sections into draft and published content.`);
console.log("Existing local /media files remain served by the website; no placeholders replace them.");

const form = new FormData();
form.append("metadata", JSON.stringify({ name: "portfolio-submit", entrypoint_path: "index.ts", verify_jwt: false }));
for (const name of ["index.ts", "validation.ts"]) {
  form.append("file", new Blob([await read(`../supabase/functions/portfolio-submit/${name}`)], { type: "application/typescript" }), name);
}
const deployed = await api("/functions/deploy?slug=portfolio-submit", { method: "POST", form });
if (deployed.status !== "ACTIVE") throw new Error("Function uploaded but is not active yet. Check the provider before accepting requests.");
console.log("Submission function deployed with public-key-compatible gateway configuration.");

const previewDomain = process.env.REPLIT_DEV_DOMAIN;
if (previewDomain) {
  const origin = `https://${previewDomain}`;
  await api("/secrets", { method: "POST", body: [{ name: "ALLOWED_ORIGINS", value: origin }] });
  console.log("Exact development preview origin allowed for submissions.");
}
const summary = await query(`select
  (select count(*)::int from public.portfolio_content) as content_rows,
  (select jsonb_array_length(content->'projects') from public.portfolio_content where id='published') as projects,
  (select count(*)::int from public.portfolio_bookings) as bookings,
  (select count(*)::int from public.portfolio_admins) as approved_administrators;`);
console.log("Migration check:", JSON.stringify(summary));
console.log(`Destination ${ref} ready for administrator setup. No source data was deleted.`);
