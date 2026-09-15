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
