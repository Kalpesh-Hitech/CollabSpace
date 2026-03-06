import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { selUser } from '../redux/slices/authSlice'
import { getAllUsers, updateUser, createUser, getAllEmployees } from '../utils/api'
import toast from 'react-hot-toast'

const CSS = `
  .us-table { width: 100%; border-collapse: collapse; }
  .us-th { font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 500; color: ${T.colors.text.muted}; text-transform: uppercase; letter-spacing: 0.08em; padding: 10px 14px; text-align: left; border-bottom: 1px solid ${T.colors.bg.border}; background: ${T.colors.bg.elevated}; white-space: nowrap; }
  .us-td { padding: 12px 14px; border-bottom: 1px solid ${T.colors.bg.border}; font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.secondary}; vertical-align: middle; }
  .us-tr:hover .us-td { background: ${T.colors.bg.hover}; }
  .us-badge { display: inline-flex; align-items: center; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 3px 9px; }
  .us-input { width: 100%; padding: 10px 13px; background: ${T.colors.bg.elevated}; border: 1.5px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; outline: none; font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.primary}; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box; }
  .us-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .us-input::placeholder { color: ${T.colors.text.muted}; }
  .us-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 16px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
  .us-btn:active { transform: scale(0.97); }
  .us-label { display: block; font-size: 11px; font-weight: 600; color: ${T.colors.text.muted}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.07em; }
  .us-field { margin-bottom: 18px; }
  .us-skeleton { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: us-shimmer 1.5s infinite; border-radius: ${T.radius.md}; }

  /* Modal */
  .us-overlay {
    position: fixed; inset: 0;
    background: rgba(4, 5, 15, 0.85);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    padding: clamp(12px, 4vw, 40px);
    animation: us-fade 0.18s ease;
  }
  @keyframes us-fade { from { opacity: 0 } to { opacity: 1 } }
  .us-modal {
    background: ${T.colors.bg.card};
    border: 1px solid ${T.colors.bg.border};
    border-radius: 22px;
    width: 100%; max-width: 480px;
    max-height: calc(100dvh - clamp(24px, 8vw, 80px));
    display: flex; flex-direction: column;
    box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
    animation: us-up 0.24s cubic-bezier(0.22, 1, 0.36, 1);
    overflow: hidden;
  }
  @keyframes us-up { from { opacity:0; transform:translateY(20px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
  .us-mhd { padding: 22px 24px 18px; border-bottom: 1px solid ${T.colors.bg.border}; display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
  .us-mbd { padding: 22px 24px; overflow-y: auto; flex: 1; scrollbar-width: thin; scrollbar-color: ${T.colors.bg.border} transparent; }
  .us-mbd::-webkit-scrollbar { width: 4px; }
  .us-mbd::-webkit-scrollbar-thumb { background: ${T.colors.bg.border}; border-radius: 4px; }
  .us-mft { padding: 16px 24px 20px; border-top: 1px solid ${T.colors.bg.border}; flex-shrink: 0; }
  .us-mico { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .us-close { width: 34px; height: 34px; border-radius: 10px; margin-left: auto; display: flex; align-items: center; justify-content: center; background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border}; cursor: pointer; color: ${T.colors.text.muted}; font-size: 18px; line-height: 1; transition: all 0.15s; flex-shrink: 0; }
  .us-close:hover { background: ${T.colors.bg.hover}; color: ${T.colors.text.primary}; }
  .us-strength-row { display: flex; gap: 4px; margin: 6px 0 10px; }
  .us-strength-seg { flex: 1; height: 3px; border-radius: 4px; transition: background 0.2s; }

  @keyframes us-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @media (max-width: 768px) { .us-desktop { display: none; } .us-table-wrap { overflow-x: auto; } }
  @media (max-width: 540px) {
    .us-overlay { padding: 0; align-items: flex-end; }
    .us-modal { max-width: 100%; border-radius: 22px 22px 0 0; max-height: 93dvh; animation: us-sheet 0.28s cubic-bezier(0.22,1,0.36,1); }
    @keyframes us-sheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
  }
`

const ROLE_CFG = {
  admin    : { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
  manager  : { bg: 'rgba(20,184,166,0.15)',  color: '#2dd4bf' },
  employee : { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
}

function CreateUserModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const checks = {
    length : form.password.length >= 8,
    upper  : /[A-Z]/.test(form.password),
    number : /[0-9]/.test(form.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  }
  const strengthScore = Object.values(checks).filter(Boolean).length
  const isStrong = strengthScore === 4
  const strengthColor = strengthScore <= 1 ? '#ef4444' : strengthScore <= 3 ? '#f59e0b' : '#10b981'

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('All fields required'); return }
    if (!isStrong) { toast.error('Password must be 8+ chars with uppercase, number, and symbol'); return }
    setSaving(true)
    try {
      await createUser(form); toast.success('User created!'); onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to create user') }
    finally { setSaving(false) }
  }

  return (
    <div className="us-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="us-modal">
        <div className="us-mhd">
          <div className="us-mico" style={{ background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)' }}>
            <span style={{ fontSize: 20 }}>👤</span>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 16, color: T.colors.text.primary, margin: 0 }}>Create User</h2>
            <p style={{ fontSize: 11, color: T.colors.text.muted, margin: '2px 0 0' }}>Add a new team member</p>
          </div>
          <button className="us-close" onClick={onClose}>×</button>
        </div>

        <div className="us-mbd">
          <div className="us-field"><label className="us-label">Full Name *</label><input className="us-input" placeholder="John Smith" value={form.name} onChange={e => set('name', e.target.value)} autoFocus /></div>
          <div className="us-field"><label className="us-label">Email *</label><input className="us-input" type="email" placeholder="user@company.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div className="us-field">
            <label className="us-label">Password *</label>
            <input className="us-input" type="password" placeholder="Temporary password" value={form.password} onChange={e => set('password', e.target.value)} />
            {form.password && (
              <>
                <div className="us-strength-row">
                  {[1,2,3,4].map(i => <div key={i} className="us-strength-seg" style={{ background: i <= strengthScore ? strengthColor : T.colors.bg.border }} />)}
                </div>
                <p style={{ fontSize: 11, color: strengthColor, margin: 0 }}>
                  {strengthScore <= 1 ? 'Weak' : strengthScore <= 3 ? 'Fair' : 'Strong'} password
                </p>
              </>
            )}
          </div>
          <div className="us-field" style={{ marginBottom: 0 }}>
            <label className="us-label">Role *</label>
            <select className="us-input" value={form.role} onChange={e => set('role', e.target.value)} style={{ appearance: 'none', cursor: 'pointer' }}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="us-mft">
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="us-btn" onClick={handleCreate} disabled={saving}
              style={{ flex: 1, background: T.gradients.brand, color: '#fff', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              {saving ? 'Creating…' : '✓ Create User'}
            </button>
            <button className="us-btn" onClick={onClose}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditUserModal({ target, onClose, onSaved }) {
  const [isActive, setIsActive] = useState(target.is_active)
  const [saving,   setSaving]   = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUser({ user_id: target.id, is_active: isActive })
      toast.success('User updated!'); onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Update failed') }
    finally { setSaving(false) }
  }

  const rc       = ROLE_CFG[target.role?.toLowerCase()] || ROLE_CFG.employee
  const initials = (target.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="us-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="us-modal">
        <div className="us-mhd">
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: T.gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display, fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0, boxShadow: '0 2px 10px rgba(99,102,241,0.3)' }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 15, color: T.colors.text.primary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{target.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <p style={{ fontFamily: T.fonts.mono, fontSize: 10, color: T.colors.text.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{target.email}</p>
              <span className="us-badge" style={{ background: rc.bg, color: rc.color, flexShrink: 0 }}>{target.role}</span>
            </div>
          </div>
          <button className="us-close" onClick={onClose}>×</button>
        </div>

        <div className="us-mbd">
          <div className="us-field" style={{ marginBottom: 0 }}>
            <label className="us-label">Account Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setIsActive(v)}
                  style={{ flex: 1, padding: '14px', borderRadius: T.radius.md, cursor: 'pointer', border: `1.5px solid ${isActive === v ? (v ? T.colors.teal.DEFAULT : T.colors.danger.text) : T.colors.bg.border}`, background: isActive === v ? (v ? T.colors.success.bg : T.colors.danger.bg) : T.colors.bg.elevated, color: isActive === v ? (v ? T.colors.success.text : T.colors.danger.text) : T.colors.text.muted, fontFamily: T.fonts.body, fontSize: 13, fontWeight: 600, transition: 'all 0.18s' }}>
                  {v ? '✅ Active' : '🚫 Inactive'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="us-mft">
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="us-btn" onClick={handleSave} disabled={saving}
              style={{ flex: 1, background: T.gradients.brand, color: '#fff', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              {saving ? 'Saving…' : '✓ Save Changes'}
            </button>
            <button className="us-btn" onClick={onClose}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const currentUser = useSelector(selUser)
  const role        = currentUser?.role?.toLowerCase() || 'employee'
  const navigate    = useNavigate()
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [editing,    setEditing]    = useState(null)
  const [roleFilter, setRoleFilter] = useState('')

  const fetchUsers = async () => {
    try {
      const r = currentUser?.role?.toLowerCase() === 'admin' ? await getAllUsers() : await getAllEmployees()
      setUsers(r.data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => {
    if (roleFilter && u.role?.toLowerCase() !== roleFilter) return false
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <>
      <style>{CSS}</style>
      {editing  && <EditUserModal   target={editing} onClose={() => setEditing(null)}  onSaved={fetchUsers} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fonts.body }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>Users</h1>
            <p style={{ fontSize: 14, color: T.colors.text.secondary }}>{filtered.length} of {users.length} users</p>
          </div>
          {role === 'admin' && (
            <button className="us-btn" onClick={() => navigate('/users/new')}
              style={{ background: T.gradients.brand, color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              ＋ Add User
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="us-input" style={{ maxWidth: 260 }} placeholder="🔍 Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="us-input" style={{ maxWidth: 160, appearance: 'none', cursor: 'pointer' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        <div style={{ background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.lg, overflow: 'hidden' }}>
          <div className="us-table-wrap">
            <table className="us-table">
              <thead>
                <tr>
                  <th className="us-th">User</th>
                  <th className="us-th us-desktop">Email</th>
                  <th className="us-th">Role</th>
                  <th className="us-th">Status</th>
                  <th className="us-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i}>{[1,2,3,4,5].map(j => <td key={j} className="us-td"><div className="us-skeleton" style={{ height: 20 }} /></td>)}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="us-td" style={{ textAlign: 'center', padding: '40px', color: T.colors.text.muted }}>{users.length === 0 ? 'No users found' : 'No users match your filters'}</td></tr>
                ) : (
                  filtered.map(u => {
                    const rc       = ROLE_CFG[u.role?.toLowerCase()] || ROLE_CFG.employee
                    const initials = u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
                    return (
                      <tr key={u.id} className="us-tr">
                        <td className="us-td">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display, fontWeight: 700, fontSize: 11, color: '#fff', flexShrink: 0 }}>{initials}</div>
                            <span style={{ fontWeight: 600, color: T.colors.text.primary, whiteSpace: 'nowrap' }}>{u.name}</span>
                          </div>
                        </td>
                        <td className="us-td us-desktop" style={{ fontFamily: T.fonts.mono, fontSize: 12 }}>{u.email}</td>
                        <td className="us-td"><span className="us-badge" style={{ background: rc.bg, color: rc.color }}>{u.role}</span></td>
                        <td className="us-td">
                          <span className="us-badge" style={{ background: u.is_active ? T.colors.success.bg : T.colors.danger.bg, color: u.is_active ? T.colors.success.text : T.colors.danger.text }}>
                            {u.is_active ? '● Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td className="us-td">
                          {u.id !== currentUser?.id && u.role?.toLowerCase() !== 'admin' && (
                            <button className="us-btn" onClick={() => setEditing(u)}
                              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}`, padding: '6px 12px', fontSize: 12 }}
                              onMouseEnter={e => { e.currentTarget.style.background = T.colors.bg.hover; e.currentTarget.style.color = T.colors.text.primary }}
                              onMouseLeave={e => { e.currentTarget.style.background = T.colors.bg.elevated; e.currentTarget.style.color = T.colors.text.secondary }}>
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}