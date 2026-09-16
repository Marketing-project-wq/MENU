// Skala JUMLAH bahan dari TEKS BEBAS. Bahan di recepie disimpan sebagai string
// ("2 potong ayam", "1/2 ruas jahe", "garam secukupnya") — tidak terstruktur. Jadi ini
// BEST-EFFORT, bukan jaminan 100% akurat.
//
// ATURAN (biar tidak salah-skala):
//  - Hanya kuantitas di AWAL baris yang diskalakan (konvensi resep: "2 potong ayam").
//  - Angka lain di baris (catatan, nama produk "3-in-1", "kocok 2 menit") TIDAK disentuh.
//  - Baris tanpa kuantitas awal ("garam secukupnya", "air 500 ml") DIBIARKAN apa adanya —
//    lebih baik tidak diubah daripada salah-skala.
//  - Dukungan: bulat, desimal (period/koma), pecahan (1/2), campuran (1 1/2), unicode (½),
//    dan rentang (2-3 -> 4-6).

import type { IngredientGroup } from "./types";

const UNICODE_FRAC: Record<string, number> = {
  "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75,
  "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8,
  "⅙": 1 / 6, "⅚": 5 / 6, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};
const FRAC_CHARS = "½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞";

/** Ubah satu token kuantitas ke angka. null kalau bukan angka yang dikenali. */
function parseNum(tok: string): number | null {
  const t = tok.trim();
  if (!t) return null;
  // Campuran pecahan: "1 1/2"
  let m = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) { const d = +m[3]; return d ? +m[1] + +m[2] / d : null; }
  // Campuran unicode: "1½"
  m = t.match(new RegExp("^(\\d+)\\s*([" + FRAC_CHARS + "])$"));
  if (m) return +m[1] + UNICODE_FRAC[m[2]];
  // Unicode murni: "½"
  if (t.length === 1 && UNICODE_FRAC[t] != null) return UNICODE_FRAC[t];
  // Pecahan: "1/2"
  m = t.match(/^(\d+)\/(\d+)$/);
  if (m) { const d = +m[2]; return d ? +m[1] / d : null; }
  // Desimal/bulat, koma atau titik: "2", "2.5", "2,5"
  if (/^\d+(?:[.,]\d+)?$/.test(t)) return parseFloat(t.replace(",", "."));
  return null;
}

/** Format angka hasil skala jadi teks rapi: bulat, pecahan umum (½ ⅓ ⅔ ¼ ¾), atau desimal. */
function formatNum(n: number): string {
  if (!isFinite(n) || n < 0) return String(n);
  n = Math.round(n * 1000) / 1000; // buang noise floating point
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  if (frac < 1e-6) return String(whole);
  const table: [number, string][] = [[0.5, "½"], [0.25, "¼"], [0.75, "¾"], [1 / 3, "⅓"], [2 / 3, "⅔"]];
  for (const [v, g] of table) {
    if (Math.abs(frac - v) < 0.01) return whole > 0 ? `${whole}${g}` : g;
  }
  return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

// Token kuantitas tunggal di awal (urutan penting: campuran dulu sebelum bulat).
const LEADING = new RegExp(
  "^(" +
    "\\d+\\s+\\d+\\/\\d+" +          // 1 1/2
    "|\\d+\\s*[" + FRAC_CHARS + "]" + // 1½
    "|\\d+\\/\\d+" +                 // 1/2
    "|[" + FRAC_CHARS + "]" +        // ½
    "|\\d+(?:[.,]\\d+)?" +           // 2 / 2.5 / 2,5
  ")(?=\\s|$|[a-zA-Z(])"
);
// Rentang di awal: "2-3", "2 – 3" (angka biasa saja; diikuti spasi/akhir/huruf).
const RANGE = /^(\d+(?:[.,]\d+)?)\s*[-–—]\s*(\d+(?:[.,]\d+)?)(?=\s|$|[a-zA-Z(])/;

/**
 * Skala kuantitas di AWAL satu baris bahan. Kalau tak ada kuantitas awal yang jelas,
 * kembalikan baris apa adanya (jangan ngarang).
 */
export function scaleIngredientLine(line: string, ratio: number): string {
  if (!isFinite(ratio) || ratio <= 0 || Math.abs(ratio - 1) < 1e-9) return line;

  // Rentang lebih dulu (biar "2-3" tidak ketangkap sebagai "2" saja).
  const r = line.match(RANGE);
  if (r) {
    const a = parseNum(r[1]);
    const b = parseNum(r[2]);
    if (a != null && b != null) {
      return formatNum(a * ratio) + "–" + formatNum(b * ratio) + line.slice(r[0].length);
    }
  }

  const m = line.match(LEADING);
  if (m) {
    const n = parseNum(m[1]);
    if (n != null) return formatNum(n * ratio) + line.slice(m[1].length);
  }

  return line; // tidak ada kuantitas awal yang jelas -> biarkan
}

/** Skala semua item di tiap kelompok bahan. ratio<=0/1/NaN -> kembalikan groups apa adanya. */
export function scaleIngredientGroups(groups: IngredientGroup[], ratio: number): IngredientGroup[] {
  if (!isFinite(ratio) || ratio <= 0 || Math.abs(ratio - 1) < 1e-9) return groups;
  return groups.map((g) => ({ title: g.title, items: g.items.map((it) => scaleIngredientLine(it, ratio)) }));
}
