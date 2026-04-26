import { useState, useEffect, useCallback } from "react";
import { api } from "../api/axiosInstance";
import { getUser } from "../auth/auth";
import { setPageSeo } from "../utils/seo";

const errorTextStyle = { fontSize: 11, color: "var(--red)", marginTop: 4 };

function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Razorpay) return Promise.resolve();
  const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load payment script")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load payment script"));
    document.body.appendChild(s);
  });
}

export default function CheckoutPage({
  setPage,
  items = [],
  onPlaceOrder,
  onFinalizeCheckout,
  showToast,
  couponCode = "",
  couponDiscount = 0,
}) {
  const [step, setStep] = useState(1);
  const [payTab, setPayTab] = useState("cod");
  const [rzpAvailable, setRzpAvailable] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderDone, setOrderDone] = useState(null);
  const [orderFailed, setOrderFailed] = useState(null);
  const [pendingRzpOrder, setPendingRzpOrder] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState({});
  const [delivery, setDelivery] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    pincode: "",
    address: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    let cancelled = false;
    api
      .get("/payments/config")
      .then(({ data }) => {
        if (!cancelled && data?.data?.razorpayKeyId) setRzpAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (payTab === "razorpay" && !rzpAvailable) setPayTab("cod");
  }, [payTab, rzpAvailable]);

  useEffect(() => {
    const restore = setPageSeo({
      title: "Checkout | Eyelens order & delivery",
      description:
        "Enter delivery details, choose payment, and review your Eyelens order before confirmation. Lens options stay attached to each line.",
      canonicalPath: "/checkout",
      noindex: true,
    });
    return () => restore();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("eyelens_addresses");
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedAddresses(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedAddresses([]);
    }
  }, []);

  const framesSubtotal = items.reduce((a, i) => a + (i.framePrice || 0) * (i.qty || 0), 0);
  const lensesSubtotal = items.reduce((a, i) => a + ((i.lens?.price || 0) * (i.qty || 0)), 0);
  const subtotal = framesSubtotal + lensesSubtotal;
  const disc = Math.max(0, Number(couponDiscount) || 0);
  /** Matches server: total = product lines minus coupon only (no shipping / GST). */
  const total = Math.round(Math.max(0, subtotal - disc) * 100) / 100;
  const orderDraftSignature = JSON.stringify({
    items: items.map((i) => ({
      productId: i.productId,
      qty: i.qty || 0,
      framePrice: i.framePrice || 0,
      lensId: i.lens?.id || i.lens?.name || "",
      lensPrice: i.lens?.price || 0,
      prescriptionMode: i.prescription?.mode || "none",
      prescriptionId: i.prescription?.id || "",
    })),
    couponCode: String(couponCode || "").trim(),
    total,
    delivery: {
      firstName: delivery.firstName?.trim() || "",
      lastName: delivery.lastName?.trim() || "",
      phone: delivery.phone?.trim() || "",
      pincode: delivery.pincode?.trim() || "",
      address: delivery.address?.trim() || "",
      city: delivery.city?.trim() || "",
      state: delivery.state?.trim() || "",
    },
  });

  useEffect(() => {
    // Any checkout input change should invalidate an old pending online order.
    setPendingRzpOrder(null);
  }, [orderDraftSignature, payTab]);

  const validateStep1 = () => {
    const nextErrors = {};
    if (!delivery.firstName?.trim()) nextErrors.firstName = "First name is required";
    if (!delivery.lastName?.trim()) nextErrors.lastName = "Last name is required";
    if (!delivery.phone?.trim()) nextErrors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(delivery.phone.replace(/\D/g, ""))) nextErrors.phone = "Enter a valid 10-digit phone";
    if (!delivery.address?.trim()) nextErrors.address = "Address is required";
    if (!delivery.city?.trim()) nextErrors.city = "City is required";
    if (!delivery.state?.trim()) nextErrors.state = "State is required";
    const cleanPin = delivery.pincode?.trim() || "";
    if (!cleanPin) nextErrors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(cleanPin)) nextErrors.pincode = "Enter a valid 6-digit pincode";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors = {};
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const paymentChoices = [
    {
      id: "cod",
      label: "Cash on Delivery",
      blurb: "Pay when your order arrives",
      icon: "💵",
      enabled: true,
      badge: null,
    },
    {
      id: "razorpay",
      label: "Pay Online",
      blurb: rzpAvailable ? "Cards, UPI, wallets via Razorpay" : "Temporarily unavailable",
      icon: "🔐",
      enabled: rzpAvailable,
      badge: rzpAvailable ? "Recommended" : "Unavailable",
    },
  ];
  const paymentTone = {
    cod: { bg: "#FEF8EE", border: "#F5D7A3" },
    razorpay: { bg: "#F1F5FF", border: "#C7D2FE" },
  };
  const payActionLabel = payTab === "razorpay" ? "Continue to secure payment" : "Review order";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const goNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const setDeliveryField = useCallback((field, value) => {
    setDelivery((d) => ({ ...d, [field]: value }));
    setSelectedAddressId("new");
  }, []);

  const chooseSavedAddress = useCallback((id) => {
    const chosen = savedAddresses.find((a) => String(a.id) === String(id));
    if (!chosen) return;
    setSelectedAddressId(String(chosen.id));
    setDelivery({
      firstName: chosen.firstName || "",
      lastName: chosen.lastName || "",
      phone: chosen.phone || "",
      pincode: chosen.pincode || "",
      address: chosen.address || "",
      city: chosen.city || "",
      state: chosen.state || "",
    });
    setSaveAddress(false);
    setErrors({});
  }, [savedAddresses]);

  const persistAddressIfNeeded = useCallback(() => {
    if (saveAddress && selectedAddressId === "new" && typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("eyelens_addresses");
        const parsed = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(parsed) ? parsed : [];
        const entry = {
          id: Date.now(),
          ...delivery,
          label: "Saved",
        };
        const next = [entry, ...list].slice(0, 10);
        window.localStorage.setItem("eyelens_addresses", JSON.stringify(next));
        setSavedAddresses(next);
      } catch {
        /* ignore */
      }
    }
  }, [delivery, saveAddress, selectedAddressId]);

  const markPaymentFailed = useCallback(async (order, message, razorpayOrderId = "") => {
    if (!order?._id) return;
    try {
      await api.post("/payments/fail", {
        orderId: order._id,
        razorpay_order_id: razorpayOrderId || order.razorpayOrderId || "",
      });
    } catch {
      // Best-effort sync; user should still see failed status locally.
    }
    setOrderFailed({
      ...order,
      paymentMethod: "razorpay",
      paymentStatus: "failed",
      failureMessage: message || "Payment could not be completed.",
    });
  }, []);

  const handlePlace = async () => {
    if (!items.length) return;
    setPlacing(true);
    setErrors({});
    try {
      if (payTab === "razorpay") {
        let order = pendingRzpOrder;
        if (!order?._id) {
          order = await onPlaceOrder?.(delivery, "razorpay", items, couponCode, {
            deferClearCart: true,
            suppressSuccessToast: true,
          });
          if (order?._id) setPendingRzpOrder(order);
        }
        if (!order?._id) {
          setPlacing(false);
          return;
        }
        // Must use /payments/create-order + /payments/verify so the Eyelens order is
        // linked to Razorpay and paymentStatus is saved as "paid" (admin reads DB).
        const { data: co } = await api.post("/payments/create-order", {
          orderId: order._id,
          currency: "INR",
          amount: total,
        });
        if (!co?.success) throw new Error(co?.message || "Could not start payment");
        const payload = co.data?.data || co.data || co;
        const rzpOrderId = payload.orderId || payload.order_id;
        const amount = payload.amount;
        const currency = payload.currency;
        const keyId =
          import.meta.env.VITE_RAZORPAY_KEY_ID ||
          payload.keyId ||
          payload.key_id ||
          null;
        if (!rzpOrderId || !amount || !currency || !keyId) {
          throw new Error("Invalid payment setup. Please contact support.");
        }
        await loadRazorpayScript();
        const user = getUser();
        const razorpayLogo = typeof window !== "undefined" ? `${window.location.origin}/LOGO.svg` : "/LOGO.svg";
        await new Promise((resolve) => {
          const rzp = new window.Razorpay({
            key: keyId,
            amount,
            currency,
            order_id: rzpOrderId,
            name: "Eyelens",
            image: razorpayLogo,
            description: "Order payment",
            prefill: { email: user?.email || "" },
            config: {
              display: {
                blocks: {
                  preferred: {
                    name: "Pay using",
                    instruments: [
                      { method: "upi" },
                      { method: "card" },
                    ],
                  },
                },
                sequence: ["block.preferred"],
                preferences: {
                  show_default_blocks: false,
                },
              },
            },
            method: {
              netbanking: false,
              wallet: false,
              paylater: false,
            },
            handler: async (response) => {
              try {
                const { data: v } = await api.post("/payments/verify", {
                  orderId: order._id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                if (!v?.success) throw new Error(v?.message || "Verification failed");
                onFinalizeCheckout?.();
                persistAddressIfNeeded();
                setPendingRzpOrder(null);
                showToast?.({ msg: "Payment successful!", type: "success" });
                setOrderDone({
                  ...order,
                  paymentStatus: "paid",
                  paymentMethod: "razorpay",
                });
              } catch (e) {
                const msg = e.response?.data?.message || e.message || "Payment verification failed.";
                showToast?.({ msg, type: "error" });
                setErrors({ submit: msg });
                await markPaymentFailed(order, msg, rzpOrderId);
              } finally {
                resolve();
              }
            },
            modal: {
              ondismiss: async () => {
                const msg = "Payment was not completed. You can retry from checkout.";
                await markPaymentFailed(order, msg, rzpOrderId);
                showToast?.({
                  msg,
                  type: "error",
                });
                resolve();
              },
            },
            theme: { color: "#1e293b" },
          });
          rzp.on("payment.failed", async () => {
            const msg = "Payment failed. Please try again or use COD.";
            await markPaymentFailed(order, msg, rzpOrderId);
            showToast?.({ msg, type: "error" });
          });
          rzp.open();
        });
        return;
      }

      const order = await onPlaceOrder?.(delivery, payTab, items, couponCode);
      if (order) {
        setPendingRzpOrder(null);
        setOrderDone(order);
        persistAddressIfNeeded();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Could not place order.";
      setErrors({ submit: msg });
      showToast?.({ msg, type: "error" });
    } finally {
      setPlacing(false);
    }
  };

  const payMethodLabel = (m) => {
    const x = String(m || "").toLowerCase();
    if (x === "razorpay") return "Paid online (Razorpay)";
    if (x === "cod") return "Cash on Delivery";
    return m || "—";
  };

  if (orderDone) {
    const oid = orderDone._id ? String(orderDone._id) : "";
    const paidOnline = String(orderDone.paymentStatus || "").toLowerCase() === "paid" && orderDone.paymentMethod === "razorpay";
    return (
      <div
        className="page-enter"
        style={{
          paddingTop: 64,
          minHeight: "100vh",
          background: "radial-gradient(circle at top, #F5F3FF 0%, #EEF2FF 35%, var(--g50) 75%)",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: 560,
            paddingTop: isMobile ? 28 : 54,
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,.84)",
              border: "1px solid #DDD6FE",
              borderRadius: 22,
              padding: isMobile ? "22px 16px" : "28px 24px",
              boxShadow: "0 18px 45px rgba(79,70,229,.12)",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                margin: "0 auto 16px",
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                fontSize: 40,
                color: "#166534",
                background: "linear-gradient(135deg, #DCFCE7, #BBF7D0)",
                border: "1px solid #86EFAC",
                animation: "pulse 0.6s ease",
              }}
            >
              ✓
            </div>
            <h1 style={{ fontFamily: "var(--font-d)", fontSize: isMobile ? 26 : 30, fontWeight: 800, color: "var(--black)", marginBottom: 8 }}>
              Order confirmed
            </h1>
            {paidOnline ? (
              <div style={{ marginBottom: 12 }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: ".09em",
                    borderRadius: 999,
                    padding: "6px 10px",
                    color: "#14532D",
                    background: "#DCFCE7",
                    border: "1px solid #86EFAC",
                  }}
                >
                  PAYMENT RECEIVED
                </span>
              </div>
            ) : null}
            <p style={{ fontSize: 14, color: "var(--g600)", marginBottom: 8 }}>
              Payment: <strong>{payMethodLabel(orderDone.paymentMethod)}</strong>
              {String(orderDone.paymentStatus || "").toLowerCase() === "pending" && orderDone.paymentMethod === "cod" ? (
                <span style={{ color: "var(--g500)" }}> (pay on delivery)</span>
              ) : null}
            </p>
            <p style={{ color: "var(--g500)", marginBottom: 8 }}>
              Thank you! Your order ID is{" "}
              <strong style={{ color: "#312E81" }}>{oid.slice(-8).toUpperCase()}</strong>
            </p>
            <p style={{ fontSize: 13, color: "var(--g400)", marginBottom: 24 }}>We&apos;ve sent the details to your email.</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
                marginBottom: 20,
                textAlign: "left",
              }}
            >
              <div style={{ border: "1px solid #E9D5FF", background: "#FAF5FF", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "#5B21B6" }}>
                Status: Confirmed
              </div>
              <div style={{ border: "1px solid #C7D2FE", background: "#EEF2FF", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "#3730A3" }}>
                Shipment: Processing
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: isMobile ? "100%" : undefined }} onClick={() => setPage("account")}>
              View my orders
            </button>
            <button className="btn btn-ghost" style={{ marginTop: 12, width: isMobile ? "100%" : undefined }} onClick={() => setPage("home")}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orderFailed) {
    const oid = orderFailed._id ? String(orderFailed._id) : "";
    return (
      <div
        className="page-enter"
        style={{
          paddingTop: 64,
          minHeight: "100vh",
          background: "radial-gradient(circle at top, #FEF2F2 0%, #FFF1F2 34%, var(--g50) 75%)",
        }}
      >
        <div className="container" style={{ maxWidth: 560, paddingTop: isMobile ? 28 : 54, textAlign: "center" }}>
          <div
            style={{
              background: "rgba(255,255,255,.88)",
              border: "1px solid #FECACA",
              borderRadius: 22,
              padding: isMobile ? "22px 16px" : "28px 24px",
              boxShadow: "0 18px 45px rgba(220,38,38,.08)",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                margin: "0 auto 16px",
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                fontSize: 38,
                color: "#991B1B",
                background: "linear-gradient(135deg, #FEE2E2, #FECACA)",
                border: "1px solid #FCA5A5",
              }}
            >
              ✕
            </div>
            <h1 style={{ fontFamily: "var(--font-d)", fontSize: isMobile ? 26 : 30, fontWeight: 800, color: "var(--black)", marginBottom: 8 }}>
              Payment failed
            </h1>
            <p style={{ fontSize: 13, color: "var(--g600)", marginBottom: 8 }}>
              Order ID: <strong style={{ color: "#7F1D1D" }}>{oid.slice(-8).toUpperCase()}</strong>
            </p>
            <p style={{ color: "var(--g500)", marginBottom: 18 }}>
              {orderFailed.failureMessage || "Your payment was not completed."}
            </p>
            <div
              style={{
                marginBottom: 22,
                borderRadius: 12,
                border: "1px solid #FECACA",
                background: "#FEF2F2",
                padding: "10px 12px",
                fontSize: 12,
                color: "#991B1B",
              }}
            >
              No amount was captured. You can safely retry now.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                style={{ width: isMobile ? "100%" : undefined }}
                onClick={() => {
                  setOrderFailed(null);
                  setPayTab("razorpay");
                  setStep(3);
                }}
              >
                Retry payment
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: isMobile ? "100%" : undefined }}
                onClick={() => {
                  setOrderFailed(null);
                  setStep(2);
                }}
              >
                Change payment method
              </button>
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 12, width: isMobile ? "100%" : undefined }} onClick={() => setPage("account")}>
              View my orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ paddingTop: isMobile ? 56 : 64, background: "var(--g50)", minHeight: "100vh" }}>
      <div className="container">
        <div style={{ paddingTop: isMobile ? 22 : 32, marginBottom: isMobile ? 18 : 24 }}>
          <h1 style={{ fontFamily: "var(--font-d)", fontSize: isMobile ? 28 : 32, fontWeight: 800, color: "var(--black)" }}>Checkout</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                className={`btn btn-sm ${step === s ? "btn-primary" : "btn-ghost"}`}
                onClick={() => {
                  if (s < step) setStep(s);
                }}
                disabled={s > step}
                style={{ opacity: s > step ? 0.5 : 1, fontSize: isMobile ? 11 : undefined, padding: isMobile ? "7px 10px" : undefined }}
              >
                {s === 1 ? "1 · Address" : s === 2 ? "2 · Payment" : "3 · Review"}
              </button>
            ))}
          </div>
        </div>

        <div className="checkout-grid">
          <div>
            {step === 1 && (
              <div className="checkout-section">
                <div className="section-heading">
                  <div className="section-num">1</div>Delivery address
                </div>
                {savedAddresses.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--g600)", marginBottom: 8 }}>Saved addresses</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {savedAddresses.map((a) => {
                        const isActive = String(selectedAddressId) === String(a.id);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => chooseSavedAddress(a.id)}
                            style={{
                              textAlign: "left",
                              justifyContent: "space-between",
                              border: isActive ? "1.5px solid var(--em)" : "1px solid var(--g200)",
                              background: isActive ? "var(--em-pale)" : "var(--white)",
                              borderRadius: 12,
                              padding: "10px 12px",
                              color: "var(--black)",
                            }}
                          >
                            <span style={{ fontSize: 12, lineHeight: 1.5 }}>
                              <strong>{a.label || "Saved"}</strong> · {a.firstName || ""} {a.lastName || ""}
                              <br />
                              {a.address || ""}, {a.city || ""}, {a.state || ""} — {a.pincode || ""}
                            </span>
                            <span style={{ fontSize: 12, color: isActive ? "var(--em)" : "var(--g500)" }}>
                              {isActive ? "Selected" : "Use"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setSelectedAddressId("new");
                      setSaveAddress(true);
                      setDelivery({
                        firstName: "",
                        lastName: "",
                        phone: "",
                        pincode: "",
                        address: "",
                        city: "",
                        state: "",
                      });
                    }}
                  >
                    + Add address
                  </button>
                </div>

                {selectedAddressId === "new" && (
                  <>
                    <div className="form-row2" style={{ marginBottom: 14 }}>
                      <div>
                        <label className="field-label" style={{ fontSize: isMobile ? 12 : undefined }}>First name</label>
                        <input
                          className="input"
                          style={{ fontSize: isMobile ? 14 : undefined }}
                          value={delivery.firstName}
                          onChange={(e) => setDeliveryField("firstName", e.target.value)}
                        />
                        {errors.firstName && <div style={errorTextStyle}>{errors.firstName}</div>}
                      </div>
                      <div>
                        <label className="field-label" style={{ fontSize: isMobile ? 12 : undefined }}>Last name</label>
                        <input
                          className="input"
                          style={{ fontSize: isMobile ? 14 : undefined }}
                          value={delivery.lastName}
                          onChange={(e) => setDeliveryField("lastName", e.target.value)}
                        />
                        {errors.lastName && <div style={errorTextStyle}>{errors.lastName}</div>}
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label className="field-label" style={{ fontSize: isMobile ? 12 : undefined }}>Phone</label>
                      <input
                        className="input"
                        style={{ fontSize: isMobile ? 14 : undefined }}
                        inputMode="numeric"
                        value={delivery.phone}
                        onChange={(e) => setDeliveryField("phone", e.target.value)}
                      />
                      {errors.phone && <div style={errorTextStyle}>{errors.phone}</div>}
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label className="field-label" style={{ fontSize: isMobile ? 12 : undefined }}>Address</label>
                      <input
                        className="input"
                        style={{ fontSize: isMobile ? 14 : undefined }}
                        value={delivery.address}
                        onChange={(e) => setDeliveryField("address", e.target.value)}
                      />
                      {errors.address && <div style={errorTextStyle}>{errors.address}</div>}
                    </div>
                    <div className="form-row2" style={{ marginBottom: 14 }}>
                      <div>
                        <label className="field-label" style={{ fontSize: isMobile ? 12 : undefined }}>City</label>
                        <input
                          className="input"
                          style={{ fontSize: isMobile ? 14 : undefined }}
                          value={delivery.city}
                          onChange={(e) => setDeliveryField("city", e.target.value)}
                        />
                        {errors.city && <div style={errorTextStyle}>{errors.city}</div>}
                      </div>
                      <div>
                        <label className="field-label" style={{ fontSize: isMobile ? 12 : undefined }}>State</label>
                        <input
                          className="input"
                          style={{ fontSize: isMobile ? 14 : undefined }}
                          value={delivery.state}
                          onChange={(e) => setDeliveryField("state", e.target.value)}
                        />
                        {errors.state && <div style={errorTextStyle}>{errors.state}</div>}
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label className="field-label" style={{ fontSize: isMobile ? 12 : undefined }}>Pincode</label>
                      <input
                        className="input"
                        style={{ fontSize: isMobile ? 14 : undefined }}
                        value={delivery.pincode}
                        onChange={(e) => setDeliveryField("pincode", e.target.value)}
                      />
                      {errors.pincode && <div style={errorTextStyle}>{errors.pincode}</div>}
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                      Save this address for next time
                    </label>
                  </>
                )}

                {selectedAddressId !== "new" && (
                  <div
                    style={{
                      background: "var(--g50)",
                      border: "1px solid var(--g100)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontSize: 12,
                      color: "var(--g600)",
                      marginBottom: 14,
                    }}
                  >
                    Saved address selected. Click <strong>+ Add address</strong> to enter a different one.
                  </div>
                )}
                <button type="button" className="btn btn-primary" style={{ marginTop: 20, width: isMobile ? "100%" : undefined }} onClick={goNext}>
                  Continue to payment
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="checkout-section">
                <div className="section-heading">
                  <div className="section-num">2</div>Payment method
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    marginBottom: 12,
                    background: "linear-gradient(180deg, rgba(255,255,255,.95), rgba(249,250,251,.92))",
                    border: "1px solid var(--g100)",
                    borderRadius: 14,
                    padding: isMobile ? 10 : 12,
                  }}
                >
                  {paymentChoices.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!m.enabled}
                      onClick={() => {
                        if (!m.enabled) return;
                        setPayTab(m.id);
                        setErrors({});
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        width: "100%",
                        textAlign: "left",
                        padding: isMobile ? "10px 11px" : "12px 14px",
                        borderRadius: 12,
                        border: payTab === m.id ? "1.5px solid var(--em)" : "1px solid var(--g200)",
                        background:
                          payTab === m.id ? paymentTone[m.id]?.bg || "var(--em-pale)" : "var(--white)",
                        boxShadow: payTab === m.id ? "0 8px 20px rgba(16,24,40,.08)" : "0 1px 2px rgba(16,24,40,.04)",
                        opacity: m.enabled ? 1 : 0.55,
                        cursor: m.enabled ? "pointer" : "not-allowed",
                        transition: "all .2s ease",
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                        <span style={{ fontSize: isMobile ? 16 : 18 }}>{m.icon}</span>
                        <div>
                          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "var(--black)" }}>{m.label}</div>
                          <div style={{ fontSize: isMobile ? 11 : 12, color: "var(--g500)" }}>{m.blurb}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {m.badge ? (
                          <span
                            style={{
                              fontSize: isMobile ? 9 : 10,
                              fontWeight: 800,
                              letterSpacing: ".05em",
                              textTransform: "uppercase",
                              borderRadius: 999,
                              padding: isMobile ? "3px 7px" : "4px 8px",
                              color: m.enabled ? "var(--em-dark)" : "var(--g600)",
                              background:
                                payTab === m.id
                                  ? paymentTone[m.id]?.border || "var(--em-light)"
                                  : m.enabled
                                    ? "var(--em-light)"
                                    : "var(--g100)",
                            }}
                          >
                            {m.badge}
                          </span>
                        ) : null}
                        <span
                          style={{
                            color: payTab === m.id ? "var(--em)" : "var(--g400)",
                            fontSize: isMobile ? 13 : 14,
                            width: 18,
                            textAlign: "center",
                          }}
                        >
                          {payTab === m.id ? "◉" : "○"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    background: "var(--g50)",
                    border: "1px solid var(--g100)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 12,
                    color: "var(--g600)",
                    marginBottom: 12,
                  }}
                >
                  Order total payable: <strong style={{ color: "var(--black)" }}>₹{total.toLocaleString("en-IN")}</strong>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "wrap",
                    fontSize: isMobile ? 11 : 12,
                    color: "var(--g500)",
                  }}
                >
                  <span>Trusted checkout</span>
                  <span style={{ letterSpacing: ".03em" }}>SSL secured · PCI-compliant gateway</span>
                </div>
                {payTab === "cod" && (
                  <div style={{ background: "#FEF8EE", borderRadius: 10, padding: isMobile ? 12 : 16, marginTop: 12, border: "1px solid #F5D7A3" }}>
                    <p style={{ fontSize: isMobile ? 12 : 13, color: "var(--amber)", fontWeight: 600, marginBottom: 4 }}>
                      Pay with cash when your order arrives.
                    </p>
                    <p style={{ fontSize: isMobile ? 11 : 12, color: "var(--g600)" }}>
                      You can still inspect product and prescription details before handing over payment.
                    </p>
                  </div>
                )}
                {payTab === "razorpay" && (
                  <div
                    style={{
                      marginTop: 12,
                      borderRadius: 16,
                      padding: isMobile ? 14 : 18,
                      border: "1px solid #C7D2FE",
                      background: "linear-gradient(140deg, #EEF2FF 0%, #F8FAFF 52%, #FFFFFF 100%)",
                      boxShadow: "0 12px 30px rgba(79, 70, 229, .12)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: isMobile ? 24 : 28,
                            height: isMobile ? 24 : 28,
                            borderRadius: 999,
                            background: "rgba(79,70,229,.14)",
                            color: "#312E81",
                            fontWeight: 800,
                            fontSize: isMobile ? 11 : 13,
                          }}
                        >
                          RP
                        </span>
                        <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: "#312E81" }}>Razorpay Secure Checkout</div>
                      </div>
                      <span
                        style={{
                          fontSize: isMobile ? 9 : 10,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          fontWeight: 800,
                          borderRadius: 999,
                          padding: isMobile ? "4px 8px" : "5px 9px",
                          color: "#1E1B4B",
                          background: "rgba(79,70,229,.16)",
                        }}
                      >
                        Encrypted
                      </span>
                    </div>
                    <p style={{ fontSize: isMobile ? 12 : 13, color: "var(--g600)", marginBottom: 12 }}>
                      You&apos;ll complete payment in Razorpay on the next step with instant confirmation.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {["UPI", "Credit / Debit Cards", "Wallets", "Netbanking"].map((method) => (
                        <span
                          key={method}
                          style={{
                            fontSize: isMobile ? 10 : 11,
                            color: "#3730A3",
                            background: "rgba(255,255,255,.84)",
                            border: "1px solid rgba(99,102,241,.25)",
                            borderRadius: 999,
                            padding: isMobile ? "5px 9px" : "6px 10px",
                            fontWeight: 700,
                          }}
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-ghost" style={{ width: isMobile ? "100%" : undefined }} onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary" style={{ width: isMobile ? "100%" : undefined }} onClick={goNext}>
                    {payActionLabel}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="checkout-section">
                <div className="section-heading">
                  <div className="section-num">3</div>Review order
                </div>
                <div style={{ background: "var(--white)", border: "1px solid var(--g100)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Ship to</div>
                  <div style={{ fontSize: 13, color: "var(--g600)", lineHeight: 1.6 }}>
                    {delivery.firstName} {delivery.lastName}
                    <br />
                    {delivery.phone}
                    <br />
                    {delivery.address}, {delivery.city}, {delivery.state} — {delivery.pincode}
                  </div>
                </div>
                <div style={{ background: "var(--white)", border: "1px solid var(--g100)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Payment</div>
                  <div style={{ fontSize: 13 }}>
                    {payTab === "cod" ? "Cash on Delivery" : "Pay online (Razorpay)"}
                  </div>
                </div>
                {items.map((it) => (
                  <div key={it.id} className="summary-row" style={{ marginBottom: 8 }}>
                    <span>
                      {it.name} × {it.qty}
                    </span>
                    <span>₹{((it.price || 0) * (it.qty || 0)).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                {errors.submit && (
                  <div style={{ ...errorTextStyle, marginTop: 12, textAlign: "center" }}>{errors.submit}</div>
                )}
                <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-ghost" style={{ width: isMobile ? "100%" : undefined }} onClick={() => setStep(2)}>
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePlace}
                    disabled={placing || !items.length}
                    style={{ minWidth: 200, width: isMobile ? "100%" : undefined }}
                  >
                    {placing ? "Placing order…" : "Place order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="order-summary" style={{ position: "sticky", top: 80 }}>
              <div className="summary-title">Order summary</div>
              {items.map((it) => (
                <div key={it.id} className="summary-row">
                  <span style={{ fontSize: 13 }}>
                    {it.name} × {it.qty}
                  </span>
                  <span>₹{((it.price || 0) * (it.qty || 0)).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="divider" />
              <div className="summary-row">
                <span>Items total</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span style={{ color: "var(--green)", fontWeight: 700 }}>FREE</span>
              </div>
              {disc > 0 && (
                <div className="summary-row">
                  <span style={{ color: "var(--green)" }}>Discount ({couponCode})</span>
                  <span style={{ color: "var(--green)" }}>−₹{disc.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="divider" />
              <div className="summary-total">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
