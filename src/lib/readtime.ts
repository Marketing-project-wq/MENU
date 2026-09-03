import { supabase } from "./supabase";

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
 * Peta { slug -> menit baca } untuk SEMUA artikel terbit, dihitung dari body_md.
 *
 * Diambil LANGSUNG dari Supabase (anon) karena endpoint daftar artikel (ArticleSummary) tidak
 * mengangkut body, jadi kartu tak bisa menghitung sendiri. Ini hanya metadata read-only publik
 * (artikel-nya memang sudah tayang di situs), bukan menggantikan sumber daftar artikel (tetap API).
 *
 * Tahan-banting: kalau tabel belum anon-readable / gagal, kembalikan {} supaya kartu tetap
 * tampil tanpa "min read" (tidak pernah melempar / memblokir render).
 *
 * Catatan: butuh policy SELECT anon di my20fit_recipe_article (status='published'). SQL-nya
 * ada di DEVLOG.md — dijalankan lewat jalur Supabase terpisah.
 */
export function getReadMinutesMap(): Promise<Record<string, number>> {
  if (cache) return cache;
  cache = (async () => {
    try {
      const { data, error } = await supabase
        .from("my20fit_recipe_article")
        .select("slug, body_md, body_md_id, body_md_en")
        .eq("status", "published");
      if (error || !Array.isArray(data)) return {};
      const map: Record<string, number> = {};
      for (const row of data as Array<Record<string, string | null>>) {
        const slug = (row.slug || "").toString();
        if (!slug) continue;
        const body = row.body_md || row.body_md_id || row.body_md_en || "";
        map[slug] = computeReadMinutes(body);
      }
      return map;
    } catch {
      return {};
    }
  })();
  return cache;
}
