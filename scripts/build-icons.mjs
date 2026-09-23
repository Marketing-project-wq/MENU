// Extract the embedded PNG artwork from each 20FIT "SVG" (base64 PNG inside),
// box-downscale 2048->SIZE with premultiplied alpha, re-encode as a small PNG.
// Pure Node stdlib (zlib) — no image libraries available in this sandbox.
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const SRC = process.cwd();
const OUT = "public/icons";
const SIZE = 128;

// product slug -> source SVG filename (user-uploaded artwork)
const MAP = {
  home: "Footer Home.svg",
  my20fit: "Footer Account.svg",
  recipe: "Menu Food.svg",
  calorie: "Footer Calorie.svg",
  mcu: "Menu Medical Checkup.svg",
  media: "Menu Media.svg",
  workout: "Menu Class Activity.svg",
  photo: "Menu Photo.svg",
  ticket: "Footer Ticket.svg",
  talent: "Menu Coach.svg",
};

const crc32 = zlib.crc32 || (() => { // fallback table impl
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
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : null;
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
  return { w, h, ch, rec };
}

function downscaleRGBA({ w, h, ch, rec }, size) {
  const out = Buffer.alloc(size * size * 4);
  const fx = w / size, fy = h / size;
  for (let dy = 0; dy < size; dy++) {
    const sy0 = Math.floor(dy * fy), sy1 = Math.max(sy0 + 1, Math.floor((dy + 1) * fy));
    for (let dx = 0; dx < size; dx++) {
      const sx0 = Math.floor(dx * fx), sx1 = Math.max(sx0 + 1, Math.floor((dx + 1) * fx));
      let R = 0, G = 0, B = 0, A = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++) for (let sx = sx0; sx < sx1; sx++) {
        const o = (sy * w + sx) * ch;
        const a = ch === 4 ? rec[o + 3] : 255;
        const r = rec[o], g = ch >= 3 ? rec[o + 1] : rec[o], b = ch >= 3 ? rec[o + 2] : rec[o];
        R += r * a; G += g * a; B += b * a; A += a; n++; // premultiplied
      }
      const di = (dy * size + dx) * 4; const aAvg = A / n;
      out[di + 3] = Math.round(aAvg);
      if (aAvg > 0) { out[di] = Math.round(R / A); out[di + 1] = Math.round(G / A); out[di + 2] = Math.round(B / A); }
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

fs.mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [slug, file] of Object.entries(MAP)) {
  const svg = fs.readFileSync(path.join(SRC, file), "utf8");
  const m = [...svg.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)].map(x => x[1]);
  if (!m.length) { console.log(slug, "NO IMAGE"); continue; }
  const b64 = m.reduce((a, b) => (b.length > a.length ? b : a));
  const png = Buffer.from(b64, "base64");
  const dec = decodePNG(png);
  const small = downscaleRGBA(dec, SIZE);
  const out = encodePNG(small, SIZE);
  const dest = path.join(OUT, slug + ".png");
  fs.writeFileSync(dest, out);
  total += out.length;
  console.log(`${slug.padEnd(9)} <- ${file.padEnd(24)} ${dec.w}x${dec.h} -> ${SIZE}px  ${(out.length / 1024).toFixed(1)}KB`);
}
console.log(`\nTOTAL 10 icons: ${(total / 1024).toFixed(1)}KB`);
