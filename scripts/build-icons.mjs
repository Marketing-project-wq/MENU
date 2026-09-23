// Build small, TRANSPARENT product icons for the 20FIT app-switcher.
//
// Sumber = artwork 3D 20FIT ASLI: file "*.svg" di root repo (di-upload). Tiap SVG
// sebenarnya membungkus DUA PNG 2048px: (1) grayscale = MASK luminance, (2) RGB =
// lapisan warna di atas latar hitam. SVG-nya mengkomposit: alpha = luminance(mask),
// warna = RGB. Jadi kalau cuma ambil lapisan warna -> latar HITAM (bug lama). Di sini
// kita komposit mask+warna -> ikon transパアn (latar hilang), lalu box-downscale ke 128px.
//
// Node stdlib saja (zlib) — tak ada library gambar di sandbox. Regenerate:
//   node scripts/build-icons.mjs
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "icons");
const SIZE = 128;

// product id (= nama file output) -> file artwork SVG di root repo.
// book-class & workout sengaja pakai artwork "Class Activity" yang sama (dua-duanya kelas gym).
const MAP = {
  home: "Footer Home.svg",
  my20fit: "Footer Account.svg",
  recipe: "Menu Food.svg",
  calorie: "Footer Calorie.svg",
  mcu: "Menu Medical Checkup.svg",
  workout: "Menu Class Activity.svg",
  progress: "Footer Activity.svg",
  media: "Menu Media.svg",
  photo: "Menu Photo.svg",
  ticket: "Footer Ticket.svg",
  talent: "Menu Membership.svg",
  "book-class": "Menu Class Activity.svg",
  "book-coach": "Menu Coach.svg",
  "book-doctor": "Menu Doctor.svg",
  "book-recovery": "Menu Recovery.svg",
};

const crc32 = zlib.crc32 || (() => {
  const T = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  return (buf, seed = 0) => { let c = ~seed >>> 0; for (let i = 0; i < buf.length; i++) c = T[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (~c) >>> 0; };
})();

function paeth(a, b, c) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }

function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not png");
  let off = 8, w = 0, h = 0, bitDepth = 0, colorType = 0, interlace = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString("ascii", off + 4, off + 8); const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; interlace = data[12]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (bitDepth !== 8) throw new Error("bitDepth " + bitDepth);
  if (interlace !== 0) throw new Error("interlaced");
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 4 ? 2 : null;
  if (!ch) throw new Error("colorType " + colorType);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const rec = Buffer.allocUnsafe(h * stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)]; const rowOff = y * (stride + 1) + 1; const rOff = y * stride, pOff = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? rec[rOff + x - ch] : 0, b = y > 0 ? rec[pOff + x] : 0, c = x >= ch && y > 0 ? rec[pOff + x - ch] : 0;
      let v = raw[rowOff + x];
      if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1; else if (ft === 4) v += paeth(a, b, c);
      rec[rOff + x] = v & 0xff;
    }
  }
  return { w, h, ch, colorType, rec };
}

// Komposit: RGBA 2048px dari lapisan warna (RGB) + mask (grayscale luminance -> alpha).
function compositeRGBA(color, mask) {
  const { w, h, ch, rec } = color; const m = mask.rec, mch = mask.ch;
  const out = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    const co = p * ch, mo = p * mch;
    out[p * 4] = rec[co];
    out[p * 4 + 1] = ch >= 3 ? rec[co + 1] : rec[co];
    out[p * 4 + 2] = ch >= 3 ? rec[co + 2] : rec[co];
    out[p * 4 + 3] = m[mo]; // grayscale mask value = luminance = alpha
  }
  return { w, h, data: out };
}

// Box-downscale RGBA dgn premultiplied alpha (biar tepi transparan tak "berhalo" hitam).
function downscaleRGBA({ w, h, data }, size) {
  const out = Buffer.alloc(size * size * 4);
  const fx = w / size, fy = h / size;
  for (let dy = 0; dy < size; dy++) {
    const sy0 = Math.floor(dy * fy), sy1 = Math.max(sy0 + 1, Math.floor((dy + 1) * fy));
    for (let dx = 0; dx < size; dx++) {
      const sx0 = Math.floor(dx * fx), sx1 = Math.max(sx0 + 1, Math.floor((dx + 1) * fx));
      let R = 0, G = 0, B = 0, A = 0;
      for (let sy = sy0; sy < sy1; sy++) for (let sx = sx0; sx < sx1; sx++) {
        const o = (sy * w + sx) * 4; const a = data[o + 3];
        R += data[o] * a; G += data[o + 1] * a; B += data[o + 2] * a; A += a;
      }
      const di = (dy * size + dx) * 4; const aAvg = A / ((sx1 - sx0) * (sy1 - sy0));
      out[di + 3] = Math.round(aAvg);
      if (A > 0) { out[di] = Math.round(R / A); out[di + 1] = Math.round(G / A); out[di + 2] = Math.round(B / A); }
    }
  }
  return out;
}

function encodePNG(rgba, size) {
  const stride = size * 4; const raw = Buffer.allocUnsafe(size * (stride + 1));
  for (let y = 0; y < size; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }
  const comp = zlib.deflateSync(raw, { level: 9 });
  const chunk = (type, data) => { const c = Buffer.allocUnsafe(12 + data.length); c.writeUInt32BE(data.length, 0); c.write(type, 4, "ascii"); data.copy(c, 8); c.writeUInt32BE(crc32(c.subarray(4, 8 + data.length)) >>> 0, 8 + data.length); return c; };
  const ihdr = Buffer.allocUnsafe(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", comp), chunk("IEND", Buffer.alloc(0))]);
}

// --- Body Scan: tak ada artwork 3D; gambar glyph "scan frame" merah (sudut kurung + garis
// pindai) mirip ikon Body Scan di my.20fit.id. Supersample 4x lalu downscale = anti-alias. ---
function drawBodyScan(size) {
  const SS = size * 4; const big = Buffer.alloc(SS * SS * 4);
  const R = 0xC4, G = 0x11, B = 0x01; // 20FIT red
  const px = (x, y, a) => { if (x < 0 || y < 0 || x >= SS || y >= SS) return; const o = (y * SS + x) * 4; if (a <= big[o + 3]) return; big[o] = R; big[o + 1] = G; big[o + 2] = B; big[o + 3] = a; };
  const t = SS * 0.075;               // ketebalan garis
  const m = SS * 0.16, M = SS * 0.84; // margin frame
  const arm = SS * 0.20;              // panjang lengan sudut
  const seg = (x0, y0, x1, y1) => { // segmen tebal (persegi) dari (x0,y0) ke (x1,y1)
    const ax = Math.min(x0, x1) - t / 2, bx = Math.max(x0, x1) + t / 2;
    const ay = Math.min(y0, y1) - t / 2, by = Math.max(y0, y1) + t / 2;
    for (let y = Math.floor(ay); y <= Math.ceil(by); y++) for (let x = Math.floor(ax); x <= Math.ceil(bx); x++) px(x, y, 255);
  };
  // 4 sudut kurung
  seg(m, m, m + arm, m); seg(m, m, m, m + arm);             // kiri-atas
  seg(M - arm, m, M, m); seg(M, m, M, m + arm);             // kanan-atas
  seg(m, M - arm, m, M); seg(m, M, m + arm, M);             // kiri-bawah
  seg(M - arm, M, M, M); seg(M, M - arm, M, M);             // kanan-bawah
  // garis pindai horizontal di tengah
  seg(m + arm * 0.6, SS / 2, M - arm * 0.6, SS / 2);
  return downscaleRGBA({ w: SS, h: SS, data: big }, size);
}

fs.mkdirSync(OUT, { recursive: true });
let total = 0, count = 0;
for (const [id, file] of Object.entries(MAP)) {
  const svg = fs.readFileSync(path.join(ROOT, file), "utf8");
  const blobs = [...svg.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)].map((x) => Buffer.from(x[1], "base64"));
  if (blobs.length < 2) { console.log(id.padEnd(13), "SKIP (<2 png blobs in " + file + ")"); continue; }
  const imgs = blobs.map(decodePNG);
  const mask = imgs.find((i) => i.colorType === 0) || imgs.reduce((a, b) => (a.rec.length < b.rec.length ? a : b));
  const color = imgs.find((i) => i.colorType === 2 || i.colorType === 6) || imgs.reduce((a, b) => (a.rec.length > b.rec.length ? a : b));
  const out = encodePNG(downscaleRGBA(compositeRGBA(color, mask), SIZE), SIZE);
  fs.writeFileSync(path.join(OUT, id + ".png"), out);
  total += out.length; count++;
  console.log(`${id.padEnd(13)} <- ${file.padEnd(24)} ${color.w}x${color.h} -> ${SIZE}px  ${(out.length / 1024).toFixed(1)}KB`);
}
// Body Scan (digambar)
{
  const out = encodePNG(drawBodyScan(SIZE), SIZE);
  fs.writeFileSync(path.join(OUT, "bodyscan.png"), out);
  total += out.length; count++;
  console.log(`${"bodyscan".padEnd(13)} <- (drawn scan-frame glyph)      ${SIZE}px  ${(out.length / 1024).toFixed(1)}KB`);
}
console.log(`\nTOTAL ${count} icons: ${(total / 1024).toFixed(1)}KB`);
