import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { productionOrigin } from "../scripts/configure-production-origin.mjs";
import { validatePublicConfig } from "../scripts/validate-public-config.mjs";

const publicEnv = {
  VITE_SUPABASE_URL: "https://example.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_public_example_for_tests",
};
test("production origin accepts exact Render/custom HTTPS origins and normalizes trailing slash", () => {
  assert.equal(productionOrigin("https://portfolio-test.onrender.com/"), "https://portfolio-test.onrender.com");
  assert.equal(productionOrigin("https://portfolio.example.com"), "https://portfolio.example.com");
});
test("production origin rejects unsafe or ambiguous callback URLs", () => {
  for (const value of ["http://example.com", "https://example.com/admin", "https://user:pass@example.com", "https://example.com?token=x", "https://*.onrender.com", "https://localhost"]) {
    assert.throws(() => productionOrigin(value));
  }
});
test("build allows public credentials, not privileged keys or leaked VITE secrets", () => {
  assert.doesNotThrow(() => validatePublicConfig(publicEnv));
  assert.throws(() => validatePublicConfig({ ...publicEnv, VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_test_only_not_a_real_key" }));
  assert.throws(() => validatePublicConfig({ ...publicEnv, VITE_SUPABASE_SECRET_KEY: "test-only" }));
  const jwt = (role) => `e30.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.example`;
  assert.doesNotThrow(() => validatePublicConfig({ ...publicEnv, VITE_SUPABASE_PUBLISHABLE_KEY: jwt("anon") }));
  assert.throws(() => validatePublicConfig({ ...publicEnv, VITE_SUPABASE_PUBLISHABLE_KEY: jwt("service_role") }));
  assert.throws(() => validatePublicConfig({ ...publicEnv, VITE_SUPABASE_URL: "https://user:password@example.com" }));
});
test("Render serves all SPA routes and only deploys the portfolio output", async () => {
  const blueprint = await readFile(new URL("../../../render.yaml", import.meta.url), "utf8");
  assert.match(blueprint, /runtime: static/);
  assert.match(blueprint, /staticPublishPath: artifacts\/portfolio\/dist\/public/);
  assert.match(blueprint, /source: \/\*\s+destination: \/index.html/);
  assert.doesNotMatch(blueprint, /startCommand:|SUPABASE_SECRET_KEY|SUPABASE_ACCESS_TOKEN|DATABASE_URL/);
});
