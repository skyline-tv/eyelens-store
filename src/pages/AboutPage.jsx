import { useEffect } from "react";
import { setPageSeo } from "../utils/seo";

export default function AboutPage({ setPage }) {
  useEffect(() => {
    const restore = setPageSeo({
      title: "About Eyelens | Premium online eyewear brand",
      description:
        "Learn how Eyelens brings premium prescription glasses, sunglasses, and computer glasses online with honest pricing and thoughtful customer care.",
      canonicalPath: "/about",
      keywords: "Eyelens brand, eyewear company India, prescription glasses retailer",
    });
    return () => restore();
  }, []);

  return (
    <div className="page-enter about-page" style={{ paddingTop: 64 }}>
      <section
        style={{
          background: "linear-gradient(135deg, var(--em-dark) 0%, var(--em) 50%, var(--em-mid) 100%)",
          padding: "80px 0 96px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-5%",
            width: 400,
            height: 400,
            background: "rgba(255,255,255,.05)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30%",
            left: "10%",
            width: 300,
            height: 300,
            background: "rgba(255,255,255,.04)",
            borderRadius: "50%",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <span
            className="stagger-1"
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,.12)",
              color: "rgba(255,255,255,.9)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              padding: "6px 16px",
              borderRadius: 999,
              marginBottom: 20,
            }}
          >
            Our Story
          </span>
          <h1
            className="stagger-2"
            style={{
              fontFamily: "var(--font-d)",
              fontSize: "clamp(42px,5.6vw,72px)",
              fontWeight: 800,
              color: "var(--white)",
              lineHeight: 1.05,
              letterSpacing: "-.03em",
              marginBottom: 20,
            }}
          >
            Seeing the world
            <br />
            <em style={{ fontStyle: "italic", opacity: 0.85 }}>more clearly</em>
          </h1>
          <p
            className="stagger-3"
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,.75)",
              maxWidth: 560,
              margin: "0 auto 36px",
              lineHeight: 1.7,
            }}
          >
            Founded in 2020, Eyelens was born from a belief that everyone deserves premium eyewear without compromising
            on quality or breaking the bank.
          </p>
          <button
            className="btn stagger-4"
            style={{
              background: "var(--white)",
              color: "var(--em)",
              fontWeight: 700,
              padding: "13px 28px",
              borderRadius: 12,
            }}
            onClick={() => setPage("plp")}
          >
            Shop the Collection →
          </button>
        </div>
      </section>

      <section style={{ background: "var(--em-pale)", borderBottom: "1px solid var(--g100)", padding: "0" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {[
              ["50K+", "Happy Customers"],
              ["200+", "Frame Styles"],
              ["4.9★", "Avg Rating"],
              ["2020", "Est. Bangalore"],
            ].map(([num, label], i) => (
              <div
                key={label}
                style={{
                  padding: "36px 24px",
                  textAlign: "center",
                  borderRight: i < 3 ? "1px solid var(--g100)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-d)",
                    fontSize: "clamp(32px,4vw,50px)",
                    fontWeight: 800,
                    color: "var(--em)",
                    letterSpacing: "-.02em",
                  }}
                >
                  {num}
                </div>
                <div style={{ fontSize: 14, color: "var(--g500)", fontWeight: 500, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad" style={{ background: "var(--g50)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <span className="section-label">Our Mission</span>
              <h2 className="section-title" style={{ marginBottom: 20 }}>
                Vision that <em>connects</em>
              </h2>
              <p style={{ fontSize: 17, color: "var(--g500)", lineHeight: 1.8, marginBottom: 16 }}>
                We started Eyelens with a simple idea: premium eyewear shouldn't be a luxury. By cutting out middlemen
                and working directly with master craftspeople, we deliver frames that rival luxury brands at a fraction
                of the price.
              </p>
              <p style={{ fontSize: 17, color: "var(--g500)", lineHeight: 1.8, marginBottom: 28 }}>
                Every pair is crafted with precision and care — from the titanium alloys to the anti-reflective
                coatings. We obsess over every detail so you don't have to.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-primary" onClick={() => setPage("plp")}>
                  Shop Now
                </button>
                <button className="btn btn-ghost" onClick={() => setPage("contact")}>
                  Get in Touch
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["🔬", "Precision Crafting", "Each frame is tested for 48+ hours"],
                ["🌿", "Sustainable Materials", "Eco-conscious packaging & sourcing"],
                ["💎", "Premium Quality", "Titanium, acetate & stainless steel"],
                ["🚀", "Fast Delivery", "Ships within 24 hours of ordering"],
              ].map(([icon, title, desc]) => (
                <div
                  key={title}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.09)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.04)";
                  }}
                  style={{
                    background: "var(--white)",
                    borderRadius: 16,
                    padding: 24,
                    border: "1px solid var(--g100)",
                    boxShadow: "0 2px 12px rgba(0,0,0,.04)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                  <div
                    style={{
                      fontFamily: "var(--font-d)",
                      fontSize: 16,
                      fontWeight: 800,
                      color: "var(--black)",
                      marginBottom: 6,
                    }}
                  >
                    {title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--g500)", lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "linear-gradient(135deg, var(--em-dark), var(--em))", padding: "64px 0" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-d)",
              fontSize: "clamp(28px,4vw,46px)",
              fontWeight: 800,
              color: "var(--white)",
              marginBottom: 16,
            }}
          >
            Ready to see the difference?
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.75)", marginBottom: 28 }}>
            Join 50,000 happy customers. Free shipping on your first order.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn"
              style={{ background: "var(--white)", color: "var(--em)", fontWeight: 700, padding: "13px 28px" }}
              onClick={() => setPage("plp")}
            >
              Shop All Frames
            </button>
            <button
              className="btn"
              style={{
                background: "transparent",
                color: "var(--white)",
                border: "1.5px solid rgba(255,255,255,.4)",
                padding: "13px 28px",
              }}
              onClick={() => setPage("signup")}
            >
              Create Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
