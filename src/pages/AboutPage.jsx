import { useEffect } from "react";
import { Link } from "react-router-dom";
import { setPageSeo } from "../utils/seo";
import { absoluteUrl } from "../config/site.js";
import { buildBreadcrumbJsonLd } from "../utils/seoSchemas.js";

export default function AboutPage({ setPage }) {
  useEffect(() => {
    const restore = setPageSeo({
      title: "About Us | Eyelens — 25+ Years of Trust",
      description:
        "Eyelens: over 25 years of premium eyewear, optical expertise, and service-first care. Stylish frames, premium lenses, and genuine customer trust across India.",
      canonicalPath: "/about",
      keywords: "Eyelens about us, eyewear India, optical expertise, premium glasses, trusted eyewear brand",
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: "Home", url: absoluteUrl("/") },
          { name: "About", url: absoluteUrl("/about") },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Us | Eyelens",
          url: absoluteUrl("/about"),
          isPartOf: { "@type": "WebSite", name: "Eyelens", url: absoluteUrl("/") },
        },
      ],
    });
    return () => restore();
  }, []);

  return (
    <div className="page-enter about-page" style={{ paddingTop: 64 }}>
      <div className="container" style={{ paddingTop: 12, paddingBottom: 8 }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link> › <span>About</span>
        </nav>
      </div>
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
            About Us
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
            About Us
          </h1>
          <p
            className="stagger-3"
            style={{
              fontSize: 19,
              color: "rgba(255,255,255,.75)",
              maxWidth: 640,
              margin: "0 auto 20px",
              lineHeight: 1.7,
            }}
          >
            Eyewear is more than vision correction — it’s a legacy built on trust, quality, and exceptional service.
          </p>
          <p
            className="stagger-3"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "rgba(255,255,255,.9)",
              maxWidth: 640,
              margin: "0 auto 36px",
              lineHeight: 1.6,
              letterSpacing: ".02em",
            }}
          >
            25+ Years of Trust · Premium Eyewear · Exceptional Service
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
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {[
              ["25+", "Years of expertise"],
              ["Wide", "Premium collection"],
              ["4.9★", "Customer trust"],
              ["India", "Nationwide reach"],
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
          <div className="about-mission-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <span className="section-label">Our story</span>
              <h2 className="section-title" style={{ marginBottom: 20 }}>
                Built on <em>trust</em> &amp; craft
              </h2>
              <p style={{ fontSize: 17, color: "var(--g500)", lineHeight: 1.8, marginBottom: 16 }}>
                Our journey began over 25 years ago with a vision to provide premium eyewear and genuine customer care
                to every customer. Built on decades of optical expertise and experience, Eyelens continues to deliver
                stylish, high-quality eyewear designed for both comfort and confidence.
              </p>
              <p style={{ fontSize: 17, color: "var(--g500)", lineHeight: 1.8, marginBottom: 16 }}>
                From modern frames and premium lenses to personalized support and reliable after-sales service, every
                product reflects our commitment to quality craftsmanship and customer satisfaction. We believe eyewear
                should not only improve vision but also elevate your everyday style.
              </p>
              <p style={{ fontSize: 17, color: "var(--g500)", lineHeight: 1.8, marginBottom: 16 }}>
                Today, Eyelens is trusted by customers for its wide collection, affordable luxury, and service-first
                approach — making us a preferred destination for premium eyewear.
              </p>
              <p style={{ fontSize: 17, color: "var(--g500)", lineHeight: 1.8, marginBottom: 28 }}>
                With strong roots, years of experience, and a passion for excellence, Eyelens continues to redefine the
                eyewear experience for customers across India.
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
            <div className="about-values-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["🤝", "Trust & heritage", "25+ years of optical expertise you can rely on"],
                ["✨", "Premium eyewear", "Modern frames and lenses built for comfort and confidence"],
                ["💚", "Service-first", "Personalized support and dependable after-sales care"],
                ["🇮🇳", "Across India", "A preferred destination for style, value, and care"],
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
            Experience Eyelens
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.75)", marginBottom: 28 }}>
            Explore our collection — affordable luxury and a service-first approach, trusted for years.
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
