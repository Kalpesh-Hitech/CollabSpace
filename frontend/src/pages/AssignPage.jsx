import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { selUser } from '../redux/slices/authSlice'
import { api } from '../redux/slices/authSlice'
import { getAllEmployees, getAllTeams } from '../utils/api'
import toast from 'react-hot-toast'

const CSS = `
  .as-card { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; overflow: hidden; }
  .as-badge { display: inline-flex; align-items: center; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 2px 8px; }
  .as-input { width: 100%; padding: 10px 13px; background: ${T.colors.bg.elevated}; border: 1.5px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; outline: none; font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.primary}; transition: all 0.15s ease; box-sizing: border-box; }
  .as-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .as-input::placeholder { color: ${T.colors.text.muted}; }
  .as-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
  .as-btn:active { transform: scale(0.97); }
  .as-tab { padding: 8px 18px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  .as-row { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid ${T.colors.bg.border}; transition: background 0.15s; }
  .as-row:last-child { border-bottom: none; }
  .as-row:hover { background: ${T.colors.bg.elevated}; }
  .as-skel { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: as-shimmer 1.5s infinite; border-radius: ${T.radius.md}; }
  .as-label { display: block; font-size: 11px; font-weight: 600; color: ${T.colors.text.muted}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.07em; }
  .as-field { margin-bottom: 18px; }
  .as-section { background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; padding: 22px; }
  @keyframes as-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
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

function SectionHeader({ icon, title, desc }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
        <p style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 15, color: T.colors.text.primary, margin: 0 }}>{title}</p>
      </div>
      <p style={{ fontSize: 13, color: T.colors.text.muted, lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  )
}

function AssignTaskTab({ tasks, teams, employees, onRefresh }) {
  const [taskId, setTaskId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [userId, setUserId] = useState('')
  const [busy,   setBusy]   = useState(false)

  const unassigned    = tasks.filter(t => !t.team_id && !t.assign_id)
  const selectedTask  = tasks.find(t => t.id === taskId)

  const handleAssign = async () => {
    if (!taskId || !teamId || !userId) { toast.error('Select a task, team, and employee'); return }
    setBusy(true)
    try {
      await api.patch('/assign_task', { task_id: taskId, team_id: teamId, assign_id: userId })
      toast.success('Task assigned successfully! 🎉')
      setTaskId(''); setTeamId(''); setUserId('')
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Assignment failed')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="as-section">
        <SectionHeader icon="🎯" title="Assign Task to Team & Employee" desc="Select an unassigned task, choose a team, then pick the employee to assign it to." />

        <div className="as-field">
          <label className="as-label">1. Select Unassigned Task</label>
          <select className="as-input" style={{ appearance: 'none', cursor: 'pointer' }} value={taskId} onChange={e => setTaskId(e.target.value)}>
            <option value="">— Pick a task —</option>
            {unassigned.map(t => (
              <option key={t.id} value={t.id}>[{(P[t.priority] || P.medium).label}] {t.title}</option>
            ))}
          </select>
          {unassigned.length === 0 && (
            <p style={{ fontSize: 11, color: T.colors.text.muted, marginTop: 6 }}>All tasks are already assigned. Create new tasks first.</p>
          )}
        </div>

        {selectedTask && (
          <div style={{ background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.md, padding: '10px 14px', marginBottom: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: T.colors.text.primary, fontWeight: 600, flex: 1 }}>{selectedTask.title}</span>
            <span className="as-badge" style={{ background: (P[selectedTask.priority] || P.medium).bg, color: (P[selectedTask.priority] || P.medium).color }}>{(P[selectedTask.priority] || P.medium).label}</span>
          </div>
        )}

        <div className="as-field">
          <label className="as-label">2. Select Team</label>
          <select className="as-input" style={{ appearance: 'none', cursor: 'pointer' }} value={teamId} onChange={e => setTeamId(e.target.value)}>
            <option value="">— Pick a team —</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="as-field">
          <label className="as-label">3. Select Employee</label>
          <select className="as-input" style={{ appearance: 'none', cursor: 'pointer' }} value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">— Pick an employee —</option>
            {employees.map(u => <option key={u.id} value={u.id}>{u.name}  ·  {u.email}</option>)}
          </select>
          {employees.length === 0 && (
            <p style={{ fontSize: 11, color: T.colors.text.muted, marginTop: 6 }}>No employees found. Create employee accounts first.</p>
          )}
        </div>

        <button className="as-btn" onClick={handleAssign} disabled={busy || !taskId || !teamId || !userId}
          style={{ background: taskId && teamId && userId ? T.gradients.brand : T.colors.bg.elevated, color: taskId && teamId && userId ? '#fff' : T.colors.text.muted, width: '100%', opacity: busy ? 0.7 : 1, boxShadow: taskId && teamId && userId ? '0 4px 14px rgba(99,102,241,0.3)' : 'none' }}>
          {busy ? 'Assigning…' : '✓ Assign Task'}
        </button>
      </div>

      {/* All tasks overview */}
      <div className="as-card">
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.colors.bg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 14, color: T.colors.text.primary, margin: 0 }}>All Tasks Overview</p>
          <span style={{ fontFamily: T.fonts.mono, fontSize: 11, color: T.colors.text.muted }}>{tasks.length} total</span>
        </div>
        {tasks.length === 0
          ? <p style={{ textAlign: 'center', padding: '32px 0', color: T.colors.text.muted, fontSize: 13 }}>No tasks yet</p>
          : tasks.map(task => {
              const sc = S[task.status] || S.todo
              const pc = P[task.priority] || P.medium
              return (
                <div key={task.id} className="as-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.colors.text.primary, marginBottom: 3 }}>{task.title}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="as-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                      <span className="as-badge" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                      {task.team && <span className="as-badge" style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>👥 {task.team.name}</span>}
                    </div>
                  </div>
                  {task.assignee
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <Avatar name={task.assignee.name} size={24} />
                        <span style={{ fontSize: 12, color: T.colors.text.secondary }}>{task.assignee.name}</span>
                      </div>
                    : <span style={{ fontSize: 11, color: T.colors.danger.text, fontFamily: T.fonts.mono, flexShrink: 0 }}>Unassigned</span>
                  }
                </div>
              )
            })
        }
      </div>
    </div>
  )
}

function AssignTeamTab({ teams, employees, onRefresh }) {
  const [teamId, setTeamId] = useState('')
  const [userId, setUserId] = useState('')
  const [busy,   setBusy]   = useState(false)

  const handleAssign = async () => {
    if (!teamId || !userId) { toast.error('Select both a team and an employee'); return }
    setBusy(true)
    try {
      await api.post('/assignee_teams', { team_id: teamId, user_id: userId })
      toast.success('Employee added to team! 🎉')
      setTeamId(''); setUserId('')
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Assignment failed')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="as-section">
        <SectionHeader icon="👥" title="Assign Employee to Team" desc="Add an employee to a team so they can receive task assignments and see team tasks." />

        <div className="as-field">
          <label className="as-label">1. Select Team</label>
          <select className="as-input" style={{ appearance: 'none', cursor: 'pointer' }} value={teamId} onChange={e => setTeamId(e.target.value)}>
            <option value="">— Pick a team —</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="as-field">
          <label className="as-label">2. Select Employee</label>
          <select className="as-input" style={{ appearance: 'none', cursor: 'pointer' }} value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">— Pick an employee —</option>
            {employees.map(u => <option key={u.id} value={u.id}>{u.name}  ·  {u.email}</option>)}
          </select>
        </div>

        <button className="as-btn" onClick={handleAssign} disabled={busy || !teamId || !userId}
          style={{ background: teamId && userId ? T.gradients.brand : T.colors.bg.elevated, color: teamId && userId ? '#fff' : T.colors.text.muted, width: '100%', opacity: busy ? 0.7 : 1, boxShadow: teamId && userId ? '0 4px 14px rgba(99,102,241,0.3)' : 'none' }}>
          {busy ? 'Adding…' : '✓ Add to Team'}
        </button>
      </div>

      {/* Teams overview */}
      <div className="as-card">
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.colors.bg.border}` }}>
          <p style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 14, color: T.colors.text.primary, margin: 0 }}>Teams Overview</p>
        </div>
        {teams.length === 0
          ? <p style={{ textAlign: 'center', padding: '32px 0', color: T.colors.text.muted, fontSize: 13 }}>No teams yet</p>
          : teams.map((team, i) => {
              const dot = T.colors.projectDots?.[i % 8] || '#6366f1'
              return (
                <div key={team.id} className="as-row">
                  <div style={{ width: 32, height: 32, borderRadius: T.radius.sm, background: `${dot}20`, border: `1px solid ${dot}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 13, color: dot }}>{team.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.colors.text.primary, marginBottom: 2 }}>{team.name}</p>
                    <p style={{ fontSize: 11, color: T.colors.text.muted }}>ID: {team.id?.slice(0, 8)}…</p>
                  </div>
                  <button onClick={() => setTeamId(team.id)}
                    style={{ padding: '5px 12px', borderRadius: T.radius.sm, border: `1px solid ${teamId === team.id ? T.colors.primary.DEFAULT : T.colors.bg.border}`, background: teamId === team.id ? `${T.colors.primary.DEFAULT}20` : 'transparent', color: teamId === team.id ? T.colors.primary.DEFAULT : T.colors.text.muted, fontFamily: T.fonts.mono, fontSize: 11, cursor: 'pointer' }}>
                    {teamId === team.id ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}

function ReassignTab({ tasks, employees, onRefresh }) {
  const [taskId,  setTaskId]  = useState('')
  const [newUser, setNewUser] = useState('')
  const [busy,    setBusy]    = useState(false)

  const assigned     = tasks.filter(t => t.assign_id)
  const selectedTask = tasks.find(t => t.id === taskId)

  const handleReassign = async () => {
    if (!taskId || !newUser) { toast.error('Select a task and new assignee'); return }
    setBusy(true)
    try {
      await api.patch('/update-task', { task_id: taskId, assign_id: newUser })
      toast.success('Task reassigned!')
      setTaskId(''); setNewUser('')
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Reassignment failed')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="as-section">
        <SectionHeader icon="🔄" title="Reassign Task to Different Employee" desc="Change the employee assigned to an existing task." />

        <div className="as-field">
          <label className="as-label">1. Select Assigned Task</label>
          <select className="as-input" style={{ appearance: 'none', cursor: 'pointer' }} value={taskId} onChange={e => setTaskId(e.target.value)}>
            <option value="">— Pick a task —</option>
            {assigned.map(t => (
              <option key={t.id} value={t.id}>{t.title} → {t.assignee?.name || 'Someone'}</option>
            ))}
          </select>
          {assigned.length === 0 && <p style={{ fontSize: 11, color: T.colors.text.muted, marginTop: 6 }}>No assigned tasks to reassign.</p>}
        </div>

        {selectedTask && (
          <div style={{ background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.md, padding: '12px 14px', marginBottom: 18 }}>
            <p style={{ fontSize: 12, color: T.colors.text.muted, marginBottom: 6 }}>Current assignee:</p>
            {selectedTask.assignee
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={selectedTask.assignee.name} size={26} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.colors.text.primary, margin: 0 }}>{selectedTask.assignee.name}</p>
                    <p style={{ fontSize: 11, color: T.colors.text.muted, margin: 0 }}>{selectedTask.assignee.email}</p>
                  </div>
                </div>
              : <p style={{ fontSize: 13, color: T.colors.text.muted, margin: 0 }}>Unassigned</p>
            }
          </div>
        )}

        <div className="as-field">
          <label className="as-label">2. New Employee</label>
          <select className="as-input" style={{ appearance: 'none', cursor: 'pointer' }} value={newUser} onChange={e => setNewUser(e.target.value)}>
            <option value="">— Pick new employee —</option>
            {employees.filter(u => u.id !== selectedTask?.assign_id).map(u => (
              <option key={u.id} value={u.id}>{u.name}  ·  {u.email}</option>
            ))}
          </select>
        </div>

        <button className="as-btn" onClick={handleReassign} disabled={busy || !taskId || !newUser}
          style={{ background: taskId && newUser ? T.gradients.brand : T.colors.bg.elevated, color: taskId && newUser ? '#fff' : T.colors.text.muted, width: '100%', opacity: busy ? 0.7 : 1, boxShadow: taskId && newUser ? '0 4px 14px rgba(99,102,241,0.3)' : 'none' }}>
          {busy ? 'Reassigning…' : '✓ Reassign Task'}
        </button>
      </div>
    </div>
  )
}

export default function AssignPage() {
  const [tab,     setTab]     = useState('task')
  const [tasks,   setTasks]   = useState([])
  const [teams,   setTeams]   = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, tmRes, eRes] = await Promise.all([
        api.get('/tasks').catch(() => ({ data: [] })),
        getAllTeams().catch(() => ({ data: [] })),
        getAllEmployees().catch(() => ({ data: [] })),
      ])
      setTasks(Array.isArray(tRes.data) ? tRes.data : [])
      setTeams(tmRes.data || [])
      setEmployees(eRes.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const TABS = [
    { key: 'task',     label: '🎯 Assign Task',     desc: 'Assign unassigned task to team & employee' },
    { key: 'team',     label: '👥 Assign to Team',  desc: 'Add employee to a team' },
    { key: 'reassign', label: '🔄 Reassign Task',    desc: 'Change task assignee' },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fonts.body }}>
        <div>
          <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>Assign & Manage</h1>
          <p style={{ fontSize: 14, color: T.colors.text.secondary }}>Assign tasks to teams, add employees to teams, and reassign work</p>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 8, background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.lg, padding: 6 }}>
          {TABS.map(t => (
            <button key={t.key} className="as-tab" onClick={() => setTab(t.key)}
              style={{ flex: 1, background: tab === t.key ? T.gradients.brand : 'transparent', color: tab === t.key ? '#fff' : T.colors.text.secondary, boxShadow: tab === t.key ? '0 2px 8px rgba(99,102,241,0.25)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="as-skel" style={{ height: 80 }} />)}
          </div>
        ) : (
          <>
            {tab === 'task'     && <AssignTaskTab   tasks={tasks} teams={teams} employees={employees} onRefresh={load} />}
            {tab === 'team'     && <AssignTeamTab   teams={teams} employees={employees} onRefresh={load} />}
            {tab === 'reassign' && <ReassignTab     tasks={tasks} employees={employees} onRefresh={load} />}
          </>
        )}
      </div>
    </>
  )
}