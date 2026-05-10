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
  const anyObjectId = s.match(/[a-f\d]{24}/i);
  if (anyObjectId?.[0] && OBJECT_ID_RE.test(anyObjectId[0])) return anyObjectId[0];
  const parts = s.split("-");
  const last = parts[parts.length - 1] || "";
  if (OBJECT_ID_RE.test(last)) return last;
  return "";
}

/**
 * Preferred public path for a product (slug + id). Falls back to id-only when name is missing.
 */
export function buildProductPath(id, name) {
  const pid = parseProductRouteParam(id);
  if (!pid) return "/plp";
  const slug = slugify(name);
  if (slug) return `/product/${slug}-${pid}`;
  return `/product/${pid}`;
}

/** Opens PDP on a specific colour swatch when `colorName` matches `colors[].name` (listing rows from expandProductsByColor). */
export function buildProductPathWithColor(id, name, colorName) {
  const base = buildProductPath(id, name);
  const c = String(colorName || "").trim();
  if (base === "/plp" || !c) return base;
  return `${base}?color=${encodeURIComponent(c)}`;
}
