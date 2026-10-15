import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { menuAdmin, MenuAdminError, DIET_TYPES, type OfficialRow, type OfficialInput } from "../../lib/menuAdmin";
import { useLang } from "../../lib/store";
import { recipeHref } from "../../router";
import { Spinner } from "../../components/Spinner";
import { Btn, Field, HEAD, Notice, Tag, inputCls } from "./ui";

// Katalog resep OFFICIAL — data = tabel my20fit_recipe_official di my.20fit (lewat API admin
// my.20fit, lihat lib/menuAdmin.ts). Edit di sini = edit di admin-v2 my.20fit, dan sebaliknya.

type View = "grid" | "list";
type StatusFilter = "all" | "live" | "hidden";

const VIEW_KEY = "recipe_cms_view";
function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Slug URL publik di recipe.20fit (sama dgn normalize.ts: dari nama sesuai bahasa). */
function publicSlug(name: string): string {
  return slugify(name) || "resep";
}

/** Kolom emoji di katalog kadang berisi KUNCI ikon ("meal", "veg", "fish"), bukan emoji.
 *  Tampilkan hanya kalau benar-benar emoji; selain itu piring default. */
function iconOf(v: string | null | undefined): string {
  return v && /\p{Extended_Pictographic}/u.test(v) ? v : "🍽️";
}

function Photo({ r, className }: { r: OfficialRow; className: string }) {
  if (r.photo_url) {
    return (
      <div
        className={`${className} bg-fg/5 bg-cover bg-center`}
        style={{ backgroundImage: `url("${r.photo_url.replace(/"/g, "%22")}")` }}
        role="img"
        aria-label={r.name_id || r.name_en}
      />
    );
  }
  return (
    <div
      className={`${className} grid place-items-center text-3xl`}
      style={{ background: `${r.tint || "#C41101"}1f` }}
      aria-hidden="true"
    >
      {iconOf(r.emoji)}
    </div>
  );
}

/** Tombol ikon mata: tayang <-> disembunyikan (tanpa buka form). */
function PublishToggle({ r, busy, onClick }: { r: OfficialRow; busy: boolean; onClick: () => void }) {
  const label = r.is_published ? "Sembunyikan dari situs" : "Tayangkan di situs";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={label}
      aria-label={label}
      className={`ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-50 ${
        r.is_published ? "text-fg/45 hover:bg-fg/[0.06] hover:text-fg" : "bg-fg/10 text-fg/70 hover:bg-fg/15"
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
        {!r.is_published && <path d="M3 3l18 18" />}
      </svg>
    </button>
  );
}

export function OfficialRecipesTab() {
  const { lang } = useLang();
  const [rows, setRows] = useState<OfficialRow[]>([]);
  const [seeded, setSeeded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [flash, setFlash] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [view, setViewState] = useState<View>(readView);
  const [editing, setEditing] = useState<OfficialRow | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function setView(v: View) {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  }

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await menuAdmin.listOfficial();
      setRows(r.recipes);
      setSeeded(r.seeded);
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat katalog.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status === "live" && !r.is_published) return false;
      if (status === "hidden" && r.is_published) return false;
      if (!needle) return true;
      return `${r.name_id} ${r.name_en} ${r.id} ${r.category || ""}`.toLowerCase().includes(needle);
    });
  }, [rows, q, status]);

  const liveCount = rows.filter((r) => r.is_published).length;
  const nameOf = (r: OfficialRow) => (lang === "en" ? r.name_en || r.name_id : r.name_id || r.name_en) || r.id;

  function done(msg: string) {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 6000);
  }

  async function togglePublish(r: OfficialRow) {
    setBusyId(r.id);
    try {
      await menuAdmin.updateOfficial(r.id, { is_published: !r.is_published });
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_published: !r.is_published } : x)));
      done(`"${r.name_id}" ${r.is_published ? "disembunyikan" : "ditayangkan"} — tersinkron ke my.20fit & recipe.20fit.`);
    } catch (e: any) {
      alert(e?.message || "Gagal mengubah status.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(r: OfficialRow) {
    if (!confirm(`Hapus resep "${r.name_id}" dari katalog official?\n\nIni juga menghapusnya dari my.20fit (data yang sama). Tidak bisa dibatalkan.`)) return;
    setBusyId(r.id);
    try {
      let res;
      try {
        res = await menuAdmin.deleteOfficial(r.id);
      } catch (e) {
        if (e instanceof MenuAdminError && e.status === 409) {
          const n = e.body?.links_count ?? "beberapa";
          if (!confirm(`Resep ini masih punya ${n} tautan Eat Now (pesan-antar).\nHapus resep beserta tautannya?`)) return;
          res = await menuAdmin.deleteOfficial(r.id, true);
        } else throw e;
      }
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      done(`"${r.name_id}" dihapus${res.links_removed ? ` (+${res.links_removed} tautan Eat Now)` : ""}.`);
    } catch (e: any) {
      alert(e?.message || "Gagal menghapus.");
    } finally {
      setBusyId(null);
    }
  }

  async function seed() {
    setBusyId("__seed");
    try {
      const r = await menuAdmin.seedOfficial();
      done(`Import selesai: ${r.inserted} resep baru dari ${r.catalog} katalog.`);
      await load();
    } catch (e: any) {
      alert(e?.message || "Import gagal.");
    } finally {
      setBusyId(null);
    }
  }

  if (editing) {
    return (
      <OfficialForm
        initial={editing === "new" ? null : editing}
        existingIds={rows.map((r) => r.id)}
        onCancel={() => setEditing(null)}
        onSaved={(row, isNew) => {
          setRows((prev) => (isNew ? [...prev, row] : prev.map((x) => (x.id === row.id ? { ...x, ...row } : x))));
          setEditing(null);
          done(`"${row.name_id}" tersimpan ke my.20fit — tampil di recipe.20fit dalam ±1 menit.`);
        }}
      />
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Btn variant="primary" size="sm" onClick={() => setEditing("new")}>
          + Tambah resep
        </Btn>
        {!seeded && (
          <Btn size="sm" onClick={seed} disabled={busyId === "__seed"}>
            {busyId === "__seed" ? "Mengimpor…" : "Import katalog official"}
          </Btn>
        )}
        <input
          className={`${inputCls} h-9 w-full max-w-xs rounded-full`}
          placeholder="Cari resep…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cari resep"
        />
        <div className="inline-flex items-center gap-0.5 rounded-full bg-fg/[0.06] p-1">
          {(
            [
              ["all", `Semua ${rows.length}`],
              ["live", `Tayang ${liveCount}`],
              ["hidden", `Disembunyikan ${rows.length - liveCount}`],
            ] as [StatusFilter, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={status === k}
              onClick={() => setStatus(k)}
              className={`${HEAD} h-7 rounded-full px-3 text-[11px] font-bold ${
                status === k ? "bg-card text-brand-red shadow-sm" : "text-fg/55 hover:text-fg"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px] text-fg/50">{shown.length} resep</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-fg/10" role="group" aria-label="Tampilan">
            {(["list", "grid"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                title={v === "list" ? "Tampilan daftar" : "Tampilan kartu"}
                onClick={() => setView(v)}
                className={`grid h-8 w-9 place-items-center ${view === v ? "bg-brand-red text-white" : "bg-card text-fg/50 hover:text-fg"}`}
              >
                {v === "list" ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
                    <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" />
                    <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" />
                    <rect x="9" y="9" width="5.5" height="5.5" rx="1" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {flash && <Notice tone="ok">{flash}</Notice>}
        {!seeded && !loading && (
          <Notice>
            Tabel katalog official di my.20fit belum diisi — situs masih memakai katalog statik. Klik
            “Import katalog official” supaya resep bisa diedit dari CMS.
          </Notice>
        )}
        {err && (
          <Notice tone="error">
            {err}{" "}
            <button type="button" className="font-bold underline" onClick={load}>
              Coba lagi
            </button>
          </Notice>
        )}
      </div>

      {loading ? (
        <div className="py-12">
          <Spinner label="Memuat katalog…" />
        </div>
      ) : shown.length === 0 && !err ? (
        <p className="py-12 text-center text-sm text-fg/45">Tidak ada resep yang cocok.</p>
      ) : view === "grid" ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {shown.map((r) => (
            <div
              key={r.id}
              className={`flex flex-col overflow-hidden rounded-2xl border border-fg/[0.07] bg-card shadow-sm ${
                r.is_published ? "" : "opacity-60"
              }`}
            >
              <div className="relative">
                <Photo r={r} className="aspect-[4/3] w-full" />
                {!r.is_published && (
                  <span className="absolute left-2 top-2">
                    <Tag tone="off">Disembunyikan</Tag>
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <a
                  href={recipeHref(publicSlug(nameOf(r)))}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[14px] font-bold leading-snug text-fg hover:text-brand-red"
                  title="Buka di recipe.20fit"
                >
                  {nameOf(r)}
                </a>
                <p className="text-[12px] text-fg/50">
                  {r.kcal != null ? `${r.kcal} kkal` : "— kkal"}
                  {r.category ? ` · ${r.category}` : ""}
                </p>
                <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                  {(r.diet_types || []).map((d) => (
                    <Tag key={d}>{d}</Tag>
                  ))}
                </div>
                <div className="mt-auto flex items-center gap-1.5 pt-2">
                  <Btn size="sm" onClick={() => setEditing(r)}>
                    Edit
                  </Btn>
                  <Btn size="sm" variant="danger" disabled={busyId === r.id} onClick={() => remove(r)}>
                    Hapus
                  </Btn>
                  <PublishToggle r={r} busy={busyId === r.id} onClick={() => togglePublish(r)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-fg/[0.07] bg-card">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className={`${HEAD} border-b border-fg/10 text-[11px] text-fg/50`}>
                <th className="px-3 py-2.5">Foto</th>
                <th className="px-3 py-2.5">Resep</th>
                <th className="px-3 py-2.5 text-right">Kkal</th>
                <th className="px-3 py-2.5">Diet</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-fg/[0.06] last:border-0 hover:bg-fg/[0.02]">
                  <td className="px-3 py-2">
                    <Photo r={r} className="h-11 w-11 rounded-lg" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-fg">{nameOf(r)}</div>
                    <div className="text-[11.5px] text-fg/45">
                      {lang === "en" ? r.name_id : r.name_en} · <span className="font-mono">{r.id}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{r.kcal ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(r.diet_types || []).slice(0, 3).map((d) => (
                        <Tag key={d}>{d}</Tag>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {r.is_published ? <Tag tone="live">Tayang</Tag> : <Tag tone="off">Disembunyikan</Tag>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1.5">
                      <Btn size="sm" onClick={() => setEditing(r)}>
                        Edit
                      </Btn>
                      <Btn size="sm" variant="danger" disabled={busyId === r.id} onClick={() => remove(r)}>
                        Hapus
                      </Btn>
                      <PublishToggle r={r} busy={busyId === r.id} onClick={() => togglePublish(r)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Form tambah / edit resep official (bilingual). Field = kolom my20fit_recipe_official.
// =============================================================================

interface FormState {
  id: string;
  name_id: string;
  name_en: string;
  category: string;
  kcal: string;
  p: string;
  c: string;
  f: string;
  servings: string;
  cook_minutes: string;
  prep_minutes: string;
  emoji: string;
  diet_types: string[];
  ingredients_id: string;
  ingredients_en: string;
  steps_id: string;
  steps_en: string;
  equipment: string;
  prep_note: string;
  common_mistake: string;
  photo_url: string;
  is_published: boolean;
}

const s = (v: unknown) => (v == null ? "" : String(v));

function toForm(r: OfficialRow | null): FormState {
  return {
    id: s(r?.id),
    name_id: s(r?.name_id),
    name_en: s(r?.name_en),
    category: s(r?.category),
    kcal: s(r?.kcal),
    p: s(r?.p),
    c: s(r?.c),
    f: s(r?.f),
    servings: s(r?.servings),
    cook_minutes: s(r?.cook_minutes),
    prep_minutes: s(r?.prep_minutes),
    emoji: s(r?.emoji),
    diet_types: r?.diet_types ? [...r.diet_types] : ["normal"],
    ingredients_id: s(r?.ingredients_id),
    ingredients_en: s(r?.ingredients_en),
    steps_id: s(r?.steps_id),
    steps_en: s(r?.steps_en),
    equipment: s(r?.equipment),
    prep_note: s(r?.prep_note),
    common_mistake: s(r?.common_mistake),
    photo_url: s(r?.photo_url),
    is_published: r ? r.is_published : true,
  };
}

const NUM_KEYS = ["kcal", "p", "c", "f", "servings", "cook_minutes", "prep_minutes"] as const;

/** Body untuk API my.20fit. Kosong dikirim "" (bukan null) supaya server MENGOSONGKAN kolomnya —
 *  server mengabaikan field bernilai null saat update. */
function toPayload(f: FormState): OfficialInput {
  const out: Record<string, unknown> = {
    name_id: f.name_id.trim(),
    name_en: f.name_en.trim(),
    category: f.category.trim(),
    emoji: f.emoji.trim(),
    diet_types: f.diet_types,
    ingredients_id: f.ingredients_id.trim(),
    ingredients_en: f.ingredients_en.trim(),
    steps_id: f.steps_id.trim(),
    steps_en: f.steps_en.trim(),
    equipment: f.equipment.trim(),
    prep_note: f.prep_note.trim(),
    common_mistake: f.common_mistake.trim(),
    photo_url: f.photo_url.trim(),
    is_published: f.is_published,
  };
  NUM_KEYS.forEach((k) => {
    const v = f[k].trim();
    out[k] = v === "" ? "" : Math.round(Number(v));
  });
  return out as OfficialInput;
}

function OfficialForm({
  initial,
  existingIds,
  onCancel,
  onSaved,
}: {
  initial: OfficialRow | null;
  existingIds: string[];
  onCancel: () => void;
  onSaved: (row: OfficialRow, isNew: boolean) => void;
}) {
  const isNew = !initial;
  const [f, setF] = useState<FormState>(() => toForm(initial));
  const [idTouched, setIdTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));
  const effectiveId = isNew ? (idTouched ? slugify(f.id) : slugify(f.name_en || f.name_id)) : f.id;

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      set("photo_url", await menuAdmin.uploadOfficialPhoto(file));
    } catch (e2: any) {
      setErr(e2?.message || "Upload foto gagal.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setErr("");
    if (!f.name_id.trim() || !f.name_en.trim()) return setErr("Nama (ID & EN) wajib diisi.");
    if (f.photo_url.trim() && !/^https:\/\//i.test(f.photo_url.trim())) return setErr("URL foto harus diawali https://");
    for (const k of NUM_KEYS) {
      if (f[k].trim() && !Number.isFinite(Number(f[k]))) return setErr(`Nilai "${k}" harus angka.`);
    }
    if (isNew) {
      if (!effectiveId) return setErr("ID/slug tidak valid.");
      if (existingIds.includes(effectiveId)) return setErr(`ID "${effectiveId}" sudah dipakai. Ubah ID-nya.`);
    }
    setBusy(true);
    try {
      const payload = toPayload(f);
      let id = initial?.id ?? effectiveId;
      if (isNew) id = await menuAdmin.createOfficial({ ...payload, id: effectiveId });
      else await menuAdmin.updateOfficial(id, payload);
      const num = (v: string) => (v.trim() === "" ? null : Math.round(Number(v)));
      onSaved(
        {
          ...(initial || ({ sort_order: 0, q: null, tint: null } as unknown as OfficialRow)),
          id,
          name_id: f.name_id.trim(),
          name_en: f.name_en.trim(),
          category: f.category.trim() || null,
          kcal: num(f.kcal),
          p: num(f.p),
          c: num(f.c),
          f: num(f.f),
          servings: num(f.servings),
          cook_minutes: num(f.cook_minutes),
          prep_minutes: num(f.prep_minutes),
          emoji: f.emoji.trim() || null,
          diet_types: f.diet_types,
          ingredients_id: f.ingredients_id.trim() || null,
          ingredients_en: f.ingredients_en.trim() || null,
          steps_id: f.steps_id.trim() || null,
          steps_en: f.steps_en.trim() || null,
          equipment: f.equipment.trim() || null,
          prep_note: f.prep_note.trim() || null,
          common_mistake: f.common_mistake.trim() || null,
          photo_url: f.photo_url.trim() || null,
          is_published: f.is_published,
        },
        isNew
      );
    } catch (e: any) {
      setErr(e?.message || "Gagal menyimpan.");
      setBusy(false);
    }
  }

  const area = `${inputCls} min-h-[140px] font-mono text-[12.5px] leading-relaxed`;

  return (
    <div className="rounded-2xl border border-fg/[0.07] bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`${HEAD} text-[11px] font-bold text-fg/45`}>Resep official</p>
          <h3 className={`${HEAD} text-2xl font-extrabold text-fg`}>{isNew ? "Resep baru" : "Edit resep"}</h3>
          <p className="mt-1 text-[12px] text-fg/50">
            Disimpan ke katalog my.20fit — perubahan sama tampil di admin my.20fit & recipe.20fit.
          </p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={onCancel} disabled={busy}>
            Batal
          </Btn>
          <Btn variant="primary" onClick={save} disabled={busy || uploading}>
            {busy ? "Menyimpan…" : "Simpan"}
          </Btn>
        </div>
      </div>

      {err && (
        <div className="mb-4">
          <Notice tone="error">{err}</Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Foto + status */}
        <div className="space-y-3">
          <div
            className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-xl border border-fg/10 bg-fg/5 bg-cover bg-center text-4xl"
            style={f.photo_url ? { backgroundImage: `url("${f.photo_url.replace(/"/g, "%22")}")` } : undefined}
          >
            {!f.photo_url && iconOf(f.emoji)}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPhoto} />
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Mengunggah…" : f.photo_url ? "Ganti foto" : "Unggah foto"}
            </Btn>
            {f.photo_url && (
              <Btn size="sm" variant="ghost" onClick={() => set("photo_url", "")}>
                Hapus foto
              </Btn>
            )}
          </div>
          <Field label="atau URL foto" hint="png/jpg/webp, maks 5MB. Tanpa foto → foto otomatis dari nama.">
            <input className={inputCls} value={f.photo_url} onChange={(e) => set("photo_url", e.target.value)} placeholder="https://…" />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-fg/10 px-3 py-2.5">
            <input
              type="checkbox"
              checked={f.is_published}
              onChange={(e) => set("is_published", e.target.checked)}
              className="h-4 w-4 accent-[#C41101]"
            />
            <span className="text-[13px] font-semibold text-fg">Tayang di situs</span>
          </label>
        </div>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama (Indonesia) *">
              <input className={inputCls} value={f.name_id} onChange={(e) => set("name_id", e.target.value)} />
            </Field>
            <Field label="Name (English) *">
              <input className={inputCls} value={f.name_en} onChange={(e) => set("name_en", e.target.value)} />
            </Field>
            <Field label="ID / slug" hint={isNew ? "Otomatis dari nama EN. Tidak bisa diubah setelah dibuat." : "Tidak bisa diubah."}>
              <input
                className={`${inputCls} font-mono ${isNew ? "" : "opacity-60"}`}
                value={isNew ? effectiveId : f.id}
                readOnly={!isNew}
                onChange={(e) => {
                  setIdTouched(true);
                  set("id", e.target.value);
                }}
              />
            </Field>
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <Field label="Kategori" hint="mis. chicken, beef, seafood, rice">
                <input className={inputCls} value={f.category} onChange={(e) => set("category", e.target.value)} />
              </Field>
              <Field label="Ikon">
                <input className={inputCls} value={f.emoji} onChange={(e) => set("emoji", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {(
              [
                ["kcal", "Kalori"],
                ["p", "Protein g"],
                ["c", "Karbo g"],
                ["f", "Lemak g"],
                ["servings", "Porsi"],
                ["prep_minutes", "Persiapan mnt"],
                ["cook_minutes", "Masak mnt"],
              ] as [(typeof NUM_KEYS)[number], string][]
            ).map(([k, l]) => (
              <Field key={k} label={l}>
                <input className={inputCls} inputMode="numeric" value={f[k]} onChange={(e) => set(k, e.target.value)} />
              </Field>
            ))}
          </div>

          <div>
            <span className={`${HEAD} mb-1.5 block text-[11px] font-bold text-fg/55`}>Tipe diet</span>
            <div className="flex flex-wrap gap-1.5">
              {DIET_TYPES.map((d) => {
                const on = f.diet_types.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("diet_types", on ? f.diet_types.filter((x) => x !== d) : [...f.diet_types, d])}
                    className={`${HEAD} h-7 rounded-full border px-3 text-[11px] font-bold ${
                      on ? "border-brand-red bg-brand-red text-white" : "border-fg/15 text-fg/60 hover:border-fg/40"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bahan (ID)" hint='Satu bahan per baris. Baris diakhiri ":" = judul kelompok.'>
              <textarea className={area} value={f.ingredients_id} onChange={(e) => set("ingredients_id", e.target.value)} />
            </Field>
            <Field label="Ingredients (EN)">
              <textarea className={area} value={f.ingredients_en} onChange={(e) => set("ingredients_en", e.target.value)} />
            </Field>
            <Field label="Cara membuat (ID)" hint="Satu langkah per baris.">
              <textarea className={area} value={f.steps_id} onChange={(e) => set("steps_id", e.target.value)} />
            </Field>
            <Field label="Steps (EN)">
              <textarea className={area} value={f.steps_en} onChange={(e) => set("steps_en", e.target.value)} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Alat dapur">
              <textarea className={`${inputCls} min-h-[72px]`} value={f.equipment} onChange={(e) => set("equipment", e.target.value)} />
            </Field>
            <Field label="Catatan persiapan">
              <textarea className={`${inputCls} min-h-[72px]`} value={f.prep_note} onChange={(e) => set("prep_note", e.target.value)} />
            </Field>
            <Field label="Kesalahan umum">
              <textarea className={`${inputCls} min-h-[72px]`} value={f.common_mistake} onChange={(e) => set("common_mistake", e.target.value)} />
            </Field>
          </div>

          <div className="flex justify-end gap-2 border-t border-fg/10 pt-4">
            <Btn onClick={onCancel} disabled={busy}>
              Batal
            </Btn>
            <Btn variant="primary" onClick={save} disabled={busy || uploading}>
              {busy ? "Menyimpan…" : "Simpan"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
