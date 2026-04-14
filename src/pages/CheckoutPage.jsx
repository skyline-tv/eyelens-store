import { useState, useEffect, useCallback } from "react";
import { api } from "../api/axiosInstance";
import { getUser } from "../auth/auth";
import { setPageSeo } from "../utils/seo";

const errorTextStyle = { fontSize: 11, color: "var(--red)", marginTop: 4 };

function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Razorpay) return Promise.resolve();
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
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState({});
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "", name: "" });
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

  const framesSubtotal = items.reduce((a, i) => a + (i.framePrice || 0) * (i.qty || 0), 0);
  const lensesSubtotal = items.reduce((a, i) => a + ((i.lens?.price || 0) * (i.qty || 0)), 0);
  const subtotal = framesSubtotal + lensesSubtotal;
  const disc = Math.max(0, Number(couponDiscount) || 0);
  const shipping = subtotal > 999 ? 0 : 99;
  const taxable = Math.max(0, subtotal + shipping - disc);
  const gst = Math.round(taxable * 0.18 * 100) / 100;
  const total = Math.round((taxable + gst) * 100) / 100;

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
    if (payTab === "razorpay") {
      /* no extra fields */
    }
    if (payTab === "upi") {
      if (!upiId.trim()) nextErrors.upiId = "Enter UPI ID or select COD";
    }
    if (payTab === "card") {
      const cleanCardNumber = cardDetails.number.replace(/\s/g, "");
      if (!/^\d{16}$/.test(cleanCardNumber)) nextErrors.cardNumber = "Enter a valid 16-digit card number";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry.replace(/\s/g, ""))) nextErrors.expiry = "Use MM/YY";
      if (!/^\d{3}$/.test(cardDetails.cvv.trim())) nextErrors.cvv = "Valid CVV required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const persistAddressIfNeeded = useCallback(() => {
    if (saveAddress && typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("eyelens_addresses");
        const list = raw ? JSON.parse(raw) : [];
        const entry = {
          id: Date.now(),
          ...delivery,
          label: "Saved",
        };
        window.localStorage.setItem("eyelens_addresses", JSON.stringify([entry, ...list].slice(0, 10)));
      } catch {
        /* ignore */
      }
    }
  }, [delivery, saveAddress]);

  const handlePlace = async () => {
    if (!items.length) return;
    setPlacing(true);
    setErrors({});
    try {
      if (payTab === "razorpay") {
        const order = await onPlaceOrder?.(delivery, "razorpay", items, couponCode, {
          deferClearCart: true,
          suppressSuccessToast: true,
        });
        if (!order?._id) {
          setPlacing(false);
          return;
        }
        const { data: co } = await api.post("/payments/create-order", {
          orderId: order._id,
          amount: total,
          currency: "INR",
        });
        if (!co?.success) {
          throw new Error(co?.message || "Could not start payment");
        }
        const { orderId: rzpOrderId, amount, currency, keyId } = co.data || {};
        await loadRazorpayScript();
        const user = getUser();
        await new Promise((resolve) => {
          const rzp = new window.Razorpay({
            key: keyId,
            amount,
            currency,
            order_id: rzpOrderId,
            name: "Eyelens",
            description: "Order payment",
            prefill: { email: user?.email || "" },
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
              } finally {
                resolve();
              }
            },
            modal: {
              ondismiss: () => {
                showToast?.({
                  msg: "Payment was not completed. You can tap Place order again to retry.",
                  type: "error",
                });
                resolve();
              },
            },
            theme: { color: "#1e293b" },
          });
          rzp.on("payment.failed", () => {
            showToast?.({ msg: "Payment failed. Please try again or use COD.", type: "error" });
          });
          rzp.open();
        });
        return;
      }

      const order = await onPlaceOrder?.(delivery, payTab, items, couponCode);
      if (order) {
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
    if (x === "upi") return "UPI";
    if (x === "card") return "Card";
    return m || "—";
  };

  if (orderDone) {
    const oid = orderDone._id ? String(orderDone._id) : "";
    const paidOnline = String(orderDone.paymentStatus || "").toLowerCase() === "paid" && orderDone.paymentMethod === "razorpay";
    return (
      <div className="page-enter" style={{ paddingTop: 64, background: "var(--g50)", minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: 520, paddingTop: 48, textAlign: "center" }}>
          <div style={{ fontSize: 72, marginBottom: 16, animation: "pulse 0.6s ease" }}>✓</div>
          <h1 style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 800, color: "var(--black)", marginBottom: 8 }}>
            Order confirmed
          </h1>
          {paidOnline ? (
            <div style={{ marginBottom: 12 }}>
              <span
                className="badge badge-delivered"
                style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1 }}
              >
                PAID
              </span>
            </div>
          ) : null}
          <p style={{ fontSize: 13, color: "var(--g600)", marginBottom: 8 }}>
            Payment: <strong>{payMethodLabel(orderDone.paymentMethod)}</strong>
            {String(orderDone.paymentStatus || "").toLowerCase() === "pending" && orderDone.paymentMethod === "cod" ? (
              <span style={{ color: "var(--g500)" }}> (pay on delivery)</span>
            ) : null}
          </p>
          <p style={{ color: "var(--g500)", marginBottom: 24 }}>
            Thank you! Your order ID is{" "}
            <strong style={{ color: "var(--em-dark)" }}>{oid.slice(-8).toUpperCase()}</strong>
          </p>
          <p style={{ fontSize: 13, color: "var(--g400)", marginBottom: 28 }}>We&apos;ve sent the details to your email.</p>
          <button className="btn btn-primary" onClick={() => setPage("account")}>
            View my orders
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setPage("home")}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ paddingTop: 64, background: "var(--g50)", minHeight: "100vh" }}>
      <div className="container">
        <div style={{ paddingTop: 32, marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-d)", fontSize: 32, fontWeight: 800, color: "var(--black)" }}>Checkout</h1>
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
                style={{ opacity: s > step ? 0.5 : 1 }}
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
                <div className="form-row2" style={{ marginBottom: 14 }}>
                  <div>
                    <label className="field-label">First name</label>
                    <input
                      className="input"
                      value={delivery.firstName}
                      onChange={(e) => setDelivery((d) => ({ ...d, firstName: e.target.value }))}
                    />
                    {errors.firstName && <div style={errorTextStyle}>{errors.firstName}</div>}
                  </div>
                  <div>
                    <label className="field-label">Last name</label>
                    <input
                      className="input"
                      value={delivery.lastName}
                      onChange={(e) => setDelivery((d) => ({ ...d, lastName: e.target.value }))}
                    />
                    {errors.lastName && <div style={errorTextStyle}>{errors.lastName}</div>}
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">Phone</label>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={delivery.phone}
                    onChange={(e) => setDelivery((d) => ({ ...d, phone: e.target.value }))}
                  />
                  {errors.phone && <div style={errorTextStyle}>{errors.phone}</div>}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">Address</label>
                  <input
                    className="input"
                    value={delivery.address}
                    onChange={(e) => setDelivery((d) => ({ ...d, address: e.target.value }))}
                  />
                  {errors.address && <div style={errorTextStyle}>{errors.address}</div>}
                </div>
                <div className="form-row2" style={{ marginBottom: 14 }}>
                  <div>
                    <label className="field-label">City</label>
                    <input
                      className="input"
                      value={delivery.city}
                      onChange={(e) => setDelivery((d) => ({ ...d, city: e.target.value }))}
                    />
                    {errors.city && <div style={errorTextStyle}>{errors.city}</div>}
                  </div>
                  <div>
                    <label className="field-label">State</label>
                    <input
                      className="input"
                      value={delivery.state}
                      onChange={(e) => setDelivery((d) => ({ ...d, state: e.target.value }))}
                    />
                    {errors.state && <div style={errorTextStyle}>{errors.state}</div>}
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">Pincode</label>
                  <input
                    className="input"
                    value={delivery.pincode}
                    onChange={(e) => setDelivery((d) => ({ ...d, pincode: e.target.value }))}
                  />
                  {errors.pincode && <div style={errorTextStyle}>{errors.pincode}</div>}
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                  Save this address for next time
                </label>
                <button type="button" className="btn btn-primary" style={{ marginTop: 20 }} onClick={goNext}>
                  Continue to payment
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="checkout-section">
                <div className="section-heading">
                  <div className="section-num">2</div>Payment method
                </div>
                <div className="pay-tabs">
                  {[
                    ["cod", "Cash on Delivery"],
                    ...(rzpAvailable ? [["razorpay", "Pay online"]] : []),
                    ["upi", "UPI"],
                    ["card", "Card"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`pay-tab${payTab === id ? " active" : ""}`}
                      onClick={() => {
                        setPayTab(id);
                        setErrors({});
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {(payTab === "upi" || payTab === "card") && (
                  <div
                    role="status"
                    style={{
                      marginTop: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "var(--g50)",
                      border: "1px solid var(--g200)",
                      fontSize: 12,
                      color: "var(--g600)",
                      lineHeight: 1.55,
                    }}
                  >
                    <strong style={{ color: "var(--black)" }}>Preview only:</strong> UPI and card fields here are for UI and
                    testing. Live payments use <strong>Pay online (Razorpay)</strong> when keys are configured, or choose{" "}
                    <strong>Cash on Delivery</strong> to complete your order now.
                  </div>
                )}
                {payTab === "cod" && (
                  <div style={{ background: "#FEF8EE", borderRadius: 10, padding: 16, marginTop: 12 }}>
                    <p style={{ fontSize: 13, color: "var(--amber)", fontWeight: 600 }}>Pay with cash when your order arrives.</p>
                  </div>
                )}
                {payTab === "razorpay" && (
                  <div style={{ background: "var(--g50)", borderRadius: 10, padding: 16, marginTop: 12, border: "1px solid var(--g100)" }}>
                    <p style={{ fontSize: 13, color: "var(--g600)", fontWeight: 600 }}>
                      You&apos;ll complete payment securely via Razorpay on the next step.
                    </p>
                  </div>
                )}
                {payTab === "upi" && (
                  <div className="pay-panel active" style={{ marginTop: 12 }}>
                    <div
                      style={{
                        height: 140,
                        background: "var(--g100)",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--g500)",
                        fontSize: 13,
                        marginBottom: 12,
                      }}
                    >
                      QR placeholder — scan in your UPI app
                    </div>
                    <input
                      className="input"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    {errors.upiId && <div style={errorTextStyle}>{errors.upiId}</div>}
                  </div>
                )}
                {payTab === "card" && (
                  <div className="pay-panel active" style={{ marginTop: 12 }}>
                    <label className="field-label">Name on card</label>
                    <input
                      className="input"
                      style={{ marginBottom: 12 }}
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails((d) => ({ ...d, name: e.target.value }))}
                    />
                    <label className="field-label">Card number</label>
                    <input
                      className="input"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails((d) => ({ ...d, number: e.target.value }))}
                    />
                    {errors.cardNumber && <div style={errorTextStyle}>{errors.cardNumber}</div>}
                    <div className="form-row2" style={{ marginTop: 12 }}>
                      <div>
                        <label className="field-label">Expiry</label>
                        <input
                          className="input"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails((d) => ({ ...d, expiry: e.target.value }))}
                        />
                        {errors.expiry && <div style={errorTextStyle}>{errors.expiry}</div>}
                      </div>
                      <div>
                        <label className="field-label">CVV</label>
                        <input
                          className="input"
                          type="password"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails((d) => ({ ...d, cvv: e.target.value }))}
                        />
                        {errors.cvv && <div style={errorTextStyle}>{errors.cvv}</div>}
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary" onClick={goNext}>
                    Review order
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
                    {payTab === "cod"
                      ? "Cash on Delivery"
                      : payTab === "razorpay"
                        ? "Pay online (Razorpay)"
                        : payTab === "upi"
                          ? "UPI"
                          : "Card (UI)"}
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
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePlace}
                    disabled={placing || !items.length}
                    style={{ minWidth: 200 }}
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
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? "var(--green)" : undefined }}>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
              </div>
              {disc > 0 && (
                <div className="summary-row">
                  <span style={{ color: "var(--green)" }}>Discount ({couponCode})</span>
                  <span style={{ color: "var(--green)" }}>−₹{disc.toLocaleString("en-IN")}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
