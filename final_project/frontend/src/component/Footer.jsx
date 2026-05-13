import React from "react";
import { ArrowUp, Shield } from "lucide-react";

const siteMap = [
  "Home",
  "Elections",
  "How It Works",
  "Results",
  "About Us",
  "Contact",
];

const legal = [
  "Privacy Policy",
  "Terms of Service",
  "Cookie Policy",
  "Security",
];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="footer">
      {/* Decorative triangle watermark */}
      <div className="footer-watermark" aria-hidden="true">
        <svg
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="200,20 380,380 20,380"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            opacity="0.12"
          />
          <polygon
            points="200,80 320,360 80,360"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            opacity="0.08"
          />
          <polygon
            points="200,140 260,340 140,340"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            opacity="0.05"
          />
        </svg>
      </div>

      <div className="footer-inner">
        {/* Left brand column */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img
              src="https://img.icons8.com/fluency/32/blockchain-technology.png"
              alt="VoteChain"
              className="footer-logo-img"
            />
            <span className="footer-logo-text">VoteChain</span>
          </div>
          <p className="footer-tagline">
            Empowering democratic participation through secure,
            blockchain-backed voting infrastructure for institutions across
            India.
          </p>
          <div className="footer-socials">
            <a href="#" aria-label="X / Twitter" className="footer-social-btn">
              {/* X (Twitter) */}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn" className="footer-social-btn">
              {/* LinkedIn */}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram" className="footer-social-btn">
              {/* Instagram */}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a href="#" aria-label="Facebook" className="footer-social-btn">
              {/* Facebook */}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
          <button className="footer-back-top" onClick={scrollToTop}>
            <ArrowUp size={14} strokeWidth={2.5} />
            Back to Top
          </button>
        </div>

        {/* Divider (vertical on desktop) */}
        <div className="footer-vdivider" />

        {/* Site Map */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Site Map</h4>
          <ul className="footer-col-list">
            {siteMap.map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className={
                    item === "Home" ? "footer-link active-link" : "footer-link"
                  }
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Legal</h4>
          <ul className="footer-col-list">
            {legal.map((item) => (
              <li key={item}>
                <a href="#" className="footer-link">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span className="footer-copyright">
            © 2025 VoteChain. All Rights Reserved.
          </span>
          <span className="footer-secured">
            <Shield size={11} strokeWidth={2.5} />
            Secured with Blockchain Technology
          </span>
        </div>
      </div>
    </footer>
  );
}
