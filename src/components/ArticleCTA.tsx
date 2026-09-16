import { useLang } from "../lib/store";
import { MY20FIT } from "../lib/constants";
import { Icon } from "./Icon";

// CTA "ke web" yang muncul di SETIAP artikel (dipasang di ArticleDetailPage).
// Arahkan ke my.20fit.id (akun/booking) + UTM supaya traffic dari artikel kelacak di GA.
const CTA_URL = `${MY20FIT}/?utm_source=recipe.20fit.id&utm_medium=article_cta&utm_campaign=artikel`;

export function ArticleCTA() {
  const { t } = useLang();
  return (
    <section className="mt-8 rounded-2xl border border-brand-red/20 bg-brand-red/[0.06] p-5 text-center sm:p-6">
      <h2 className="text-lg font-extrabold tracking-tight text-fg sm:text-xl">{t("articleCtaTitle")}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-fg/60">{t("articleCtaText")}</p>
      <a
        href={CTA_URL}
        target="_blank"
        rel="noopener"
        className="btn-primary mt-4 inline-flex items-center gap-2 px-6 py-2.5"
      >
        {t("articleCtaButton")}
        <Icon name="arrowRight" size={16} />
      </a>
    </section>
  );
}
