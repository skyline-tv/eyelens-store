import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../auth/auth";
import { api } from "../api/axiosInstance";
import { setPageSeo } from "../utils/seo";

export default function CartPage({
  setPage,
  items,
  setItems,
  showToast,
  appliedCoupon = { code: "", discountAmount: 0 },
  setAppliedCoupon,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const restore = setPageSeo({
      title: "Your cart | Eyelens shopping bag",
      description:
        "Review frames and lenses in your Eyelens bag, apply coupons, and continue to secure checkout when you are ready.",
      canonicalPath: "/cart",
      noindex: true,
    });
    return () => restore();
  }, []);

  const [coupon, setCoupon] = useState("");
  const [couponErr, setCouponErr] = useState("");
  const [suggestedCoupons, setSuggestedCoupons] = useState([]);
  const [removeTarget, setRemoveTarget] = useState(null);
  const validatedRef = useRef(false);
  const safeItems = useMemo(() => items || [], [items]);
  /** Cart lines that still need a product image (stable key for hydration effect). */
  const cartLinesNeedingImageKey = useMemo(
    () =>
      safeItems
        .filter((i) => i.productId && !i.imageUrl && /^[a-f\d]{24}$/i.test(String(i.productId)))
        .map((i) => `${i.id}:${i.productId}`)
        .sort()
        .join("|"),
    [safeItems]
  );
  const framesSubtotal = safeItems.reduce((a, i) => a + (i.framePrice || 0) * (i.qty || 1), 0);
  const lensesSubtotal = safeItems.reduce((a, i) => a + ((i.lens?.price || 0) * (i.qty || 1)), 0);
  const subtotal = framesSubtotal + lensesSubtotal;
  const disc = Math.max(0, Number(appliedCoupon?.discountAmount) || 0);
  const shipping = subtotal > 999 ? 0 : 99;
  const taxable = Math.max(0, subtotal + shipping - disc);
  const gst = Math.round(taxable * 0.18 * 100) / 100;
  const total = Math.round((taxable + gst) * 100) / 100;
  const updateQty = (id, delta) =>
    setItems(safeItems.map((i) => (i.id === id ? { ...i, qty: Math.max(1, (i.qty || 1) + delta) } : i)));
  const remove = (id) => setItems(safeItems.filter((i) => i.id !== id));

  useEffect(() => {
    if (validatedRef.current) return;
    if (!safeItems.length) {
      validatedRef.current = true;
      return;
    }
    let cancelled = false;
    (async () => {
      const checks = await Promise.all(
        safeItems.map(async (i) => {
          const pid = String(i.productId || "");
          if (!/^[a-f\d]{24}$/i.test(pid)) return { id: i.id, ok: false };
          try {
            await api.get(`/products/${pid}`);
            return { id: i.id, ok: true };
          } catch {
            return { id: i.id, ok: false };
          }
        })
      );
      if (cancelled) return;
      const validIds = new Set(checks.filter((c) => c.ok).map((c) => c.id));
      if (validIds.size !== safeItems.length) {
        setItems(safeItems.filter((i) => validIds.has(i.id)));
        showToast?.({ msg: "Some items were removed because they are no longer available", type: "info" });
      }
      validatedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [safeItems, setItems, showToast]);

  /** Hydrate cart lines saved before imageUrl was stored (fetch first product image). */
  useEffect(() => {
    if (!cartLinesNeedingImageKey) return undefined;
    const targets = safeItems.filter(
      (i) => i.productId && !i.imageUrl && /^[a-f\d]{24}$/i.test(String(i.productId))
    );
    if (!targets.length) return undefined;
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        targets.map(async (i) => {
          try {
            const { data } = await api.get(`/products/${i.productId}`);
            const p = data?.data;
            const url = Array.isArray(p?.images) && p.images[0] ? p.images[0] : "";
            const sell = Number(p?.price);
            const mrp = Number(p?.origPrice);
            const frameMrp =
              Number.isFinite(sell) && Number.isFinite(mrp) && mrp > sell ? mrp : undefined;
            return { id: i.id, imageUrl: url, bg: p?.bg, frameMrp };
          } catch {
            return { id: i.id, imageUrl: "", bg: undefined };
          }
        })
      );
      if (cancelled) return;
      setItems((prev) =>
        (prev || []).map((row) => {
          const hit = pairs.find((x) => x.id === row.id);
          if (!hit) return row;
          const next = { ...row };
          if (hit.imageUrl) next.imageUrl = hit.imageUrl;
          if (hit.bg && !next.bg) next.bg = hit.bg;
          if ("frameMrp" in hit) {
            if (hit.frameMrp != null) next.frameMrp = hit.frameMrp;
            else delete next.frameMrp;
          }
          return next;
        })
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [cartLinesNeedingImageKey, safeItems, setItems]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/coupons/public");
        if (cancelled) return;
        setSuggestedCoupons((data?.data || []).map((c) => c.code).filter(Boolean));
      } catch {
        if (!cancelled) setSuggestedCoupons([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyCouponClick = async () => {
    setCouponErr("");
    if (!coupon.trim()) return;
    if (!isAuthenticated()) {
      showToast?.({ msg: "Please sign in to apply coupons.", type: "info" });
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    try {
      const { data } = await api.post("/coupons/apply", { code: coupon.trim(), subtotal: Number(subtotal) });
      if (!data?.success) throw new Error(data?.message || "Invalid coupon");
      setAppliedCoupon?.({
        code: data.data.code,
        discountAmount: data.data.discountAmount,
      });
      showToast?.({ msg: "Coupon applied!", type: "success" });
    } catch (e) {
      const msg = e.response?.data?.message || e.message || "Could not apply coupon.";
      setCouponErr(msg);
      showToast?.({ msg, type: "error" });
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon?.({ code: "", discountAmount: 0 });
    setCoupon("");
    setCouponErr("");
  };
  return (
    <div className="page-enter" style={{ paddingTop: 64, background: "var(--g50)", minHeight: "100vh" }}>
      <div className="container">
        <div style={{ paddingTop: 32, marginBottom: 8 }}>
          <h1 style={{ fontFamily: "var(--font-d)", fontSize: 32, fontWeight: 800, color: "var(--black)" }}>
            Shopping Bag
          </h1>
          <p style={{ fontSize: 14, color: "var(--g500)", marginTop: 4 }}>{safeItems.length} items in your bag</p>
        </div>
        <div className="cart-layout">
          <div>
            {safeItems.length === 0 && (
              <div style={{ background: "var(--white)", borderRadius: 16, border: "1px solid var(--g100)", padding: 28, textAlign: "center" }}>
                <div style={{ width:80, height:80, borderRadius:"50%", background:"var(--em-pale)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 16px" }}>🛍️</div>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 800, color: "var(--black)", marginBottom: 6 }}>Your bag is empty</div>
                <div style={{ color: "var(--g500)", fontSize: 13, marginBottom: 16 }}>Pick a frame, then choose lenses.</div>
                <button className="btn btn-primary" onClick={() => setPage("plp")}>Shop frames</button>
              </div>
            )}
            {safeItems.map((item) => (
              <div key={item.id} className="cart-item" style={{ background: "var(--white)" }}>
                <div
                  className="cart-item-img"
                  role="img"
                  aria-label={`${item.name || "Product"} by ${item.brand || "Eyelens"}`}
                  style={
                    item.imageUrl
                      ? undefined
                      : item.bg
                        ? { background: item.bg }
                        : undefined
                  }
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" />
                  ) : (
                    <span aria-hidden>{item.emoji || "👓"}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: ".07em",
                      textTransform: "uppercase",
                      color: "var(--g400)",
                      marginBottom: 4,
                    }}
                  >
                    {item.brand}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--black)", marginBottom: 12 }}>
                    {item.name}
                  </div>
                  {item.lens && (
                    <div style={{ fontSize: 12, color: "var(--g500)", marginBottom: 10 }}>
                      Lenses: <strong style={{ color: "var(--black)" }}>{item.lens.name}</strong> ({item.lens.price === 0 ? "Free" : `+₹${item.lens.price}`})
                    </div>
                  )}
                  {item.prescription?.mode === "saved" && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: "var(--g500)", marginBottom: 8 }}>
                        Prescription:{" "}
                        <strong style={{ color: "var(--black)" }}>
                          {item.prescription.patientName || "Selected"} — {item.prescription.date}
                        </strong>
                      </div>
                      <div style={{ border: "1px solid var(--g200)", borderRadius: 10, overflow: "hidden", background: "var(--g50)", display: "inline-block" }}>
                        <table style={{ borderCollapse: "collapse", minWidth: 280 }}>
                          <thead>
                            <tr>
                              <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 800, color: "var(--g500)", textTransform: "uppercase" }}></th>
                              <th style={{ padding: "8px 12px", fontSize: 10, fontWeight: 800, color: "var(--g500)", textTransform: "uppercase" }}>Sphere</th>
                              <th style={{ padding: "8px 12px", fontSize: 10, fontWeight: 800, color: "var(--g500)", textTransform: "uppercase" }}>Cylinder</th>
                              <th style={{ padding: "8px 12px", fontSize: 10, fontWeight: 800, color: "var(--g500)", textTransform: "uppercase" }}>Axis</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: "8px 12px", fontWeight: 700, color: "var(--black)" }}>OD (R)</td>
                              <td style={{ padding: "8px 12px", fontSize: 13 }}>{item.prescription.odSphere || "—"}</td>
                              <td style={{ padding: "8px 12px", fontSize: 13 }}>{item.prescription.odCylinder || "—"}</td>
                              <td style={{ padding: "8px 12px", fontSize: 13 }}>{item.prescription.odAxis || "—"}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "8px 12px", fontWeight: 700, color: "var(--black)" }}>OS (L)</td>
                              <td style={{ padding: "8px 12px", fontSize: 13 }}>{item.prescription.osSphere || "—"}</td>
                              <td style={{ padding: "8px 12px", fontSize: 13 }}>{item.prescription.osCylinder || "—"}</td>
                              <td style={{ padding: "8px 12px", fontSize: 13 }}>{item.prescription.osAxis || "—"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {((item.prescription.add && item.prescription.add.trim()) || (item.prescription.pd && item.prescription.pd.trim())) && (
                        <div style={{ fontSize: 12, color: "var(--g600)", marginTop: 8 }}>
                          {item.prescription.add?.trim() && <span>Add: {item.prescription.add}</span>}
                          {item.prescription.add?.trim() && item.prescription.pd?.trim() && " · "}
                          {item.prescription.pd?.trim() && <span>PD: {item.prescription.pd} mm</span>}
                        </div>
                      )}
                      {item.prescription.notes?.trim() && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "var(--g600)" }}>
                          {item.prescription.notes}
                        </div>
                      )}
                    </div>
                  )}
                  {item.prescription?.mode === "none" && (
                    <div style={{ fontSize: 12, color: "var(--g500)", marginBottom: 10 }}>
                      Prescription: <strong style={{ color: "var(--black)" }}>Not selected</strong>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="qty-ctrl">
                      <button type="button" className="qty-btn" aria-label="Decrease quantity" onClick={() => updateQty(item.id, -1)}>
                        −
                      </button>
                      <span className="qty-num">{item.qty}</span>
                      <button type="button" className="qty-btn" aria-label="Increase quantity" onClick={() => updateQty(item.id, 1)}>
                        +
                      </button>
                    </div>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setRemoveTarget(item)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-n)",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {item.frameMrp != null && item.frameMrp > (item.framePrice || 0) ? (
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--g400)",
                        textDecoration: "line-through",
                        marginBottom: 2,
                      }}
                      title="Maximum retail price (frame)"
                    >
                      MRP ₹{(item.frameMrp * (item.qty || 1)).toLocaleString("en-IN")}
                    </div>
                  ) : null}
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--black)" }}>
                    ₹{(((item.framePrice || 0) + (item.lens?.price || 0)) * (item.qty || 1)).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
            <div
              style={{
                background: "var(--white)",
                borderRadius: 16,
                border: "1px solid var(--g100)",
                padding: 24,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--black)", marginBottom: 12 }}>
                Have a coupon?
              </div>
              {suggestedCoupons.length > 0 ? (
                <div className="coupon-chips">
                  {suggestedCoupons.map((c) => (
                    <button key={c} type="button" className="coupon-chip" onClick={() => setCoupon(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="coupon-row">
                <label htmlFor="cart-coupon-code" className="sr-only">
                  Coupon code
                </label>
                <input
                  id="cart-coupon-code"
                  className="input"
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
                <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={applyCouponClick}>
                  Apply
                </button>
              </div>
              {couponErr && (
                <div style={{ color: "var(--red)", fontWeight: 600, fontSize: 12, marginTop: 8 }}>{couponErr}</div>
              )}
              {disc > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
                  <div style={{ color: "var(--green)", fontWeight: 700, fontSize: 13 }}>
                    ✓ {appliedCoupon?.code}: −₹{disc}
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={removeCoupon}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="order-summary">
            <div className="summary-title">Order Summary</div>
            <div className="summary-row">
              <span>Frames</span>
              <span>₹{framesSubtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Lenses</span>
              <span>{lensesSubtotal === 0 ? "FREE" : `₹${lensesSubtotal.toLocaleString()}`}</span>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span style={{ color: shipping === 0 ? "var(--green)" : undefined }}>
                {shipping === 0 ? "FREE" : `₹${shipping}`}
              </span>
            </div>
            {disc > 0 && (
              <div className="summary-row">
                <span style={{ color: "var(--green)" }}>Discount</span>
                <span style={{ color: "var(--green)" }}>−₹{disc}</span>
              </div>
            )}
            <div className="summary-row">
              <span>GST (18%)</span>
              <span>₹{gst.toLocaleString("en-IN")}</span>
            </div>
            <div className="divider" />
            <div className="summary-total">
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: 20, padding: "15px" }}
              onClick={() => {
                if (!safeItems.length) return;
                if (!isAuthenticated()) {
                  showToast?.({ msg: "Please sign in to checkout.", type: "info" });
                  navigate("/login", { state: { from: "/checkout" } });
                  return;
                }
                setPage("checkout");
              }}
            >
              Proceed to Checkout →
            </button>
            <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => setPage("plp")}>
              Continue Shopping
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
                marginTop: 16,
                padding: "12px",
                background: "var(--em-pale)",
                border: "1px solid var(--em-light)",
                borderRadius: 10,
              }}
            >
              <span>🔒</span>
              <span style={{ fontSize: 12, color: "var(--g500)" }}>Secure checkout · SSL encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {removeTarget ? (
        <div
          role="presentation"
          onClick={() => setRemoveTarget(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            background: "rgba(0,0,0,.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--white)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 440,
              width: "100%",
              border: "1px solid var(--g100)",
              boxShadow: "0 24px 48px rgba(0,0,0,.15)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px 0" }}>What would you like to do?</h2>
            <p style={{ fontSize: 13, color: "var(--g600)", marginBottom: 18 }}>
              {removeTarget.name}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ borderColor: "var(--red)", color: "var(--red)" }}
                onClick={() => {
                  remove(removeTarget.id);
                  setRemoveTarget(null);
                }}
              >
                Remove from cart
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "var(--green)", borderColor: "var(--green)" }}
                onClick={async () => {
                  if (!isAuthenticated()) {
                    showToast?.({ msg: "Please log in to save to wishlist", type: "info" });
                    navigate("/login", { state: { from: "/cart" } });
                    return;
                  }
                  try {
                    await api.post(`/users/wishlist/${removeTarget.productId}`);
                    remove(removeTarget.id);
                    showToast?.({ msg: "Moved to wishlist", type: "success" });
                  } catch (e) {
                    showToast?.({ msg: e.response?.data?.message || "Could not move to wishlist", type: "error" });
                  } finally {
                    setRemoveTarget(null);
                  }
                }}
              >
                Move to Wishlist
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setRemoveTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
