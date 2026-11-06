// Cross-references every file in public/media against the source tree so no
// asset is used without being accounted for, and no asset is silently orphaned.
// Run: node scripts/asset-usage.mjs
import fs from "node:fs";
import path from "node:path";

const MEDIA = "public/media";
const SRC = "src";

const sources = [];
const collect = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    if (fs.statSync(fp).isDirectory()) collect(fp);
    else if (/\.(tsx?|css)$/.test(name)) sources.push([fp, fs.readFileSync(fp, "utf8")]);
  }
};
collect(SRC);

const files = [];
const walk = (dir) => {
  for (const name of fs.readdirSync(dir).sort()) {
    const fp = path.join(dir, name);
    if (fs.statSync(fp).isDirectory()) walk(fp);
    else files.push(fp);
  }
};
walk(MEDIA);

const rows = files.map((fp) => {
  const url = "/" + fp.split(path.sep).slice(1).join("/");
  const hits = sources.filter(([, body]) => body.includes(url)).map(([f]) => f.split(path.sep).slice(1).join("/"));
  return { url, kind: url.includes("/video/") ? "video" : url.includes("/work/") ? "screenshot" : "photo", hits };
});

const used = rows.filter((r) => r.hits.length);
const orphans = rows.filter((r) => !r.hits.length);

console.log(`\n${used.length} used, ${orphans.length} unused, ${rows.length} total\n`);
console.log("USED");
for (const r of used) console.log(`  ${r.kind.padEnd(10)} ${r.url.padEnd(44)} ${r.hits.join(", ")}`);
console.log("\nUNUSED");
for (const r of orphans) console.log(`  ${r.kind.padEnd(10)} ${r.url}`);

// Guard the rule that matters most: project screenshots and personal
// photography must never appear in each other's registry namespace.
const media = fs.readFileSync("src/content/media.ts", "utf8");
const projectBlock = media.slice(media.indexOf("const wkeyoneShots"), media.indexOf("/* Cinematic"));
const leak = [...projectBlock.matchAll(/\/media\/(portrait|video)\/[\w-]+\.\w+/g)].map((m) => m[0]);
console.log(`\nprojectMedia referencing /photos or /video assets: ${leak.length ? leak.join(", ") : "none"}`);
