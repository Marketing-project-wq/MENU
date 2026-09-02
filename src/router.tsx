import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface RouterCtx {
  path: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const Ctx = createContext<RouterCtx>({ path: "/", navigate: () => {} });

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => window.location.pathname || "/");

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (to: string, opts?: { replace?: boolean }) => {
    if (to === window.location.pathname + window.location.search) return;
    if (opts?.replace) window.history.replaceState(null, "", to);
    else window.history.pushState(null, "", to);
    setPath(to.split("?")[0]);
    if (!opts?.replace) window.scrollTo(0, 0);
  };

  return <Ctx.Provider value={{ path, navigate }}>{children}</Ctx.Provider>;
}

export const useRouter = () => useContext(Ctx);

export function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export interface Route {
  name:
    | "home"
    | "browse"
    | "detail"
    | "legacy-detail"
    | "submit"
    | "mine"
    | "saved"
    | "eatnow"
    | "articles"
    | "article"
    | "notfound";
  params: Record<string, string>;
}

// URL resep: /resep/{slug} (baru, berbasis nama resep, satu segmen).
// URL lama /resep/{source}/{id} (mis. link yang sudah tersebar) tetap dikenali
// sebagai "legacy-detail" supaya bisa di-redirect ke slug baru, bukan 404.
export function parseRoute(path: string): Route {
  // Home (Tahap 5) di "/". Browse resep pindah ke "/resep" (URL detail /resep/{slug} tak berubah).
  if (!path || path === "/") return { name: "home", params: {} };
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "resep" && parts.length === 1) return { name: "browse", params: {} };
  if (parts[0] === "resep" && parts.length === 2) {
    return { name: "detail", params: { slug: decodeURIComponent(parts[1]) } };
  }
  if (parts[0] === "resep" && parts.length >= 3) {
    return { name: "legacy-detail", params: { source: parts[1], id: decodeURIComponent(parts.slice(2).join("/")) } };
  }
  if (parts[0] === "artikel" && parts.length === 1) return { name: "articles", params: {} };
  if (parts[0] === "artikel" && parts.length >= 2) {
    return { name: "article", params: { slug: decodeURIComponent(parts.slice(1).join("/")) } };
  }
  if (parts[0] === "submit") return { name: "submit", params: {} };
  if (parts[0] === "submission-saya") return { name: "mine", params: {} };
  if (parts[0] === "tersimpan") return { name: "saved", params: {} };
  if (parts[0] === "eat-now") return { name: "eatnow", params: {} };
  return { name: "notfound", params: {} };
}

export function articleHref(slug: string): string {
  return `/artikel/${encodeURIComponent(slug)}`;
}

export function recipeHref(slug: string): string {
  return `/resep/${encodeURIComponent(slug)}`;
}
