import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root, otherwise Turbopack walks up to C:\Users\pc and
  // picks up an unrelated package-lock.json.
  turbopack: { root: path.resolve(".") },
  // GitHub Pages serves static files only — no Node server behind it, so the
  // site ships as a full static export, and next/image can't use its default
  // server-side optimizer. Every image on the site is already pre-sized by
  // the asset pipeline (scripts/derive-envelope.mjs, audit-media.mjs), so
  // losing on-the-fly optimization costs nothing here.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
