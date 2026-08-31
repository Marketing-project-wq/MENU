import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { URLS } from "./constants";

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
 * SSO hand-off dari my.20fit.id: menu.20fit.id/#access_token=...&refresh_token=...
 * Token di FRAGMENT (#) — tak dikirim ke server / tak masuk log — dan langsung
 * di-strip via history.replaceState. Pola identik calories.20fit.id.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const h = new URLSearchParams(location.hash.slice(1));
        const at = h.get("access_token");
        const rt = h.get("refresh_token");
        if (at && rt) {
          await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          history.replaceState(null, "", location.pathname + location.search);
        }
      } catch {
        /* lanjut sebagai guest */
      }
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      setIsLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = (mode: "in" | "up" = "in") => {
    window.location.href = mode === "up" ? URLS.SIGN_UP : URLS.LOGIN;
  };
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
