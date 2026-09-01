/**
 * Ubah URL foto jadi versi berukuran pas (bukan kirim gambar 1024px penuh ke kartu 150px).
 * - Foto di Supabase Storage (bucket my20fit-foodimg / menu-photos / menu-images) → pakai endpoint
 *   render/image bawaan Supabase (dites manual: 1024x1024 PNG 1.5MB -> width=300 jadi ~28KB WebP).
 *   Browser kirim header Accept: image/webp otomatis -> hasilnya WebP, browser lama dapat format asli
 *   (fallback otomatis, tak perlu <picture>/source manual).
 * - Foto Pexels → API mereka sendiri sudah terima query param `w` untuk resize dinamis.
 * - Sumber lain (TheMealDB, base64 kontribusi member, dll) → dikembalikan apa adanya (tak didukung).
 */

const SUPABASE_OBJECT_RE = /^(https:\/\/[a-z0-9-]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/i;

export function sizedUrl(url: string, width: number, quality = 70): string {
  const sb = SUPABASE_OBJECT_RE.exec(url);
  if (sb) {
    return `${sb[1]}/storage/v1/render/image/public/${sb[2]}?width=${width}&quality=${quality}`;
  }
  if (url.includes("images.pexels.com")) {
    const u = new URL(url);
    u.searchParams.set("w", String(width));
    u.searchParams.delete("h"); // hanya set lebar -> tinggi ikut proporsional (bukan crop paksa)
    return u.toString();
  }
  return url; // TheMealDB / data: / lainnya -- tak ada cara aman untuk resize, pakai apa adanya
}

/** srcset dari beberapa lebar target -- browser pilih sendiri sesuai kerapatan layar & ukuran slot. */
export function buildSrcSet(url: string, widths: number[]): string | undefined {
  if (url.startsWith("data:")) return undefined; // base64 -- srcset percuma, satu string sudah berat
  return widths.map((w) => `${sizedUrl(url, w)} ${w}w`).join(", ");
}
