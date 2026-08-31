import { useState, type FormEvent } from "react";
import { DIET_TYPES, RULES } from "../lib/constants";
import type { SubmitBody } from "../lib/api";
import { useLang } from "../lib/store";
import { dietLabel } from "../lib/i18n";

// Kata-kata yang menandakan KLAIM KESEHATAN berisiko. Ini hanya peringatan lembut
// di sisi client — gerbang sebenarnya tetap moderasi admin + flag server-side.
const HEALTH_CLAIM_RE =
  /\b(menyembuhkan|nyembuhin|obat|mengobati|sembuh|cure|cures|heal|heals|treats?|menurunkan (?:tekanan darah|gula darah|kolesterol)|anti[- ]?kanker|kanker|diabetes|detoks total|awet muda)\b/i;

export interface RecipeFormValues {
  name: string;
  diet_type: string;
  ingredients: string;
  steps: string;
  est_kcal: string; // input teks -> dikonversi saat submit
  photo_url: string | null;
}

export function emptyValues(): RecipeFormValues {
  return { name: "", diet_type: "normal", ingredients: "", steps: "", est_kcal: "", photo_url: null };
}

export function RecipeForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: RecipeFormValues;
  submitLabel: string;
  onSubmit: (body: SubmitBody) => Promise<void>;
}) {
  const { lang } = useLang();
  const [v, setV] = useState<RecipeFormValues>(initial);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (patch: Partial<RecipeFormValues>) => setV((s) => ({ ...s, ...patch }));

  const healthWarn = HEALTH_CLAIM_RE.test(`${v.name} ${v.ingredients} ${v.steps}`);

  async function handlePhoto(file: File | undefined) {
    setPhotoErr(null);
    if (!file) return;
    if (!RULES.PHOTO_TYPES.includes(file.type)) {
      setPhotoErr(lang === "id" ? "Tipe foto harus JPG, PNG, atau WEBP." : "Photo must be JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > RULES.PHOTO_MAX_BYTES) {
      setPhotoErr(
        lang === "id"
          ? "Foto terlalu besar (maks ~2MB). Kompres dulu."
          : "Photo too large (max ~2MB). Please compress."
      );
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    set({ photo_url: dataUrl });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!v.name.trim() || !v.ingredients.trim() || !v.steps.trim()) {
      setErr(lang === "id" ? "Nama, bahan, dan cara buat wajib diisi." : "Name, ingredients, and steps are required.");
      return;
    }
    setBusy(true);
    try {
      const est = v.est_kcal.trim() === "" ? null : Math.max(0, Math.round(Number(v.est_kcal))) || null;
      await onSubmit({
        name: v.name.trim(),
        diet_type: v.diet_type,
        ingredients: v.ingredients.trim(),
        steps: v.steps.trim(),
        est_kcal: est,
        photo_url: v.photo_url,
      });
    } catch (e: any) {
      setErr(e?.message || "Gagal mengirim.");
    } finally {
      setBusy(false);
    }
  }

  const L = (id: string, en: string) => (lang === "id" ? id : en);

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">{L("Nama resep", "Recipe name")}</label>
        <input className="field" value={v.name} onChange={(e) => set({ name: e.target.value })} maxLength={120} />
      </div>

      <div>
        <label className="label">{L("Tipe diet", "Diet type")}</label>
        <select className="field" value={v.diet_type} onChange={(e) => set({ diet_type: e.target.value })}>
          {DIET_TYPES.map((d) => (
            <option key={d} value={d}>
              {dietLabel(d, lang)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">{L("Bahan (satu per baris)", "Ingredients (one per line)")}</label>
        <textarea
          className="field min-h-[120px]"
          value={v.ingredients}
          onChange={(e) => set({ ingredients: e.target.value })}
          placeholder={L("150 g dada ayam\n1 sdm kecap...", "150 g chicken breast\n1 tbsp soy sauce...")}
        />
      </div>

      <div>
        <label className="label">{L("Cara buat (satu langkah per baris)", "Steps (one per line)")}</label>
        <textarea
          className="field min-h-[140px]"
          value={v.steps}
          onChange={(e) => set({ steps: e.target.value })}
          placeholder={L("1. Marinasi ayam...\n2. Panggang...", "1. Marinate the chicken...\n2. Grill...")}
        />
      </div>

      <div>
        <label className="label">
          {L("Perkiraan kalori (opsional)", "Estimated calories (optional)")}
        </label>
        <input
          className="field sm:max-w-[200px]"
          type="number"
          min={0}
          value={v.est_kcal}
          onChange={(e) => set({ est_kcal: e.target.value })}
        />
        <p className="mt-1 text-xs text-fg/45">
          {L(
            "Angka gizi kamu diperlakukan sebagai PERKIRAAN member, bukan fakta terverifikasi.",
            "Your nutrition figure is treated as a member ESTIMATE, not a verified fact."
          )}
        </p>
      </div>

      <div>
        <label className="label">{L("Foto (opsional)", "Photo (optional)")}</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handlePhoto(e.target.files?.[0])}
          className="block text-sm"
        />
        {photoErr && <p className="mt-1 text-xs text-brand-red">{photoErr}</p>}
        {v.photo_url && (
          <div className="mt-2 flex items-center gap-3">
            <img src={v.photo_url} alt="preview" className="h-16 w-16 rounded-lg object-cover" />
            <button type="button" className="text-xs text-fg/50 underline" onClick={() => set({ photo_url: null })}>
              {L("hapus foto", "remove photo")}
            </button>
          </div>
        )}
        <p className="mt-1 text-xs text-fg/45">
          {L(
            "Gunakan foto milikmu sendiri. Jangan pakai foto berhak cipta.",
            "Use your own photo. Do not use copyrighted images."
          )}
        </p>
      </div>

      {healthWarn && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {L(
            "Sepertinya ada klaim kesehatan/medis (mis. “menyembuhkan”). Resep dengan klaim medis bisa ditolak atau diedit admin. Fokuskan ke bahan & cara masak.",
            "This looks like a health/medical claim (e.g. “cures”). Recipes with medical claims may be rejected or edited by an admin. Keep it to ingredients & method."
          )}
        </div>
      )}

      {err && <div className="rounded-xl bg-brand-red/10 p-3 text-sm text-brand-red">{err}</div>}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
        {busy ? L("Mengirim…", "Submitting…") : submitLabel}
      </button>
    </form>
  );
}
