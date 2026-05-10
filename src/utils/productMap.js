export function formatInr(n) {
  if (n == null || Number.isNaN(Number(n))) return "₹0";
  return `₹${Math.round(Number(n)).toLocaleString("en-IN")}`;
}

/** Same rule as PDP: first in-stock variant, else first listed (handles null stock as “unknown”). */
function pickDefaultVariantColor(colors) {
  if (!Array.isArray(colors) || !colors.length) return null;
  return colors.find((c) => !Number.isFinite(Number(c.stock)) || Number(c.stock) > 0) || colors[0];
}

/** Card thumbnail from variant photos: default variant row first, else first colour row that has an image URL. */
function pickColourThumbnailUrl(colors, defaultVariant) {
  const trimmed = (u) => (typeof u === "string" ? u.trim() : "");
  const fromVariant = trimmed(defaultVariant?.images?.[0]);
  if (fromVariant) return fromVariant;
  const row = colors.find((c) => trimmed(c.images?.[0]));
  return trimmed(row?.images?.[0]) || null;
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
  const productLeadImage =
    colors.length === 0 && Array.isArray(p.images) && p.images[0] ? String(p.images[0]).trim() : undefined;
  const colourThumb = colors.length > 0 ? pickColourThumbnailUrl(colors, defaultVariant) : null;

  const variantColorRaw = p.variantColor?.name != null ? String(p.variantColor.name).trim() : "";
  let imageUrl;
  if (colors.length > 0) {
    if (variantColorRaw) {
      const match = colors.find(
        (c) => String(c.name || "").trim().toLowerCase() === variantColorRaw.toLowerCase()
      );
      const fromPalette = match?.images?.[0] ? String(match.images[0]).trim() : "";
      imageUrl = fromPalette || colourThumb || undefined;
    } else {
      imageUrl = colourThumb || undefined;
    }
  } else {
    imageUrl = productLeadImage || undefined;
  }

  const variantColor =
    variantColorRaw && p.variantColor
      ? {
          name: variantColorRaw,
          hex: String(p.variantColor.hex || "").trim(),
        }
      : undefined;

  return {
    id,
    _id: productId,
    listingId: p.listingId != null && String(p.listingId).trim() ? String(p.listingId).trim() : undefined,
    variantOf: p.variantOf != null && String(p.variantOf).trim() ? String(p.variantOf).trim() : undefined,
    variantColor,
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
    images: colors.length > 0 ? [] : Array.isArray(p.images) ? p.images : [],
    colors,
    warranty: p.warranty || "",
    deliveryPrimary: p.deliveryPrimary || "Free delivery by Saturday",
    deliverySecondary: p.deliverySecondary || "Order before 6 PM today",
    imageUrl,
    rawPrice,
    rawOrigPrice: showMrp ? rawOrig : undefined,
    averageRating: typeof p.averageRating === "number" ? p.averageRating : Number(p.rating) || 0,
    reviewCount: typeof p.reviewCount === "number" ? p.reviewCount : 0,
  };
}

/** Cart / bag thumbnail: colours[].images only. Optional `colorName` = chosen swatch from frameOptions. */
export function imageUrlForFrameColor(frame, colorName) {
  const cn = colorName != null ? String(colorName).trim() : "";
  const list = Array.isArray(frame?.colors) ? frame.colors : [];
  if (list.length && cn) {
    const row = list.find((c) => String(c.name || "").trim().toLowerCase() === cn.toLowerCase());
    const u = row?.images?.[0];
    if (u) return String(u).trim();
  }
  return frame?.imageUrl ? String(frame.imageUrl).trim() : "";
}
