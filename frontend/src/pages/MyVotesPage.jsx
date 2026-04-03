import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MyVotesPage.css";

const API = "https://secure-voting.onrender.com";
const getToken = () => localStorage.getItem("token");
const authFetch = (url) =>
  fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });

const BackIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ShieldIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const CalendarIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const MapPinIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function MyVotesPage() {
  const navigate = useNavigate();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    authFetch(`${API}/api/votes/my`)
      .then(async (res) => {
        if (res.status === 401) {
          navigate("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load votes");
        const data = await res.json();
        setVotes(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const filters = ["All", "Live", "Completed", "Upcoming"];
  const filtered =
    filter === "All" ? votes : votes.filter((v) => v.status === filter);

  const stats = {
    total: votes.length,
    live: votes.filter((v) => v.status === "Live").length,
    completed: votes.filter((v) => v.status === "Completed").length,
  };

  return (
    <div className="myvotes-root">
      <div className="myvotes-bg" />
      <div className="myvotes-overlay" />

      <nav className="myvotes-nav">
        <button className="myvotes-nav-back" onClick={() => navigate("/")}>
          <BackIcon /> Home
        </button>
        <div className="myvotes-nav-brand">
          <img
            src="https://img.icons8.com/fluency/512/blockchain-technology.png"
            alt=""
            style={{ width: 26, height: 26, objectFit: "contain" }}
          />
          <span>VoteChain</span>
        </div>
        <button
          className="myvotes-nav-profile"
          onClick={() => navigate("/profile")}
        >
          My Profile →
        </button>
      </nav>

      <div className="myvotes-header">
        <div className="myvotes-eyebrow">
          <span className="myvotes-eyebrow-dot" />
          Immutable · Blockchain-Verified
        </div>
        <h1 className="myvotes-heading">My Votes</h1>
        <p className="myvotes-sub">
          Every vote you cast is permanently recorded on-chain. Tamper-proof and
          fully verifiable.
        </p>

        <div className="myvotes-stats">
          <div className="myvotes-stat">
            <div className="myvotes-stat-num">{stats.total}</div>
            <div className="myvotes-stat-label">Total Votes Cast</div>
          </div>
          <div className="myvotes-stat-divider" />
          <div className="myvotes-stat">
            <div className="myvotes-stat-num">{stats.live}</div>
            <div className="myvotes-stat-label">Live Elections</div>
          </div>
          <div className="myvotes-stat-divider" />
          <div className="myvotes-stat">
            <div className="myvotes-stat-num">{stats.completed}</div>
            <div className="myvotes-stat-label">Completed</div>
          </div>
        </div>
      </div>

      <div className="myvotes-filters-wrap">
        <div className="myvotes-filters">
          {filters.map((f) => (
            <button
              key={f}
              className={`myvotes-filter-btn ${filter === f ? "myvotes-filter-btn--active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="myvotes-body">
        {loading && (
          <div className="myvotes-empty">
            <div className="myvotes-spinner" />
            <p className="myvotes-empty-sub" style={{ marginTop: 16 }}>
              Loading your votes…
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="myvotes-empty">
            <p className="myvotes-empty-title" style={{ color: "#fca5a5" }}>
              Could not load votes
            </p>
            <p className="myvotes-empty-sub">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="myvotes-empty">
            <div className="myvotes-empty-icon">
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <p className="myvotes-empty-title">No votes yet</p>
            <p className="myvotes-empty-sub">
              Votes you cast will appear here after participating in an
              election.
            </p>
            <button
              className="myvotes-browse-btn"
              onClick={() => navigate("/election/1")}
            >
              Browse Elections
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="myvotes-list">
            {filtered.map((vote) => (
              <div key={vote.id} className="vote-card">
                {vote.electionImg && (
                  <div className="vote-card-img-wrap">
                    <img
                      src={vote.electionImg}
                      alt={vote.electionTitle}
                      className="vote-card-img"
                    />
                    <div
                      className={`vote-card-status vote-card-status--${vote.status?.toLowerCase()}`}
                    >
                      {vote.status === "Live" && (
                        <span className="vote-live-dot" />
                      )}
                      {vote.status}
                    </div>
                  </div>
                )}

                <div className="vote-card-body">
                  <div className="vote-card-title">{vote.electionTitle}</div>

                  <div className="vote-card-meta">
                    <span>
                      <MapPinIcon /> {vote.region}
                    </span>
                    <span>
                      <CalendarIcon /> {formatDate(vote.votedAt)}
                    </span>
                  </div>

                  <div className="vote-card-divider" />

                  <div className="vote-card-details">
                    {/* Vote sealed confirmation — no candidate shown */}
                    <div className="vote-detail-row">
                      <span className="vote-detail-label">
                        <ShieldIcon /> Vote Status
                      </span>
                      <span
                        className="vote-detail-value"
                        style={{ color: "#34d399" }}
                      >
                        <CheckIcon /> Vote Cast & Sealed
                      </span>
                    </div>

                    {/* Tx hash — public, verifiable, but not linked to candidate */}
                    {vote.txHash && (
                      <div className="vote-detail-row">
                        <span className="vote-detail-label">
                          <ShieldIcon /> Blockchain Tx
                        </span>
                        <span className="vote-detail-value vote-tx-hash">
                          {vote.txHash}
                        </span>
                      </div>
                    )}

                    {!vote.txHash && (
                      <div className="vote-detail-row">
                        <span className="vote-detail-label">
                          <ShieldIcon /> Blockchain Tx
                        </span>
                        <span
                          className="vote-detail-value"
                          style={{
                            color: "rgba(255,255,255,0.28)",
                            fontStyle: "italic",
                            fontSize: "0.78rem",
                          }}
                        >
                          Pending on-chain confirmation
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="myvotes-chain-note">
          <ShieldIcon />
          Your vote is anonymous — only the transaction hash is public. The
          candidate you voted for is never stored or returned by the API.
        </div>
      </div>
    </div>
  );
}
