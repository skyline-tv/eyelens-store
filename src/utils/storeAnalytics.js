import { api } from "../api/axiosInstance";

const VID_KEY = "eyelens_vid";

export function getVisitorId() {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(VID_KEY);
    if (!id && typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      id = crypto.randomUUID();
      window.localStorage.setItem(VID_KEY, id);
    }
    return id || "";
  } catch {
    return "";
  }
}

/** Fire-and-forget storefront funnel event (cart_view, checkout_start). */
export function trackStoreEvent(event) {
  const visitorId = getVisitorId();
  if (!visitorId) return;
  void api.post("/stats/track-event", { event, visitorId }).catch(() => {});
}
