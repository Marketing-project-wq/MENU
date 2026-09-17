// server.mjs — server produksi recipe.20fit.id.
//
// Menggantikan `serve dist -s -l $PORT` (CLI) dengan server Node kecil yang
// melakukan PERSIS hal yang sama untuk file statis + fallback SPA (lewat
// `serve-handler`, library yang SAMA yang dipakai `serve` CLI di balik layar
// -- jadi perilaku serving yang sudah ada TIDAK berubah), DITAMBAH satu hal
// baru: proxy untuk sekelompok kecil path /api/* ke backend asli (my.20fit.id)
// supaya developer eksternal bisa akses API produk recipe lewat domain
// recipe.20fit.id, bukan cuma my.20fit.id.
//
// SENGAJA whitelist path, BUKAN proxy blanket "/api/*" -- my.20fit.id juga
// melayani API produk 20FIT lain (calorie tracker, admin, pembayaran, dst.)
// yang TIDAK ada hubungannya dengan recipe.20fit.id dan tidak boleh ikut
// terekspos lewat domain ini.
import http from "node:http";
import serveHandler from "serve-handler";

const PORT = process.env.PORT || 3000;
const DIST_DIR = new URL("./dist", import.meta.url).pathname;

// Backend asli tempat semua endpoint /api/menu/*, /api/content/v1/*, dan
// dokumentasi OpenAPI benar-benar berjalan (repo PROFILE20FIT, server.js).
// Boleh di-override via env (mis. staging) -- default ke produksi.
const API_PROXY_TARGET = (process.env.API_PROXY_TARGET || "https://my.20fit.id").replace(/\/+$/, "");

// Whitelist path yang di-proxy. Path lain yang diawali "/api/" TETAP TIDAK
// di-proxy (jatuh ke serve-handler seperti biasa -> 404 lewat fallback SPA,
// bukan diam-diam diteruskan ke backend).
const PROXY_PATH_PREFIXES = [
  "/api/docs",
  "/api/openapi.json",
  "/api/openapi.yaml",
  "/api/content/v1",
  "/api/menu",
];

function shouldProxy(pathname) {
  return PROXY_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"));
}

// Header hop-by-hop yang tidak boleh diteruskan mentah-mentah (RFC 7230 §6.1),
// plus host/content-length yang harus dihitung ulang oleh fetch() sendiri.
const HOP_BY_HOP = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade", "host", "content-length",
]);

async function proxyToBackend(req, res, targetUrl) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null || HOP_BY_HOP.has(k.toLowerCase())) continue;
    headers.set(k, Array.isArray(v) ? v.join(", ") : v);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let body;
  if (hasBody) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = chunks.length ? Buffer.concat(chunks) : undefined;
  }

  let upstream;
  try {
    upstream = await fetch(targetUrl, { method: req.method, headers, body, redirect: "manual" });
  } catch (e) {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Tidak bisa menghubungi backend API." }));
    return;
  }

  const resHeaders = {};
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) resHeaders[key] = value;
  });
  res.writeHead(upstream.status, resHeaders);
  if (upstream.body) {
    for await (const chunk of upstream.body) res.write(chunk);
  }
  res.end();
}

const server = http.createServer(async (req, res) => {
  const pathname = (req.url || "/").split("?")[0];

  if (shouldProxy(pathname)) {
    const targetUrl = API_PROXY_TARGET + req.url;
    await proxyToBackend(req, res, targetUrl);
    return;
  }

  // Perilaku IDENTIK dengan `serve dist -s`: file statis di dist/, fallback ke
  // index.html untuk path yang bukan file nyata (single-page app rewrite).
  await serveHandler(req, res, {
    public: DIST_DIR,
    rewrites: [{ source: "**", destination: "/index.html" }],
    headers: [
      {
        // Sama seperti sebelumnya: HTML/JS/CSS selalu divalidasi ulang ke
        // server (bukan cache-first) supaya user dapat versi baru tanpa
        // hard-refresh setelah deploy.
        source: "**/*.(html|js|css)",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ],
  });
});

server.listen(PORT, () => {
  console.log(`recipe.20fit.id (static + API proxy) running on port ${PORT}`);
  console.log(`Proxy target: ${API_PROXY_TARGET}, path: ${PROXY_PATH_PREFIXES.join(", ")}`);
});
