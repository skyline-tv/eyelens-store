import { Link } from "react-router-dom";

const essentialLinks = [
  ["Shop", "/plp"],
  ["Track order", "/account"],
  ["Contact", "/contact"],
  ["About", "/about"],
];

export default function Footer() {
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
            <span className="footer-credit">support@eyelens.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
