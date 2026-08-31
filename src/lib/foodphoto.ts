import { API_BASE } from "./constants";

// Resolusi foto makanan lewat API publik my.20fit.id (/api/menu/photo → Pexels/TheMealDB + cache
// server). Cache klien di localStorage + dedup in-memory. Hanya URL sukses yang disimpan; kalau
// gagal, biarkan retry di kunjungan berikutnya (jangan kunci jadi placeholder).
const LS_KEY = "menu20fit_foodphoto_v1";

type Cache = Record<string, string>; // recipeId -> url

function load(): Cache {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function persist(c: Cache) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

const inflight = new Map<string, Promise<string | null>>();

/**
 * @param id   id resep (dipakai sbg cache key & id foto di server)
 * @param mdb  kata kunci pendek utk TheMealDB (mis. "chicken")
 * @param name nama deskriptif utk Pexels (mis. "Grilled Chicken Rice Bowl")
 */
export async function resolveFoodPhoto(id: string, mdb: string, name: string): Promise<string | null> {
  const c = load();
  if (c[id]) return c[id];
  const existing = inflight.get(id);
  if (existing) return existing;

  const p = (async () => {
    try {
      const u =
        `${API_BASE}/api/menu/photo?id=${encodeURIComponent(id)}` +
        `&q=${encodeURIComponent(name || "")}&mdb=${encodeURIComponent(mdb || "")}`;
      const r = await fetch(u);
      if (!r.ok) return null;
      const j = await r.json().catch(() => ({}));
      if (j && j.ok && j.url) {
        const cc = load();
        cc[id] = j.url;
        persist(cc);
        return j.url as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      inflight.delete(id);
    }
  })();
  inflight.set(id, p);
  return p;
}
