import { useState, useEffect } from "react";
import { setPageSeo } from "../utils/seo";

export default function ContactPage({ setPage }) {
  useEffect(() => {
    const restore = setPageSeo({
      title: "Contact Eyelens | Orders, returns & support",
      description:
        "Reach Eyelens for order help, returns, frame fit questions, and warranty support. We typically reply within a few hours on working days.",
      canonicalPath: "/contact",
      keywords: "Eyelens customer care, eyewear support India, order help",
    });
    return () => restore();
  }, []);

  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const setF = (k) => (e) => setFormData((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.message) return;
    setSending(true);
    setTimeout(() => setSent(true), 1800);
  };

  return (
    <div className="page-enter" style={{ paddingTop: 64 }}>
      <section style={{ background: "var(--em-pale)", padding: "56px 0 64px", textAlign: "center" }}>
        <div className="container">
          <span className="section-label">Contact Us</span>
          <h1 className="section-title" style={{ marginBottom: 16 }}>
            We'd love to <em>hear from you</em>
          </h1>
          <p className="section-desc">
            Our support team is always ready to help. Usually responds within 2 hours on working days.
          </p>
        </div>
      </section>

      <section className="section-pad" style={{ background: "var(--white)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 56, alignItems: "start" }}>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-d)",
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--black)",
                  marginBottom: 24,
                }}
              >
                Get in touch
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
                {[
                  ["📧", "Email Support", "support@eyelens.in", "Mon–Sat, 9am–7pm IST"],
                  ["📞", "Phone Support", "+91 80 4567 8900", "Mon–Sat, 10am–6pm IST"],
                  ["📍", "Office Address", "42, Koramangala, Bangalore", "Karnataka – 560034"],
                  ["💬", "Live Chat", "Available on website", "Mon–Sat, 9am–9pm IST"],
                ].map(([icon, title, info, sub]) => (
                  <div
                    key={title}
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: "16px 20px",
                      background: "var(--white)",
                      borderRadius: 14,
                      border: "1px solid var(--g200)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        flexShrink: 0,
                        width: 40,
                        height: 40,
                        background: "var(--em-light)",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: ".06em",
                          color: "var(--g500)",
                          marginBottom: 3,
                        }}
                      >
                        {title}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--black)" }}>{info}</div>
                      <div style={{ fontSize: 11, color: "var(--g400)", marginTop: 2 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h4
                style={{
                  fontFamily: "var(--font-d)",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "var(--black)",
                  marginBottom: 14,
                }}
              >
                Quick Answers
              </h4>
              {[
                ["How do I track my order?", "Log in to your account and visit My Orders."],
                ["What is the return policy?", "7-day hassle-free returns on all orders."],
                ["Do you offer COD?", "Yes, COD available across India."],
              ].map(([q, a]) => (
                <div
                  key={q}
                  style={{
                    marginBottom: 12,
                    padding: "14px 16px",
                    background: "var(--g50)",
                    borderRadius: 12,
                    border: "1px solid var(--g100)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--black)", marginBottom: 4 }}>{q}</div>
                  <div style={{ fontSize: 12, color: "var(--g500)" }}>{a}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "var(--white)",
                borderRadius: 20,
                border: "1px solid var(--g100)",
                padding: "clamp(20px, 4vw, 36px)",
                boxShadow: "0 8px 40px rgba(0,0,0,.06)",
              }}
            >
              {sent ? (
                <div style={{ textAlign: "center", padding: "48px 20px", animation: "fadeUp .4s" }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "var(--em)",
                      color: "var(--white)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      margin: "0 auto 20px",
                    }}
                  >
                    ✓
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-d)",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--black)",
                      marginBottom: 10,
                    }}
                  >
                    Message Sent!
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--g500)",
                      lineHeight: 1.6,
                      marginBottom: 24,
                    }}
                  >
                    Thanks for reaching out! Our team will get back to you within 2 hours on working days.
                  </p>
                  <button className="btn btn-primary" onClick={() => setPage("home")}>
                    Back to Home
                  </button>
                </div>
              ) : (
                <>
                  <h3
                    style={{
                      fontFamily: "var(--font-d)",
                      fontSize: 20,
                      fontWeight: 800,
                      color: "var(--black)",
                      marginBottom: 24,
                    }}
                  >
                    Send us a message
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                      <label className="field-label">Your Name</label>
                      <input
                        className="input"
                        placeholder="Arjun Mehta"
                        value={formData.name}
                        onChange={setF("name")}
                      />
                    </div>
                    <div>
                      <label className="field-label">Email Address</label>
                      <input
                        className="input"
                        type="email"
                        placeholder="you@email.com"
                        value={formData.email}
                        onChange={setF("email")}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="field-label">Subject</label>
                    <select className="input" value={formData.subject} onChange={setF("subject")}>
                      <option value="">Choose a topic…</option>
                      <option>Order Issue</option>
                      <option>Product Question</option>
                      <option>Return / Refund</option>
                      <option>Prescription Help</option>
                      <option>Wholesale Enquiry</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label className="field-label">Message</label>
                    <textarea
                      className="input"
                      rows={5}
                      placeholder="Tell us how we can help…"
                      style={{ resize: "vertical", minHeight: 120 }}
                      value={formData.message}
                      onChange={setF("message")}
                    />
                  </div>
                  <button
                    className="btn btn-primary btn-full"
                    style={{ padding: "14px", fontSize: 14, background: sending ? "var(--em-dark)" : undefined }}
                    onClick={handleSubmit}
                    disabled={sending}
                  >
                    {sending ? "Sending…" : "Send Message →"}
                  </button>
                  <p style={{ fontSize: 11, color: "var(--g400)", textAlign: "center", marginTop: 14 }}>
                    🔒 Your info is safe. We never share your details.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
