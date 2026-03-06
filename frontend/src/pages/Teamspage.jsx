import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { selUser } from '../redux/slices/authSlice'
import { api } from '../redux/slices/authSlice'
import { getAllTeams, getTeamById, createInvite, getAllUsers } from '../utils/api'
import toast from 'react-hot-toast'

const CSS = `
  .tm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .tm-card { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; overflow: hidden; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
  .tm-card:hover { border-color: ${T.colors.primary.DEFAULT}55; box-shadow: 0 8px 32px rgba(0,0,0,0.45); transform: translateY(-2px); }
  .tm-badge { font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 3px 9px; display: inline-flex; align-items: center; gap: 4px; }
  .tm-input { width: 100%; padding: 10px 13px; background: ${T.colors.bg.elevated}; border: 1.5px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; outline: none; font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.primary}; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box; }
  .tm-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .tm-input::placeholder { color: ${T.colors.text.muted}; }
  .tm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 18px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
  .tm-btn:active { transform: scale(0.97); }
  .tm-label { display: block; font-size: 11px; font-weight: 600; color: ${T.colors.text.muted}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.07em; }
  .tm-field { margin-bottom: 18px; }
  .tm-member-row { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: ${T.radius.md}; transition: background 0.12s; }
  .tm-member-row:hover { background: ${T.colors.bg.hover}; }
  .tm-stat { background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; padding: 14px 8px; text-align: center; }
  .tm-skel { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: tm-shimmer 1.5s infinite; border-radius: ${T.radius.md}; }

  /* ── Modal ── */
  .tm-overlay {
    position: fixed; inset: 0;
    background: rgba(4, 5, 15, 0.85);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    padding: clamp(12px, 4vw, 40px);
    animation: tm-fade 0.18s ease;
  }
  @keyframes tm-fade { from { opacity: 0 } to { opacity: 1 } }
  .tm-modal {
    background: ${T.colors.bg.card};
    border: 1px solid ${T.colors.bg.border};
    border-radius: 22px;
    width: 100%; max-width: 540px;
    max-height: calc(100dvh - clamp(24px, 8vw, 80px));
    display: flex; flex-direction: column;
    box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
    animation: tm-up 0.24s cubic-bezier(0.22, 1, 0.36, 1);
    overflow: hidden;
  }
  @keyframes tm-up { from { opacity:0; transform:translateY(20px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
  .tm-mhd { padding: 22px 24px 18px; border-bottom: 1px solid ${T.colors.bg.border}; display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
  .tm-mbd { padding: 22px 24px; overflow-y: auto; flex: 1; scrollbar-width: thin; scrollbar-color: ${T.colors.bg.border} transparent; }
  .tm-mbd::-webkit-scrollbar { width: 4px; }
  .tm-mbd::-webkit-scrollbar-thumb { background: ${T.colors.bg.border}; border-radius: 4px; }
  .tm-mft { padding: 16px 24px 20px; border-top: 1px solid ${T.colors.bg.border}; flex-shrink: 0; }
  .tm-mico { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .tm-close { width: 34px; height: 34px; border-radius: 10px; margin-left: auto; display: flex; align-items: center; justify-content: center; background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; cursor: pointer; color: ${T.colors.text.muted}; font-size: 18px; line-height: 1; transition: all 0.15s; flex-shrink: 0; }
  .tm-close:hover { background: ${T.colors.bg.hover}; color: ${T.colors.text.primary}; }

  @keyframes tm-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @media (max-width: 768px) { .tm-grid { grid-template-columns: 1fr; } }
  @media (max-width: 540px) {
    .tm-overlay { padding: 0; align-items: flex-end; }
    .tm-modal { max-width: 100%; border-radius: 22px 22px 0 0; max-height: 93dvh; animation: tm-sheet 0.28s cubic-bezier(0.22,1,0.36,1); }
    @keyframes tm-sheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
  }
`

function Avatar({ name, size = 34 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: T.gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display, fontWeight: 700, fontSize: size * 0.33, color: '#fff', flexShrink: 0, boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
      {initials}
    </div>
  )
}

function TeamDetailModal({ team, role, onClose, onRefresh }) {
  const [detail,   setDetail]   = useState(null)
  const [loading,  setLoad]     = useState(true)
  const [invite,   setInvite]   = useState('')
  const [inviting, setInviting] = useState(false)
  const [editName, setEditName] = useState(team.name || '')
  const [editing,  setEditing]  = useState(false)
  const canEdit = role === 'admin' || role === 'manager'

  useEffect(() => {
    getTeamById(team.id)
      .then(r => { setDetail(r.data); setEditName(r.data.team_name || r.data.name || team.name) })
      .catch(() => toast.error('Could not load team details'))
      .finally(() => setLoad(false))
  }, [team.id])

  const saveName = async () => {
    if (!editName.trim()) return
    try {
      await api.patch('/update_team', { team_id: team.id, name: editName.trim() })
      toast.success('Team name updated!')
      setEditing(false); onRefresh()
      const r = await getTeamById(team.id); setDetail(r.data)
    } catch (e) { toast.error(e.response?.data?.detail || 'Update failed') }
  }

  const sendInvite = async () => {
    if (!invite.trim()) return
    setInviting(true)
    try {
      await createInvite({ team_id: team.id, user_email: invite.trim() })
      toast.success('Invite sent! 📧'); setInvite('')
    } catch (e) { toast.error(e.response?.data?.detail || 'Invite failed') }
    finally { setInviting(false) }
  }

  const deleteTeam = async () => {
    if (!confirm(`Delete "${team.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/teams/${team.id}`)
      toast.success('Team deleted'); onRefresh(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Delete failed') }
  }

  const teamName = detail?.team_name || detail?.name || team.name || '?'
  const accent = T.colors.projectDots?.[0] || T.colors.primary.DEFAULT

  return (
    <div className="tm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tm-modal">
        <div className="tm-mhd">
          <div className="tm-mico" style={{ background: `${accent}1a`, border: `1.5px solid ${accent}44` }}>
            <span style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 18, color: accent }}>
              {teamName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 16, color: T.colors.text.primary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {teamName}
            </h2>
            <p style={{ fontFamily: T.fonts.mono, fontSize: 10, color: T.colors.text.muted, margin: '2px 0 0' }}>TEAM DETAILS</p>
          </div>
          <button className="tm-close" onClick={onClose}>×</button>
        </div>

        <div className="tm-mbd">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[72, 52, 110, 72].map((h, i) => <div key={i} className="tm-skel" style={{ height: h }} />)}
            </div>
          ) : !detail ? (
            <p style={{ color: T.colors.text.muted, textAlign: 'center', padding: '40px 0' }}>Failed to load details</p>
          ) : (<>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Members', value: detail.member_count ?? detail.members?.length ?? '—', icon: '👥' },
                { label: 'Tasks',   value: detail.task_count   ?? '—', icon: '📋' },
                { label: 'Manager', value: detail.manager?.name?.split(' ')[0] ?? '—', icon: '⭐' },
              ].map(s => (
                <div key={s.label} className="tm-stat">
                  <p style={{ fontSize: 16, margin: '0 0 4px' }}>{s.icon}</p>
                  <p style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 18, color: T.colors.text.primary, margin: '0 0 2px' }}>{s.value}</p>
                  <p style={{ fontFamily: T.fonts.mono, fontSize: 9, color: T.colors.text.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Edit name */}
            {canEdit && (
              <div className="tm-field">
                <label className="tm-label">Team Name</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="tm-input" value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onFocus={() => setEditing(true)}
                    onKeyDown={e => e.key === 'Enter' && saveName()} />
                  {editing && (<>
                    <button className="tm-btn" onClick={saveName} style={{ background: T.gradients.brand, color: '#fff', padding: '9px 14px' }}>Save</button>
                    <button className="tm-btn" onClick={() => { setEditing(false); setEditName(detail.team_name || detail.name) }}
                      style={{ background: T.colors.bg.elevated, color: T.colors.text.muted, border: `1px solid ${T.colors.bg.border}`, padding: '9px 12px' }}>✕</button>
                  </>)}
                </div>
              </div>
            )}

            {/* Members */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontFamily: T.fonts.mono, fontSize: 10, fontWeight: 600, color: T.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Members ({detail.members?.length || 0})
              </p>
              {!detail.members?.length ? (
                <div style={{ background: T.colors.bg.elevated, borderRadius: T.radius.md, padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: T.colors.text.muted, margin: 0 }}>No members yet — invite someone below</p>
                </div>
              ) : (
                <div style={{ background: T.colors.bg.elevated, borderRadius: T.radius.md, padding: '6px' }}>
                  {detail.members.map(m => (
                    <div key={m.id} className="tm-member-row">
                      <Avatar name={m.name} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: T.fonts.body, fontSize: 13, fontWeight: 600, color: T.colors.text.primary, margin: 0 }}>{m.name}</p>
                        <p style={{ fontFamily: T.fonts.mono, fontSize: 10, color: T.colors.text.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                      </div>
                      <span className="tm-badge" style={{ background: T.colors.info.bg, color: T.colors.info.text, flexShrink: 0 }}>{m.task_count ?? 0} tasks</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invite */}
            {canEdit && (
              <div className="tm-field" style={{ marginBottom: 0 }}>
                <label className="tm-label">Invite by Email</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="tm-input" type="email" placeholder="colleague@company.com"
                    value={invite} onChange={e => setInvite(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendInvite()} />
                  <button className="tm-btn" onClick={sendInvite} disabled={inviting}
                    style={{ background: T.gradients.brand, color: '#fff', opacity: inviting ? 0.65 : 1, minWidth: 74 }}>
                    {inviting ? '…' : 'Send'}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: T.colors.text.muted, marginTop: 6 }}>An invite link will be emailed to them.</p>
              </div>
            )}
          </>)}
        </div>

        {canEdit && !loading && detail && (
          <div className="tm-mft">
            <button className="tm-btn" onClick={deleteTeam}
              style={{ background: T.colors.danger.bg, color: T.colors.danger.text, border: `1px solid ${T.colors.danger.border}`, width: '100%', fontSize: 12 }}>
              🗑 Delete Team
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateTeamModal({ role, managers, onClose, onSaved }) {
  const [name,      setName]      = useState('')
  const [managerId, setManagerId] = useState('')
  const [saving,    setSaving]    = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Team name is required'); return }
    setSaving(true)
    try {
      const body = { name: name.trim() }
      if (role === 'admin' && managerId) body.create_by_id = managerId
      await api.post('/create_team', body)
      toast.success('Team created! 🎉'); onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to create team') }
    finally { setSaving(false) }
  }

  return (
    <div className="tm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tm-modal">
        <div className="tm-mhd">
          <div className="tm-mico" style={{ background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)' }}>
            <span style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 20, color: T.colors.primary.DEFAULT }}>＋</span>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 16, color: T.colors.text.primary, margin: 0 }}>Create New Team</h2>
            <p style={{ fontSize: 11, color: T.colors.text.muted, margin: '2px 0 0' }}>Set up a new workspace</p>
          </div>
          <button className="tm-close" onClick={onClose}>×</button>
        </div>

        <div className="tm-mbd">
          <div className="tm-field">
            <label className="tm-label">Team Name *</label>
            <input className="tm-input" placeholder="e.g. Frontend Team, Design Squad…"
              value={name} onChange={e => setName(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          {role === 'admin' && managers.length > 0 && (
            <div className="tm-field" style={{ marginBottom: 0 }}>
              <label className="tm-label">Assign Manager</label>
              <select className="tm-input" style={{ appearance: 'none', cursor: 'pointer' }}
                value={managerId} onChange={e => setManagerId(e.target.value)}>
                <option value="">— Assign to yourself —</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name}  ·  {m.email}</option>)}
              </select>
              <p style={{ fontSize: 11, color: T.colors.text.muted, marginTop: 6 }}>
                {managerId ? 'Team will be managed by selected manager.' : 'Leave blank to assign yourself.'}
              </p>
            </div>
          )}
        </div>

        <div className="tm-mft">
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="tm-btn" onClick={handleCreate} disabled={saving || !name.trim()}
              style={{ flex: 1, background: T.gradients.brand, color: '#fff', opacity: saving || !name.trim() ? 0.65 : 1, boxShadow: name.trim() ? '0 4px 14px rgba(99,102,241,0.35)' : 'none' }}>
              {saving ? 'Creating…' : '✓ Create Team'}
            </button>
            <button className="tm-btn" onClick={onClose}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TeamsPage() {
  const user     = useSelector(selUser)
  const role     = (user?.role || '').toLowerCase()
  const canEdit  = role === 'admin' || role === 'manager'
  const navigate = useNavigate()
  const [teams,    setTeams]    = useState([])
  const [managers, setManagers] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [teamsRes] = await Promise.all([getAllTeams()])
      setTeams(teamsRes.data || [])
      if (role === 'admin') {
        const usersRes = await getAllUsers().catch(() => ({ data: [] }))
        setManagers((usersRes.data || []).filter(u => u.role?.toLowerCase() === 'manager'))
      }
    } catch { toast.error('Failed to load teams') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [role])

  const DOTS = T.colors.projectDots || ['#6366f1','#2dd4bf','#fb923c','#a855f7','#34d399','#f87171']

  return (
    <>
      <style>{CSS}</style>
      {selected && <TeamDetailModal team={selected} role={role} onClose={() => setSelected(null)} onRefresh={fetchAll} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, fontFamily: T.fonts.body }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', margin: 0 }}>Teams</h1>
            <p style={{ fontSize: 13, color: T.colors.text.muted, marginTop: 3 }}>
              {loading ? 'Loading…' : `${teams.length} team${teams.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {canEdit && (
            <button className="tm-btn" onClick={() => navigate('/teams/new')}
              style={{ background: T.gradients.brand, color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              ＋ New Team
            </button>
          )}
        </div>

        {loading ? (
          <div className="tm-grid">{[1,2,3,4].map(i => <div key={i} className="tm-skel" style={{ height: 148 }} />)}</div>
        ) : teams.length === 0 ? (
          <div style={{ background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.lg, textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: 44, marginBottom: 12 }}>👥</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.colors.text.secondary, marginBottom: 8 }}>No teams yet</p>
            <p style={{ fontSize: 13, color: T.colors.text.muted, maxWidth: 320, margin: '0 auto 20px' }}>
              {role === 'employee' ? "You haven't been added to any team yet." : 'Create your first team to start collaborating.'}
            </p>
            {canEdit && <button className="tm-btn" onClick={() => navigate('/teams/new')} style={{ background: T.gradients.brand, color: '#fff' }}>＋ Create Team</button>}
          </div>
        ) : (
          <div className="tm-grid">
            {teams.map((team, i) => {
              const dot = DOTS[i % DOTS.length]
              return (
                <div key={team.id} className="tm-card" onClick={() => setSelected(team)}>
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${dot}, ${dot}33)` }} />
                  <div style={{ padding: '16px 18px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: T.radius.md, background: `${dot}18`, border: `1.5px solid ${dot}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 16, color: dot }}>{team.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 15, color: T.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{team.name}</p>
                        <span className="tm-badge" style={{ background: team.is_deleted ? T.colors.danger.bg : T.colors.success.bg, color: team.is_deleted ? T.colors.danger.text : T.colors.success.text, fontSize: 9, marginTop: 3 }}>
                          {team.is_deleted ? '○ Archived' : '● Active'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="tm-badge" style={{ background: T.colors.bg.elevated, color: T.colors.text.muted, border: `1px solid ${T.colors.bg.border}` }}>👥 Members</span>
                      {canEdit && <span className="tm-badge" style={{ background: T.colors.bg.elevated, color: T.colors.text.muted, border: `1px solid ${T.colors.bg.border}` }}>✉️ Invite</span>}
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