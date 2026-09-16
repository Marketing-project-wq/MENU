// Generate public/sitemap.xml dari daftar artikel TERBIT + rute utama.
//   node scripts/gen-sitemap.mjs
// Sumber artikel: API publik my.20fit.id. Kalau fetch gagal -> tulis rute utama saja
// (non-fatal, tidak pernah bikin proses error). Jalankan ulang tiap nambah artikel biar
// sitemap segar (SPA statis: sitemap tak auto-update sendiri).
import { writeFileSync } from "node:fs";

const SITE = (process.env.SITE_URL || "https://recipe.20fit.id").replace(/\/$/, "");
const API = (process.env.API_URL || "https://my.20fit.id") + "/api/menu/articles?limit=1000";
const STATIC = ["/", "/resep", "/artikel", "/eat-now"];

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const urls = STATIC.map((p) => ({ loc: SITE + p }));

try {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  const r = await fetch(API, { signal: ctrl.signal });
  clearTimeout(to);
  if (r.ok) {
    const j = await r.json();
    const arts = Array.isArray(j?.articles) ? j.articles : [];
    for (const a of arts) {
      if (!a?.slug) continue;
      const lastmod = a.published_at ? String(a.published_at).slice(0, 10) : undefined;
      urls.push({ loc: `${SITE}/artikel/${encodeURIComponent(a.slug)}`, lastmod });
    }
    console.log(`sitemap: ${arts.length} artikel + ${STATIC.length} rute utama`);
  } else {
    console.warn(`sitemap: API ${r.status} — hanya rute utama`);
  }
} catch (e) {
  console.warn(`sitemap: fetch gagal (${e.message}) — hanya rute utama`);
}

const body = urls
  .map(
    (u) =>
      `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n  </url>`
  )
  .join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(new URL("../public/sitemap.xml", import.meta.url), xml);
console.log(`wrote public/sitemap.xml (${urls.length} URL)`);
