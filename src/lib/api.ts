import { API, API_BASE } from "./constants";
import { getAccessToken } from "./supabase";
import type {
  Caterer,
  MineResponse,
  OfficialRecipe,
  PublishedContribution,
  RecipeStep,
  RewardConfig,
  Source,
} from "./types";

async function authHeaders(): Promise<Record<string, string>> {
  const tok = await getAccessToken();
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

async function jsonOrThrow(r: Response): Promise<any> {
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request gagal (${r.status})`);
  return j;
}

export interface SubmitBody {
  name: string;
  ingredients: string;
  steps: string;
  diet_type: string;
  display_name?: string | null; // nama tampilan publik -- bukan email/nama akun
  photo_url?: string | null;
  est_kcal?: number | null;
  steps_json?: RecipeStep[] | null;
  servings?: number | null;
  cook_minutes?: number | null;
}

/** Kunci sosial gabungan "source:menu_id". */
export type SocialKey = string;
export interface SocialResponse {
  counts: Record<SocialKey, number>;
  reacted: SocialKey[];
  saved: SocialKey[];
}
export interface SavedRow {
  source: Source;
  menu_id: string;
  created_at: string;
}
export interface SavedResponse {
  saved: SavedRow[];
  members: Record<string, PublishedContribution>;
}

export const api = {
  /** Resep resmi 20FIT (satu sumber = js/recipes.js di my.20fit.id). */
  async getCatalog(): Promise<OfficialRecipe[]> {
    const r = await fetch(`${API_BASE}${API.CATALOG}`);
    const j = await jsonOrThrow(r);
    return j.recipes ?? j.data ?? [];
  },

  /**
   * Kontribusi user yang sudah approved+published. Dibuat tahan-banting: kalau
   * endpoint belum ada (mis. belum deploy), kembalikan [] supaya browse resep
   * resmi tetap jalan.
   */
  async getPublished(): Promise<PublishedContribution[]> {
    try {
      const r = await fetch(`${API_BASE}${API.PUBLISHED}`);
      if (!r.ok) return [];
      const j = await r.json().catch(() => ({}));
      return j.menus ?? j.data ?? [];
    } catch {
      return [];
    }
  },

  /** Submit resep baru (butuh login). */
  async submit(body: SubmitBody): Promise<{ ok: boolean; id?: string }> {
    const r = await fetch(`${API_BASE}${API.SUBMIT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(body),
    });
    return jsonOrThrow(r);
  },

  /** Submission-ku + progres reward. */
  async mine(): Promise<MineResponse> {
    const r = await fetch(`${API_BASE}${API.MINE}`, { headers: { ...(await authHeaders()) } });
    return jsonOrThrow(r);
  },

  /** Ambang & besaran reward sumbang-resep (publik, tanpa login) -- JANGAN hardcode di UI. */
  async rewardConfig(): Promise<RewardConfig> {
    const r = await fetch(`${API_BASE}${API.REWARD_CONFIG}`);
    return jsonOrThrow(r);
  },

  /** Katering yang menjual resep ini (direktori, tanpa transaksi). Gagal -> [] (jangan blokir
   *  render halaman resep gara-gara ini). */
  async caterers(source: Source, id: string): Promise<Caterer[]> {
    try {
      const r = await fetch(`${API_BASE}${API.CATERERS(id)}?source=${encodeURIComponent(source)}`);
      if (!r.ok) return [];
      const j = await r.json().catch(() => ({}));
      return j.caterers ?? [];
    } catch {
      return [];
    }
  },

  /** Catat klik ke katering (analitik saja, dipakai nanti utk urutan "terpopuler" begitu
   *  datanya cukup -- BELUM sekarang). Best-effort, tak pernah melempar. */
  async trackCatererClick(catererId: string, source: Source, id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}${API.CATERER_CLICK}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ caterer_id: catererId, source, menu_id: id }),
      });
    } catch {
      /* best-effort */
    }
  },

  /** Revisi menu yang ditolak -> pending lagi. */
  async revise(id: string, body: SubmitBody): Promise<{ ok: boolean }> {
    const r = await fetch(`${API_BASE}${API.REVISE(id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(body),
    });
    return jsonOrThrow(r);
  },

  /**
   * Best-effort: catat user membuka detail sebuah menu (sinyal minat).
   * Body sesuai server my.20fit.id: { menu_id, name, types, cat, kcal }.
   * Server menolak tanpa login (401) — jadi hanya jalan untuk user login; diabaikan diam-diam.
   */
  async logOpen(payload: {
    menu_id: string;
    name?: string;
    types?: string[];
    cat?: string;
    kcal?: number | null;
  }): Promise<void> {
    try {
      const tok = await getAccessToken();
      if (!tok) return; // endpoint butuh login; guest -> lewati
      await fetch(`${API_BASE}${API.OPEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify(payload),
      });
    } catch {
      /* analitik best-effort — abaikan error */
    }
  },

  /** Unggah satu foto resep (data URL base64) -> Storage my.20fit.id, balik URL publik. Butuh login. */
  async uploadPhoto(dataUrl: string): Promise<string> {
    const r = await fetch(`${API_BASE}${API.UPLOAD}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ data_url: dataUrl }),
    });
    const j = await jsonOrThrow(r);
    if (!j.url) throw new Error("Upload gagal.");
    return j.url as string;
  },

  /**
   * Toggle heart pada resep. TIDAK butuh login -- guest diidentifikasi lewat cookie httpOnly
   * (eco_anon) di server, makanya wajib `credentials: "include"` biar cookie lintas-origin
   * (menu.20fit.id -> my.20fit.id) ikut terkirim/tersimpan.
   */
  async react(source: Source, id: string): Promise<{ reacted: boolean; count: number }> {
    const r = await fetch(`${API_BASE}${API.REACT(id)}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ source }),
    });
    return jsonOrThrow(r);
  },

  /** Pindahkan like sesi anonim (cookie eco_anon) ke akun yang baru login/daftar. Butuh login;
   *  aman dipanggil berkali-kali (no-op kalau tak ada sesi anonim tersisa). */
  async claimAnonLikes(): Promise<{ migrated: number }> {
    const tok = await getAccessToken();
    if (!tok) return { migrated: 0 };
    const r = await fetch(`${API_BASE}${API.CLAIM_ANON_LIKES}`, {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${tok}` },
    });
    const j = await jsonOrThrow(r);
    return { migrated: j.migrated || 0 };
  },

  /** Toggle simpan resep ke koleksi. Butuh login. */
  async save(source: Source, id: string): Promise<{ saved: boolean }> {
    const r = await fetch(`${API_BASE}${API.SAVE(id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ source }),
    });
    return jsonOrThrow(r);
  },

  /** Koleksi resep tersimpan milik user (butuh login). */
  async getSaved(): Promise<SavedResponse> {
    const r = await fetch(`${API_BASE}${API.SAVED}`, { headers: { ...(await authHeaders()) } });
    const j = await jsonOrThrow(r);
    return { saved: j.saved ?? [], members: j.members ?? {} };
  },

  /**
   * Jumlah heart (+ state user bila login) utk banyak resep sekaligus. Tahan-banting:
   * kembalikan kosong kalau endpoint belum ada / gagal, supaya browse tetap jalan.
   */
  async social(keys: SocialKey[]): Promise<SocialResponse> {
    const empty: SocialResponse = { counts: {}, reacted: [], saved: [] };
    if (!keys.length) return empty;
    try {
      const ids = encodeURIComponent(keys.join(","));
      const r = await fetch(`${API_BASE}${API.SOCIAL}?ids=${ids}`, {
        credentials: "include", // biar cookie eco_anon (like guest) ikut terbaca server
        headers: { ...(await authHeaders()) },
      });
      if (!r.ok) return empty;
      const j = await r.json().catch(() => ({}));
      return { counts: j.counts ?? {}, reacted: j.reacted ?? [], saved: j.saved ?? [] };
    } catch {
      return empty;
    }
  },
};
