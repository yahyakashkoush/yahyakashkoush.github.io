/**
 * Derives the shipped envelope assets from the full-quality render produced by
 * scripts/render-envelope.mjs.
 *
 * The spec wants the wax seal to press on as its own beat at the end of the
 * send sequence, so the seal cannot stay baked into the envelope plate. It is
 * cut out here into its own transparent layer, and the flap underneath is
 * patched with clean paper lifted from directly above the seal — the same flap,
 * the same lighting, so the repair is invisible against near-black stock.
 *
 * Run: node scripts/derive-envelope.mjs
 */

import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = resolve(ROOT, "public/media/object");
// Master render lives outside public/ so the 3.4 MB plate never ships.
const SRC = resolve(ROOT, "_source/object/envelope-front.png");

// Measured from the render by scanning for the largest connected red region.
const SEAL = { x: 835, y: 512, w: 358, h: 349 };
// Generous margin so the seal's contact shadow travels with it.
const PAD = 46;

const CROP = {
  left: SEAL.x - PAD,
  top: SEAL.y - PAD,
  width: SEAL.w + PAD * 2,
  height: SEAL.h + PAD * 2,
};

const run = async () => {
  const base = sharp(SRC);
  const { width: W, height: H } = await base.metadata();
  console.log(`source ${W}x${H}`);

  /* 1. Seal cut-out -------------------------------------------------------- */

  const sealRGB = await sharp(SRC).extract(CROP).raw().toBuffer({ resolveWithObject: true });
  const { data: sd, info: si } = sealRGB;
  const sw = si.width;
  const sh = si.height;
  const sc = si.channels;

  // Alpha from redness: the wax is the only saturated red mass in the crop, and
  // its drop shadow is picked up by the luminance term so the seal does not
  // land on the paper with a hard cut edge.
  // Assembled as an explicit RGBA buffer. joinChannel's fourth channel is not
  // reliably tagged as alpha through a resize/encode chain, so the channel is
  // written directly instead.
  const sealRGBA = Buffer.alloc(sw * sh * 4);
  const cx = sw / 2;
  const cy = sh / 2;
  const rMax = Math.min(sw, sh) / 2;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * sc;
      const o = (y * sw + x) * 4;
      const r = sd[i];
      const g = sd[i + 1];
      const b = sd[i + 2];
      const redness = (r - Math.max(g, b)) / 255;
      const d = Math.hypot(x - cx, y - cy) / rMax;
      // Radial gate: nothing outside the seal disc survives, whatever its hue.
      const gate = d > 1 ? 0 : d > 0.9 ? (1 - d) / 0.1 : 1;
      const a = Math.max(0, Math.min(1, redness * 6)) * gate;
      sealRGBA[o] = r;
      sealRGBA[o + 1] = g;
      sealRGBA[o + 2] = b;
      sealRGBA[o + 3] = Math.round(a * 255);
    }
  }

  const sealPng = await sharp(sealRGBA, { raw: { width: sw, height: sh, channels: 4 } }).png().toBuffer();

  await sharp(sealPng).resize(512).webp({ quality: 92, alphaQuality: 100 }).toFile(resolve(DIR, "wax-seal.webp"));
  console.log("wrote wax-seal.webp");

  /* 2. Envelope plate with the seal removed -------------------------------- */

  // Rather than clone a patch from elsewhere — the flap carries a shading ramp,
  // so any donor region lands a visible lighter block — fill the disc with the
  // median colour of the ring immediately around the seal and re-noise it. On
  // near-black stock this is indistinguishable from the surrounding paper.
  const ring = [[], [], []];
  const rcx = CROP.width / 2;
  const rcy = CROP.height / 2;
  for (let y = 0; y < CROP.height; y++) {
    for (let x = 0; x < CROP.width; x++) {
      const d = Math.hypot((x - rcx) / rcx, (y - rcy) / rcy);
      if (d < 0.95 || d > 1.0) continue;
      const i = (y * sw + x) * sc;
      ring[0].push(sd[i]);
      ring[1].push(sd[i + 1]);
      ring[2].push(sd[i + 2]);
    }
  }
  const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)] ?? 0;
  const fill = [median(ring[0]), median(ring[1]), median(ring[2])];
  console.log("inpaint fill rgb", fill.join(","));

  // Opaque out past the seal's raised rim (the seal fills ~0.80 of the crop
  // radius), then feathered to nothing at the crop edge.
  const fillRGBA = Buffer.alloc(CROP.width * CROP.height * 4);
  for (let y = 0; y < CROP.height; y++) {
    for (let x = 0; x < CROP.width; x++) {
      const p = y * CROP.width + x;
      const n = (Math.random() - 0.5) * 4;
      const d = Math.hypot((x - rcx) / rcx, (y - rcy) / rcy);
      const a = d >= 1 ? 0 : d < 0.86 ? 1 : (1 - d) / 0.14;
      fillRGBA[p * 4] = Math.max(0, Math.min(255, fill[0] + n));
      fillRGBA[p * 4 + 1] = Math.max(0, Math.min(255, fill[1] + n));
      fillRGBA[p * 4 + 2] = Math.max(0, Math.min(255, fill[2] + n));
      fillRGBA[p * 4 + 3] = Math.round(a * 255);
    }
  }

  const feathered = await sharp(fillRGBA, { raw: { width: CROP.width, height: CROP.height, channels: 4 } })
    .png()
    .toBuffer();

  const plate = await sharp(SRC)
    .composite([{ input: feathered, left: CROP.left, top: CROP.top }])
    .png()
    .toBuffer();

  await sharp(plate).resize(1600).webp({ quality: 88 }).toFile(resolve(DIR, "envelope-plate.webp"));
  console.log("wrote envelope-plate.webp");

  // Keep a sealed composite for the OG/meta still and the reduced-motion poster.
  await sharp(SRC).resize(1600).webp({ quality: 88 }).toFile(resolve(DIR, "envelope-sealed.webp"));
  console.log("wrote envelope-sealed.webp");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
