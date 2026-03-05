import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { selUser } from '../redux/slices/authSlice'
import { api } from '../redux/slices/authSlice'
import { getAllTeams, getTeamById, createInvite, getAllUsers } from '../utils/api'
import toast from 'react-hot-toast'

const CSS = `
  .tm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .tm-card { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; overflow: hidden; cursor: pointer; transition: all 0.2s ease; }
  .tm-card:hover { border-color: ${T.colors.primary.DEFAULT}60; box-shadow: 0 4px 24px rgba(0,0,0,0.4); transform: translateY(-1px); }
  .tm-badge { font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 3px 9px; display: inline-flex; align-items: center; gap: 4px; }
  .tm-input { width: 100%; padding: 10px 14px; background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; outline: none; font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.primary}; transition: all 0.2s ease; box-sizing: border-box; }
  .tm-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .tm-input::placeholder { color: ${T.colors.text.muted}; }
  .tm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 18px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
  .tm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .tm-modal { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.xl}; padding: 28px; width: 100%; max-width: 520px; box-shadow: 0 24px 80px rgba(0,0,0,0.6); max-height: 88vh; overflow-y: auto; }
  .tm-label { display: block; font-size: 12px; font-weight: 500; color: ${T.colors.text.secondary}; margin-bottom: 5px; }
  .tm-field { margin-bottom: 14px; }
  .tm-member-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${T.colors.bg.border}; }
  .tm-member-row:last-child { border-bottom: none; }
  .tm-skel { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: ${T.radius.md}; }
  @media (max-width: 768px) { .tm-grid { grid-template-columns: 1fr; } }
`

/* ─── Team Detail Modal ──────────────────────────────── */
function TeamDetailModal({ team, role, onClose, onRefresh }) {
  const [detail,  setDetail]  = useState(null)
  const [loading, setLoad]    = useState(true)
  const [invite,  setInvite]  = useState('')
  const [inviting,setInviting]= useState(false)
  const [editName,setEditName]= useState(team.name || '')
  const [editing, setEditing] = useState(false)

  const canEdit = role === 'admin' || role === 'manager'

  useEffect(() => {
    getTeamById(team.id)
      .then(r => { setDetail(r.data); setEditName(r.data.team_name) })
      .catch(() => toast.error('Could not load team details'))
      .finally(() => setLoad(false))
  }, [team.id])

  const saveName = async () => {
    if (!editName.trim()) return
    try {
      await api.patch('/update_team', { team_id: team.id, name: editName.trim() })
      toast.success('Team name updated!')
      setEditing(false)
      onRefresh()
      const r = await getTeamById(team.id)
      setDetail(r.data)
    } catch (e) { toast.error(e.response?.data?.detail || 'Update failed') }
  }

  const sendInvite = async () => {
    if (!invite.trim()) return
    setInviting(true)
    try {
      await createInvite({ team_id: team.id, user_email: invite.trim() })
      toast.success('Invite sent! 📧')
      setInvite('')
    } catch (e) { toast.error(e.response?.data?.detail || 'Invite failed') }
    finally { setInviting(false) }
  }

  const deleteTeam = async () => {
    if (!confirm(`Delete "${team.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/teams/${team.id}`)
      toast.success('Team deleted')
      onRefresh()
      onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Delete failed') }
  }

  return (
    <div className="tm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tm-modal">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:T.fonts.display, fontWeight:700, fontSize:18, color:T.colors.text.primary, margin:0 }}>Team Details</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.colors.text.muted, fontSize:22 }}>×</button>
        </div>

        {loading ? (
          [1,2,3].map(i => <div key={i} className="tm-skel" style={{ height:48, marginBottom:12 }} />)
        ) : !detail ? (
          <p style={{ color:T.colors.text.muted }}>Failed to load team details</p>
        ) : (<>
          {/* Edit name */}
          {canEdit && (
            <div className="tm-field">
              <label className="tm-label">Team Name</label>
              <div style={{ display:'flex', gap:8 }}>
                <input className="tm-input" value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onFocus={() => setEditing(true)} />
                {editing && (<>
                  <button className="tm-btn" onClick={saveName} style={{ background:T.gradients.brand, color:'#fff' }}>Save</button>
                  <button className="tm-btn" onClick={() => { setEditing(false); setEditName(detail.team_name) }}
                    style={{ background:T.colors.bg.elevated, color:T.colors.text.secondary, border:`1px solid ${T.colors.bg.border}` }}>✕</button>
                </>)}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            {[
              { label:'Members', value: detail.member_count },
              { label:'Tasks',   value: detail.task_count },
              { label:'Manager', value: detail.manager?.name },
            ].map(s => (
              <div key={s.label} style={{ background:T.colors.bg.elevated, borderRadius:T.radius.md, padding:12, textAlign:'center' }}>
                <p style={{ fontFamily:T.fonts.display, fontWeight:700, fontSize:17, color:T.colors.text.primary, marginBottom:2 }}>{s.value ?? '—'}</p>
                <p style={{ fontFamily:T.fonts.mono, fontSize:10, color:T.colors.text.muted }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Members list */}
          <div style={{ marginBottom:20 }}>
            <p style={{ fontFamily:T.fonts.display, fontWeight:600, fontSize:14, color:T.colors.text.primary, marginBottom:10 }}>Members</p>
            {!detail.members?.length
              ? <p style={{ fontSize:13, color:T.colors.text.muted }}>No members yet</p>
              : detail.members.map(m => (
                <div key={m.id} className="tm-member-row">
                  <div style={{ width:32, height:32, borderRadius:'50%', background:T.gradients.brand, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fonts.display, fontWeight:700, fontSize:11, color:'#fff', flexShrink:0 }}>
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:T.fonts.body, fontSize:13, fontWeight:600, color:T.colors.text.primary }}>{m.name}</p>
                    <p style={{ fontFamily:T.fonts.mono, fontSize:10, color:T.colors.text.muted }}>{m.email}</p>
                  </div>
                  <span className="tm-badge" style={{ background:T.colors.info.bg, color:T.colors.info.text }}>{m.task_count} tasks</span>
                </div>
              ))
            }
          </div>

          {/* Invite */}
          {canEdit && (
            <div style={{ marginBottom:20 }}>
              <p style={{ fontFamily:T.fonts.display, fontWeight:600, fontSize:14, color:T.colors.text.primary, marginBottom:10 }}>Invite Member by Email</p>
              <div style={{ display:'flex', gap:8 }}>
                <input className="tm-input" type="email" placeholder="member@company.com"
                  value={invite} onChange={e => setInvite(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendInvite()} />
                <button className="tm-btn" onClick={sendInvite} disabled={inviting}
                  style={{ background:T.gradients.brand, color:'#fff', opacity:inviting?0.7:1 }}>
                  {inviting ? '…' : 'Invite'}
                </button>
              </div>
              <p style={{ fontSize:11, color:T.colors.text.muted, marginTop:6 }}>An invite link will be sent to their email address.</p>
            </div>
          )}

          {/* Delete */}
          {canEdit && (
            <div style={{ borderTop:`1px solid ${T.colors.bg.border}`, paddingTop:16 }}>
              <button className="tm-btn" onClick={deleteTeam}
                style={{ background:T.colors.danger.bg, color:T.colors.danger.text, border:`1px solid ${T.colors.danger.border}`, width:'100%' }}>
                🗑 Delete Team
              </button>
            </div>
          )}
        </>)}
      </div>
    </div>
  )
}

/* ─── Create Team Modal ──────────────────────────────── */
function CreateTeamModal({ role, managers, onClose, onSaved }) {
  const [name,      setName]      = useState('')
  const [managerId, setManagerId] = useState('')
  const [saving,    setSaving]    = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Team name is required'); return }
    setSaving(true)
    try {
      // POST /create_team
      // If admin selected a manager, send create_by_id so backend assigns that manager
      const body = { name: name.trim() }
      if (role === 'admin' && managerId) {
        body.create_by_id = managerId   // ← sends manager UUID to backend
      }
      await api.post('/create_team', body)
      toast.success('Team created! 🎉')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create team')
    } finally { setSaving(false) }
  }

  return (
    <div className="tm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tm-modal">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:T.fonts.display, fontWeight:700, fontSize:18, color:T.colors.text.primary, margin:0 }}>Create New Team</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.colors.text.muted, fontSize:22 }}>×</button>
        </div>

        <div className="tm-field">
          <label className="tm-label">Team Name *</label>
          <input className="tm-input" placeholder="e.g. Frontend Team, Design Squad…"
            value={name} onChange={e => setName(e.target.value)} autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()} />
        </div>

        {/* Only admin can assign a manager; managers create teams for themselves */}
        {role === 'admin' && managers.length > 0 && (
          <div className="tm-field">
            <label className="tm-label">Assign Manager</label>
            <select className="tm-input" style={{ appearance:'none', cursor:'pointer' }}
              value={managerId} onChange={e => setManagerId(e.target.value)}>
              <option value="">— Assign to yourself —</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}  ·  {m.email}
                </option>
              ))}
            </select>
            <p style={{ fontSize:11, color:T.colors.text.muted, marginTop:5 }}>
              {managerId
                ? `Team will be managed by the selected manager.`
                : 'Leaving blank assigns you as the manager.'}
            </p>
          </div>
        )}

        <div style={{ display:'flex', gap:10 }}>
          <button className="tm-btn" onClick={handleCreate} disabled={saving}
            style={{ flex:1, background:T.gradients.brand, color:'#fff', opacity:saving?0.7:1 }}>
            {saving ? 'Creating…' : 'Create Team'}
          </button>
          <button className="tm-btn" onClick={onClose}
            style={{ background:T.colors.bg.elevated, color:T.colors.text.secondary, border:`1px solid ${T.colors.bg.border}` }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Teams Page ─────────────────────────────────────── */
export default function TeamsPage() {
  const user     = useSelector(selUser)
  const role     = (user?.role || '').toLowerCase()
  const canEdit  = role === 'admin' || role === 'manager'

  const [teams,    setTeams]    = useState([])
  const [managers, setManagers] = useState([])   // all users with role=manager
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)  // team to view detail
  const [creating, setCreating] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      // GET /all_teams — backend returns different list based on role
      const [teamsRes] = await Promise.all([getAllTeams()])
      setTeams(teamsRes.data || [])

      // Get managers list for the create-team dropdown (admin only needs this)
      if (role === 'admin') {
        const usersRes = await getAllUsers().catch(() => ({ data:[] }))
        setManagers((usersRes.data || []).filter(u => u.role?.toLowerCase() === 'manager'))
      }
    } catch (e) {
      toast.error('Failed to load teams')
      console.error(e)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [role])

  const DOTS = T.colors.projectDots || ['#6366f1','#2dd4bf','#fb923c','#a855f7','#34d399','#f87171']

  return (
    <>
      <style>{CSS}</style>

      {selected && (
        <TeamDetailModal team={selected} role={role}
          onClose={() => setSelected(null)} onRefresh={fetchAll} />
      )}
      {creating && (
        <CreateTeamModal role={role} managers={managers}
          onClose={() => setCreating(false)} onSaved={fetchAll} />
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:20, fontFamily:T.fonts.body }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:T.fonts.display, fontWeight:800, fontSize:24, color:T.colors.text.primary, letterSpacing:'-0.02em', marginBottom:4 }}>
              Teams
            </h1>
            <p style={{ fontSize:14, color:T.colors.text.secondary }}>
              {loading ? 'Loading…' : `${teams.length} team${teams.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {canEdit && (
            <button className="tm-btn" onClick={() => setCreating(true)}
              style={{ background:T.gradients.brand, color:'#fff' }}
              onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.boxShadow=T.shadows.glow }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1';    e.currentTarget.style.boxShadow='none' }}>
              ＋ New Team
            </button>
          )}
        </div>

        {/* Teams grid */}
        {loading ? (
          <div className="tm-grid">
            {[1,2,3,4].map(i => <div key={i} className="tm-skel" style={{ height:140 }} />)}
          </div>
        ) : teams.length === 0 ? (
          <div style={{ background:T.colors.bg.card, border:`1px solid ${T.colors.bg.border}`, borderRadius:T.radius.lg, textAlign:'center', padding:'60px 24px' }}>
            <p style={{ fontSize:40, marginBottom:10 }}>👥</p>
            <p style={{ fontSize:16, fontWeight:600, color:T.colors.text.secondary, marginBottom:6 }}>No teams yet</p>
            <p style={{ fontSize:13, color:T.colors.text.muted }}>
              {role === 'employee'
                ? 'You haven\'t been added to any team yet. Ask your manager to invite you.'
                : 'Create your first team to start collaborating.'}
            </p>
            {canEdit && (
              <button className="tm-btn" onClick={() => setCreating(true)}
                style={{ marginTop:16, background:T.gradients.brand, color:'#fff' }}>
                ＋ Create Team
              </button>
            )}
          </div>
        ) : (
          <div className="tm-grid">
            {teams.map((team, i) => {
              const dot = DOTS[i % DOTS.length]
              return (
                <div key={team.id} className="tm-card" onClick={() => setSelected(team)}>
                  {/* Accent stripe */}
                  <div style={{ height:4, background:`linear-gradient(90deg, ${dot}, transparent)` }} />
                  <div style={{ padding:'16px 18px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <div style={{ width:38, height:38, borderRadius:T.radius.md, background:`${dot}20`, border:`1px solid ${dot}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontFamily:T.fonts.display, fontWeight:700, fontSize:15, color:dot }}>
                          {team.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontFamily:T.fonts.display, fontWeight:700, fontSize:15, color:T.colors.text.primary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{team.name}</p>
                        <span className="tm-badge" style={{ background: team.is_deleted ? T.colors.danger.bg : T.colors.success.bg, color: team.is_deleted ? T.colors.danger.text : T.colors.success.text, fontSize:9 }}>
                          {team.is_deleted ? 'Deleted' : '● Active'}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize:12, color:T.colors.text.muted, marginBottom:12 }}>
                      Click to view members, invite people, and manage this team.
                    </p>
                    <div style={{ display:'flex', gap:6 }}>
                      <span className="tm-badge" style={{ background:T.colors.bg.elevated, color:T.colors.text.secondary, border:`1px solid ${T.colors.bg.border}` }}>👥 Members</span>
                      {canEdit && <span className="tm-badge" style={{ background:T.colors.bg.elevated, color:T.colors.text.secondary, border:`1px solid ${T.colors.bg.border}` }}>✉️ Invite</span>}
                      {canEdit && <span className="tm-badge" style={{ background:T.colors.bg.elevated, color:T.colors.text.secondary, border:`1px solid ${T.colors.bg.border}` }}>⚙️ Manage</span>}
                    </div>
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