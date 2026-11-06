// One-shot: copies the raw shoot assets in _source/ into web-safe paths under public/media.
// Kept in the repo so the mapping from original filenames stays auditable.
import fs from "node:fs";
import path from "node:path";

const SRC = "_source";
const DEST = "public/media";

const mk = (d) => fs.mkdirSync(d, { recursive: true });
["portrait", "video", "work/lai", "work/wkeyone"].forEach((d) => mk(path.join(DEST, d)));

const PHOTO_MAP = {
  Front_Wide: "front-wide",
  "Close-up": "close-up",
  "Human_+_System": "human-system",
  "AI_Network_Close-up": "ai-network",
  Abstract_AI_System: "abstract-system",
  Side: "side",
  Full_Body: "full-body",
  Front_Medium: "front-medium",
  "3_4": "portrait-34",
};

for (const f of fs.readdirSync(path.join(SRC, "photos"))) {
  const key = f.split(".png_")[0];
  if (PHOTO_MAP[key]) {
    fs.copyFileSync(path.join(SRC, "photos", f), path.join(DEST, "portrait", `${PHOTO_MAP[key]}.jpg`));
  } else {
    console.warn("unmapped photo:", f);
  }
}

const VIDEO_MAP = [
  ["VIDEO 01", "hero"],
  ["VIDEO 02", "front-wide"],
  ["VIDEO 03", "close-up"],
  ["VIDEO 04", "ai-transition"],
  ["VIDEO 05", "ai-network"],
  ["VIDEO 06", "human-system"],
  ["Create_an_second", "cinematic-02"],
];

for (const f of fs.readdirSync(path.join(SRC, "vedios"))) {
  const match = VIDEO_MAP.find(([prefix]) => f.startsWith(prefix));
  if (match) {
    fs.copyFileSync(path.join(SRC, "vedios", f), path.join(DEST, "video", `${match[1]}.mp4`));
  } else {
    console.warn("unmapped video:", f);
  }
}

// Explicit, not sort-order: these names are referenced by src/content/media.ts
// and each one was matched to its screenshot by opening the file.
const WORK_MAP = {
  lai: {
    "Screenshot-2025-06-07-at-2.58.32PM.png": "chat.png",
    "Screenshot-2025-06-07-at-2.58.41PM.png": "model-settings.png",
    "Screenshot-2025-06-07-at-2.58.52PM.png": "conversations.png",
  },
  wkeyone: {
    "Screenshot 2026-09-15 230609.png": "landing.png",
    "Screenshot 2026-09-15 230633.png": "dashboard.png",
    "Screenshot 2026-09-15 230716.png": "assistant.png",
  },
};

for (const [project, map] of Object.entries(WORK_MAP)) {
  const dir = path.join(SRC, "projects", project, "photos");
  // Clear stale output so renamed files never leave orphans behind.
  fs.rmSync(path.join(DEST, "work", project), { recursive: true, force: true });
  mk(path.join(DEST, "work", project));
  for (const [from, to] of Object.entries(map)) {
    const srcFile = path.join(dir, from);
    if (!fs.existsSync(srcFile)) {
      console.warn(`missing project asset: ${srcFile}`);
      continue;
    }
    fs.copyFileSync(srcFile, path.join(DEST, "work", project, to));
  }
  const unmapped = fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpe?g)$/i.test(f) && !map[f]);
  if (unmapped.length) console.warn(`unmapped ${project} assets:`, unmapped);
}

for (const f of ["file.svg", "globe.svg", "next.svg", "vercel.svg", "window.svg"]) {
  fs.rmSync(path.join("public", f), { force: true });
}

const walk = (d) =>
  fs.readdirSync(d).forEach((f) => {
    const fp = path.join(d, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp);
    else console.log(`${(st.size / 1024).toFixed(0).padStart(6)}KB  ${fp.split(path.sep).join("/")}`);
  });
walk(DEST);
