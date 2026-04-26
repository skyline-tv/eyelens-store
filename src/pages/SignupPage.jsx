import { useState, useEffect } from "react";
import { setPageSeo } from "../utils/seo";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../auth/auth";

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const restore = setPageSeo({
      title: "Create account | Eyelens eyewear store",
      description:
        "Join Eyelens to save prescriptions, track orders, and checkout faster on prescription glasses and sunglasses.",
      canonicalPath: "/signup",
      noindex: true,
    });
    return () => restore();
  }, []);

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const name = form.name.trim() || "Customer";
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters.");
        setLoading(false);
        return;
      }
      await register({ name, email: form.email.trim().toLowerCase(), password: form.password });
      setDone(true);
      setTimeout(() => navigate("/", { replace: true }), 800);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, var(--em-pale) 0%, var(--white) 60%)",
        paddingTop: 64,
      }}
    >
      <div style={{ width: "100%", maxWidth: 460, padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <img
            src="/LOGO.svg"
            alt="Eyelens"
            style={{ height: 46, width: "auto", maxWidth: 220, objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            background: "var(--white)",
            borderRadius: 24,
            border: "1px solid var(--g100)",
            padding: "clamp(28px, 6vw, 48px)",
            boxShadow: "0 24px 64px rgba(0,0,0,.08)",
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
            <h1 style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 800, color: "var(--black)" }}>
              Create account
            </h1>
            <p style={{ fontSize: 13, color: "var(--g500)", marginTop: 6 }}>Join 50K+ happy customers</p>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
            {[1, 2].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 4,
                  background: s <= step ? "var(--em)" : "var(--g100)",
                  transition: "background .35s",
                }}
              />
            ))}
          </div>

          {step === 1 && (
            <div style={{ animation: "fadeUp .35s" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="field-label">First Name</label>
                  <input
                    className="input"
                    placeholder="Arjun"
                    value={form.name.split(" ")[0] || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value + " " + (f.name.split(" ")[1] || "") }))
                    }
                  />
                </div>
                <div>
                  <label className="field-label">Last Name</label>
                  <input
                    className="input"
                    placeholder="Mehta"
                    value={form.name.split(" ").slice(1).join(" ") || ""}
                    onChange={(e) => {
                      const first = form.name.split(" ")[0] || "";
                      setForm((f) => ({ ...f, name: `${first} ${e.target.value}`.trim() }));
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Email address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="field-label">Phone Number</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: "fadeUp .35s" }}>
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
                    marginBottom: 14,
                  }}
                >
                  {error}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Create Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={set("password")}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Confirm Password</label>
                <input className="input" type="password" placeholder="Re-enter password" />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  marginBottom: 24,
                  padding: "12px 14px",
                  background: "var(--em-light)",
                  borderRadius: 10,
                  border: "1px solid rgba(26,107,63,.15)",
                }}
              >
                <input type="checkbox" style={{ marginTop: 2, accentColor: "var(--em)" }} defaultChecked />
                <span style={{ fontSize: 12, color: "var(--g600)", lineHeight: 1.5 }}>
                  I agree to the <span style={{ color: "var(--em)", fontWeight: 700 }}>Terms of Service</span> and{" "}
                  <span style={{ color: "var(--em)", fontWeight: 700 }}>Privacy Policy</span>
                </span>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary btn-full"
            style={{ padding: "14px", fontSize: 14, background: done ? "var(--green)" : undefined, transition: "background .4s" }}
            onClick={handleNext}
            disabled={loading}
          >
            {done ? "✓ Account Created!" : loading ? "Creating account…" : step === 1 ? "Continue →" : "Create Account"}
          </button>

          {step === 2 && (
            <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => setStep(1)}>
              ← Back
            </button>
          )}

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--g500)", marginTop: 20 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--em)", fontWeight: 700, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>

          <div
            style={{
              marginTop: 24,
              padding: "16px",
              background: "var(--em-pale)",
              border: "1px solid var(--em-light)",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {[
              ["🎁", "₹200 welcome discount"],
              ["🚚", "Free delivery on first order"],
              ["⭐", "Exclusive member deals"],
            ].map(([icon, text]) => (
              <div
                key={text}
                style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--g600)", fontWeight: 500 }}
              >
                <span>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
