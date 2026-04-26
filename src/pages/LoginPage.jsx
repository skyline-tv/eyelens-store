import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { login, isAuthenticated } from "../auth/auth";
import { setPageSeo } from "../utils/seo";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const suspendedBanner = searchParams.get("suspended") === "1";

  const from = useMemo(() => location.state?.from || "/account", [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState({});

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  useEffect(() => {
    const restore = setPageSeo({
      title: "Sign in | Eyelens account",
      description:
        "Access your Eyelens orders, wishlist, and saved prescriptions. Secure login for returning customers.",
      canonicalPath: "/login",
      noindex: true,
    });
    return () => restore();
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [from, navigate]);

  if (isAuthenticated()) {
    return null;
  }

  const validateFields = () => {
    const next = {};
    const em = email.trim();
    if (!em) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
    setFieldErr(next);
    return Object.keys(next).length === 0;
  };

  return (
    <div className="page-enter login-split-wrap" style={{ minHeight: "100vh", paddingTop: 64, background: "var(--g50)" }}>
      <div className="login-split">
        <div className="login-brand-panel">
          <div className="login-brand-inner">
            <img
              src="/LOGO.svg"
              alt="Eyelens"
              style={{ height: 52, width: "auto", maxWidth: 220, objectFit: "contain", marginBottom: 24 }}
            />
            <h2 style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 800, color: "var(--white)", marginBottom: 8 }}>
              Vision, refined.
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)", lineHeight: 1.6, maxWidth: 320 }}>
              Premium eyewear with honest pricing, fast delivery, and care that lasts beyond the sale.
            </p>
            <div style={{ marginTop: 36, display: "grid", gap: 12 }}>
              {[
                ["✓", "Authentic frames & lenses"],
                ["✓", "Secure checkout"],
                ["✓", "Easy returns"],
              ].map(([icon, t]) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,.85)" }}>
                  <span style={{ color: "var(--em)" }}>{icon}</span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <div
            style={{
              background: "var(--white)",
              borderRadius: 24,
              border: "1px solid var(--g100)",
              padding: "clamp(28px, 6vw, 48px)",
              boxShadow: "0 24px 64px rgba(0,0,0,.06)",
              maxWidth: 440,
              width: "100%",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <img
                  src="/LOGO.svg"
                  alt="Eyelens"
                  style={{ height: 44, width: "auto", maxWidth: 220, objectFit: "contain" }}
                />
              </div>
              <h1 style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 800, color: "var(--black)" }}>Sign in</h1>
              <p style={{ fontSize: 13, color: "var(--g500)", marginTop: 6 }}>Welcome back — access your orders and profile</p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!validateFields() || !canSubmit) return;

                setSubmitting(true);
                setError("");

                try {
                  await login({ email: email.trim().toLowerCase(), password });
                  navigate(from, { replace: true });
                } catch (err) {
                  const msg = err.response?.data?.message || err.message || "Login failed.";
                  setError(msg);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErr((f) => ({ ...f, email: undefined }));
                  }}
                  autoComplete="email"
                />
                {fieldErr.email && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{fieldErr.email}</div>}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErr((f) => ({ ...f, password: undefined }));
                    }}
                    autoComplete="current-password"
                    style={{ paddingRight: 88 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--em)",
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {fieldErr.password && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>{fieldErr.password}</div>}
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <Link to="/forgot-password" style={{ fontSize: 12, fontWeight: 700, color: "var(--em)", textDecoration: "none" }}>
                    Forgot password?
                  </Link>
                </div>
              </div>

              {suspendedBanner && (
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(217,64,64,.25)",
                    background: "#FEF2F2",
                    padding: "12px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#B42318",
                    marginBottom: 8,
                  }}
                >
                  Your account has been suspended. Contact support for help.
                </div>
              )}

              {error && (
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(217,64,64,.25)",
                    background: "#FEF2F2",
                    padding: "12px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#B42318",
                    marginBottom: 8,
                  }}
                >
                  {error}
                </div>
              )}

              <button type="submit" disabled={!canSubmit} className="btn btn-primary" style={{ width: "100%", marginTop: 8 }}>
                {submitting ? "Signing in…" : "Sign in"}
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "var(--g500)", marginTop: 20 }}>
                Don&apos;t have an account?{" "}
                <Link to="/signup" style={{ color: "var(--em)", fontWeight: 800, textDecoration: "none" }}>
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .login-split-wrap { display: flex; align-items: stretch; }
        .login-split {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) minmax(320px, 1fr);
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          min-height: calc(100vh - 64px);
          align-items: center;
          gap: 0;
        }
        .login-brand-panel {
          background: linear-gradient(165deg, #0d1c13 0%, #1a3a25 55%, #0d1c13 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          border-radius: 0 24px 24px 0;
        }
        .login-brand-inner { max-width: 380px; }
        .login-form-panel {
          display: flex; align-items: center; justify-content: center;
          padding: 32px 24px 48px;
        }
        @media (max-width: 768px) {
          .login-split { grid-template-columns: 1fr; min-height: auto; }
          .login-brand-panel {
            border-radius: 0 0 24px 24px;
            padding: 32px 24px;
            min-height: auto;
          }
          .login-form-panel { padding: 24px 16px 40px; }
        }
      `}</style>
    </div>
  );
}
