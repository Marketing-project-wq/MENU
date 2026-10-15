import { getAccessToken } from "./supabase";
import { API_BASE } from "./constants";

// Klien CMS menu (resep OFFICIAL + tautan Eat Now) — memanggil endpoint admin my.20fit.id yang
// SAMA PERSIS dengan admin-v2 di my.20fit (/api/admin/recipes, /api/admin/menu-delivery).
// Jadi data cuma satu (tabel my20fit_recipe_official & my20fit_menu_delivery_links):
//  - edit di CMS recipe.20fit.id  -> langsung tersimpan di my.20fit (admin-v2 melihat perubahan yang sama)
//  - edit di admin my.20fit        -> recipe.20fit.id membacanya lewat /api/menu/catalog
// Akses dicek server-side di my.20fit (requireAdmin "superadmin" via my20fit_admin_roles, Bearer
// token sesi Supabase yang sama). Tidak ada salinan data / sinkronisasi terpisah yang bisa beda.

export const DIET_TYPES = [
  "normal",
  "vegetarian",
  "vegan",
  "pescatarian",
  "keto",
  "halal",
  "high-protein",
  "low-carb",
] as const;

export interface OfficialRow {
  id: string;
  name_en: string;
  name_id: string;
  kcal: number | null;
  p: number | null;
  c: number | null;
  f: number | null;
  diet_types: string[];
  category: string | null;
  q: string | null;
  emoji: string | null;
  tint: string | null;
  ingredients_en: string | null;
  ingredients_id: string | null;
  steps_en: string | null;
  steps_id: string | null;
  servings: number | null;
  cook_minutes: number | null;
  prep_minutes: number | null;
  equipment: string | null;
  prep_note: string | null;
  common_mistake: string | null;
  photo_url: string | null;
  is_published: boolean;
  sort_order: number;
  updated_at?: string;
  updated_by?: string | null;
}

export type OfficialInput = Partial<Omit<OfficialRow, "updated_at" | "updated_by">>;

export interface DeliveryLink {
  id: string;
  source: "official" | "member";
  menu_id: string;
  provider: string;
  label: string;
  url: string;
  sort_order: number;
  is_active: boolean;
  updated_at?: string;
}

export interface DeliveryRecipeRef {
  source: "official" | "member";
  menu_id: string;
  name: string;
}

/** Preset kategori GrabFood dari server my.20fit (url = grabfood_base + path). */
export interface DeliveryPreset {
  label: string;
  url: string;
}

/** Error dgn status HTTP (mis. 409 saat hapus resep yang masih punya tautan). */
export class MenuAdminError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function call(path: string, body?: unknown): Promise<any> {
  const tok = await getAccessToken();
  if (!tok) throw new MenuAdminError("Sesi habis. Login ulang.", 401, null);
  const r = await fetch(`${API_BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${tok}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.ok === false) {
    const msg =
      r.status === 401
        ? "Sesi tidak dikenali server my.20fit. Login ulang."
        : r.status === 403
          ? "Akunmu belum superadmin di my.20fit (my20fit_admin_roles), jadi tidak bisa mengubah katalog."
          : j?.error || `Request gagal (${r.status})`;
    throw new MenuAdminError(msg, r.status, j);
  }
  return j;
}

export const menuAdmin = {
  async listOfficial(q?: string): Promise<{ recipes: OfficialRow[]; seeded: boolean }> {
    const j = await call(`/api/admin/recipes${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    return { recipes: (j.recipes ?? []) as OfficialRow[], seeded: j.seeded !== false };
  },
  async createOfficial(input: OfficialInput): Promise<string> {
    const j = await call("/api/admin/recipes", input);
    return j.id as string;
  },
  async updateOfficial(id: string, patch: OfficialInput): Promise<void> {
    await call(`/api/admin/recipes/${encodeURIComponent(id)}/update`, patch);
  },
  /** force=true ikut menghapus tautan Eat Now resep ini (server menolak 409 tanpa force). */
  async deleteOfficial(id: string, force = false): Promise<{ links_removed: number }> {
    const j = await call(`/api/admin/recipes/${encodeURIComponent(id)}/delete`, force ? { force: true } : {});
    return { links_removed: j.links_removed ?? 0 };
  },
  async uploadOfficialPhoto(file: File): Promise<string> {
    if (file.size > 5 * 1024 * 1024) throw new MenuAdminError("Ukuran gambar maksimal 5MB.", 413, null);
    const dataUrl: string = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = () => rej(new Error("Gagal membaca file."));
      fr.readAsDataURL(file);
    });
    const j = await call("/api/admin/recipes/upload-photo", { data_url: dataUrl });
    if (!j.url) throw new MenuAdminError("Upload foto gagal.", 500, j);
    return j.url as string;
  },
  async seedOfficial(): Promise<{ inserted: number; catalog: number }> {
    const j = await call("/api/admin/recipes/seed-static", {});
    return { inserted: j.inserted ?? 0, catalog: j.catalog ?? 0 };
  },

  async listDelivery(): Promise<{
    links: DeliveryLink[];
    recipes: DeliveryRecipeRef[];
    unmapped: DeliveryRecipeRef[];
  }> {
    const j = await call("/api/admin/menu-delivery");
    return { links: j.links ?? [], recipes: j.recipes ?? [], unmapped: j.unmapped ?? [] };
  },
  async deliveryPresets(): Promise<DeliveryPreset[]> {
    try {
      const j = await call("/api/admin/menu-delivery/presets");
      const base = String(j.grabfood_base || "").replace(/\/+$/, "");
      return (Array.isArray(j.presets) ? j.presets : [])
        .filter((p: any) => p && p.label && (p.url || p.path))
        .map((p: any) => ({ label: String(p.label), url: p.url ? String(p.url) : base + String(p.path) }));
    } catch {
      return [];
    }
  },
  async createDelivery(input: {
    source: "official" | "member";
    menu_id: string;
    label: string;
    url: string;
    provider?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<string> {
    const j = await call("/api/admin/menu-delivery", input);
    return j.id as string;
  },
  async updateDelivery(id: string, patch: Partial<Pick<DeliveryLink, "label" | "url" | "sort_order" | "is_active" | "provider">>): Promise<void> {
    await call(`/api/admin/menu-delivery/${encodeURIComponent(id)}/update`, patch);
  },
  async deleteDelivery(id: string): Promise<void> {
    await call(`/api/admin/menu-delivery/${encodeURIComponent(id)}/delete`, {});
  },
};
