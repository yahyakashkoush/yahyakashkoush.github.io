/**
 * Offline render step. Not part of the build, not shipped to the browser.
 *
 * The supplied envelope GLB is a 20.5 MB single-mesh Meshy export: one
 * primitive, one material, no node hierarchy and no animation tracks. The flap
 * therefore cannot be driven from the file, and shipping three.js plus the mesh
 * would cost ~150 KB of runtime for an object that is, viewed head on, a flat
 * rectangle.
 *
 * So the asset is rendered here once, at full source quality, straight down the
 * Z axis with an orthographic camera. The site then treats that render as the
 * envelope face and slices it with clip-path into body and flap, which restores
 * the independent flap motion using the real asset's own pixels.
 *
 * Run: node scripts/render-envelope.mjs <path-to.glb>
 * Serves a page on :4321, renders it in the browser, POSTs the PNGs back.
 */

import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.argv[2];
const OUT = resolve(ROOT, "_source/object");
const PORT = 4321;

if (!SRC) {
  console.error("usage: node scripts/render-envelope.mjs <path-to.glb>");
  process.exit(1);
}

const PAGE = `<!doctype html><meta charset="utf-8"><title>envelope render</title>
<style>html,body{margin:0;background:#111;color:#eee;font:12px monospace}
#log{position:fixed;left:8px;top:8px;z-index:9}canvas{display:block}</style>
<div id="log">booting…</div>
<script type="importmap">{"imports":{
  "three":"/three.module.js",
  "three/addons/":"/addons/"
}}</script>
<script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const log = (m) => { document.getElementById("log").textContent = m; console.log(m); };

const W = 2048;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

log("loading glb…");
const gltf = await new GLTFLoader().loadAsync("/model.glb");
const model = gltf.scene;

// Normalise: centre on the origin and lay the face in the XY plane.
const box = new THREE.Box3().setFromObject(model);
const size = box.getSize(new THREE.Vector3());
const center = box.getCenter(new THREE.Vector3());
model.position.sub(center);
scene.add(model);
log("bbox " + size.toArray().map((n) => n.toFixed(3)).join(" x "));

// Face is the largest two axes; the thin axis points at the camera.
const aspect = size.x / size.y;
const H = Math.round(W / aspect);
renderer.setSize(W, H, false);

const pad = 1.002;
const cam = new THREE.OrthographicCamera(
  (-size.x / 2) * pad, (size.x / 2) * pad,
  (size.y / 2) * pad, (-size.y / 2) * pad,
  -100, 100,
);
cam.position.set(0, 0, 10);
cam.lookAt(0, 0, 0);

// Even, soft lighting. Deliberately not dramatic: the render gets sliced into
// body and flap and the flap rotates, so baked directional shading would break
// apart the moment the flap lifts. Contrast is added in CSS instead.
scene.add(new THREE.AmbientLight(0xffffff, 1.35));
const key = new THREE.DirectionalLight(0xfff4ec, 2.1);
key.position.set(-0.6, 1.1, 2.2);
scene.add(key);
const fill = new THREE.DirectionalLight(0xdce6ff, 0.75);
fill.position.set(1.4, -0.7, 1.8);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xd91f26, 0.55);
rim.position.set(0.2, 0.4, -2.0);
scene.add(rim);

const save = async (name, dataUrl) => {
  await fetch("/save?name=" + encodeURIComponent(name), { method: "POST", body: dataUrl });
  log("saved " + name);
};

renderer.render(scene, cam);
await save("envelope-front.png", renderer.domElement.toDataURL("image/png"));

log("DONE " + W + "x" + H);
document.title = "RENDER-DONE";
</script>`;

const types = {
  ".js": "text/javascript",
  ".glb": "model/gltf-binary",
  ".html": "text/html",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "POST" && url.pathname === "/save") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const dataUrl = Buffer.concat(chunks).toString("utf8");
    const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const name = url.searchParams.get("name") ?? "out.png";
    await mkdir(OUT, { recursive: true });
    await writeFile(resolve(OUT, name), Buffer.from(b64, "base64"));
    console.log(`wrote ${name} (${(b64.length * 0.75 / 1024).toFixed(0)} KB)`);
    res.writeHead(200).end("ok");
    return;
  }

  try {
    let file;
    if (url.pathname === "/" ) {
      res.writeHead(200, { "content-type": "text/html" }).end(PAGE);
      return;
    } else if (url.pathname === "/model.glb") {
      file = resolve(SRC);
    } else if (url.pathname.endsWith(".js") && !url.pathname.startsWith("/addons/")) {
      // three.module.js pulls in three.core.js as a sibling, so serve the
      // whole build directory rather than the entry file alone.
      file = resolve(ROOT, "node_modules/three/build", url.pathname.slice(1));
    } else if (url.pathname.startsWith("/addons/")) {
      file = resolve(ROOT, "node_modules/three/examples/jsm", url.pathname.slice("/addons/".length));
    } else {
      res.writeHead(404).end("nope");
      return;
    }
    const ext = file.slice(file.lastIndexOf("."));
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[ext] ?? "application/octet-stream" }).end(body);
  } catch (err) {
    console.error(url.pathname, err.message);
    res.writeHead(500).end(err.message);
  }
});

server.listen(PORT, () => console.log(`render harness on http://localhost:${PORT}`));
