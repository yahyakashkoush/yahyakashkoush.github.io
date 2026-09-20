import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseContent } from "../src/lib/content-schema.ts";

const content = parseContent(JSON.parse(readFileSync(new URL("../src/content/portfolio.json", import.meta.url), "utf8")));
const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");

test("the admin can edit every public portfolio area from one content snapshot", () => {
  for (const key of ["site", "navigation", "hero", "work", "about", "experience", "capabilities", "contact", "start", "cinematic", "projects"]) {
    assert.ok(content[key], `${key} should exist`);
  }
  assert.ok(content.projects.length >= 1);
  assert.ok(content.start.projectTypes.length >= 1);
  assert.ok(content.start.budgetBands.length >= 1);
  assert.ok(content.navigation.some((item) => item.href === "/start"));
});

test("project slugs, titles and indexes are ready for admin publishing", () => {
  const slugs = new Set();
  for (const [index, project] of content.projects.entries()) {
    assert.match(project.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(slugs.has(project.slug), false);
    slugs.add(project.slug);
    assert.equal(project.index, String(index + 1).padStart(2, "0"));
    assert.ok(project.title.trim());
    assert.ok(project.subtitle.trim());
  }
});

test("image records have the metadata the CMS needs to upload and preview safely", () => {
  const images = [
    content.hero.poster,
    content.about.image,
    ...content.projects.flatMap((project) => [project.media.cover, ...project.media.gallery]),
  ];
  for (const image of images.filter(Boolean)) {
    assert.match(image.src, /^(\/|https:\/\/)/);
    assert.ok(image.alt.trim());
    if (image.width !== undefined) assert.ok(image.width > 0);
    if (image.height !== undefined) assert.ok(image.height > 0);
  }
});

test("local administrator credentials stay out of version control", () => {
  assert.match(gitignore, /\.env\*/);
});
