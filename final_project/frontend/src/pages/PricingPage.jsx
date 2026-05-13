import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PricingPage.css";

const free = [
  { on: true, text: "Up to 500 voters per election" },
  { on: true, text: "3 active elections at once" },
  { on: true, text: "Email & password authentication" },
  { on: true, text: "Results visible after election ends" },
  { on: true, text: "Standard support" },
  { on: false, text: "Fingerprint biometric auth" },
  { on: false, text: "Live real-time results" },
  { on: false, text: "Custom branding" },
  { on: false, text: "PDF / CSV export" },
  { on: false, text: "Audit log download" },
  { on: false, text: "API access" },
];

const pro = [
  { on: true, text: "Up to 50,000 voters per election" },
  { on: true, text: "Unlimited active elections" },
  { on: true, text: "Fingerprint biometric authentication" },
  { on: true, text: "Live real-time results dashboard" },
  { on: true, text: "Custom branding — remove VoteChain logo" },
  { on: true, text: "PDF & CSV result export" },
  { on: true, text: "Full audit log download" },
  { on: true, text: "API access for integrations" },
  { on: true, text: "Dedicated database storage" },
  { on: true, text: "Priority support — 24h SLA" },
  { on: true, text: "Multi-admin roles" },
];

const Check = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Cross = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function PricingPage() {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);

  const monthly = 2999;
  const yearlyTotal = Math.round(monthly * 12 * 0.75);
  const displayPrice = yearly ? Math.round(yearlyTotal / 12) : monthly;

  return (
    <div className="pricing-root">
      <div className="pricing-bg" />
      <div className="pricing-overlay" />

      {/* NAV */}
      <nav className="pricing-nav">
        <div
          className="pricing-brand"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <img
            src="https://img.icons8.com/fluency/512/blockchain-technology.png"
            alt=""
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          <span className="pricing-brand-name">VoteChain</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="pricing-nav-ghost" onClick={() => navigate("/")}>
            Home
          </button>
          <button
            className="pricing-nav-cta"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* HEADER */}
      <div className="pricing-header">
        <div className="pricing-eyebrow">
          <span className="pricing-eyebrow-dot" />
          Simple · Transparent · No hidden fees
        </div>
        <h1 className="pricing-heading">Choose Your Plan</h1>
        <p className="pricing-sub">Start free. Scale when you're ready.</p>

        {/* Billing toggle */}
        <div className="billing-switch">
          <span
            className={`billing-label ${!yearly ? "billing-label--active" : ""}`}
          >
            Monthly
          </span>
          <button
            className={`billing-toggle ${yearly ? "billing-toggle--on" : ""}`}
            onClick={() => setYearly(!yearly)}
          >
            <span className="billing-toggle-knob" />
          </button>
          <span
            className={`billing-label ${yearly ? "billing-label--active" : ""}`}
          >
            Yearly <span className="billing-save-tag">–25%</span>
          </span>
        </div>
      </div>

      {/* CARDS */}
      <div className="pricing-grid">
        {/* FREE */}
        <div className="p-card">
          <div className="p-card-header">
            <div className="p-plan-name">Free</div>
            <div className="p-price-row">
              <span className="p-currency">₹</span>
              <span className="p-amount">0</span>
            </div>
            <div className="p-period">forever free</div>
            <p className="p-desc">
              For small elections, student councils, and trying out the
              platform.
            </p>
            <button
              className="p-cta p-cta--free"
              onClick={() => navigate("/signup")}
            >
              Get Started Free
            </button>
          </div>
          <div className="p-divider" />
          <ul className="p-feature-list">
            {free.map((f) => (
              <li
                key={f.text}
                className={`p-feature ${f.on ? "p-feature--on" : "p-feature--off"}`}
              >
                <span
                  className={`p-feat-dot ${f.on ? "p-feat-dot--on" : "p-feat-dot--off"}`}
                >
                  {f.on ? <Check /> : <Cross />}
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        {/* PRO */}
        <div className="p-card p-card--pro">
          <div className="p-popular-badge">Most Popular</div>
          <div className="p-card-header">
            <div className="p-plan-name p-plan-name--pro">Pro Organization</div>
            <div className="p-price-row">
              <span className="p-currency">₹</span>
              <span className="p-amount">
                {displayPrice.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-period">
              {yearly
                ? `per month — billed ₹${yearlyTotal.toLocaleString("en-IN")}/year`
                : "per month"}
            </div>
            <p className="p-desc">
              For colleges, panchayats, universities and large-scale democratic
              elections.
            </p>
            <button
              className="p-cta p-cta--pro"
              onClick={() => navigate("/signup?plan=pro")}
            >
              Start 14-day Free Trial
            </button>
          </div>
          <div className="p-divider p-divider--pro" />
          <ul className="p-feature-list">
            {pro.map((f) => (
              <li key={f.text} className="p-feature p-feature--pro">
                <span className="p-feat-dot p-feat-dot--pro">
                  <Check />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <p className="pricing-footnote">
        All plans include SSL encryption · Blockchain immutability · 99.9%
        uptime · No credit card required for trial
      </p>

      {/* FAQ */}
      <div className="pricing-faq-grid">
        {[
          {
            q: "Can I upgrade anytime?",
            a: "Yes. Upgrade from Free to Pro at any time. Your data and active elections carry over instantly.",
          },
          {
            q: "What happens at 500 voters?",
            a: "Free elections are paused once the 500-voter limit is reached. Upgrade to Pro to continue without limits.",
          },
          {
            q: "How does fingerprint auth work?",
            a: "Uses WebAuthn biometrics — works with any device that has a fingerprint sensor. No additional hardware needed.",
          },
        ].map((f) => (
          <div key={f.q} className="faq-card">
            <div className="faq-card-q">{f.q}</div>
            <div className="faq-card-a">{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
