/**
 * Stable key for cart dedupe: same product + lens + prescription + frame options.
 */
export function cartLineKey(item) {
  if (!item?.productId) return "";
  const lid = item.lens?.id ?? "";
  const rx = item.prescription
    ? `${item.prescription.mode}|${item.prescription.patientName || ""}|${item.prescription.odSphere || ""}|${item.prescription.osSphere || ""}`
    : "";
  const fo = item.frameOptions
    ? `${item.frameOptions.color || ""}|${item.frameOptions.size || ""}`
    : "";
  return `${item.productId}|${lid}|${rx}|${fo}`;
}

/** Merge lines with the same key by summing qty (keeps first line id and pricing fields). */
export function mergeCartLines(items) {
  if (!Array.isArray(items) || items.length < 2) return items;
  const map = new Map();
  for (const it of items) {
    const k = cartLineKey(it);
    if (!k) {
      map.set(`${Math.random()}`, { ...it });
      continue;
    }
    const prev = map.get(k);
    if (prev) {
      prev.qty = (prev.qty || 1) + (it.qty || 1);
    } else {
      map.set(k, { ...it, qty: it.qty || 1 });
    }
  }
  return Array.from(map.values());
}
