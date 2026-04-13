import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  Users,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  Clock,
  ChevronRight,
  Radio,
  Building2,
  AlertTriangle,
  Fingerprint,
  X,
} from "lucide-react";
import "../styles/ElectionDetail.css";

/* ── Mock election data (replace with API later) ── */
const electionData = {
  1: {
    id: 1,
    title: "SPPU Students' Council Election 2025",
    region: "Savitribai Phule Pune University",
    location: "Main Campus, Ganeshkhind, Pune – 411007",
    date: "15 Apr 2025",
    time: "9:00 AM – 5:00 PM",
    status: "Live",
    eligibleCollege: "Savitribai Phule Pune University",
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80&fit=crop",
    about:
      "The annual Students' Council Election determines student representatives who will liaise between the student body and university administration for the academic year 2025–26.",
    candidates: [
      {
        id: 1,
        name: "Priya Sharma",
        role: "President",
        dept: "B.Tech Computer Engineering, Year 3",
        img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&fit=crop&crop=face",
        manifesto: "Digital campus infrastructure & mental health support",
      },
      {
        id: 2,
        name: "Arjun Kulkarni",
        role: "President",
        dept: "MBA Finance, Year 2",
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&fit=crop&crop=face",
        manifesto: "Affordable canteen, better Wi-Fi & sports facilities",
      },
      {
        id: 3,
        name: "Sneha Patil",
        role: "President",
        dept: "B.Sc Physics, Year 3",
        img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&fit=crop&crop=face",
        manifesto: "Research funding & inter-college collaboration programs",
      },
      {
        id: 4,
        name: "Rohan Desai",
        role: "President",
        dept: "B.Com Accounting, Year 2",
        img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80&fit=crop&crop=face",
        manifesto: "Transparent fee structure & grievance redressal portal",
      },
    ],
  },
  2: {
    id: 2,
    title: "Zilla Parishad Ward No. 14 By-Election",
    region: "Nashik District, Maharashtra",
    location: "Ward No. 14, Nashik Road, Nashik – 422101",
    date: "18 Apr 2025",
    time: "8:00 AM – 6:00 PM",
    status: "Live",
    eligibleCollege: "Nashik District",
    img: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&q=80&fit=crop",
    about:
      "A by-election for Ward No. 14 of Nashik Zilla Parishad, held to fill a vacancy created by the resignation of the previous member.",
    candidates: [
      {
        id: 1,
        name: "Sunita Jadhav",
        role: "ZP Member",
        dept: "Independent Candidate",
        img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80&fit=crop&crop=face",
        manifesto: "Rural road development & water supply improvement",
      },
      {
        id: 2,
        name: "Mahesh Gavit",
        role: "ZP Member",
        dept: "Independent Candidate",
        img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&fit=crop&crop=face",
        manifesto: "Farmer welfare schemes & local school upgrades",
      },
      {
        id: 3,
        name: "Kavita More",
        role: "ZP Member",
        dept: "Independent Candidate",
        img: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&q=80&fit=crop&crop=face",
        manifesto: "Women empowerment & self-help group support",
      },
    ],
  },
  3: {
    id: 3,
    title: "NSS Unit Leader Election",
    region: "Fergusson College, Pune",
    location: "Fergusson College Rd, Shivajinagar, Pune – 411004",
    date: "22 Apr 2025",
    time: "10:00 AM – 4:00 PM",
    status: "Upcoming",
    eligibleCollege: "Fergusson College",
    img: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80&fit=crop",
    about:
      "Election for the NSS Unit Leader at Fergusson College who will coordinate all National Service Scheme activities and community outreach programs for 2025–26.",
    candidates: [
      {
        id: 1,
        name: "Tanvi Joshi",
        role: "NSS Unit Leader",
        dept: "B.A. Sociology, Year 2",
        img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80&fit=crop&crop=face",
        manifesto: "Village adoption program & blood donation drives",
      },
      {
        id: 2,
        name: "Sameer Naik",
        role: "NSS Unit Leader",
        dept: "B.Sc Chemistry, Year 3",
        img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80&fit=crop&crop=face",
        manifesto: "Environmental campaigns & digital literacy for rural youth",
      },
    ],
  },
};

/* ── Eligibility modal ── */
function EligibilityModal({ election, onVerified, onClose }) {
  const [collegeId, setCollegeId] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleCheck = () => {
    if (!collegeId.trim() || !rollNo.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setError("");
    setChecking(true);
    // Simulate eligibility API call
    setTimeout(() => {
      setChecking(false);
      // For prototype: any non-empty input passes
      onVerified();
    }, 1800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="modal-icon eligibility">
          <ShieldCheck size={28} strokeWidth={1.8} />
        </div>
        <h3 className="modal-title">Verify Eligibility</h3>
        <p className="modal-sub">
          This election is restricted to enrolled students of{" "}
          <strong>{election.eligibleCollege}</strong>. Please verify your
          identity to continue.
        </p>
        <div className="modal-form">
          <div className="modal-field">
            <label>College / Institution ID</label>
            <input
              type="text"
              placeholder="e.g. SPPU-2023-CS-042"
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label>Enrollment / Roll Number</label>
            <input
              type="text"
              placeholder="e.g. 23CS1048"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
          </div>
          {error && (
            <p className="modal-error">
              <AlertTriangle size={13} /> {error}
            </p>
          )}
        </div>
        <button
          className={`modal-btn ${checking ? "loading" : ""}`}
          onClick={handleCheck}
          disabled={checking}
        >
          {checking ? (
            <span className="spinner" />
          ) : (
            <>
              <ShieldCheck size={15} /> Verify & Continue
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Fingerprint modal ── */
function FingerprintModal({ candidate, onSuccess, onClose }) {
  const [phase, setPhase] = useState("idle"); // idle | scanning | success
  const [errorInfo, setErrorInfo] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setPhase("scanning");
    setErrorInfo(null);
    
    try {
      const userStr = localStorage.getItem("user");
      const voterId = userStr ? JSON.parse(userStr).voterId : "test_voter";
      
      const fd = new FormData();
      fd.append("voter_id", voterId);
      fd.append("fingerprint", file);

      const res = await fetch("http://localhost:8000/verify", {
        method: "POST",
        body: fd
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Verification failed");
      }
      
      if (!data.verified) {
        throw new Error(data.reason || "Biometric identity does not match");
      }

      setPhase("success");
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setPhase("idle");
      setErrorInfo(err.message);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={phase === "idle" ? onClose : undefined}
    >
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {phase === "idle" && (
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        )}

        {phase !== "success" && (
          <>
            <div
              className={`fp-ring ${phase === "scanning" ? "scanning" : ""}`}
            >
              <Fingerprint size={52} strokeWidth={1.2} />
            </div>
            <h3 className="modal-title">
              {phase === "idle" ? "Fingerprint Verification" : "Scanning…"}
            </h3>
            <p className="modal-sub">
              {phase === "idle"
                ? `You're about to vote for ${candidate.name}. Scan your finger to confirm your identity and cast your vote.`
                : "Hold still. Evaluating liveness and minutiae via ML Engine…"}
            </p>
            {errorInfo && (
              <p className="modal-error" style={{ textAlign: "center", marginBottom: "15px" }}>
                <AlertTriangle size={13} style={{ display: "inline", marginBottom: "-2px" }} /> {errorInfo}
              </p>
            )}
            {phase === "idle" && (
              <>
                <button className="modal-btn" onClick={() => window.document.getElementById('fp-verify-input').click()}>
                  <Fingerprint size={15} /> Upload / Scan Fingerprint
                </button>
                <input 
                  id="fp-verify-input"
                  type="file" 
                  accept="image/*" 
                  style={{ display: "none" }}
                  onChange={handleFileChange} 
                />
              </>
            )}
          </>
        )}

        {phase === "success" && (
          <div className="fp-success">
            <div className="fp-success-icon">
              <CheckCircle2 size={52} strokeWidth={1.5} />
            </div>
            <h3 className="modal-title success-text">
              Identity Verified
            </h3>
            <p className="modal-sub">
              Liveness check passed. Identity matching 100%. 
              <br/>Voting for <strong>{candidate.name}</strong> securely on blockchain.
            </p>
            <div className="tx-hash">
              <span>TX</span> 0x7f3a…c912d4
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function ElectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const election = electionData[id] || electionData[1];

  const [step, setStep] = useState("detail"); // detail | eligible | voted
  const [showEligibility, setShowEligibility] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [votedFor, setVotedFor] = useState(null);

  const handleVoteClick = (candidate) => {
    if (step === "detail") {
      setShowEligibility(true);
      setSelectedCandidate(candidate);
    } else if (step === "eligible") {
      setSelectedCandidate(candidate);
      setShowFingerprint(true);
    }
  };

  const handleEligibilityVerified = () => {
    setShowEligibility(false);
    setStep("eligible");
    setShowFingerprint(true);
  };

  const handleVoteSuccess = () => {
    setShowFingerprint(false);
    setVotedFor(selectedCandidate);
    setStep("voted");
  };

  return (
    <div className="ed-page">
      {/* ── Hero banner ── */}
      <div className="ed-hero">
        <img src={election.img} alt={election.title} className="ed-hero-img" />
        <div className="ed-hero-overlay" />
        <div className="ed-hero-content">
          <button className="ed-back" onClick={() => navigate("/")}>
            <ArrowLeft size={15} strokeWidth={2.5} /> Back to Elections
          </button>
          <div className="ed-status-pill" data-status={election.status}>
            <Radio size={9} strokeWidth={3} />
            {election.status}
          </div>
          <h1 className="ed-title">{election.title}</h1>
          <div className="ed-meta">
            <span>
              <MapPin size={13} strokeWidth={2} />
              {election.location}
            </span>
            <span>
              <CalendarDays size={13} strokeWidth={2} />
              {election.date}
            </span>
            <span>
              <Clock size={13} strokeWidth={2} />
              {election.time}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="ed-body">
        {/* Left column */}
        <div className="ed-left">
          {/* Voted state banner */}
          {step === "voted" && (
            <div className="voted-banner">
              <CheckCircle2 size={20} strokeWidth={2} />
              <div>
                <strong>Vote recorded!</strong>
                <p>
                  You voted for {votedFor?.name}. Your vote is secured on the
                  blockchain.
                </p>
              </div>
            </div>
          )}

          {/* Eligibility badge */}
          {step === "eligible" && (
            <div className="eligible-banner">
              <ShieldCheck size={18} strokeWidth={2} />
              <span>Eligibility verified — you may now cast your vote</span>
            </div>
          )}

          {/* About */}
          <div className="ed-card">
            <h2 className="ed-section-title">About this Election</h2>
            <p className="ed-about">{election.about}</p>
          </div>

          {/* Location */}
          <div className="ed-card">
            <h2 className="ed-section-title">
              <Building2 size={16} strokeWidth={2} /> Location & Details
            </h2>
            <div className="ed-info-grid">
              <div className="ed-info-item">
                <span className="ed-info-label">Venue</span>
                <span className="ed-info-val">{election.location}</span>
              </div>
              <div className="ed-info-item">
                <span className="ed-info-label">Election Date</span>
                <span className="ed-info-val">{election.date}</span>
              </div>
              <div className="ed-info-item">
                <span className="ed-info-label">Voting Hours</span>
                <span className="ed-info-val">{election.time}</span>
              </div>
              <div className="ed-info-item">
                <span className="ed-info-label">Eligible Voters</span>
                <span className="ed-info-val">{election.eligibleCollege}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — candidates */}
        <div className="ed-right">
          <div className="ed-candidates-header">
            <h2 className="ed-section-title">
              <Users size={16} strokeWidth={2} /> Candidates (
              {election.candidates.length})
            </h2>
            {step === "detail" && election.status === "Live" && (
              <span className="ed-verify-hint">
                <ShieldCheck size={12} /> Verify eligibility to vote
              </span>
            )}
          </div>

          <div className="ed-candidates-list">
            {election.candidates.map((c, i) => (
              <div
                key={c.id}
                className={`candidate-card ${votedFor?.id === c.id ? "voted" : ""}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <img src={c.img} alt={c.name} className="candidate-img" />
                <div className="candidate-info">
                  <div className="candidate-name">{c.name}</div>
                  <div className="candidate-role">{c.role}</div>
                  <div className="candidate-dept">{c.dept}</div>
                  <div className="candidate-manifesto">
                    <span className="manifesto-label">Manifesto</span>
                    {c.manifesto}
                  </div>
                </div>
                <div className="candidate-action">
                  {step === "voted" ? (
                    votedFor?.id === c.id ? (
                      <div className="voted-check">
                        <CheckCircle2 size={18} strokeWidth={2} /> Your Vote
                      </div>
                    ) : (
                      <div className="not-voted-label">—</div>
                    )
                  ) : election.status === "Live" ? (
                    <button
                      className="vote-btn"
                      onClick={() => handleVoteClick(c)}
                    >
                      Vote <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <span className="upcoming-label">
                      <Clock size={12} /> Upcoming
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showEligibility && (
        <EligibilityModal
          election={election}
          onVerified={handleEligibilityVerified}
          onClose={() => setShowEligibility(false)}
        />
      )}
      {showFingerprint && selectedCandidate && (
        <FingerprintModal
          candidate={selectedCandidate}
          onSuccess={handleVoteSuccess}
          onClose={() => setShowFingerprint(false)}
        />
      )}
    </div>
  );
}
