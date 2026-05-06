import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import { prefetchRoute } from "../routes/prefetch";

export default function ProductCard({
  productId,
  brand,
  name,
  price,
  origPrice,
  emoji,
  bg,
  imageUrl,
  badge,
  outOfStock,
  wished = false,
  onToggleWish,
  onClick,
  averageRating = 0,
  reviewCount = 0,
  /** LCP / above-the-fold: eager load + high fetch priority */
  imagePriority = false,
}) {
  const [wishRemoveOpen, setWishRemoveOpen] = useState(false);
  const handleSelectLens = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    onClick?.();
  };
  const pid = productId;
  const imgLabel = `${name || "Product"} by ${brand || "Eyelens"}`;

  return (
    <div
      className="product-card"
      onClick={onClick}
      onMouseEnter={() => prefetchRoute("pdp")}
      onTouchStart={() => prefetchRoute("pdp")}
    >
      <div
        className={`product-img product-img-zoom${imageUrl ? " has-photo" : ""}`}
        role={imageUrl ? undefined : "img"}
        aria-label={imageUrl ? undefined : imgLabel}
        style={{
          background: imageUrl ? undefined : bg || "var(--beige)",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imgLabel}
            className="product-img-photo"
            loading={imagePriority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={imagePriority ? "high" : "auto"}
          />
        ) : (
          <div className="product-emoji" aria-hidden>
            {emoji}
          </div>
        )}
        {badge && (
          <div
            className={`badge badge-${badge === "NEW" ? "new" : badge === "OOS" ? "oos" : "sale"} badge-abs`}
          >
            {badge}
          </div>
        )}
        <button
          type="button"
          className="wish-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (!pid) return;
            if (wished) setWishRemoveOpen(true);
            else onToggleWish?.(pid);
          }}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            color: wished ? "var(--white)" : undefined,
            background: wished ? "var(--red)" : undefined,
            opacity: wished ? 1 : undefined,
            transform: wished ? "scale(1)" : undefined,
          }}
        >
          {wished ? "♥" : "♡"}
        </button>
        <div className="product-quick-add" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="add-btn add-btn-quick"
            onClick={handleSelectLens}
            disabled={outOfStock}
          >
            {outOfStock ? "Unavailable" : "Select lens"}
          </button>
        </div>
      </div>
      <div className="product-body">
        <div className="product-brand">{brand}</div>
        <div className="product-name">{name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span className="stars">★★★★★</span>
          <span className="rating-ct">
            ({reviewCount > 0 ? `${(averageRating || 0).toFixed(1)} · ${reviewCount}` : "new"})
          </span>
        </div>
        <div className="product-footer">
          <div className="product-price-row">
            {origPrice ? (
              <span className="product-price-orig" title="Maximum retail price">
                {origPrice}
              </span>
            ) : null}
            <span className="product-price">{price}</span>
          </div>
          <button
            className="add-btn"
            onClick={handleSelectLens}
            disabled={outOfStock}
            aria-label={outOfStock ? "Unavailable" : `Choose lens for ${name}`}
            style={outOfStock ? { background: "var(--g300)", cursor: "not-allowed" } : {}}
          >
            {outOfStock ? "Unavailable" : "Lens"}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={wishRemoveOpen}
        title="Remove from wishlist?"
        onCancel={() => setWishRemoveOpen(false)}
        onConfirm={() => {
          if (pid) onToggleWish?.(pid);
          setWishRemoveOpen(false);
        }}
        confirmText="Yes"
        cancelText="Cancel"
        confirmColor="danger"
      />
    </div>
  );
}
