import { useMemo, useState, useEffect } from "react";
import { setPageSeo } from "../utils/seo";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(4, score);
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = passwordStrength(password);
  const strengthLabel = ["Weak", "Fair", "Good", "Strong", "Very strong"][strength];

  useEffect(() => {
    const restore = setPageSeo({
      title: "Reset password | Eyelens",
      description:
        "Choose a new Eyelens password for your account. For your security, reset links expire after a short time.",
      canonicalPath: "/reset-password",
      noindex: true,
    });
    return () => restore();
  }, []);

  const canSubmit =
    token &&
    password.length >= 8 &&
    password === confirm &&
    !loading;

  if (!token && !success) {
    return (
      <div style={{ minHeight: "100vh", paddingTop: 120, padding: 24, textAlign: "center", background: "var(--g50)" }}>
        <p style={{ color: "var(--g600)", marginBottom: 16 }}>Link expired or invalid</p>
        <Link to="/forgot-password" className="btn btn-primary" style={{ display: "inline-block" }}>
          Request new link
        </Link>
      </div>
    );
  }

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
              <h1 style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 800, color: "var(--black)" }}>Reset password</h1>
            </div>

            {success ? (
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
                  textAlign: "center",
                }}
              >
                Password reset!
              </div>
            ) : null}

            {success ? (
              <p style={{ textAlign: "center" }}>
                <Link to="/login" style={{ color: "var(--em)", fontWeight: 800 }}>
                  Go to login
                </Link>
              </p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!canSubmit) return;
                  setLoading(true);
                  setError("");
                  try {
                    await axios.post(`${API_BASE}/auth/reset-password`, { token, newPassword: password });
                    setSuccess(true);
                    setTimeout(() => navigate("/login", { replace: true }), 2000);
                  } catch (err) {
                    const msg = err.response?.data?.message || "";
                    setError(msg.includes("expired") || msg.includes("invalid") ? "Link expired or invalid" : msg || "Reset failed.");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">New password</label>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  {password ? (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: 4,
                              borderRadius: 2,
                              background: i < strength ? "var(--em)" : "var(--g200)",
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--g500)" }}>{strengthLabel}</span>
                    </div>
                  ) : null}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">Confirm password</label>
                  <input
                    className="input"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  {confirm && password !== confirm ? (
                    <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>Passwords do not match</div>
                  ) : null}
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
                  {loading ? "Saving…" : "Set new password"}
                </button>
              </form>
            )}

            {!success ? (
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--g500)", marginTop: 20 }}>
                <Link to="/login" style={{ color: "var(--em)", fontWeight: 800, textDecoration: "none" }}>
                  Back to login
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
