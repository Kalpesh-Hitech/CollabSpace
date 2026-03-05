import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { selUser } from '../redux/slices/authSlice'
import { api } from '../redux/slices/authSlice'
import { getAllTeams, getAllUsers } from '../utils/api'
import toast from 'react-hot-toast'

const CSS = `
  .tk-col { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; overflow: hidden; display: flex; flex-direction: column; }
  .tk-col-hdr { padding: 12px 16px; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid ${T.colors.bg.border}; display: flex; align-items: center; justify-content: space-between; }
  .tk-col-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; flex: 1; min-height: 80px; }
  .tk-card { background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; padding: 14px; transition: all 0.2s ease; cursor: pointer; }
  .tk-card:hover { border-color: ${T.colors.primary.DEFAULT}60; box-shadow: 0 4px 16px rgba(0,0,0,0.4); transform: translateY(-1px); }
  .tk-badge { display: inline-flex; align-items: center; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 2px 8px; }
  .tk-input { width: 100%; padding: 10px 14px; background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; outline: none; font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.primary}; transition: all 0.2s ease; box-sizing: border-box; }
  .tk-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .tk-input::placeholder { color: ${T.colors.text.muted}; }
  .tk-select { appearance: none; cursor: pointer; }
  .tk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 18px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
  .tk-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .tk-modal { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.xl}; padding: 28px; width: 100%; max-width: 520px; box-shadow: 0 32px 80px rgba(0,0,0,0.7); max-height: 90vh; overflow-y: auto; animation: fadeUp 0.2s ease both; }
  .tk-detail-modal { max-width: 600px; }
  .tk-label { display: block; font-size: 11px; font-weight: 600; color: ${T.colors.text.muted}; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.06em; }
  .tk-field { margin-bottom: 16px; }
  .tk-skel { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: ${T.radius.md}; }
  .tk-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .tk-info-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${T.colors.bg.border}; }
  .tk-info-row:last-child { border-bottom: none; }
  @media (max-width: 900px) { .tk-kanban { grid-template-columns: 1fr 1fr !important; } }
  @media (max-width: 600px) { .tk-kanban { grid-template-columns: 1fr !important; } }
`

const S = {
  todo    : { label: 'To Do',       color: T.colors.info.text,    bg: T.colors.info.bg },
  doing   : { label: 'In Progress', color: T.colors.warning.text, bg: T.colors.warning.bg },
  complete: { label: 'Done',        color: T.colors.success.text, bg: T.colors.success.bg },
}
const P = {
  low    : { label: 'Low',    color: T.colors.success.text, bg: T.colors.success.bg },
  medium : { label: 'Medium', color: T.colors.warning.text, bg: T.colors.warning.bg },
  high   : { label: 'High',   color: T.colors.danger.text,  bg: T.colors.danger.bg },
}

function Avatar({ name, size = 32 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: T.gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display, fontWeight: 700, fontSize: size * 0.34, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

/* ─── Task Detail Modal ──────────────────────────────── */
function TaskDetailModal({ task, teams, users, canEdit, onClose, onUpdated, onDeleted }) {
  const [form,    setForm]    = useState({ title: task.title, description: task.description || '', priority: task.priority, status: task.status, team_id: task.team_id || '', assign_id: task.assign_id || '' })
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const sc = S[task.status]   || S.todo
  const pc = P[task.priority] || P.medium

  const save = async () => {
    setSaving(true)
    try {
      const body = { task_id: task.id, title: form.title, description: form.description || null, priority: form.priority, status: form.status }
      if (form.assign_id) body.assign_id = form.assign_id
      const res = await api.patch('/update-task', body)
      if (form.team_id && form.team_id !== task.team_id && form.assign_id) {
        await api.patch('/assign_task', { task_id: task.id, team_id: form.team_id, assign_id: form.assign_id })
      }
      toast.success('Task updated!')
      onUpdated({ ...task, ...form, ...res.data })
      setEditing(false)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Update failed')
    } finally { setSaving(false) }
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

  const cycleStatus = async () => {
    const order = ['todo', 'doing', 'complete']
    const next  = order[(order.indexOf(task.status) + 1) % 3]
    try {
      const res = await api.patch('/update-task', { task_id: task.id, status: next })
      toast.success(`Moved to ${S[next].label}`)
      onUpdated({ ...task, status: next })
      onClose()
    } catch (e) { toast.error('Status update failed') }
  }

  return (
    <div className="tk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tk-modal tk-detail-modal">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <span className="tk-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
              <span className="tk-badge" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
            </div>
            {editing
              ? <input className="tk-input" value={form.title} onChange={e => set('title', e.target.value)} style={{ fontSize: 17, fontWeight: 700, padding: '8px 12px' }} autoFocus />
              : <h2 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 20, color: T.colors.text.primary, margin: 0, lineHeight: 1.3 }}>{task.title}</h2>
            }
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.colors.text.muted, fontSize: 22, padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>

        {/* Description */}
        <div className="tk-field">
          <label className="tk-label">Description</label>
          {editing
            ? <textarea className="tk-input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
            : <p style={{ fontSize: 13, color: task.description ? T.colors.text.secondary : T.colors.text.muted, lineHeight: 1.6, margin: 0 }}>
                {task.description || 'No description'}
              </p>
          }
        </div>

        {/* Info grid */}
        <div style={{ background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.md, padding: '4px 16px', marginBottom: 20 }}>
          {/* Team */}
          <div className="tk-info-row">
            <span style={{ fontSize: 12, color: T.colors.text.muted, width: 90, flexShrink: 0 }}>Team</span>
            {editing
              ? <select className="tk-input tk-select" style={{ flex: 1 }} value={form.team_id} onChange={e => set('team_id', e.target.value)}>
                  <option value="">— No team —</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              : <span style={{ fontSize: 13, color: task.team?.name ? T.colors.text.primary : T.colors.text.muted, fontWeight: 500 }}>
                  {task.team?.name || 'Unassigned'}
                </span>
            }
          </div>
          {/* Assignee */}
          <div className="tk-info-row">
            <span style={{ fontSize: 12, color: T.colors.text.muted, width: 90, flexShrink: 0 }}>Assigned To</span>
            {editing
              ? <select className="tk-input tk-select" style={{ flex: 1 }} value={form.assign_id} onChange={e => set('assign_id', e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
                </select>
              : task.assignee
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={task.assignee.name} size={24} />
                    <span style={{ fontSize: 13, color: T.colors.text.primary, fontWeight: 500 }}>{task.assignee.name}</span>
                    <span style={{ fontSize: 11, color: T.colors.text.muted }}>{task.assignee.email}</span>
                  </div>
                : <span style={{ fontSize: 13, color: T.colors.text.muted }}>Unassigned</span>
            }
          </div>
          {/* Creator */}
          <div className="tk-info-row">
            <span style={{ fontSize: 12, color: T.colors.text.muted, width: 90, flexShrink: 0 }}>Created By</span>
            {task.creator
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={task.creator.name} size={24} />
                  <span style={{ fontSize: 13, color: T.colors.text.primary, fontWeight: 500 }}>{task.creator.name}</span>
                </div>
              : <span style={{ fontSize: 13, color: T.colors.text.muted }}>—</span>
            }
          </div>
          {/* Priority + Status when editing */}
          {editing && (<>
            <div className="tk-info-row">
              <span style={{ fontSize: 12, color: T.colors.text.muted, width: 90, flexShrink: 0 }}>Priority</span>
              <select className="tk-input tk-select" style={{ flex: 1 }} value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="tk-info-row">
              <span style={{ fontSize: 12, color: T.colors.text.muted, width: 90, flexShrink: 0 }}>Status</span>
              <select className="tk-input tk-select" style={{ flex: 1 }} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="todo">To Do</option>
                <option value="doing">In Progress</option>
                <option value="complete">Done</option>
              </select>
            </div>
          </>)}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canEdit && !editing && (
            <button className="tk-btn" onClick={() => setEditing(true)}
              style={{ background: T.gradients.brand, color: '#fff', flex: 1 }}>
              ✏️ Edit Task
            </button>
          )}
          {editing && (
            <button className="tk-btn" onClick={save} disabled={saving}
              style={{ background: T.gradients.brand, color: '#fff', flex: 1, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : '✓ Save Changes'}
            </button>
          )}
          {editing && (
            <button className="tk-btn" onClick={() => { setEditing(false); setForm({ title: task.title, description: task.description || '', priority: task.priority, status: task.status, team_id: task.team_id || '', assign_id: task.assign_id || '' }) }}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
              Cancel
            </button>
          )}
          {!editing && (
            <button className="tk-btn" onClick={cycleStatus}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}`, flex: 1 }}>
              ↻ Next Status
            </button>
          )}
          {canEdit && !editing && (
            <button className="tk-btn" onClick={handleDelete}
              style={{ background: T.colors.danger.bg, color: T.colors.danger.text, border: `1px solid ${T.colors.danger.border}` }}>
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Create Task Modal ──────────────────────────────── */
function CreateTaskModal({ teams, users, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', team_id: '', assign_id: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setBusy(true)
    try {
      const body = { title: form.title, description: form.description || null, priority: form.priority, status: form.status }
      if (form.team_id)   body.team_id   = form.team_id
      if (form.assign_id) body.assign_id = form.assign_id
      const res = await api.post('/create_task', body)
      onCreated(res.data)
      toast.success('Task created!')
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create task')
    } finally { setBusy(false) }
  }

  return (
    <div className="tk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tk-modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 18, color: T.colors.text.primary, margin: 0 }}>New Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.colors.text.muted, fontSize: 22 }}>×</button>
        </div>

        <div className="tk-field">
          <label className="tk-label">Title *</label>
          <input className="tk-input" placeholder="What needs to be done?" value={form.title} onChange={e => set('title', e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
        </div>
        <div className="tk-field">
          <label className="tk-label">Description</label>
          <textarea className="tk-input" rows={3} placeholder="Add details…" value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="tk-field">
            <label className="tk-label">Priority</label>
            <select className="tk-input tk-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="tk-field">
            <label className="tk-label">Status</label>
            <select className="tk-input tk-select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="todo">To Do</option>
              <option value="doing">In Progress</option>
              <option value="complete">Done</option>
            </select>
          </div>
        </div>
        {teams.length > 0 && (
          <div className="tk-field">
            <label className="tk-label">Team (optional)</label>
            <select className="tk-input tk-select" value={form.team_id} onChange={e => set('team_id', e.target.value)}>
              <option value="">— No team —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        {users.length > 0 && (
          <div className="tk-field">
            <label className="tk-label">Assign To (optional)</label>
            <select className="tk-input tk-select" value={form.assign_id} onChange={e => set('assign_id', e.target.value)}>
              <option value="">— Unassigned —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="tk-btn" onClick={save} disabled={busy}
            style={{ flex: 1, background: T.gradients.brand, color: '#fff', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Creating…' : 'Create Task'}
          </button>
          <button className="tk-btn" onClick={onClose}
            style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Task Card ──────────────────────────────────────── */
function TaskCard({ task, onClick }) {
  const sc = S[task.status]   || S.todo
  const pc = P[task.priority] || P.medium

  return (
    <div className="tk-card" onClick={() => onClick(task)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
        <p style={{ fontFamily: T.fonts.body, fontSize: 13, fontWeight: 600, color: T.colors.text.primary, lineHeight: 1.4, margin: 0, flex: 1 }}>
          {task.title}
        </p>
        <span className="tk-badge" style={{ background: pc.bg, color: pc.color, flexShrink: 0 }}>{pc.label}</span>
      </div>
      {task.description && (
        <p style={{ fontSize: 11, color: T.colors.text.muted, marginBottom: 10, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {task.description}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {task.team && (
            <span className="tk-badge" style={{ background: T.colors.bg.card, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
              👥 {task.team.name}
            </span>
          )}
        </div>
        {task.assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Avatar name={task.assignee.name} size={20} />
            <span style={{ fontSize: 11, color: T.colors.text.muted }}>{task.assignee.name}</span>
          </div>
        )}
        {!task.assignee && (
          <span style={{ fontSize: 11, color: T.colors.text.muted }}>Unassigned</span>
        )}
      </div>
    </div>
  )
}

/* ─── Main Tasks Page ────────────────────────────────── */
export default function TasksPage() {
  const user    = useSelector(selUser)
  const role    = (user?.role || '').toLowerCase()
  const canEdit = role === 'admin' || role === 'manager'

  const [tasks,     setTasks]     = useState([])
  const [teams,     setTeams]     = useState([])
  const [users,     setUsers]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [creating,  setCreating]  = useState(false)
  const [selected,  setSelected]  = useState(null)
  const [filter,    setFilter]    = useState({ status: '', priority: '', search: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.all([
        api.get('/tasks').catch(() => ({ data: [] })),
        getAllTeams().catch(() => ({ data: [] })),
        canEdit? getAllUsers().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ])
      setTasks(Array.isArray(results[0].data) ? results[0].data : [])
      setTeams(results[1].data || [])
      setUsers(results[2].data || [])
    } catch (err) {
      console.error('TasksPage load error:', err)
    } finally { setLoading(false) }
  }, [canEdit])

  useEffect(() => { load() }, [load])

  const handleCreated = (t) => setTasks(prev => [t, ...prev])
  const handleUpdated = (t) => setTasks(prev => prev.map(p => p.id === t.id ? t : p))
  const handleDeleted = (id) => setTasks(prev => prev.filter(p => p.id !== id))

  const filtered = tasks.filter(t => {
    if (filter.status   && t.status   !== filter.status)                                  return false
    if (filter.priority && t.priority !== filter.priority)                                return false
    if (filter.search   && !t.title?.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  const cols = {
    todo    : filtered.filter(t => t.status === 'todo'),
    doing   : filtered.filter(t => t.status === 'doing'),
    complete: filtered.filter(t => t.status === 'complete'),
  }

  return (
    <>
      <style>{CSS}</style>

      {selected && (
        <TaskDetailModal task={selected} teams={teams} users={users} canEdit={canEdit}
          onClose={() => setSelected(null)}
          onUpdated={(t) => { handleUpdated(t); setSelected(null) }}
          onDeleted={handleDeleted} />
      )}
      {creating && (
        <CreateTaskModal teams={teams} users={users}
          onClose={() => setCreating(false)}
          onCreated={handleCreated} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fonts.body }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>Tasks</h1>
            <p style={{ fontSize: 14, color: T.colors.text.secondary }}>
              {loading ? 'Loading…' : `${filtered.length} task${filtered.length !== 1 ? 's' : ''} · click any card for full details`}
            </p>
          </div>
          {canEdit && (
            <button className="tk-btn" onClick={() => setCreating(true)}
              style={{ background: T.gradients.brand, color: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.boxShadow = T.shadows.glow }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.boxShadow = 'none' }}>
              ＋ New Task
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="tk-filters">
          <input className="tk-input" style={{ maxWidth: 240 }} placeholder="🔍 Search tasks…"
            value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
          <select className="tk-input tk-select" style={{ maxWidth: 150 }} value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="doing">In Progress</option>
            <option value="complete">Done</option>
          </select>
          <select className="tk-input tk-select" style={{ maxWidth: 150 }} value={filter.priority}
            onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {(filter.status || filter.priority || filter.search) && (
            <button className="tk-btn" onClick={() => setFilter({ status: '', priority: '', search: '' })}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}`, padding: '9px 12px' }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Kanban */}
        {loading ? (
          <div className="tk-kanban" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[1,2,3].map(i => <div key={i} className="tk-skel" style={{ height: 320 }} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.lg, textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: 44, marginBottom: 10 }}>📋</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: T.colors.text.secondary, marginBottom: 6 }}>No tasks yet</p>
            <p style={{ fontSize: 13, color: T.colors.text.muted }}>
              {canEdit ? 'Create your first task to get started.' : 'No tasks assigned to you yet.'}
            </p>
            {canEdit && (
              <button className="tk-btn" onClick={() => setCreating(true)} style={{ marginTop: 16, background: T.gradients.brand, color: '#fff' }}>
                ＋ Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="tk-kanban" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {Object.entries(cols).map(([status, items]) => {
              const cfg = S[status]
              return (
                <div key={status} className="tk-col">
                  <div className="tk-col-hdr" style={{ color: cfg.color, borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: cfg.color }}>
                    <span>{cfg.label}</span>
                    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: T.radius.full, padding: '2px 8px', fontSize: 10 }}>{items.length}</span>
                  </div>
                  <div className="tk-col-body">
                    {items.length === 0
                      ? <p style={{ textAlign: 'center', color: T.colors.text.muted, fontSize: 12, padding: '20px 0' }}>Empty</p>
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