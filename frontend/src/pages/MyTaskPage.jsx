import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { selUser } from '../redux/slices/authSlice'
import { api } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'

const CSS = `
  .mt-card { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; padding: 18px 20px; transition: all 0.2s ease; cursor: pointer; }
  .mt-card:hover { border-color: ${T.colors.primary.DEFAULT}60; box-shadow: 0 4px 20px rgba(0,0,0,0.4); transform: translateY(-1px); }
  .mt-badge { display: inline-flex; align-items: center; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 2px 9px; }
  .mt-input { width: 100%; padding: 10px 13px; background: ${T.colors.bg.elevated}; border: 1.5px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; outline: none; font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.primary}; transition: all 0.15s ease; box-sizing: border-box; }
  .mt-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .mt-input::placeholder { color: ${T.colors.text.muted}; }
  .mt-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 18px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
  .mt-btn:active { transform: scale(0.97); }
  .mt-label { display: block; font-size: 11px; font-weight: 600; color: ${T.colors.text.muted}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.07em; }
  .mt-info-row { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid ${T.colors.bg.border}; }
  .mt-info-row:last-child { border-bottom: none; }
  .mt-skel { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: mt-shimmer 1.5s infinite; border-radius: ${T.radius.md}; }
  .mt-stat { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; padding: 16px 20px; text-align: center; }

  /* Modal */
  .mt-overlay {
    position: fixed; inset: 0;
    background: rgba(4, 5, 15, 0.85);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    padding: clamp(12px, 4vw, 40px);
    animation: mt-fade 0.18s ease;
  }
  @keyframes mt-fade { from { opacity: 0 } to { opacity: 1 } }
  .mt-modal {
    background: ${T.colors.bg.card};
    border: 1px solid ${T.colors.bg.border};
    border-radius: 22px;
    width: 100%; max-width: 560px;
    max-height: calc(100dvh - clamp(24px, 8vw, 80px));
    display: flex; flex-direction: column;
    box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
    animation: mt-up 0.24s cubic-bezier(0.22, 1, 0.36, 1);
    overflow: hidden;
  }
  @keyframes mt-up { from { opacity:0; transform:translateY(20px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
  .mt-mhd { padding: 22px 24px 18px; border-bottom: 1px solid ${T.colors.bg.border}; display: flex; align-items: flex-start; gap: 14px; flex-shrink: 0; }
  .mt-mbd { padding: 22px 24px; overflow-y: auto; flex: 1; scrollbar-width: thin; scrollbar-color: ${T.colors.bg.border} transparent; }
  .mt-mbd::-webkit-scrollbar { width: 4px; }
  .mt-mbd::-webkit-scrollbar-thumb { background: ${T.colors.bg.border}; border-radius: 4px; }
  .mt-mft { padding: 16px 24px 20px; border-top: 1px solid ${T.colors.bg.border}; flex-shrink: 0; }
  .mt-mico { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .mt-close { width: 34px; height: 34px; border-radius: 10px; margin-left: auto; display: flex; align-items: center; justify-content: center; background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; cursor: pointer; color: ${T.colors.text.muted}; font-size: 18px; line-height: 1; transition: all 0.15s; flex-shrink: 0; }
  .mt-close:hover { background: ${T.colors.bg.hover}; color: ${T.colors.text.primary}; }

  /* Status selector */
  .mt-status-btn { flex: 1; padding: 10px 6px; border-radius: ${T.radius.md}; font-family: ${T.fonts.body}; font-size: 11.5px; font-weight: 600; cursor: pointer; transition: all 0.15s; text-align: center; }

  @keyframes mt-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @media (max-width: 540px) {
    .mt-overlay { padding: 0; align-items: flex-end; }
    .mt-modal { max-width: 100%; border-radius: 22px 22px 0 0; max-height: 93dvh; animation: mt-sheet 0.28s cubic-bezier(0.22,1,0.36,1); }
    @keyframes mt-sheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
    .mt-stats-grid { grid-template-columns: 1fr 1fr !important; }
  }
`

const S = {
  todo    : { label: 'To Do',       color: T.colors.info.text,    bg: T.colors.info.bg,    icon: '○' },
  doing   : { label: 'In Progress', color: T.colors.warning.text, bg: T.colors.warning.bg, icon: '◑' },
  complete: { label: 'Done',        color: T.colors.success.text, bg: T.colors.success.bg, icon: '●' },
}
const P = {
  low    : { label: 'Low',    color: T.colors.success.text, bg: T.colors.success.bg },
  medium : { label: 'Medium', color: T.colors.warning.text, bg: T.colors.warning.bg },
  high   : { label: 'High',   color: T.colors.danger.text,  bg: T.colors.danger.bg },
}

function TaskDetailModal({ task, onClose, onUpdated }) {
  const [newStatus, setNewStatus] = useState(task.status)
  const [saving,    setSaving]    = useState(false)
  const sc = S[task.status] || S.todo
  const pc = P[task.priority] || P.medium

  const updateStatus = async () => {
    if (newStatus === task.status) { toast('No change made'); return }
    setSaving(true)
    try {
      await api.patch('/update-task', { task_id: task.id, status: newStatus })
      toast.success(`Updated to ${S[newStatus].label}!`)
      onUpdated({ ...task, status: newStatus })
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Update failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="mt-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mt-modal">
        {/* Header */}
        <div className="mt-mhd">
          <div className="mt-mico" style={{ background: sc.bg, border: `1.5px solid ${sc.color}30` }}>
            <span style={{ fontSize: 20, color: sc.color }}>{sc.icon}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              <span className="mt-badge" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span>
              <span className="mt-badge" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
            </div>
            <h2 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 17, color: T.colors.text.primary, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.title}</h2>
          </div>
          <button className="mt-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="mt-mbd">
          {/* Description */}
          {task.description && (
            <div style={{ background: T.colors.bg.elevated, borderRadius: T.radius.md, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: T.colors.text.secondary, lineHeight: 1.7, border: `1px solid ${T.colors.bg.border}` }}>
              {task.description}
            </div>
          )}

          {/* Info rows */}
          <div style={{ background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.md, padding: '4px 16px', marginBottom: 20 }}>
            <div className="mt-info-row">
              <span style={{ fontSize: 11, color: T.colors.text.muted, width: 100, flexShrink: 0, fontFamily: T.fonts.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team</span>
              <span style={{ fontSize: 13, color: task.team ? T.colors.text.primary : T.colors.text.muted, fontWeight: 500 }}>
                {task.team?.name || 'No team'}
              </span>
            </div>
            <div className="mt-info-row">
              <span style={{ fontSize: 11, color: T.colors.text.muted, width: 100, flexShrink: 0, fontFamily: T.fonts.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created By</span>
              <span style={{ fontSize: 13, color: T.colors.text.primary, fontWeight: 500 }}>
                {task.creator?.name || '—'}
              </span>
            </div>
            <div className="mt-info-row">
              <span style={{ fontSize: 11, color: T.colors.text.muted, width: 100, flexShrink: 0, fontFamily: T.fonts.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</span>
              <span className="mt-badge" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
            </div>
          </div>

          {/* Status update */}
          <div style={{ background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.md, padding: '16px' }}>
            <p style={{ fontFamily: T.fonts.display, fontWeight: 600, fontSize: 13, color: T.colors.text.primary, marginBottom: 12 }}>Update Your Status</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(S).map(([val, cfg]) => (
                <button key={val}
                  className="mt-status-btn"
                  onClick={() => setNewStatus(val)}
                  style={{
                    border: newStatus === val ? `2px solid ${cfg.color}` : `1.5px solid ${T.colors.bg.border}`,
                    background: newStatus === val ? cfg.bg : 'transparent',
                    color: newStatus === val ? cfg.color : T.colors.text.muted,
                  }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{cfg.icon}</div>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-mft">
          <button className="mt-btn" onClick={updateStatus} disabled={saving || newStatus === task.status}
            style={{
              width: '100%',
              background: newStatus !== task.status ? T.gradients.brand : T.colors.bg.elevated,
              color: newStatus !== task.status ? '#fff' : T.colors.text.muted,
              opacity: saving ? 0.7 : 1,
              cursor: newStatus === task.status ? 'not-allowed' : 'pointer',
              boxShadow: newStatus !== task.status ? '0 4px 14px rgba(99,102,241,0.3)' : 'none',
            }}>
            {saving ? 'Saving…' : newStatus === task.status ? 'Select a new status to update' : `✓ Update to ${S[newStatus].label}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyTasksPage() {
  const user  = useSelector(selUser)
  const role  = (user?.role || '').toLowerCase()

  const [tasks,    setTasks]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter,   setFilter]   = useState({ status: '', priority: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Use /my-tasks endpoint — returns role-appropriate tasks
      const res = await api.get('/my-tasks')
      setTasks(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      // Fallback to /tasks if /my-tasks not available
      try {
        const fallback = await api.get('/tasks')
        setTasks(Array.isArray(fallback.data) ? fallback.data : [])
      } catch {
        console.error('MyTasksPage load error:', e)
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpdated = (t) => setTasks(prev => prev.map(p => p.id === t.id ? t : p))

  const filtered = tasks.filter(t => {
    if (filter.status   && t.status   !== filter.status)   return false
    if (filter.priority && t.priority !== filter.priority) return false
    return true
  })

  const todo     = tasks.filter(t => t.status === 'todo').length
  const doing    = tasks.filter(t => t.status === 'doing').length
  const complete = tasks.filter(t => t.status === 'complete').length

  const roleLabel = role === 'admin' ? 'All tasks (Admin view)' : role === 'manager' ? 'Tasks you created' : 'Tasks assigned to you'

  return (
    <>
      <style>{CSS}</style>

      {selected && (
        <TaskDetailModal task={selected} onClose={() => setSelected(null)} onUpdated={(t) => { handleUpdated(t); setSelected(null) }} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fonts.body }}>
        {/* Header */}
        <div>
          <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>My Tasks</h1>
          <p style={{ fontSize: 14, color: T.colors.text.secondary }}>
            {roleLabel} · click any task to view details
          </p>
        </div>

        {/* Stats */}
        {!loading && tasks.length > 0 && (
          <div className="mt-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Total',       val: tasks.length, color: T.colors.text.primary },
              { label: 'To Do',       val: todo,         color: T.colors.info.text },
              { label: 'In Progress', val: doing,        color: T.colors.warning.text },
              { label: 'Done',        val: complete,     color: T.colors.success.text },
            ].map(s => (
              <div key={s.label} className="mt-stat">
                <p style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 28, color: s.color, marginBottom: 2 }}>{s.val}</p>
                <p style={{ fontFamily: T.fonts.mono, fontSize: 10, color: T.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select className="mt-input" style={{ maxWidth: 150, appearance: 'none' }} value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="doing">In Progress</option>
            <option value="complete">Done</option>
          </select>
          <select className="mt-input" style={{ maxWidth: 150, appearance: 'none' }} value={filter.priority}
            onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {(filter.status || filter.priority) && (
            <button className="mt-btn" onClick={() => setFilter({ status: '', priority: '' })}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Task list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} className="mt-skel" style={{ height: 100 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.lg, textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: 44, marginBottom: 10 }}>✅</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: T.colors.text.secondary, marginBottom: 6 }}>
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filter'}
            </p>
            <p style={{ fontSize: 13, color: T.colors.text.muted }}>
              {tasks.length === 0 ? 'Your manager will assign tasks to you.' : 'Try changing or clearing the filters.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(task => {
              const sc = S[task.status] || S.todo
              const pc = P[task.priority] || P.medium
              return (
                <div key={task.id} className="mt-card" onClick={() => setSelected(task)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Status icon */}
                    <div style={{ width: 38, height: 38, borderRadius: T.radius.md, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: sc.color, flexShrink: 0 }}>
                      {sc.icon}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <p style={{ fontFamily: T.fonts.body, fontSize: 14, fontWeight: 600, color: T.colors.text.primary, margin: 0 }}>{task.title}</p>
                        <span className="mt-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                        <span className="mt-badge" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                      </div>
                      {task.description && (
                        <p style={{ fontSize: 12, color: T.colors.text.muted, margin: '0 0 6px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                          {task.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {task.team && (
                          <span style={{ fontSize: 11, color: T.colors.text.muted }}>👥 {task.team.name}</span>
                        )}
                        {task.creator && (
                          <span style={{ fontSize: 11, color: T.colors.text.muted }}>👤 From {task.creator.name}</span>
                        )}
                      </div>
                    </div>
                    <span style={{ color: T.colors.text.muted, fontSize: 18, flexShrink: 0, alignSelf: 'center' }}>›</span>
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