const KEY = "eyelens_recently_viewed";
const MAX = 6;

/** @param {string} productId */
export function pushRecentlyViewed(productId) {
  if (!productId || typeof window === "undefined") return;
  const id = String(productId);
  try {
    const raw = window.localStorage.getItem(KEY);
    const prev = raw ? JSON.parse(raw) : [];
    const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getRecentlyViewedIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}
