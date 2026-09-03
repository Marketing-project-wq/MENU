import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "../router";
import { useLang, useRecipes } from "../lib/store";
import { api } from "../lib/api";
import { renderMarkdown } from "../lib/markdown";
import { normalizeMember, normalizeOfficial, pickBi } from "../lib/normalize";
import { CoverImage } from "../components/CoverImage";
import { RecipeCard } from "../components/RecipeCard";
import { Spinner } from "../components/Spinner";
import type { ArticleFull, ArticleRecipeRef, RecipeVM } from "../lib/types";

type State = "loading" | "notfound" | { article: ArticleFull; recipes: ArticleRecipeRef[] };

export function ArticleDetailPage({ slug }: { slug: string }) {
  const { t, lang } = useLang();
  const { official, members } = useRecipes();
  const [state, setState] = useState<State>("loading");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setState("loading");
    api.article(slug).then((d) => {
      if (alive) setState(d ?? "notfound");
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  // Resep terkait -> VM dari katalog/published yang sudah dimuat. (Hook harus sebelum early return.)
  const relatedVMs: RecipeVM[] = useMemo(() => {
    if (typeof state === "string") return [];
    const offById = new Map(official.map((r) => [r.id, r]));
    const memById = new Map(members.map((m) => [m.id, m]));
    const out: RecipeVM[] = [];
    for (const ref of state.recipes) {
      if (ref.source === "official") {
        const o = offById.get(ref.menu_id);
        if (o) out.push(normalizeOfficial(o, lang));
      } else {
        const m = memById.get(ref.menu_id);
        if (m) out.push(normalizeMember(m, lang));
      }
    }
    return out;
  }, [state, official, members, lang]);

  // Jaring pengaman foto DALAM body: kalau gambar stok gagal muat, sembunyikan (bukan ikon rusak).
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const imgs = Array.from(el.querySelectorAll("img"));
    const onErr = (e: Event) => {
      const img = e.currentTarget as HTMLImageElement;
      img.style.display = "none";
    };
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth === 0) img.style.display = "none";
      else img.addEventListener("error", onErr, { once: true });
    });
    return () => imgs.forEach((img) => img.removeEventListener("error", onErr));
  }, [state]);

  if (state === "loading") return <Spinner label={t("loading")} />;
  if (state === "notfound") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-sm text-fg/60">404 — {t("notFound")}</p>
        <Link to="/artikel" className="mt-3 inline-block text-sm font-semibold text-brand-red">
          {t("backToArticles")}
        </Link>
      </div>
    );
  }

  const a = state.article;
  const title = pickBi(a.title, lang);
  const category = pickBi(a.category, lang);
  const html = renderMarkdown(pickBi(a.body_md, lang));

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Link to="/artikel" className="text-sm font-semibold text-fg/50 hover:text-brand-red">
        {t("backToArticles")}
      </Link>
      <div className="mt-3 overflow-hidden app-card">
        <CoverImage src={a.cover_url} alt={title} className="h-56 w-full sm:h-72" priority />
        <div className="p-5 sm:p-6">
          {category && <span className="chip bg-fg/5 text-fg/60">{category}</span>}
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-fg">{title}</h1>
          {a.author_name && (
            <p className="mt-1 text-xs text-fg/45">
              {t("articleBy")} {a.author_name}
            </p>
          )}
          {/* body_md dirender lewat renderMarkdown yang meng-escape HTML dulu (aman). */}
          <div ref={bodyRef} className="mt-4 text-sm" dangerouslySetInnerHTML={{ __html: html }} />

          {relatedVMs.length > 0 && (
            <section className="mt-8 border-t border-fg/10 pt-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fg/70">
                {t("articleRelatedRecipes")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {relatedVMs.map((r) => (
                  <RecipeCard key={r.key} r={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
