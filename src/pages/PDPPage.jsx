import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { api, getCached } from "../api/axiosInstance";
import { mapApiProduct } from "../utils/productMap";
import { setPageSeo } from "../utils/seo";
import { absoluteUrl } from "../config/site.js";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "../utils/seoSchemas.js";
import { buildProductPath, parseProductRouteParam } from "../utils/productUrl.js";
import { isAuthenticated } from "../auth/auth";
import { pushRecentlyViewed, getRecentlyViewedIds } from "../utils/recentlyViewed";
import ProductCard from "../components/ProductCard";
import ConfirmModal from "../components/ConfirmModal";

const lensOptions = [
  {
    id: "screenguard-single",
    name: "ScreenGuard Single Vision",
    description: "Basic screen protection lenses included with the frame.",
    price: 0,
    badge: "Included",
  },
  {
    id: "ultrachrome-single",
    name: "UltraChrome BlueShield Single Vision",
    description: "Premium blue light & anti-glare protection for digital comfort.",
    price: 499,
    badge: "Popular",
  },
  {
    id: "screenguard-progressive",
    name: "ScreenGuard Progressive",
    description: "Progressive lenses with built-in screen protection.",
    price: 999,
    badge: null,
  },
  {
    id: "ultrachrome-progressive",
    name: "UltraChrome BlueShield Progressive",
    description: "Premium progressive lenses with blue light & anti-glare protection.",
    price: 1599,
    badge: "Premium",
  },
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
  onPrescriptionsRefresh,
  onAddConfigured,
  wishlist = [],
  onToggleWishlistId,
  showToast,
}) {
  const params = useParams();
  const productRouteKey = params.productId;
  const productId = useMemo(() => parseProductRouteParam(productRouteKey || ""), [productRouteKey]);
  const navigate = useNavigate();
  const location = useLocation();
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(Boolean(productRouteKey));
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
      setLoadErr(null);
      return;
    }
    let c = false;
    setLoadErr(null);
    (async () => {
      try {
        const { data } = await getCached(`/products/${productId}`, {}, 45000);
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
          ids.map((id) => getCached(`/products/${id}`, {}, 60000).then((r) => mapApiProduct(r.data.data)).catch(() => null))
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

  const displayModelLabel = useMemo(() => {
    const pid = productId || frame?._id;
    const m = frame?.modelNumber && String(frame.modelNumber).trim();
    if (m) return m;
    const idStr = String(frame?._id || frame?.id || pid || "");
    if (idStr.length >= 6) return `EL-${idStr.slice(-6).toUpperCase()}`;
    return "—";
  }, [frame, productId]);

  useEffect(() => {
    if (!loadErr) return undefined;
    const restore = setPageSeo({
      title: "Product unavailable | Eyelens",
      description: "This product could not be loaded. Browse prescription glasses and sunglasses in our shop.",
      canonicalPath: "/plp",
      noindex: true,
    });
    return restore;
  }, [loadErr]);

  useEffect(() => {
    if (!productId || loadErr) return;
    const name = remote?.name || productProp?.name;
    if (!name) return;
    const expectedKey = buildProductPath(productId, name).replace(/^\/product\//, "");
    if (productRouteKey && expectedKey && productRouteKey !== expectedKey) {
      navigate(`/product/${expectedKey}`, { replace: true });
    }
  }, [productId, productRouteKey, remote?.name, productProp?.name, loadErr, navigate]);

  useEffect(() => {
    const pid = productId || frame?._id;
    const hasSource = Boolean(remote || productProp);
    if (!hasSource || loadErr || !frame?.name || !pid) return undefined;

    const brand = frame.brand || "Eyelens";
    const title = `${brand} ${frame.name}`.replace(/\s+/g, " ").trim();
    const desc = `Shop ${frame.name} by ${brand}. Power-ready frames and lens upgrades at checkout.${
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
    const productPath = buildProductPath(pid, frame.name);
    const skuForSchema =
      displayModelLabel !== "—" ? displayModelLabel : String(pid).slice(-12);
    const rc = Number(frame.reviewCount || 0) || reviews.length;
    const avg =
      frame.reviewCount > 0
        ? Number(frame.averageRating || 0)
        : reviews.length
          ? Math.round((reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length) * 10) / 10
          : 0;
    const aggregateRating =
      rc > 0 && avg > 0 ? { ratingValue: avg.toFixed(1), reviewCount: String(rc) } : undefined;
    const reviewSnippets = reviews
      .filter((r) => r?.comment)
      .slice(0, 5)
      .map((r) => ({
        authorName: r.userName || "Customer",
        body: String(r.comment || "").slice(0, 1500),
        rating: Number(r.rating) || 5,
      }));
    const listPrice =
      frame.rawOrigPrice != null && frame.rawPrice != null && frame.rawOrigPrice > frame.rawPrice
        ? frame.rawOrigPrice
        : undefined;

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
        listPrice,
        availability: frame.outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        sku: skuForSchema,
        aggregateRating,
        reviewSnippets,
      }),
    ];
    const restore = setPageSeo({
      title,
      description: desc,
      canonicalPath: productPath,
      keywords: "buy prescription glasses online, sunglasses India, eyeglasses, Eyelens",
      ogImage: ogImage || undefined,
      ogType: "product",
      jsonLd,
    });
    return () => restore();
  }, [frame, productId, displayModelLabel, remote, productProp, reviews, loadErr]);

  const [color, setColor] = useState("");
  const [tab, setTab] = useState("overview");
  const [step, setStep] = useState("frame"); // frame -> lenses
  const [lensPlan, setLensPlan] = useState(lensOptions[0]);
  const [selectedRxId, setSelectedRxId] = useState("");
  const [showRxBox, setShowRxBox] = useState(false);
  const [rxSaving, setRxSaving] = useState(false);
  const [rxForm, setRxForm] = useState({
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
  const [addedPDP, setAddedPDP] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0, panX: 0, panY: 0, startedAt: 0 });
  const pinchStartRef = useRef({ distance: 0, zoom: 1 });
  const touchMovedRef = useRef(false);
  const lastTapRef = useRef(0);
  const scrollLockRef = useRef({ y: 0, bodyPosition: "", bodyTop: "", bodyWidth: "", bodyOverflow: "" });
  const viewerShellRef = useRef(null);
  const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;

  const pdpSavePct =
    frame.rawOrigPrice && frame.rawPrice && frame.rawOrigPrice > frame.rawPrice
      ? Math.round((1 - frame.rawPrice / frame.rawOrigPrice) * 100)
      : 0;
  const lensAddonPrice = Number(lensPlan?.price || 0);
  const pdpTotalPrice = Number.isFinite(frame.rawPrice) ? frame.rawPrice + lensAddonPrice : null;
  const pdpDisplayPrice = pdpTotalPrice == null ? frame.price : `₹${Math.round(pdpTotalPrice).toLocaleString("en-IN")}`;

  const colors = useMemo(() => {
    if (Array.isArray(frame.colors) && frame.colors.length > 0) {
      return frame.colors
        .map((c) => ({
          name: String(c.name || "").trim(),
          hex: String(c.hex || "").trim() || "var(--g200)",
          stock:
            c.stock === "" || c.stock == null || Number.isNaN(Number(c.stock))
              ? null
              : Math.max(0, Math.floor(Number(c.stock))),
          images: Array.isArray(c.images) ? c.images.filter(Boolean) : [],
        }))
        .filter((c) => c.name);
    }
    return [];
  }, [frame.colors]);
  const activeColor = colors.find((c) => c.name === color) || colors[0] || null;
  const activeImages =
    activeColor && activeColor.images.length ? activeColor.images : Array.isArray(frame.images) ? frame.images : [];
  const selectedColorStock =
    activeColor && Number.isFinite(Number(activeColor.stock)) ? Math.max(0, Number(activeColor.stock)) : null;
  const hasColorInventory = colors.some((c) => Number.isFinite(Number(c.stock)));
  const allColorsOut = hasColorInventory && colors.every((c) => Number(c.stock) <= 0);
  const oos = Boolean(frame.outOfStock) || allColorsOut;

  useEffect(() => {
    if (!colors.length) return;
    const firstAvailable = colors.find((c) => !Number.isFinite(Number(c.stock)) || Number(c.stock) > 0) || colors[0];
    setColor((prev) => (prev && colors.some((c) => c.name === prev) ? prev : firstAvailable.name));
  }, [colors]);

  useEffect(() => {
    setImgIdx(0);
  }, [color, frame._id, frame.id]);

  useEffect(() => {
    if (!activeImages.length) return;
    if (imgIdx >= activeImages.length) setImgIdx(0);
  }, [imgIdx, activeImages.length]);
  useEffect(() => {
    if (!imageViewerOpen) {
      setImageZoom(1);
      setImagePan({ x: 0, y: 0 });
      setIsPanning(false);
    }
  }, [imageViewerOpen, imgIdx]);
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;
    const body = document.body;
    if (!imageViewerOpen) return undefined;

    scrollLockRef.current = {
      y: window.scrollY || window.pageYOffset || 0,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollLockRef.current.y}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = scrollLockRef.current.bodyPosition;
      body.style.top = scrollLockRef.current.bodyTop;
      body.style.width = scrollLockRef.current.bodyWidth;
      body.style.overflow = scrollLockRef.current.bodyOverflow;
      window.scrollTo(0, scrollLockRef.current.y);
    };
  }, [imageViewerOpen]);
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const getFsElement = () =>
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null;
    const requestFs = async () => {
      const node = viewerShellRef.current;
      if (!node || getFsElement()) return;
      try {
        if (node.requestFullscreen) await node.requestFullscreen();
        else if (node.webkitRequestFullscreen) node.webkitRequestFullscreen();
        else if (node.mozRequestFullScreen) node.mozRequestFullScreen();
        else if (node.msRequestFullscreen) node.msRequestFullscreen();
      } catch {
        // Fallback to existing fixed overlay if fullscreen is denied.
      }
    };
    const exitFs = async () => {
      try {
        if (document.exitFullscreen && getFsElement()) await document.exitFullscreen();
        else if (document.webkitExitFullscreen && getFsElement()) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen && getFsElement()) document.mozCancelFullScreen();
        else if (document.msExitFullscreen && getFsElement()) document.msExitFullscreen();
      } catch {
        // Ignore exit errors.
      }
    };
    const onFsChange = () => {
      if (imageViewerOpen && !getFsElement()) setImageViewerOpen(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);
    if (imageViewerOpen) void requestFs();
    else void exitFs();
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, [imageViewerOpen]);
  useEffect(() => {
    if (!imageViewerOpen || !isMobileView || activeImages.length <= 1) return undefined;
    if (typeof window === "undefined") return undefined;
    const key = "eyelens_seen_swipe_hint";
    const seen = window.localStorage.getItem(key) === "1";
    if (seen) return undefined;
    setShowSwipeHint(true);
    const t = window.setTimeout(() => {
      setShowSwipeHint(false);
      window.localStorage.setItem(key, "1");
    }, 2200);
    return () => window.clearTimeout(t);
  }, [imageViewerOpen, isMobileView, activeImages.length]);

  const selectedRx =
    selectedRxId ? prescriptions.find((p) => String(p.id) === String(selectedRxId)) || null : null;
  const productHighlights = String(frame.productHighlights || "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  const canAddToBag =
    (step !== "lenses" ? true : !!lensPlan) && (selectedColorStock == null || selectedColorStock > 0);
  const updateZoom = (nextZoom) => {
    const safeZoom = Math.min(4, Math.max(1, nextZoom));
    setImageZoom(safeZoom);
    if (safeZoom === 1) setImagePan({ x: 0, y: 0 });
  };
  const getTouchDistance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const goPrevImage = () => {
    if (!activeImages.length) return;
    setImgIdx((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  };
  const goNextImage = () => {
    if (!activeImages.length) return;
    setImgIdx((prev) => (prev + 1) % activeImages.length);
  };

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
      navigate("/login", { state: { from: location.pathname + location.search } });
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
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    setReviewGateOpen((open) => !open);
  };

  const toggleWishlistFromCta = async () => {
    if (!productId) return;
    if (!isAuthenticated()) {
      showToast?.({ msg: "Please log in to save to wishlist", type: "info" });
      navigate("/login", { state: { from: location.pathname + location.search } });
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
      showToast?.({ msg: "Please enter a valid 6-digit pincode.", type: "error" });
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
    showToast?.({ msg: "Delivery estimate available for this pincode.", type: "success" });
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
        frame: color ? { color } : undefined,
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

  const savePrescriptionInline = async () => {
    if (!isAuthenticated()) {
      showToast?.({ msg: "Please login to add prescription", type: "error" });
      return;
    }
    if (!rxForm.patientName.trim()) {
      showToast?.({ msg: "Patient name is required", type: "error" });
      return;
    }
    setRxSaving(true);
    try {
      const { data } = await api.post("/users/me/prescriptions", {
        patientName: rxForm.patientName.trim(),
        date: rxForm.date || new Date().toISOString().slice(0, 10),
        odSphere: rxForm.odSphere,
        odCylinder: rxForm.odCylinder,
        odAxis: rxForm.odAxis,
        osSphere: rxForm.osSphere,
        osCylinder: rxForm.osCylinder,
        osAxis: rxForm.osAxis,
        add: rxForm.add,
        pd: rxForm.pd,
        notes: rxForm.notes,
      });
      const created = data?.data;
      if (created?._id) {
        setSelectedRxId(String(created._id));
      }
      setShowRxBox(false);
      setRxForm({
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
      await onPrescriptionsRefresh?.();
      showToast?.({ msg: "Prescription saved", type: "success" });
    } catch (e) {
      showToast?.({ msg: e.response?.data?.message || "Could not save prescription", type: "error" });
    } finally {
      setRxSaving(false);
    }
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
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link> › <Link to="/plp">Shop</Link> ›{" "}
            <span style={{ color: "var(--g600)" }}>{frame.name}</span>
          </nav>
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
                  fetchPriority="high"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 12, transition: "transform .35s ease" }}
                  className="pdp-main-img"
                  role="button"
                  tabIndex={0}
                  onClick={() => setImageViewerOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setImageViewerOpen(true);
                    }
                  }}
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
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8, padding: 4 }}
                    />
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
                {reviewCount > 0 ? `${reviewAvg.toFixed(1)} (${reviewCount} reviews)` : "No reviews yet"}
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
              <span className="pdp-price">{pdpDisplayPrice}</span>
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

            {colors.length > 0 && (
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
                          onClick={() => {
                            const colorStock = Number.isFinite(Number(c.stock)) ? Number(c.stock) : null;
                            if (colorStock != null && colorStock <= 0) return;
                            setColor(c.name);
                          }}
                          title={c.name}
                          aria-disabled={Number.isFinite(Number(c.stock)) && Number(c.stock) <= 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === "lenses" && (
              <div style={{ marginBottom: 18 }}>
                <div className="adm-card" style={{ borderRadius: 14, borderColor: "var(--g100)" }}>
                  <div className="adm-card-pad" style={{ padding: 18 }}>
                    <div className="adm-card-title" style={{ marginBottom: 12 }}>Choose lenses</div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {lensOptions.map((p) => (
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
                          <span className="lens-plan-copy" style={{ textAlign: "left" }}>
                            <div style={{ fontWeight: 800, color: "var(--black)", fontSize: 13 }}>
                              {p.name}{" "}
                              {p.badge && <span className="badge badge-em" style={{ marginLeft: 8 }}>{p.badge}</span>}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--g500)", marginTop: 2 }}>{p.description}</div>
                          </span>
                          <span className="lens-plan-price" style={{ fontWeight: 900, color: p.price === 0 ? "var(--em)" : "var(--black)" }}>
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
                    <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                      {prescriptions.map((p) => {
                        const active = String(selectedRxId) === String(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setSelectedRxId(String(p.id))}
                            style={{
                              justifyContent: "space-between",
                              textAlign: "left",
                              border: active ? "1.5px solid var(--em)" : "1px solid var(--g200)",
                              background: active ? "var(--em-pale)" : "var(--white)",
                              borderRadius: 10,
                              padding: "10px 12px",
                            }}
                          >
                            <span style={{ fontSize: 12, lineHeight: 1.5 }}>
                              <strong>{p.patientName || "Prescription"}</strong> {p.date ? `— ${p.date}` : ""}
                            </span>
                            <span style={{ fontSize: 12, color: active ? "var(--em)" : "var(--g500)" }}>
                              {active ? "Selected" : "Use"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedRxId("")}>
                        No prescription
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowRxBox((v) => !v)}>
                        {showRxBox ? "Close add prescription" : "+ Add prescription"}
                      </button>
                    </div>
                    {showRxBox && (
                      <div
                        style={{
                          marginTop: 12,
                          border: "1px solid var(--g200)",
                          borderRadius: 12,
                          padding: 12,
                          background: "var(--g50)",
                        }}
                      >
                        <div className="form-row2" style={{ marginBottom: 8 }}>
                          <input
                            className="input"
                            placeholder="Patient name"
                            value={rxForm.patientName}
                            onChange={(e) => setRxForm((x) => ({ ...x, patientName: e.target.value }))}
                          />
                          <input
                            className="input"
                            type="date"
                            value={rxForm.date}
                            onChange={(e) => setRxForm((x) => ({ ...x, date: e.target.value }))}
                          />
                        </div>
                        <div style={{ fontWeight: 700, color: "var(--black)", fontSize: 13, marginBottom: 6 }}>Right Eye (OD)</div>
                        <div className="form-row2" style={{ marginBottom: 8 }}>
                          <input className="input" placeholder="SPH" value={rxForm.odSphere} onChange={(e) => setRxForm((x) => ({ ...x, odSphere: e.target.value }))} />
                          <input className="input" placeholder="CYL" value={rxForm.odCylinder} onChange={(e) => setRxForm((x) => ({ ...x, odCylinder: e.target.value }))} />
                          <input className="input" placeholder="AXIS" value={rxForm.odAxis} onChange={(e) => setRxForm((x) => ({ ...x, odAxis: e.target.value }))} />
                        </div>
                        <div style={{ fontWeight: 700, color: "var(--black)", fontSize: 13, marginBottom: 6 }}>Left Eye (OS)</div>
                        <div className="form-row2" style={{ marginBottom: 8 }}>
                          <input className="input" placeholder="SPH" value={rxForm.osSphere} onChange={(e) => setRxForm((x) => ({ ...x, osSphere: e.target.value }))} />
                          <input className="input" placeholder="CYL" value={rxForm.osCylinder} onChange={(e) => setRxForm((x) => ({ ...x, osCylinder: e.target.value }))} />
                          <input className="input" placeholder="AXIS" value={rxForm.osAxis} onChange={(e) => setRxForm((x) => ({ ...x, osAxis: e.target.value }))} />
                        </div>
                        <div className="form-row2" style={{ marginBottom: 8 }}>
                          <input className="input" placeholder="ADD" value={rxForm.add} onChange={(e) => setRxForm((x) => ({ ...x, add: e.target.value }))} />
                          <input className="input" placeholder="PD" value={rxForm.pd} onChange={(e) => setRxForm((x) => ({ ...x, pd: e.target.value }))} />
                        </div>
                        <textarea
                          className="input"
                          rows={2}
                          style={{ width: "100%", marginBottom: 8 }}
                          placeholder="Notes (optional)"
                          value={rxForm.notes}
                          onChange={(e) => setRxForm((x) => ({ ...x, notes: e.target.value }))}
                        />
                        <button type="button" className="btn btn-primary btn-sm" onClick={savePrescriptionInline} disabled={rxSaving}>
                          {rxSaving ? "Saving..." : "Save prescription"}
                        </button>
                      </div>
                    )}
                    {selectedRx && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, color: "var(--g500)", marginBottom: 8 }}>
                          Selected: <strong style={{ color: "var(--black)" }}>{selectedRx.patientName || selectedRx.doctor || "—"}</strong>
                        </div>
                        <div
                          style={{
                            border: "1px solid var(--g200)",
                            borderRadius: 10,
                            overflowX: "auto",
                            WebkitOverflowScrolling: "touch",
                            background: "var(--g50)",
                            display: "block",
                            maxWidth: "100%",
                          }}
                        >
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
                        No saved prescriptions yet. Use + Add prescription above.
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
                <div className="pdp-cta-main">
                  <button
                    className="btn btn-primary btn-lg pdp-order-primary"
                    style={{
                      width: "100%",
                      background: addedPDP ? "var(--green)" : undefined,
                      opacity: canAddToBag ? 1 : 0.7,
                    }}
                    onClick={handlePrimary}
                    disabled={!canAddToBag}
                  >
                    {addedPDP ? "Added to Bag ✓" : step === "frame" ? "Continue to Lenses" : "Add to Bag"}
                  </button>
                </div>
                <div className="pdp-cta-sub">
                  <button
                    className="btn btn-secondary btn-lg pdp-order-secondary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      if (step === "frame") setStep("lenses");
                      else if (lensPlan) handlePrimary();
                    }}
                  >
                    Buy Now - Fast Checkout
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-lg pdp-order-wish"
                    onClick={toggleWishlistFromCta}
                    aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                    title={wished ? "Remove from wishlist" : "Add to wishlist"}
                    style={{
                      minWidth: 48,
                      padding: "0 14px",
                      color: wished ? "var(--red)" : "var(--black)",
                      fontSize: 18,
                    }}
                  >
                    {wished ? "♥" : "♡"}
                  </button>
                </div>
              </div>
            )}

            <div className="spec-grid">
              {[
                ["Model number", displayModelLabel],
                ["Frame Material", frame.material || "Premium build"],
                ["Frame type", frame.frameType || "—"],
                ["Gender", frame.gender ? `${String(frame.gender).charAt(0).toUpperCase()}${String(frame.gender).slice(1)}` : "—"],
                ["Category", frame.category || "—"],
                ["Size", frame.frameSize || "—"],
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
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--black)" }}>
                  {frame.deliveryPrimary || "Free delivery by Saturday"}
                </div>
                <div style={{ fontSize: 12, color: "var(--g500)" }}>
                  {frame.deliverySecondary || "Order before 6 PM today"}
                </div>
              </div>
            </div>
            <div className="adm-card" style={{ borderRadius: 14, borderColor: "var(--g100)", marginBottom: 18 }}>
              <div className="adm-card-pad" style={{ padding: 18 }}>
                <div className="adm-card-title" style={{ marginBottom: 10 }}>Product Highlights</div>
                {productHighlights.length > 0 ? (
                  <ul style={{ paddingLeft: 18, margin: 0, color: "var(--g600)", fontSize: 13, lineHeight: 1.7 }}>
                    {productHighlights.map((item, idx) => (
                      <li key={`${idx}-${item}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--g500)" }}>
                    Add highlights from Admin Product form to show key benefits here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8, marginBottom: 28 }}>
          <div className="tab-bar" style={{ marginTop: 12 }}>
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
                  style={{ width: "min(220px, 100%)", flex: "1 1 180px" }}
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
              <div>Easy support for order and delivery help.</div>
            </div>
          )}
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
                    navigate(buildProductPath(p._id || p.id, p.name));
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
              <div className="pdp-sticky-price">{pdpDisplayPrice}</div>
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
              <div style={{ flex: 1 }}>
                <button
                  className="btn btn-primary pdp-order-primary"
                  style={{
                    width: "100%",
                    background: addedPDP ? "var(--green)" : undefined,
                    opacity: step === "lenses" && !lensPlan ? 0.7 : 1,
                  }}
                  onClick={handlePrimary}
                  disabled={step === "lenses" && !lensPlan}
                >
                  {addedPDP ? "Added ✓" : step === "frame" ? "Continue to Lenses" : "Add to Bag"}
                </button>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    className="btn btn-secondary pdp-order-secondary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      if (step === "frame") setStep("lenses");
                      else if (lensPlan) handlePrimary();
                    }}
                  >
                    Buy Now
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost pdp-order-wish"
                    style={{ flexShrink: 0, color: wished ? "var(--red)" : "var(--black)", fontSize: 18 }}
                    onClick={toggleWishlistFromCta}
                    aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {wished ? "♥" : "♡"}
                  </button>
                </div>
              </div>
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
      {imageViewerOpen && activeImages.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          onClick={() => setImageViewerOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setImageViewerOpen(false);
          }}
          tabIndex={-1}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.8)",
            zIndex: 1200,
            display: "grid",
            placeItems: "center",
            padding: isMobileView ? 0 : 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            ref={viewerShellRef}
            style={{
              width: "100%",
              maxWidth: "100dvw",
              height: "100dvh",
              background: "var(--white)",
              borderRadius: 0,
              overflow: "hidden",
              display: "grid",
              gridTemplateRows: "1fr",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: isMobileView ? "8px 10px" : "10px 12px",
                borderBottom: "none",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 3,
                background: "rgba(255,255,255,.88)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div style={{ fontSize: 13, color: "var(--g600)", fontWeight: 700 }}>
                Preview
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateZoom(imageZoom - 0.25)}>
                  −
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateZoom(1)}>
                  100%
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateZoom(imageZoom + 0.25)}>
                  +
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setImageViewerOpen(false)}>
                  Close
                </button>
              </div>
            </div>
            <div
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.1 : -0.1;
                updateZoom(imageZoom + delta);
              }}
              onTouchStart={(e) => {
                if (!e.touches || e.touches.length === 0) return;
                if (e.touches.length === 2) {
                  const [a, b] = e.touches;
                  pinchStartRef.current = {
                    distance: getTouchDistance(a, b),
                    zoom: imageZoom,
                  };
                  touchMovedRef.current = true;
                  return;
                }
                if (e.touches.length !== 1) return;
                const touch = e.touches[0];
                touchStartRef.current = {
                  x: touch.clientX,
                  y: touch.clientY,
                  currentX: touch.clientX,
                  currentY: touch.clientY,
                  panX: imagePan.x,
                  panY: imagePan.y,
                  startedAt: Date.now(),
                };
                touchMovedRef.current = false;
              }}
              onTouchMove={(e) => {
                if (!e.touches || e.touches.length === 0) return;
                if (e.touches.length === 2) {
                  const [a, b] = e.touches;
                  const nextDistance = getTouchDistance(a, b);
                  if (pinchStartRef.current.distance > 0) {
                    const nextZoom = pinchStartRef.current.zoom * (nextDistance / pinchStartRef.current.distance);
                    e.preventDefault();
                    updateZoom(nextZoom);
                  }
                  return;
                }
                if (e.touches.length !== 1) return;
                const touch = e.touches[0];
                const dx = touch.clientX - touchStartRef.current.x;
                const dy = touch.clientY - touchStartRef.current.y;
                touchStartRef.current.currentX = touch.clientX;
                touchStartRef.current.currentY = touch.clientY;
                if (Math.abs(dx) > 6 || Math.abs(dy) > 6) touchMovedRef.current = true;
                if (imageZoom > 1) {
                  e.preventDefault();
                  setImagePan({
                    x: touchStartRef.current.panX + dx,
                    y: touchStartRef.current.panY + dy,
                  });
                }
              }}
              onTouchEnd={() => {
                pinchStartRef.current.distance = 0;
                const swipeX = touchStartRef.current.currentX - touchStartRef.current.x;
                const swipeY = touchStartRef.current.currentY - touchStartRef.current.y;
                const isHorizontalSwipe = Math.abs(swipeX) > 28 && Math.abs(swipeX) > Math.abs(swipeY) * 1.15;
                if (imageZoom <= 1 && isHorizontalSwipe) {
                  if (swipeX < 0) goNextImage();
                  else goPrevImage();
                }
                touchMovedRef.current = false;
              }}
              onTouchCancel={() => {
                pinchStartRef.current.distance = 0;
                touchMovedRef.current = false;
              }}
              onMouseMove={(e) => {
                if (!isPanning) return;
                setImagePan({
                  x: e.clientX - panStartRef.current.x,
                  y: e.clientY - panStartRef.current.y,
                });
              }}
              onMouseUp={() => setIsPanning(false)}
              onMouseLeave={() => setIsPanning(false)}
              style={{
                overflow: "hidden",
                position: "relative",
                touchAction: imageZoom > 1 ? "none" : "pan-y",
                background: "var(--g50)",
                display: "grid",
                placeItems: "center",
                padding: 0,
              }}
            >
              <img
                src={activeImages[imgIdx] || activeImages[0]}
                alt={productImgAlt}
                onDragStart={(e) => e.preventDefault()}
                onClick={() => {
                  const now = Date.now();
                  if (now - lastTapRef.current < 280) {
                    updateZoom(imageZoom > 1 ? 1 : 2);
                  }
                  lastTapRef.current = now;
                }}
                onMouseDown={(e) => {
                  if (imageZoom <= 1) return;
                  setIsPanning(true);
                  panStartRef.current = {
                    x: e.clientX - imagePan.x,
                    y: e.clientY - imagePan.y,
                  };
                }}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100dvh",
                  objectFit: "contain",
                  transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${imageZoom})`,
                  transformOrigin: "center center",
                  transition: "transform .2s ease",
                  cursor: imageZoom > 1 ? (isPanning ? "grabbing" : "grab") : "zoom-in",
                }}
              />
              {activeImages.length > 1 && (
                <>
                  {showSwipeHint && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 18,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 5,
                        background: "rgba(0,0,0,.62)",
                        color: "#fff",
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: ".01em",
                        pointerEvents: "none",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      Swipe left/right to change photo
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={goPrevImage}
                    style={{ position: "absolute", left: isMobileView ? 10 : 18, top: "50%", transform: "translateY(-50%)", zIndex: 4 }}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={goNextImage}
                    style={{ position: "absolute", right: isMobileView ? 10 : 18, top: "50%", transform: "translateY(-50%)", zIndex: 4 }}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
