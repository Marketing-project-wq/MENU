import type { Lang, OfficialRecipe, PublishedContribution, RecipeVM } from "./types";

export function normalizeOfficial(r: OfficialRecipe, lang: Lang): RecipeVM {
  return {
    key: `official:${r.id}`,
    id: r.id,
    source: "official",
    name: r.nm?.[lang] || r.nm?.en || r.id,
    kcal: typeof r.kcal === "number" ? r.kcal : null,
    macros: { p: r.p ?? 0, c: r.c ?? 0, f: r.f ?? 0 },
    dietTypes: Array.isArray(r.types) ? r.types : [],
    category: r.cat || null,
    ingredients: r.ing?.[lang] || r.ing?.en || "",
    steps: r.steps?.[lang] || r.steps?.en || "",
    photoUrl: null,
    photoQ: r.q || null,
    photoName: r.nm?.en || r.nm?.id || r.id,
    emoji: r.emoji || "🍽️",
    tint: r.tint || "#C41101",
    reviewedAt: null,
  };
}

const MEMBER_EMOJI = "🥗";
const MEMBER_TINT = "#2A7A4F";

export function normalizeMember(m: PublishedContribution): RecipeVM {
  return {
    key: `member:${m.id}`,
    id: m.id,
    source: "member",
    name: m.name,
    kcal: typeof m.est_kcal === "number" ? m.est_kcal : null,
    macros: null, // member hanya kasih perkiraan kalori, bukan makro lengkap
    dietTypes: m.diet_type ? [m.diet_type] : [],
    category: null,
    ingredients: m.ingredients || "",
    steps: m.steps || "",
    photoUrl: m.photo_url || null,
    photoQ: null,
    photoName: null,
    emoji: MEMBER_EMOJI,
    tint: MEMBER_TINT,
    reviewedAt: m.reviewed_at,
  };
}

export function buildVMs(
  official: OfficialRecipe[],
  members: PublishedContribution[],
  lang: Lang
): RecipeVM[] {
  const off = official.map((r) => normalizeOfficial(r, lang));
  const mem = members.map(normalizeMember);
  // Member terbaru dulu, lalu resep resmi.
  return [...mem, ...off];
}
