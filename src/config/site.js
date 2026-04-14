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
