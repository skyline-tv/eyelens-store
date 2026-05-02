/**
 * Public site URL for canonicals, OG URLs, and sitemap generation.
 * Set `VITE_SITE_URL` in `.env` (e.g. https://www.yourdomain.com) for production.
 */
export function getSiteOrigin() {
  const fromEnv = typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim().replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

export function absoluteUrl(path = "/") {
  const base = getSiteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export const SITE_NAME = "Eyelens";
export const DEFAULT_OG_IMAGE_PATH = "/LOGO.svg";

/** Optional @handle (no @) for twitter:site — set VITE_TWITTER_SITE in .env for production. */
export function getTwitterSite() {
  const h = typeof import.meta !== "undefined" && import.meta.env?.VITE_TWITTER_SITE;
  if (h && String(h).trim()) return String(h).trim().replace(/^@/, "");
  return "";
}

/**
 * Profile URLs for Organization JSON-LD `sameAs` — strengthens branded entity signals for Google.
 * `VITE_SITE_SAME_AS=https://www.instagram.com/yourbrand,https://...`
 */
export function getBrandSameAsUrls() {
  const raw = typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_SAME_AS;
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,]+/)
    .map((s) => s.trim())
    .filter((u) => /^https?:\/\//i.test(u));
}
