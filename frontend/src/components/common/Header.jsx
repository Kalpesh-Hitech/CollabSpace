import { useState, useRef, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { THEME as T } from '../../config/theme.config'
import { selUser, logout } from '../../redux/slices/authSlice'
import { api } from '../../redux/slices/authSlice'
import PropTypes from 'prop-types'

/* ─── SVG Icon primitives ────────────────────────────── */
const Ic = ({ size=18, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink:0, display:'block' }}>{children}</svg>
)
const MenuIco   = () => <Ic><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Ic>
const SearchIco = () => <Ic size={15}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="15.65" y2="15.65"/></Ic>
const BellIco   = () => <Ic size={17}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ic>
const ChevDn    = () => <Ic size={13}><polyline points="6 9 12 15 18 9"/></Ic>
const SettIco   = () => <Ic size={17}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Ic>
const UserIco   = () => <Ic size={15}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ic>
const LogOutIco = () => <Ic size={15}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ic>
const CheckIco  = () => <Ic size={13}><polyline points="20 6 9 17 4 12"/></Ic>
const TrashIco  = () => <Ic size={13}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></Ic>
const TeamsIco  = () => <Ic size={14}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ic>
const TaskIco   = () => <Ic size={14}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Ic>

const NOTIF_TYPE_META = {
  team_assigned : { icon: <TeamsIco />, color: '#6366f1', label: 'Team Assigned' },
  team_invite   : { icon: <TeamsIco />, color: '#14b8a6', label: 'Team Invite'   },
  task_assigned : { icon: <TaskIco  />, color: '#fb923c', label: 'Task Assigned' },
  task_claimed  : { icon: <TaskIco  />, color: '#34d399', label: 'Task Claimed'  },
  task_status   : { icon: <TaskIco  />, color: '#818cf8', label: 'Status Update' },
  general       : { icon: <BellIco  />, color: '#94a3b8', label: 'Notification'  },
}

function timeAgo(dateStr) {
  const now   = Date.now()
  const then  = new Date(dateStr).getTime()
  const diff  = Math.floor((now - then) / 1000)
  if (diff < 60)         return 'just now'
  if (diff < 3600)       return `${Math.floor(diff/60)}m ago`
  if (diff < 86400)      return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

const STYLES = `
  .h-ibtn{position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:${T.radius.md};border:none;cursor:pointer;background:transparent;color:${T.colors.text.secondary};transition:${T.tr.fast};flex-shrink:0;}
  .h-ibtn:hover{background:${T.colors.bg.elevated};color:${T.colors.text.primary};}
  .h-search{display:flex;align-items:center;gap:8px;flex:1;max-width:420px;background:${T.colors.bg.card};border:1px solid ${T.colors.bg.border};border-radius:${T.radius.md};padding:8px 12px;transition:${T.tr.normal};cursor:text;}
  .h-search:focus-within{border-color:${T.colors.primary.DEFAULT};box-shadow:0 0 0 3px rgba(99,102,241,0.12);}
  .h-search input{flex:1;background:none;border:none;outline:none;font-family:${T.fonts.body};font-size:13px;color:${T.colors.text.primary};min-width:0;width:100%;}
  .h-search input::placeholder{color:${T.colors.text.muted};}
  .h-kbd{font-family:${T.fonts.mono};font-size:10px;color:${T.colors.text.muted};background:${T.colors.bg.elevated};border:1px solid ${T.colors.bg.border};border-radius:4px;padding:2px 6px;white-space:nowrap;flex-shrink:0;}
  .h-divider{width:1px;height:22px;background:${T.colors.bg.border};flex-shrink:0;}
  .h-user{display:flex;align-items:center;gap:8px;background:transparent;border:1px solid transparent;border-radius:${T.radius.md};padding:5px 8px 5px 5px;cursor:pointer;transition:${T.tr.fast};}
  .h-user:hover{background:${T.colors.bg.elevated};border-color:${T.colors.bg.border};}
  .h-logo-text{font-family:${T.fonts.display};font-weight:700;font-size:17px;color:${T.colors.text.primary};letter-spacing:-0.02em;white-space:nowrap;}
  .h-notif-panel{position:absolute;top:calc(100% + 8px);right:0;background:${T.colors.bg.elevated};border:1px solid ${T.colors.bg.border};border-radius:${T.radius.lg};box-shadow:${T.shadows.lg};width:360px;max-width:95vw;z-index:9999;overflow:hidden;animation:fadeUp 0.15s ease both;}
  .h-notif-item{padding:12px 16px;border-bottom:1px solid ${T.colors.bg.border};cursor:pointer;transition:background 0.15s;display:flex;gap:10px;align-items:flex-start;}
  .h-notif-item:last-child{border-bottom:none;}
  .h-notif-item:hover{background:${T.colors.bg.hover};}
  .h-notif-item.unread{background:rgba(99,102,241,0.05);}
  .h-notif-actions{display:flex;gap:4px;flex-shrink:0;margin-top:2px;}
  .h-notif-act-btn{background:none;border:none;cursor:pointer;color:${T.colors.text.muted};padding:3px;border-radius:4px;display:flex;transition:all 0.12s;}
  .h-notif-act-btn:hover{background:${T.colors.bg.card};color:${T.colors.text.primary};}
  @media(max-width:768px){.h-user-info{display:none!important;}.h-user-chev{display:none!important;}.h-sett{display:none!important;}.h-kbd{display:none!important;}}
  @media(max-width:480px){.h-logo-text{display:none!important;}.h-notif-panel{width:calc(100vw - 20px);right:-10px;}}
`

/* ─── Notification Panel ─────────────────────────────── */
function NotificationPanel({ onClose }) {
  const [notifs,   setNotifs]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const ref = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/notifications')
      setNotifs(res.data || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const close = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [load, onClose])

  const markRead = async (id, e) => {
    e.stopPropagation()
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (_) {}
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (_) {}
  }

  const deleteNotif = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/notifications/${id}`)
      setNotifs(prev => prev.filter(n => n.id !== id))
    } catch (_) {}
  }

  const joinInvite = async (inviteToken, id, e) => {
    e.stopPropagation()
    try {
      await api.get(`/verify-invite/${inviteToken}`)
      setNotifs(prev => prev.filter(n => n.id !== id))
      // refresh bell count handled by onClose
    } catch (_) {}
  }

  const declineInvite = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/notifications/${id}`)
      setNotifs(prev => prev.filter(n => n.id !== id))
    } catch (_) {}
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  return (
    <div ref={ref} className="h-notif-panel">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:`1px solid ${T.colors.bg.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:T.fonts.display, fontWeight:700, fontSize:14, color:T.colors.text.primary }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ background:T.colors.danger.bg, color:T.colors.danger.text, fontFamily:T.fonts.mono, fontSize:10, fontWeight:700, borderRadius:T.radius.full, padding:'2px 7px' }}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:T.fonts.body, fontSize:12, color:T.colors.primary.DEFAULT, fontWeight:600 }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Items */}
      <div style={{ maxHeight:400, overflowY:'auto' }}>
        {loading ? (
          <div style={{ padding:'32px 16px', textAlign:'center' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height:56, borderRadius:T.radius.md, marginBottom:8, background:`linear-gradient(90deg,${T.colors.bg.card} 25%,${T.colors.bg.hover} 50%,${T.colors.bg.card} 75%)`, backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <p style={{ fontSize:32, marginBottom:8 }}>🔔</p>
            <p style={{ fontSize:13, color:T.colors.text.muted }}>No notifications yet</p>
          </div>
        ) : notifs.map(n => {
          const meta = NOTIF_TYPE_META[n.notif_type] || NOTIF_TYPE_META.general
          return (
            <div key={n.id} className={`h-notif-item${!n.is_read ? ' unread' : ''}`}>
              {/* Type icon */}
              <div style={{ width:32, height:32, borderRadius:T.radius.md, background:`${meta.color}18`, border:`1px solid ${meta.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:meta.color, flexShrink:0, marginTop:1 }}>
                {meta.icon}
              </div>

              {/* Content */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:6, marginBottom:3 }}>
                  <p style={{ fontFamily:T.fonts.body, fontSize:12, fontWeight: n.is_read ? 500 : 700, color:T.colors.text.primary, lineHeight:1.4, margin:0 }}>
                    {n.title}
                  </p>
                  {!n.is_read && (
                    <span style={{ width:7, height:7, borderRadius:'50%', background:T.colors.primary.DEFAULT, flexShrink:0, marginTop:4 }} />
                  )}
                </div>
                <p style={{ fontFamily:T.fonts.body, fontSize:11, color:T.colors.text.secondary, lineHeight:1.5, margin:'0 0 5px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                  {n.message}
                </p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:T.fonts.mono, fontSize:10, color:T.colors.text.muted }}>{timeAgo(n.created_at)}</span>
                  {/* Join / Decline buttons for team invites */}
                  {n.notif_type === 'team_invite' && n.invite_token && (
                    <div style={{ display:'flex', gap:5, marginTop:6 }}>
                      <button onClick={e => joinInvite(n.invite_token, n.id, e)}
                        style={{ flex:1, padding:'5px 0', borderRadius:T.radius.sm, border:'none', background:'#14b8a6', color:'#fff', fontFamily:T.fonts.body, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                        ✓ Join Team
                      </button>
                      <button onClick={e => declineInvite(n.id, e)}
                        style={{ flex:1, padding:'5px 0', borderRadius:T.radius.sm, border:`1px solid ${T.colors.bg.border}`, background:'transparent', color:T.colors.text.secondary, fontFamily:T.fonts.body, fontSize:11, fontWeight:600, cursor:'pointer' }}>
                        ✕ Decline
                      </button>
                    </div>
                  )}
                  <div className="h-notif-actions">
                    {!n.is_read && (
                      <button className="h-notif-act-btn" onClick={e => markRead(n.id, e)} title="Mark read">
                        <CheckIco />
                      </button>
                    )}
                    <button className="h-notif-act-btn" onClick={e => deleteNotif(n.id, e)} title="Delete">
                      <TrashIco />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {notifs.length > 0 && (
        <div style={{ padding:'10px 16px', borderTop:`1px solid ${T.colors.bg.border}`, textAlign:'center' }}>
          <span style={{ fontFamily:T.fonts.mono, fontSize:11, color:T.colors.text.muted }}>{notifs.length} notification{notifs.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Bell Button with unread badge ─────────────────────── */
function BellButton() {
  const [open,  setOpen]  = useState(false)
  const [count, setCount] = useState(0)

  const loadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count')
      setCount(res.data?.count || 0)
    } catch (_) {}
  }, [])

  // Poll every 30s for new notifications
  useEffect(() => {
    loadCount()
    const interval = setInterval(loadCount, 30000)
    return () => clearInterval(interval)
  }, [loadCount])

  return (
    <div style={{ position:'relative' }}>
      <button
        className="h-ibtn"
        onClick={() => setOpen(o => !o)}
        style={{ position:'relative', color: open ? T.colors.text.primary : undefined }}
        title="Notifications"
      >
        <BellIco />
        {count > 0 && (
          <span style={{
            position:'absolute', top:5, right:5,
            minWidth:16, height:16, borderRadius:T.radius.full,
            background:T.colors.danger.text, border:`2px solid ${T.colors.bg.page}`,
            fontFamily:T.fonts.mono, fontSize:9, fontWeight:700,
            color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
            padding:'0 3px',
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && <NotificationPanel onClose={() => { setOpen(false); loadCount() }} />}
    </div>
  )
}

/* ─── User Dropdown ─────────────────────────────────────── */
function UserDropdown() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user     = useSelector(selUser)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const name     = user?.name  || user?.email?.split('@')[0] || 'User'
  const email    = user?.email || ''
  const role     = user?.role  || ''
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button className="h-user" onClick={() => setOpen(o => !o)}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:T.gradients.brand, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fonts.display, fontWeight:700, fontSize:11, color:'#fff', flexShrink:0 }}>{initials}</div>
        <div className="h-user-info" style={{ textAlign:'left' }}>
          <p style={{ fontFamily:T.fonts.body, fontSize:12, fontWeight:600, color:T.colors.text.primary, lineHeight:1 }}>{name}</p>
          <p style={{ fontFamily:T.fonts.mono, fontSize:10, color:T.colors.text.muted, marginTop:2, lineHeight:1, textTransform:'capitalize' }}>{role}</p>
        </div>
        <span className="h-user-chev" style={{ color:T.colors.text.muted }}><ChevDn /></span>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:T.colors.bg.elevated, border:`1px solid ${T.colors.bg.border}`, borderRadius:T.radius.lg, boxShadow:T.shadows.lg, minWidth:220, zIndex:9999, overflow:'hidden', animation:'fadeUp 0.15s ease both' }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${T.colors.bg.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:T.gradients.brand, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fonts.display, fontWeight:700, fontSize:14, color:'#fff' }}>{initials}</div>
              <div style={{ minWidth:0 }}>
                <p style={{ fontFamily:T.fonts.body, fontSize:13, fontWeight:600, color:T.colors.text.primary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</p>
                <p style={{ fontFamily:T.fonts.mono, fontSize:10, color:T.colors.text.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</p>
              </div>
            </div>
          </div>
          <div style={{ padding:'6px' }}>
            {[
              { icon:<UserIco />, label:'My Profile', action:() => { setOpen(false); navigate('/profile') } },
              { icon:<SettIco />, label:'Settings',   action:() => setOpen(false) },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px', background:'none', border:'none', borderRadius:T.radius.md, cursor:'pointer', color:T.colors.text.secondary, fontFamily:T.fonts.body, fontSize:13, transition:T.tr.fast }}
                onMouseEnter={e => { e.currentTarget.style.background = T.colors.bg.hover; e.currentTarget.style.color = T.colors.text.primary }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.colors.text.secondary }}>
                <span style={{ display:'flex' }}>{item.icon}</span>{item.label}
              </button>
            ))}
            <div style={{ height:1, background:T.colors.bg.border, margin:'4px 0' }} />
            <button onClick={() => { dispatch(logout()); navigate('/login') }}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px', background:'none', border:'none', borderRadius:T.radius.md, cursor:'pointer', color:T.colors.danger.text, fontFamily:T.fonts.body, fontSize:13, transition:T.tr.fast }}
              onMouseEnter={e => e.currentTarget.style.background = T.colors.danger.bg}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <span style={{ display:'flex' }}><LogOutIco /></span>Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Header ─────────────────────────────────────────────── */
export default function Header({ onToggleSidebar }) {
  return (
    <>
      <style>{STYLES}</style>
      <div style={{ position:'sticky', top:0, zIndex:100 }}>
        <header className="glass" style={{ height:T.layout.headerH, borderBottom:`1px solid ${T.colors.bg.border}`, boxShadow:'0 1px 0 rgba(45,48,80,0.5),0 4px 20px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', padding:'0 14px', gap:10 }}>
          {/* Left — menu + logo */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <button className="h-ibtn" onClick={onToggleSidebar}><MenuIco /></button>
            <a href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none', flexShrink:0 }}>
              <div className="anim-logo-glow" style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:T.gradients.brand, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/><rect x="10.5" y="1.5" width="6" height="6" rx="1.5" fill="white" opacity="0.65"/><rect x="1.5" y="10.5" width="6" height="6" rx="1.5" fill="white" opacity="0.65"/><rect x="10.5" y="10.5" width="6" height="6" rx="1.5" fill="white" opacity="0.4"/></svg>
              </div>
              <span className="h-logo-text">Collab<span style={{ color:T.colors.teal.DEFAULT }}>Space</span></span>
            </a>
          </div>

          {/* Center — search */}
          <div style={{ flex:1, display:'flex', justifyContent:'center', padding:'0 4px' }}>
            <button className="h-search" tabIndex="0" onClick={e => e.currentTarget.querySelector('input')?.focus()}>
              <span style={{ color:T.colors.text.muted, display:'flex' }}><SearchIco /></span>
              <input type="text" placeholder="Search tasks, projects…" />
              <kbd className="h-kbd">⌘K</kbd>
            </button>
          </div>

          {/* Right — bell + settings + user */}
          <div style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
            {/* Bell with notification dropdown */}
            <BellButton />
            <button className="h-ibtn h-sett"><SettIco /></button>
            <div className="h-divider" style={{ margin:'0 4px' }} />
            <UserDropdown />
          </div>
        </header>
      </div>
    </>
  )
}

Header.propTypes = { onToggleSidebar: PropTypes.func.isRequired }