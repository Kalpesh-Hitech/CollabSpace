import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selUser } from "../redux/slices/authSlice";
import { createUser } from "../utils/api";

export default function AddUserPage() {
  const navigate = useNavigate();
  const currentUser = useSelector(selUser);
  const role = (currentUser?.role || "").toLowerCase();
  const isAdmin = role === "admin";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Minimum 8 characters";
    else if (!/\d/.test(form.password)) errs.password = "Must contain at least one number";
    else if (!/[A-Z]/.test(form.password)) errs.password = "Must contain at least one uppercase letter";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true);
    setError("");
    try {
      await createUser(form);
      navigate("/users");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  // Admin can create admin, manager, employee
  // Manager can only create employee
  const availableRoles = isAdmin
    ? [
        { key: "employee", label: "Employee", desc: "Can view and update assigned tasks", color: "#22c55e" },
        { key: "manager",  label: "Manager",  desc: "Can create tasks and manage teams",  color: "#f59e0b" },
        { key: "admin",    label: "Admin",    desc: "Full access to all features",         color: "#6366f1" },
      ]
    : [
        { key: "employee", label: "Employee", desc: "Can view and update assigned tasks", color: "#22c55e" },
      ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .aup-layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; }
        .aup-role-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
        @media (max-width: 768px) {
          .aup-layout { grid-template-columns: 1fr !important; }
          .aup-side { display: none; }
          .aup-header { flex-direction: column; gap: 8px !important; }
          .aup-header > div:last-child { padding-left: 0 !important; }
        }
        @media (max-width: 480px) {
          .aup-card { padding: 18px !important; }
          .aup-role-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={styles.page}>
        <div style={styles.container}>
          <div className="aup-header" style={styles.header}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M5 12l7 7M5 12l7-7" />
              </svg>
              Back
            </button>
            <div>
              <p style={styles.tag}>User Management</p>
              <h1 style={styles.title}>Add New User</h1>
            </div>
          </div>

          <div className="aup-layout">
            {/* Main Form */}
            <div className="aup-card" style={styles.card}>
              {error && (
                <div style={styles.errBanner}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div style={styles.section}>
                <p style={styles.sectionTitle}>Personal Information</p>

                <div style={styles.field}>
                  <label style={styles.label}>Full Name <span style={styles.req}>*</span></label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    style={{ ...styles.input, ...(fieldErrors.name ? styles.inputErr : {}) }}
                  />
                  {fieldErrors.name && <span style={styles.fieldErr}>{fieldErrors.name}</span>}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Email Address <span style={styles.req}>*</span></label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@company.com"
                    style={{ ...styles.input, ...(fieldErrors.email ? styles.inputErr : {}) }}
                  />
                  {fieldErrors.email && <span style={styles.fieldErr}>{fieldErrors.email}</span>}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Password <span style={styles.req}>*</span></label>
                  <div style={styles.pwWrap}>
                    <input
                      name="password"
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min. 8 chars, 1 uppercase, 1 number"
                      style={{ ...styles.input, ...(fieldErrors.password ? styles.inputErr : {}), paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)} style={styles.eyeBtn}>
                      {showPw ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && <span style={styles.fieldErr}>{fieldErrors.password}</span>}
                </div>
              </div>

              <div style={styles.divider} />

              <div style={styles.section}>
                <p style={styles.sectionTitle}>
                  Role & Permissions
                  {!isAdmin && <span style={{ fontWeight: 400, color: "#475569", marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>(managers can only create employees)</span>}
                </p>
                <div className="aup-role-grid">
                  {availableRoles.map((r) => {
                    const active = form.role === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, role: r.key }))}
                        style={{
                          ...styles.roleCard,
                          ...(active ? { borderColor: r.color, background: r.color + "10" } : {}),
                        }}
                      >
                        <div style={styles.roleTop}>
                          <span style={{ ...styles.roleDot, background: r.color, boxShadow: active ? `0 0 8px ${r.color}` : "none" }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: active ? r.color : "#94a3b8" }}>{r.label}</span>
                          {active && (
                            <span style={{ marginLeft: "auto" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={r.color}>
                                <path d="M20 6L9 17l-5-5" stroke={r.color} strokeWidth="2.5" fill="none" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <p style={styles.roleDesc}>{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.footer}>
                <button onClick={() => navigate(-1)} style={styles.cancelBtn}>Cancel</button>
                <button onClick={handleSubmit} disabled={loading} style={styles.submitBtn}>
                  {loading ? (
                    <><span style={styles.spinner} />Adding User...</>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                      Add User
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Side info */}
            <div className="aup-side" style={styles.sideInfo}>
              <div style={styles.infoCard}>
                <p style={styles.infoTitle}>What happens next?</p>
                <div style={styles.steps}>
                  {[
                    { n: "1", t: "Account Created", d: "User gets their credentials" },
                    { n: "2", t: "Assign to Team",  d: "Add them to a team from the Teams page" },
                    { n: "3", t: "Ready to Work",   d: "They can log in and see their tasks" },
                  ].map((s) => (
                    <div key={s.n} style={styles.step}>
                      <div style={styles.stepNum}>{s.n}</div>
                      <div>
                        <p style={styles.stepTitle}>{s.t}</p>
                        <p style={styles.stepDesc}>{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1e2540" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Admin Tip</p>
                    <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                      As admin you can create all role types. Managers can only be created by admins.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0f1117", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "28px 16px" },
  container: { maxWidth: 900, margin: "0 auto" },
  header: { marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 16 },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "#1a1d2e", border: "1px solid #252840", color: "#94a3b8", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, marginTop: 4, flexShrink: 0 },
  tag: { fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 },
  title: { fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: "5px 0 0", letterSpacing: "-0.02em" },
  card: { background: "#161b2e", border: "1px solid #1e2540", borderRadius: 16, padding: "28px" },
  errBanner: { display: "flex", alignItems: "center", gap: 8, background: "#7f1d1d18", border: "1px solid #ef444430", color: "#fca5a5", padding: "11px 14px", borderRadius: 8, marginBottom: 20, fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 600, color: "#94a3b8" },
  req: { color: "#f87171" },
  input: { background: "#0f1117", border: "1px solid #252840", borderRadius: 8, padding: "11px 14px", color: "#f1f5f9", fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" },
  inputErr: { borderColor: "#ef4444" },
  fieldErr: { fontSize: 12, color: "#f87171" },
  pwWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4 },
  divider: { height: 1, background: "#1e2540", margin: "20px 0" },
  roleCard: { background: "transparent", border: "1px solid #252840", borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%", boxSizing: "border-box" },
  roleTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  roleDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  roleDesc: { fontSize: 12, color: "#475569", margin: 0, lineHeight: 1.5 },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid #1e2540", flexWrap: "wrap" },
  cancelBtn: { padding: "10px 20px", borderRadius: 8, border: "1px solid #252840", background: "transparent", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  submitBtn: { display: "flex", alignItems: "center", gap: 7, padding: "10px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  spinner: { width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" },
  sideInfo: {},
  infoCard: { background: "#12172a", border: "1px solid #1e2540", borderRadius: 14, padding: "22px" },
  infoTitle: { fontSize: 13, fontWeight: 700, color: "#64748b", margin: "0 0 18px", textTransform: "uppercase", letterSpacing: "0.06em" },
  steps: { display: "flex", flexDirection: "column", gap: 16 },
  step: { display: "flex", gap: 12, alignItems: "flex-start" },
  stepNum: { width: 26, height: 26, borderRadius: "50%", background: "#6366f120", border: "1px solid #6366f140", color: "#6366f1", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepTitle: { fontSize: 13, fontWeight: 700, color: "#94a3b8", margin: "0 0 2px" },
  stepDesc: { fontSize: 12, color: "#475569", margin: 0 },
};