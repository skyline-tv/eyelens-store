import { useEffect } from "react";

/** Bottom-right toast: type = success | error | info */
export default function Toast({ msg, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const bg =
    type === "error"
      ? "linear-gradient(135deg, #FEF2F2, #FEE2E2)"
      : type === "info"
        ? "linear-gradient(135deg, #EFF6FF, #DBEAFE)"
        : "linear-gradient(135deg, var(--em-pale), var(--em-light))";
  const border =
    type === "error" ? "rgba(220,38,38,.35)" : type === "info" ? "rgba(37,99,235,.25)" : "rgba(26,107,63,.25)";
  const color = type === "error" ? "#991B1B" : type === "info" ? "#1D4ED8" : "var(--em-dark)";
  const icon = type === "error" ? "!" : type === "info" ? "i" : "✓";

  return (
    <div
      className="toast"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        left: "auto",
        top: "auto",
        transform: "none",
        maxWidth: 360,
        background: bg,
        border: `1px solid ${border}`,
        color,
        boxShadow: "0 16px 40px rgba(0,0,0,.12)",
        zIndex: 9999,
        animation: "toastIn .35s ease-out",
      }}
    >
      <span className="toast-icon" style={{ background: type === "success" ? "var(--em)" : type === "error" ? "#DC2626" : "#2563EB" }}>
        {icon}
      </span>
      {msg}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
