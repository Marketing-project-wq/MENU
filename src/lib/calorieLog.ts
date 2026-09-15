import { supabase } from "./supabase";

/**
 * Satu entri makanan di `my20fit_daily_log.cal_items` — bentuk SAMA dengan tracker Calories 20FIT
 * yang sudah ada (calories.20fit.id / dashboard my.20fit): `{ name, kcal, p, c, f, t }`.
 * `t` = jam log "HH:MM". kcal & makro dalam gram.
 */
export interface CalItem {
  name: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  t: string;
}

export type LogResult = "ok" | "unauthenticated" | "error";

function todayStr(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function nowHM(): string {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

/**
 * Tambahkan 1 makanan ke kalori HARI INI milik user (tabel `my20fit_daily_log`, kolom `cal_items`).
 *
 * Nyambung ke sistem Calories 20FIT yang SUDAH ADA — POLA PERSIS my.20fit (`Auth.saveDaily`):
 * baca `cal_items` terkini dari akun → append → upsert dengan `onConflict: auth_user_id,log_date`.
 * Baca-dulu menghindari menimpa entri dari device/tab lain.
 *
 * Keamanan: RLS tabel = own-row (`auth.uid() = auth_user_id`) untuk select/insert/update, jadi user
 * HANYA bisa menulis datanya sendiri; JWT dikirim supabase-js lewat header (TIDAK di URL). Angka
 * yang di-log = PERKIRAAN dari resep (disclaimer tetap tampil di UI).
 */
export async function logToCalories(item: Omit<CalItem, "t">): Promise<LogResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "unauthenticated";

  const log_date = todayStr();
  try {
    const { data: rows, error: readErr } = await supabase
      .from("my20fit_daily_log")
      .select("cal_items")
      .eq("auth_user_id", user.id)
      .eq("log_date", log_date)
      .limit(1);
    if (readErr) return "error";

    const current =
      rows && rows[0] && Array.isArray(rows[0].cal_items) ? (rows[0].cal_items as CalItem[]) : [];
    const next: CalItem[] = [...current, { ...item, t: nowHM() }];

    const { error: upErr } = await supabase.from("my20fit_daily_log").upsert(
      {
        auth_user_id: user.id,
        log_date,
        updated_at: new Date().toISOString(),
        cal_items: next,
      },
      { onConflict: "auth_user_id,log_date" }
    );
    if (upErr) return "error";
    return "ok";
  } catch {
    return "error";
  }
}
