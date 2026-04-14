import { useEffect, useState } from "react";

export default function FloatingScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed",
        right: 20,
        bottom: 88,
        zIndex: 900,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "1px solid var(--g200)",
        background: "var(--white)",
        boxShadow: "0 8px 24px rgba(0,0,0,.12)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.25s ease",
      }}
    >
      ↑
    </button>
  );
}
