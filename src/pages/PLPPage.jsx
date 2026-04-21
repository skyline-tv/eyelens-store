import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { api } from "../api/axiosInstance";
import { mapApiProduct } from "../utils/productMap";
import { setPageSeo } from "../utils/seo";

function enrichProduct(p) {
  const rawPrice =
    p.rawPrice != null
      ? p.rawPrice
      : Number(String(p.price || "").replace(/[^\d]/g, "")) || 0;
  return { ...p, rawPrice };
}

export default function PLPPage({ onSelectProduct, wishlist = [], onToggleWishlistId }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname, search: locationSearch } = useLocation();
  const [filterOpen, setFilterOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);

  const category = searchParams.get("category") || "";
  const gender = searchParams.get("gender") || "";
  const frameType = searchParams.get("frameType") || "";
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sort") || "newest";
  const search = searchParams.get("search") || "";
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  const h1Title = useMemo(() => {
    if (search.trim()) return `Search results for “${search.trim().slice(0, 56)}”`;
    if (brand.trim()) return `${brand.trim()} glasses & sunglasses online`;
    if (category.trim()) return `${category.trim()} eyewear — shop online`;
    if (gender && gender !== "unisex") return `${gender.charAt(0).toUpperCase() + gender.slice(1)} frames & sunglasses`;
    return "Shop prescription glasses & sunglasses online";
  }, [search, brand, category, gender]);

  useEffect(() => {
    const canonicalPath = `${pathname}${locationSearch}` || "/plp";
    let title = "Shop eyewear online | Eyelens";
    if (search.trim()) title = `Search “${search.trim().slice(0, 28)}” | Eyelens`;
    else if (category.trim()) title = `${category.trim()} online | Eyelens`;
    else if (brand.trim()) title = `${brand.trim()} eyewear | Eyelens`;
    else if (gender && gender !== "unisex") title = `${gender} frames | Eyelens`;
    const description = search.trim()
      ? `Eyelens search for “${search.trim().slice(0, 72)}” — prescription-ready frames, sunglasses, and lens-friendly styles.`
      : "Filter Eyelens by category, brand, gender, and price. Buy prescription glasses, sunglasses, and computer glasses online with clear pricing.";
    const restore = setPageSeo({
      title,
      description,
      canonicalPath,
      keywords: "buy eyeglasses online India, prescription sunglasses, computer glasses, Eyelens shop",
    });
    return () => restore();
  }, [category, brand, gender, frameType, search, sortBy, minPrice, maxPrice, pathname, locationSearch]);

  const setParam = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === "" || value == null) next.delete(key);
        else next.set(key, String(value));
        return next;
      });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = {};
        if (category.trim()) params.category = category.trim();
        if (gender && ["unisex", "men", "women", "kids"].includes(gender)) params.gender = gender;
        if (frameType.trim()) params.frameType = frameType.trim();
        if (brand.trim()) params.brand = brand.trim();
        if (minPrice !== "" && !Number.isNaN(Number(minPrice))) params.minPrice = minPrice;
        if (maxPrice !== "" && !Number.isNaN(Number(maxPrice))) params.maxPrice = maxPrice;
        if (sortBy === "best") params.sort = "popular";
        else if (["price-asc", "price-desc", "newest", "popular"].includes(sortBy)) params.sort = sortBy;
        else params.sort = "newest";
        if (debouncedSearch) params.search = debouncedSearch;

        const { data } = await api.get("/products", { params });
        const list = (data.data || []).map(mapApiProduct).map(enrichProduct);
        if (!cancelled) {
          setAllProducts(list);
          const uniq = [...new Set(list.map((p) => p.brand).filter(Boolean))].sort();
          setBrands(uniq);
        }
      } catch {
        if (!cancelled) {
          setAllProducts([]);
          setBrands([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, gender, frameType, brand, minPrice, maxPrice, sortBy, debouncedSearch]);

  const filteredProducts = useMemo(() => {
    return allProducts;
  }, [allProducts]);

  const pid = (p) => String(p._id || p.id || "");
  const isWished = (p) => wishlist.includes(pid(p));

  const priceMax = 20000;
  const minNum = minPrice === "" ? 0 : Math.max(0, Number(minPrice) || 0);
  const maxNum = maxPrice === "" ? priceMax : Math.min(priceMax, Number(maxPrice) || priceMax);

  const filterContent = (
    <>
      <div className="filter-section">
        <div className="filter-title">Category</div>
        {["", "Sunglasses", "Eyeglasses", "Computer", "Sports"].map((c) => (
          <label key={c || "all"} className="filter-option" onClick={() => setParam("category", c)}>
            <input type="radio" checked={category === c} readOnly />
            <span>{c === "" ? "All" : c}</span>
          </label>
        ))}
      </div>
      <div className="filter-section">
        <div className="filter-title">Gender</div>
        {["", "unisex", "men", "women", "kids"].map((g) => (
          <label key={g || "all"} className="filter-option" onClick={() => setParam("gender", g)}>
            <input type="radio" checked={gender === g} readOnly />
            <span>{g === "" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}</span>
          </label>
        ))}
      </div>
      <div className="filter-section">
        <div className="filter-title">Frame type</div>
        {["", "Round", "Rectangle", "Aviator", "Wayfarer", "Wrap"].map((f) => (
          <label key={f || "all"} className="filter-option" onClick={() => setParam("frameType", f)}>
            <input type="radio" checked={frameType === f} readOnly />
            <span>{f === "" ? "All" : f}</span>
          </label>
        ))}
      </div>
      <div className="filter-section">
        <div className="filter-title">Brand</div>
        <select
          className="input"
          value={brand}
          onChange={(e) => setParam("brand", e.target.value)}
          style={{ width: "100%", marginTop: 8 }}
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-section">
        <div className="filter-title">Price range (₹)</div>
        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
          <input
            type="range"
            min={0}
            max={priceMax}
            value={maxNum}
            onChange={(e) => setParam("maxPrice", e.target.value)}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--g500)" }}>
            <span>₹{minNum.toLocaleString("en-IN")}</span>
            <span style={{ marginLeft: "auto" }}>Up to ₹{maxNum.toLocaleString("en-IN")}</span>
          </div>
          <div className="form-row2">
            <input
              className="input"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setParam("minPrice", e.target.value.replace(/\D/g, ""))}
            />
            <input
              className="input"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setParam("maxPrice", e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>
      </div>
    </>
  );

  const activeCount = [category, gender, frameType, brand, minPrice, maxPrice, search].filter(Boolean).length;

  const skeletonGrid = (
    <div className="plp-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="product-card"
          style={{ opacity: 0.85, animation: "fadeUp .4s ease both", animationDelay: `${i * 0.04}s` }}
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
      ))}
    </div>
  );

  return (
    <div className="page-enter" style={{ paddingTop: 64 }}>
      {filterOpen && (
        <>
          <div className="filter-sheet-overlay" onClick={() => setFilterOpen(false)} />
          <div className="filter-sheet">
            <div className="filter-sheet-handle" />
            <div className="filter-sheet-header">
              <span className="filter-sheet-title">
                Filters{" "}
                {activeCount > 0 && (
                  <span
                    style={{
                      background: "var(--em)",
                      color: "var(--white)",
                      borderRadius: "999px",
                      padding: "2px 8px",
                      fontSize: 11,
                      marginLeft: 6,
                    }}
                  >
                    {activeCount}
                  </span>
                )}
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  Clear
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setFilterOpen(false)}>
                  Apply
                </button>
              </div>
            </div>
            <div className="filter-sheet-body">{filterContent}</div>
          </div>
        </>
      )}

      <div className="plp-header">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden> › </span>
            <span>Shop</span>
          </nav>
          <h1>{h1Title}</h1>
          <p style={{ fontSize: 14, color: "var(--g400)", marginTop: 6 }}>
            {loading ? "Loading catalogue…" : `${filteredProducts.length} products · Refined for you`}
          </p>
        </div>
      </div>

      <div className="container">
        <div style={{ display: "flex", gap: 10, padding: "16px 0", alignItems: "center", flexWrap: "wrap" }}>
          <label htmlFor="plp-search" className="sr-only">
            Search products
          </label>
          <input
            id="plp-search"
            className="input"
            placeholder="Search frames or brands…"
            value={search}
            onChange={(e) => setParam("search", e.target.value)}
            style={{ flex: "1 1 200px", minWidth: 160, padding: "10px 14px" }}
          />
          <button className="filter-sheet-btn" onClick={() => setFilterOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <select
            className="input"
            style={{ flex: "1 1 180px", padding: "10px 14px" }}
            value={sortBy}
            onChange={(e) => setParam("sort", e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="best">Best Selling</option>
          </select>
        </div>

        <div className="plp-layout">
          <aside className="filter-sidebar">
            <div className="filter-heading">
              <span>Filters</span>
              <span style={{ fontSize: 12, color: "var(--em)", cursor: "pointer" }} onClick={clearFilters}>
                Clear all
              </span>
            </div>
            {filterContent}
          </aside>

          <div>
            <p style={{ fontSize: 12, color: "var(--g500)", marginBottom: 16 }}>
              {loading ? "Loading…" : `Showing ${filteredProducts.length} products`}
            </p>
            {loading ? (
              skeletonGrid
            ) : (
              <div className="plp-grid">
                {filteredProducts.length === 0 ? (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden>
                      🔍
                    </div>
                    {search.trim() ? (
                      <>
                        <div
                          style={{
                            fontFamily: "var(--font-d)",
                            fontSize: 18,
                            fontWeight: 800,
                            color: "var(--black)",
                            marginBottom: 8,
                          }}
                        >
                          Nothing found for &quot;{search.trim()}&quot;
                        </div>
                        <div style={{ fontSize: 14, color: "var(--g500)", marginBottom: 20 }}>
                          Try a different term or clear the search box.
                        </div>
                        <button type="button" className="btn btn-primary" onClick={() => setParam("search", "")}>
                          Clear search
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            fontFamily: "var(--font-d)",
                            fontSize: 18,
                            fontWeight: 800,
                            color: "var(--black)",
                            marginBottom: 8,
                          }}
                        >
                          No products found
                        </div>
                        <div style={{ fontSize: 14, color: "var(--g500)", marginBottom: 20 }}>
                          Try adjusting filters or search
                        </div>
                        <button type="button" className="btn btn-ghost" onClick={clearFilters}>
                          Clear all filters
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id || p.name}
                      productId={pid(p)}
                      {...p}
                      wished={isWished(p)}
                      onToggleWish={onToggleWishlistId}
                      onClick={() => onSelectProduct?.(p)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
