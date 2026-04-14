import { Link } from "react-router-dom";

const socialPlatforms = [
  {
    key: "instagram",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="5"
          ry="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
        <path
          fill="currentColor"
          d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z"
        />
      </svg>
    ),
  },
];

const paymentMethods = [
  {
    key: "visa",
    label: "Visa",
    icon: (
      <svg viewBox="0 0 72 28" aria-hidden="true">
        <rect x="0.5" y="0.5" width="71" height="27" rx="7" fill="#FFFFFF" stroke="#E5E7EB" />
        <text x="36" y="18" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="900" letterSpacing="1" fill="#1A1F71">
          VISA
        </text>
      </svg>
    ),
  },
  {
    key: "mastercard",
    label: "Mastercard",
    icon: (
      <svg viewBox="0 0 72 28" aria-hidden="true">
        <rect x="0.5" y="0.5" width="71" height="27" rx="7" fill="#FFFFFF" stroke="#E5E7EB" />
        <circle cx="31" cy="14" r="7.5" fill="#EB001B" />
        <circle cx="41" cy="14" r="7.5" fill="#F79E1B" />
        <rect x="35.4" y="6.5" width="1.2" height="15" fill="#FF5F00" opacity="0.8" />
      </svg>
    ),
  },
  {
    key: "upi",
    label: "UPI",
    icon: (
      <svg viewBox="0 0 72 28" aria-hidden="true">
        <rect x="0.5" y="0.5" width="71" height="27" rx="7" fill="#FFFFFF" stroke="#E5E7EB" />
        <text x="20" y="18" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#111827">
          UPI
        </text>
        <path d="M44 8 L52 14 L44 20" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M47 6.5 L55 12.5 L47 18.5" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
      </svg>
    ),
  },
  {
    key: "paytm",
    label: "Paytm",
    icon: (
      <svg viewBox="0 0 72 28" aria-hidden="true">
        <rect x="0.5" y="0.5" width="71" height="27" rx="7" fill="#FFFFFF" stroke="#E5E7EB" />
        <text x="29" y="18" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#003B8E">
          pay
        </text>
        <text x="45" y="18" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#00AEEF">
          tm
        </text>
      </svg>
    ),
  },
  {
    key: "cod",
    label: "Cash on Delivery",
    icon: (
      <svg viewBox="0 0 72 28" aria-hidden="true">
        <rect x="0.5" y="0.5" width="71" height="27" rx="7" fill="#FFFFFF" stroke="#E5E7EB" />
        <rect x="9" y="8" width="20" height="12" rx="3" fill="#0F172A" opacity="0.9" />
        <circle cx="19" cy="14" r="2.6" fill="#F8FAFC" />
        <text x="47" y="18" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="900" letterSpacing="0.8" fill="#0F172A">
          COD
        </text>
      </svg>
    ),
  },
];

const footerColumns = [
  {
    title: "Shop",
    links: [
      ["Sunglasses online", "/plp?category=Sunglasses"],
      ["Computer glasses", "/plp?category=Computer"],
      ["Prescription eyeglasses", "/plp?category=Eyeglasses"],
      ["Popular frames", "/plp?sort=popular"],
      ["New arrivals", "/plp?sort=newest"],
    ],
  },
  {
    title: "Support",
    links: [
      ["Help center", "/contact"],
      ["Track your order", "/account"],
      ["Returns & exchanges", "/account"],
      ["Warranty info", "/contact"],
      ["Contact Eyelens", "/contact"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Eyelens", "/about"],
      ["Careers", "/about"],
      ["Blog", "/about"],
      ["Privacy policy", "/about"],
      ["Terms of use", "/about"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <img src="/LOGO.svg" alt="Eyelens — premium eyewear" className="footer-logo-img" />
            </div>
            <p className="footer-desc">
              Premium eyewear crafted for those who live at the intersection of vision and fashion. Every pair tells a
              story.
            </p>
            <div className="footer-socials">
              {socialPlatforms.map(({ key, label, icon }) => (
                <button key={key} type="button" className="social-btn" aria-label={label}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title} className="footer-col">
              <h4>{col.title}</h4>
              <div className="footer-links">
                {col.links.map(([label, to]) => (
                  <Link key={label} className="footer-link" to={to}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>&copy; {new Date().getFullYear()} Eyelens. All rights reserved.</span>
            <span className="footer-credit">
              This store is designed, built, and maintained by{" "}
              <a
                className="footer-credit-link"
                href="https://www.skylinetv.in"
                target="_blank"
                rel="noopener noreferrer"
              >
                Skyline Tech Ventures
              </a>
              .
            </span>
          </div>
          <div className="footer-payments" aria-label="Supported payment methods">
            {paymentMethods.map((method) => (
              <span key={method.key} className="footer-pay-icon" role="img" aria-label={method.label} title={method.label}>
                {method.icon}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
