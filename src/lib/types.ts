// Bentuk data mentah dari API my.20fit.id + view-model terpadu untuk UI.

export type Lang = "id" | "en";
export type Source = "official" | "member";

/** Satu langkah cara membuat — teks + foto proses opsional (step berfoto). */
export interface RecipeStep {
  t: string; // teks langkah
  photo: string | null; // URL foto proses (bucket menu-photos) atau null
}

/** Kelompok bahan (mis. "Bumbu Halus") + item-nya. title null = tanpa kelompok. */
export interface IngredientGroup {
  title: string | null;
  items: string[];
}

/** Resep resmi 20FIT — bentuk item di js/recipes.js (via GET /api/menu/catalog). */
export interface OfficialRecipe {
  id: string;
  emoji?: string;
  tint?: string;
  kcal: number;
  p: number; // protein g
  c: number; // carbs g
  f: number; // fat g
  types: string[];
  q?: string; // query gambar TheMealDB (opsional)
  cat: string;
  nm: { en: string; id: string };
  ing: { en: string; id: string };
  steps: { en: string; id: string };
  servings?: number; // porsi -- opsional, belum diisi utk semua resep (progresif per Tahap 2)
  cookMinutes?: number; // menit masak -- opsional, sama alasannya
}

/** Kontribusi user approved+published (via GET /api/menu/published) — tanpa PII. */
export interface PublishedContribution {
  id: string;
  name: string;
  diet_type: string;
  ingredients: string;
  steps: string;
  steps_json?: RecipeStep[] | null;
  photo_url: string | null;
  est_kcal: number | null;
  servings?: number | null;
  cook_minutes?: number | null;
  reviewed_at: string | null;
}

/** Submission milik user sendiri (via GET /api/menu/mine). */
export interface MySubmission {
  id: string;
  name: string;
  diet_type: string;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  est_kcal: number | null;
  created_at: string;
  reviewed_at: string | null;
  published: boolean;
  // Opsional — dikembalikan agar form revisi bisa prefill (server select diperluas).
  ingredients?: string;
  steps?: string;
  steps_json?: RecipeStep[] | null;
  servings?: number | null;
  cook_minutes?: number | null;
  photo_url?: string | null;
}

export interface MineResponse {
  ok: boolean;
  submissions: MySubmission[];
  approved: number;
  approved_published: number;
  per_cycle: number;
  reward_scan: number;
  toward_next: number;
  credits_earned: number;
}

export interface RewardConfig {
  per_cycle: number;
  reward_scan: number;
}

/** Katering pihak ketiga yang menjual resep ini (via GET /api/menu/:id/caterers) --
 *  murni direktori, tanpa transaksi/komisi. price/portion_note khusus utk resep yang dibuka
 *  (dari my20fit_caterer_menus), field lain milik kateringnya sendiri. */
export interface Caterer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_areas: string[] | null;
  min_order: number | null;
  order_url: string | null;
  is_verified: boolean;
  price: number | null;
  portion_note: string | null;
}

/** View-model terpadu untuk kartu & detail. */
export interface RecipeVM {
  key: string; // unik: "official:<id>" | "member:<uuid>"
  id: string;
  source: Source;
  slug: string; // slug URL berbasis nama resep, unik dlm daftar hasil buildVMs() (lihat normalize.ts)
  name: string;
  kcal: number | null;
  macros: { p: number; c: number; f: number } | null; // hanya official
  dietTypes: string[];
  category: string | null;
  ingredients: string; // teks, dipisah newline (disimpan utk print & fallback)
  steps: string; // teks, dipisah newline (disimpan utk print & fallback)
  stepList: RecipeStep[]; // langkah terstruktur (foto opsional) hasil parse steps_json/teks
  ingredientGroups: IngredientGroup[]; // bahan dikelompokkan (mis. "Bumbu Halus")
  servings: number | null;
  cookMinutes: number | null;
  photoUrl: string | null;
  photoQ: string | null; // kata kunci pendek utk resolve foto (TheMealDB)
  photoName: string | null; // nama deskriptif utk resolve foto (Pexels)
  emoji: string;
  tint: string;
  reviewedAt: string | null;
}
