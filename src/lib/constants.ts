// Konstanta menu.20fit.id.
// PENTING: hanya anon key di frontend. Operasi sensitif (submit, moderasi) lewat
// API my.20fit.id yang mengecek auth/role di SERVER.

export const SUPABASE = {
  URL: "https://cpvzwqptzcxnwzfzgrmt.supabase.co",
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  // Sama dengan pola calories.20fit.id (Supabase default storage key untuk project ini).
  STORAGE_KEY: "sb-cpvzwqptzcxnwzfzgrmt-auth-token",
};

// Logo 20FIT — versi terang & gelap (putih), di-swap otomatis oleh kelas .dark.
export const LOGO_LIGHT = "https://media.20fit.id/wp-content/uploads/2026/05/Logo-20fit.png";
export const LOGO_DARK = "https://media.20fit.id/wp-content/uploads/2026/07/Copy-of-new-logo-20fit-putih-3.png";

// Pusat akun + API = my.20fit.id
export const MY20FIT = "https://my.20fit.id";

// Produk/layanan 20FIT lain yang ditautkan di footer (dikonfirmasi pemilik produk).
export const OTHER_20FIT_PRODUCTS = {
  CLINIC: "https://clinic.20fit.id",
  GYM: "https://gym.20fit.id",
  ARENA: "https://arena.20fit.id",
};

// Boleh di-override lewat env (mis. staging), default ke my.20fit.id.
export const API_BASE = (import.meta.env.VITE_API_URL as string) || MY20FIT;

// ?next=menu dibaca oleh login my.20fit.id supaya setelah login user dikembalikan
// ke sini pre-authenticated lewat SSO hand-off (#access_token=...&refresh_token=...),
// mekanisme yang SAMA dengan calories.20fit.id. Token di FRAGMENT (#), bukan query,
// jadi tidak pernah terkirim ke server / tidak masuk log, dan langsung di-strip.
export const URLS = {
  MY_20FIT: MY20FIT,
  LOGIN: `${MY20FIT}/login?next=menu`,
  SIGN_UP: `${MY20FIT}/login?mode=up&next=menu`,
};

// Endpoint API my.20fit.id yang dipakai menu.20fit.id.
export const API = {
  CATALOG: "/api/menu/catalog", // publik: resep resmi 20FIT (satu sumber = js/recipes.js)
  PUBLISHED: "/api/menu/published", // publik: kontribusi user yang approved+published
  SUBMIT: "/api/menu/submit", // auth: submit resep baru
  MINE: "/api/menu/mine", // auth: submission-ku + progres reward
  REVISE: (id: string) => `/api/menu/${id}/revise`, // auth: revisi menu ditolak
  OPEN: "/api/menu/open", // opsional: catat buka detail (sinyal minat)
  UPLOAD: "/api/menu/upload", // auth: unggah foto resep (utama/per-langkah) -> Storage
  REACT: (id: string) => `/api/menu/${id}/react`, // publik (login opsional): toggle heart
  CLAIM_ANON_LIKES: "/api/menu/claim-anon-likes", // auth: pindahkan like sesi anonim ke akun
  SAVE: (id: string) => `/api/menu/${id}/save`, // auth: toggle simpan ke koleksi
  SAVED: "/api/menu/saved", // auth: koleksi resep tersimpan
  SOCIAL: "/api/menu/social", // publik: jumlah heart (+ state user bila login) batch
};

// Batas & aturan (samakan dengan server my.20fit.id).
export const RULES = {
  PHOTO_MAX_BYTES: 2 * 1024 * 1024, // ~2MB (server tolak >3MB base64)
  PHOTO_TYPES: ["image/jpeg", "image/png", "image/webp"],
  DAILY_SUBMIT_LIMIT: 5,
};

// Tipe diet valid (samakan dengan MENU_DIET_TYPES di server.js).
export const DIET_TYPES = [
  "normal",
  "vegetarian",
  "vegan",
  "pescatarian",
  "keto",
  "halal",
  "high-protein",
  "low-carb",
] as const;
