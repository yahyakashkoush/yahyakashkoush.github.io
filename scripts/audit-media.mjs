// Reads real intrinsic dimensions straight from file headers so the media
// registry is never based on guesswork. Run: node scripts/audit-media.mjs
import fs from "node:fs";
import path from "node:path";

function pngSize(b) {
  if (b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), format: "png" };
}

function jpegSize(b) {
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    // SOF0..SOF15, excluding DHT(c4) DAC(cc) and RSTn
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7), format: "jpeg" };
    }
    i += 2 + len;
  }
  return null;
}

/** Walks MP4 boxes for track dimensions and duration. */
function mp4Info(b) {
  const out = { format: "mp4" };
  const walk = (start, end) => {
    let p = start;
    while (p + 8 <= end) {
      let size = b.readUInt32BE(p);
      const type = b.toString("latin1", p + 4, p + 8);
      let head = 8;
      if (size === 1) { size = Number(b.readBigUInt64BE(p + 8)); head = 16; }
      if (size < head || p + size > end) break;
      if (type === "mvhd") {
        const v = b[p + head];
        const scale = v === 1 ? b.readUInt32BE(p + head + 20) : b.readUInt32BE(p + head + 12);
        const dur = v === 1 ? Number(b.readBigUInt64BE(p + head + 24)) : b.readUInt32BE(p + head + 16);
        out.duration = +(dur / scale).toFixed(2);
      }
      if (type === "tkhd") {
        const w = b.readUInt32BE(p + size - 8) / 65536;
        const h = b.readUInt32BE(p + size - 4) / 65536;
        if (w > 1) { out.w = Math.round(w); out.h = Math.round(h); }
      }
      if (["moov", "trak", "mdia", "minf", "stbl"].includes(type)) walk(p + head, p + size);
      p += size;
    }
  };
  walk(0, b.length);
  return out;
}

function inspect(file) {
  const b = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  const info = ext === ".png" ? pngSize(b) : ext === ".mp4" ? mp4Info(b) : jpegSize(b);
  return { ...(info ?? { format: "unknown" }), bytes: b.length };
}

const roots = process.argv.slice(2);
for (const root of roots) {
  console.log(`\n=== ${root} ===`);
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const fp = path.join(dir, name);
      if (fs.statSync(fp).isDirectory()) { walk(fp); continue; }
      if (/desktop\.ini|\.txt$/i.test(name)) continue;
      const i = inspect(fp);
      const dims = i.w ? `${i.w}x${i.h}` : "?";
      const ratio = i.w ? (i.w / i.h).toFixed(3) : "?";
      const dur = i.duration ? ` ${i.duration}s` : "";
      console.log(
        `${fp.split(path.sep).join("/").padEnd(58)} ${String(i.format).padEnd(5)} ${dims.padEnd(11)} r=${ratio}${dur}  ${(i.bytes / 1024).toFixed(0)}KB`,
      );
    }
  };
  walk(root);
}
