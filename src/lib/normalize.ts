import type {
  IngredientGroup,
  Lang,
  OfficialRecipe,
  PublishedContribution,
  RecipeStep,
  RecipeVM,
} from "./types";

/** Pecah teks bahan jadi kelompok. Baris diakhiri ":" = judul kelompok (mis. "Bumbu Halus:"),
 *  baris lain = item. Bullet "-", "*", "•" di depan item dibuang. */
function parseIngredientGroups(text: string): IngredientGroup[] {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const groups: IngredientGroup[] = [];
  let cur: IngredientGroup | null = null;
  for (const line of lines) {
    if (/:$/.test(line) && line.length <= 60) {
      cur = { title: line.replace(/:$/, "").trim(), items: [] };
      groups.push(cur);
      continue;
    }
    const item = line.replace(/^[-*•]\s+/, "").trim();
    if (!item) continue;
    if (!cur) {
      cur = { title: null, items: [] };
      groups.push(cur);
    }
    cur.items.push(item);
  }
  return groups.filter((g) => g.items.length > 0);
}

/** Pecah teks langkah jadi RecipeStep[] (tanpa foto). Nomor "1." / "1)" & bullet di depan dibuang. */
export function parseStepsText(text: string): RecipeStep[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({
      t: s.replace(/^\s*\d+[.)]\s*/, "").replace(/^[-*•]\s+/, "").trim(),
      photo: null as string | null,
    }))
    .filter((s) => s.t.length > 0);
}

/** Ambil langkah terstruktur dari steps_json (member). Balik null kalau kosong/invalid. */
function stepsFromJson(j: RecipeStep[] | null | undefined): RecipeStep[] | null {
  if (!Array.isArray(j)) return null;
  const out = j
    .map((s) => ({ t: String(s?.t ?? "").trim(), photo: s?.photo ? String(s.photo) : null }))
    .filter((s) => s.t.length > 0 || !!s.photo);
  return out.length ? out : null;
}

export function normalizeOfficial(r: OfficialRecipe, lang: Lang): RecipeVM {
  const ingredients = r.ing?.[lang] || r.ing?.en || "";
  const steps = r.steps?.[lang] || r.steps?.en || "";
  return {
    key: `official:${r.id}`,
    id: r.id,
    source: "official",
    name: r.nm?.[lang] || r.nm?.en || r.id,
    kcal: typeof r.kcal === "number" ? r.kcal : null,
    macros: { p: r.p ?? 0, c: r.c ?? 0, f: r.f ?? 0 },
    dietTypes: Array.isArray(r.types) ? r.types : [],
    category: r.cat || null,
    ingredients,
    steps,
    stepList: parseStepsText(steps),
    ingredientGroups: parseIngredientGroups(ingredients),
    servings: null,
    cookMinutes: null,
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
  const ingredients = m.ingredients || "";
  const steps = m.steps || "";
  return {
    key: `member:${m.id}`,
    id: m.id,
    source: "member",
    name: m.name,
    kcal: typeof m.est_kcal === "number" ? m.est_kcal : null,
    macros: null, // member hanya kasih perkiraan kalori, bukan makro lengkap
    dietTypes: m.diet_type ? [m.diet_type] : [],
    category: null,
    ingredients,
    steps,
    stepList: stepsFromJson(m.steps_json) ?? parseStepsText(steps),
    ingredientGroups: parseIngredientGroups(ingredients),
    servings: typeof m.servings === "number" ? m.servings : null,
    cookMinutes: typeof m.cook_minutes === "number" ? m.cook_minutes : null,
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
