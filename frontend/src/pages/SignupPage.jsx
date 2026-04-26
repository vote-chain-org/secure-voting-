import React, { useState } from "react";
import "../styles/SignupPage.css";
import { useNavigate } from "react-router-dom";

const API = (process.env.REACT_APP_API_URL || "http://192.168.0.108:8080") + "/api/auth/register";
const ML_URL = (process.env.REACT_APP_ML_URL || "http://192.168.0.108:5000");
// Scanner service runs locally on the Windows booth laptop
const SCANNER_URL = "http://localhost:9000";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const roles = [
  {
    id: "voter",
    label: "Voter",
    sub: "Cast your vote in an active election",
    badge: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "admin",
    label: "Admin",
    sub: "Manage elections and voter records",
    badge: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "organization",
    label: "Organization",
    sub: "Pro dashboard, analytics & unlimited elections",
    badge: "PRO",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
];

const leftContent = {
  voter: {
    lines: ["VOTE.", "SECURELY.", "FREELY."],
    sub: "Your voice matters. Cast your ballot securely on the blockchain.",
    desc: "A tamper-proof election system where every vote is encrypted, immutable, and transparently recorded on-chain.",
  },
  admin: {
    lines: ["MANAGE.", "YOUR.", "VOTING."],
    sub: "Full oversight of elections, voters, and real-time results.",
    desc: "Access admin tools to configure elections, verify voters, and monitor live vote counts with complete audit trails.",
  },
  organization: {
    lines: ["RUN", "ELECTIONS.", "YOUR WAY."],
    sub: "Pro dashboard with biometric auth and live analytics.",
    desc: "Unlock unlimited elections, custom branding, fingerprint verification and full API access for your organization.",
  },
  default: {
    lines: ["JOIN THE", "CHAIN.", "VOTE."],
    sub: "Register once. Vote securely. Your identity is verified on-chain.",
    desc: "Create your VoteChain account to participate in tamper-proof elections.",
  },
};

const orgPlans = [
  {
    id: "basic",
    name: "Basic",
    price: "₹999/mo",
    popular: false,
    perks: ["Up to 5 elections/month", "500 voters", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹2,499/mo",
    popular: true,
    perks: ["Unlimited elections", "10,000 voters", "Live analytics", "Priority support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    popular: false,
    perks: ["Unlimited everything", "Dedicated infra", "SLA + audit logs", "Custom branding"],
  },
];

/**
 * No canvas conversion needed. The scanner sends raw grayscale bytes.
 */

export default function SignupPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fingerprint state — only used when selectedRole === "voter"
  const [fpScanning, setFpScanning] = useState(false);
  const [fpRaw, setFpRaw] = useState(null);         // Raw base64 from scanner
  const [fpWidth, setFpWidth] = useState(0);
  const [fpHeight, setFpHeight] = useState(0);
  const [fpStatus, setFpStatus] = useState(null);   // "scanned" | "error" | null
  const [fpQuality, setFpQuality] = useState(null); // quality score from scanner

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    voterId: "",
    phone: "",
    password: "",
    confirmPassword: "",
    orgName: "",
    orgType: "",
  });

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  /**
   * Called when user clicks "Scan Fingerprint".
   * Calls the local scanner-service (Java app on this Windows machine),
   * gets raw base64, stores in state.
   * Does NOT enroll yet — enrollment happens after form submit succeeds.
   */
  const handleScan = async () => {
    if (!formData.voterId.trim()) {
      setError("Please enter your Voter ID before scanning.");
      return;
    }
    setFpScanning(true);
    setFpStatus(null);
    setError("");

    try {
      const res = await fetch(`${SCANNER_URL}/capture`, { method: "POST" });
      if (!res.ok) throw new Error("Scanner service responded with error " + res.status);
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (!data.rawBase64) throw new Error("No image returned from scanner.");

      setFpRaw(data.rawBase64);
      setFpWidth(data.width);
      setFpHeight(data.height);
      setFpQuality(data.quality || null);
      setFpStatus("scanned");
    } catch (err) {
      setFpStatus("error");
      setError(
        "Fingerprint scan failed: " + err.message +
        " — Is the scanner-service.jar running? Is the HU20 plugged in?"
      );
    } finally {
      setFpScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    // For voter role, fingerprint is required
    if (selectedRole === "voter" && !fpRaw) {
      setError("Fingerprint scan is required for voter registration.");
      return;
    }

    setLoading(true);
    try {
      // ── Step 1: Register user account ──────────────────────────────────
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: selectedRole,
        ...(selectedRole === "voter" && { 
          voterId: formData.voterId,
          fingerprintRawB64: fpRaw,
          fpWidth: fpWidth,
          fpHeight: fpHeight
        }),
        ...(selectedRole === "organization" && {
          orgName: formData.orgName,
          orgType: formData.orgType,
          plan: selectedPlan,
        }),
      };

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed.");

      // Step 2: ML Enrollment is now handled server-side by the Spring Boot backend.

      // ── Step 3: Save session and redirect ──────────────────────────────
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: data.email,
          name: data.fullName,
          role: data.role,
        })
      );
      sessionStorage.setItem("justSignedUp", "true");
      navigate("/");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const lc = leftContent[selectedRole || "default"];

  return (
    <div className="signup-root">
      <div className="bg-image" />
      <div className="bg-overlay" />

      {/* LEFT */}
      <div className="signup-left">
        <div className="signup-brand">
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
            <span style={{ color: "#6b8fff" }}>{lc.lines[2]}</span>
          </h1>
          <p className="hero-sub">{lc.sub}</p>
          <p className="hero-desc">{lc.desc}</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="signup-right">
        <div className="glass-card">
          {/* ── STEP 1: Role selection ── */}
          {!selectedRole && (
            <>
              <h2 className="card-title">Create Account</h2>
              <p className="card-sub">Choose how you want to register</p>
              <div className="role-list">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    className="role-row"
                    onClick={() => setSelectedRole(r.id)}
                  >
                    <span className="role-row-icon">{r.icon}</span>
                    <span className="role-row-text">
                      <span className="role-row-label">
                        {r.label}
                        {r.badge && <span className="role-badge">{r.badge}</span>}
                      </span>
                      <span className="role-row-sub">{r.sub}</span>
                    </span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="login-row" style={{ marginTop: "1.5rem" }}>
                Already have an account?{" "}
                <a className="login-link" onClick={() => navigate("/login")}>Sign In</a>
              </p>
            </>
          )}

          {/* ── STEP 2: Form ── */}
          {selectedRole && (
            <>
              <div className="role-back-row">
                <button
                  className="role-back-btn"
                  onClick={() => { setSelectedRole(null); setError(""); setFpRaw(null); setFpStatus(null); }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Back
                </button>
                <span className="role-active-tag">
                  {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </span>
              </div>

              <h2 className="card-title" style={{ marginTop: "0.65rem" }}>
                {selectedRole === "voter"
                  ? "Voter Registration"
                  : selectedRole === "admin"
                    ? "Admin Registration"
                    : "Organization Sign Up"}
              </h2>
              <p className="card-sub">Fill in your details to create your account</p>

              {error && (
                <div className="form-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="signup-form">
                {/* Full Name */}
                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <input type="text" name="fullName" placeholder="Enter your full name"
                    value={formData.fullName} onChange={handleChange} className="glass-input" required />
                </div>

                {/* Email */}
                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <input type="email" name="email" placeholder="Enter your email"
                    value={formData.email} onChange={handleChange} className="glass-input" required />
                </div>

                {/* Phone */}
                <div className="field-group">
                  <label className="field-label">Phone</label>
                  <input type="tel" name="phone" placeholder="+91 XXXXXXXXXX"
                    value={formData.phone} onChange={handleChange} className="glass-input" required />
                </div>

                {/* Voter ID + Fingerprint Scan — only for voter */}
                {selectedRole === "voter" && (
                  <>
                    <div className="field-group">
                      <label className="field-label">Voter ID</label>
                      <input type="text" name="voterId" placeholder="Enter your Voter ID"
                        value={formData.voterId} onChange={handleChange} className="glass-input" required />
                    </div>

                    {/* ── Fingerprint Scan Section ── */}
                    <div className="field-group">
                      <label className="field-label">Fingerprint</label>
                      <button
                        type="button"
                        className="glass-input"
                        onClick={handleScan}
                        disabled={fpScanning}
                        style={{
                          cursor: fpScanning ? "wait" : "pointer",
                          textAlign: "left",
                          color: fpStatus === "scanned"
                            ? "#4caf50"
                            : fpStatus === "error"
                              ? "#f44336"
                              : "rgba(255,255,255,0.7)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                      >
                        {/* Fingerprint SVG icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                          <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                          <path d="M2 12a10 10 0 0 1 18-6" />
                          <path d="M6 10a6 6 0 0 1 11.8-1.5" />
                        </svg>
                        {fpScanning
                          ? "Place finger on scanner…"
                          : fpStatus === "scanned"
                            ? `✓ Fingerprint captured${fpQuality !== null ? ` (quality: ${fpQuality})` : ""}`
                            : "Scan Fingerprint"}
                      </button>
                      <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "0.3rem" }}>
                        Place your finger on the HU20 scanner then click above.
                        scanner-service.jar must be running on this machine.
                      </p>
                    </div>
                  </>
                )}

                {/* Org fields */}
                {selectedRole === "organization" && (
                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label">Organization Name</label>
                      <input type="text" name="orgName" placeholder="e.g. SPPU, Fergusson"
                        value={formData.orgName} onChange={handleChange} className="glass-input" required />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Type</label>
                      <select name="orgType" value={formData.orgType} onChange={handleChange}
                        className="glass-input" required>
                        <option value="">Select type</option>
                        <option value="university">University</option>
                        <option value="college">College</option>
                        <option value="government">Government Body</option>
                        <option value="ngo">NGO / Society</option>
                        <option value="corporate">Corporate</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="field-group">
                  <label className="field-label">Password</label>
                  <div className="pw-wrap">
                    <input type={showPassword ? "text" : "password"} name="password"
                      placeholder="••••••••••••" value={formData.password}
                      onChange={handleChange} className="glass-input" required />
                    <button type="button" className="toggle-pw" onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="field-group">
                  <label className="field-label">Confirm Password</label>
                  <div className="pw-wrap">
                    <input type={showConfirm ? "text" : "password"} name="confirmPassword"
                      placeholder="••••••••••••" value={formData.confirmPassword}
                      onChange={handleChange} className="glass-input" required />
                    <button type="button" className="toggle-pw" onClick={() => setShowConfirm((v) => !v)}>
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* Plan picker */}
                {selectedRole === "organization" && (
                  <div className="plan-section">
                    <label className="field-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                      Choose Your Plan
                    </label>
                    <div className="plan-grid">
                      {orgPlans.map((plan) => (
                        <button key={plan.id} type="button"
                          className={`plan-card ${selectedPlan === plan.id ? "plan-card--active" : ""} ${plan.popular ? "plan-card--popular" : ""}`}
                          onClick={() => setSelectedPlan(plan.id)}>
                          {plan.popular && <span className="plan-popular-badge">Most Popular</span>}
                          <span className="plan-name">{plan.name}</span>
                          <span className="plan-price">{plan.price}</span>
                          <ul className="plan-perks">
                            {plan.perks.map((p) => (
                              <li key={p}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {p}
                              </li>
                            ))}
                          </ul>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-signup" disabled={loading}>
                  {loading ? <span className="btn-spinner" /> : "CREATE ACCOUNT"}
                </button>
              </form>

              <p className="login-row">
                Already have an account?{" "}
                <a className="login-link" onClick={() => navigate("/login")}>Sign In</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
