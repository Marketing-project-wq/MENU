import type { Source } from "./types";

// Simpan niat "simpan resep" guest sebelum diarahkan login, supaya begitu dia balik dari
// my.20fit.id sudah login, resep yang tadi diklik LANGSUNG tersimpan -- tak perlu dicari ulang.
// localStorage (bukan state React) karena login = full-page redirect ke domain lain.
const KEY = "menu20fit_pending_save";

export interface PendingSave {
  source: Source;
  id: string;
}

export function setPendingSave(p: PendingSave): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/** Ambil & hapus niat simpan yang tertunda (sekali pakai). null kalau tak ada / rusak. */
export function takePendingSave(): PendingSave | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && (parsed.source === "official" || parsed.source === "member")) {
      return parsed as PendingSave;
    }
    return null;
  } catch {
    return null;
  }
}
