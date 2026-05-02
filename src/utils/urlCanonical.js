/**
 * Stable canonical path for listing/search URLs (drops default sort=newest to reduce duplicates).
 * @param {string} pathname
 * @param {URLSearchParams} searchParams
 */
export function buildListingCanonicalPath(pathname, searchParams) {
  const pairs = [];
  for (const [k, v] of searchParams.entries()) {
    if (v == null || v === "") continue;
    if (k === "sort" && v === "newest") continue;
    pairs.push([k, v]);
  }
  pairs.sort((a, b) => a[0].localeCompare(b[0]));
  const q = new URLSearchParams(pairs).toString();
  return `${pathname}${q ? `?${q}` : ""}`;
}
