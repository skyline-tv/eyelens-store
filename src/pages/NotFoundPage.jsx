import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setPageSeo } from "../utils/seo";

export default function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const restore = setPageSeo({
      title: "Page not found | Eyelens",
      description: "We could not find that page. Browse prescription glasses and sunglasses from the Eyelens shop.",
      noindex: true,
    });
    return restore;
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 64,
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }} aria-hidden>
        👓
      </div>
      <h1
        style={{
          fontFamily: "var(--font-d)",
          fontSize: 32,
          fontWeight: 800,
          color: "var(--black)",
          marginBottom: 8,
        }}
      >
        Page not found
      </h1>
      <p style={{ color: "var(--g500)", marginBottom: 24 }}>The page you&apos;re looking for doesn&apos;t exist.</p>
      <button type="button" className="btn btn-primary" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
}
