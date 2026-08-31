import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import { getLang, makeT, setLang as persistLang } from "./i18n";
import type { Lang, OfficialRecipe, PublishedContribution } from "./types";

/* ------------------------------- Language ------------------------------- */

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: ReturnType<typeof makeT>;
}
const LangContext = createContext<LangCtx>({ lang: "id", setLang: () => {}, t: makeT("id") });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getLang());
  const setLang = (l: Lang) => {
    persistLang(l);
    setLangState(l);
  };
  const value = useMemo(() => ({ lang, setLang, t: makeT(lang) }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
export const useLang = () => useContext(LangContext);

/* -------------------------------- Recipes ------------------------------- */

interface RecipesCtx {
  official: OfficialRecipe[];
  members: PublishedContribution[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}
const RecipesContext = createContext<RecipesCtx>({
  official: [],
  members: [],
  loading: true,
  error: null,
  reload: () => {},
});

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [official, setOfficial] = useState<OfficialRecipe[]>([]);
  const [members, setMembers] = useState<PublishedContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    // Muat paralel; kontribusi member tahan-banting (kembalikan [] kalau gagal).
    Promise.allSettled([api.getCatalog(), api.getPublished()]).then((res) => {
      if (!alive) return;
      const [cat, pub] = res;
      if (cat.status === "fulfilled") setOfficial(cat.value);
      else setError("Gagal memuat katalog resep resmi.");
      setMembers(pub.status === "fulfilled" ? pub.value : []);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [nonce]);

  const value = useMemo(
    () => ({ official, members, loading, error, reload: () => setNonce((n) => n + 1) }),
    [official, members, loading, error]
  );
  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}
export const useRecipes = () => useContext(RecipesContext);
