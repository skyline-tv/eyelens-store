import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "var(--g50)",
            color: "var(--black)",
            fontFamily: "var(--font-b), system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }} aria-hidden>
            👓
          </div>
          <h1 style={{ fontFamily: "var(--font-d), system-ui, sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: "var(--g500)", textAlign: "center", maxWidth: 400, marginBottom: 24, lineHeight: 1.5 }}>
            Please refresh the page. If the problem continues, try again in a few minutes.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign("/")}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: "#1a6b3f",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
