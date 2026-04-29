import { Link } from "react-router-dom";

const essentialLinks = [
  ["Shop", "/plp"],
  ["Track order", "/account"],
  ["Contact", "/contact"],
  ["About", "/about"],
];

export default function Footer() {
  const whatsappMsg = encodeURIComponent("Hi Eyelens, I need help with my order.");
  const whatsappUrl = `https://wa.me/919823786344?text=${whatsappMsg}`;

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div
          className="footer-grid"
          style={{
            gridTemplateColumns: "1.8fr 1fr",
            gap: 32,
            paddingBottom: 28,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="footer-logo">
              <img src="/1.png" alt="Eyelens — premium eyewear" className="footer-logo-img" />
            </div>
            <p className="footer-desc">
              Premium eyewear with clean design, honest pricing, and easy support.
            </p>
          </div>
          <div className="footer-col">
            <h4>Quick links</h4>
            <div className="footer-links">
              {essentialLinks.map(([label, to]) => (
                <Link key={label} className="footer-link" to={to}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>&copy; {new Date().getFullYear()} Eyelens. All rights reserved.</span>
            <span className="footer-credit">
              <a className="footer-credit-link" href="mailto:eyelens2023@gmail.com">
                eyelens2023@gmail.com
              </a>
              {" · "}
              <a className="footer-credit-link" href="tel:9823786344">
                9823786344
              </a>
              {" · "}
              <a className="footer-credit-link" href={whatsappUrl} target="_blank" rel="noreferrer">
                WhatsApp us
              </a>
            </span>
            <span className="footer-credit">
              Built and maintained by{" "}
              <a href="https://www.skylinetv.in/" target="_blank" rel="noreferrer">
                Skyline Tech Ventures
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
