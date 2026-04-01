import React, { useState } from "react";
import "../styles/SignupPage.css";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    voterId: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(
        "https://secure-voting.onrender.com/api/auth/signin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            voterId: formData.voterId,
            phone: formData.phone,
            password: formData.password,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Registration failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: data.email,
          name: data.fullName,
          role: data.role,
        }),
      );

      navigate("/"); // go to homepage
    } catch (err) {
      alert(err.message);
    }
  };

  const EyeIcon = () => (
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
  );

  const EyeOffIcon = () => (
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
  );

  return (
    <div className="signup-root">
      <div className="bg-image" />
      <div className="bg-overlay" />

      {/* Left side — branding */}
      <div className="signup-left">
        <div className="signup-brand">
          <span className="brand-icon">⛓</span>
          <span className="brand-name">ChainVote</span>
        </div>

        <div className="hero-text">
          <h1 className="hero-title">
            JOIN THE
            <br />
            CHAIN.
            <br />
            VOTE.
          </h1>
          <p className="hero-sub">
            Register once. Vote securely.
            <br />
            Your identity is verified on-chain.
          </p>
          <p className="hero-desc">
            Create your ChainVote account to participate in tamper-proof
            elections. Every registration is encrypted and stored immutably on
            the blockchain.
          </p>
        </div>
      </div>

      {/* Right side — glassmorphism signup card */}
      <div className="signup-right">
        <div className="glass-card">
          <h2 className="card-title">Create Account</h2>
          <p className="card-sub">Register to cast your vote</p>

          <form onSubmit={handleSignup} className="signup-form">
            {/* Full Name */}
            <div className="field-group">
              <label className="field-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                className="glass-input"
                required
              />
            </div>

            {/* Email */}
            <div className="field-group">
              <label className="field-label">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="glass-input"
                required
              />
            </div>

            {/* Two column row — Voter ID + Phone */}
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Voter ID</label>
                <input
                  type="text"
                  name="voterId"
                  placeholder="Voter ID"
                  value={formData.voterId}
                  onChange={handleChange}
                  className="glass-input"
                  required
                />
              </div>
              <div className="field-group">
                <label className="field-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 XXXXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className="glass-input"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="pw-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="glass-input"
                  required
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="field-group">
              <label className="field-label">Confirm Password</label>
              <div className="pw-wrap">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="glass-input"
                  required
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-signup">
              CREATE ACCOUNT
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
            Sign up with Google
          </button>

          <p className="login-row">
            Already have an account?{" "}
            <a className="login-link" onClick={() => navigate("/login")}>
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
