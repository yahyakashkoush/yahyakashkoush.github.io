import { createServer } from "node:http";
import { createReadStream, realpathSync, statSync } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultRoot = fileURLToPath(new URL("../artifacts/portfolio/dist/public/", import.meta.url));
const mime = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".mp4": "video/mp4", ".webm": "video/webm",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".woff": "font/woff",
  ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".pdf": "application/pdf",
};

export function createPortfolioServer({ rootDir = defaultRoot } = {}) {
  let root;
  try {
    root = realpathSync(rootDir);
    if (!statSync(path.join(root, "index.html")).isFile()) throw new Error();
  } catch { throw new Error("Production files are missing. Run bash scripts/render-build.sh before starting."); }
  const inside = (file) => file.startsWith(root + path.sep);

  return createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    const reply = (status, text) => {
      res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end(req.method === "HEAD" ? undefined : text);
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      reply(405, "Method not allowed");
      return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, "http://internal").pathname); }
    catch { reply(400, "Invalid URL"); return; }
    if (pathname === "/healthz") {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(req.method === "HEAD" ? undefined : '{"status":"ok"}');
      return;
    }
    if (pathname.includes("\0") || pathname.split(/[\\/]/).some((part) => part.startsWith("."))) {
      reply(404, "Not found"); return;
    }
    try {
      let file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
      if (!inside(file)) { reply(404, "Not found"); return; }
      let info;
      try { info = await stat(file); } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
      }
      if (!info?.isFile()) {
        // SPA routes use index.html; missing files/APIs must not return HTML.
        const assetPath = /^\/(?:assets|media|api|rest|functions)(?:\/|$)/.test(pathname);
        if (assetPath || path.extname(pathname) || !/text\/html|\*\/\*/.test(req.headers.accept || "*/*")) {
          reply(404, "Not found"); return;
        }
        file = path.join(root, "index.html");
        info = await stat(file);
      }
      // A public-file symlink must not expose anything outside the build.
      if (!inside(await realpath(file))) { reply(404, "Not found"); return; }
      const etag = `"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
      const headers = {
        "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Content-Length": info.size,
        "Accept-Ranges": "bytes",
        "ETag": etag,
        "Last-Modified": info.mtime.toUTCString(),
        "Cache-Control": path.basename(file) === "index.html" ? "no-cache" :
          file.startsWith(path.join(root, "assets") + path.sep) ? "public, max-age=31536000, immutable" : "public, max-age=3600",
      };
      if (req.headers["if-none-match"] === etag) {
        delete headers["Content-Length"];
        res.writeHead(304, headers); res.end(); return;
      }
      let start = 0, end = info.size - 1, status = 200;
      const range = req.headers.range;
      const ifRange = req.headers["if-range"];
      if (range && (!ifRange || ifRange === etag || ifRange === headers["Last-Modified"])) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match || (!match[1] && !match[2])) {
          res.setHeader("Content-Range", `bytes */${info.size}`);
          reply(416, "Invalid range"); return;
        }
        start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size || (!match[1] && Number(match[2]) === 0)) {
          res.setHeader("Content-Range", `bytes */${info.size}`);
          reply(416, "Invalid range"); return;
        }
        status = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
        headers["Content-Length"] = end - start + 1;
      }
      res.writeHead(status, headers);
      if (req.method === "HEAD" || info.size === 0) { res.end(); return; }
      const stream = createReadStream(file, { start, end });
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    } catch {
      if (!res.headersSent) reply(500, "Unable to serve this request");
      else res.destroy();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 10000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be an integer between 1 and 65535.");
  const server = createPortfolioServer();
  server.on("error", (error) => { console.error(`Production server could not listen (${error.code || "server error"}).`); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Portfolio production server listening on port ${port}`));
  const stop = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}
