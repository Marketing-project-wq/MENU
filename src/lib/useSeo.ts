import { useEffect } from "react";

// SEO per-halaman untuk SPA. recipe.20fit.id itu client-rendered: Googlebot menjalankan JS,
// jadi judul + meta description + JSON-LD yang di-set di sini KEBACA Google (search & ranking).
// Catatan jujur: preview link di WhatsApp/Facebook butuh SSR/prerender (crawler sosmed tak
// menjalankan JS) — itu langkah terpisah yang lebih besar.
//
// Semua tag yang kita suntik ditandai data-seo="1" supaya gampang dibersihkan saat pindah halaman.

export interface SeoInput {
  title: string; // judul halaman (suffix "— 20FIT" ditambah otomatis)
  description?: string; // meta description
  canonicalPath?: string; // path saja, mis. "/artikel/slug"; origin ditambah runtime
  image?: string; // og:image (URL absolut)
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  author?: string | null;
  section?: string | null; // article:section (kategori)
  jsonLd?: Record<string, unknown> | null; // structured data
  noIndex?: boolean;
}

const SITE_NAME = "20FIT";
const TITLE_SUFFIX = " — 20FIT";
const SEO_MARK = "data-seo";

function makeMeta(attr: "name" | "property", key: string, content: string): HTMLMetaElement {
  const el = document.createElement("meta");
  el.setAttribute(attr, key);
  el.setAttribute("content", content);
  el.setAttribute(SEO_MARK, "1");
  return el;
}

export function useSeo(input: SeoInput): void {
  // Re-run saat isi berubah (bukan identitas objek).
  const dep = JSON.stringify(input);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = input.canonicalPath
      ? origin + input.canonicalPath
      : typeof window !== "undefined"
        ? window.location.href.split("#")[0]
        : "";
    const fullTitle = input.title.includes(SITE_NAME) ? input.title : input.title + TITLE_SUFFIX;

    const prevTitle = document.title;
    document.title = fullTitle;

    // Bersihkan tag SEO milik render sebelumnya, lalu bangun ulang.
    document.head.querySelectorAll(`[${SEO_MARK}="1"]`).forEach((n) => n.remove());

    const frag = document.createDocumentFragment();
    const type = input.type ?? "website";

    if (input.description) frag.appendChild(makeMeta("name", "description", input.description));
    frag.appendChild(makeMeta("name", "robots", input.noIndex ? "noindex,nofollow" : "index,follow"));

    if (url) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", url);
      link.setAttribute(SEO_MARK, "1");
      frag.appendChild(link);
    }

    // Open Graph
    frag.appendChild(makeMeta("property", "og:site_name", SITE_NAME));
    frag.appendChild(makeMeta("property", "og:title", fullTitle));
    if (input.description) frag.appendChild(makeMeta("property", "og:description", input.description));
    frag.appendChild(makeMeta("property", "og:type", type));
    if (url) frag.appendChild(makeMeta("property", "og:url", url));
    if (input.image) frag.appendChild(makeMeta("property", "og:image", input.image));

    // Twitter Card
    frag.appendChild(makeMeta("name", "twitter:card", input.image ? "summary_large_image" : "summary"));
    frag.appendChild(makeMeta("name", "twitter:title", fullTitle));
    if (input.description) frag.appendChild(makeMeta("name", "twitter:description", input.description));
    if (input.image) frag.appendChild(makeMeta("name", "twitter:image", input.image));

    if (type === "article") {
      if (input.publishedTime) frag.appendChild(makeMeta("property", "article:published_time", input.publishedTime));
      if (input.modifiedTime) frag.appendChild(makeMeta("property", "article:modified_time", input.modifiedTime));
      if (input.author) frag.appendChild(makeMeta("property", "article:author", input.author));
      if (input.section) frag.appendChild(makeMeta("property", "article:section", input.section));
    }

    if (input.jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute(SEO_MARK, "1");
      script.text = JSON.stringify(input.jsonLd);
      frag.appendChild(script);
    }

    document.head.appendChild(frag);

    return () => {
      document.title = prevTitle;
      document.head.querySelectorAll(`[${SEO_MARK}="1"]`).forEach((n) => n.remove());
    };
  }, [dep]);
}
