import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selUser } from "../redux/slices/authSlice";
import { getAllTeams, getAllEmployees, createTask } from "../utils/api";

export default function AddTaskPage() {
  const navigate = useNavigate();
  const currentUser = useSelector(selUser);
  const role = (currentUser?.role || "").toLowerCase();

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    team_id: "",
    assign_id: "",
  });
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    Promise.all([
      getAllTeams().catch(() => ({ data: [] })),
      getAllEmployees().catch(() => ({ data: [] })),
    ]).then(([t, e]) => {
      setTeams(Array.isArray(t.data) ? t.data : []);
      setEmployees(Array.isArray(e.data) ? e.data : []);
      setFetchingData(false);
    });
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
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
      const body = {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        status: form.status,
        team_id: form.team_id || null,
        assign_id: form.assign_id || null,
      };
      await createTask(body);
      navigate("/tasks");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .atp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .atp-full { grid-column: 1 / -1; }
        .atp-page { min-height: 100vh; background: #0f1117; font-family: 'DM Sans','Segoe UI',sans-serif; padding: 24px 16px; }
        .atp-container { max-width: 720px; margin: 0 auto; }
        @media (max-width: 600px) {
          .atp-grid { grid-template-columns: 1fr !important; }
          .atp-full { grid-column: 1 !important; }
          .atp-card { padding: 18px !important; }
          .atp-header { flex-direction: column !important; gap: 8px !important; }
          .atp-footer { flex-direction: column-reverse !important; }
          .atp-footer button { width: 100% !important; justify-content: center; }
          .atp-priority-group { flex-direction: column !important; }
        }
      `}</style>
      <div className="atp-page">
        <div className="atp-container">
          {/* Header */}
          <div className="atp-header" style={styles.header}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M5 12l7 7M5 12l7-7" />
              </svg>
              Back
            </button>
            <div>
              <p style={styles.headerLabel}>Task Management</p>
              <h1 style={styles.headerTitle}>Create New Task</h1>
            </div>
          </div>

          {/* Form Card */}
          <div className="atp-card" style={styles.card}>
            {error && (
              <div style={styles.errorBanner}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="atp-grid">
              {/* Title */}
              <div className="atp-full" style={styles.fieldGroup}>
                <label style={styles.label}>Task Title <span style={styles.required}>*</span></label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter a clear, descriptive title..."
                  style={{ ...styles.input, ...(fieldErrors.title ? styles.inputError : {}) }}
                />
                {fieldErrors.title && <span style={styles.fieldError}>{fieldErrors.title}</span>}
              </div>

              {/* Description */}
              <div className="atp-full" style={styles.fieldGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Provide more context, requirements, or notes..."
                  rows={4}
                  style={styles.textarea}
                />
              </div>

              {/* Priority */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Priority</label>
                <div className="atp-priority-group" style={styles.priorityGroup}>
                  {["low", "medium", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, priority: p }))}
                      style={{
                        ...styles.priorityBtn,
                        ...(form.priority === p ? {
                          background: priorityColors[p] + "20",
                          borderColor: priorityColors[p],
                          color: priorityColors[p],
                        } : {}),
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColors[p], display: "inline-block" }} />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} style={styles.select}>
                  <option value="todo">To Do</option>
                  <option value="doing">In Progress</option>
                  <option value="complete">Complete</option>
                </select>
              </div>

              {/* Team */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Assign to Team
                  {fetchingData && <span style={{ marginLeft: 8, fontSize: 11, color: "#475569" }}>Loading...</span>}
                </label>
                <select name="team_id" value={form.team_id} onChange={handleChange} style={styles.select}>
                  <option value="">— No Team —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {!fetchingData && teams.length === 0 && (
                  <span style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                    No teams available.{" "}
                    <button type="button" onClick={() => navigate("/teams/new")} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 12, padding: 0 }}>
                      Create a team →
                    </button>
                  </span>
                )}
              </div>

              {/* Assignee */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Assignee
                  {fetchingData && <span style={{ marginLeft: 8, fontSize: 11, color: "#475569" }}>Loading...</span>}
                </label>
                <select name="assign_id" value={form.assign_id} onChange={handleChange} style={styles.select}>
                  <option value="">— Unassigned —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
                {!fetchingData && employees.length === 0 && (
                  <span style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                    No employees available.{" "}
                    <button type="button" onClick={() => navigate("/users/new")} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 12, padding: 0 }}>
                      Add employees →
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="atp-footer" style={styles.footer}>
              <button onClick={() => navigate(-1)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSubmit} disabled={loading} style={styles.submitBtn}>
                {loading ? (
                  <>
                    <span style={styles.spinner} />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Create Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  header: { marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 16 },
  backBtn: { display: "flex", alignItems: "center", gap: 6, background: "#1e2130", border: "1px solid #2d3148", color: "#a0aec0", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 14, marginTop: 4, transition: "all 0.15s", flexShrink: 0 },
  headerLabel: { fontSize: 12, color: "#6366f1", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 },
  headerTitle: { fontSize: 28, fontWeight: 700, color: "#f1f5f9", margin: "4px 0 0" },
  card: { background: "#161b2e", border: "1px solid #1e2540", borderRadius: 16, padding: "32px" },
  errorBanner: { display: "flex", alignItems: "center", gap: 8, background: "#7f1d1d22", border: "1px solid #ef444440", color: "#fca5a5", padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.02em", display: "flex", alignItems: "center", gap: 4 },
  required: { color: "#f87171" },
  input: { background: "#0f1117", border: "1px solid #2d3148", borderRadius: 8, padding: "11px 14px", color: "#f1f5f9", fontSize: 15, outline: "none", transition: "border-color 0.15s", width: "100%", boxSizing: "border-box" },
  inputError: { borderColor: "#ef4444" },
  textarea: { background: "#0f1117", border: "1px solid #2d3148", borderRadius: 8, padding: "11px 14px", color: "#f1f5f9", fontSize: 15, outline: "none", resize: "vertical", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  select: { background: "#0f1117", border: "1px solid #2d3148", borderRadius: 8, padding: "11px 14px", color: "#f1f5f9", fontSize: 15, outline: "none", width: "100%", cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36 },
  priorityGroup: { display: "flex", gap: 8 },
  priorityBtn: { display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #2d3148", background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", flex: 1, justifyContent: "center" },
  fieldError: { fontSize: 12, color: "#f87171", marginTop: 2 },
  footer: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28, paddingTop: 24, borderTop: "1px solid #1e2540" },
  cancelBtn: { padding: "10px 20px", borderRadius: 8, border: "1px solid #2d3148", background: "transparent", color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  submitBtn: { display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s" },
  spinner: { width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" },
};