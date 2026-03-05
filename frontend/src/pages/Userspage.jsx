import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { selUser } from '../redux/slices/authSlice'
import { getAllUsers, updateUser, createUser, getAllEmployees } from '../utils/api'
import toast from 'react-hot-toast'

const CSS = `
  .us-table { width: 100%; border-collapse: collapse; }
  .us-th {
    font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 500;
    color: ${T.colors.text.muted}; text-transform: uppercase; letter-spacing: 0.08em;
    padding: 10px 14px; text-align: left; border-bottom: 1px solid ${T.colors.bg.border};
    background: ${T.colors.bg.elevated}; white-space: nowrap;
  }
  .us-td {
    padding: 12px 14px; border-bottom: 1px solid ${T.colors.bg.border};
    font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.secondary};
    vertical-align: middle;
  }
  .us-tr:hover .us-td { background: ${T.colors.bg.hover}; }
  .us-badge {
    display: inline-flex; align-items: center;
    font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600;
    border-radius: ${T.radius.full}; padding: 3px 9px;
  }
  .us-input {
    width: 100%; padding: 10px 14px;
    background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border};
    border-radius: ${T.radius.md}; outline: none;
    font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.primary};
    transition: all 0.2s ease; box-sizing: border-box;
  }
  .us-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .us-input::placeholder { color: ${T.colors.text.muted}; }
  .us-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 16px; border-radius: ${T.radius.md}; border: none;
    font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
  }
  .us-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .us-modal {
    background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border};
    border-radius: ${T.radius.xl}; padding: 28px; width: 100%; max-width: 460px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6); animation: fadeUp 0.2s ease both;
  }
  .us-label { display: block; font-size: 12px; font-weight: 500; color: ${T.colors.text.secondary}; margin-bottom: 5px; }
  .us-field { margin-bottom: 14px; }
  .us-skeleton {
    background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite;
    border-radius: ${T.radius.md};
  }
  @media (max-width: 768px) {
    .us-desktop { display: none; }
    .us-table-wrap { overflow-x: auto; }
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
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  }
  const strengthScore = Object.values(checks).filter(Boolean).length
  const isStrong = strengthScore === 4

  const getStrengthColor = () => {
    if (strengthScore <= 1) return '#ef4444' // Red
    if (strengthScore <= 3) return '#f59e0b' // Orange/Yellow
    return '#10b981' // Green
  }

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { 
      toast.error('All fields required')
      return 
    }

    // --- Strict Validation ---
    if (!isStrong) {
      toast.error('Password must be 8+ chars with uppercase, number, and symbol')
      return
    }

    setSaving(true)
    try {
      await createUser(form)
      toast.success('User created!')
      onSaved()
      onClose()
    } catch (e) { 
      toast.error(e.response?.data?.detail || 'Failed to create user') 
    } finally { 
      setSaving(false) 
    }
  }

  return (
    <div className="us-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="us-modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 18, color: T.colors.text.primary, margin: 0 }}>Create User</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.colors.text.muted, fontSize: 20 }}>×</button>
        </div>
        <div className="us-field"><label className="us-label">Full Name *</label><input className="us-input" placeholder="John Smith" value={form.name} onChange={e => set('name', e.target.value)} autoFocus /></div>
        <div className="us-field"><label className="us-label">Email *</label><input className="us-input" type="email" placeholder="user@company.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="us-field"><label className="us-label">Password *</label><input className="us-input" type="password" placeholder="Temporary password" value={form.password} onChange={e => set('password', e.target.value)} /></div>
        <div className="us-field">
          <label className="us-label">Role *</label>
          <select className="us-input" value={form.role} onChange={e => set('role', e.target.value)} style={{ appearance: 'none', cursor: 'pointer' }}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="us-btn" onClick={handleCreate} disabled={saving}
            style={{ flex: 1, background: T.gradients.brand, color: '#fff', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Creating…' : 'Create User'}
          </button>
          <button className="us-btn" onClick={onClose}
            style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function EditUserModal({ target, currentUser, onClose, onSaved }) {
  const role = currentUser?.role?.toLowerCase()
  const [isActive, setIsActive] = useState(target.is_active)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUser({ user_id: target.id, is_active: isActive })
      toast.success('User updated!')
      onSaved()
      onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Update failed') }
    finally { setSaving(false) }
  }

  const rc = ROLE_CFG[target.role?.toLowerCase()] || ROLE_CFG.employee

  return (
    <div className="us-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="us-modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 18, color: T.colors.text.primary, margin: 0 }}>Edit User</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.colors.text.muted, fontSize: 20 }}>×</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: T.colors.bg.elevated, borderRadius: T.radius.md, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display, fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
            {target.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontFamily: T.fonts.body, fontSize: 14, fontWeight: 600, color: T.colors.text.primary }}>{target.name}</p>
            <p style={{ fontFamily: T.fonts.mono, fontSize: 11, color: T.colors.text.muted }}>{target.email}</p>
          </div>
          <span className="us-badge" style={{ marginLeft: 'auto', background: rc.bg, color: rc.color }}>{target.role}</span>
        </div>

        <div className="us-field">
          <label className="us-label">Account Status</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => setIsActive(v)}
                style={{ flex: 1, padding: '10px', borderRadius: T.radius.md, cursor: 'pointer', border: `1px solid ${isActive === v ? (v ? T.colors.teal.DEFAULT : T.colors.danger.text) : T.colors.bg.border}`, background: isActive === v ? (v ? T.colors.success.bg : T.colors.danger.bg) : T.colors.bg.elevated, color: isActive === v ? (v ? T.colors.success.text : T.colors.danger.text) : T.colors.text.muted, fontFamily: T.fonts.body, fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
                {v ? '✅ Active' : '🚫 Inactive'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="us-btn" onClick={handleSave} disabled={saving}
            style={{ flex: 1, background: T.gradients.brand, color: '#fff', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button className="us-btn" onClick={onClose}
            style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const currentUser = useSelector(selUser)
  const role = currentUser?.role?.toLowerCase() || 'employee'
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [roleFilter, setRoleFilter] = useState('')

  const fetchUsers = async () => {
    try {
      let r=null
      if (currentUser?.role?.toLowerCase()==="admin"){
        r = await getAllUsers()
      }
      else{
        r = await getAllEmployees()
      }
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
      {editing && <EditUserModal target={editing} currentUser={currentUser} onClose={() => setEditing(null)} onSaved={fetchUsers} />}
      {creating && <CreateUserModal onClose={() => setCreating(false)} onSaved={fetchUsers} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fonts.body }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>Users</h1>
            <p style={{ fontSize: 14, color: T.colors.text.secondary }}>{filtered.length} of {users.length} users</p>
          </div>
          {role === 'admin' && (
            <button className="us-btn" onClick={() => setCreating(true)}
              style={{ background: T.gradients.brand, color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              ＋ Add User
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="us-input" style={{ maxWidth: 260 }} placeholder="🔍 Search name or email…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="us-input" style={{ maxWidth: 160, appearance: 'none', cursor: 'pointer' }}
            value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        {/* Table */}
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
                    <tr key={i}>
                      {[1,2,3,4,5].map(j => (
                        <td key={j} className="us-td"><div className="us-skeleton" style={{ height: 20 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="us-td" style={{ textAlign: 'center', padding: '40px', color: T.colors.text.muted }}>
                      {users.length === 0 ? 'No users found' : 'No users match your filters'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => {
                    const rc = ROLE_CFG[u.role?.toLowerCase()] || ROLE_CFG.employee
                    const initials = u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'
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