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

/** Ubah nama resep jadi slug URL (huruf kecil, dash, tanpa diakritik/simbol). */
function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // buang diakritik (e\u0301 -> e, dst.)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return s || "resep";
}

/** Akhiran pendek & stabil dari id, dipakai hanya saat slug nama bentrok dgn resep lain. */
function idSuffix(id: string): string {
  const s = id.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return s.slice(-6) || "x";
}

/** Pastikan tiap RecipeVM di `list` punya slug unik. Slug dasar = nama;
 *  kalau bentrok dgn resep lain, tambahkan akhiran id (stabil, deterministik). */
function assignSlugs(list: RecipeVM[]): void {
  const used = new Set<string>();
  for (const r of list) {
    const base = slugify(r.name);
    let slug = base;
    if (used.has(slug)) {
      slug = `${base}-${idSuffix(r.id)}`;
      let n = 2;
      while (used.has(slug)) slug = `${base}-${idSuffix(r.id)}-${n++}`;
    }
    used.add(slug);
    r.slug = slug;
  }
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
    slug: slugify(r.nm?.[lang] || r.nm?.en || r.id), // default; disempurnakan (unik) oleh buildVMs()
    name: r.nm?.[lang] || r.nm?.en || r.id,
    kcal: typeof r.kcal === "number" ? r.kcal : null,
    macros: { p: r.p ?? 0, c: r.c ?? 0, f: r.f ?? 0 },
    dietTypes: Array.isArray(r.types) ? r.types : [],
    category: r.cat || null,
    ingredients,
    steps,
    stepList: parseStepsText(steps),
    ingredientGroups: parseIngredientGroups(ingredients),
    servings: typeof r.servings === "number" ? r.servings : null,
    cookMinutes: typeof r.cookMinutes === "number" ? r.cookMinutes : null,
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
    slug: slugify(m.name), // default; disempurnakan (unik) oleh buildVMs()
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
  const all = [...mem, ...off];
  // Slug final: unik dlm daftar ini (dipakai sbg satu-satunya sumber kebenaran
  // slug -> resep oleh DetailPage & redirect URL lama, lihat router.tsx).
  assignSlugs(all);
  return all;
}

/** Peta "source:id" -> slug kanonik, dihitung dari katalog publik penuh (official + members).
 *  Dipakai halaman yang membangun RecipeVM dari subset data lain (mis. SavedPage) supaya
 *  link yang dibuat tetap konsisten dgn slug yang dipakai DetailPage. */
export function buildSlugMap(
  official: OfficialRecipe[],
  members: PublishedContribution[],
  lang: Lang
): Map<string, string> {
  return new Map(buildVMs(official, members, lang).map((r) => [r.key, r.slug]));
}
