import React from "react";
import {
  MapPin,
  ChevronDown,
  Search,
  Shield,
  ArrowUpRight,
  Radio,
  Users,
  CalendarDays,
} from "lucide-react";
import "../styles/Homepage.css";

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
    // Students raising hands / voting in a hall
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=80&fit=crop",
  },
  {
    id: 2,
    title: "Zilla Parishad Ward No. 14 By-Election",
    region: "Nashik District, Maharashtra",
    date: "18 Apr 2025",
    candidates: 5,
    status: "Live",
    // Real polling booth voters queuing — civic election feel
    img: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=700&q=80&fit=crop",
  },
  {
    id: 3,
    title: "NSS Unit Leader Election",
    region: "Fergusson College, Pune",
    date: "22 Apr 2025",
    candidates: 4,
    status: "Upcoming",
    // College campus group of students — community leadership
    img: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=700&q=80&fit=crop",
  },
];

export default function Homepage() {
  return (
    <div className="homepage">
      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-logo">
          <img
            src="https://img.icons8.com/fluency/32/blockchain-technology.png"
            alt="VoteChain"
            className="logo-img"
          />
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
          <button className="nav-login-ghost">View Elections</button>
          <button
            className="nav-cta"
            onClick={() => (window.location.href = "/login")}
          >
            Login to Vote
          </button>
        </div>
      </nav>

      {/* ── HERO — full viewport height, image unchanged ── */}
      <section className="hero">
        <img
          src="https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1800&q=85&fit=crop&crop=top"
          alt=""
          className="hero-bg"
          aria-hidden="true"
        />
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

      {/* ── ELECTIONS — section has its own background image ── */}
      <section className="elections-section">
        {/* Background image layer */}
        <div className="elections-bg" />
        <div className="elections-bg-overlay" />

        {/* Content sits above bg */}
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
            <button className="elections-browse-btn">
              View all elections <ArrowUpRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          <div className="elections-grid">
            {activeElections.map((el, i) => (
              <div
                key={el.id}
                className={`el-card ${i === 1 ? "el-card--featured" : ""}`}
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
                  {i === 1 && (
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
    </div>
  );
}
