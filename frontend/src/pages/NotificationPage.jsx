import { useEffect, useState, useCallback } from 'react'
import { THEME as T } from '../config/theme.config'
import { api } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'

const CSS = `
  .np-card { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; overflow: hidden; }
  .np-row { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; border-bottom: 1px solid ${T.colors.bg.border}; transition: background 0.15s; cursor: default; }
  .np-row:last-child { border-bottom: none; }
  .np-row.unread { background: rgba(99,102,241,0.04); }
  .np-row:hover { background: ${T.colors.bg.elevated}; }
  .np-badge { display: inline-flex; align-items: center; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 2px 8px; }
  .np-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  .np-skel { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: ${T.radius.md}; }
`

const TYPE_META = {
  team_assigned : { icon: '👥', color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  label: 'Team Assigned'  },
  team_invite   : { icon: '🤝', color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',  label: 'Team Invite'    },
  task_assigned : { icon: '📋', color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'Task Assigned'  },
  task_claimed  : { icon: '✋', color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Task Claimed'   },
  task_status   : { icon: '🔄', color: '#818cf8', bg: 'rgba(129,140,248,0.12)', label: 'Status Update'  },
  general       : { icon: '🔔', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Notification'   },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff/60)} min ago`
  if (diff < 86400) return `${Math.floor(diff/3600)} hours ago`
  return `${Math.floor(diff/86400)} days ago`
}

export default function NotificationsPage() {
  const [notifs,   setNotifs]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')  // 'all' | 'unread'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      setNotifs(Array.isArray(res.data) ? res.data : [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (_) { toast.error('Could not mark as read') }
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All marked as read')
    } catch (_) { toast.error('Failed') }
  }

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifs(prev => prev.filter(n => n.id !== id))
    } catch (_) { toast.error('Could not delete') }
  }

  const joinInvite = async (inviteToken, id) => {
    try {
      await api.get(`/verify-invite/${inviteToken}`)
      setNotifs(prev => prev.filter(n => n.id !== id))
      toast.success('You have joined the team!')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not join team')
    }
  }

  const declineInvite = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifs(prev => prev.filter(n => n.id !== id))
      toast.success('Invite declined')
    } catch (_) { toast.error('Could not decline invite') }
  }

  const displayed   = filter === 'unread' ? notifs.filter(n => !n.is_read) : notifs
  const unreadCount = notifs.filter(n => !n.is_read).length

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display:'flex', flexDirection:'column', gap:20, fontFamily:T.fonts.body }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:T.fonts.display, fontWeight:800, fontSize:24, color:T.colors.text.primary, letterSpacing:'-0.02em', marginBottom:4 }}>Notifications</h1>
            <p style={{ fontSize:14, color:T.colors.text.secondary }}>
              {loading ? 'Loading…' : `${notifs.length} notification${notifs.length !== 1 ? 's' : ''} · ${unreadCount} unread`}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="np-btn" onClick={markAllRead}
              style={{ background:T.colors.bg.elevated, color:T.colors.text.secondary, border:`1px solid ${T.colors.bg.border}` }}>
              ✓ Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', background:T.colors.bg.card, border:`1px solid ${T.colors.bg.border}`, borderRadius:T.radius.md, padding:4, gap:4, width:'fit-content' }}>
          {[['all','All'], ['unread','Unread']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding:'6px 16px', borderRadius:T.radius.sm, border:'none', fontFamily:T.fonts.body, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s', background: filter === val ? (T.gradients?.brand || T.colors.primary.DEFAULT) : 'transparent', color: filter === val ? '#fff' : T.colors.text.secondary }}>
              {label}{val === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3,4].map(i => <div key={i} className="np-skel" style={{ height:88 }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ background:T.colors.bg.card, border:`1px solid ${T.colors.bg.border}`, borderRadius:T.radius.lg, textAlign:'center', padding:'64px 24px' }}>
            <p style={{ fontSize:44, marginBottom:10 }}>🔔</p>
            <p style={{ fontSize:16, fontWeight:600, color:T.colors.text.secondary, marginBottom:6 }}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p style={{ fontSize:13, color:T.colors.text.muted }}>
              {filter === 'unread'
                ? 'You\'re all caught up! Switch to "All" to see past notifications.'
                : 'Notifications will appear here when teams are assigned or tasks are updated.'}
            </p>
          </div>
        ) : (
          <div className="np-card">
            {displayed.map(n => {
              const meta = TYPE_META[n.notif_type] || TYPE_META.general
              return (
                <div key={n.id} className={`np-row${!n.is_read ? ' unread' : ''}`}>
                  {/* Icon */}
                  <div style={{ width:40, height:40, borderRadius:T.radius.md, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:4 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                          <span style={{ fontFamily:T.fonts.body, fontSize:13, fontWeight: n.is_read ? 500 : 700, color:T.colors.text.primary }}>
                            {n.title}
                          </span>
                          <span className="np-badge" style={{ background:meta.bg, color:meta.color }}>
                            {meta.label}
                          </span>
                          {!n.is_read && (
                            <span className="np-badge" style={{ background:T.colors.primary.DEFAULT+'22', color:T.colors.primary.DEFAULT }}>
                              New
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize:13, color:T.colors.text.secondary, lineHeight:1.6, margin:'0 0 6px' }}>
                          {n.message}
                        </p>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <span style={{ fontFamily:T.fonts.mono, fontSize:11, color:T.colors.text.muted }}>
                            {timeAgo(n.created_at)}
                          </span>
                          {n.sender_name && (
                            <span style={{ fontSize:11, color:T.colors.text.muted }}>from {n.sender_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                    {/* Join / Decline for team invites */}
                    {n.notif_type === 'team_invite' && n.invite_token ? (
                      <>
                        <button className="np-btn" onClick={() => joinInvite(n.invite_token, n.id)}
                          style={{ background:'#14b8a6', color:'#fff', border:'none', minWidth:90 }}>
                          ✓ Join Team
                        </button>
                        <button className="np-btn" onClick={() => declineInvite(n.id)}
                          style={{ background:T.colors.bg.elevated, color:T.colors.text.secondary, border:`1px solid ${T.colors.bg.border}` }}>
                          ✕ Decline
                        </button>
                      </>
                    ) : (
                      <>
                        {!n.is_read && (
                          <button className="np-btn" onClick={() => markRead(n.id)}
                            style={{ background:T.colors.bg.elevated, color:T.colors.text.secondary, border:`1px solid ${T.colors.bg.border}` }}>
                            ✓ Read
                          </button>
                        )}
                        <button className="np-btn" onClick={() => deleteNotif(n.id)}
                          style={{ background:T.colors.danger.bg, color:T.colors.danger.text, border:`1px solid ${T.colors.danger.border}` }}>
                          🗑 Delete
                        </button>
                      </>
                    )}
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