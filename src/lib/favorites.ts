import type { RecipeVM } from "./types";

/**
 * "Favorit" resep untuk carousel beranda.
 *
 * Kenapa deterministik, bukan "paling banyak di-love": data popularitas masih kosong
 * (tabel my20fit_menu_reaction = 0 baris, save = 0, open sangat sedikit), jadi ranking
 * popularitas belum bermakna. Sementara ini favorit = pilihan editorial deterministik:
 * disebar lintas kategori supaya variatif dan STABIL (tidak berubah tiap render).
 *
 * Upgrade path (tanpa mengubah UI): my20fit_menu_reaction sudah anon-readable
 * (policy SELECT untuk anon = true), jadi begitu jumlah heart cukup, ganti sumber
 * pemilihan jadi "top by reaction" — carousel & kartunya tetap sama.
 */
export function pickFavorites(vms: RecipeVM[], n: number): RecipeVM[] {
  const withData = vms.filter((r) => r.kcal != null); // utamakan resep dengan data gizi (official)
  const pool = withData.length ? withData : vms;

  // Kelompokkan per kategori (null -> "_"), lalu ambil bergiliran satu per kategori (round-robin)
  // supaya carousel tidak didominasi satu kategori.
  const byCat = new Map<string, RecipeVM[]>();
  for (const r of pool) {
    const k = r.category || "_";
    const arr = byCat.get(k);
    if (arr) arr.push(r);
    else byCat.set(k, [r]);
  }

  const buckets = Array.from(byCat.values());
  const out: RecipeVM[] = [];
  let idx = 0;
  while (out.length < n && buckets.some((b) => b.length > 0)) {
    const b = buckets[idx % buckets.length];
    if (b.length > 0) out.push(b.shift()!);
    idx++;
  }
  return out.slice(0, n);
}
