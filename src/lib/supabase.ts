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
