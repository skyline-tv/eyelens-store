import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { api, getCached } from "../api/axiosInstance";
import { mapApiProduct } from "../utils/productMap";
import { getRecentlyViewedIds } from "../utils/recentlyViewed";
import { setPageSeo } from "../utils/seo";
import { buildFaqJsonLd } from "../utils/seoSchemas";

const HOME_FAQ = [
  [
    "What is Eyelens?",
    "Eyelens is an Indian online eyewear store selling prescription glasses, sunglasses, and computer glasses with clear frame pricing and lens options at checkout — shop frames at Eyelens and ship nationwide.",
  ],
  [
    "Does Eyelens ship across India?",
    "Yes. We deliver to most pincodes. The total you see at checkout is the amount you pay for your items (no separate shipping or tax lines).",
  ],
  [
    "Can I add prescription lenses online?",
    "Choose your frame, then pick lens type and coatings at checkout. Upload or save your prescription from your account anytime.",
  ],
  [
    "What is the return policy?",
    "For return or exchange assistance, contact support and our team will guide you quickly.",
  ],
  [
    "Are frame prices inclusive of lenses?",
    "Listed prices are for the frame. Lens packages and upgrades are added separately with clear pricing before you pay.",
  ],
];

/** Banners with these placements are only used for fixed home slots (not the hero carousel). */
function isHomeCategoryPlacement(placement) {
  return typeof placement === "string" && placement.startsWith("home_cat_");
}

function isHomeMarketingPlacement(placement) {
  return typeof placement === "string" && placement.startsWith("home_marketing");
}

const HERO_IMAGE_FALLBACK = "https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?w=800";

export default function HomePage({ setPage, onSelectProduct, wishlist = [], onToggleWishlistId, showToast }) {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [recentProducts, setRecentProducts] = useState([]);
  const [newsEmail, setNewsEmail] = useState("");
  const [newsDone, setNewsDone] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const restore = setPageSeo({
      title: "Eyelens — Official store | Prescription glasses & sunglasses India",
      description:
        "Eyelens official store: prescription eyeglasses, UV sunglasses & blue-light computer glasses online in India. Clear pricing, lens options at checkout, nationwide delivery.",
      canonicalPath: "/",
      keywords:
        "Eyelens, Eyelens store, Eyelens India, Eyelens eyewear, prescription glasses online India, buy eyeglasses online, Eyelens official website",
      jsonLd: buildFaqJsonLd(HOME_FAQ),
    });
    return () => restore();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getCached("/products", { params: { sort: "newest", limit: 8 } }, 30000);
        const list = (data.data || []).map(mapApiProduct);
        if (!cancelled) setTrending(list);
      } catch {
        if (!cancelled) setTrending([]);
      } finally {
        if (!cancelled) setTrendingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const { data } = await getCached("/banners", {}, 60000);
        const raw = data?.data;
        const next = Array.isArray(raw) ? raw : [];
        if (!c) setBanners(next);
      } catch {
        if (!c) setBanners([]);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const carouselBanners = useMemo(
    () =>
      (banners || []).filter(
        (b) => !isHomeCategoryPlacement(b?.placement) && !isHomeMarketingPlacement(b?.placement)
      ),
    [banners]
  );
  const marketingBanner = useMemo(
    () =>
      (banners || []).find(
        (b) => isHomeMarketingPlacement(b?.placement) && (String(b.title || "").trim() || String(b.subtitle || "").trim())
      ) || null,
    [banners]
  );

  useEffect(() => {
    setBannerIdx((i) => {
      if (!carouselBanners.length) return 0;
      return i >= carouselBanners.length ? 0 : i;
    });
  }, [carouselBanners]);

  useEffect(() => {
    if (carouselBanners.length <= 1) return undefined;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % carouselBanners.length), 4000);
    return () => clearInterval(t);
  }, [carouselBanners.length]);

  useEffect(() => {
    let c = false;
    (async () => {
      const ids = getRecentlyViewedIds().slice(0, 6);
      if (!ids.length) {
        setRecentProducts([]);
        return;
      }
      try {
        const results = await Promise.all(
          ids.map((id) => getCached(`/products/${id}`, {}, 60000).then((r) => mapApiProduct(r.data.data)).catch(() => null))
        );
        if (!c) setRecentProducts(results.filter(Boolean));
      } catch {
        if (!c) setRecentProducts([]);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  // Scroll-triggered section reveals
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const nodes = root.querySelectorAll(".reveal-section");
    if (!nodes.length) return undefined;

    // Mobile/webview safety: if observer isn't supported, show content immediately.
    if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    nodes.forEach((n) => io.observe(n));
    // Fallback: ensure sections don't stay hidden if observer misses on some mobile browsers.
    const failSafe = setTimeout(() => {
      nodes.forEach((n) => n.classList.add("is-visible"));
    }, 1200);
    return () => {
      clearTimeout(failSafe);
      io.disconnect();
    };
  }, [trending.length]);

  const pid = (p) => String(p._id || p.id || "");
  const isWished = (p) => wishlist.includes(pid(p));

  const banner = carouselBanners[bannerIdx];
  const heroVisualUrl = banner?.imageUrl?.trim() || HERO_IMAGE_FALLBACK;

  return (
    <div ref={rootRef} className="page-enter home-page">
      <section
        style={{ background: "var(--black)", color: "var(--white)", padding: "10px 0", marginTop: 64 }}
        aria-label="Offers"
      >
        <div
          className="container"
          style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, textAlign: "center", flexWrap: "wrap" }}
        >
          <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--em-bright)" }}>
            Offer
          </span>
          <span style={{ fontSize: 14, lineHeight: 1.4 }}>
            {marketingBanner
              ? `${marketingBanner.title}${marketingBanner.subtitle ? ` - ${marketingBanner.subtitle}` : ""}`
              : "Get 50% OFF on your first order at launch. Use SAVE50."}
          </span>
          {marketingBanner?.linkUrl ? (
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: "var(--em)", color: "var(--white)", borderColor: "var(--em)", minHeight: 34 }}
              onClick={() => {
                if (marketingBanner.linkUrl.startsWith("http")) window.location.href = marketingBanner.linkUrl;
                else navigate(marketingBanner.linkUrl.startsWith("/") ? marketingBanner.linkUrl : `/${marketingBanner.linkUrl}`);
              }}
            >
              View Offer
            </button>
          ) : null}
        </div>
      </section>

      <section
        className="hero-section hero-fade-in home-hero-split"
        aria-label={banner?.title ? `${banner.title} banner` : undefined}
      >
        <div className="hero-left">
          <h1 className="sr-only">Eyelens — prescription glasses and sunglasses online in India</h1>
          {carouselBanners.length > 0 && banner ? (
            <>
              <div className="hero-badge hero-text-1">
                <div className="hero-badge-dot" />
                Featured
              </div>
              <h2 className="hero-heading hero-text-2">
                {banner.title}
                {banner.subtitle ? (
                  <>
                    <br />
                    <em style={{ opacity: 0.95 }}>{banner.subtitle}</em>
                  </>
                ) : null}
              </h2>
              <p className="hero-sub hero-text-3">
                Curated frames and lenses — shop this look or browse the full eyewear catalogue.
              </p>
              <div className="hero-cta hero-text-4">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    if (!banner.linkUrl) setPage("plp");
                    else if (banner.linkUrl.startsWith("http")) window.location.href = banner.linkUrl;
                    else navigate(banner.linkUrl.startsWith("/") ? banner.linkUrl : `/${banner.linkUrl}`);
                  }}
                >
                  Shop Now →
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => setPage("plp")}>
                  View Collections
                </button>
              </div>
              {carouselBanners.length > 1 && (
                <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                  {carouselBanners.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => setBannerIdx(i)}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        border: "none",
                        cursor: "pointer",
                        background: i === bannerIdx ? "var(--em)" : "var(--g300)",
                        opacity: i === bannerIdx ? 1 : 0.7,
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="hero-badge hero-text-1">
                <div className="hero-badge-dot" />
                New SS&apos;25 Collection
              </div>
              <h2 className="hero-heading hero-text-2">
                See the World
                <br />
                <em>in Style</em>
              </h2>
              <p className="hero-sub hero-text-3">
                Premium prescription glasses and sunglasses for everyday confidence — honest pricing and lens options at
                checkout.
              </p>
              <div className="hero-cta hero-text-4">
                <button className="btn btn-primary btn-lg" onClick={() => setPage("plp")}>
                  Shop Now →
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => setPage("plp")}>
                  View Collections
                </button>
              </div>
            </>
          )}
        </div>
        <div className="hero-right hero-visual-wrap">
          <img
            src={heroVisualUrl}
            alt={banner?.title ? `${banner.title} — featured eyewear look` : "Premium Eyelens sunglasses and eyeglasses"}
            className="home-hero-product-img"
            width={440}
            height={520}
            fetchPriority="high"
            decoding="async"
            loading="eager"
          />
          <div className="hero-float-card-2">
            <div className="rating">4.9</div>
            <div style={{ display: "flex", gap: 2, fontSize: 12 }}>★★★★★</div>
            <div className="label">Customer Rating</div>
          </div>
        </div>
      </section>

      <div className="trust-bar">
        <div className="trust-pills">
          {[
            ["🚚", "Free Delivery above ₹999"],
            ["💬", "Fast Customer Support"],
            ["🔐", "Secure Online Payments"],
            ["✅", "100% Authentic"],
          ].map(([icon, label]) => (
            <div key={label} className="trust-pill">
              <span>{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <nav className="sr-only" aria-label="Popular eyewear categories">
        <span>Shop:</span>{" "}
        <Link to="/plp?category=Sunglasses">UV sunglasses India</Link>
        {" · "}
        <Link to="/plp?category=Eyeglasses">Prescription eyeglasses</Link>
        {" · "}
        <Link to="/plp?category=Computer">Blue light computer glasses</Link>
        {" · "}
        <Link to="/about">About Eyelens</Link>
        {" · "}
        <Link to="/contact">Customer support</Link>
      </nav>

      <section className="section-pad featured reveal-section" style={{ paddingBottom: 28 }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Featured Products</span>
            <h2 className="section-title">
              Trending This <em>Season</em>
            </h2>
          </div>
          <div className="products-grid">
            {trendingLoading
              ? Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={`sk-${idx}`}
                    className="product-card"
                    style={{ opacity: 0.9 }}
                    aria-hidden
                  >
                    <div
                      className="product-img"
                      style={{
                        background: "linear-gradient(90deg, var(--g100) 25%, var(--g200) 50%, var(--g100) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.2s ease-in-out infinite",
                      }}
                    />
                    <div className="product-body" style={{ padding: "12px 0" }}>
                      <div style={{ height: 10, width: "40%", background: "var(--g100)", borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ height: 14, width: "75%", background: "var(--g100)", borderRadius: 4, marginBottom: 12 }} />
                      <div style={{ height: 12, width: "35%", background: "var(--g100)", borderRadius: 4 }} />
                    </div>
                  </div>
                ))
              : trending.length > 0
                ? trending.map((p, idx) => {
                  const m =
                    p.rawPrice != null && (p._id || p.id)
                      ? p
                      : mapApiProduct({
                          ...p,
                          _id: p._id || p.id || `local-${idx}`,
                          price: p.rawPrice ?? (Number(String(p.price).replace(/[^\d]/g, "")) || 0),
                        });
                  return (
                    <ProductCard
                      key={m.id || m.name}
                      productId={pid(m)}
                      {...m}
                      imagePriority={idx < 4}
                      wished={isWished(m)}
                      onToggleWish={onToggleWishlistId}
                      onClick={() => onSelectProduct?.(m)}
                    />
                  );
                })
                : Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="product-card"
                      style={{ padding: 20, display: "grid", gap: 10, alignContent: "center", minHeight: 220 }}
                    >
                      <div style={{ fontSize: 34 }}>{idx === 0 ? "🕶️" : idx === 1 ? "👓" : "✨"}</div>
                      <div style={{ fontWeight: 800, color: "var(--black)" }}>Fresh styles loading</div>
                      <div style={{ fontSize: 13, color: "var(--g500)" }}>
                        We are updating this collection right now. Tap below to browse the full catalog.
                      </div>
                    </div>
                  ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <button className="btn btn-secondary btn-lg" onClick={() => setPage("plp")}>
              View All Products
            </button>
          </div>
        </div>
      </section>

      {recentProducts.length > 0 && (
        <section className="section-pad reveal-section" style={{ background: "var(--g50)" }}>
          <div className="container">
            <div className="section-header">
              <span className="section-label">Pick up where you left off</span>
              <h2 className="section-title">
                Recently <em>Viewed</em>
              </h2>
            </div>
            <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
              {recentProducts.map((p) => (
                <div key={pid(p)} style={{ flex: "0 0 220px" }}>
                  <ProductCard
                    productId={pid(p)}
                    {...p}
                    wished={isWished(p)}
                    onToggleWish={onToggleWishlistId}
                    onClick={() => onSelectProduct?.(p)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-pad reveal-section" aria-labelledby="home-faq-heading" style={{ paddingTop: 28 }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Helpful answers</span>
            <h2 id="home-faq-heading" className="section-title">
              Eyewear <em>FAQs</em>
            </h2>
            <p className="section-desc">Quick answers about shipping, prescriptions, returns, and pricing.</p>
          </div>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {HOME_FAQ.map(([q, a]) => (
              <details
                key={q}
                style={{
                  border: "1px solid var(--g100)",
                  borderRadius: 14,
                  padding: "12px 16px",
                  marginBottom: 12,
                  background: "var(--white)",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 15 }}>{q}</summary>
                <p style={{ margin: "12px 0 4px", fontSize: 14, color: "var(--g600)", lineHeight: 1.6 }}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad why-section reveal-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label why-section-label">Why Choose Eyelens</span>
            <h2 className="section-title why-section-title">
              The Eyelens <em>Promise</em>
            </h2>
          </div>
          <div className="why-grid">
            {[
              ["🚚", "Free Shipping", "Complimentary delivery across India on orders above ₹999."],
              ["🏠", "Home Try-On", "See how frames fit before you commit — easy exchanges."],
              ["🛡️", "Quality Promise", "Carefully selected materials and strict quality checks on every pair."],
              ["💬", "Support Team", "Need help? Reach our support team by WhatsApp, email, or phone."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="why-card">
                <span className="why-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad reveal-section" style={{ background: "var(--g50)" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Stay in the loop</span>
            <h2 className="section-title">
              Newsletter <em>Signup</em>
            </h2>
            <p className="section-desc">New drops, lens tips, and member-only offers — no spam.</p>
          </div>
          <div
            style={{
              maxWidth: 480,
              margin: "0 auto",
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <input
              className="input"
              type="email"
              placeholder="you@email.com"
              value={newsEmail}
              onChange={(e) => setNewsEmail(e.target.value)}
              style={{ flex: "1 1 220px", minWidth: 200 }}
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={newsDone || newsLoading}
              style={newsDone ? { background: "var(--green)", cursor: "not-allowed" } : {}}
              onClick={async () => {
                const email = newsEmail.trim().toLowerCase();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  showToast?.({ msg: "Please enter a valid email.", type: "error" });
                  return;
                }
                setNewsLoading(true);
                try {
                  const { data } = await api.post("/newsletter/subscribe", { email });
                  const msg = String(data?.message || "");
                  if (msg === "Already subscribed!") {
                    showToast?.({ msg: "You're already subscribed!", type: "info" });
                    setNewsDone(true);
                    return;
                  }
                  setNewsDone(true);
                  setNewsEmail("");
                  showToast?.({ msg: "🎉 Successfully subscribed!", type: "success" });
                } catch {
                  showToast?.({ msg: "Something went wrong. Try again.", type: "error" });
                } finally {
                  setNewsLoading(false);
                }
              }}
            >
              {newsLoading ? "Subscribing..." : newsDone ? "Subscribed ✓" : "Subscribe"}
            </button>
          </div>
        </div>
      </section>

      <section className="section-pad reveal-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Customer Love</span>
            <h2 className="section-title">
              What They&apos;re <em>Saying</em>
            </h2>
          </div>
          <div className="testimonial-grid">
            {[
              {
                text: "The quality is absolutely unreal for the price. The titanium frames rival ones that cost 4× as much. Fast delivery and stunning packaging.",
                name: "Arjun Mehta",
                meta: "Software Engineer, Bangalore",
                emoji: "👨",
              },
              {
                text: "BlueGuard glasses have saved my eyes during long WFH hours. No more 6pm headaches. My whole team ordered after seeing mine!",
                name: "Priya Nair",
                meta: "UX Designer, Mumbai",
                emoji: "👩",
              },
              {
                text: "Ordered the premium Milano frames — arrived in a stunning box, fit perfectly, and get compliments every single day.",
                name: "Kabir Sethi",
                meta: "Entrepreneur, Delhi",
                emoji: "🧑",
              },
            ].map((t) => (
              <div key={t.name} className="testi-card">
                <div className="quote-mark">&quot;</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-stars">★★★★★</div>
                <div className="testi-author">
                  <div className="testi-avatar">{t.emoji}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-meta">{t.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .home-hero-split {
          background: linear-gradient(90deg, #ffffff 0%, #ffffff 44%, #f0faf4 44%, #f0faf4 100%) !important;
        }
        .home-hero-split .hero-right {
          background: #f0faf4 !important;
        }
        .home-hero-product-img {
          width: min(92%, 440px);
          max-height: min(70vh, 520px);
          object-fit: contain;
          border-radius: 20px;
          box-shadow:
            0 28px 56px rgba(0, 0, 0, 0.12),
            0 12px 28px rgba(26, 107, 63, 0.1);
          transform: rotate(-5deg);
        }
        @media (max-width: 768px) {
          .home-page section[aria-label="Offers"] {
            margin-top: 56px !important;
          }
          .home-hero-product-img {
            width: min(100%, 360px);
            max-height: min(46vh, 300px);
            transform: none !important;
          }
        }
        .home-page .cat-grid-home .home-cat-card {
          background: #1a1a1a;
        }
        .home-page .cat-grid-home .home-cat-photo {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.4s ease;
        }
        .home-page .cat-grid-home .home-cat-card:hover .home-cat-photo {
          transform: scale(1.03);
        }
        .home-page .cat-grid-home .home-cat-scrim {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: rgba(0, 0, 0, 0.4);
          pointer-events: none;
        }
        .home-page .cat-grid-home .home-cat-card .cat-body,
        .home-page .cat-grid-home .home-cat-card .cat-arrow {
          z-index: 2;
        }
        .home-page .cat-grid-home .home-cat-card:hover {
          transform: translateY(-6px);
        }
      `}</style>
    </div>
  );
}
