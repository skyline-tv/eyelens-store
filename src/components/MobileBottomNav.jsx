import { useNavigate } from "react-router-dom";

const items = [
  {
    id: "home",
    label: "Home",
    icon: (active) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "var(--em)" : "none"}
        stroke={active ? "var(--em)" : "var(--g400)"}
        strokeWidth="2"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
  },
  {
    id: "plp",
    label: "Shop",
    icon: (active) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "var(--em)" : "var(--g400)"}
        strokeWidth="2"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: "account",
    label: "Account",
    icon: (active) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "var(--em)" : "var(--g400)"}
        strokeWidth="2"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "cart",
    label: "Bag",
    icon: (active) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "var(--em)" : "var(--g400)"}
        strokeWidth="2"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
];

export default function MobileBottomNav({ page, cartQty }) {
  const navigate = useNavigate();
  const go = (id) => {
    navigate(id === "home" ? "/" : `/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        {items.map((item) => {
          const active = page === item.id;
          return (
            <button
              type="button"
              key={item.id}
              className={`mob-nav-btn${active ? " active" : ""}`}
              onClick={() => go(item.id)}
            >
              <div className="mob-cart-wrap">
                {item.icon(active)}
                {item.id === "cart" && cartQty > 0 && (
                  <div className="mob-cart-badge">{cartQty}</div>
                )}
              </div>
              <span
                className="mob-nav-label"
                style={{ color: active ? "var(--em)" : "var(--g400)" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
