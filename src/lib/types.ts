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
  cookMinutes?: number; // menit MASAK aktif (di atas api/kompor) -- TIDAK termasuk waktu tunggu
  // pasif (marinasi, dinginkan di kulkas semalaman, dll) -- itu dijelaskan di prepNote.
  prepMinutes?: number; // menit PERSIAPAN aktif (motong, ulek bumbu, dll), terpisah dari cookMinutes
  // -- opsional, diisi progresif per Tahap 3 (mulai 3 resep percontohan).
  equipment?: { en: string; id: string }; // alat dapur yang dibutuhkan, disebut di AWAL bukan step ke-7
  prepNote?: { en: string; id: string }; // apa yang perlu dipotong/direndam/didiamkan SEBELUM mulai masak
  commonMistake?: { en: string; id: string }; // 1-2 baris kesalahan umum pemula
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
  prep_minutes?: number | null;
  equipment?: string | null;
  prep_note?: string | null;
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
  prep_minutes?: number | null;
  equipment?: string | null;
  prep_note?: string | null;
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
  cookMinutes: number | null; // menit masak AKTIF -- lihat OfficialRecipe.cookMinutes
  prepMinutes: number | null; // menit persiapan aktif, terpisah dari cookMinutes
  equipment: string | null; // alat dapur yg dibutuhkan (mis. "Wajan, ulekan, panci kukus")
  prepNote: string | null; // apa yang perlu dipotong/direndam sebelum mulai masak
  commonMistake: string | null; // 1-2 baris kesalahan umum pemula
  photoUrl: string | null;
  photoQ: string | null; // kata kunci pendek utk resolve foto (TheMealDB)
  photoName: string | null; // nama deskriptif utk resolve foto (Pexels)
  emoji: string;
  tint: string;
  reviewedAt: string | null;
}
