import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { selUser } from '../redux/slices/authSlice'
import { api } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'

const CSS = `
  .mt-card { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; padding: 20px; transition: all 0.2s ease; cursor: pointer; }
  .mt-card:hover { border-color: ${T.colors.primary.DEFAULT}60; box-shadow: 0 4px 20px rgba(0,0,0,0.4); transform: translateY(-1px); }
  .mt-badge { display: inline-flex; align-items: center; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 2px 9px; }
  .mt-input { width: 100%; padding: 10px 14px; background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; outline: none; font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.primary}; transition: all 0.2s ease; box-sizing: border-box; }
  .mt-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .mt-input::placeholder { color: ${T.colors.text.muted}; }
  .mt-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 18px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
  .mt-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .mt-modal { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.xl}; padding: 28px; width: 100%; max-width: 540px; box-shadow: 0 32px 80px rgba(0,0,0,0.7); max-height: 90vh; overflow-y: auto; animation: fadeUp 0.2s ease both; }
  .mt-info-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${T.colors.bg.border}; }
  .mt-info-row:last-child { border-bottom: none; }
  .mt-skel { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: ${T.radius.md}; }
  .mt-stat { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; padding: 16px 20px; text-align: center; }
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

/* ─── Task Detail + Status Update Modal ─────────────────────── */
function TaskDetailModal({ task, onClose, onUpdated }) {
  const [newStatus, setNewStatus] = useState(task.status)
  const [saving,    setSaving]    = useState(false)
  const sc = S[task.status]   || S.todo
  const pc = P[task.priority] || P.medium

  const updateStatus = async () => {
    if (newStatus === task.status) { toast('No change'); return }
    setSaving(true)
    try {
      await api.patch('/update-task', { task_id: task.id, status: newStatus })
      toast.success(`Status updated to ${S[newStatus].label}!`)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <span className="mt-badge" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span>
              <span className="mt-badge" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
            </div>
            <h2 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 20, color: T.colors.text.primary, margin: 0, lineHeight: 1.3 }}>{task.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.colors.text.muted, fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {/* Description */}
        {task.description && (
          <div style={{ background: T.colors.bg.elevated, borderRadius: T.radius.md, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: T.colors.text.secondary, lineHeight: 1.7 }}>
            {task.description}
          </div>
        )}

        {/* Info */}
        <div style={{ background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.md, padding: '4px 16px', marginBottom: 20 }}>
          <div className="mt-info-row">
            <span style={{ fontSize: 12, color: T.colors.text.muted, width: 100, flexShrink: 0 }}>Team</span>
            <span style={{ fontSize: 13, color: task.team ? T.colors.text.primary : T.colors.text.muted, fontWeight: 500 }}>
              {task.team?.name || 'No team'}
            </span>
          </div>
          <div className="mt-info-row">
            <span style={{ fontSize: 12, color: T.colors.text.muted, width: 100, flexShrink: 0 }}>Created By</span>
            <span style={{ fontSize: 13, color: T.colors.text.primary, fontWeight: 500 }}>
              {task.creator?.name || '—'}
            </span>
          </div>
          <div className="mt-info-row">
            <span style={{ fontSize: 12, color: T.colors.text.muted, width: 100, flexShrink: 0 }}>Priority</span>
            <span className="mt-badge" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
          </div>
        </div>

        {/* Update status */}
        <div style={{ background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.md, padding: 16, marginBottom: 16 }}>
          <p style={{ fontFamily: T.fonts.display, fontWeight: 600, fontSize: 13, color: T.colors.text.primary, marginBottom: 10 }}>Update Your Status</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(S).map(([val, cfg]) => (
              <button key={val} onClick={() => setNewStatus(val)}
                style={{ flex: 1, padding: '8px 6px', borderRadius: T.radius.md, border: newStatus === val ? `2px solid ${cfg.color}` : `1px solid ${T.colors.bg.border}`, background: newStatus === val ? cfg.bg : 'transparent', color: newStatus === val ? cfg.color : T.colors.text.muted, fontFamily: T.fonts.body, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <button className="mt-btn" onClick={updateStatus} disabled={saving || newStatus === task.status}
          style={{ width: '100%', background: newStatus !== task.status ? T.gradients.brand : T.colors.bg.elevated, color: newStatus !== task.status ? '#fff' : T.colors.text.muted, opacity: saving ? 0.7 : 1, cursor: newStatus === task.status ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving…' : newStatus === task.status ? 'Select a new status to update' : `✓ Update to ${S[newStatus].label}`}
        </button>
      </div>
    </div>
  )
}

/* ─── My Tasks Page ──────────────────────────────────── */
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
      const res = await api.get('/tasks')
      setTasks(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error('MyTasksPage load error:', e)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpdated = (t) => setTasks(prev => prev.map(p => p.id === t.id ? t : p))

  const filtered = tasks.filter(t => {
    if (filter.status   && t.status   !== filter.status)   return false
    if (filter.priority && t.priority !== filter.priority) return false
    return true
  })

  const todo     = filtered.filter(t => t.status === 'todo').length
  const doing    = filtered.filter(t => t.status === 'doing').length
  const complete = filtered.filter(t => t.status === 'complete').length
  const total    = tasks.length

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
            Tasks assigned to you · click any task to view details and update your progress
          </p>
        </div>

        {/* Stats row */}
        {!loading && tasks.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Total',       val: total,    color: T.colors.text.primary },
              { label: 'To Do',       val: todo,     color: T.colors.info.text },
              { label: 'In Progress', val: doing,    color: T.colors.warning.text },
              { label: 'Done',        val: complete, color: T.colors.success.text },
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
          <select className="mt-input mt-select" style={{ maxWidth: 150, appearance: 'none' }} value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="doing">In Progress</option>
            <option value="complete">Done</option>
          </select>
          <select className="mt-input mt-select" style={{ maxWidth: 150, appearance: 'none' }} value={filter.priority}
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
              {tasks.length === 0 ? 'No tasks assigned yet' : 'No tasks match your filter'}
            </p>
            <p style={{ fontSize: 13, color: T.colors.text.muted }}>
              {tasks.length === 0 ? 'Your manager will assign tasks to you.' : 'Try changing or clearing the filters.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(task => {
              const sc = S[task.status]   || S.todo
              const pc = P[task.priority] || P.medium
              return (
                <div key={task.id} className="mt-card" onClick={() => setSelected(task)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Status indicator */}
                    <div style={{ width: 36, height: 36, borderRadius: T.radius.md, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: sc.color, flexShrink: 0 }}>
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
                    {/* Arrow */}
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