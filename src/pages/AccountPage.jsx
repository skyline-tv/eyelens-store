import { useState, useEffect, useCallback, useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api/axiosInstance";
import { getUser, setStoredUser } from "../auth/auth";
import ProductCard from "../components/ProductCard";
import { mapApiProduct } from "../utils/productMap";
import { setPageSeo } from "../utils/seo";

const getResponsiveStyles = (isMobile) => ({
  accountLayout: {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? 20 : 40,
    alignItems: "flex-start",
  },
  sidebar: {
    width: isMobile ? "100%" : 280,
    position: isMobile ? "sticky" : "relative",
    top: isMobile ? 70 : 0,
    zIndex: 10,
    background: "var(--g50)",
    paddingBottom: isMobile ? 10 : 0,
  },
  navContainer: {
    display: "flex",
    flexDirection: isMobile ? "row" : "column",
    overflowX: isMobile ? "auto" : "visible",
    whiteSpace: isMobile ? "nowrap" : "normal",
    gap: isMobile ? 8 : 4,
    padding: isMobile ? "8px 0" : 0,
    scrollbarWidth: "none",
  },
  mainContent: {
    flex: 1,
    width: "100%",
    minWidth: 0,
  },
});

function statusBadgeClass(s) {
  const x = String(s || "").toLowerCase();
  if (x === "delivered") return "badge-delivered";
  if (x === "shipped") return "badge-shipped";
  if (x === "confirmed") return "badge-confirmed";
  if (x === "pending") return "badge-pending";
  if (x === "cancelled") return "badge-cancelled";
  return "badge-pending";
}

function formatOrderStatus(s) {
  const x = String(s || "").trim();
  if (!x) return "—";
  return x.charAt(0).toUpperCase() + x.slice(1);
}

function returnBadgeClass(rs) {
  const x = String(rs || "").toLowerCase();
  if (x === "approved" || x === "completed") return "badge-delivered";
  if (x === "rejected") return "badge-cancelled";
  if (x === "requested") return "badge-pending";
  return "badge-pending";
}

function canRequestReturn(o) {
  if (String(o?.status || "").toLowerCase() !== "delivered" || !o?.deliveredAt) return false;
  const rs = o.returnStatus;
  if (rs && String(rs).toLowerCase() !== "rejected") return false;
  const days = (Date.now() - new Date(o.deliveredAt).getTime()) / (24 * 60 * 60 * 1000);
  return days <= 7;
}

export default function AccountPage({
  wishlist = [],
  onToggleWishlistId,
  onSelectProduct,
  showToast,
  onWishlistRefresh,
  onPrescriptionsRefresh,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "orders";
  const setTab = (id) => setSearchParams(id === "orders" ? {} : { tab: id });
  const navigate = useNavigate();

  useEffect(() => {
    const labels = {
      orders: "Orders",
      wishlist: "Wishlist",
      profile: "Profile",
      address: "Addresses",
      prescription: "Prescriptions",
      settings: "Settings",
    };
    const label = labels[tab] || "Account";
    const restore = setPageSeo({
      title: `Eyelens account — ${label}`,
      description:
        "Manage Eyelens orders, wishlist, saved prescriptions, and addresses. Sign in required for a personalised experience.",
      canonicalPath: "/account",
      noindex: true,
    });
    return () => restore();
  }, [tab]);

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [wishProducts, setWishProducts] = useState([]);
  const [wishLoading, setWishLoading] = useState(false);
  const [rx, setRx] = useState({
    patientName: "",
    date: new Date().toISOString().slice(0, 10),
    odSphere: "",
    odCylinder: "",
    odAxis: "",
    osSphere: "",
    osCylinder: "",
    osAxis: "",
    add: "",
    pd: "",
    notes: "",
  });
  const [savedPrescriptions, setSavedPrescriptions] = useState([]);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxSaving, setRxSaving] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState({
    label: "Home",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [settings, setSettings] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    smsUpdates: false,
  });
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const returnReasonRef = useRef(null);
  const returnPanelRef = useRef(null);

  const user = getUser();

  const closeReturnModal = useCallback(() => {
    if (!returnSubmitting) setReturnModalOrder(null);
  }, [returnSubmitting]);

  useFocusTrap(returnPanelRef, Boolean(returnModalOrder), { onEscape: closeReturnModal });

  useEffect(() => {
    if (!returnModalOrder) return undefined;
    const t = setTimeout(() => returnReasonRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [returnModalOrder]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user?.name || user?.email) {
      setProfile({ name: user.name || "", email: user.email || "" });
    }
  }, [user?.name, user?.email]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const { data } = await api.get("/orders/my");
      setOrders(data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "orders") loadOrders();
  }, [tab, loadOrders]);

  const loadWishlistProducts = useCallback(async () => {
    setWishLoading(true);
    try {
      const { data } = await api.get("/users/wishlist");
      setWishProducts((data.data || []).map(mapApiProduct));
    } catch {
      setWishProducts([]);
    } finally {
      setWishLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "wishlist") loadWishlistProducts();
  }, [tab, loadWishlistProducts, wishlist.length]);

  const downloadInvoice = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eyelens-invoice-${String(orderId).slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast?.({ msg: "Could not download invoice.", type: "error" });
    }
  };

  const loadPrescriptions = useCallback(async () => {
    setRxLoading(true);
    try {
      const { data } = await api.get("/users/me/prescriptions");
      setSavedPrescriptions(data.data || []);
    } catch {
      setSavedPrescriptions([]);
    } finally {
      setRxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "prescription") loadPrescriptions();
  }, [tab, loadPrescriptions]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("eyelens_addresses");
      if (raw) setAddresses(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const saveRx = async () => {
    setRxSaving(true);
    try {
      await api.post("/users/me/prescriptions", {
        patientName: rx.patientName,
        date: rx.date || new Date().toISOString().slice(0, 10),
        odSphere: rx.odSphere,
        odCylinder: rx.odCylinder,
        odAxis: rx.odAxis,
        osSphere: rx.osSphere,
        osCylinder: rx.osCylinder,
        osAxis: rx.osAxis,
        add: rx.add,
        pd: rx.pd,
        notes: rx.notes,
      });
      showToast?.({ msg: "Prescription saved.", type: "success" });
      setRx({
        patientName: "",
        date: new Date().toISOString().slice(0, 10),
        odSphere: "",
        odCylinder: "",
        odAxis: "",
        osSphere: "",
        osCylinder: "",
        osAxis: "",
        add: "",
        pd: "",
        notes: "",
      });
      await loadPrescriptions();
      await onPrescriptionsRefresh?.();
    } catch {
      showToast?.({ msg: "Could not save prescription.", type: "error" });
    } finally {
      setRxSaving(false);
    }
  };

  const addAddress = () => {
    if (!addrForm.address.trim() || !addrForm.pincode.trim()) {
      showToast?.({ msg: "Fill address and pincode.", type: "error" });
      return;
    }
    const next = [...addresses, { ...addrForm, id: Date.now() }];
    setAddresses(next);
    try {
      localStorage.setItem("eyelens_addresses", JSON.stringify(next));
      showToast?.({ msg: "Address saved.", type: "success" });
      setAddrForm({
        label: "Home",
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      });
    } catch {
      showToast?.({ msg: "Could not save address.", type: "error" });
    }
  };

  const removeAddress = (id) => {
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    try {
      localStorage.setItem("eyelens_addresses", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const { data } = await api.patch("/users/me", {
        name: profile.name.trim(),
        email: profile.email.trim().toLowerCase(),
      });
      if (data.data) setStoredUser(data.data);
      showToast?.({ msg: "Profile updated.", type: "success" });
    } catch (e) {
      showToast?.({ msg: e.response?.data?.message || "Update failed.", type: "error" });
    } finally {
      setProfileSaving(false);
    }
  };

  const navItems = [
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "wishlist", label: "Wishlist", icon: "♡" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "address", label: "Addresses", icon: "📍" },
    { id: "prescription", label: "Rx", icon: "👁️" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const r = getResponsiveStyles(isMobile);
  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  const pid = (p) => String(p._id || p.id || "");

  return (
    <div className="page-enter" style={{ paddingTop: isMobile ? 20 : 64, background: "var(--g50)", minHeight: "100vh" }}>
      <div className="container" style={{ padding: isMobile ? "0 16px" : "0 40px" }}>
        <div style={r.accountLayout}>
          <aside style={r.sidebar}>
            {!isMobile && (
              <div className="acct-profile" style={{ marginBottom: 30 }}>
                <div className="acct-avatar" role="img" aria-label={`${user?.name || "Member"} profile picture`}>
                  {initial}
                </div>
                <div className="acct-name" style={{ fontWeight: 800 }}>
                  {user?.name || "Member"}
                </div>
                <div className="acct-email" style={{ fontSize: 13, color: "var(--g500)" }}>
                  {user?.email || ""}
                </div>
              </div>
            )}

            <div className="acct-nav" style={r.navContainer}>
              {navItems.map((n) => (
                <div
                  key={n.id}
                  className={`acct-nav-item${tab === n.id ? " active" : ""}`}
                  style={{
                    padding: isMobile ? "10px 18px" : "12px 16px",
                    borderRadius: isMobile ? 25 : 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    background: tab === n.id ? (isMobile ? "var(--black)" : "var(--white)") : "transparent",
                    color: tab === n.id ? (isMobile ? "white" : "var(--black)") : "var(--g500)",
                    border: isMobile && tab !== n.id ? "1px solid var(--g200)" : "none",
                    boxShadow: !isMobile && tab === n.id ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                  }}
                  onClick={() => setTab(n.id)}
                  role="presentation"
                >
                  <span>{n.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: tab === n.id ? 700 : 500 }}>{n.label}</span>
                </div>
              ))}
            </div>
          </aside>

          <div style={r.mainContent}>
            {tab === "orders" && (
              <div style={{ animation: "fadeUp .3s" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>My orders</h2>
                {ordersLoading ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {[1, 2, 3].map((k) => (
                      <div
                        key={k}
                        style={{
                          height: 120,
                          borderRadius: 16,
                          background: "linear-gradient(90deg, var(--g100) 25%, var(--g50) 37%, var(--g100) 63%)",
                          backgroundSize: "400% 100%",
                          animation: "shimmer 1.2s ease-in-out infinite",
                          border: "1px solid var(--g100)",
                        }}
                      />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ background: "white", padding: 40, borderRadius: 16, textAlign: "center", border: "1px solid var(--g100)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden>📦</div>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>No orders yet</div>
                    <p style={{ color: "var(--g500)", marginBottom: 16, fontSize: 14 }}>When you place an order, it will show up here.</p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate("/plp")}>
                      Start shopping
                    </button>
                  </div>
                ) : (
                  orders.map((o) => (
                    <div
                      key={o._id}
                      className="order-item"
                      style={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        background: "white",
                        padding: 20,
                        borderRadius: 16,
                        marginBottom: 16,
                        gap: 16,
                        alignItems: isMobile ? "flex-start" : "center",
                        border: "1px solid var(--g100)",
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          background: "var(--g50)",
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                        }}
                      >
                        {o.items?.[0]?.emoji || "👓"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--em)" }}>
                          #{String(o._id).slice(-8).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 700 }}>{o.items?.length || 0} items</div>
                        <div style={{ fontSize: 12, color: "var(--g400)" }}>
                          {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: isMobile ? "left" : "right", width: isMobile ? "100%" : "auto" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                          ₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}
                        </div>
                        <span className={`badge ${statusBadgeClass(o.status)}`}>{formatOrderStatus(o.status)}</span>
                        {o.returnStatus ? (
                          <div style={{ marginTop: 8 }}>
                            <span className={`badge ${returnBadgeClass(o.returnStatus)}`} style={{ fontSize: 11 }}>
                              Return: {o.returnStatus}
                            </span>
                          </div>
                        ) : null}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, justifyContent: isMobile ? "flex-start" : "flex-end" }}>
                          {canRequestReturn(o) ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setReturnModalOrder(o);
                                setReturnReason("");
                              }}
                            >
                              Request return
                            </button>
                          ) : null}
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(`/order/${o._id}`)}>
                            Track Order
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadInvoice(o._id)}>
                            Download Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "profile" && (
              <div style={{ animation: "fadeUp .3s" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Profile</h2>
                <div style={{ background: "white", padding: isMobile ? 20 : 30, borderRadius: 16, border: "1px solid var(--g100)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
                    <div className="field">
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Name</label>
                      <input
                        className="input"
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="field">
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Email</label>
                      <input
                        className="input"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ marginTop: 24 }} onClick={saveProfile} disabled={profileSaving}>
                    {profileSaving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            )}

            {tab === "wishlist" && (
              <div style={{ animation: "fadeUp .3s" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Wishlist</h2>
                {wishLoading ? (
                  <div className="products-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                    {[1, 2, 3, 4].map((k) => (
                      <div
                        key={k}
                        style={{
                          height: 280,
                          borderRadius: 16,
                          background: "linear-gradient(90deg, var(--g100) 25%, var(--g50) 37%, var(--g100) 63%)",
                          backgroundSize: "400% 100%",
                          animation: "shimmer 1.2s ease-in-out infinite",
                          border: "1px solid var(--g100)",
                        }}
                      />
                    ))}
                  </div>
                ) : wishProducts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, background: "white", borderRadius: 16, border: "1px solid var(--g100)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden>
                      ♡
                    </div>
                    <p style={{ fontWeight: 800, marginBottom: 8 }}>No saved items yet</p>
                    <p style={{ color: "var(--g500)", marginBottom: 16, fontSize: 14 }}>Save frames you love to find them quickly later.</p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate("/plp")}>
                      Browse products
                    </button>
                  </div>
                ) : (
                  <div className="products-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                    {wishProducts.map((p) => (
                      <div key={pid(p)} style={{ position: "relative" }}>
                        <ProductCard
                          productId={pid(p)}
                          {...p}
                          wished
                          onToggleWish={async () => {
                            await onToggleWishlistId?.(pid(p));
                            await loadWishlistProducts();
                            onWishlistRefresh?.();
                          }}
                          onClick={() => onSelectProduct?.(p)}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ marginTop: 8, width: "100%" }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await onToggleWishlistId?.(pid(p));
                            await loadWishlistProducts();
                            onWishlistRefresh?.();
                          }}
                        >
                          Remove from wishlist
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "prescription" && (
              <div style={{ animation: "fadeUp .3s" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Prescription (saved to your account)</h2>
                <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid var(--g100)" }}>
                  <div className="form-row2" style={{ marginBottom: 12 }}>
                    <input
                      className="input"
                      placeholder="Patient name"
                      value={rx.patientName}
                      onChange={(e) => setRx((x) => ({ ...x, patientName: e.target.value }))}
                    />
                    <input
                      className="input"
                      type="date"
                      value={rx.date}
                      onChange={(e) => setRx((x) => ({ ...x, date: e.target.value }))}
                    />
                  </div>
                  <div style={{ fontWeight: 800, marginBottom: 12 }}>Right (OD)</div>
                  <div className="form-row2" style={{ marginBottom: 12 }}>
                    <input className="input" placeholder="SPH" value={rx.odSphere} onChange={(e) => setRx((x) => ({ ...x, odSphere: e.target.value }))} />
                    <input className="input" placeholder="CYL" value={rx.odCylinder} onChange={(e) => setRx((x) => ({ ...x, odCylinder: e.target.value }))} />
                    <input className="input" placeholder="AXIS" value={rx.odAxis} onChange={(e) => setRx((x) => ({ ...x, odAxis: e.target.value }))} />
                  </div>
                  <div style={{ fontWeight: 800, marginBottom: 12 }}>Left (OS)</div>
                  <div className="form-row2">
                    <input className="input" placeholder="SPH" value={rx.osSphere} onChange={(e) => setRx((x) => ({ ...x, osSphere: e.target.value }))} />
                    <input className="input" placeholder="CYL" value={rx.osCylinder} onChange={(e) => setRx((x) => ({ ...x, osCylinder: e.target.value }))} />
                    <input className="input" placeholder="AXIS" value={rx.osAxis} onChange={(e) => setRx((x) => ({ ...x, osAxis: e.target.value }))} />
                  </div>
                  <div className="form-row2" style={{ marginTop: 12 }}>
                    <input className="input" placeholder="ADD" value={rx.add} onChange={(e) => setRx((x) => ({ ...x, add: e.target.value }))} />
                    <input className="input" placeholder="PD" value={rx.pd} onChange={(e) => setRx((x) => ({ ...x, pd: e.target.value }))} />
                  </div>
                  <textarea
                    className="input"
                    rows={3}
                    style={{ width: "100%", marginTop: 12 }}
                    placeholder="Notes (optional)"
                    value={rx.notes}
                    onChange={(e) => setRx((x) => ({ ...x, notes: e.target.value }))}
                  />
                  <button type="button" className="btn btn-primary" style={{ marginTop: 20 }} onClick={saveRx}>
                    {rxSaving ? "Saving..." : "Save prescription"}
                  </button>
                </div>
                <div style={{ marginTop: 16, background: "white", padding: 18, borderRadius: 16, border: "1px solid var(--g100)" }}>
                  <div style={{ fontWeight: 800, marginBottom: 10 }}>Saved prescriptions</div>
                  {rxLoading ? (
                    <div style={{ color: "var(--g500)", fontSize: 13 }}>Loading...</div>
                  ) : savedPrescriptions.length === 0 ? (
                    <div style={{ color: "var(--g500)", fontSize: 13 }}>No prescriptions saved yet.</div>
                  ) : (
                    savedPrescriptions.map((p) => (
                      <div
                        key={String(p._id)}
                        style={{
                          border: "1px solid var(--g100)",
                          borderRadius: 12,
                          padding: 12,
                          marginTop: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--black)", fontSize: 14 }}>
                            {p.patientName || "Prescription"} {p.date ? `- ${String(p.date).slice(0, 10)}` : ""}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--g600)", marginTop: 4 }}>
                            OD {p.odSphere || "-"} / {p.odCylinder || "-"} / {p.odAxis || "-"} · OS {p.osSphere || "-"} / {p.osCylinder || "-"} / {p.osAxis || "-"}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={async () => {
                            try {
                              await api.delete(`/users/me/prescriptions/${p._id}`);
                              await loadPrescriptions();
                              await onPrescriptionsRefresh?.();
                              showToast?.({ msg: "Prescription deleted.", type: "success" });
                            } catch {
                              showToast?.({ msg: "Could not delete prescription.", type: "error" });
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {tab === "address" && (
              <div style={{ animation: "fadeUp .3s" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Addresses</h2>
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: "white",
                      padding: 16,
                      borderRadius: 12,
                      border: "1px solid var(--g100)",
                      marginBottom: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{a.label}</div>
                      <div style={{ fontSize: 13, color: "var(--g600)" }}>
                        {a.firstName} {a.lastName}, {a.phone}
                        <br />
                        {a.address}, {a.city}, {a.state} — {a.pincode}
                      </div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeAddress(a.id)}>
                      Delete
                    </button>
                  </div>
                ))}
                <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid var(--g100)", marginTop: 16 }}>
                  <div style={{ fontWeight: 800, marginBottom: 12 }}>Add address</div>
                  <div className="form-row2" style={{ marginBottom: 10 }}>
                    <input className="input" placeholder="Label" value={addrForm.label} onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))} />
                    <input className="input" placeholder="First name" value={addrForm.firstName} onChange={(e) => setAddrForm((f) => ({ ...f, firstName: e.target.value }))} />
                    <input className="input" placeholder="Last name" value={addrForm.lastName} onChange={(e) => setAddrForm((f) => ({ ...f, lastName: e.target.value }))} />
                    <input className="input" placeholder="Phone" value={addrForm.phone} onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <input
                    className="input"
                    style={{ marginBottom: 10 }}
                    placeholder="Street address"
                    value={addrForm.address}
                    onChange={(e) => setAddrForm((f) => ({ ...f, address: e.target.value }))}
                  />
                  <div className="form-row2">
                    <input className="input" placeholder="City" value={addrForm.city} onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))} />
                    <input className="input" placeholder="State" value={addrForm.state} onChange={(e) => setAddrForm((f) => ({ ...f, state: e.target.value }))} />
                    <input className="input" placeholder="Pincode" value={addrForm.pincode} onChange={(e) => setAddrForm((f) => ({ ...f, pincode: e.target.value }))} />
                  </div>
                  <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={addAddress}>
                    Save address
                  </button>
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div style={{ animation: "fadeUp .3s" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Settings</h2>
                <div style={{ background: "white", padding: isMobile ? 20 : 30, borderRadius: 16, border: "1px solid var(--g100)" }}>
                  {Object.keys(settings).map((key) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px 0",
                        borderBottom: "1px solid var(--g50)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {key.replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())
                            .trim()}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--g500)" }}>Notification preference</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, [key]: !s[key] }))}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          border: "none",
                          background: settings[key] ? "var(--em)" : "var(--g300)",
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 2,
                            left: settings[key] ? 22 : 2,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "white",
                            transition: ".2s",
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {returnModalOrder ? (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => {
            if (!returnSubmitting) setReturnModalOrder(null);
          }}
        >
          <div
            ref={returnPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-dialog-title"
            style={{
              background: "var(--card)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 440,
              width: "100%",
              border: "1px solid var(--g200)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="return-dialog-title"
              style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--text-primary)" }}
            >
              Request return
            </h3>
            <p style={{ fontSize: 13, color: "var(--g500)", marginBottom: 16 }}>
              Order #{String(returnModalOrder._id).slice(-8).toUpperCase()} — tell us why you&apos;d like to return this order.
            </p>
            <label htmlFor="eyelens-return-reason" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              Reason
            </label>
            <textarea
              ref={returnReasonRef}
              id="eyelens-return-reason"
              className="input"
              rows={4}
              style={{ width: "100%", resize: "vertical", minHeight: 100 }}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              disabled={returnSubmitting}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={returnSubmitting}
                onClick={() => setReturnModalOrder(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={returnSubmitting || !returnReason.trim()}
                onClick={async () => {
                  setReturnSubmitting(true);
                  try {
                    const { data } = await api.post(`/orders/${returnModalOrder._id}/return`, {
                      reason: returnReason.trim(),
                    });
                    if (!data?.success) throw new Error(data?.message || "Request failed");
                    showToast?.({ msg: "Return request submitted.", type: "success" });
                    setReturnModalOrder(null);
                    setReturnReason("");
                    await loadOrders();
                  } catch (e) {
                    showToast?.({
                      msg: e.response?.data?.message || e.message || "Could not submit return.",
                      type: "error",
                    });
                  } finally {
                    setReturnSubmitting(false);
                  }
                }}
              >
                {returnSubmitting ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .acct-nav::-webkit-scrollbar { display: none; }
        .input:focus { outline: none; border-color: var(--em) !important; }
        .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .badge-delivered { background: #e6fcf5; color: #0ca678; }
        .badge-shipped { background: #ede9fe; color: #5b21b6; }
        .badge-confirmed { background: #e0f2fe; color: #0369a1; }
        .badge-pending { background: #fff9db; color: #f08c00; }
        .badge-cancelled { background: #ffe3e3; color: #c92a2a; }
        html.dark .badge-delivered { background: rgba(34, 197, 94, 0.18); color: #4ade80; }
        html.dark .badge-shipped { background: rgba(139, 92, 246, 0.22); color: #c4b5fd; }
        html.dark .badge-confirmed { background: rgba(56, 189, 248, 0.18); color: #38bdf8; }
        html.dark .badge-pending { background: rgba(250, 204, 21, 0.14); color: #facc15; }
        html.dark .badge-cancelled { background: rgba(248, 113, 113, 0.18); color: #f87171; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }
        .form-row2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
      `}</style>
    </div>
  );
}
