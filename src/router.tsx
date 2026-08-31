import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface RouterCtx {
  path: string;
  navigate: (to: string) => void;
}

const Ctx = createContext<RouterCtx>({ path: "/", navigate: () => {} });

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => window.location.pathname || "/");

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (to: string) => {
    if (to === window.location.pathname + window.location.search) return;
    window.history.pushState(null, "", to);
    setPath(to.split("?")[0]);
    window.scrollTo(0, 0);
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
  name: "browse" | "detail" | "submit" | "mine" | "saved" | "notfound";
  params: Record<string, string>;
}

export function parseRoute(path: string): Route {
  if (!path || path === "/") return { name: "browse", params: {} };
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "resep" && parts.length >= 3) {
    return { name: "detail", params: { source: parts[1], id: decodeURIComponent(parts.slice(2).join("/")) } };
  }
  if (parts[0] === "submit") return { name: "submit", params: {} };
  if (parts[0] === "submission-saya") return { name: "mine", params: {} };
  if (parts[0] === "tersimpan") return { name: "saved", params: {} };
  return { name: "notfound", params: {} };
}

export function recipeHref(source: string, id: string): string {
  return `/resep/${source}/${encodeURIComponent(id)}`;
}
