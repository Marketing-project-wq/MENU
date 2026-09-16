// Konstanta menu.20fit.id.
// PENTING: hanya anon key di frontend. Operasi sensitif (submit, moderasi) lewat
// API my.20fit.id yang mengecek auth/role di SERVER.

export const SUPABASE = {
  URL: "https://cpvzwqptzcxnwzfzgrmt.supabase.co",
  // anon key = PUBLIK (publishable, dilindungi RLS) — memang dikirim ke browser tiap user.
  // Utamakan env VITE_SUPABASE_ANON_KEY; fallback ke anon key publik project bersama ini supaya
  // login/daftar TETAP jalan walau env belum di-set di Railway (URL project pun sudah hardcode
  // di atas — satu project 20FIT untuk semua app). BUKAN service key (yang itu server-only).
  ANON_KEY:
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdnp3cXB0emN4bnd6Znpncm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE0MzksImV4cCI6MjA5MTIwNzQzOX0.DIP-tTFxa3GHMhT6b1Tq-Zz0a24P-vbU9ixEtITbqpI",
  // Sama dengan pola calories.20fit.id (Supabase default storage key untuk project ini).
  STORAGE_KEY: "sb-cpvzwqptzcxnwzfzgrmt-auth-token",
};

// Logo 20FIT — versi terang & gelap (putih), di-swap otomatis oleh kelas .dark.
export const LOGO_LIGHT = "https://media.20fit.id/wp-content/uploads/2026/05/Logo-20fit.png";
export const LOGO_DARK = "https://media.20fit.id/wp-content/uploads/2026/07/Copy-of-new-logo-20fit-putih-3.png";

// Pusat akun + API = my.20fit.id
export const MY20FIT = "https://my.20fit.id";

// "Tempat makan" beranda = link-out JUJUR ke GrabFood (situs mereka). BUKAN scraping,
// BUKAN daftar tempat palsu -- kami hanya mengarahkan ke GrabFood; daftar resto asli
// muncul di sisi GrabFood setelah user memasukkan alamat. Grab Food tak punya API publik
// terbuka, jadi hanya redirect yang legal tanpa partnership.
export const GRABFOOD_HOME = "https://food.grab.com/id/id/";

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
  // CMS admin 20FIT (di my.20fit.id). Pintu /admin recepie hand-off ke sini SETELAH verifikasi
  // role server-side. Pakai /admin-dashboard (entri kanonik) — BUKAN /admin: /admin melakukan
  // redirect client-side (location.replace) yang membuang fragment SSO. Redirect server (302)
  // dari /admin-dashboard mempertahankan fragment. my.20fit route ke admin-v2 / admin lama
  // sesuai feature flag di sisi mereka.
  ADMIN_CMS: `${MY20FIT}/admin-dashboard`,
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
  REWARD_CONFIG: "/api/menu/reward-config", // publik: ambang & besaran reward sumbang-resep
  CATERERS: (id: string) => `/api/menu/${id}/caterers`, // publik: katering penjual resep ini
  CATERER_CLICK: "/api/menu/caterer-click", // publik (login opsional): catat klik ke katering
  DELIVERY: (id: string) => `/api/menu/${id}/delivery`, // publik: tautan pesan-antar (GrabFood dll)
  DELIVERY_CLICK: "/api/menu/delivery-click", // publik (login opsional): catat klik pesan-antar
  EAT_NOW: "/api/menu/eat-now", // publik: daftar resep yang punya tautan pesan-antar aktif
  ARTICLES: "/api/menu/articles", // publik: daftar artikel terbit
  ARTICLE: (slug: string) => `/api/menu/articles/${encodeURIComponent(slug)}`, // publik: 1 artikel + resep terkait
  RECIPE_ARTICLES: (id: string) => `/api/menu/${id}/articles`, // publik: artikel terkait sebuah resep
  ADMIN_ME: "/api/admin/me", // auth admin: cek role caller (dicek SERVER-SIDE) utk gerbang /admin
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
