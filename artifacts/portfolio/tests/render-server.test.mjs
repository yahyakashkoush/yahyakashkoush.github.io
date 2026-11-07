import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createPortfolioServer } from "../../../scripts/render-start.mjs";

let dir, server, origin;
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "portfolio-server-"));
  await mkdir(path.join(dir, "public/assets"), { recursive: true });
  await mkdir(path.join(dir, "public/media"));
  await writeFile(path.join(dir, "public/index.html"), "<!doctype html><title>Portfolio</title>");
  await writeFile(path.join(dir, "public/assets/app.js"), "console.log('ok')");
  await writeFile(path.join(dir, "public/media/reel.mp4"), Buffer.from("0123456789"));
  await writeFile(path.join(dir, "private.txt"), "must stay private");
  await symlink(path.join(dir, "private.txt"), path.join(dir, "public/leak.txt"));
  server = createPortfolioServer({ rootDir: path.join(dir, "public") });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  server?.closeAllConnections();
  if (server) await new Promise((resolve) => server.close(resolve));
  if (dir) await rm(dir, { recursive: true, force: true });
});
test("home, admin, start and nested case routes return the SPA with fresh HTML", async () => {
  for (const route of ["/", "/admin", "/admin?setup=1", "/start", "/work/example"]) {
    const r = await fetch(origin + route);
    assert.equal(r.status, 200, route);
    assert.match(r.headers.get("content-type"), /text\/html/);
    assert.equal(r.headers.get("cache-control"), "no-cache");
    assert.match(await r.text(), /Portfolio/);
  }
});
test("static asset content types, cache validation and HEAD are supported", async () => {
  const r = await fetch(origin + "/assets/app.js");
  assert.match(r.headers.get("content-type"), /javascript/);
  assert.match(r.headers.get("cache-control"), /immutable/);
  assert.equal((await fetch(origin + "/assets/app.js", { headers: { "If-None-Match": r.headers.get("etag") } })).status, 304);
  const head = await fetch(origin + "/assets/app.js", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});
test("video seeking handles partial and suffix ranges and rejects invalid ranges", async () => {
  const r = await fetch(origin + "/media/reel.mp4", { headers: { Range: "bytes=2-5" } });
  assert.equal(r.status, 206);
  assert.equal(r.headers.get("content-type"), "video/mp4");
  assert.equal(r.headers.get("content-range"), "bytes 2-5/10");
  assert.equal(await r.text(), "2345");
  const suffix = await fetch(origin + "/media/reel.mp4", { headers: { Range: "bytes=-3" } });
  assert.equal(await suffix.text(), "789");
  assert.equal((await fetch(origin + "/media/reel.mp4", { headers: { Range: "bytes=100-" } })).status, 416);
});
test("missing files, API paths, dotfiles and escaping symlinks cannot become SPA responses", async () => {
  for (const route of ["/assets/missing.js", "/media/missing", "/api/example", "/.env", "/leak.txt", "/%2e%2e%2fprivate.txt"]) {
    assert.equal((await fetch(origin + route)).status, 404, route);
  }
  assert.equal((await fetch(origin + "/%zz")).status, 400);
});
test("health and method restrictions are explicit", async () => {
  const r = await fetch(origin + "/healthz");
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { status: "ok" });
  const post = await fetch(origin + "/admin", { method: "POST", body: "{}" });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
});
test("production factory fails explicitly if a build is absent", () => {
  assert.throws(() => createPortfolioServer({ rootDir: path.join(dir, "absent") }), /Production files are missing/);
});
