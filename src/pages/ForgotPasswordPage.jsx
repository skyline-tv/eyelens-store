import { useState, useEffect } from "react";
import { setPageSeo } from "../utils/seo";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.trim().length > 0 && !loading;

  useEffect(() => {
    const restore = setPageSeo({
      title: "Forgot password | Eyelens",
      description:
        "Reset your Eyelens account password securely. We email a short link you can use once to choose a new password.",
      canonicalPath: "/forgot-password",
      noindex: true,
    });
    return () => restore();
  }, []);

  return (
    <div className="page-enter login-split-wrap" style={{ minHeight: "100vh", paddingTop: 64, background: "var(--g50)" }}>
      <div className="login-split" style={{ minHeight: "calc(100vh - 64px)", alignItems: "center" }}>
        <div className="login-form-panel" style={{ gridColumn: "1 / -1", padding: "48px 24px" }}>
          <div
            style={{
              background: "var(--white)",
              borderRadius: 24,
              border: "1px solid var(--g100)",
              padding: "clamp(28px, 6vw, 48px)",
              boxShadow: "0 24px 64px rgba(0,0,0,.06)",
              maxWidth: 440,
              width: "100%",
              margin: "0 auto",
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
              <h1 style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 800, color: "var(--black)" }}>Forgot password</h1>
              <p style={{ fontSize: 13, color: "var(--g500)", marginTop: 6 }}>Enter your email and we&apos;ll send a reset link</p>
            </div>

            {done ? (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(22,163,74,.25)",
                  background: "#F0FDF4",
                  padding: "14px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#166534",
                  marginBottom: 20,
                }}
              >
                Check your email for reset link
              </div>
            ) : null}

            {!done ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!canSubmit) return;
                  setLoading(true);
                  setError("");
                  try {
                    await axios.post(`${API_BASE}/auth/forgot-password`, { email: email.trim().toLowerCase() });
                    setDone(true);
                  } catch (err) {
                    setError(err.response?.data?.message || err.message || "Something went wrong.");
                  } finally {
                    setLoading(false);
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
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                {error ? (
                  <div
                    style={{
                      borderRadius: 16,
                      border: "1px solid rgba(217,64,64,.25)",
                      background: "#FEF2F2",
                      padding: "12px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#B42318",
                      marginBottom: 12,
                    }}
                  >
                    {error}
                  </div>
                ) : null}
                <button type="submit" disabled={!canSubmit} className="btn btn-primary" style={{ width: "100%", marginTop: 8 }}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            ) : null}

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--g500)", marginTop: 20 }}>
              <Link to="/login" style={{ color: "var(--em)", fontWeight: 800, textDecoration: "none" }}>
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
