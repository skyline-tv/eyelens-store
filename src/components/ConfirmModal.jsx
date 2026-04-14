import { useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  children,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "danger",
  confirmDisabled = false,
}) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, isOpen, { onEscape: onCancel });

  if (!isOpen) return null;

  const confirmStyle =
    confirmColor === "danger"
      ? { background: "var(--red)", color: "#fff", border: "none" }
      : { background: "var(--em)", color: "#fff", border: "none" };

  return (
    <div
      role="presentation"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(0,0,0,.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-confirm-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--white)",
          borderRadius: 16,
          padding: 24,
          maxWidth: 420,
          width: "100%",
          border: "1px solid var(--g100)",
          boxShadow: "0 24px 48px rgba(0,0,0,.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 id="store-confirm-title" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
            {title}
          </h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>
        <div style={{ fontSize: 14, color: "var(--g600)", lineHeight: 1.5, marginBottom: 20 }}>
          {children}
          {!children && message ? message : null}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={confirmStyle}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
