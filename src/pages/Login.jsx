// src/pages/Login.jsx
import { loginWithGoogle } from "../services/AuthService";

export default function Login() {
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      alert("Failed to log in. Please try again.");
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-glow" />
        <div className="login-badge">AI · FINANCE · FORECAST</div>
        <h1 className="login-title">
          <span className="login-icon">↗</span>
          FinSight
        </h1>
        <p className="login-sub">
          AI-powered market forecasting.<br />Sign in to access your dashboard.
        </p>
        <button className="login-btn" onClick={handleLogin}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.4a4.63 4.63 0 01-2 3.04v2.52h3.23c1.9-1.75 3-4.32 3-7.35z" fill="#4285F4"/>
            <path d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.23-2.52a5.98 5.98 0 01-3.39.95c-2.6 0-4.8-1.76-5.59-4.12H1.08v2.61A9.99 9.99 0 0010 20z" fill="#34A853"/>
            <path d="M4.41 11.89A6.04 6.04 0 014.1 10c0-.66.11-1.3.31-1.89V5.5H1.08A10 10 0 000 10c0 1.61.38 3.13 1.08 4.5l3.33-2.61z" fill="#FBBC05"/>
            <path d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.86-2.86C14.95.99 12.7 0 10 0A10 10 0 001.08 5.5L4.4 8.11C5.2 5.75 7.4 3.96 10 3.96z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <p className="login-disclaimer">
          For educational purposes only · Not financial advice
        </p>
      </div>
    </div>
  );
}
