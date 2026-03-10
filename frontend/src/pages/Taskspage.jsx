import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selUser } from '../redux/slices/authSlice'
import { api } from '../redux/slices/authSlice'
import { getAllTeams, getAllEmployees } from '../utils/api'
import toast from 'react-hot-toast'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .tk-root { font-family: 'DM Sans', sans-serif; }

  /* ── Kanban columns ── */
  .tk-col {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(8px);
  }
  .tk-col-hdr {
    padding: 14px 18px 12px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .tk-col-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-height: 120px;
  }

  /* ── Task card ── */
  .tk-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
    position: relative;
    overflow: hidden;
  }
  .tk-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .tk-card:hover { 
    border-color: rgba(255,255,255,0.18); 
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  }
  .tk-card:hover::before { opacity: 1; }

  /* ── Pill badge ── */
  .tk-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: 'DM Mono', monospace;
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: 0.06em;
    border-radius: 100px;
    padding: 3px 9px;
    white-space: nowrap;
  }

  /* ── Inputs & selects ── */
  .tk-input {
    width: 100%;
    padding: 10px 14px;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #f0f0f8;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }
  .tk-input:focus {
    border-color: rgba(139,92,246,0.7);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
  }
  .tk-input::placeholder { color: rgba(255,255,255,0.22); }
  .tk-select { appearance: none; cursor: pointer; }

  /* ── Buttons ── */
  .tk-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 20px;
    border-radius: 10px;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
    letter-spacing: 0.01em;
  }
  .tk-btn:active { transform: scale(0.96); }
  .tk-btn-primary {
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
    color: #fff;
    box-shadow: 0 4px 16px rgba(99,62,220,0.4);
  }
  .tk-btn-primary:hover { box-shadow: 0 6px 24px rgba(99,62,220,0.55); transform: translateY(-1px); }
  .tk-btn-ghost {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.7);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .tk-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .tk-btn-danger {
    background: rgba(239,68,68,0.12);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.25);
  }
  .tk-btn-danger:hover { background: rgba(239,68,68,0.22); }

  /* ── Label ── */
  .tk-label {
    display: block;
    font-size: 10.5px;
    font-weight: 600;
    color: rgba(255,255,255,0.4);
    margin-bottom: 7px;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    font-family: 'DM Mono', monospace;
  }
  .tk-field { margin-bottom: 20px; }
  .tk-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* ── Skeleton ── */
  .tk-skel {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: tk-shimmer 1.6s infinite;
    border-radius: 18px;
  }
  @keyframes tk-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* ── Modal (View only — no edit) ── */
  .tk-overlay {
    position: fixed; inset: 0;
    background: rgba(2,2,14,0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    padding: clamp(12px, 4vw, 40px);
    animation: tk-fade 0.16s ease;
  }
  @keyframes tk-fade { from { opacity: 0 } to { opacity: 1 } }
  .tk-modal {
    background: #0e0e1a;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    width: 100%; max-width: 520px;
    max-height: calc(100dvh - 60px);
    display: flex; flex-direction: column;
    box-shadow: 0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05);
    animation: tk-up 0.26s cubic-bezier(0.22,1,0.36,1);
    overflow: hidden;
  }
  @keyframes tk-up { from { opacity:0; transform:translateY(24px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
  .tk-mhd { padding: 24px 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: flex-start; gap: 14px; flex-shrink: 0; }
  .tk-mbd { padding: 24px; overflow-y: auto; flex: 1; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
  .tk-mft { padding: 18px 24px 22px; border-top: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
  .tk-close {
    width: 32px; height: 32px; border-radius: 9px; margin-left: auto; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer; color: rgba(255,255,255,0.5); font-size: 17px; line-height: 1;
    transition: all 0.15s;
  }
  .tk-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

  /* ── Info row ── */
  .tk-info-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .tk-info-row:last-child { border-bottom: none; }

  /* ── Filters ── */
  .tk-filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

  /* ── Avatar ── */
  .tk-avatar {
    border-radius: 50%;
    background: linear-gradient(135deg,#7c3aed,#4f46e5);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 700;
    color: #fff; flex-shrink: 0;
  }

  /* ── Status indicator dot ── */
  .tk-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

  /* ── Responsive ── */
  @media (max-width: 900px) { .tk-kanban { grid-template-columns: 1fr 1fr !important; } }
  @media (max-width: 600px) {
    .tk-kanban { grid-template-columns: 1fr !important; }
    .tk-2col { grid-template-columns: 1fr; }
    .tk-filters { gap: 8px; }
    .tk-filters .tk-input { max-width: 100% !important; }
  }
  @media (max-width: 540px) {
    .tk-overlay { padding: 0; align-items: flex-end; }
    .tk-modal { max-width: 100%; border-radius: 24px 24px 0 0; max-height: 93dvh; animation: tk-sheet 0.28s cubic-bezier(0.22,1,0.36,1); }
    @keyframes tk-sheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
  }
`

// Status & priority configs
const STATUS = {
  todo    : { label: 'To Do',       color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  dot: '#60a5fa', icon: '○' },
  doing   : { label: 'In Progress', color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  dot: '#fb923c', icon: '◑' },
  complete: { label: 'Done',        color: '#34d399', bg: 'rgba(52,211,153,0.1)',  dot: '#34d399', icon: '●' },
}
const PRIORITY = {
  low   : { label: 'Low',    color: '#86efac', bg: 'rgba(134,239,172,0.12)' },
  medium: { label: 'Medium', color: '#fcd34d', bg: 'rgba(252,211,77,0.12)'  },
  high  : { label: 'High',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

function Avatar({ name, size = 30 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="tk-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {initials}
    </div>
  )
}

// ── Read-only task detail modal (edit goes to /tasks/:id/edit) ───────────────
function TaskDetailModal({ task, canEdit, onClose, onUpdated, onDeleted, navigate }) {
  const sc = STATUS[task.status]   || STATUS.todo
  const pc = PRIORITY[task.priority] || PRIORITY.medium

  const cycleStatus = async () => {
    const order = ['todo', 'doing', 'complete']
    const next  = order[(order.indexOf(task.status) + 1) % 3]
    try {
      await api.patch('/update-task', { task_id: task.id, status: next })
      toast.success(`Moved to ${STATUS[next].label}`)
      onUpdated({ ...task, status: next })
      onClose()
    } catch { toast.error('Status update failed') }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${task.title}"?`)) return
    try {
      await api.delete(`/task/${task.id}`)
      toast.success('Task deleted!')
      onDeleted(task.id)
      onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Delete failed') }
  }

  return (
    <div className="tk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tk-modal">
        {/* Header */}
        <div className="tk-mhd">
          <div style={{ width: 44, height: 44, borderRadius: 13, background: sc.bg, border: `1.5px solid ${sc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20, color: sc.color }}>{sc.icon}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 7, flexWrap: 'wrap' }}>
              <span className="tk-pill" style={{ background: sc.bg, color: sc.color }}>
                <span className="tk-dot" style={{ background: sc.dot }} />{sc.label}
              </span>
              <span className="tk-pill" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#f0f0f8', margin: 0, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {task.title}
            </h2>
          </div>
          <button className="tk-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="tk-mbd">
          {task.description && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
              {task.description}
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '2px 18px' }}>
            {/* Team */}
            <div className="tk-info-row">
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', width: 80, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Team</span>
              {task.team?.name
                ? <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>👥 {task.team.name}</span>
                : <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No team</span>
              }
            </div>
            {/* Assignee */}
            <div className="tk-info-row">
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', width: 80, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Assigned</span>
              {task.assignee
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={task.assignee.name} size={22} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{task.assignee.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{task.assignee.email}</span>
                  </div>
                : <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Unassigned</span>
              }
            </div>
            {/* Creator */}
            {task.creator && (
              <div className="tk-info-row">
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', width: 80, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Creator</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={task.creator.name} size={22} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{task.creator.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="tk-mft">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canEdit && (
              <button className="tk-btn tk-btn-primary" style={{ flex: 1 }}
                onClick={() => { onClose(); navigate(`/tasks/${task.id}/edit`, { state: { task } }) }}>
                ✏️ Edit Task
              </button>
            )}
            <button className="tk-btn tk-btn-ghost" style={{ flex: 1 }} onClick={cycleStatus}>
              ↻ Next Status
            </button>
            {canEdit && (
              <button className="tk-btn tk-btn-danger" onClick={handleDelete}>🗑</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task, onClick }) {
  const sc = STATUS[task.status]     || STATUS.todo
  const pc = PRIORITY[task.priority] || PRIORITY.medium
  return (
    <div className="tk-card" onClick={() => onClick(task)}>
      {/* Priority accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: pc.color, opacity: 0.5, borderRadius: '14px 14px 0 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#f0f0f8', lineHeight: 1.45, margin: 0, flex: 1 }}>
          {task.title}
        </p>
        <span className="tk-pill" style={{ background: pc.bg, color: pc.color, flexShrink: 0 }}>{pc.label}</span>
      </div>

      {task.description && (
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)', marginBottom: 12, lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {task.team && (
            <span className="tk-pill" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
              👥 {task.team.name}
            </span>
          )}
        </div>
        {task.assignee
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Avatar name={task.assignee.name} size={20} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{task.assignee.name}</span>
            </div>
          : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: 'DM Mono, monospace' }}>unassigned</span>
        }
      </div>
    </div>
  )
}

export default function TasksPage() {
  const user     = useSelector(selUser)
  const role     = (user?.role || '').toLowerCase()
  const canEdit  = role === 'admin' || role === 'manager'
  const navigate = useNavigate()

  const [tasks,     setTasks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [filter,    setFilter]    = useState({ status: '', priority: '', search: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/tasks').catch(() => ({ data: [] }))
      setTasks(Array.isArray(res.data) ? res.data : [])
    } catch (err) { console.error('TasksPage load:', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpdated = (t) => setTasks(prev => prev.map(p => p.id === t.id ? t : p))
  const handleDeleted = (id) => setTasks(prev => prev.filter(p => p.id !== id))

  const filtered = tasks.filter(t => {
    if (filter.status   && t.status   !== filter.status)   return false
    if (filter.priority && t.priority !== filter.priority) return false
    if (filter.search   && !t.title?.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  const cols = {
    todo    : filtered.filter(t => t.status === 'todo'),
    doing   : filtered.filter(t => t.status === 'doing'),
    complete: filtered.filter(t => t.status === 'complete'),
  }

  const total     = tasks.length
  const done      = tasks.filter(t => t.status === 'complete').length
  const progress  = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <>
      <style>{CSS}</style>
      {selected && (
        <TaskDetailModal
          task={selected}
          canEdit={canEdit}
          navigate={navigate}
          onClose={() => setSelected(null)}
          onUpdated={(t) => { handleUpdated(t); setSelected(null) }}
          onDeleted={handleDeleted}
        />
      )}

      <div className="tk-root" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#f0f0f8', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Tasks
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono, monospace' }}>
              {loading ? 'loading…' : `${filtered.length} task${filtered.length !== 1 ? 's' : ''} · ${progress}% complete`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="tk-btn tk-btn-ghost" onClick={load} title="Refresh">↺</button>
            {canEdit && (
              <button className="tk-btn tk-btn-primary" onClick={() => navigate('/tasks/new')}>
                ＋ New Task
              </button>
            )}
          </div>
        </div>

        {/* ── Progress bar ── */}
        {!loading && total > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg,#7c3aed,#34d399)',
              borderRadius: 100,
              transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
            }} />
          </div>
        )}

        {/* ── Stats row ── */}
        {!loading && total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {Object.entries(STATUS).map(([key, cfg]) => {
              const count = tasks.filter(t => t.status === key).length
              return (
                <div key={key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}
                  onClick={() => setFilter(f => ({ ...f, status: f.status === key ? '' : key }))}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 700, color: cfg.color, marginBottom: 2 }}>{count}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'DM Mono, monospace' }}>{cfg.label}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="tk-filters">
          <input className="tk-input" style={{ maxWidth: 260 }} placeholder="🔍  search tasks…"
            value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
          <select className="tk-input tk-select" style={{ maxWidth: 148 }}
            value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="doing">In Progress</option>
            <option value="complete">Done</option>
          </select>
          <select className="tk-input tk-select" style={{ maxWidth: 148 }}
            value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {(filter.status || filter.priority || filter.search) && (
            <button className="tk-btn tk-btn-ghost" style={{ padding: '9px 13px' }}
              onClick={() => setFilter({ status: '', priority: '', search: '' })}>✕ Clear</button>
          )}
        </div>

        {/* ── Board ── */}
        {loading ? (
          <div className="tk-kanban" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[1,2,3].map(i => <div key={i} className="tk-skel" style={{ height: 360 }} />)}
          </div>
        ) : total === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, textAlign: 'center', padding: '72px 24px' }}>
            <p style={{ fontSize: 48, marginBottom: 10 }}>📋</p>
            <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>No tasks yet</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{canEdit ? 'Create your first task to get started.' : 'No tasks assigned to you yet.'}</p>
            {canEdit && (
              <button className="tk-btn tk-btn-primary" onClick={() => navigate('/tasks/new')} style={{ marginTop: 20 }}>
                ＋ Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="tk-kanban" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {Object.entries(cols).map(([status, items]) => {
              const cfg = STATUS[status]
              return (
                <div key={status} className="tk-col">
                  <div className="tk-col-hdr" style={{ color: cfg.color }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="tk-dot" style={{ background: cfg.dot }} />
                      <span>{cfg.label}</span>
                    </div>
                    <span className="tk-pill" style={{ background: cfg.bg, color: cfg.color }}>{items.length}</span>
                  </div>
                  <div className="tk-col-body">
                    {items.length === 0
                      ? <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 12, padding: '24px 0', fontFamily: 'DM Mono, monospace' }}>empty</p>
                      : items.map(task => <TaskCard key={task.id} task={task} onClick={setSelected} />)
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}