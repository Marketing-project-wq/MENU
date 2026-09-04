// "Eat Now" -> LINK JUJUR ke halaman cuisine GrabFood yang relevan dengan kategori menu.
// BUKAN scraping / BUKAN menarik data Grab -- hanya redirect ke halaman kategori publik mereka
// (daftar resto asli muncul di sisi Grab setelah user memasukkan alamat). Path diambil dari
// struktur URL publik food.grab.com (sama dengan GRABFOOD_PRESETS di server my.20fit.id).
// Kategori tanpa padanan cuisine -> fallback ke "Masakan Indonesia" (minimal buka GrabFood yang relevan).

const GRAB_BASE = "https://food.grab.com";

// Kunci = nilai kategori mentah dari katalog resep (lihat CAT_LABELS di i18n.ts).
const CUISINE_PATH: Record<string, string> = {
  Rice: "/id/id/cuisines/aneka-nasi-delivery/144",
  Chicken: "/id/id/cuisines/ayam-delivery/43",
  Seafood: "/id/id/cuisines/hidangan-laut-delivery/151",
  Fish: "/id/id/cuisines/hidangan-laut-delivery/151",
  Noodle: "/id/id/cuisines/mie-delivery/126",
  Pasta: "/id/id/cuisines/mie-delivery/126",
  Snack: "/id/id/cuisines/camilan-delivery/157",
  Meatballs: "/id/id/cuisines/bakso-delivery/8",
  Lamb: "/id/id/cuisines/sate-delivery/150",
  Breakfast: "/id/id/cuisines/roti-kue-delivery/7",
};
const FALLBACK_PATH = "/id/id/restaurants?category=indonesian-87"; // Masakan Indonesia (umum)

/** true kalau kategori punya padanan cuisine spesifik di GrabFood (bukan fallback umum). */
export function hasSpecificGrabCuisine(category: string | null | undefined): boolean {
  return !!(category && CUISINE_PATH[category]);
}

/**
 * URL GrabFood untuk sebuah kategori menu (+ UTM supaya trafik keluar bisa diukur).
 * utmContent opsional (mis. "official:rice-chicken") untuk melacak dari menu mana klik-nya.
 */
export function grabUrlForCategory(category: string | null | undefined, utmContent?: string): string {
  const path = (category && CUISINE_PATH[category]) || FALLBACK_PATH;
  const url = GRAB_BASE + path;
  const utm =
    "utm_source=recepie.20fit.id&utm_medium=eat_now&utm_campaign=grabfood" +
    (utmContent ? "&utm_content=" + encodeURIComponent(utmContent) : "");
  return url + (url.includes("?") ? "&" : "?") + utm;
}
