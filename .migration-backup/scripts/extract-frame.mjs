/**
 * Grabs a still frame from a video already served by the dev server, since
 * there is no ffmpeg on this machine. Not part of the build.
 *
 * The chapterSystem poster (human-system.jpg) turned out to be a portrait
 * personal photo (1089x1445) standing in for a landscape (1280x720) video
 * frame — object-cover on the wide CinematicCut section was cropping to a
 * narrow vertical sliver of it and blowing the crop up, which is the blur the
 * user flagged. The fix is a real frame from the actual clip.
 *
 * Run: node scripts/extract-frame.mjs <video-path-on-dev-server> <seekSeconds> <outName>
 *   e.g. node scripts/extract-frame.mjs /media/video/human-system.mp4 4.5 human-system-frame.png
 */

import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "_source/object");
const PORT = 4322;
// Served from this same origin, not the dev server's :3000 — a cross-origin
// <video> needs CORS headers to be readable back out of a canvas, and the dev
// server doesn't send any, so the video would load but canvas reads would fail.

const [, , videoPath, seekArg, outName] = process.argv;
if (!videoPath || !seekArg || !outName) {
  console.error("usage: node scripts/extract-frame.mjs <video-path> <seekSeconds> <outName>");
  process.exit(1);
}
const SEEK = Number(seekArg);

const PAGE = `<!doctype html><meta charset="utf-8"><title>frame grab</title>
<style>html,body{margin:0;background:#111}</style>
<div id="log" style="position:fixed;left:8px;top:8px;color:#eee;font:12px monospace;z-index:9">booting…</div>
<script type="module">
const log = (m) => { document.getElementById("log").textContent = m; console.log(m); };
const video = document.createElement("video");
video.src = "/video-src";
video.muted = true;
video.playsInline = true;
document.body.appendChild(video);

await new Promise((res, rej) => {
  video.addEventListener("loadedmetadata", res, { once: true });
  video.addEventListener("error", rej, { once: true });
});
log("metadata " + video.videoWidth + "x" + video.videoHeight + " duration " + video.duration.toFixed(2));

video.currentTime = Math.min(${SEEK}, Math.max(0, video.duration - 0.05));
await new Promise((res) => video.addEventListener("seeked", res, { once: true }));
log("seeked to " + video.currentTime.toFixed(2));

const canvas = document.createElement("canvas");
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
canvas.getContext("2d").drawImage(video, 0, 0);
const dataUrl = canvas.toDataURL("image/png");

await fetch("/save", { method: "POST", body: dataUrl });
log("DONE " + canvas.width + "x" + canvas.height);
document.title = "FRAME-DONE";
</script>`;

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/save") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const dataUrl = Buffer.concat(chunks).toString("utf8");
    const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    await mkdir(OUT, { recursive: true });
    await writeFile(resolve(OUT, outName), Buffer.from(b64, "base64"));
    console.log(`wrote ${outName} (${(b64.length * 0.75 / 1024).toFixed(0)} KB)`);
    res.writeHead(200).end("ok");
    return;
  }
  if (req.url === "/") {
    res.writeHead(200, { "content-type": "text/html" }).end(PAGE);
    return;
  }
  if (req.url === "/video-src") {
    const body = await readFile(resolve(ROOT, "public", videoPath.replace(/^\//, "")));
    res.writeHead(200, { "content-type": "video/mp4" }).end(body);
    return;
  }
  res.writeHead(404).end();
});

server.listen(PORT, () => console.log(`frame-grab harness on http://localhost:${PORT}`));
