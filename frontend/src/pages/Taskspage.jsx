import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { selUser } from '../redux/slices/authSlice'
import { api } from '../redux/slices/authSlice'
import { getAllTeams, getAllEmployees } from '../utils/api'
import toast from 'react-hot-toast'

const CSS = `
  .tk-col { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; overflow: hidden; display: flex; flex-direction: column; }
  .tk-col-hdr { padding: 12px 16px; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid ${T.colors.bg.border}; display: flex; align-items: center; justify-content: space-between; }
  .tk-col-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; flex: 1; min-height: 80px; }
  .tk-card { background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; padding: 14px; transition: all 0.2s ease; cursor: pointer; }
  .tk-card:hover { border-color: ${T.colors.primary.DEFAULT}60; box-shadow: 0 4px 16px rgba(0,0,0,0.4); transform: translateY(-1px); }
  .tk-badge { display: inline-flex; align-items: center; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 2px 8px; }
  .tk-input { width: 100%; padding: 10px 13px; background: ${T.colors.bg.elevated}; border: 1.5px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; outline: none; font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.primary}; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box; }
  .tk-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .tk-input::placeholder { color: ${T.colors.text.muted}; }
  .tk-select { appearance: none; cursor: pointer; }
  .tk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 18px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
  .tk-btn:active { transform: scale(0.97); }
  .tk-label { display: block; font-size: 11px; font-weight: 600; color: ${T.colors.text.muted}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.07em; }
  .tk-field { margin-bottom: 18px; }
  .tk-skel { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: tk-shimmer 1.5s infinite; border-radius: ${T.radius.md}; }
  .tk-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .tk-info-row { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid ${T.colors.bg.border}; }
  .tk-info-row:last-child { border-bottom: none; }
  .tk-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* Modal */
  .tk-overlay {
    position: fixed; inset: 0;
    background: rgba(4, 5, 15, 0.85);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    padding: clamp(12px, 4vw, 40px);
    animation: tk-fade 0.18s ease;
  }
  @keyframes tk-fade { from { opacity: 0 } to { opacity: 1 } }
  .tk-modal {
    background: ${T.colors.bg.card};
    border: 1px solid ${T.colors.bg.border};
    border-radius: 22px;
    width: 100%; max-width: 540px;
    max-height: calc(100dvh - clamp(24px, 8vw, 80px));
    display: flex; flex-direction: column;
    box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
    animation: tk-up 0.24s cubic-bezier(0.22, 1, 0.36, 1);
    overflow: hidden;
  }
  .tk-modal-lg { max-width: 620px; }
  @keyframes tk-up { from { opacity:0; transform:translateY(20px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
  .tk-mhd { padding: 22px 24px 18px; border-bottom: 1px solid ${T.colors.bg.border}; display: flex; align-items: flex-start; gap: 14px; flex-shrink: 0; }
  .tk-mbd { padding: 22px 24px; overflow-y: auto; flex: 1; scrollbar-width: thin; scrollbar-color: ${T.colors.bg.border} transparent; }
  .tk-mbd::-webkit-scrollbar { width: 4px; }
  .tk-mbd::-webkit-scrollbar-thumb { background: ${T.colors.bg.border}; border-radius: 4px; }
  .tk-mft { padding: 16px 24px 20px; border-top: 1px solid ${T.colors.bg.border}; flex-shrink: 0; }
  .tk-close { width: 34px; height: 34px; border-radius: 10px; margin-left: auto; display: flex; align-items: center; justify-content: center; background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; cursor: pointer; color: ${T.colors.text.muted}; font-size: 18px; line-height: 1; transition: all 0.15s; flex-shrink: 0; }
  .tk-close:hover { background: ${T.colors.bg.hover}; color: ${T.colors.text.primary}; }
  .tk-mico { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  @keyframes tk-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @media (max-width: 900px) { .tk-kanban { grid-template-columns: 1fr 1fr !important; } }
  @media (max-width: 600px) { .tk-kanban { grid-template-columns: 1fr !important; } .tk-2col { grid-template-columns: 1fr; } }
  @media (max-width: 540px) {
    .tk-overlay { padding: 0; align-items: flex-end; }
    .tk-modal { max-width: 100%; border-radius: 22px 22px 0 0; max-height: 93dvh; animation: tk-sheet 0.28s cubic-bezier(0.22,1,0.36,1); }
    @keyframes tk-sheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
  }
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

function TaskDetailModal({ task, teams, employees, canEdit, onClose, onUpdated, onDeleted }) {
  const [form,    setForm]    = useState({ title: task.title, description: task.description || '', priority: task.priority, status: task.status, team_id: task.team_id || '', assign_id: task.assign_id || '' })
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const sc = S[task.status] || S.todo
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
      onUpdated({ ...task, ...form, ...res.data }); setEditing(false)
    } catch (e) { toast.error(e.response?.data?.detail || 'Update failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${task.title}"?`)) return
    try {
      await api.delete(`/task/${task.id}`); toast.success('Task deleted!')
      onDeleted(task.id); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Delete failed') }
  }

  const cycleStatus = async () => {
    const order = ['todo', 'doing', 'complete']
    const next = order[(order.indexOf(task.status) + 1) % 3]
    try {
      await api.patch('/update-task', { task_id: task.id, status: next })
      toast.success(`Moved to ${S[next].label}`)
      onUpdated({ ...task, status: next }); onClose()
    } catch { toast.error('Status update failed') }
  }

  return (
    <div className="tk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tk-modal tk-modal-lg">
        <div className="tk-mhd">
          <div className="tk-mico" style={{ background: sc.bg, border: `1.5px solid ${sc.color}30` }}>
            <span style={{ fontSize: 18 }}>{task.status === 'complete' ? '✅' : task.status === 'doing' ? '⚡' : '🔲'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              <span className="tk-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
              <span className="tk-badge" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
            </div>
            {editing
              ? <input className="tk-input" value={form.title} onChange={e => set('title', e.target.value)} style={{ fontSize: 15, fontWeight: 700, padding: '8px 12px' }} autoFocus />
              : <h2 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 17, color: T.colors.text.primary, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.title}</h2>
            }
          </div>
          <button className="tk-close" onClick={onClose}>×</button>
        </div>

        <div className="tk-mbd">
          <div className="tk-field">
            <label className="tk-label">Description</label>
            {editing
              ? <textarea className="tk-input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
              : <p style={{ fontSize: 13, color: task.description ? T.colors.text.secondary : T.colors.text.muted, lineHeight: 1.7, margin: 0, padding: '12px 14px', background: T.colors.bg.elevated, borderRadius: T.radius.md, border: `1px solid ${T.colors.bg.border}` }}>
                  {task.description || 'No description provided'}
                </p>
            }
          </div>

          <div style={{ background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.md, padding: '4px 16px' }}>
            <div className="tk-info-row">
              <span style={{ fontSize: 11, color: T.colors.text.muted, width: 90, flexShrink: 0, fontFamily: T.fonts.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team</span>
              {editing
                ? <select className="tk-input tk-select" style={{ flex: 1 }} value={form.team_id} onChange={e => set('team_id', e.target.value)}>
                    <option value="">— No team —</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                : <span style={{ fontSize: 13, color: task.team?.name ? T.colors.text.primary : T.colors.text.muted, fontWeight: 500 }}>{task.team?.name || 'Unassigned'}</span>
              }
            </div>
            <div className="tk-info-row">
              <span style={{ fontSize: 11, color: T.colors.text.muted, width: 90, flexShrink: 0, fontFamily: T.fonts.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned</span>
              {editing
                ? <select className="tk-input tk-select" style={{ flex: 1 }} value={form.assign_id} onChange={e => set('assign_id', e.target.value)}>
                    <option value="">— Unassigned —</option>
                    {employees.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                  </select>
                : task.assignee
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={task.assignee.name} size={22} />
                      <span style={{ fontSize: 13, color: T.colors.text.primary, fontWeight: 500 }}>{task.assignee.name}</span>
                      <span style={{ fontSize: 11, color: T.colors.text.muted }}>{task.assignee.email}</span>
                    </div>
                  : <span style={{ fontSize: 13, color: T.colors.text.muted }}>Unassigned</span>
              }
            </div>
            <div className="tk-info-row">
              <span style={{ fontSize: 11, color: T.colors.text.muted, width: 90, flexShrink: 0, fontFamily: T.fonts.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Creator</span>
              {task.creator
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={task.creator.name} size={22} />
                    <span style={{ fontSize: 13, color: T.colors.text.primary, fontWeight: 500 }}>{task.creator.name}</span>
                  </div>
                : <span style={{ fontSize: 13, color: T.colors.text.muted }}>—</span>
              }
            </div>
            {editing && (<>
              <div className="tk-info-row">
                <span style={{ fontSize: 11, color: T.colors.text.muted, width: 90, flexShrink: 0, fontFamily: T.fonts.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</span>
                <select className="tk-input tk-select" style={{ flex: 1 }} value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div className="tk-info-row">
                <span style={{ fontSize: 11, color: T.colors.text.muted, width: 90, flexShrink: 0, fontFamily: T.fonts.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                <select className="tk-input tk-select" style={{ flex: 1 }} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="todo">To Do</option><option value="doing">In Progress</option><option value="complete">Done</option>
                </select>
              </div>
            </>)}
          </div>
        </div>

        <div className="tk-mft">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canEdit && !editing && (
              <button className="tk-btn" onClick={() => setEditing(true)} style={{ background: T.gradients.brand, color: '#fff', flex: 1, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>✏️ Edit Task</button>
            )}
            {editing && (
              <button className="tk-btn" onClick={save} disabled={saving} style={{ background: T.gradients.brand, color: '#fff', flex: 1, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : '✓ Save Changes'}</button>
            )}
            {editing && (
              <button className="tk-btn" onClick={() => { setEditing(false); setForm({ title: task.title, description: task.description || '', priority: task.priority, status: task.status, team_id: task.team_id || '', assign_id: task.assign_id || '' }) }}
                style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>Cancel</button>
            )}
            {!editing && (
              <button className="tk-btn" onClick={cycleStatus} style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}`, flex: 1 }}>↻ Next Status</button>
            )}
            {canEdit && !editing && (
              <button className="tk-btn" onClick={handleDelete} style={{ background: T.colors.danger.bg, color: T.colors.danger.text, border: `1px solid ${T.colors.danger.border}` }}>🗑</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateTaskModal({ teams, employees, onClose, onCreated }) {
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
      onCreated(res.data); toast.success('Task created! 🎉'); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to create task') }
    finally { setBusy(false) }
  }

  return (
    <div className="tk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tk-modal">
        <div className="tk-mhd">
          <div className="tk-mico" style={{ background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)' }}>
            <span style={{ fontSize: 20, fontFamily: T.fonts.display, fontWeight: 700, color: T.colors.primary.DEFAULT }}>＋</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 16, color: T.colors.text.primary, margin: 0 }}>Create New Task</h2>
            <p style={{ fontSize: 11, color: T.colors.text.muted, margin: '2px 0 0' }}>Add a task to your board</p>
          </div>
          <button className="tk-close" onClick={onClose}>×</button>
        </div>

        <div className="tk-mbd">
          <div className="tk-field">
            <label className="tk-label">Title *</label>
            <input className="tk-input" placeholder="What needs to be done?" value={form.title} onChange={e => set('title', e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
          </div>
          <div className="tk-field">
            <label className="tk-label">Description</label>
            <textarea className="tk-input" rows={3} placeholder="Add more details…" value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div className="tk-2col">
            <div className="tk-field">
              <label className="tk-label">Priority</label>
              <select className="tk-input tk-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">🟢 Low</option><option value="medium">🟡 Medium</option><option value="high">🔴 High</option>
              </select>
            </div>
            <div className="tk-field">
              <label className="tk-label">Status</label>
              <select className="tk-input tk-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="todo">To Do</option><option value="doing">In Progress</option><option value="complete">Done</option>
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
          {employees.length > 0 && (
            <div className="tk-field" style={{ marginBottom: 0 }}>
              <label className="tk-label">Assign To — Employees Only (optional)</label>
              <select className="tk-input tk-select" value={form.assign_id} onChange={e => set('assign_id', e.target.value)}>
                <option value="">— Unassigned —</option>
                {employees.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="tk-mft">
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="tk-btn" onClick={save} disabled={busy || !form.title.trim()}
              style={{ flex: 1, background: T.gradients.brand, color: '#fff', opacity: busy || !form.title.trim() ? 0.65 : 1, boxShadow: form.title.trim() ? '0 4px 14px rgba(99,102,241,0.3)' : 'none' }}>
              {busy ? 'Creating…' : '✓ Create Task'}
            </button>
            <button className="tk-btn" onClick={onClose}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task, onClick }) {
  const sc = S[task.status] || S.todo
  const pc = P[task.priority] || P.medium
  return (
    <div className="tk-card" onClick={() => onClick(task)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
        <p style={{ fontFamily: T.fonts.body, fontSize: 13, fontWeight: 600, color: T.colors.text.primary, lineHeight: 1.4, margin: 0, flex: 1 }}>{task.title}</p>
        <span className="tk-badge" style={{ background: pc.bg, color: pc.color, flexShrink: 0 }}>{pc.label}</span>
      </div>
      {task.description && (
        <p style={{ fontSize: 11, color: T.colors.text.muted, marginBottom: 10, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.description}</p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {task.team && <span className="tk-badge" style={{ background: T.colors.bg.card, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>👥 {task.team.name}</span>}
        </div>
        {task.assignee
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: '#fff' }}>
                {(task.assignee.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <span style={{ fontSize: 11, color: T.colors.text.muted }}>{task.assignee.name}</span>
            </div>
          : <span style={{ fontSize: 11, color: T.colors.text.muted }}>Unassigned</span>
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
  const [teams,     setTeams]     = useState([])
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [filter,    setFilter]    = useState({ status: '', priority: '', search: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.all([
        api.get('/tasks').catch(() => ({ data: [] })),
        getAllTeams().catch(() => ({ data: [] })),
        canEdit ? getAllEmployees().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ])
      setTasks(Array.isArray(results[0].data) ? results[0].data : [])
      setTeams(results[1].data || [])
      setEmployees(results[2].data || [])
    } catch (err) { console.error('TasksPage load error:', err) }
    finally { setLoading(false) }
  }, [canEdit])

  useEffect(() => { load() }, [load])

  const handleCreated = (t) => setTasks(prev => [t, ...prev])
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

  return (
    <>
      <style>{CSS}</style>
      {selected && (
        <TaskDetailModal task={selected} teams={teams} employees={employees} canEdit={canEdit}
          onClose={() => setSelected(null)}
          onUpdated={(t) => { handleUpdated(t); setSelected(null) }}
          onDeleted={handleDeleted} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fonts.body }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>Tasks</h1>
            <p style={{ fontSize: 14, color: T.colors.text.secondary }}>{loading ? 'Loading…' : `${filtered.length} task${filtered.length !== 1 ? 's' : ''} · click any card for details`}</p>
          </div>
          {canEdit && (
            <button className="tk-btn" onClick={() => navigate('/tasks/new')}
              style={{ background: T.gradients.brand, color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              ＋ New Task
            </button>
          )}
        </div>

        <div className="tk-filters">
          <input className="tk-input" style={{ maxWidth: 240 }} placeholder="🔍 Search tasks…" value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
          <select className="tk-input tk-select" style={{ maxWidth: 150 }} value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option><option value="todo">To Do</option><option value="doing">In Progress</option><option value="complete">Done</option>
          </select>
          <select className="tk-input tk-select" style={{ maxWidth: 150 }} value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priority</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          {(filter.status || filter.priority || filter.search) && (
            <button className="tk-btn" onClick={() => setFilter({ status: '', priority: '', search: '' })} style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}`, padding: '9px 12px' }}>✕ Clear</button>
          )}
        </div>

        {loading ? (
          <div className="tk-kanban" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[1,2,3].map(i => <div key={i} className="tk-skel" style={{ height: 320 }} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.lg, textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: 44, marginBottom: 10 }}>📋</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: T.colors.text.secondary, marginBottom: 6 }}>No tasks yet</p>
            <p style={{ fontSize: 13, color: T.colors.text.muted }}>{canEdit ? 'Create your first task to get started.' : 'No tasks assigned to you yet.'}</p>
            {canEdit && <button className="tk-btn" onClick={() => navigate('/tasks/new')} style={{ marginTop: 16, background: T.gradients.brand, color: '#fff' }}>＋ Create First Task</button>}
          </div>
        ) : (
          <div className="tk-kanban" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {Object.entries(cols).map(([status, items]) => {
              const cfg = S[status]
              return (
                <div key={status} className="tk-col">
                  <div className="tk-col-hdr" style={{ color: cfg.color, borderLeft: `3px solid ${cfg.color}` }}>
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