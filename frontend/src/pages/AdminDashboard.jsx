import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Shield,
  RefreshCw,
  TrendingUp,
  BarChart2,
  AlertTriangle,
} from "lucide-react";
import "../styles/AdminDashboard.css";
import { authFetch } from "../utils/authFetch";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const API = process.env.REACT_APP_API_URL || "http://192.168.0.108:8080";

  const fetchResults = async () => {
    try {
      setError(null);
      // Fetch blockchain results
      const resBC = await authFetch(`${API}/api/admin/results`);
      if (resBC.ok) {
        const data = await resBC.json();
        setResults(Array.isArray(data) ? data : JSON.parse(data));
      } else {
        const errData = await resBC.json().catch(() => ({}));
        console.warn("Blockchain results unavailable:", errData);
        setResults(null);
        setError("Blockchain results unavailable. Please check the network.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Check admin role
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role && user.role.toLowerCase() !== "admin") {
        navigate("/");
        return;
      }
    } else {
      navigate("/login");
      return;
    }
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResults();
  };

  const totalVotes = results
    ? results.reduce((sum, c) => sum + (c.voteCount || 0), 0)
    : 0;

  const maxVotes = results
    ? Math.max(...results.map((c) => c.voteCount || 0), 1)
    : 1;

  const colors = [
    "#6C63FF",
    "#FF6584",
    "#36D399",
    "#FBBD23",
    "#3ABFF8",
    "#F471B5",
    "#A78BFA",
    "#FB923C",
  ];

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <button className="admin-back" onClick={() => navigate("/")}>
            <ArrowLeft size={16} strokeWidth={2.5} /> Back
          </button>
          <div className="admin-title-group">
            <div className="admin-icon-wrap">
              <Shield size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">
                Election results & vote analytics
              </p>
            </div>
          </div>
        </div>
        <button
          className={`admin-refresh ${refreshing ? "spinning" : ""}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} strokeWidth={2.5} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {/* Stats row */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">
            <Users size={20} strokeWidth={2} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Votes</span>
            <span className="admin-stat-value">
              {loading ? "—" : totalVotes}
            </span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">
            <TrendingUp size={20} strokeWidth={2} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Candidates</span>
            <span className="admin-stat-value">
              {loading ? "—" : results ? results.length : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="admin-content">
        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
            <p>Loading results…</p>
          </div>
        ) : error ? (
          <div className="admin-error">
            <AlertTriangle size={24} />
            <p>{error}</p>
            <button onClick={handleRefresh}>Retry</button>
          </div>
        ) : results && results.length > 0 ? (
          <>
            {/* Bar chart */}
            <div className="admin-chart-card">
              <h2 className="admin-section-title">
                <BarChart2 size={18} strokeWidth={2} /> Vote Distribution
              </h2>
              <div className="admin-bars">
                {results.map((c, i) => (
                  <div className="admin-bar-row" key={c.candidateID}>
                    <div className="admin-bar-label">
                      <span className="admin-bar-name">{c.name}</span>
                      <span className="admin-bar-count">{c.voteCount}</span>
                    </div>
                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill"
                        style={{
                          width: `${(c.voteCount / maxVotes) * 100}%`,
                          backgroundColor: colors[i % colors.length],
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    </div>
                    <span className="admin-bar-pct">
                      {totalVotes
                        ? ((c.voteCount / totalVotes) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate cards */}
            <div className="admin-candidates">
              <h2 className="admin-section-title">
                <Users size={18} strokeWidth={2} /> Candidate Breakdown
              </h2>
              <div className="admin-candidate-grid">
                {results.map((c, i) => (
                  <div className="admin-candidate-card" key={c.candidateID}>
                    <div
                      className="admin-candidate-accent"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <div className="admin-candidate-info">
                      <div className="admin-candidate-name">{c.name}</div>
                      <div className="admin-candidate-id">
                        ID: {c.candidateID}
                      </div>
                    </div>
                    <div className="admin-candidate-votes">
                      <span className="admin-candidate-count">
                        {c.voteCount}
                      </span>
                      <span className="admin-candidate-pct">
                        {totalVotes
                          ? ((c.voteCount / totalVotes) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="admin-empty">
            <BarChart2 size={48} strokeWidth={1.2} />
            <h3>No Results Available</h3>
            <p>
              No blockchain results yet. The network may not be running, or no
              votes have been cast.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
