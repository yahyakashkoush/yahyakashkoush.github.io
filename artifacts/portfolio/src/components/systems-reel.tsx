import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "cn";
import "./systems-reel.css";

/**
 * The reel inside the television. One architecture, four real products.
 *
 * Three stacked planes: sources on top, the intelligence layer in the middle,
 * actions at the bottom. Signals fall from the sources, pass through the core
 * and leave as structured outputs. Every seven seconds the labels switch to
 * the next project while the geometry stays, which is the point: the systems
 * share one shape.
 *
 * Rendering budget: one line batch, one particle cloud, no post-processing.
 * The loop only runs while the set is on screen, the tab is visible and the
 * viewer has not paused it. Reduced motion renders a single still frame.
 */

type Chapter = {
  name: string;
  inputs: [string, string, string, string, string];
  core: string;
  outputs: [string, string, string];
  result: string;
};

const CHAPTERS: Chapter[] = [
  { name: "WKEYONE", inputs: ["Text", "Voice", "Image", "Catalogue", "History"], core: "Sales engine", outputs: ["Order", "Follow-up", "Handoff"], result: "Zero missed messages. Live in 15 minutes." },
  { name: "HEADSHOT", inputs: ["Domain", "Registry", "Maps", "Social", "Certificates"], core: "Evidence graph", outputs: ["Entity", "Score", "Dossier"], result: "503 of 503 tests passing. Runs with AI off." },
  { name: "PULSE", inputs: ["CRM", "Email", "Research", "Signals", "Knowledge"], core: "Provider gateway", outputs: ["Why now", "Opportunity", "Deal"], result: "Models change. The sales workflow does not." },
  { name: "KEYONE DATA", inputs: ["Events", "Campaigns", "Sessions", "Spend", "Exports"], core: "DuckDB engine", outputs: ["Query", "Page", "Report"], result: "Hundreds of millions of records, one service." },
];

const CHAPTER_SECONDS = 7;
const PARTICLES = 150;
const TOP = 1.25;
const BOTTOM = -1.25;
const GREY = new THREE.Color("#8a8f96");
const BLUE = new THREE.Color("#80b2ff");
const LINE = new THREE.Color("#3a3d42");
const LINE_SOFT = new THREE.Color("#25272b");

const inputPositions = [-2.4, -1.2, 0, 1.2, 2.4].map((x) => new THREE.Vector3(x, TOP, 0));
const outputPositions = [-1.6, 0, 1.6].map((x) => new THREE.Vector3(x, BOTTOM, 0));
const satellitePositions = [new THREE.Vector3(-2.2, 0, -0.9), new THREE.Vector3(2.2, 0, -0.9), new THREE.Vector3(0, 0, 1.3)];
const CORE = new THREE.Vector3(0, 0, 0);

function arc(from: THREE.Vector3, to: THREE.Vector3, lift: number) {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  mid.z += lift;
  return new THREE.QuadraticBezierCurve3(from, mid, to);
}

const inEdges = inputPositions.map((p) => arc(p, CORE, 0.6));
const outEdges = outputPositions.map((p) => arc(CORE, p, 0.6));
const sideEdges = satellitePositions.map((p) => arc(CORE, p, 0));

type Particle = { stage: 0 | 1; edge: number; t: number; speed: number };

function buildLines() {
  const positions: number[] = [];
  const colors: number[] = [];
  const seg = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Color) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
  };
  // Three planes drawn as sparse grids: 6 x 4 units, one line per unit.
  for (const y of [TOP, 0, BOTTOM]) {
    for (let x = -3; x <= 3; x += 1) seg(new THREE.Vector3(x, y, -2), new THREE.Vector3(x, y, 2), LINE_SOFT);
    for (let z = -2; z <= 2; z += 1) seg(new THREE.Vector3(-3, y, z), new THREE.Vector3(3, y, z), LINE_SOFT);
  }
  // Node frames.
  const box = (c: THREE.Vector3, s: number, color: THREE.Color) => {
    const h = s / 2;
    const corners = [
      [-h, -h, -h], [h, -h, -h], [h, -h, h], [-h, -h, h],
      [-h, h, -h], [h, h, -h], [h, h, h], [-h, h, h],
    ].map(([x, y, z]) => new THREE.Vector3(c.x + x, c.y + y, c.z + z));
    const pairs = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (const [a, b] of pairs) seg(corners[a], corners[b], color);
  };
  inputPositions.forEach((p) => box(p, 0.28, LINE));
  outputPositions.forEach((p) => box(p, 0.34, LINE));
  satellitePositions.forEach((p) => box(p, 0.3, LINE));
  box(CORE, 0.62, BLUE.clone().multiplyScalar(0.65));
  // Edges sampled as polylines.
  const curve = (c: THREE.QuadraticBezierCurve3, color: THREE.Color) => {
    const pts = c.getPoints(14);
    for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1], color);
  };
  inEdges.forEach((c) => curve(c, LINE));
  outEdges.forEach((c) => curve(c, LINE));
  sideEdges.forEach((c) => curve(c, LINE_SOFT));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function dotTexture() {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function SystemsReel({ playing, onReady, className }: { playing: boolean; onReady?: () => void; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const control = useRef<{ start(): void; stop(): void } | null>(null);
  const [chapter, setChapter] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const vis = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    const el = host.current;
    const io = el && new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    if (el) io?.observe(el);
    return () => {
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", vis);
      io?.disconnect();
    };
  }, []);

  const active = playing && visible && pageVisible && !reduceMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    const el = host.current;
    if (!canvas || !el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
    } catch {
      return;
    }
    renderer.setClearColor(0x050506, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1.6, 0.1, 50);

    const lines = new THREE.LineSegments(
      buildLines(),
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }),
    );
    scene.add(lines);

    const particles: Particle[] = Array.from({ length: PARTICLES }, () => ({
      stage: Math.random() < 0.55 ? 0 : 1,
      edge: 0,
      t: Math.random(),
      speed: 0.18 + Math.random() * 0.22,
    }));
    particles.forEach((p) => { p.edge = Math.floor(Math.random() * (p.stage === 0 ? inEdges.length : outEdges.length)); });
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PARTICLES * 3);
    const pCol = new Float32Array(PARTICLES * 3);
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    const texture = dotTexture();
    const points = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ size: 0.09, map: texture, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true, blending: THREE.AdditiveBlending }),
    );
    scene.add(points);

    // Core glow: a single sprite that swells when a signal arrives.
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
    const glowMat = new THREE.PointsMaterial({ size: 0.9, map: texture, color: BLUE, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
    scene.add(new THREE.Points(glowGeo, glowMat));

    const tmp = new THREE.Vector3();
    const anchors = [...inputPositions, CORE, ...outputPositions];
    let glow = 0;
    let elapsed = 0;
    let last = performance.now();
    let frame = 0;
    let lastChapter = -1;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      width = rect.width;
      height = rect.height;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(() => { resize(); if (!running) draw(0); });
    ro.observe(el);

    const placeLabels = () => {
      anchors.forEach((a, i) => {
        const node = labelRefs.current[i];
        if (!node) return;
        tmp.copy(a);
        tmp.y += i === 5 ? 0.5 : i < 5 ? 0.3 : -0.36;
        tmp.project(camera);
        const x = (tmp.x * 0.5 + 0.5) * width;
        const y = (-tmp.y * 0.5 + 0.5) * height;
        node.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
    };

    const step = (dt: number) => {
      elapsed += dt;
      const az = -0.55 + Math.sin(elapsed * 0.12) * 0.14;
      const polar = 1.02 + Math.sin(elapsed * 0.09) * 0.04;
      camera.position.setFromSphericalCoords(9.4, polar, az);
      camera.lookAt(0, -0.05, 0);

      for (let i = 0; i < PARTICLES; i++) {
        const p = particles[i];
        p.t += dt * p.speed;
        if (p.t >= 1) {
          if (p.stage === 0) {
            p.stage = 1;
            p.edge = Math.floor(Math.random() * outEdges.length);
            glow = Math.min(1, glow + 0.08);
          } else {
            p.stage = 0;
            p.edge = Math.floor(Math.random() * inEdges.length);
          }
          p.t -= 1;
          p.speed = 0.18 + Math.random() * 0.22;
        }
        const curve = p.stage === 0 ? inEdges[p.edge] : outEdges[p.edge];
        curve.getPoint(p.t, tmp);
        pPos[i * 3] = tmp.x;
        pPos[i * 3 + 1] = tmp.y;
        pPos[i * 3 + 2] = tmp.z;
        const c = p.stage === 0 ? GREY : BLUE;
        const fade = p.stage === 0 ? 0.45 + p.t * 0.4 : 1 - p.t * 0.55;
        pCol[i * 3] = c.r * fade;
        pCol[i * 3 + 1] = c.g * fade;
        pCol[i * 3 + 2] = c.b * fade;
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.color.needsUpdate = true;
      glow = Math.max(0, glow - dt * 0.9);
      glowMat.size = 0.8 + glow * 0.7;
      glowMat.opacity = 0.25 + glow * 0.45;

      const next = Math.floor(elapsed / CHAPTER_SECONDS) % CHAPTERS.length;
      if (next !== lastChapter) {
        lastChapter = next;
        setChapter(next);
      }
    };

    const draw = (dt: number) => {
      step(dt);
      renderer.render(scene, camera);
      placeLabels();
    };

    let running = false;
    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt);
      frame = requestAnimationFrame(loop);
    };

    resize();
    // Settle the still: a short warm-up so the first frame already has flow.
    for (let i = 0; i < 40; i++) step(1 / 30);
    renderer.render(scene, camera);
    placeLabels();
    onReady?.();

    control.current = {
      start() { if (running) return; running = true; last = performance.now(); frame = requestAnimationFrame(loop); },
      stop() { running = false; cancelAnimationFrame(frame); },
    };

    return () => {
      control.current?.stop();
      control.current = null;
      ro.disconnect();
      lines.geometry.dispose();
      (lines.material as THREE.Material).dispose();
      pGeo.dispose();
      (points.material as THREE.Material).dispose();
      glowGeo.dispose();
      glowMat.dispose();
      texture.dispose();
      renderer.dispose();
    };
    // The scene is built once; playback state is driven through the control below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (active) control.current?.start();
    else control.current?.stop();
  }, [active]);

  const current = CHAPTERS[chapter];
  const labels = [...current.inputs, current.core, ...current.outputs];

  return (
    <div ref={host} className={cn("reel", className)} data-playing={active} data-testid="systems-reel">
      <canvas ref={canvasRef} className="reel-canvas" aria-hidden />
      <div className="reel-labels" aria-hidden key={chapter}>
        {labels.map((label, i) => (
          <span
            key={`${chapter}-${i}`}
            ref={(node) => { labelRefs.current[i] = node; }}
            className={cn("reel-label", i === 5 && "reel-label--core", i > 5 && "reel-label--out")}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="reel-hud reel-hud--top">
        <span>YK-01 · Systems reel</span>
        <span>{String(chapter + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}</span>
      </div>
      <div className="reel-hud reel-hud--bottom" key={`hud-${chapter}`}>
        <span className="reel-name">{current.name}</span>
        <span className="reel-result">{current.result}</span>
      </div>
      <p className="sr-only">
        Animated diagram: signals from {current.inputs.join(", ")} pass through the {current.core} and become {current.outputs.join(", ")}. {current.name}: {current.result}
      </p>
    </div>
  );
}
