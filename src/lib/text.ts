// Util teks tampilan.

/**
 * Bersihkan emoji/simbol yang menempel di AWAL judul artikel (mis. "🍎 10 Camilan Sehat" ->
 * "10 Camilan Sehat"). Sebagian judul lama di DB diawali emoji kategori; kita ganti perannya
 * dengan ikon garis minimalis, jadi emoji-nya dibuang di layer tampilan. Aman untuk judul yang
 * sudah bersih (tak ada yang dibuang).
 *
 * Cara kerja: buang semua karakter di awal yang BUKAN huruf/angka (emoji, tanda baca, spasi,
 * variation selector, ZWJ) sampai ketemu karakter "kata" pertama. Pakai properti Unicode \p{L}
 * (huruf) & \p{N} (angka) supaya judul non-Latin pun aman.
 */
export function cleanTitle(title?: string | null): string {
  return (title || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
}
