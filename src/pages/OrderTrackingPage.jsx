import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axiosInstance";
import { setPageSeo } from "../utils/seo";

const STEPS = [
  { key: "placed", label: "Order Placed", statusMatch: ["pending", "confirmed", "shipped", "delivered"] },
  { key: "confirmed", label: "Confirmed", statusMatch: ["confirmed", "shipped", "delivered"] },
  { key: "shipped", label: "Shipped", statusMatch: ["shipped", "delivered"] },
  { key: "delivered", label: "Delivered", statusMatch: ["delivered"] },
];

function stepIndex(status) {
  const s = String(status || "").toLowerCase();
  if (s === "cancelled") return -1;
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (STEPS[i].statusMatch.includes(s)) return i;
  }
  return 0;
}

function paymentBadgeClass(ps) {
  const x = String(ps || "").toLowerCase();
  if (x === "paid") return "badge-delivered";
  if (x === "failed") return "badge-cancelled";
  if (x === "refunded") return "badge-confirmed";
  return "badge-pending";
}

function formatPaymentStatus(ps) {
  const x = String(ps || "").toLowerCase();
  if (x === "paid") return "Paid";
  if (x === "failed") return "Payment Failed";
  if (x === "refunded") return "Refunded";
  return "Pending Payment";
}

function formatPaymentMethod(pm) {
  const x = String(pm || "").toLowerCase();
  if (x === "razorpay") return "Razorpay";
  if (x === "cod") return "Cash on Delivery";
  if (x === "upi") return "UPI";
  if (x === "card") return "Card";
  return pm || "—";
}

export default function OrderTrackingPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        if (!c) setOrder(data.data);
      } catch (e) {
        if (!c) setErr(e.response?.data?.message || "Could not load order.");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!order?._id || !orderId) return undefined;
    const restore = setPageSeo({
      title: `Order ${String(order._id).slice(-8)} | Eyelens tracking`,
      description: "Track your Eyelens order status, shipment updates, and delivery details in one place.",
      canonicalPath: `/order/${orderId}`,
      noindex: true,
    });
    return () => restore();
  }, [order?._id, orderId]);

  if (loading) {
    return (
      <div className="page-enter" style={{ paddingTop: 88, minHeight: "70vh", background: "var(--g50)" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ height: 20, width: 120, background: "var(--g100)", borderRadius: 6, marginBottom: 20 }} />
          <div style={{ height: 32, width: "55%", background: "var(--g100)", borderRadius: 8, marginBottom: 28 }} />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 72,
                borderRadius: 14,
                background: "linear-gradient(90deg, var(--g100) 25%, var(--g200) 50%, var(--g100) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.2s ease-in-out infinite",
                marginBottom: 12,
              }}
            />
          ))}
        </div>
        <p style={{ color: "var(--g500)", textAlign: "center", marginTop: 16 }}>Loading order…</p>
      </div>
    );
  }
  if (err || !order) {
    return (
      <div className="page-enter" style={{ paddingTop: 100, textAlign: "center" }}>
        <p style={{ color: "var(--red)" }}>{err || "Order not found"}</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/account?tab=orders")}>
          Back to Orders
        </button>
      </div>
    );
  }

  const status = String(order.status || "").toLowerCase();
  const cancelled = status === "cancelled";
  const currentIdx = cancelled ? -1 : stepIndex(status);
  const addr = order.shippingAddress || {};

  const dateForStep = (i) => {
    if (i === 0) return order.createdAt;
    if (i === 1) return order.confirmedAt;
    if (i === 2) return order.shippedAt;
    if (i === 3) return order.deliveredAt;
    return null;
  };

  return (
    <div className="page-enter" style={{ paddingTop: 72, paddingBottom: 48, background: "var(--g50)", minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate("/account?tab=orders")}>
          ← Back to Orders
        </button>
        <h1 style={{ fontFamily: "var(--font-d)", fontSize: 26, fontWeight: 800, color: "var(--black)", marginBottom: 8 }}>
          Track order
        </h1>
        <p style={{ fontSize: 13, color: "var(--g500)", marginBottom: 28 }}>
          Order <strong style={{ color: "var(--em)" }}>#{String(order._id).slice(-8).toUpperCase()}</strong>
        </p>

        {cancelled ? (
          <div style={{ padding: 20, background: "var(--white)", borderRadius: 16, border: "1px solid var(--g100)", marginBottom: 24 }}>
            This order was cancelled.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16, marginBottom: 28 }}>
            {STEPS.map((st, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              const upcoming = i > currentIdx;
              const dt = dateForStep(i);
              return (
                <div
                  key={st.key}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    padding: 16,
                    borderRadius: 14,
                    background: "var(--white)",
                    border: `1px solid ${active ? "var(--em)" : "var(--g100)"}`,
                    opacity: upcoming ? 0.55 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: done || active ? "var(--em)" : "var(--g200)",
                      color: done || active ? "var(--white)" : "var(--g500)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {done ? "✓" : active ? "●" : "○"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: active ? "var(--em)" : "var(--black)" }}>{st.label}</div>
                    {dt && (
                      <div style={{ fontSize: 12, color: "var(--g500)", marginTop: 4 }}>
                        {new Date(dt).toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ background: "var(--white)", borderRadius: 16, border: "1px solid var(--g100)", padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Items</div>
          {(order.items || []).map((it, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, gap: 12 }}>
                <span>
                  {it.name} × {it.qty}
                </span>
                <span style={{ flexShrink: 0 }}>₹{Number(it.price || 0) * Number(it.qty || 1)}</span>
              </div>
              {(it.lens?.name || it.frameOptions?.color || it.prescription?.mode) ? (
                <div style={{ fontSize: 12, color: "var(--g600)", marginTop: 4, lineHeight: 1.45 }}>
                  {it.lens?.name ? <span>{it.lens.name}. </span> : null}
                  {(it.frameOptions?.color || it.frameOptions?.size) ? (
                    <span>{[it.frameOptions.color, it.frameOptions.size].filter(Boolean).join(" · ")}. </span>
                  ) : null}
                  {it.prescription?.mode === "saved" ? (
                    <span>
                      Prescription: {it.prescription.patientName || "On file"}
                      {(it.prescription.odSphere || it.prescription.osSphere)
                        ? ` · OD ${it.prescription.odSphere || "—"} / OS ${it.prescription.osSphere || "—"}`
                        : ""}
                    </span>
                  ) : it.prescription?.mode === "none" ? (
                    <span>Prescription not supplied.</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div style={{ background: "var(--white)", borderRadius: 16, border: "1px solid var(--g100)", padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Delivery</div>
          <div style={{ fontSize: 13, color: "var(--g600)", lineHeight: 1.6 }}>
            {[addr.fullName, addr.phone, addr.address, [addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")]
              .filter(Boolean)
              .join("\n")}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <strong>Payment:</strong> {formatPaymentMethod(order.paymentMethod)}
            <span className={`badge ${paymentBadgeClass(order.paymentStatus)}`} style={{ fontSize: 11 }}>
              {formatPaymentStatus(order.paymentStatus)}
            </span>
          </div>
          {order.paymentId ? (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--g500)" }}>
              Payment reference: {order.paymentId}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, textAlign: "right" }}>
          Total: ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
        </div>
      </div>
    </div>
  );
}
