/**
 * Pilihan harian DETERMINISTIK: pengacakan stabil berdasarkan TANGGAL (zona waktu device).
 * Sama untuk semua user pada hari yang sama, dan otomatis GANTI saat pergantian hari — dipakai
 * mis. "Artikel untuk dibaca hari ini". Pola seed + shuffle sama dengan rotasi foto harian di
 * my.20fit (hash string ala xmur3 → PRNG ala mulberry32 → Fisher–Yates). Tanpa dependency.
 */

function dayStr(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** PRNG deterministik dari string seed. */
function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Ambil `n` item dari `arr` yang sudah diacak deterministik per hari (stabil sepanjang hari itu,
 * berubah keesokan harinya). `salt` opsional untuk membedakan beberapa daftar harian di satu
 * halaman. Bila item ≤ `n`, kembalikan salinan apa adanya (tak perlu diacak).
 */
export function pickDaily<T>(arr: readonly T[], n: number, salt = ""): T[] {
  const a = arr.slice();
  if (a.length <= n) return a;
  const rnd = seededRandom(dayStr() + "|" + salt);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a.slice(0, n);
}
