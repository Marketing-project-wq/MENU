/* Generate ikon PWA dari LOGO 20FIT ASLI (bukan bikin logo sendiri).
 *   node scripts/gen-icons.mjs
 * Ambil logo (default: favicon 20FIT di media.20fit.id) -> tempel ke KOTAK PERSEGI putih
 * dengan padding (biar tidak gepeng/letterbox & aman jadi ikon maskable) -> tulis PNG
 * 192 / 512 / maskable-512 / apple-touch (180) ke public/icons/.
 *
 * NON-FATAL: kalau logo tak bisa diambil / gagal proses, script tetap exit 0 supaya build
 * situs TIDAK rusak. (Cek log build: "icons ok" = sukses, "SKIPPED" = perlu diperbaiki.)
 * Jalan di CI/Railway yang punya akses ke media.20fit.id.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import Jimp from "jimp";

const LOGO_URL =
  process.env.PWA_LOGO_URL || "https://media.20fit.id/wp-content/uploads/2026/05/Logo-20fit.png";
const OUT_DIR = new URL("../public/icons/", import.meta.url);
const BG = 0xffffffff; // putih opak (brand: putih). Logo 20FIT (tinta gelap) kontras di atasnya.

async function makeIcon(logo, size, pad, file) {
  const canvas = new Jimp(size, size, BG);
  const box = size - pad * 2;
  const mark = logo.clone().scaleToFit(box, box);
  const x = Math.round((size - mark.getWidth()) / 2);
  const y = Math.round((size - mark.getHeight()) / 2);
  canvas.composite(mark, x, y);
  const buf = await canvas.getBufferAsync(Jimp.MIME_PNG);
  writeFileSync(new URL(file, OUT_DIR), buf);
  console.log(`  wrote ${file} (${size}px)`);
}

async function run() {
  mkdirSync(OUT_DIR, { recursive: true });
  const res = await fetch(LOGO_URL);
  if (!res.ok) throw new Error(`fetch logo ${res.status}`);
  const logo = await Jimp.read(Buffer.from(await res.arrayBuffer()));
  console.log(`gen-icons: logo ${logo.getWidth()}x${logo.getHeight()} dari ${LOGO_URL}`);

  await makeIcon(logo, 192, 24, "icon-192.png");
  await makeIcon(logo, 512, 64, "icon-512.png");
  await makeIcon(logo, 512, 110, "maskable-512.png"); // safe-zone lebih besar utk Android adaptive
  await makeIcon(logo, 180, 22, "apple-touch-icon.png"); // iOS home screen
  console.log("icons ok");
}

run().catch((e) => {
  console.warn(`gen-icons SKIPPED (non-fatal): ${e.message}`);
  process.exit(0);
});
