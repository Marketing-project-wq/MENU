// Konstanta menu.20fit.id.
// PENTING: hanya anon key di frontend. Operasi sensitif (submit, moderasi) lewat
// API my.20fit.id yang mengecek auth/role di SERVER.

export const SUPABASE = {
  URL: "https://cpvzwqptzcxnwzfzgrmt.supabase.co",
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  // Sama dengan pola calories.20fit.id (Supabase default storage key untuk project ini).
  STORAGE_KEY: "sb-cpvzwqptzcxnwzfzgrmt-auth-token",
};

// Pusat akun + API = my.20fit.id
export const MY20FIT = "https://my.20fit.id";

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
