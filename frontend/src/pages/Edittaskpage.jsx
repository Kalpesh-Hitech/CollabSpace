import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selUser } from '../redux/slices/authSlice'
import { api } from '../redux/slices/authSlice'
import { getTaskById, getAllTeams, getAllEmployees } from '../utils/api'
import toast from 'react-hot-toast'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .et-root { font-family: 'DM Sans', sans-serif; max-width: 720px; margin: 0 auto; }

  .et-input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #f0f0f8;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    box-sizing: border-box;
  }
  .et-input:focus {
    border-color: rgba(124,58,237,0.7);
    box-shadow: 0 0 0 4px rgba(124,58,237,0.1);
    background: rgba(255,255,255,0.07);
  }
  .et-input::placeholder { color: rgba(255,255,255,0.2); }
  .et-select { appearance: none; cursor: pointer; }
  .et-select option {
    background: #1a1a2e;
    color: #f0f0f8;
  }
  .et-textarea { resize: vertical; min-height: 110px; line-height: 1.7; }

  .et-label {
    display: block;
    font-size: 10px;
    font-weight: 500;
    color: rgba(255,255,255,0.38);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-family: 'DM Mono', monospace;
  }
  .et-field { margin-bottom: 22px; }
  .et-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .et-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

  .et-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 24px; border-radius: 11px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
  }
  .et-btn:active { transform: scale(0.97); }
  .et-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .et-btn-primary {
    background: linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);
    color: #fff;
    box-shadow: 0 4px 20px rgba(99,62,220,0.4);
  }
  .et-btn-primary:not(:disabled):hover { box-shadow: 0 6px 28px rgba(99,62,220,0.6); transform: translateY(-1px); }
  .et-btn-ghost {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.65);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .et-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }

  /* Status selector */
  .et-status-btn {
    padding: 12px 8px; border-radius: 12px; cursor: pointer;
    border: 1.5px solid transparent; text-align: center;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
    transition: all 0.18s; background: rgba(255,255,255,0.04);
    display: flex; flex-direction: column; align-items: center; gap: 5px;
  }
  .et-status-btn:hover { transform: translateY(-1px); }

  /* Priority selector */
  .et-priority-btn {
    padding: 11px 8px; border-radius: 12px; cursor: pointer;
    border: 1.5px solid transparent; text-align: center;
    font-family: 'DM Mono', monospace; font-size: 10.5px; font-weight: 500;
    letter-spacing: 0.04em;
    transition: all 0.18s; background: rgba(255,255,255,0.04);
  }
  .et-priority-btn:hover { transform: translateY(-1px); }

  /* Card sections */
  .et-section {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px;
    padding: 26px 26px 6px;
    margin-bottom: 16px;
  }
  .et-section-title {
    font-family: 'DM Mono', monospace;
    font-size: 9.5px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.3);
    margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }
  .et-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.07);
  }

  /* Loading skeleton */
  .et-skel {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: et-shimmer 1.6s infinite;
    border-radius: 12px;
  }
  @keyframes et-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* Avatar */
  .et-avatar {
    border-radius: 50%;
    background: linear-gradient(135deg,#7c3aed,#4f46e5);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 700; color: #fff; flex-shrink: 0;
  }

  /* Pill */
  .et-pill {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: 'DM Mono', monospace; font-size: 9.5px; font-weight: 500;
    border-radius: 100px; padding: 3px 10px; letter-spacing: 0.05em;
  }

  @media (max-width: 600px) {
    .et-2col { grid-template-columns: 1fr; }
    .et-3col { grid-template-columns: 1fr; }
    .et-section { padding: 20px 18px 2px; }
  }
`

const STATUS = {
  todo    : { label: 'To Do',       color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: '○', desc: 'Not started yet' },
  doing   : { label: 'In Progress', color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  icon: '◑', desc: 'Currently working' },
  complete: { label: 'Done',        color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '●', desc: 'Completed' },
}
const PRIORITY = {
  low   : { label: 'Low',    color: '#86efac', bg: 'rgba(134,239,172,0.12)', border: 'rgba(134,239,172,0.3)' },
  medium: { label: 'Medium', color: '#fcd34d', bg: 'rgba(252,211,77,0.12)',  border: 'rgba(252,211,77,0.3)'  },
  high  : { label: 'High',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
}

function Avatar({ name, size = 28 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="et-avatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  )
}

export default function EditTaskPage() {
  const navigate   = useNavigate()
  const { id }     = useParams()
  const location   = useLocation()
  const user       = useSelector(selUser)
  const role       = (user?.role || '').toLowerCase()

  // Pre-seeded from navigation state if coming from TasksPage modal
  const seed = location.state?.task || null

  const [form, setForm] = useState({
    title      : seed?.title       || '',
    description: seed?.description || '',
    priority   : seed?.priority    || 'medium',
    status     : seed?.status      || 'todo',
    team_id    : seed?.team_id     || '',
    assign_id  : seed?.assign_id   || '',
  })
  const [teams,     setTeams]     = useState([])
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(!seed)
  const [saving,    setSaving]    = useState(false)
  const [origTask,  setOrigTask]  = useState(seed)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Load task data + teams/employees
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [taskRes, teamsRes, empRes] = await Promise.all([
          seed ? Promise.resolve({ data: seed }) : getTaskById(id),
          getAllTeams().catch(() => ({ data: [] })),
          getAllEmployees().catch(() => ({ data: [] })),
        ])
        const t = taskRes.data
        setOrigTask(t)
        setForm({
          title      : t.title       || '',
          description: t.description || '',
          priority   : t.priority    || 'medium',
          status     : t.status      || 'todo',
          team_id    : t.team_id     || '',
          assign_id  : t.assign_id   || '',
        })
        setTeams(Array.isArray(teamsRes.data)  ? teamsRes.data  : [])
        setEmployees(Array.isArray(empRes.data) ? empRes.data    : [])
      } catch (err) {
        toast.error('Failed to load task')
        navigate('/tasks')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [id])

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      const body = {
        task_id    : id,
        title      : form.title.trim(),
        description: form.description || null,
        priority   : form.priority,
        status     : form.status,
      }
      if (form.assign_id) body.assign_id = form.assign_id
      if (form.team_id)   body.team_id   = form.team_id

      await api.patch('/update-task', body)

      // If team or assignee changed, call assign_task too
      if (
        form.team_id   && form.assign_id &&
        (form.team_id !== origTask?.team_id || form.assign_id !== origTask?.assign_id)
      ) {
        await api.patch('/assign_task', { task_id: id, team_id: form.team_id, assign_id: form.assign_id })
      }

      toast.success('Task saved!')
      navigate('/tasks')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="et-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="et-skel" style={{ height: 44, width: 200 }} />
          <div className="et-skel" style={{ height: 180 }} />
          <div className="et-skel" style={{ height: 140 }} />
          <div className="et-skel" style={{ height: 120 }} />
        </div>
      </>
    )
  }

  const sc = STATUS[form.status]   || STATUS.todo
  const pc = PRIORITY[form.priority] || PRIORITY.medium

  return (
    <>
      <style>{CSS}</style>
      <div className="et-root">

        {/* ── Back + Header ── */}
        <div style={{ marginBottom: 28 }}>
          <button className="et-btn et-btn-ghost" style={{ padding: '7px 14px', fontSize: 12, marginBottom: 18 }}
            onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#f0f0f8', letterSpacing: '-0.025em', marginBottom: 4 }}>
                Edit Task
              </h1>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="et-pill" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span>
                <span className="et-pill" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="et-btn et-btn-ghost" onClick={() => navigate('/tasks')}>Cancel</button>
              <button className="et-btn et-btn-primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving…' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Section 1: Core Details ── */}
        <div className="et-section">
          <div className="et-section-title">Core Details</div>

          <div className="et-field">
            <label className="et-label">Task Title *</label>
            <input
              className="et-input"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
            />
          </div>

          <div className="et-field">
            <label className="et-label">Description</label>
            <textarea
              className="et-input et-textarea"
              placeholder="Add context, notes, or requirements…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
        </div>

        {/* ── Section 2: Status ── */}
        <div className="et-section">
          <div className="et-section-title">Status</div>
          <div className="et-3col" style={{ marginBottom: 20 }}>
            {Object.entries(STATUS).map(([key, cfg]) => {
              const active = form.status === key
              return (
                <button
                  key={key}
                  className="et-status-btn"
                  onClick={() => set('status', key)}
                  style={{
                    border      : `1.5px solid ${active ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                    background  : active ? cfg.bg : 'rgba(255,255,255,0.03)',
                    color       : active ? cfg.color : 'rgba(255,255,255,0.45)',
                    boxShadow   : active ? `0 0 20px ${cfg.color}22` : 'none',
                  }}>
                  <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{cfg.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.65, fontFamily: 'DM Mono, monospace' }}>{cfg.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Section 3: Priority ── */}
        <div className="et-section">
          <div className="et-section-title">Priority</div>
          <div className="et-3col" style={{ marginBottom: 20 }}>
            {Object.entries(PRIORITY).map(([key, cfg]) => {
              const active = form.priority === key
              return (
                <button
                  key={key}
                  className="et-priority-btn"
                  onClick={() => set('priority', key)}
                  style={{
                    border    : `1.5px solid ${active ? cfg.border : 'rgba(255,255,255,0.08)'}`,
                    background: active ? cfg.bg : 'rgba(255,255,255,0.03)',
                    color     : active ? cfg.color : 'rgba(255,255,255,0.45)',
                    boxShadow : active ? `0 0 16px ${cfg.color}18` : 'none',
                    fontWeight: active ? 700 : 500,
                  }}>
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Section 4: Team & Assignment (admin/manager only) ── */}
        {(role === 'admin' || role === 'manager') && (
          <div className="et-section">
            <div className="et-section-title">Assignment</div>

            <div className="et-2col">
              <div className="et-field">
                <label className="et-label">Team</label>
                <select className="et-input et-select" value={form.team_id} onChange={e => set('team_id', e.target.value)}>
                  <option value="">— No team —</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {teams.length === 0 && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, fontFamily: 'DM Mono, monospace' }}>
                    No teams found —{' '}
                    <span style={{ color: '#7c6ae0', cursor: 'pointer' }} onClick={() => navigate('/teams/new')}>create one</span>
                  </p>
                )}
              </div>

              <div className="et-field">
                <label className="et-label">Assign To</label>
                <select className="et-input et-select" value={form.assign_id} onChange={e => set('assign_id', e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {employees.map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                  ))}
                </select>
                {employees.length === 0 && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, fontFamily: 'DM Mono, monospace' }}>
                    No employees found —{' '}
                    <span style={{ color: '#7c6ae0', cursor: 'pointer' }} onClick={() => navigate('/users/new')}>add one</span>
                  </p>
                )}
              </div>
            </div>

            {/* Current assignment preview */}
            {(form.team_id || form.assign_id) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {form.team_id && (() => {
                  const t = teams.find(t => t.id === form.team_id)
                  return t ? (
                    <span className="et-pill" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                      👥 {t.name}
                    </span>
                  ) : null
                })()}
                {form.assign_id && (() => {
                  const u = employees.find(u => u.id === form.assign_id)
                  return u ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 100, padding: '3px 12px 3px 6px' }}>
                      <Avatar name={u.name} size={20} />
                      <span style={{ fontSize: 11.5, color: '#c4b5fd', fontWeight: 500 }}>{u.name}</span>
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── Footer actions ── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, paddingBottom: 32 }}>
          <button className="et-btn et-btn-ghost" onClick={() => navigate('/tasks')}>Cancel</button>
          <button className="et-btn et-btn-primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : '✓ Save Changes'}
          </button>
        </div>

      </div>
    </>
  )
}