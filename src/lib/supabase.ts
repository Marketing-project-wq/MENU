import { createClient } from "@supabase/supabase-js";
import { SUPABASE } from "./constants";

// menu.20fit.id bisa dipakai TANPA login (browse publik). Jadi createClient tidak
// boleh throw hanya karena anon key belum diset saat build — hanya login/submit
// yang tidak akan berfungsi.
if (!SUPABASE.ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_SUPABASE_ANON_KEY belum diset — login/SSO & submit tidak akan berfungsi (browse tetap jalan)."
  );
}

export const supabase = createClient(SUPABASE.URL, SUPABASE.ANON_KEY || "missing-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: SUPABASE.STORAGE_KEY,
  },
});

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// Dua token sesi untuk hand-off SSO (mis. ke CMS admin my.20fit.id lewat fragment #).
// null kalau belum login. Token TIDAK boleh masuk query/log — hanya fragment (#).
export async function getSessionTokens(): Promise<{ access_token: string; refresh_token: string } | null> {
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  return s?.access_token && s?.refresh_token
    ? { access_token: s.access_token, refresh_token: s.refresh_token }
    : null;
}

/**
 * Bangun URL ke produk 20FIT lain dengan SESI ikut dibawa lewat FRAGMENT (#) — persis
 * konvensi yang dibaca `AuthProvider` di auth.tsx (dan pola calories.20fit.id): begitu
 * mendarat di produk tujuan, fragment dibaca -> setSession -> langsung di-strip, jadi user
 * nggak perlu login ulang saat pindah lewat app-switcher.
 *
 * Kenapa fragment, bukan `?token=`: fragment TIDAK pernah dikirim ke server, tidak masuk
 * access-log/Referer, dan tidak ke-capture GA (query ke-capture). Aturan aman:
 *  - hanya host *.20fit.id — JANGAN pernah oper sesi ke domain luar;
 *  - subdomain yang sama, atau belum login -> balikin URL apa adanya (produk publik seperti
 *    recipe tetap bisa dibuka tanpa login — silent SSO, bukan paksa login).
 */
export async function withSsoHandoff(targetUrl: string): Promise<string> {
  try {
    const host = new URL(targetUrl).hostname;
    const is20fit = host === "20fit.id" || host.endsWith(".20fit.id");
    if (!is20fit || host === location.hostname) return targetUrl;

    const tokens = await getSessionTokens();
    if (!tokens) return targetUrl;

    const frag = new URLSearchParams({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    }).toString();
    return `${targetUrl.split("#")[0]}#${frag}`;
  } catch {
    // Apa pun yang gagal -> navigasi biasa; jangan pernah blokir pindah halaman.
    return targetUrl;
  }
}
