export function formatInr(n) {
  if (n == null || Number.isNaN(Number(n))) return "₹0";
  return `₹${Math.round(Number(n)).toLocaleString("en-IN")}`;
}

/** Same rule as PDP: first in-stock variant, else first listed (handles null stock as “unknown”). */
function pickDefaultVariantColor(colors) {
  if (!Array.isArray(colors) || !colors.length) return null;
  return colors.find((c) => !Number.isFinite(Number(c.stock)) || Number(c.stock) > 0) || colors[0];
}

/** Normalize API product for storefront cards & PDP */
export function mapApiProduct(p) {
  const productId = p._id || p.id;
  const id = p.listingId || productId;
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

  const colors = Array.isArray(p.colors)
    ? p.colors
        .map((c) => {
          if (!c) return null;
          if (typeof c === "string") {
            const name = c.trim();
            return name ? { name, hex: "", images: [] } : null;
          }
          const name = String(c.name || "").trim();
          if (!name) return null;
          return {
            name,
            hex: String(c.hex || "").trim(),
            stock:
              c.stock === "" || c.stock == null || Number.isNaN(Number(c.stock))
                ? null
                : Math.max(0, Math.floor(Number(c.stock))),
            images: Array.isArray(c.images) ? c.images.filter(Boolean) : [],
          };
        })
        .filter(Boolean)
    : [];

  const defaultVariant = pickDefaultVariantColor(colors);
  const variantLeadImage =
    defaultVariant?.images?.[0] && String(defaultVariant.images[0]).trim()
      ? defaultVariant.images[0]
      : undefined;
  const productLeadImage = Array.isArray(p.images) && p.images[0] ? p.images[0] : undefined;

  return {
    id,
    _id: productId,
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
    frameSize: p.frameSize || "",
    material: p.material || "",
    gender: p.gender || "unisex",
    stock: typeof p.stock === "number" ? p.stock : 0,
    description: p.description || "",
    productHighlights: p.productHighlights || "",
    modelNumber: p.modelNumber || "",
    images: Array.isArray(p.images) ? p.images : [],
    colors,
    warranty: p.warranty || "",
    deliveryPrimary: p.deliveryPrimary || "Free delivery by Saturday",
    deliverySecondary: p.deliverySecondary || "Order before 6 PM today",
    imageUrl: variantLeadImage || productLeadImage || undefined,
    rawPrice,
    rawOrigPrice: showMrp ? rawOrig : undefined,
    averageRating: typeof p.averageRating === "number" ? p.averageRating : Number(p.rating) || 0,
    reviewCount: typeof p.reviewCount === "number" ? p.reviewCount : 0,
  };
}
