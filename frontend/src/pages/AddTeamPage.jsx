import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";
function getToken() { return localStorage.getItem("token"); }

function getRole() {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch { return null; }
}

export default function AddTeamPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const role = getRole();
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`${API}/list/managers`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setManagers(Array.isArray(d) ? d : []));
  }, [isAdmin]);

  const handleSubmit = async () => {
    if (!name.trim()) { setNameError("Team name is required"); return; }
    setLoading(true);
    setError("");
    try {
      const body = { name: name.trim() };
      if (isAdmin && managerId) body.create_by_id = managerId;

      const res = await fetch(`${API}/create_team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to create team");
      }
      navigate("/teams");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Decorative background */}
      <div style={styles.bgDecor} />
      <div style={styles.bgDecor2} />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" />
            </svg>
            Back
          </button>
          <div style={styles.headerText}>
            <p style={styles.headerTag}>Teams</p>
            <h1 style={styles.headerTitle}>Create New Team</h1>
            <p style={styles.headerSub}>Build a team and start collaborating on tasks together.</p>
          </div>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <div style={styles.iconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          {error && (
            <div style={styles.errorBanner}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Team Name <span style={{ color: "#f87171" }}>*</span>
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
              placeholder="e.g. Frontend Development, Marketing Q2..."
              style={{ ...styles.input, ...(nameError ? { borderColor: "#ef4444" } : {}) }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            {nameError && <span style={styles.fieldErr}>{nameError}</span>}
            <p style={styles.hint}>Choose a clear name that reflects the team's purpose or project.</p>
          </div>

          {isAdmin && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Assign Manager</label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                style={styles.select}
              >
                <option value="">— Assign to yourself —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
              <p style={styles.hint}>Leave blank to assign the team to yourself.</p>
            </div>
          )}

          <div style={styles.footer}>
            <button onClick={() => navigate(-1)} style={styles.cancelBtn}>Discard</button>
            <button onClick={handleSubmit} disabled={loading} style={styles.submitBtn}>
              {loading ? (
                <><span style={styles.spinner} /> Creating Team...</>
              ) : (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>Create Team</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0c14",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "32px 16px",
    position: "relative",
    overflow: "hidden",
  },
  bgDecor: {
    position: "fixed",
    top: -120,
    right: -120,
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, #6366f130 0%, transparent 70%)",
    pointerEvents: "none",
  },
  bgDecor2: {
    position: "fixed",
    bottom: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, #8b5cf620 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: 560,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  header: {
    marginBottom: 32,
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#1a1d2e",
    border: "1px solid #252840",
    color: "#94a3b8",
    padding: "7px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 20,
    transition: "all 0.15s",
  },
  headerText: {},
  headerTag: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    margin: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 800,
    color: "#f1f5f9",
    margin: "6px 0 8px",
    letterSpacing: "-0.02em",
  },
  headerSub: {
    fontSize: 15,
    color: "#64748b",
    margin: 0,
  },
  card: {
    background: "#12172a",
    border: "1px solid #1e2540",
    borderRadius: 20,
    padding: "36px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    background: "#6366f115",
    border: "1px solid #6366f130",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#7f1d1d18",
    border: "1px solid #ef444430",
    color: "#fca5a5",
    padding: "11px 14px",
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 22,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: "0.03em",
  },
  input: {
    background: "#0a0c14",
    border: "1px solid #252840",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#f1f5f9",
    fontSize: 15,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  select: {
    background: "#0a0c14",
    border: "1px solid #252840",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#f1f5f9",
    fontSize: 15,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: 40,
  },
  hint: {
    fontSize: 12,
    color: "#475569",
    margin: 0,
  },
  fieldErr: {
    fontSize: 12,
    color: "#f87171",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 32,
    paddingTop: 24,
    borderTop: "1px solid #1a1d2e",
  },
  cancelBtn: {
    padding: "11px 22px",
    borderRadius: 10,
    border: "1px solid #252840",
    background: "transparent",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  submitBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "11px 28px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 20px #6366f140",
  },
  spinner: {
    width: 14,
    height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
};