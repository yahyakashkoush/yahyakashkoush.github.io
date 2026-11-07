import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { parseContent, safeUrl } from "../src/lib/content-schema.ts";

const content = JSON.parse(readFileSync(new URL("../src/content/portfolio.json", import.meta.url), "utf8"));

test("the complete portfolio snapshot validates without losing fields", () => {
  assert.deepEqual(parseContent(content), content);
});

test("published content rejects unsafe links, duplicate projects and invalid schedules", () => {
  for (const url of ["javascript:alert(1)", "//evil.test", "/\\evil.test", "data:text/html,test"]) {
    assert.equal(safeUrl.safeParse(url).success, false);
  }
  const duplicate = structuredClone(content);
  duplicate.projects.push(duplicate.projects[0]);
  assert.throws(() => parseContent(duplicate), /Duplicate/);
  const schedule = structuredClone(content);
  schedule.start.scheduling.leadTimeDays = 365;
  assert.throws(() => parseContent(schedule), /horizon/);
});

test("all media referenced by the initial portfolio exists", () => {
  const paths = new Set(JSON.stringify(content).match(/\/media\/[^"\s]+/g));
  assert.ok(paths.size > 0);
  for (const path of paths) {
    assert.ok(existsSync(new URL(`../public${path}`, import.meta.url)), `Missing media: ${path}`);
  }
});

test("all public pages and the private workspace remain represented", () => {
  for (const name of ["site", "navigation", "hero", "work", "about", "experience", "capabilities", "contact", "start", "cinematic", "projects"]) {
    assert.ok(content[name], `${name} content must exist`);
  }
  assert.ok(content.navigation.some((item) => item.href === "/start"));
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  for (const route of ["/work", "/start", "/admin"]) assert.ok(app.includes(route), `Missing route: ${route}`);
});

test("the active source no longer depends on Next.js", () => {
  const root = new URL("../src/", import.meta.url);
  for (const path of readdirSync(root, { recursive: true })) {
    if (!/\.[jt]sx?$/.test(path)) continue;
    const source = readFileSync(new URL(path, root), "utf8");
    assert.doesNotMatch(source, /from\s+["']next(?:\/[^"']*)?["']/, `Next.js import in ${path}`);
  }
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(!pkg.dependencies?.next && !pkg.devDependencies?.next);
});

test("personal photos stay removed while project images remain with blue emphasis", () => {
  for (const file of ["sections/hero.tsx", "sections/about.tsx", "sections/contact.tsx"]) {
    const source = readFileSync(new URL(`../src/components/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /<Image\b|<img\b|<Gallery\b|<video\b|ScreenshotPeek/, file);
  }
  const css = readFileSync(new URL("../src/globals.css", import.meta.url), "utf8");
  assert.match(css, /--red: #80b2ff;/);
  assert.match(css, /--red: #2459a6;/);
  const work = readFileSync(new URL("../src/components/sections/work.tsx", import.meta.url), "utf8");
  const study = readFileSync(new URL("../src/components/case-study.tsx", import.meta.url), "utf8");
  assert.match(work, /<Image\b/);
  assert.match(study, /<Gallery items=\{project\.media\.gallery\}/);
});

test("the project inquiry uses image-free, completion-driven envelope transitions", () => {
  const start = readFileSync(new URL("../src/components/start/start-experience.tsx", import.meta.url), "utf8");
  const intro = readFileSync(new URL("../src/components/start/intro.tsx", import.meta.url), "utf8");
  const sending = readFileSync(new URL("../src/components/start/send-sequence.tsx", import.meta.url), "utf8");
  const sent = readFileSync(new URL("../src/components/start/sent-state.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(start, /FLAP_MS|LETTER_MS|letterOut|phase === "opening"/);
  const envelope = readFileSync(new URL("../src/components/start/envelope.tsx", import.meta.url), "utf8");
  assert.match(intro, /onLetterComplete/);
  assert.doesNotMatch(envelope, /<Image|<img|rotateX|preserve-3d/);
  assert.match(sending, /onFlapComplete/);
  assert.match(sending, /onLetterComplete/);
  assert.doesNotMatch(sent, /Envelope/);
  assert.doesNotMatch(sending, /setTimeout|TIMELINE/);
  assert.match(sending, /completed\.current/);
});
