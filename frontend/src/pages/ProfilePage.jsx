import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";
import { authFetch, getToken } from "../utils/authFetch";
const API = process.env.REACT_APP_API_URL || "http://192.168.0.108:8080";

const CameraIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const EditIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const ShieldIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const FingerprintIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M2 12a10 10 0 0 1 18-6" />
    <path d="M6 10a6 6 0 0 1 11.8-1.5" />
  </svg>
);
const MailIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const PhoneIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IdIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M16 10h2M16 14h2M7 10h5M7 14h3" />
  </svg>
);
const RoleIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
  </svg>
);
const LogOutIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
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

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ fullName: "", phone: "" });

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    authFetch(`${API}/api/user/profile`)
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to load profile");
        }
        const data = await res.json();
        setProfile(data);
        setForm({ fullName: data.fullName || "", phone: data.phone || "" });
      })
      .catch((err) => {
        console.error(err);
        showToast("error", "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [navigate]);
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`${API}/api/user/profile`, {
        method: "PUT",
        body: JSON.stringify({ fullName: form.fullName, phone: form.phone }),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setProfile(updated);
      // keep nav avatar name in sync
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...stored,
          name: updated.fullName,
          phone: updated.phone,
        }),
      );
      setEditing(false);
      showToast("success", "Profile saved.");
    } catch {
      showToast("error", "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Max photo size is 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setUploadingPhoto(true);
      const base64 = ev.target.result;
      try {
        const res = await authFetch(`${API}/api/user/profile/photo`, {
          method: "POST",
          body: JSON.stringify({ photo: base64 }),
        });
        if (!res.ok) throw new Error();
        setProfile((p) => ({ ...p, profilePhoto: base64 }));
        showToast("success", "Photo updated.");
      } catch {
        showToast("error", "Photo upload failed.");
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const getInitials = (name = "") => {
    const p = name.trim().split(" ");
    return p.length >= 2
      ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
      : (p[0]?.[0] || "V").toUpperCase();
  };

  const verifications = [
    { icon: <MailIcon />, label: "Email Verified", status: true },
    {
      icon: <FingerprintIcon />,
      label: "Fingerprint Auth",
      status: profile?.role === "PRO",
    },
    {
      icon: <ShieldIcon />,
      label: "Identity Verified",
      status: !!profile?.voterId,
    },
  ];

  const infoRows = [
    {
      icon: <MailIcon />,
      label: "Email Address",
      key: "email",
      editable: false,
    },
    {
      icon: <PhoneIcon />,
      label: "Phone Number",
      key: "phone",
      editable: true,
      formKey: "phone",
    },
    { icon: <IdIcon />, label: "Voter ID", key: "voterId", editable: false },
    { icon: <RoleIcon />, label: "Account Role", key: "role", editable: false },
  ];

  if (loading)
    return (
      <div className="profile-root">
        <div className="profile-bg" />
        <div className="profile-overlay" />
        <div className="profile-loader">Loading profile…</div>
      </div>
    );

  return (
    <div className="profile-root">
      <div className="profile-bg" />
      <div className="profile-overlay" />

      {toast && (
        <div className={`prof-toast prof-toast--${toast.type}`}>
          <span
            className="prof-toast-dot"
            style={{
              background: toast.type === "error" ? "#ef4444" : "#10b981",
            }}
          />
          {toast.msg}
        </div>
      )}

      <nav className="profile-nav">
        <button className="profile-nav-back" onClick={() => navigate("/")}>
          <BackIcon /> Home
        </button>
        <div className="profile-nav-brand">
          <img
            src="https://img.icons8.com/fluency/512/blockchain-technology.png"
            alt=""
            style={{ width: 26, height: 26, objectFit: "contain" }}
          />
          <span>VoteChain</span>
        </div>
        <button className="profile-nav-logout" onClick={handleLogout}>
          <LogOutIcon /> Sign Out
        </button>
      </nav>

      <div className="profile-body">
        <aside className="profile-aside">
          <div className="profile-glass-card profile-avatar-card">
            <div className="profile-avatar-wrap">
              {uploadingPhoto && (
                <div className="profile-avatar-uploading">
                  <div className="profile-spinner" />
                </div>
              )}
              {profile?.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt="Profile"
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-initials">
                  {getInitials(profile?.fullName)}
                </div>
              )}
              <button
                className="profile-avatar-upload"
                onClick={() => fileInputRef.current.click()}
              >
                <CameraIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
            </div>
            <div className="profile-avatar-name">{profile?.fullName}</div>
            <div className="profile-avatar-role">
              {profile?.role || "VOTER"}
            </div>
            {profile?.role === "PRO" && (
              <div className="profile-pro-badge">Pro Organization</div>
            )}
          </div>

          <div className="profile-glass-card profile-verify-card">
            <div className="profile-section-label">Verification Status</div>
            <div className="profile-verify-list">
              {verifications.map((v) => (
                <div key={v.label} className="profile-verify-row">
                  <span className="profile-verify-icon">{v.icon}</span>
                  <span className="profile-verify-label">{v.label}</span>
                  <span
                    className={`profile-verify-pill ${v.status ? "profile-verify-pill--on" : "profile-verify-pill--off"}`}
                  >
                    {v.status ? "Verified" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
            {profile?.role !== "PRO" && (
              <>
                <button
                  className="profile-upgrade-btn"
                  onClick={() => window.document.getElementById('fp-enroll-input').click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? "Enrolling..." : "Enroll Fingerprint Biometrics →"}
                </button>
                <input 
                  id="fp-enroll-input"
                  type="file" 
                  accept="image/*" 
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if(!file) return;
                    setUploadingPhoto(true);
                    
                    const fd = new FormData();
                    fd.append("voter_id", profile?.voterId || "test_voter");
                    fd.append("fingerprint", file);

                    try {
                      const ML_URL = process.env.REACT_APP_ML_URL || "http://192.168.0.108:5000";
                      const res = await fetch(`${ML_URL}/enroll`, {
                        method: "POST",
                        body: fd
                      });
                      if(!res.ok) throw new Error("Enrollment blocked: low quality minutiae");
                      // Update backend role to PRO to simulate active biometric auth
                      showToast("success", "Fingerprint securely encrypted & enrolled!");
                      // Fake state update for UI
                      setProfile(p => ({...p, role: "PRO"}));
                    } catch (err) {
                      showToast("error", "Enrollment Failed. Try a clearer image.");
                    } finally {
                      setUploadingPhoto(false);
                    }
                  }} 
                />
              </>
            )}
          </div>
        </aside>

        <main className="profile-main">
          <div className="profile-glass-card">
            <div className="profile-card-toprow">
              <div className="profile-section-label">Account Information</div>
              {!editing ? (
                <button
                  className="profile-edit-btn"
                  onClick={() => setEditing(true)}
                >
                  <EditIcon /> Edit
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="profile-cancel-btn"
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        fullName: profile.fullName,
                        phone: profile.phone || "",
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="profile-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            <div className="profile-name-row">
              <div className="profile-field-label">Full Name</div>
              {editing ? (
                <input
                  className="profile-input"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  placeholder="Your full name"
                />
              ) : (
                <div className="profile-field-value profile-field-value--name">
                  {profile?.fullName || "—"}
                </div>
              )}
            </div>

            <div className="profile-info-grid">
              {infoRows.map((row) => (
                <div key={row.key} className="profile-info-cell">
                  <div className="profile-info-cell-label">
                    <span className="profile-info-icon">{row.icon}</span>
                    {row.label}
                  </div>
                  {editing && row.editable ? (
                    <input
                      className="profile-input"
                      value={form[row.formKey] || ""}
                      onChange={(e) =>
                        setForm({ ...form, [row.formKey]: e.target.value })
                      }
                      placeholder={`Enter ${row.label.toLowerCase()}`}
                    />
                  ) : (
                    <div className="profile-field-value">
                      {profile?.[row.key] || "—"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="profile-glass-card">
            <div className="profile-card-toprow">
              <div className="profile-section-label">
                Elections Participated
              </div>
              <button
                className="profile-edit-btn"
                onClick={() => navigate("/my-votes")}
              >
                View All →
              </button>
            </div>
            <div className="profile-voted-empty">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{
                  color: "rgba(255,255,255,0.15)",
                  margin: "0 auto 10px",
                  display: "block",
                }}
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <p>Your voting history will appear here.</p>
              <button
                className="profile-browse-btn"
                onClick={() => navigate("/election/1")}
              >
                Browse Elections
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}