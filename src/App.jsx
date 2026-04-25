import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { isAuthenticated } from "./auth/auth";
import { injectStyles } from "./styles/eyelensStyles";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import MobileBottomNav from "./components/MobileBottomNav";
import FloatingScrollToTop from "./components/FloatingScrollToTop";
import { api } from "./api/axiosInstance";
import HomePage from "./pages/HomePage";
import PLPPage from "./pages/PLPPage";
import PDPPage from "./pages/PDPPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountPage from "./pages/AccountPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import useLocalStorage from "./hooks/useLocalStorage";
import { mergeCartLines } from "./utils/mergeCartLines";
import { buildGlobalJsonLd } from "./utils/seoSchemas";

function mapPrescription(rx) {
  if (!rx) return null;
  return {
    id: String(rx._id || rx.id || ""),
    date: rx.date ? String(rx.date).slice(0, 10) : "",
    patientName: rx.patientName || "",
    odSphere: rx.odSphere || "",
    odCylinder: rx.odCylinder || "",
    odAxis: rx.odAxis || "",
    osSphere: rx.osSphere || "",
    osCylinder: rx.osCylinder || "",
    osAxis: rx.osAxis || "",
    add: rx.add || "",
    pd: rx.pd || "",
    notes: rx.notes || "",
  };
}

export default function App() {
  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "eyelens-global-jsonld";
    el.textContent = JSON.stringify(buildGlobalJsonLd());
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, []);

  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useLocalStorage("eyelens_cart", []);
  const [prescriptions, setPrescriptions] = useState([]);
  const [toast, setToast] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [cartCoupon, setCartCoupon] = useState({ code: "", discountAmount: 0 });
  const [cartPulseTick, setCartPulseTick] = useState(0);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated()) {
      setWishlistIds([]);
      return;
    }
    try {
      const { data } = await api.get("/users/wishlist");
      setWishlistIds((data.data || []).map((p) => String(p._id || p.id)));
    } catch {
      setWishlistIds([]);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const loadPrescriptions = useCallback(async () => {
    if (!isAuthenticated()) {
      setPrescriptions([]);
      return;
    }
    try {
      const { data } = await api.get("/users/me/prescriptions");
      setPrescriptions((data.data || []).map(mapPrescription).filter((x) => x?.id));
    } catch {
      setPrescriptions([]);
    }
  }, []);

  useEffect(() => {
    const onAuthChanged = () => {
      void loadWishlist();
      void loadPrescriptions();
      if (isAuthenticated()) {
        setCartItems((prev) => mergeCartLines(prev || []));
      }
    };
    window.addEventListener("eyelens-auth-changed", onAuthChanged);
    return () => window.removeEventListener("eyelens-auth-changed", onAuthChanged);
  }, [loadWishlist, loadPrescriptions, setCartItems]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    setCartItems((prev) => mergeCartLines(prev || []));
  }, [setCartItems]);

  const showToast = useCallback((msgOrOpts) => {
    if (typeof msgOrOpts === "string") setToast({ msg: msgOrOpts, type: "success" });
    else setToast(msgOrOpts);
  }, []);

  const finalizeCheckout = useCallback(() => {
    setCartItems([]);
    setCartCoupon({ code: "", discountAmount: 0 });
  }, [setCartItems]);

  const handlePlaceOrder = useCallback(
    async (delivery, paymentMethod, cartItemsToPlace, couponCode = "", options = {}) => {
      if (!cartItemsToPlace?.length) return null;
      const items = cartItemsToPlace
        .map((i) => {
          const lensPrice = Number(i.lens?.price) || 0;
          const line = {
            productId: i.productId,
            qty: i.qty || 1,
            lensPrice,
          };
          if (i.lens && (i.lens.id || i.lens.name)) {
            line.lens = {
              id: i.lens.id,
              name: i.lens.name,
              price: lensPrice,
            };
          }
          if (i.prescription && typeof i.prescription === "object") {
            line.prescription = i.prescription;
          }
          if (i.frameOptions && typeof i.frameOptions === "object") {
            line.frameOptions = i.frameOptions;
          }
          return line;
        })
        .filter((i) => i.productId);
      if (!items.length) {
        showToast({ msg: "Cart items need product IDs — remove and re-add from the shop.", type: "error" });
        return null;
      }
      const fullName = [delivery.firstName, delivery.lastName].filter(Boolean).join(" ").trim();
      const shippingAddress = {
        fullName: fullName || delivery.fullName,
        firstName: delivery.firstName,
        lastName: delivery.lastName,
        phone: delivery.phone,
        address: delivery.address,
        city: delivery.city,
        state: delivery.state,
        pincode: delivery.pincode,
      };
      const deferClear = options.deferClearCart === true;
      const suppressSuccessToast = options.suppressSuccessToast === true;
      try {
        const pm =
          paymentMethod === "razorpay"
            ? "razorpay"
            : paymentMethod === "card"
              ? "card"
              : paymentMethod === "upi"
                ? "upi"
                : "cod";
        const payload = {
          items,
          shippingAddress,
          paymentMethod: pm,
        };
        if (couponCode && String(couponCode).trim()) payload.couponCode = String(couponCode).trim();
        const { data: body } = await api.post("/orders", payload);
        if (!body?.success) {
          throw new Error(body?.message || "Order failed");
        }
        if (!deferClear) {
          setCartItems([]);
          setCartCoupon({ code: "", discountAmount: 0 });
        }
        if (!suppressSuccessToast) {
          showToast({ msg: "Order placed! 🎉", type: "success" });
        }
        return body?.data;
      } catch (e) {
        const msg = e.response?.data?.message || e.message || "Could not place order.";
        showToast({ msg, type: "error" });
        throw e;
      }
    },
    [setCartItems, showToast]
  );

  const location = useLocation();

  const toggleWishlistId = useCallback(
    async (productId) => {
      const id = String(productId || "");
      if (!id) return;
      if (!isAuthenticated()) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      const on = wishlistIds.includes(id);
      try {
        if (on) await api.delete(`/users/wishlist/${id}`);
        else await api.post(`/users/wishlist/${id}`);
        await loadWishlist();
      } catch {
        showToast({ msg: "Could not update wishlist.", type: "error" });
      }
    },
    [wishlistIds, loadWishlist, navigate, showToast, location.pathname]
  );

  const page = location.pathname.replace("/", "") || "home";
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    const path = location.pathname;
    const needsPrescriptions = path.startsWith("/product/") || path.startsWith("/account");
    if (needsPrescriptions) {
      void loadPrescriptions();
    }
  }, [loadPrescriptions, location.pathname]);

  const goTo = useCallback(
    (p) => {
      navigate(p === "home" ? "/" : `/${p}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate]
  );

  const cartQty = useMemo(() => cartItems.reduce((s, i) => s + (i.qty || 0), 0), [cartItems]);

  const startFrameSelection = useCallback(
    (p) => {
      setSelectedProduct(p);
      const id = p?._id || p?.id;
      if (id) navigate(`/product/${id}`);
      else navigate("/plp");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate]
  );

  const addConfiguredToCart = useCallback(
    ({ frame, configuration }) => {
      const productId = String(frame?._id || "");
      if (!productId) {
        showToast({ msg: "This item is currently unavailable.", type: "error" });
        return;
      }
      const basePrice =
        frame.rawPrice != null
          ? Number(frame.rawPrice)
          : Number(String(frame.price || "").replace(/[^\d]/g, "")) || 0;
      const mrpNum =
        frame.rawOrigPrice != null
          ? Number(frame.rawOrigPrice)
          : Number(String(frame.origPrice || "").replace(/[^\d]/g, "")) || 0;
      const frameMrp = mrpNum > basePrice ? mrpNum : undefined;
      const lensPrice = configuration?.lens?.price || 0;
      const totalPrice = basePrice + lensPrice;
      const imageUrl =
        frame.imageUrl || (Array.isArray(frame.images) && frame.images[0] ? frame.images[0] : "") || "";
      setCartItems((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          productId,
          brand: frame.brand,
          name: frame.name,
          emoji: frame.emoji,
          imageUrl,
          bg: frame.bg,
          framePrice: basePrice,
          frameMrp,
          lens: configuration?.lens || null,
          prescription: configuration?.prescription || null,
          frameOptions: configuration?.frame
            ? { color: configuration.frame.color }
            : undefined,
          price: totalPrice,
          qty: 1,
        },
      ]);
      showToast("Added to cart! 🛒");
      setCartPulseTick((x) => x + 1);
    },
    [setCartItems, showToast]
  );

  return (
    <div style={{ fontFamily: "var(--font-b)", background: "var(--background)", color: "var(--text-primary)" }}>
      <Navbar page={page} cartQty={cartQty} wishlist={wishlistIds} cartPulseTick={cartPulseTick} />

      <main id="main-content" tabIndex={-1}>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              setPage={goTo}
              onSelectProduct={startFrameSelection}
              wishlist={wishlistIds}
              onToggleWishlistId={toggleWishlistId}
              showToast={showToast}
            />
          }
        />
        <Route
          path="/plp"
          element={
            <PLPPage
              onSelectProduct={startFrameSelection}
              wishlist={wishlistIds}
              onToggleWishlistId={toggleWishlistId}
            />
          }
        />
        <Route
          path="/product/:productId"
          element={
            <PDPPage
              setPage={goTo}
              product={selectedProduct}
              prescriptions={prescriptions}
              onPrescriptionsRefresh={loadPrescriptions}
              onAddConfigured={addConfiguredToCart}
              wishlist={wishlistIds}
              onToggleWishlistId={toggleWishlistId}
              showToast={showToast}
            />
          }
        />
        <Route
          path="/cart"
          element={
            <CartPage
              setPage={goTo}
              items={cartItems}
              setItems={setCartItems}
              showToast={showToast}
              appliedCoupon={cartCoupon}
              setAppliedCoupon={setCartCoupon}
            />
          }
        />
        <Route element={<ProtectedRoute redirectTo="/login" />}>
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                setPage={goTo}
                items={cartItems}
                prescriptions={prescriptions}
                onUpdateItems={setCartItems}
                onPlaceOrder={handlePlaceOrder}
                onFinalizeCheckout={finalizeCheckout}
                showToast={showToast}
                couponCode={cartCoupon.code}
                couponDiscount={cartCoupon.discountAmount}
              />
            }
          />
          <Route path="/order/:orderId" element={<OrderTrackingPage />} />
          <Route
            path="/account"
            element={
              <AccountPage
                wishlist={wishlistIds}
                onToggleWishlistId={toggleWishlistId}
                onSelectProduct={startFrameSelection}
                showToast={showToast}
                onWishlistRefresh={loadWishlist}
                onPrescriptionsRefresh={loadPrescriptions}
              />
            }
          />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/about" element={<AboutPage setPage={goTo} />} />
        <Route path="/contact" element={<ContactPage setPage={goTo} />} />

        <Route
          path="*"
          element={
            <div
              style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 64,
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>👓</div>
              <h1
                style={{
                  fontFamily: "var(--font-d)",
                  fontSize: 32,
                  fontWeight: 800,
                  color: "var(--black)",
                  marginBottom: 8,
                }}
              >
                Page not found
              </h1>
              <p style={{ color: "var(--g500)", marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
              <button className="btn btn-primary" onClick={() => navigate("/")}>
                Back to Home
              </button>
            </div>
          }
        />
      </Routes>
      </main>

      <Footer />
      <FloatingScrollToTop />
      <MobileBottomNav page={page} cartQty={cartQty} />
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}