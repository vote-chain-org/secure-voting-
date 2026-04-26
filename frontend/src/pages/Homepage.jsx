import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  ChevronDown,
  Search,
  Shield,
  ArrowUpRight,
  Radio,
  Users,
  CalendarDays,
  Lock,
  BarChart2,
  LogOut,
  User,
  ChevronRight,
  Settings,
} from "lucide-react";
import "../styles/Homepage.css";
import { useNavigate } from "react-router-dom";
import Footer from "../component/Footer";

const partners = [
  "NIC India",
  "C-DAC",
  "DigiLocker",
  "MeitY",
  "Aadhaar Auth",
  "NPCI",
];

const activeElections = [
  {
    id: 1,
    title: "SPPU Students' Council Election 2025",
    region: "Savitribai Phule Pune University",
    date: "15 Apr 2025",
    candidates: 7,
    status: "Live",
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=80&fit=crop",
  }
];

const heroFeatures = [
  {
    icon: <Lock size={16} strokeWidth={2} />,
    title: "Blockchain-Backed",
    desc: "Every vote is recorded on an immutable ledger — no tampering, no manipulation.",
  },
  {
    icon: <Shield size={16} strokeWidth={2} />,
    title: "Fingerprint Authentication",
    desc: "Voters verified using biometric fingerprint scan to prevent duplicate voting.",
  },
  {
    icon: <BarChart2 size={16} strokeWidth={2} />,
    title: "Live Results",
    desc: "Transparent, real-time vote tallying visible to all authorized stakeholders.",
  },
  {
    icon: <Users size={16} strokeWidth={2} />,
    title: "Multi-Election Support",
    desc: "Supports college councils, panchayats, university bodies and more.",
  },
];

export default function Homepage() {
  const navigate = useNavigate();
  const [navVisible, setNavVisible] = useState(true);
  const [navScrolled, setNavScrolled] = useState(false);
  const lastScrollY = useRef(0);

  // ── Auth state ───────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'info', msg }
  const dropdownRef = useRef(null);

  // Read user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      // Show welcome toast if just logged in
      const justLoggedIn = sessionStorage.getItem("justLoggedIn");
      if (justLoggedIn) {
        showToast(
          "success",
          `Welcome back, ${parsed.name?.split(" ")[0] || "Voter"}! 👋`,
        );
        sessionStorage.removeItem("justLoggedIn");
      }
      const justSignedUp = sessionStorage.getItem("justSignedUp");
      if (justSignedUp) {
        showToast(
          "success",
          `Account created! Welcome, ${parsed.name?.split(" ")[0] || "Voter"}! 🎉`,
        );
        sessionStorage.removeItem("justSignedUp");
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
    showToast("info", "You've been logged out successfully.");
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "V";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  // ── Scroll hide/show nav ─────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 10) {
        setNavVisible(true);
        setNavScrolled(false);
      } else if (currentY < lastScrollY.current) {
        setNavVisible(true);
        setNavScrolled(true);
      } else if (currentY > lastScrollY.current + 8) {
        setNavVisible(false);
        setNavScrolled(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="homepage">
      {/* ── TOAST ── */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? "✓" : "ℹ"}
          </span>
          <span className="toast-msg">{toast.msg}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}

      {/* ── NAV ── */}
      <nav
        className={`nav ${navScrolled ? "nav--scrolled" : ""} ${navVisible ? "" : "nav--hidden"}`}
      >
        <div className="nav-logo">
          <div className="nav-logo-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <rect x="2" y="7" width="6" height="6" rx="1.5" />
              <rect x="16" y="7" width="6" height="6" rx="1.5" />
              <rect x="9" y="2" width="6" height="6" rx="1.5" />
              <rect x="9" y="16" width="6" height="6" rx="1.5" />
              <line x1="8" y1="10" x2="9" y2="10" />
              <line x1="15" y1="10" x2="16" y2="10" />
              <line x1="12" y1="8" x2="12" y2="9" />
              <line x1="12" y1="15" x2="12" y2="16" />
            </svg>
          </div>
          <span className="logo-text">VoteChain</span>
        </div>

        <ul className="nav-links">
          <li className="active">
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#">
              Elections <ChevronDown size={12} strokeWidth={2.5} />
            </a>
          </li>
          <li>
            <a href="#">About</a>
          </li>
          <li>
            <a href="#">
              How It Works <ChevronDown size={12} strokeWidth={2.5} />
            </a>
          </li>
          <li>
            <a href="#">Results</a>
          </li>
        </ul>

        <div className="nav-right">
          {user ? (
            /* ── Logged-in: avatar + dropdown ── */
            <div className="nav-user" ref={dropdownRef}>
              <button
                className="nav-user-btn"
                onClick={() => setDropdownOpen((o) => !o)}
              >
                <div className="nav-avatar">{getInitials(user.name)}</div>
                <div className="nav-user-info">
                  <span className="nav-user-name">
                    {user.name?.split(" ")[0]}
                  </span>
                  <span className="nav-user-role">{user.role || "Voter"}</span>
                </div>
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`nav-chevron ${dropdownOpen ? "nav-chevron--open" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header">
                    <div className="nav-dropdown-avatar">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <div className="nav-dropdown-name">{user.name}</div>
                      <div className="nav-dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="nav-dropdown-divider" />
                  <button
                    className="nav-dropdown-item"
                    onClick={() => navigate("/profile")}
                  >
                    <User size={14} strokeWidth={2} /> My Profile
                    <ChevronRight size={13} className="nav-dropdown-arrow" />
                  </button>
                  <button
                    className="nav-dropdown-item"
                    onClick={() => navigate("/my-votes")}
                  >
                    <BarChart2 size={14} strokeWidth={2} /> My Votes
                    <ChevronRight size={13} className="nav-dropdown-arrow" />
                  </button>
                  {user.role === "ADMIN" && (
                    <button
                      className="nav-dropdown-item"
                      onClick={() => navigate("/admin")}
                    >
                      <Settings size={14} strokeWidth={2} /> Admin Dashboard
                      <ChevronRight size={13} className="nav-dropdown-arrow" />
                    </button>
                  )}
                  <div className="nav-dropdown-divider" />
                  <button
                    className="nav-dropdown-item nav-dropdown-item--danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} strokeWidth={2} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Logged-out: original buttons ── */
            <>
              <button
                className="nav-login-ghost"
                onClick={() => navigate("/election/1")}
              >
                View Elections
              </button>
              <button className="nav-cta" onClick={() => navigate("/login")}>
                Login to Vote
              </button>
            </>
          )}
        </div>
      </nav>
      {/* ── HERO ── */}
      <section className="hero">
        <img
          src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1600&q=85"
          alt=""
          className="hero-bg"
          aria-hidden="true"
        />

        {/* Top content */}
        <div className="hero-text">
          <div className="hero-tag">
            <span className="hero-tag-dot" />
            Secure · Transparent · Verifiable
          </div>
          <h1 className="hero-heading">
            Secure Online Voting
            <br />
            <span className="highlight">Platform</span>
          </h1>
          <p className="hero-sub">
            A modern platform for conducting elections with clarity and control.
            Focused on secure access, accurate results, and a seamless
            experience.
          </p>
          <div className="search-bar">
            <div className="search-field">
              <MapPin size={15} strokeWidth={2} color="#9ca3af" />
              <input type="text" placeholder="District or College" />
            </div>
            <div className="divider" />
            <div className="search-field">
              <select>
                <option>Election Type</option>
                <option>Students' Council</option>
                <option>Gram Panchayat</option>
                <option>Zilla Parishad</option>
              </select>
            </div>
            <div className="divider" />
            <div className="search-field">
              <select>
                <option>Status</option>
                <option>Live</option>
                <option>Upcoming</option>
                <option>Completed</option>
              </select>
            </div>
            <button className="search-btn">
              <Search size={16} strokeWidth={2.5} color="#0d0f1c" />
            </button>
          </div>
          <p className="hero-trust">
            <Shield size={12} strokeWidth={2} />
            Aadhaar-based Authentication · Immutable Audit Logs ·
            Standards-aligned Framework
          </p>
        </div>

        {/* Bottom feature cards row */}
        <div className="hero-stats">
          {heroFeatures.map((f) => (
            <div className="hero-stat-card" key={f.title}>
              <div className="hero-stat-icon">{f.icon}</div>
              <div className="hero-feat-title">{f.title}</div>
              <div className="hero-stat-label">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="hero-scroll-hint">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          Scroll to explore
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <div className="brand-bar">
        <span className="brand-label">Designed in alignment with</span>
        {partners.map((b) => (
          <span key={b} className="brand-item">
            {b}
          </span>
        ))}
      </div>

      {/* ── ELECTIONS ── */}
      <section className="elections-section">
        <div className="elections-bg" />
        <div className="elections-bg-overlay" />

        <div className="elections-inner">
          <div className="elections-header">
            <div className="elections-header-left">
              <h2 className="elections-title">
                Active &amp; Upcoming Elections
              </h2>
              <div className="elections-title-line" />
              <p className="elections-sub">
                Elections currently being conducted or scheduled on the
                platform.
              </p>
            </div>
            <button
              className="elections-browse-btn"
              onClick={() => navigate("/election/1")}
            >
              View all elections <ArrowUpRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          <div className="elections-grid">
            {activeElections.map((el, i) => (
              <div
                key={el.id}
                className={`el-card ${i === 0 ? "el-card--featured" : ""}`}
                onClick={() => navigate(`/election/${el.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="el-card-img-wrap">
                  <img src={el.img} alt={el.title} className="el-card-img" />
                  <span className="el-card-badge" data-status={el.status}>
                    <Radio size={9} strokeWidth={3} />
                    {el.status}
                  </span>
                </div>
                <div className="el-card-body">
                  <div className="el-card-title">{el.title}</div>
                  <div className="el-card-region">
                    <MapPin size={12} strokeWidth={2} />
                    {el.region}
                  </div>
                  {i === 0 && (
                    <div className="el-card-details">
                      <span>
                        <Users size={12} strokeWidth={2} /> {el.candidates}{" "}
                        Candidates
                      </span>
                      <span>
                        <CalendarDays size={12} strokeWidth={2} /> {el.date}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
