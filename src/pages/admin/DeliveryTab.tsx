import { useEffect, useMemo, useState } from "react";
import {
  menuAdmin,
  type DeliveryLink,
  type DeliveryPreset,
  type DeliveryRecipeRef,
} from "../../lib/menuAdmin";
import { Spinner } from "../../components/Spinner";
import { Btn, Field, HEAD, Notice, Tag, inputCls } from "./ui";

// Tautan Eat Now (pesan-antar) per resep — tabel my20fit_menu_delivery_links via API admin
// my.20fit (sama dgn admin-v2 "Eat Now / pesan-antar"). Tampil di tombol "Eat Now" recipe.20fit.

const key = (r: { source: string; menu_id: string }) => `${r.source}:${r.menu_id}`;

export function DeliveryTab() {
  const [links, setLinks] = useState<DeliveryLink[]>([]);
  const [recipes, setRecipes] = useState<DeliveryRecipeRef[]>([]);
  const [presets, setPresets] = useState<DeliveryPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [flash, setFlash] = useState("");
  const [q, setQ] = useState("");
  const [onlyUnmapped, setOnlyUnmapped] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Form tambah tautan
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [d, p] = await Promise.all([menuAdmin.listDelivery(), menuAdmin.deliveryPresets()]);
      setLinks(d.links);
      setRecipes(d.recipes);
      setPresets(p);
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat tautan.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function done(msg: string) {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 5000);
  }

  const byRecipe = useMemo(() => {
    const m = new Map<string, DeliveryLink[]>();
    links.forEach((l) => {
      const k = key(l);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(l);
    });
    m.forEach((arr) => arr.sort((a, b) => a.sort_order - b.sort_order));
    return m;
  }, [links]);

  const unmappedCount = recipes.filter((r) => !byRecipe.has(key(r))).length;

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return recipes.filter((r) => {
      if (onlyUnmapped && byRecipe.has(key(r))) return false;
      return !needle || `${r.name} ${r.menu_id}`.toLowerCase().includes(needle);
    });
  }, [recipes, q, onlyUnmapped, byRecipe]);

  async function add() {
    const ref = recipes.find((r) => key(r) === target);
    if (!ref) return alert("Pilih resep dulu.");
    if (!label.trim() || !url.trim()) return alert("Label & URL wajib diisi.");
    if (!/^https:\/\//i.test(url.trim())) return alert("URL harus diawali https://");
    setBusy("__add");
    try {
      const id = await menuAdmin.createDelivery({
        source: ref.source,
        menu_id: ref.menu_id,
        label: label.trim(),
        url: url.trim(),
        sort_order: byRecipe.get(target)?.length ?? 0,
      });
      setLinks((prev) => [
        ...prev,
        {
          id,
          source: ref.source,
          menu_id: ref.menu_id,
          provider: "grabfood",
          label: label.trim(),
          url: url.trim(),
          sort_order: byRecipe.get(target)?.length ?? 0,
          is_active: true,
        },
      ]);
      setLabel("");
      setUrl("");
      done(`Tautan ditambahkan ke "${ref.name}".`);
    } catch (e: any) {
      alert(e?.message || "Gagal menambah tautan.");
    } finally {
      setBusy(null);
    }
  }

  async function patch(l: DeliveryLink, p: Partial<DeliveryLink>) {
    setBusy(l.id);
    try {
      await menuAdmin.updateDelivery(l.id, p);
      setLinks((prev) => prev.map((x) => (x.id === l.id ? { ...x, ...p } : x)));
    } catch (e: any) {
      alert(e?.message || "Gagal menyimpan.");
    } finally {
      setBusy(null);
    }
  }

  async function del(l: DeliveryLink) {
    if (!confirm(`Hapus tautan "${l.label}"?`)) return;
    setBusy(l.id);
    try {
      await menuAdmin.deleteDelivery(l.id);
      setLinks((prev) => prev.filter((x) => x.id !== l.id));
    } catch (e: any) {
      alert(e?.message || "Gagal menghapus.");
    } finally {
      setBusy(null);
    }
  }

  if (loading)
    return (
      <div className="py-12">
        <Spinner label="Memuat tautan Eat Now…" />
      </div>
    );

  return (
    <div className="space-y-4">
      {err && (
        <Notice tone="error">
          {err}{" "}
          <button type="button" className="font-bold underline" onClick={load}>
            Coba lagi
          </button>
        </Notice>
      )}
      {flash && <Notice tone="ok">{flash}</Notice>}

      {/* Tambah tautan */}
      <div className="rounded-2xl border border-fg/[0.07] bg-card p-4 shadow-sm">
        <h3 className={`${HEAD} mb-3 text-[15px] font-extrabold text-fg`}>Tambah tautan pesan-antar</h3>
        <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1.5fr_auto] md:items-end">
          <Field label="Resep">
            <select className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">— pilih resep —</option>
              {recipes.map((r) => (
                <option key={key(r)} value={key(r)}>
                  {r.name}
                  {r.source === "member" ? " (member)" : ""}
                  {byRecipe.has(key(r)) ? ` · ${byRecipe.get(key(r))!.length} tautan` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Label">
            <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="mis. GrabFood — Nasi Goreng" />
          </Field>
          <Field label="URL (https://)">
            <div className="flex gap-2">
              <input className={`${inputCls} min-w-0 flex-1`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://food.grab.com/…" />
              {presets.length > 0 && (
                <select
                  className={inputCls.replace("w-full", "w-28 shrink-0")}
                  value=""
                  onChange={(e) => {
                    const p = presets.find((x) => x.url === e.target.value);
                    if (p) {
                      setUrl(p.url);
                      if (!label.trim()) setLabel(`GrabFood — ${p.label}`);
                    }
                  }}
                  aria-label="Preset GrabFood"
                >
                  <option value="">Preset…</option>
                  {presets.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </Field>
          <Btn variant="primary" onClick={add} disabled={busy === "__add"}>
            {busy === "__add" ? "Menyimpan…" : "+ Tambah"}
          </Btn>
        </div>
      </div>

      {/* Daftar per resep */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${inputCls} h-9 max-w-xs rounded-full`}
          placeholder="Cari resep…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cari resep"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-fg/70">
          <input type="checkbox" checked={onlyUnmapped} onChange={(e) => setOnlyUnmapped(e.target.checked)} className="accent-[#C41101]" />
          Hanya yang belum punya tautan ({unmappedCount})
        </label>
        <span className="ml-auto text-[12px] text-fg/50">
          {links.length} tautan · {recipes.length - unmappedCount}/{recipes.length} resep terpetakan
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-fg/[0.07] bg-card">
        {shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg/45">Tidak ada resep yang cocok.</p>
        ) : (
          shown.map((r) => {
            const ls = byRecipe.get(key(r)) || [];
            return (
              <div key={key(r)} className="border-b border-fg/[0.06] px-4 py-3 last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-bold text-fg">{r.name}</span>
                  {r.source === "member" && <Tag>member</Tag>}
                  {ls.length === 0 && <Tag tone="warn">Belum ada tautan</Tag>}
                  <button
                    type="button"
                    className="ml-auto text-[12px] font-semibold text-brand-red hover:underline"
                    onClick={() => {
                      setTarget(key(r));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    + tautan
                  </button>
                </div>
                {ls.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {ls.map((l) => (
                      <li key={l.id} className={`flex flex-wrap items-center gap-2 text-[12.5px] ${l.is_active ? "" : "opacity-55"}`}>
                        <span className="font-semibold text-fg/85">{l.label}</span>
                        <a href={l.url} target="_blank" rel="noreferrer" className="max-w-[320px] truncate text-fg/45 hover:text-brand-red">
                          {l.url}
                        </a>
                        <span className="ml-auto flex items-center gap-1.5">
                          <Btn size="sm" variant="ghost" disabled={busy === l.id} onClick={() => patch(l, { is_active: !l.is_active })}>
                            {l.is_active ? "Nonaktifkan" : "Aktifkan"}
                          </Btn>
                          <Btn size="sm" variant="danger" disabled={busy === l.id} onClick={() => del(l)}>
                            Hapus
                          </Btn>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
