import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validateProjects, encodeContent, decodeContent, loadProjects, publishProjects, deploymentStatus } from "../src/lib/admin.ts";

const projects = JSON.parse(readFileSync(new URL("../src/content/projects.json", import.meta.url), "utf8"));

test("real portfolio data remains valid and Unicode survives GitHub encoding", () => {
  validateProjects(projects);
  const content = JSON.stringify(projects) + " العربية → ✨";
  assert.equal(decodeContent(encodeContent(content)), content);
});

test("invalid content, duplicate URLs, and unsafe external links cannot publish", () => {
  assert.throws(() => validateProjects([]), /at least one/);
  assert.throws(() => validateProjects([...projects, projects[0]]), /unique/);
  for (const href of ["javascript:alert(1)", "data:text/html,hello", "not-a-url"]) {
    const draft = structuredClone(projects);
    draft[0].links = [{ label: "Open", href }];
    assert.throws(() => validateProjects(draft), /https/);
  }
  const draft = structuredClone(projects);
  draft[0].capabilities = [null];
  assert.throws(() => validateProjects(draft), /Capabilities/);
});

test("GitHub load and publish use the file revision, main branch, and UTF-8 content", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json(init.method === "PUT" ? { content: { sha: "new-file" }, commit: { sha: "new-commit" } } : { sha: "old-file", content: encodeContent(JSON.stringify(projects)) });
  });
  const loaded = await loadProjects("test-token");
  assert.deepEqual(loaded.projects, projects);
  const result = await publishProjects("test-token", loaded.projects, loaded.sha);
  const payload = JSON.parse(calls[1].init.body);
  assert.equal(payload.sha, "old-file");
  assert.equal(payload.branch, "main");
  assert.deepEqual(JSON.parse(decodeContent(payload.content)), projects);
  assert.equal(calls[1].init.headers.Authorization, "Bearer test-token");
  assert.deepEqual(result, { sha: "new-file", commit: "new-commit" });
});

test("conflicts and failed authorization produce actionable errors", async (context) => {
  let status = 409;
  context.mock.method(globalThis, "fetch", async () => new Response("", { status }));
  await assert.rejects(publishProjects("test-token", projects, "stale"), /changed/);
  status = 401;
  await assert.rejects(loadProjects("test-token"), /expired/);
  status = 403;
  await assert.rejects(loadProjects("test-token"), /permission/);
});

test("deployment state distinguishes queued, failed, and live builds", async (context) => {
  let runs = [];
  context.mock.method(globalThis, "fetch", async () => Response.json({ workflow_runs: runs }));
  assert.match(await deploymentStatus("token", "commit"), /Waiting/);
  runs = [{ status: "completed", conclusion: "failure" }];
  assert.match(await deploymentStatus("token", "commit"), /failure/);
  runs = [{ status: "completed", conclusion: "success" }];
  assert.match(await deploymentStatus("token", "commit"), /Live/);
});
