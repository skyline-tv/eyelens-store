import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axiosInstance";
import { mapApiProduct } from "../utils/productMap";
import { setPageSeo } from "../utils/seo";
import { absoluteUrl } from "../config/site.js";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "../utils/seoSchemas.js";
import { isAuthenticated } from "../auth/auth";
import { pushRecentlyViewed, getRecentlyViewedIds } from "../utils/recentlyViewed";
import ProductCard from "../components/ProductCard";
import ConfirmModal from "../components/ConfirmModal";

const lensPlans = [
  { id: "basic", name: "Basic lenses", desc: "Single vision · Standard coating", price: 0, badge: "Included" },
  { id: "computer_free", name: "Computer lens", desc: "Blue light comfort · Free (no phone needed)", price: 0, badge: "Free" },
  { id: "bluecut", name: "Blue-cut lenses", desc: "Blue light filter · Anti-glare", price: 799, badge: "Popular" },
  { id: "antiglare", name: "Anti-glare lenses", desc: "Night driving · Reduced reflections", price: 999, badge: null },
  { id: "progressive", name: "Progressive lenses", desc: "Multi-focus · Reading + distance", price: 1999, badge: "Premium" },
];

const FALLBACK_FRAME = {
  brand: "Eyelens Premium",
  name: "Milano Round Titanium",
  price: "₹4,299",
  origPrice: "₹5,999",
  rawPrice: 4299,
  rawOrigPrice: 5999,
  emoji: "🕶️",
  badge: "NEW",
};

export default function PDPPage({
  setPage,
  product: productProp,
  prescriptions = [],
  onAddConfigured,
  wishlist = [],
  onToggleWishlistId,
  showToast,
}) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(Boolean(productId));
  const [loadErr, setLoadErr] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ canReview: false, hasReviewed: false });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reviewGateOpen, setReviewGateOpen] = useState(false);
  const [reviewImageFile, setReviewImageFile] = useState(null);
  const [reviewImagePreview, setReviewImagePreview] = useState("");
  const [recentList, setRecentList] = useState([]);
  const [wishRemoveOpen, setWishRemoveOpen] = useState(false);
  const [shipPincode, setShipPincode] = useState("");
  const [shipError, setShipError] = useState("");
  const [shipResult, setShipResult] = useState(null);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    let c = false;
    (async () => {
      try {
        const { data } = await api.get(`/products/${productId}`);
        if (!c) {
          setRemote(mapApiProduct(data.data));
          pushRecentlyViewed(productId);
        }
      } catch (e) {
        if (!c) setLoadErr(e.response?.data?.message || "Could not load product");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!productId) return undefined;
    let c = false;
    (async () => {
      setReviewLoading(true);
      try {
        const { data } = await api.get(`/products/${productId}/reviews`);
        if (!c) {
          setReviews(data.data || []);
          setReviewMeta(data.meta || { canReview: false, hasReviewed: false });
        }
      } catch {
        if (!c) setReviews([]);
      } finally {
        if (!c) setReviewLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [productId]);

  useEffect(() => {
    let c = false;
    (async () => {
      const ids = getRecentlyViewedIds().filter((id) => id !== String(productId)).slice(0, 6);
      if (!ids.length) {
        setRecentList([]);
        return;
      }
      try {
        const results = await Promise.all(
          ids.map((id) => api.get(`/products/${id}`).then((r) => mapApiProduct(r.data.data)).catch(() => null))
        );
        if (!c) setRecentList(results.filter(Boolean));
      } catch {
        if (!c) setRecentList([]);
      }
    })();
    return () => {
      c = true;
    };
  }, [productId]);

  useEffect(() => () => {
    if (reviewImagePreview) URL.revokeObjectURL(reviewImagePreview);
  }, [reviewImagePreview]);

  const frame = useMemo(() => {
    const raw = remote || productProp;
    if (!raw) return FALLBACK_FRAME;
    if (raw.price && String(raw.price).startsWith("₹")) return raw;
    try {
      return mapApiProduct(raw);
    } catch {
      return FALLBACK_FRAME;
    }
  }, [remote, productProp]);

  useEffect(() => {
    const pid = productId || frame?._id;
    if (!frame?.name || !pid) return undefined;
    const brand = frame.brand || "Eyelens";
    const title = `${brand} ${frame.name}`.replace(/\s+/g, " ").trim();
    const desc = `Shop ${frame.name} by ${brand}. Power-ready frames, lens upgrades at checkout, COD on eligible orders.${
      frame.outOfStock ? " Currently out of stock—explore similar styles in our shop." : ""
    }`.replace(/\s+/g, " ").trim();
    const toAbs = (u) => {
      const s = String(u || "").trim();
      if (!s) return "";
      if (/^https?:\/\//i.test(s)) return s;
      return absoluteUrl(s.startsWith("/") ? s : `/${s}`);
    };
    const imgList = (Array.isArray(frame.images) ? frame.images : []).map(toAbs).filter(Boolean);
    const ogImage = imgList[0];
    const productPath = `/product/${pid}`;
    const jsonLd = [
      buildBreadcrumbJsonLd([
        { name: "Home", url: absoluteUrl("/") },
        { name: "Shop", url: absoluteUrl("/plp") },
        { name: String(frame.name).slice(0, 120), url: absoluteUrl(productPath) },
      ]),
      buildProductJsonLd({
        name: frame.name,
        brand,
        description: frame.description || desc,
        productUrl: absoluteUrl(productPath),
        imageUrls: imgList,
        price: frame.rawPrice != null ? frame.rawPrice : 0,
        availability: frame.outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        sku: String(pid).slice(-12),
        aggregateRating:
          frame.reviewCount > 0
            ? { ratingValue: (frame.averageRating || 4.5).toFixed(1), reviewCount: String(frame.reviewCount) }
            : undefined,
      }),
    ];
    const restore = setPageSeo({
      title,
      description: desc,
      canonicalPath: productPath,
      keywords: "buy prescription glasses online, sunglasses India, eyeglasses, Eyelens",
      ogImage: ogImage || undefined,
      jsonLd,
    });
    return () => restore();
  }, [frame, productId]);

  const [color, setColor] = useState("");
  const [tab, setTab] = useState("overview");
  const [step, setStep] = useState("frame"); // frame -> lenses
  const [lensPlan, setLensPlan] = useState(null);
  const [selectedRxId, setSelectedRxId] = useState("");
  const [addedPDP, setAddedPDP] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const oos = Boolean(frame.outOfStock);

  const pdpSavePct =
    frame.rawOrigPrice && frame.rawPrice && frame.rawOrigPrice > frame.rawPrice
      ? Math.round((1 - frame.rawPrice / frame.rawOrigPrice) * 100)
      : 0;

  const colors = useMemo(() => {
    if (Array.isArray(frame.colors) && frame.colors.length > 0) {
      return frame.colors
        .map((c) => ({
          name: String(c.name || "").trim(),
          hex: String(c.hex || "").trim() || "var(--g200)",
          images: Array.isArray(c.images) ? c.images.filter(Boolean) : [],
        }))
        .filter((c) => c.name);
    }
    return [
      { name: "Midnight Black", hex: "#231F20", images: [] },
      { name: "Forest Green", hex: "var(--em)", images: [] },
      { name: "Tortoise Brown", hex: "#7A5C30", images: [] },
      { name: "Crystal Clear", hex: "#D4E8F0", images: [] },
    ];
  }, [frame.colors]);
  const activeColor = colors.find((c) => c.name === color) || colors[0] || null;
  const activeImages =
    activeColor && activeColor.images.length ? activeColor.images : Array.isArray(frame.images) ? frame.images : [];

  useEffect(() => {
    if (!colors.length) return;
    setColor((prev) => (prev && colors.some((c) => c.name === prev) ? prev : colors[0].name));
  }, [colors]);

  useEffect(() => {
    setImgIdx(0);
  }, [color, frame._id, frame.id]);

  useEffect(() => {
    if (!activeImages.length) return;
    if (imgIdx >= activeImages.length) setImgIdx(0);
  }, [imgIdx, activeImages.length]);

  const selectedRx =
    selectedRxId ? prescriptions.find((p) => String(p.id) === String(selectedRxId)) || null : null;

  const canAddToBag = step !== "lenses" ? true : !!lensPlan;

  const wished = wishlist.map(String).includes(String(productId));
  const loggedIn = isAuthenticated();
  const ownReview = reviews.find((r) => r.isMine);
  const reviewAvg =
    frame.reviewCount > 0
      ? Number(frame.averageRating || 0)
      : reviews.length
        ? Math.round((reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length) * 10) / 10
        : 0;
  const reviewCount = frame.reviewCount || reviews.length;

  const handleWish = async (e) => {
    e?.stopPropagation?.();
    if (!productId) return;
    if (!isAuthenticated()) {
      navigate("/login", { state: { from: `/product/${productId}` } });
      return;
    }
    if (wished) {
      setWishRemoveOpen(true);
      return;
    }
    await onToggleWishlistId?.(productId);
  };

  const handleWriteReview = () => {
    if (!loggedIn) {
      showToast?.({ msg: "Please login to write a review", type: "error" });
      navigate("/login", { state: { from: `/product/${productId}` } });
      return;
    }
    setReviewGateOpen((open) => !open);
  };

  const toggleWishlistFromCta = async () => {
    if (!productId) return;
    if (!isAuthenticated()) {
      showToast?.({ msg: "Please log in to save to wishlist", type: "info" });
      navigate("/login", { state: { from: `/product/${productId}` } });
      return;
    }
    const wasWished = wished;
    await onToggleWishlistId?.(productId);
    showToast?.({ msg: wasWished ? "Removed from wishlist" : "Added to wishlist", type: "success" });
  };

  const checkPincode = () => {
    const pin = shipPincode.trim();
    setShipError("");
    setShipResult(null);
    if (!/^\d{6}$/.test(pin)) {
      setShipError("Please enter a valid 6-digit pincode");
      return;
    }
    const now = new Date();
    const std = new Date(now);
    std.setDate(now.getDate() + 4);
    const exp = new Date(now);
    exp.setDate(now.getDate() + 2);
    const fmt = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
    setShipResult({
      standard: `Delivery by ${fmt(std)} — Standard Free`,
      express: `Express delivery by ${fmt(exp)} — ₹99`,
    });
  };

  const handleReviewImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      showToast?.({ msg: "Only JPG/PNG files are allowed.", type: "error" });
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast?.({ msg: "Image must be 2MB or smaller.", type: "error" });
      e.target.value = "";
      return;
    }
    if (reviewImagePreview) URL.revokeObjectURL(reviewImagePreview);
    setReviewImageFile(file);
    setReviewImagePreview(URL.createObjectURL(file));
  };

  const submitReview = async () => {
    if (!productId) return;
    if (newComment.trim().length < 10) {
      showToast?.({ msg: "Please enter at least 10 characters.", type: "error" });
      return;
    }
    setReviewSubmitting(true);
    try {
      let imageUrl = "";
      if (reviewImageFile) {
        const fd = new FormData();
        fd.append("image", reviewImageFile);
        const up = await api.post("/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = up.data?.data?.url || "";
      }
      await api.post(`/products/${productId}/reviews`, { rating: newRating, comment: newComment, imageUrl });
      showToast?.({ msg: "Review submitted! Thank you", type: "success" });
      setNewComment("");
      setReviewGateOpen(false);
      setNewRating(5);
      setReviewImageFile(null);
      if (reviewImagePreview) URL.revokeObjectURL(reviewImagePreview);
      setReviewImagePreview("");
      const { data: rdata } = await api.get(`/products/${productId}/reviews`);
      setReviews(rdata.data || []);
      setReviewMeta(rdata.meta || {});
      const { data: pr } = await api.get(`/products/${productId}`);
      setRemote(mapApiProduct(pr.data));
    } catch (e) {
      showToast?.({ msg: e.response?.data?.message || "Could not submit review.", type: "error" });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handlePrimary = () => {
    if (oos) return;
    if (step === "frame") {
      setStep("lenses");
      return;
    }
    if (!lensPlan) return;
    const pickedRx = selectedRx;
    setAddedPDP(true);
    onAddConfigured?.({
      frame,
      configuration: {
        frame: { color },
        lens: lensPlan,
        prescription:
          pickedRx
            ? {
                mode: "saved",
                id: pickedRx.id,
                patientName: pickedRx.patientName || pickedRx.doctor || "",
                date: pickedRx.date,
                odSphere: pickedRx.odSphere || "",
                odCylinder: pickedRx.odCylinder || "",
                odAxis: pickedRx.odAxis || "",
                osSphere: pickedRx.osSphere || "",
                osCylinder: pickedRx.osCylinder || "",
                osAxis: pickedRx.osAxis || "",
                add: pickedRx.add || "",
                pd: pickedRx.pd || "",
                notes: pickedRx.notes || "",
              }
            : { mode: "none" },
      },
    });
    setTimeout(() => setAddedPDP(false), 2000);
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ paddingTop: 80, minHeight: "70vh" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 32, alignItems: "start" }}>
            <div
              style={{
                aspectRatio: "1",
                borderRadius: 20,
                background: "linear-gradient(90deg, var(--g100) 25%, var(--g200) 50%, var(--g100) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.2s ease-in-out infinite",
              }}
              aria-hidden
            />
            <div>
              <div style={{ height: 14, width: "30%", background: "var(--g100)", borderRadius: 6, marginBottom: 16 }} />
              <div style={{ height: 28, width: "85%", background: "var(--g100)", borderRadius: 8, marginBottom: 12 }} />
              <div style={{ height: 18, width: "40%", background: "var(--g100)", borderRadius: 6, marginBottom: 28 }} />
              <div style={{ height: 48, width: "100%", background: "var(--g100)", borderRadius: 12, marginBottom: 12 }} />
              <div style={{ height: 48, width: "100%", background: "var(--g100)", borderRadius: 12 }} />
            </div>
          </div>
        </div>
        <p style={{ color: "var(--g500)", textAlign: "center", marginTop: 24 }}>Loading product…</p>
      </div>
    );
  }
  if (loadErr) {
    return (
      <div className="page-enter" style={{ paddingTop: 100, textAlign: "center" }}>
        <p style={{ color: "var(--red)" }}>{loadErr}</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setPage("plp")}>
          Back to shop
        </button>
      </div>
    );
  }

  const productImgAlt = `${frame.name || "Product"} by ${frame.brand || "Eyelens"}`;

  return (
    <div className="page-enter" style={{ paddingTop: 64 }}>
      <div className="container">
        <div style={{ paddingTop: 24 }}>
          <div className="breadcrumb">
            <span onClick={() => setPage("home")}>Home</span> ›
            <span onClick={() => setPage("plp")}>Shop</span> ›
            <span style={{ color: "var(--g600)", cursor: "default" }}>{frame.name}</span>
          </div>
        </div>
        <div className="pdp-layout">
          <div>
            <div className="gallery-main" style={{ overflow: "hidden", position: "relative" }}>
              <button
                type="button"
                className="wish-btn"
                onClick={handleWish}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 2,
                  color: wished ? "var(--white)" : undefined,
                  background: wished ? "var(--red)" : undefined,
                }}
              >
                {wished ? "♥" : "♡"}
              </button>
              {activeImages.length ? (
                <img
                  src={activeImages[imgIdx] || activeImages[0]}
                  alt={productImgAlt}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .35s ease" }}
                  className="pdp-main-img"
                />
              ) : (
                <div className="gallery-emoji">{frame.emoji || "🕶️"}</div>
              )}
              <div style={{ position: "absolute", top: 12, left: 12 }}>
                <span className="badge badge-new">{frame.badge || "New Arrival"}</span>
              </div>
            </div>
            <div className="gallery-thumbs">
              {(activeImages.length ? activeImages : [1, 2, 3, 4]).map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className={`g-thumb${imgIdx === i ? " active" : ""}`}
                  onClick={() => setImgIdx(i)}
                  aria-label={`View product image ${i + 1}`}
                  style={{ border: "none", cursor: "pointer", padding: 0 }}
                >
                  {typeof src === "string" ? (
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    ["🕶️", "👓", "✨", "🔍"][i]
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="pdp-brand">{frame.brand}</div>
            <h1 className="pdp-name">{frame.name}</h1>
            <div className="pdp-rating">
              <span className="stars">★★★★★</span>
              <span className="rating-ct" style={{ fontSize: 13 }}>
                {(frame.reviewCount || 0) > 0
                  ? `${(frame.averageRating || 0).toFixed(1)} (${frame.reviewCount} reviews)`
                  : "No reviews yet"}
              </span>
              <span className="badge badge-em" style={{ marginLeft: 8 }}>
                Bestseller
              </span>
            </div>
            <div className="pdp-price-wrap">
              {frame.origPrice ? (
                <span className="pdp-mrp-block">
                  <span className="pdp-mrp-label">MRP</span>
                  <span className="pdp-price-orig">{frame.origPrice}</span>
                </span>
              ) : null}
              <span className="pdp-price">{frame.price}</span>
              {pdpSavePct > 0 ? <span className="pdp-save">Save {pdpSavePct}%</span> : null}
            </div>

            <div className="inner-tabs" style={{ marginBottom: 18 }}>
              <button type="button" className={`inner-tab${step === "frame" ? " active" : ""}`} onClick={() => setStep("frame")}>
                1) Frame
              </button>
              <button type="button" className={`inner-tab${step === "lenses" ? " active" : ""}`} onClick={() => setStep("lenses")}>
                2) Lenses
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="field-label">
                Color —{" "}
                <strong style={{ color: "var(--black)", textTransform: "none", letterSpacing: 0 }}>{color}</strong>
              </label>
              <div className="color-swatches">
                {colors.map((c) => (
                  <div
                    key={c.name}
                    className={`c-swatch${color === c.name ? " active" : ""}`}
                    style={{ background: c.hex }}
                    onClick={() => setColor(c.name)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {step === "lenses" && (
              <div style={{ marginBottom: 18 }}>
                <div className="adm-card" style={{ borderRadius: 14, borderColor: "var(--g100)" }}>
                  <div className="adm-card-pad" style={{ padding: 18 }}>
                    <div className="adm-card-title" style={{ marginBottom: 12 }}>Choose lenses</div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {lensPlans.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="btn btn-ghost lens-plan-btn"
                          onClick={() => setLensPlan(p)}
                          style={{
                            justifyContent: "space-between",
                            borderColor: lensPlan?.id === p.id ? "var(--em)" : "var(--g200)",
                            background: lensPlan?.id === p.id ? "var(--em-light)" : "var(--white)",
                          }}
                        >
                          <span style={{ textAlign: "left" }}>
                            <div style={{ fontWeight: 800, color: "var(--black)", fontSize: 13 }}>
                              {p.name}{" "}
                              {p.badge && <span className="badge badge-em" style={{ marginLeft: 8 }}>{p.badge}</span>}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--g500)", marginTop: 2 }}>{p.desc}</div>
                          </span>
                          <span style={{ fontWeight: 900, color: p.price === 0 ? "var(--em)" : "var(--black)" }}>
                            {p.price === 0 ? "Free" : `+₹${p.price}`}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, color: "var(--g500)" }}>
                      Next: we’ll ask for your prescription at checkout (or you can add it in Account → Prescription).
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "lenses" && (
              <div style={{ marginBottom: 18 }}>
                <div className="adm-card" style={{ borderRadius: 14, borderColor: "var(--g100)" }}>
                  <div className="adm-card-pad" style={{ padding: 18 }}>
                    <div className="adm-card-title" style={{ marginBottom: 12 }}>Prescription</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <select
                        className="input"
                        value={selectedRxId}
                        onChange={(e) => setSelectedRxId(e.target.value)}
                        style={{ width: 340, maxWidth: "100%", padding: "10px 14px" }}
                      >
                        <option value="">Select a prescription (optional)</option>
                        {prescriptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {(p.patientName || p.doctor || "—")} — {p.date}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPage("account")}>
                        Manage prescriptions
                      </button>
                    </div>
                    {selectedRx && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, color: "var(--g500)", marginBottom: 8 }}>
                          Selected: <strong style={{ color: "var(--black)" }}>{selectedRx.patientName || selectedRx.doctor || "—"}</strong>
                        </div>
                        <div style={{ border: "1px solid var(--g200)", borderRadius: 10, overflow: "hidden", background: "var(--g50)", display: "inline-block" }}>
                          <table style={{ borderCollapse: "collapse", minWidth: 300 }}>
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
                                <td style={{ padding: "8px 12px", fontSize: 13 }}>{selectedRx.odSphere || "—"}</td>
                                <td style={{ padding: "8px 12px", fontSize: 13 }}>{selectedRx.odCylinder || "—"}</td>
                                <td style={{ padding: "8px 12px", fontSize: 13 }}>{selectedRx.odAxis || "—"}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: "8px 12px", fontWeight: 700, color: "var(--black)" }}>OS (L)</td>
                                <td style={{ padding: "8px 12px", fontSize: 13 }}>{selectedRx.osSphere || "—"}</td>
                                <td style={{ padding: "8px 12px", fontSize: 13 }}>{selectedRx.osCylinder || "—"}</td>
                                <td style={{ padding: "8px 12px", fontSize: 13 }}>{selectedRx.osAxis || "—"}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        {((selectedRx.add && selectedRx.add.trim()) || (selectedRx.pd && selectedRx.pd.trim())) && (
                          <div style={{ fontSize: 12, color: "var(--g600)", marginTop: 8 }}>
                            {selectedRx.add?.trim() && <span>Add: {selectedRx.add}</span>}
                            {selectedRx.add?.trim() && selectedRx.pd?.trim() && " · "}
                            {selectedRx.pd?.trim() && <span>PD: {selectedRx.pd} mm</span>}
                          </div>
                        )}
                        {selectedRx.notes?.trim() && <div style={{ marginTop: 6, fontSize: 12, color: "var(--g600)" }}>{selectedRx.notes}</div>}
                      </div>
                    )}
                    {prescriptions.length === 0 && (
                      <div style={{ marginTop: 10, fontSize: 13, color: "var(--g600)" }}>
                        No saved prescriptions yet. Add one in Account → Prescription.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {oos ? (
              <div className="pdp-cta">
                <button
                  type="button"
                  className="btn btn-lg"
                  disabled
                  style={{
                    flex: 1,
                    background: "var(--g200)",
                    color: "var(--g500)",
                    cursor: "not-allowed",
                  }}
                >
                  Out of Stock
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-lg"
                  onClick={() =>
                    showToast?.({
                      msg: "Stock alerts are coming soon — check back later.",
                      type: "success",
                    })
                  }
                >
                  Notify me
                </button>
              </div>
            ) : (
              <div className="pdp-cta">
                <button
                  className="btn btn-primary btn-lg"
                  style={{
                    flex: 1,
                    background: addedPDP ? "var(--green)" : undefined,
                    opacity: canAddToBag ? 1 : 0.7,
                  }}
                  onClick={handlePrimary}
                  disabled={!canAddToBag}
                >
                  {addedPDP ? "✓ Added to Bag!" : step === "frame" ? "Next: Choose Lenses →" : "🛍 Add to Bag"}
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => {
                    if (step === "frame") setStep("lenses");
                    else if (lensPlan) handlePrimary();
                  }}
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-lg"
                  onClick={toggleWishlistFromCta}
                  aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                  title={wished ? "Remove from wishlist" : "Add to wishlist"}
                  style={{
                    minWidth: 56,
                    padding: "0 16px",
                    color: wished ? "var(--red)" : "var(--black)",
                    fontSize: 20,
                  }}
                >
                  {wished ? "♥" : "♡"}
                </button>
              </div>
            )}

            <div className="spec-grid">
              {[
                ["Frame Material", frame.material || "Premium build"],
                ["Frame type", frame.frameType || "—"],
                ["Category", frame.category || "—"],
                ["Warranty", "1 Year Full"],
              ].map(([k, v]) => (
                <div key={k} className="spec-item">
                  <div className="spec-label">{k}</div>
                  <div className="spec-value">{v}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 18px",
                background: "var(--em-pale)",
                borderRadius: 12,
                border: "1px solid var(--em-light)",
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 22 }}>🚚</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--black)" }}>Free delivery by Saturday</div>
                <div style={{ fontSize: 12, color: "var(--g500)" }}>Order before 6 PM today</div>
              </div>
            </div>

            <div className="tab-bar">
              {[
                ["overview", "Overview"],
                ["reviews", `Reviews (${reviews.length})`],
                ["shipping", "Shipping"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={`tab-btn${tab === id ? " active" : ""}`}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "overview" && (
              <div
                className="tab-panel active"
                style={{ fontSize: 14, color: "var(--g600)", lineHeight: 1.7 }}
              >
                {frame.description?.trim?.()
                  ? frame.description
                  : "Premium eyewear with honest pricing, careful craftsmanship, and lenses selected for everyday clarity and comfort."}
              </div>
            )}
            {tab === "reviews" && (
              <div className="tab-panel active">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "var(--black)" }}>
                      {reviewCount > 0 ? `${reviewAvg.toFixed(1)} / 5` : "No rating yet"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--g500)" }}>
                      {reviewCount} review{reviewCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleWriteReview}>
                    Write a Review
                  </button>
                </div>

                {reviewLoading ? (
                  <p style={{ color: "var(--g500)", fontSize: 13 }}>Loading reviews…</p>
                ) : reviews.length === 0 ? (
                  <p style={{ color: "var(--g500)", fontSize: 13 }}>No reviews yet. Be the first after you purchase!</p>
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r._id}
                      style={{
                        padding: "14px 0",
                        borderBottom: "1px solid var(--g100)",
                        background: r.isMine ? "var(--em-pale)" : "transparent",
                        borderRadius: r.isMine ? 10 : 0,
                        paddingLeft: r.isMine ? 10 : 0,
                        paddingRight: r.isMine ? 10 : 0,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <strong style={{ fontSize: 13 }}>{r.userName || "Customer"}</strong>
                        <span style={{ color: "#F59E0B" }}>{"★".repeat(r.rating)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--g600)" }}>{r.comment}</p>
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt="Review upload"
                          style={{ width: 68, height: 68, objectFit: "cover", borderRadius: 10, marginTop: 8 }}
                        />
                      ) : null}
                      <div style={{ fontSize: 11, color: "var(--g400)", marginTop: 6 }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : ""}
                      </div>
                    </div>
                  ))
                )}

                {reviewGateOpen && loggedIn && !reviewMeta.canReview && !reviewMeta.hasReviewed && (
                  <div
                    style={{
                      marginTop: 16,
                      border: "1px solid var(--g100)",
                      borderRadius: 12,
                      padding: 14,
                      background: "var(--g50)",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>🛍️ Purchase required</div>
                    <div style={{ fontSize: 13, color: "var(--g600)", marginBottom: 12 }}>
                      You need to buy this product before writing a review. This helps us ensure all reviews are genuine.
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setPage("plp")}>
                      Shop Now
                    </button>
                  </div>
                )}

                {reviewGateOpen && loggedIn && reviewMeta.hasReviewed && (
                  <div style={{ marginTop: 16, fontSize: 13, color: "var(--g600)" }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>You have already reviewed this product</div>
                    {ownReview ? (
                      <div
                        style={{
                          border: "1px solid var(--em-light)",
                          background: "var(--em-pale)",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <div style={{ color: "#F59E0B", marginBottom: 4 }}>{"★".repeat(ownReview.rating)}</div>
                        <div>{ownReview.comment}</div>
                      </div>
                    ) : null}
                  </div>
                )}

                {reviewGateOpen && loggedIn && reviewMeta.canReview && (
                  <div style={{ marginTop: 20, padding: 16, background: "var(--g50)", borderRadius: 12, border: "1px solid var(--g100)" }}>
                    <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>Write a Review</div>
                    <label className="field-label">Rating</label>
                    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNewRating(n)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: n <= newRating ? "#F59E0B" : "var(--g300)",
                            fontSize: 22,
                            lineHeight: 1,
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <label className="field-label">Comment</label>
                    <textarea
                      className="input"
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={{ width: "100%", marginBottom: 12 }}
                    />
                    <label className="field-label">Add a photo (optional)</label>
                    <input type="file" accept="image/jpeg,image/png" onChange={handleReviewImageChange} style={{ marginBottom: 10 }} />
                    {reviewImagePreview ? (
                      <img
                        src={reviewImagePreview}
                        alt="Review preview"
                        style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, marginBottom: 12 }}
                      />
                    ) : null}
                    <button type="button" className="btn btn-primary btn-sm" disabled={reviewSubmitting} onClick={submitReview}>
                      {reviewSubmitting ? "Submitting…" : "Submit review"}
                    </button>
                  </div>
                )}
              </div>
            )}
            {tab === "shipping" && (
              <div
                className="tab-panel active"
                style={{ fontSize: 14, color: "var(--g600)", lineHeight: 1.7 }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                  <input
                    className="input"
                    placeholder="Enter pincode"
                    value={shipPincode}
                    onChange={(e) => setShipPincode(e.target.value)}
                    style={{ width: 220 }}
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={checkPincode}>
                    Check
                  </button>
                </div>
                {shipError ? (
                  <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 8 }}>{shipError}</div>
                ) : null}
                {shipResult ? (
                  <div style={{ marginBottom: 8 }}>
                    <div>{shipResult.standard}</div>
                    <div>{shipResult.express}</div>
                  </div>
                ) : null}
                <div>7-day hassle-free returns.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {recentList.length > 0 && (
        <div className="container" style={{ paddingBottom: 48 }}>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Recently Viewed</h2>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
            {recentList.map((p) => (
              <div key={String(p._id)} style={{ flex: "0 0 220px" }}>
                <ProductCard
                  productId={String(p._id || p.id)}
                  {...p}
                  wished={wishlist.map(String).includes(String(p._id || p.id))}
                  onToggleWish={(id) => onToggleWishlistId?.(id)}
                  onClick={() => {
                    navigate(`/product/${p._id || p.id}`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pdp-sticky-cta">
        <div className="pdp-sticky-inner">
          <div>
            <div style={{ fontSize: 11, color: "var(--g400)", fontWeight: 600 }}>Price</div>
            <div className="pdp-sticky-prices">
              {frame.origPrice ? <span className="pdp-sticky-mrp">{frame.origPrice}</span> : null}
              <div className="pdp-sticky-price">{frame.price}</div>
            </div>
          </div>
          {oos ? (
            <>
              <button type="button" className="btn btn-primary" disabled style={{ flex: 1, opacity: 0.65 }}>
                Out of Stock
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flexShrink: 0 }}
                onClick={() =>
                  showToast?.({ msg: "Stock alerts are coming soon — check back later.", type: "success" })
                }
              >
                Notify me
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary"
                style={{
                  flex: 1,
                  background: addedPDP ? "var(--green)" : undefined,
                  opacity: step === "lenses" && !lensPlan ? 0.7 : 1,
                }}
                onClick={handlePrimary}
                disabled={step === "lenses" && !lensPlan}
              >
                {addedPDP ? "✓ Added!" : step === "frame" ? "Next: Lenses →" : "🛍 Add to Bag"}
              </button>
              <button
                className="btn btn-secondary"
                style={{ flexShrink: 0 }}
                onClick={() => {
                  if (step === "frame") setStep("lenses");
                  else if (lensPlan) handlePrimary();
                }}
              >
                Buy Now
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flexShrink: 0, color: wished ? "var(--red)" : "var(--black)", fontSize: 18 }}
                onClick={toggleWishlistFromCta}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              >
                {wished ? "♥" : "♡"}
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={wishRemoveOpen}
        title="Remove from wishlist?"
        onCancel={() => setWishRemoveOpen(false)}
        onConfirm={async () => {
          if (productId) await onToggleWishlistId?.(productId);
          setWishRemoveOpen(false);
        }}
        confirmText="Yes"
        cancelText="Cancel"
        confirmColor="danger"
      />
    </div>
  );
}
