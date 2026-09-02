import { useState, type FormEvent } from "react";
import { DIET_TYPES, RULES } from "../lib/constants";
import { api, type SubmitBody } from "../lib/api";
import { useLang } from "../lib/store";
import { dietLabel } from "../lib/i18n";
import type { RecipeStep } from "../lib/types";

// Kata-kata yang menandakan KLAIM KESEHATAN berisiko. Peringatan lembut di client —
// gerbang sebenarnya tetap moderasi admin + flag server-side.
const HEALTH_CLAIM_RE =
  /\b(menyembuhkan|nyembuhin|obat|mengobati|sembuh|cure|cures|heal|heals|treats?|menurunkan (?:tekanan darah|gula darah|kolesterol)|anti[- ]?kanker|kanker|diabetes|detoks total|awet muda)\b/i;

export interface RecipeFormValues {
  name: string;
  display_name: string; // nama tampilan publik kontributor -- bukan nama akun/email
  diet_type: string;
  ingredients: string;
  steps: RecipeStep[];
  est_kcal: string; // input teks -> dikonversi saat submit
  servings: string;
  cook_minutes: string;
  photo_url: string | null; // foto utama (URL Storage)
}

export function emptyValues(): RecipeFormValues {
  return {
    name: "",
    display_name: "",
    diet_type: "normal",
    ingredients: "",
    steps: [{ t: "", photo: null }],
    est_kcal: "",
    servings: "",
    cook_minutes: "",
    photo_url: null,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const { lang, t } = useLang();
  const [v, setV] = useState<RecipeFormValues>(initial);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const L = (id: string, en: string) => (lang === "id" ? id : en);
  const set = (patch: Partial<RecipeFormValues>) => setV((s) => ({ ...s, ...patch }));

  const anyUploading = Object.values(uploading).some(Boolean);
  const healthWarn = HEALTH_CLAIM_RE.test(`${v.name} ${v.ingredients} ${v.steps.map((s) => s.t).join(" ")}`);

  function validatePhoto(file: File): string | null {
    if (!RULES.PHOTO_TYPES.includes(file.type))
      return L("Tipe foto harus JPG, PNG, atau WEBP.", "Photo must be JPG, PNG, or WEBP.");
    if (file.size > RULES.PHOTO_MAX_BYTES)
      return L("Foto terlalu besar (maks ~2MB). Kompres dulu.", "Photo too large (max ~2MB). Please compress.");
    return null;
  }

  async function uploadOne(file: File, key: string): Promise<string | null> {
    const e = validatePhoto(file);
    if (e) {
      setPhotoErr(e);
      return null;
    }
    setPhotoErr(null);
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      const dataUrl = await readFileAsDataUrl(file);
      return await api.uploadPhoto(dataUrl);
    } catch (e: any) {
      setPhotoErr(e?.message || L("Gagal unggah foto.", "Upload failed."));
      return null;
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  }

  async function handleMainPhoto(file: File | undefined) {
    if (!file) return;
    const url = await uploadOne(file, "main");
    if (url) set({ photo_url: url });
  }

  // Operasi langkah
  const setStep = (i: number, patch: Partial<RecipeStep>) =>
    setV((s) => ({ ...s, steps: s.steps.map((st, idx) => (idx === i ? { ...st, ...patch } : st)) }));
  const addStep = () => setV((s) => ({ ...s, steps: [...s.steps, { t: "", photo: null }] }));
  const removeStep = (i: number) =>
    setV((s) => ({ ...s, steps: s.steps.length > 1 ? s.steps.filter((_, idx) => idx !== i) : s.steps }));
  const moveStep = (i: number, dir: -1 | 1) =>
    setV((s) => {
      const arr = [...s.steps];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return s;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, steps: arr };
    });
  async function handleStepPhoto(i: number, file: File | undefined) {
    if (!file) return;
    const url = await uploadOne(file, "step" + i);
    if (url) setStep(i, { photo: url });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const cleanSteps = v.steps.map((s) => ({ t: s.t.trim(), photo: s.photo })).filter((s) => s.t || s.photo);
    if (!v.name.trim() || !v.ingredients.trim() || !cleanSteps.some((s) => s.t)) {
      setErr(
        L(
          "Nama, bahan, dan minimal satu langkah (berteks) wajib diisi.",
          "Name, ingredients, and at least one step (with text) are required."
        )
      );
      return;
    }
    setBusy(true);
    try {
      const num = (x: string, min: number) => (x.trim() === "" ? null : Math.max(min, Math.round(Number(x))) || null);
      const stepsText = cleanSteps.map((s, i) => `${i + 1}. ${s.t}`).join("\n");
      await onSubmit({
        name: v.name.trim(),
        display_name: v.display_name.trim() || null,
        diet_type: v.diet_type,
        ingredients: v.ingredients.trim(),
        steps: stepsText,
        steps_json: cleanSteps,
        est_kcal: num(v.est_kcal, 0),
        servings: num(v.servings, 1),
        cook_minutes: num(v.cook_minutes, 0),
        photo_url: v.photo_url,
      });
    } catch (e: any) {
      setErr(e?.message || "Gagal mengirim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">{L("Nama resep", "Recipe name")}</label>
        <input className="field" value={v.name} onChange={(e) => set({ name: e.target.value })} maxLength={120} />
      </div>

      <div>
        <label className="label">{t("displayNameLabel")}</label>
        <input
          className="field"
          value={v.display_name}
          onChange={(e) => set({ display_name: e.target.value })}
          maxLength={60}
          placeholder={t("displayNamePlaceholder")}
        />
        <p className="mt-1 text-xs text-fg/45">{t("displayNameHint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
          <label className="label">{t("servings")}</label>
          <input
            className="field"
            type="number"
            min={1}
            value={v.servings}
            onChange={(e) => set({ servings: e.target.value })}
          />
        </div>
        <div>
          <label className="label">
            {t("cookTime")} ({t("minutesShort")})
          </label>
          <input
            className="field"
            type="number"
            min={0}
            value={v.cook_minutes}
            onChange={(e) => set({ cook_minutes: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="label">{L("Bahan (satu per baris)", "Ingredients (one per line)")}</label>
        <textarea
          className="field min-h-[120px]"
          value={v.ingredients}
          onChange={(e) => set({ ingredients: e.target.value })}
          placeholder={L("Bumbu Halus:\n3 siung bawang putih\n...", "Spice paste:\n3 cloves garlic\n...")}
        />
        <p className="mt-1 text-xs text-fg/45">
          {L(
            "Tip: akhiri baris dengan “:” untuk judul kelompok (mis. “Bumbu Halus:”).",
            "Tip: end a line with “:” to make a group heading (e.g. “Spice paste:”)."
          )}
        </p>
      </div>

      {/* Langkah berfoto */}
      <div>
        <label className="label">{t("steps")}</label>
        <p className="-mt-0.5 mb-2 text-xs text-fg/45">{t("stepsHint")}</p>
        <div className="space-y-3">
          {v.steps.map((st, i) => (
            <div key={i} className="rounded-xl border border-fg/10 bg-fg/[0.02] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fg/50">
                  {t("step")} {i + 1}
                </span>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    className="rounded px-1.5 py-0.5 text-fg/50 hover:bg-fg/10 disabled:opacity-30"
                    onClick={() => moveStep(i, -1)}
                    disabled={i === 0}
                    aria-label={t("moveUp")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded px-1.5 py-0.5 text-fg/50 hover:bg-fg/10 disabled:opacity-30"
                    onClick={() => moveStep(i, 1)}
                    disabled={i === v.steps.length - 1}
                    aria-label={t("moveDown")}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="rounded px-1.5 py-0.5 text-brand-red/70 hover:bg-brand-red/10 disabled:opacity-30"
                    onClick={() => removeStep(i)}
                    disabled={v.steps.length <= 1}
                  >
                    {t("removeStep")}
                  </button>
                </div>
              </div>
              <textarea
                className="field mt-2 min-h-[60px]"
                value={st.t}
                onChange={(e) => setStep(i, { t: e.target.value })}
                placeholder={t("stepTextPlaceholder")}
              />
              <div className="mt-2 flex items-center gap-3">
                {st.photo ? (
                  <>
                    <img src={st.photo} alt={`step ${i + 1}`} className="h-14 w-14 rounded-lg object-cover" />
                    <button
                      type="button"
                      className="text-xs text-fg/50 underline"
                      onClick={() => setStep(i, { photo: null })}
                    >
                      {t("removePhoto")}
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer text-xs font-semibold text-brand-red">
                    {uploading["step" + i] ? t("uploading") : t("addStepPhoto")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleStepPhoto(i, e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn-ghost mt-3 text-sm" onClick={addStep}>
          {t("addStep")}
        </button>
      </div>

      <div>
        <label className="label">{L("Perkiraan kalori (opsional)", "Estimated calories (optional)")}</label>
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
        <label className="label">{t("mainPhoto")}</label>
        <div className="flex items-center gap-3">
          <label className="btn-ghost cursor-pointer text-sm">
            {uploading["main"] ? t("uploading") : L("Pilih foto", "Choose photo")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleMainPhoto(e.target.files?.[0])}
            />
          </label>
          {v.photo_url && (
            <>
              <img src={v.photo_url} alt="preview" className="h-16 w-16 rounded-lg object-cover" />
              <button type="button" className="text-xs text-fg/50 underline" onClick={() => set({ photo_url: null })}>
                {t("removePhoto")}
              </button>
            </>
          )}
        </div>
        {photoErr && <p className="mt-1 text-xs text-brand-red">{photoErr}</p>}
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

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy || anyUploading}>
        {busy ? L("Mengirim…", "Submitting…") : submitLabel}
      </button>
    </form>
  );
}
