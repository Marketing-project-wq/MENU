import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { api } from "./api";
import { takePendingSave } from "./pendingSave";
import { AuthModal, type AuthMode } from "../components/AuthModal";

interface AuthCtx {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (mode?: "in" | "up") => void;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: async () => {},
});

/**
 * Satu sumber state auth untuk seluruh app.
 *
 * Daftar/masuk terjadi LANGSUNG di sini (recepie.20fit.id) lewat <AuthModal> —
 * TIDAK lagi lompat ke my.20fit.id. Akun = pool Supabase 20FIT yang sama, jadi sesi
 * yang dibuat di sini tetap berlaku untuk simpan-resep, submit, dan produk 20FIT lain.
 *
 * SSO hand-off lama (my.20fit.id -> recepie/#access_token=...&refresh_token=...) tetap
 * didukung untuk backward-compat; token di FRAGMENT (#) tak dikirim ke server / tak masuk
 * log dan langsung di-strip. Link reset password Supabase memakai fragment yang sama
 * dengan type=recovery -> kita buka modal "buat password baru".
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("in");

  useEffect(() => {
    (async () => {
      try {
        const h = new URLSearchParams(location.hash.slice(1));
        const at = h.get("access_token");
        const rt = h.get("refresh_token");
        const type = h.get("type");
        if (at && rt) {
          await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          history.replaceState(null, "", location.pathname + location.search);
          // Kembali dari link reset password -> minta user buat password baru.
          if (type === "recovery") {
            setAuthMode("newpw");
            setAuthOpen(true);
          }
        }
      } catch {
        /* lanjut sebagai guest */
      }
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      setIsLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      setUser(s?.user ?? null);
      // Baru saja login/daftar -> pindahkan like yang dibuat sebagai guest (sesi anonim
      // eco_anon) ke akun ini. Aman dipanggil berkali-kali (server no-op kalau tak ada
      // sesi anonim tersisa), jadi tak perlu dedup di sisi sini.
      if (e === "SIGNED_IN") {
        api.claimAnonLikes().catch(() => {
          /* best-effort — kegagalan di sini tak boleh mengganggu login */
        });
        // Resep yang diklik "Simpan" sebelum login -> simpan sekarang juga, otomatis.
        const pending = takePendingSave();
        if (pending) {
          api.save(pending.source, pending.id).catch(() => {
            /* best-effort — kalau gagal, user masih bisa simpan manual lagi */
          });
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Buka modal daftar/masuk in-place (dulu redirect ke my.20fit.id).
  const login = (mode: "in" | "up" = "in") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
      {authOpen && (
        <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthOpen(false)} />
      )}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
