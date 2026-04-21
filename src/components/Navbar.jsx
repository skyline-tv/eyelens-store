import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getUser, logout } from "../auth/auth";
import { api } from "../api/axiosInstance";
import { mapApiProduct } from "../utils/productMap";

const STORE_LOGO_SRC = "/2.png";

const links = [
  { label: "Home", id: "home", icon: "🏠" },
  { label: "Shop", id: "plp", icon: "🛍" },
  { label: "About", id: "about", icon: "ℹ️" },
  { label: "Contact", id: "contact", icon: "📬" },
];

export default function Navbar({ page, cartQty, wishlist = [], cartPulseTick = 0 }) {
  const routerNavigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const searchWrapRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cartPulseOn, setCartPulseOn] = useState(false);
  const searchDebounceRef = useRef(null);

  const loggedIn = isAuthenticated();
  const user = getUser();

  const go = useCallback(
    (nextPage) => {
      setDrawerOpen(false);
      routerNavigate(nextPage === "home" ? "/" : `/${nextPage}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [routerNavigate]
  );

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchResults([]);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchResults([]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = searchQ.trim();
    if (!searchOpen) return undefined;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!q || q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/products", { params: { search: q, limit: 8 } });
        const list = (data.data || []).map(mapApiProduct);
        setSearchResults(list);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQ, searchOpen]);

  useEffect(() => {
    if (!cartPulseTick) return undefined;
    setCartPulseOn(true);
    const id = setTimeout(() => setCartPulseOn(false), 1000);
    return () => clearTimeout(id);
  }, [cartPulseTick]);

  const wishCount = wishlist?.length || 0;

  return (
    <>
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <nav className={`navbar${scrolled ? " scrolled nav-frosted" : ""}`}>
        <div
          className="nav-logo"
          onClick={() => go("home")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              go("home");
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Eyelens logo, home"
        >
          <img src={STORE_LOGO_SRC} alt="Eyelens — home" className="nav-logo-img" />
        </div>
        <div className="nav-links">
          {links.slice(0, 5).map((l) => (
            <span
              key={l.label}
              className={`nav-link${page === l.id ? " active" : ""}`}
              onClick={() => go(l.id)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  go(l.id);
                }
              }}
            >
              {l.label}
            </span>
          ))}
        </div>
        <div className="nav-right" ref={searchWrapRef} style={{ position: "relative" }}>
          <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {searchOpen ? (
              <input
                className="input"
                autoFocus
                aria-label="Search products"
                placeholder="Search frames, brands…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = searchQ.trim();
                    if (q) {
                      setSearchOpen(false);
                      routerNavigate(`/plp?search=${encodeURIComponent(q)}`);
                      setSearchQ("");
                      setSearchResults([]);
                    }
                  }
                }}
                style={{ width: 220, padding: "8px 12px", fontSize: 13 }}
              />
            ) : null}
            <button
              type="button"
              className="nav-icon-btn desktop-only"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((o) => !o);
                if (searchOpen) {
                  setSearchQ("");
                  setSearchResults([]);
                }
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
          {searchOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 340,
                maxWidth: "90vw",
                background: "var(--white)",
                border: "1px solid var(--g100)",
                borderRadius: 12,
                boxShadow: "0 16px 40px rgba(0,0,0,.12)",
                zIndex: 200,
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {searchLoading ? (
                <div style={{ padding: 16, fontSize: 13, color: "var(--g500)" }}>Searching…</div>
              ) : !searchQ.trim() ? (
                <div style={{ padding: 16, fontSize: 13, color: "var(--g500)" }}>Type to search</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: "var(--g500)" }}>No results found</div>
              ) : (
                searchResults.map((p) => {
                  const id = String(p._id || p.id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQ("");
                        setSearchResults([]);
                        routerNavigate(`/product/${id}`);
                      }}
                      style={{
                        display: "flex",
                        gap: 12,
                        width: "100%",
                        textAlign: "left",
                        padding: 12,
                        border: "none",
                        borderBottom: "1px solid var(--g100)",
                        background: "transparent",
                        cursor: "pointer",
                        alignItems: "center",
                      }}
                    >
                      <div
                        role="img"
                        aria-label={`${p.name || "Product"} by ${p.brand || "Eyelens"}`}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          flexShrink: 0,
                          background: p.imageUrl ? `url(${p.imageUrl}) center/cover` : p.bg || "var(--g100)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                        }}
                      >
                        {!p.imageUrl && (p.emoji || "👓")}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--black)" }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "var(--g500)" }}>{p.brand}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--em)" }}>{p.price}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
          <button
            type="button"
            className="nav-icon-btn desktop-only"
            onClick={() => routerNavigate("/account?tab=wishlist")}
            aria-label="Wishlist"
            style={{ position: "relative" }}
          >
            ♡
            {wishCount > 0 && <div className="cart-badge">{wishCount > 9 ? "9+" : wishCount}</div>}
          </button>
          <div className="desktop-only" ref={accountRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => setAccountOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={accountOpen}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            {accountOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  minWidth: 200,
                  background: "var(--white)",
                  border: "1px solid var(--g100)",
                  borderRadius: 12,
                  boxShadow: "0 16px 40px rgba(0,0,0,.12)",
                  padding: "8px 0",
                  zIndex: 100,
                }}
              >
                {loggedIn ? (
                  <>
                    <div style={{ padding: "10px 14px", fontSize: 12, color: "var(--g500)", borderBottom: "1px solid var(--g100)" }}>
                      {user?.name || "Account"}
                    </div>
                    <button type="button" className="nav-dd-item" onClick={() => { setAccountOpen(false); routerNavigate("/account"); }}>
                      My Account
                    </button>
                    <button type="button" className="nav-dd-item" onClick={() => { setAccountOpen(false); routerNavigate("/account"); }}>
                      Orders
                    </button>
                    <button
                      type="button"
                      className="nav-dd-item"
                      onClick={async () => {
                        setAccountOpen(false);
                        await logout();
                        routerNavigate("/login", { replace: true });
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="nav-dd-link" onClick={() => setAccountOpen(false)}>
                      Login
                    </Link>
                    <Link to="/signup" className="nav-dd-link" onClick={() => setAccountOpen(false)}>
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          {!loggedIn && (
            <>
              <Link
                to="/login"
                className="btn btn-ghost btn-sm desktop-only"
                style={{ fontSize: 12, padding: "7px 14px", textDecoration: "none" }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary btn-sm desktop-only"
                style={{ fontSize: 12, padding: "7px 14px", textDecoration: "none" }}
              >
                Sign Up
              </Link>
            </>
          )}
          <button type="button" className={`nav-icon-btn${cartPulseOn ? " cart-pulse" : ""}`} onClick={() => go("cart")} style={{ position: "relative" }} aria-label={`Shopping cart, ${cartQty} items`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <div className="cart-badge">{cartQty}</div>
          </button>
          <button type="button" className="nav-icon-btn nav-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      <style>{`
        .nav-frosted { backdrop-filter: saturate(140%) blur(12px); background: var(--nav-bg) !important; }
        .nav-dd-item, .nav-dd-link {
          display: block; width: 100%; text-align: left; padding: 10px 14px; font-size: 13px;
          border: none; background: none; cursor: pointer; color: var(--black); text-decoration: none;
        }
        .nav-dd-item:hover, .nav-dd-link:hover { background: var(--g50); color: var(--em); }
        .cart-pulse {
          animation: cartPulseAnim 1s ease-out;
        }
        @keyframes cartPulseAnim {
          0% { transform: scale(1); }
          25% { transform: scale(1.14); }
          50% { transform: scale(0.96); }
          75% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @media (min-width: 900px) {
          .nav-hamburger { display: none !important; }
        }
        @media (max-width: 899px) {
          .desktop-only { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-links { display: none !important; }
        }
      `}</style>

      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer drawer-slide">
            <div className="drawer-header">
              <div className="nav-logo">
                <img src={STORE_LOGO_SRC} alt="Eyelens — home" className="nav-logo-img" />
              </div>
              <button type="button" className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                ✕
              </button>
            </div>
            <div className="drawer-links">
              {links.map((l) => (
                <div
                  key={l.label}
                  className={`drawer-link${page === l.id || (l.id === "home" && page === "home") ? " active" : ""}`}
                  onClick={() => go(l.id)}
                >
                  <span className="link-icon">{l.icon}</span>
                  {l.label}
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--g100)", display: "flex", gap: 10, flexDirection: "column" }}>
              {loggedIn ? (
                <button type="button" className="btn btn-ghost btn-full" onClick={() => { setDrawerOpen(false); routerNavigate("/account"); }}>
                  My Account
                </button>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary" style={{ textAlign: "center", textDecoration: "none" }} onClick={() => setDrawerOpen(false)}>
                    Sign Up
                  </Link>
                  <Link to="/login" className="btn btn-ghost" style={{ textAlign: "center", textDecoration: "none" }} onClick={() => setDrawerOpen(false)}>
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
