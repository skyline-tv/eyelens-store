export function formatInr(n) {
  if (n == null || Number.isNaN(Number(n))) return "₹0";
  return `₹${Math.round(Number(n)).toLocaleString("en-IN")}`;
}

/** Normalize API product for storefront cards & PDP */
export function mapApiProduct(p) {
  const id = p._id || p.id;
  const rawPrice =
    typeof p.price === "number" && !Number.isNaN(p.price)
      ? p.price
      : Number(String(p.price ?? "").replace(/[^\d.]/g, "")) || 0;
  const rawOrigRaw =
    p.origPrice != null && p.origPrice !== ""
      ? typeof p.origPrice === "number"
        ? p.origPrice
        : Number(String(p.origPrice).replace(/[^\d.]/g, ""))
      : NaN;
  const rawOrig = Number.isFinite(rawOrigRaw) ? rawOrigRaw : null;
  /** MRP (origPrice) shown struck-through only when above selling price */
  const showMrp = rawOrig != null && rawOrig > rawPrice;

  return {
    id,
    _id: id,
    brand: p.brand,
    name: p.name,
    price: formatInr(rawPrice),
    origPrice: showMrp ? formatInr(rawOrig) : undefined,
    emoji: p.emoji || "👓",
    bg: p.bg || "linear-gradient(135deg,#F7F8F6,#EEF4F1)",
    badge: p.badge || "",
    outOfStock: Boolean(p.outOfStock) || (typeof p.stock === "number" && p.stock <= 0),
    category: p.category || "",
    frameType: p.frameType || "",
    material: p.material || "",
    gender: p.gender || "unisex",
    stock: typeof p.stock === "number" ? p.stock : 0,
    description: p.description || "",
    images: Array.isArray(p.images) ? p.images : [],
    imageUrl: Array.isArray(p.images) && p.images[0] ? p.images[0] : undefined,
    rawPrice,
    rawOrigPrice: showMrp ? rawOrig : undefined,
    averageRating: typeof p.averageRating === "number" ? p.averageRating : Number(p.rating) || 0,
    reviewCount: typeof p.reviewCount === "number" ? p.reviewCount : 0,
  };
}
