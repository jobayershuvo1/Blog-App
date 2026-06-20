import "server-only";
import { getSettings } from "@/models/SiteSettings";
import { connectDB } from "@/lib/db";

export interface AdsenseConfig {
  enabled: boolean;
  publisherId: string;
  autoAds: boolean;
  paragraphsPerAd: number;
  slots: {
    header?: string;
    sidebar?: string;
    footer?: string;
    inArticle?: string;
    stickyMobile?: string;
  };
}

const EMPTY: AdsenseConfig = {
  enabled: false,
  publisherId: "",
  autoAds: false,
  paragraphsPerAd: 3,
  slots: {},
};

/** Read AdSense config from site settings (server only). */
export async function getAdsense(): Promise<AdsenseConfig> {
  try {
    await connectDB();
    const s = await getSettings();
    const a = (s as { adsense?: Partial<AdsenseConfig> }).adsense;
    if (!a) return EMPTY;
    return {
      enabled: Boolean(a.enabled && a.publisherId),
      publisherId: a.publisherId || "",
      autoAds: Boolean(a.autoAds),
      paragraphsPerAd: a.paragraphsPerAd || 3,
      slots: a.slots || {},
    };
  } catch {
    return EMPTY;
  }
}

/**
 * Insert an in-article ad `<ins>` after every Nth closing </p> in post HTML.
 * A client pusher then activates each one.
 */
export function injectInArticleAds(html: string, cfg: AdsenseConfig): string {
  if (!cfg.enabled || !cfg.slots.inArticle || !html) return html;
  const ad = `<ins class="adsbygoogle blog-inarticle-ad" style="display:block;text-align:center;margin:24px 0" data-ad-layout="in-article" data-ad-format="fluid" data-ad-client="${cfg.publisherId}" data-ad-slot="${cfg.slots.inArticle}"></ins>`;
  let count = 0;
  return html.replace(/<\/p>/gi, (m) => {
    count += 1;
    return count % cfg.paragraphsPerAd === 0 ? `${m}${ad}` : m;
  });
}
