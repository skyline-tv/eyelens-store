/** MongoDB ObjectId: 24 hex chars */
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

/**
 * URL-safe slug from product name (for SEO-friendly /product/{slug}-{id} URLs).
 */
export function slugify(text, maxLen = 56) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
}

/**
 * Extract product id from route param — supports plain ObjectId or `{slug}-{objectId}`.
 */
export function parseProductRouteParam(param) {
  if (param == null || param === "") return "";
  const s = String(param).trim();
  if (OBJECT_ID_RE.test(s)) return s;
  const parts = s.split("-");
  const last = parts[parts.length - 1] || "";
  if (OBJECT_ID_RE.test(last)) return last;
  return s;
}

/**
 * Preferred public path for a product (slug + id). Falls back to id-only when name is missing.
 */
export function buildProductPath(id, name) {
  const pid = String(id || "").trim();
  if (!pid) return "/plp";
  const slug = slugify(name);
  if (slug) return `/product/${slug}-${pid}`;
  return `/product/${pid}`;
}
