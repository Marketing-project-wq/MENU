// Bentuk data mentah dari API my.20fit.id + view-model terpadu untuk UI.

export type Lang = "id" | "en";
export type Source = "official" | "member";

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
}

/** Kontribusi user approved+published (via GET /api/menu/published) — tanpa PII. */
export interface PublishedContribution {
  id: string;
  name: string;
  diet_type: string;
  ingredients: string;
  steps: string;
  photo_url: string | null;
  est_kcal: number | null;
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
  photo_url?: string | null;
}

export interface MineResponse {
  ok: boolean;
  submissions: MySubmission[];
  approved: number;
  per_cycle: number;
  reward_scan: number;
  toward_next: number;
  credits_earned: number;
}

/** View-model terpadu untuk kartu & detail. */
export interface RecipeVM {
  key: string; // unik: "official:<id>" | "member:<uuid>"
  id: string;
  source: Source;
  name: string;
  kcal: number | null;
  macros: { p: number; c: number; f: number } | null; // hanya official
  dietTypes: string[];
  category: string | null;
  ingredients: string; // teks, dipisah newline
  steps: string; // teks, dipisah newline
  photoUrl: string | null;
  emoji: string;
  tint: string;
  reviewedAt: string | null;
}
