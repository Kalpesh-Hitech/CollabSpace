import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { THEME as T } from '../config/theme.config'
import { selUser } from '../redux/slices/authSlice'
import { getTaskStats, getAllTeams } from '../utils/api'

const CSS = `
  .db-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .db-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .db-card {
    background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border};
    border-radius: ${T.radius.lg}; padding: 20px;
  }
  .db-stat-val {
    font-family: ${T.fonts.display}; font-weight: 800; font-size: 36px;
    color: ${T.colors.text.primary}; line-height: 1;
  }
  .db-stat-label { font-size: 12px; color: ${T.colors.text.secondary}; margin-top: 6px; }
  .db-tag {
    display: inline-flex; align-items: center;
    font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600;
    border-radius: ${T.radius.full}; padding: 3px 9px;
  }
  .db-team-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0; border-bottom: 1px solid ${T.colors.bg.border};
    gap: 10px;
  }
  .db-team-row:last-child { border-bottom: none; }
  .db-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: ${T.radius.md};
    font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.2s ease;
  }
  .db-skeleton {
    background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite;
    border-radius: ${T.radius.md};
  }
  @media (max-width: 1024px) { .db-grid { grid-template-columns: repeat(2, 1fr); } .db-grid2 { grid-template-columns: 1fr; } }
  @media (max-width: 640px)  { .db-grid { grid-template-columns: 1fr; } .db-card { padding: 14px; } }
`

const PRIORITY_COLORS = {
  low    : T.colors.success.text,
  medium : T.colors.warning.text,
  high   : T.colors.danger.text,
}

const STATUS_CONFIG = {
  todo     : { label: 'To Do',       color: T.colors.info.text,    bg: T.colors.info.bg },
  doing    : { label: 'In Progress', color: T.colors.warning.text, bg: T.colors.warning.bg },
  complete : { label: 'Completed',   color: T.colors.success.text, bg: T.colors.success.bg },
}

function StatCard({ label, value, icon, accent, loading }) {
  return (
    <div className="db-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 0 0 80px', background: `${accent}10`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {loading
            ? <div className="db-skeleton" style={{ width: 60, height: 36, marginBottom: 8 }} />
            : <p className="db-stat-val" style={{ color: accent }}>{value ?? '—'}</p>
          }
          <p className="db-stat-label">{label}</p>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: T.radius.md, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: 20 }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ height: 6, background: T.colors.bg.elevated, borderRadius: T.radius.full, overflow: 'hidden', marginTop: 6 }}>
      <div className="progress-fill" style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: T.radius.full }} />
    </div>
  )
}

export default function DashboardPage() {
  const user     = useSelector(selUser)
  const navigate = useNavigate()
  const [stats,  setStats]  = useState(null)
  const [teams,  setTeams]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTaskStats().then(r => r.data),
      getAllTeams().then(r => r.data),
    ]).then(([s, t]) => {
      setStats(s)
      setTeams(t)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const role     = user?.role?.toLowerCase() || 'employee'
  const name     = user?.name || user?.email?.split('@')[0] || 'User'
  const total    = stats ? (stats.todo || 0) + (stats.doing || 0) + (stats.complete || 0) : 0
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: T.fonts.body }}>

        {/* Header */}
        <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>
              {greeting}, {name} 👋
            </h1>
            <p style={{ fontSize: 14, color: T.colors.text.secondary }}>
              Here's what's happening with your workspace today.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="db-btn" onClick={() => navigate('/tasks')}
              style={{ background: T.gradients.brand, color: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.boxShadow = T.shadows.glow }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = 'none' }}>
              ＋ New Task
            </button>
            {(role === 'admin' || role === 'manager') && (
              <button className="db-btn" onClick={() => navigate('/teams')}
                style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}
                onMouseEnter={e => { e.currentTarget.style.background = T.colors.bg.hover; e.currentTarget.style.color = T.colors.text.primary }}
                onMouseLeave={e => { e.currentTarget.style.background = T.colors.bg.elevated; e.currentTarget.style.color = T.colors.text.secondary }}>
                Manage Teams
              </button>
            )}
          </div>
        </div>

        {/* Role badge */}
        <div className="anim-fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="db-tag" style={{ background: 'rgba(99,102,241,0.12)', color: T.colors.primary[400] }}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
          <span className="db-tag" style={{ background: T.colors.success.bg, color: T.colors.success.text }}>
            ● Active
          </span>
        </div>

        {/* Task stats */}
        <div className="db-grid anim-fade-up delay-1">
          <StatCard label="Total Tasks"    value={total}              icon="📋" accent={T.colors.primary.DEFAULT}  loading={loading} />
          <StatCard label="To Do"          value={stats?.todo}        icon="🔲" accent={T.colors.info.text}         loading={loading} />
          <StatCard label="In Progress"    value={stats?.doing}       icon="⚡" accent={T.colors.warning.text}     loading={loading} />
          <StatCard label="Completed"      value={stats?.complete}    icon="✅" accent={T.colors.success.text}     loading={loading} />
          <StatCard label="Teams Joined"   value={teams.length}       icon="👥" accent={T.colors.teal.DEFAULT}     loading={loading} />
          <StatCard label="Completion Rate" value={total > 0 ? `${Math.round(((stats?.complete || 0) / total) * 100)}%` : '0%'} icon="📈" accent="#a855f7" loading={loading} />
        </div>

        {/* Task progress + Teams */}
        <div className="db-grid2 anim-fade-up delay-2">

          {/* Task breakdown */}
          <div className="db-card">
            <p style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 15, color: T.colors.text.primary, marginBottom: 4 }}>Task Breakdown</p>
            <p style={{ fontFamily: T.fonts.mono, fontSize: 11, color: T.colors.text.muted, marginBottom: 18 }}>Current status distribution</p>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="db-skeleton" style={{ height: 48, marginBottom: 12 }} />)
            ) : (
              Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const val = stats?.[key] || 0
                return (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="db-tag" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </span>
                      <span style={{ fontFamily: T.fonts.mono, fontSize: 12, color: T.colors.text.secondary, fontWeight: 600 }}>{val} / {total}</span>
                    </div>
                    <ProgressBar value={val} max={total} color={cfg.color} />
                  </div>
                )
              })
            )}
          </div>

          {/* Teams list */}
          <div className="db-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <p style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 15, color: T.colors.text.primary }}>My Teams</p>
              <button onClick={() => navigate('/teams')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.fonts.body, fontSize: 12, color: T.colors.primary[400], fontWeight: 600 }}>View all →</button>
            </div>
            <p style={{ fontFamily: T.fonts.mono, fontSize: 11, color: T.colors.text.muted, marginBottom: 14 }}>Teams you belong to</p>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="db-skeleton" style={{ height: 44, marginBottom: 8 }} />)
            ) : teams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: T.colors.text.muted }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>👥</p>
                <p style={{ fontSize: 13 }}>No teams yet</p>
                {(role === 'admin' || role === 'manager') && (
                  <button className="db-btn" onClick={() => navigate('/teams')} style={{ marginTop: 12, background: T.gradients.brand, color: '#fff', fontSize: 12 }}>Create Team</button>
                )}
              </div>
            ) : (
              teams.slice(0, 6).map((team, i) => (
                <div key={team.id} className="db-team-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: T.radius.md, background: `${T.colors.projectDots[i % T.colors.projectDots.length]}22`, border: `1px solid ${T.colors.projectDots[i % T.colors.projectDots.length]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: T.colors.projectDots[i % T.colors.projectDots.length], display: 'block' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: T.fonts.body, fontSize: 13, fontWeight: 600, color: T.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</p>
                      <p style={{ fontFamily: T.fonts.mono, fontSize: 10, color: T.colors.text.muted }}>Active</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/teams')}
                    style={{ background: 'none', border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.sm, padding: '4px 10px', cursor: 'pointer', fontFamily: T.fonts.body, fontSize: 11, color: T.colors.text.muted, whiteSpace: 'nowrap', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.colors.primary.DEFAULT; e.currentTarget.style.color = T.colors.primary[400] }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.colors.bg.border; e.currentTarget.style.color = T.colors.text.muted }}>
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="db-card anim-fade-up delay-3">
          <p style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 15, color: T.colors.text.primary, marginBottom: 14 }}>Quick Actions</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="db-btn" onClick={() => navigate('/tasks')}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}
              onMouseEnter={e => { e.currentTarget.style.background = T.colors.bg.hover; e.currentTarget.style.color = T.colors.text.primary }}
              onMouseLeave={e => { e.currentTarget.style.background = T.colors.bg.elevated; e.currentTarget.style.color = T.colors.text.secondary }}>
              📋 View Tasks
            </button>
            {(role === 'admin' || role === 'manager') && (
              <>
                <button className="db-btn" onClick={() => navigate('/teams')}
                  style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.colors.bg.hover; e.currentTarget.style.color = T.colors.text.primary }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.colors.bg.elevated; e.currentTarget.style.color = T.colors.text.secondary }}>
                  👥 Manage Teams
                </button>
                <button className="db-btn" onClick={() => navigate('/users')}
                  style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.colors.bg.hover; e.currentTarget.style.color = T.colors.text.primary }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.colors.bg.elevated; e.currentTarget.style.color = T.colors.text.secondary }}>
                  👤 Manage Users
                </button>
              </>
            )}
            <button className="db-btn" onClick={() => navigate('/analytics')}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}
              onMouseEnter={e => { e.currentTarget.style.background = T.colors.bg.hover; e.currentTarget.style.color = T.colors.text.primary }}
              onMouseLeave={e => { e.currentTarget.style.background = T.colors.bg.elevated; e.currentTarget.style.color = T.colors.text.secondary }}>
              📊 Analytics
            </button>
            <button className="db-btn" onClick={() => navigate('/profile')}
              style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}
              onMouseEnter={e => { e.currentTarget.style.background = T.colors.bg.hover; e.currentTarget.style.color = T.colors.text.primary }}
              onMouseLeave={e => { e.currentTarget.style.background = T.colors.bg.elevated; e.currentTarget.style.color = T.colors.text.secondary }}>
              ⚙️ Profile Settings
            </button>
          </div>
        </div>

      </div>
    </>
  )
}