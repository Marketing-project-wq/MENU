import { API, API_BASE } from "./constants";
import { getAccessToken } from "./supabase";
import type { OfficialRecipe, PublishedContribution, MineResponse } from "./types";

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
  photo_url?: string | null;
  est_kcal?: number | null;
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
};
