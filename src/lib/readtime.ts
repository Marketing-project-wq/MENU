import { API_BASE } from "./constants";

/**
 * Estimasi waktu baca dari panjang teks nyata (~200 kata/menit). Buang gambar & URL markdown
 * agar tak menggelembungkan hitungan; minimal 1 menit. Rumus SAMA dengan yang dipakai di
 * ArticleDetailPage (dihitung dari isi, bukan angka karangan).
 */
export function computeReadMinutes(body: string): number {
  const words = (body || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\]\([^)]*\)/g, "] ")
    .replace(/[#*_>`~-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Cache satu proses: peta slug -> menit baca, dibuat sekali lalu dipakai ulang oleh Home & Artikel.
let cache: Promise<Record<string, number>> | null = null;

/**
 * Peta { slug -> menit baca } untuk SEMUA artikel terbit.
 *
 * SUMBER TUNGGAL: endpoint my.20fit `GET /api/menu/article-readtimes` (dihitung server dari
 * body_md, rumus SAMA dengan computeReadMinutes). Sebelumnya membaca Supabase langsung (anon) —
 * itu menduplikasi logika & bergantung pada RLS; sekarang lewat API yang sama dengan sisa app.
 *
 * Tahan-banting: kalau gagal, kembalikan {} supaya kartu tetap tampil tanpa "min read"
 * (tidak pernah melempar / memblokir render).
 */
export function getReadMinutesMap(): Promise<Record<string, number>> {
  if (cache) return cache;
  cache = (async () => {
    try {
      const r = await fetch(`${API_BASE}/api/menu/article-readtimes`);
      if (!r.ok) return {};
      const j = await r.json();
      const m = j && j.minutes;
      return (m && typeof m === "object") ? (m as Record<string, number>) : {};
    } catch {
      return {};
    }
  })();
  return cache;
}
