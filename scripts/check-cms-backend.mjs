// Integration check against this portfolio's backend. Uses the ignored local
// administrator credential file and never prints credentials or sessions.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const config = readFileSync(new URL("../src/lib/supabase.ts", import.meta.url), "utf8");
const url = config.match(/export const supabaseUrl = "([^"]+)"/)[1];
const key = config.match(/export const supabasePublicKey = "([^"]+)"/)[1];
const anonJwt = config.match(/export const submissionKey = "([^"]+)"/)[1];
const credentials = JSON.parse(readFileSync(new URL("../.env.admin-access", import.meta.url), "utf8"));
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const guest = createClient(url, key, options), admin = createClient(url, key, options);
const { error: loginError } = await admin.auth.signInWithPassword({ email: credentials.email, password: credentials.password });
assert.equal(loginError, null, "Administrator can sign in");
try {
  const { data: allowed, error: roleError } = await admin.rpc("is_portfolio_admin");
  assert.equal(roleError, null); assert.equal(allowed, true);
  const { data: visible } = await guest.from("portfolio_content").select("id");
  assert.deepEqual(visible, [{ id: "published" }]);
  assert.ok((await guest.from("portfolio_messages").select("id")).error, "Anonymous inbox reads are denied");
  assert.ok((await guest.rpc("save_portfolio_draft", { p_content: {}, p_expected_version: 1 })).error, "Anonymous draft writes are denied");
  assert.ok((await guest.storage.from("portfolio-images").upload("forbidden-test.png", new Uint8Array([1,2,3]), { contentType: "image/png" })).error, "Anonymous uploads are denied");
  console.log("PASS: administrator login, public-content isolation, private inbox, protected writes and uploads.");
  const { data: draft, error: draftError } = await admin.from("portfolio_content").select("*").eq("id", "draft").single();
  assert.equal(draftError, null);
  const { data: version, error: saveError } = await admin.rpc("save_portfolio_draft", { p_content: draft.content, p_expected_version: draft.version });
  assert.equal(saveError, null); assert.equal(version, draft.version + 1);
  const stale = await admin.rpc("save_portfolio_draft", { p_content: draft.content, p_expected_version: draft.version });
  assert.ok(stale.error); assert.equal(stale.error.code, "PT409");
  console.log("PASS: authenticated save and concurrent-edit conflict protection (content unchanged).");
  const id = crypto.randomUUID();
  const response = await fetch(`${url}/functions/v1/portfolio-submit`, { method: "POST", headers: { Origin: "https://kashkoush.me", "Content-Type": "application/json", apikey: anonJwt, Authorization: `Bearer ${anonJwt}` }, body: JSON.stringify({ id, kind: "contact", name: "Dashboard verification", email: "verification@example.com", message: "Synthetic test message verifying delivery to the private admin inbox. Safe to archive.", website: "" }) });
  const result = await response.json();
  assert.equal(response.status, 201, JSON.stringify(result)); assert.equal(result.id, id);
  const { data: message } = await admin.from("portfolio_messages").select("id,status").eq("id", id).single();
  assert.equal(message.status, "new");
  const { error: archiveError } = await admin.from("portfolio_messages").update({ status: "archived", note: "Automatically archived after successful end-to-end delivery verification." }).eq("id", id);
  assert.equal(archiveError, null);
  console.log("PASS: real form submission stored, readable only by admin, and archived after verification.");
} finally { await admin.auth.signOut(); }
