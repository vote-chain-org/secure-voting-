import React, { useState } from "react";
import "../styles/LoginPage.css";
import { useNavigate } from "react-router-dom";

const apiBase = "https://secure-voting.onrender.com/api/auth/login";

export default function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid credentials");
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: data.email,
          name: data.fullName,
          role: data.role || selectedRole,
        }),
      );
      sessionStorage.setItem("justLoggedIn", "true");
      if (selectedRole === "admin") navigate("/admin/dashboard");
      else if (selectedRole === "organization") navigate("/org/dashboard");
      else navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const leftContent = {
    voter: {
      lines: ["", "VOTE.", "SECURELY."],
      sub: "Your voice matters. Cast your ballot securely on the blockchain.",
      desc: "A tamper-proof election system where every vote is encrypted, immutable, and transparently recorded on-chain.",
    },
    admin: {
      lines: ["MANAGE.", "YOUR.", "VOTING."],
      sub: "Full oversight of elections, voters, and real-time results.",
      desc: "Access admin tools to configure elections, verify voters, and monitor live vote counts with complete audit trails.",
    },
    organization: {
      lines: ["RUN", "ELECTION.", "YOUR WAY."],
      sub: "Pro dashboard with biometric auth and live analytics.",
      desc: "Unlock fingerprint verification, unlimited elections, custom branding, and full API access for your organization.",
    },
    default: {
      lines: ["SECURE", "YOUR", "VOTE"],
      sub: "Your voice matters. Cast your ballot securely on the blockchain.",
      desc: "A tamper-proof election system where every vote is encrypted, immutable, and transparently recorded on-chain.",
    },
  };

  const lc = leftContent[selectedRole || "default"];

  return (
    <div className="login-root">
      <div className="bg-image" />
      <div className="bg-overlay" />

      {/* LEFT */}
      <div className="login-left">
        <div className="login-brand">
          <img
            src="https://img.icons8.com/fluency/512/blockchain-technology.png"
            alt="VoteChain"
            style={{ width: 30, height: 30, objectFit: "contain" }}
          />
          <span className="brand-name">VoteChain</span>
        </div>
        <div className="hero-text">
          <h1 className="hero-title">
            {lc.lines[0]}
            <br />
            {lc.lines[1]}
            <br />
            <span>{lc.lines[2]}</span>
          </h1>
          <p className="hero-sub">{lc.sub}</p>
          <p className="hero-desc">{lc.desc}</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="glass-card">
          {!selectedRole ? (
            <>
              <h2 className="card-title">Welcome Back</h2>
              <p className="card-sub">Select your account type to continue</p>

              <div className="role-list">
                {[
                  {
                    id: "voter",
                    label: "Voter",
                    sub: "Cast your vote in an active election",
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    ),
                  },
                  {
                    id: "admin",
                    label: "Admin",
                    sub: "Manage elections and voter records",
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    ),
                  },
                  {
                    id: "organization",
                    label: "Organization",
                    sub: "Pro access — dashboard & analytics",
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                      </svg>
                    ),
                  },
                ].map((r) => (
                  <button
                    key={r.id}
                    className="role-row"
                    onClick={() => setSelectedRole(r.id)}
                  >
                    <span className="role-row-icon">{r.icon}</span>
                    <span className="role-row-text">
                      <span className="role-row-label">{r.label}</span>
                      <span className="role-row-sub">{r.sub}</span>
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>

              <p className="register-row" style={{ marginTop: "1.5rem" }}>
                New here?{" "}
                <a
                  className="register-link"
                  onClick={() => navigate("/signup")}
                >
                  Create an Account
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="role-back-row">
                <button
                  className="role-back-btn"
                  onClick={() => {
                    setSelectedRole(null);
                    setError("");
                    setUsername("");
                    setPassword("");
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Back
                </button>
                <span className="role-active-tag">
                  {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </span>
              </div>

              <h2 className="card-title" style={{ marginTop: "0.65rem" }}>
                {selectedRole === "voter" && "Sign In to Vote"}
                {selectedRole === "admin" && "Admin Sign In"}
                {selectedRole === "organization" && "Organization Sign In"}
              </h2>
              <p className="card-sub">Enter your credentials to continue</p>

              {error && (
                <div className="form-error">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="login-form">
                <div className="field-group">
                  <label className="field-label">
                    {selectedRole === "voter"
                      ? "Voter ID / Email"
                      : "Email Address"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      selectedRole === "voter"
                        ? "Enter voter ID or email"
                        : "Enter your email"
                    }
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Password</label>
                  <div className="pw-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="forgot-row">
                  <a href="#" className="forgot-link">
                    Forgot password?
                  </a>
                  {selectedRole === "organization" && (
                    <a
                      className="forgot-link"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate("/pricing")}
                    >
                      View Pro plans →
                    </a>
                  )}
                </div>
                <button type="submit" className="btn-signin" disabled={loading}>
                  {loading ? <span className="btn-spinner" /> : "SIGN IN"}
                </button>
              </form>

              <div className="divider">
                <span className="line" />
                <span className="or-text">or</span>
                <span className="line" />
              </div>

              <button className="btn-google">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>

              <p className="register-row">
                New here?{" "}
                <a
                  className="register-link"
                  onClick={() => navigate("/signup")}
                >
                  Create an Account
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
