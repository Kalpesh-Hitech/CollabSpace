import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../redux/slices/authSlice'
import { THEME as T } from '../config/theme.config'
import toast from 'react-hot-toast'

const CSS = `
  .an-grid   { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
  .an-card   { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.lg}; padding: 20px 22px; }
  .an-skel   { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: an-shimmer 1.5s infinite; border-radius: ${T.radius.md}; }
  .an-table  { width: 100%; border-collapse: collapse; }
  .an-th     { font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; color: ${T.colors.text.muted}; text-transform: uppercase; letter-spacing: 0.08em; padding: 10px 14px; text-align: left; border-bottom: 1px solid ${T.colors.bg.border}; white-space: nowrap; }
  .an-td     { padding: 12px 14px; border-bottom: 1px solid ${T.colors.bg.border}; font-size: 13px; color: ${T.colors.text.secondary}; }
  .an-tr:hover .an-td { background: ${T.colors.bg.hover}; }
  .an-bar-bg { background: ${T.colors.bg.elevated}; border-radius: 4px; height: 7px; overflow: hidden; flex: 1; }
  .an-badge  { display: inline-flex; align-items: center; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 3px 9px; }
  @keyframes an-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @media (max-width: 700px) { .an-mid-row { grid-template-columns: 1fr !important; } }
`

function Skel({ h = 20, w = '100%' }) {
  return <div className="an-skel" style={{ height: h, width: w }} />
}

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="an-bar-bg">
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.7s ease' }} />
    </div>
  )
}

function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <div className="an-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: T.radius.md, background: `${color}1a`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: T.fonts.mono, fontSize: 10, fontWeight: 600, color: T.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{label}</p>
          {loading ? <Skel h={28} w="60%" /> : <p style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 26, color: T.colors.text.primary, margin: '2px 0 0', letterSpacing: '-0.02em' }}>{value ?? '—'}</p>}
        </div>
      </div>
      {sub && !loading && <p style={{ fontSize: 12, color: T.colors.text.muted, margin: 0 }}>{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [overview,  setOverview]  = useState(null)
  const [breakdown, setBreakdown] = useState(null)
  const [teamPerf,  setTeamPerf]  = useState(null)
  const [workload,  setWorkload]  = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [ov, bd, tp, wl] = await Promise.allSettled([
          api.get('/analytics/overview'),
          api.get('/analytics/task-breakdown'),
          api.get('/analytics/team-performance'),
          api.get('/analytics/user-workload'),
        ])
        if (ov.status === 'fulfilled') setOverview(ov.value.data)
        if (bd.status === 'fulfilled') setBreakdown(bd.value.data)
        if (tp.status === 'fulfilled') setTeamPerf(tp.value.data)
        if (wl.status === 'fulfilled') setWorkload(wl.value.data)
      } catch (e) {
        toast.error('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const STATUS_COLOR  = { todo: T.colors.info.text,    doing: T.colors.warning.text, complete: T.colors.success.text }
  const STATUS_BG     = { todo: T.colors.info.bg,      doing: T.colors.warning.bg,   complete: T.colors.success.bg }
  const PRIORITY_COLOR = { low: T.colors.success.text, medium: T.colors.warning.text, high: T.colors.danger.text }
  const PRIORITY_BG    = { low: T.colors.success.bg,   medium: T.colors.warning.bg,   high: T.colors.danger.bg }

  const maxPriority = breakdown ? Math.max(...breakdown.by_priority.map(p => p.count), 1) : 1
  const maxStatus   = breakdown ? Math.max(...breakdown.by_status.map(s => s.count), 1) : 1

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fonts.body }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>Analytics</h1>
            <p style={{ fontSize: 14, color: T.colors.text.secondary }}>Live overview of your workspace</p>
          </div>
          <button
            onClick={() => navigate('/report')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: T.radius.md, border: `1px solid ${T.colors.primary.DEFAULT}40`, background: `${T.colors.primary.DEFAULT}12`, color: T.colors.primary.light, fontFamily: T.fonts.body, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            📄 View Reports →
          </button>
        </div>

        {/* Overview stat cards */}
        <div className="an-grid">
          <StatCard icon="📋" label="Total Tasks"  value={overview?.total_tasks}   sub={`${overview?.complete_tasks ?? 0} completed`}  color={T.colors.primary.DEFAULT} loading={loading} />
          <StatCard icon="✅" label="Completed"    value={overview?.complete_tasks} sub={overview?.total_tasks ? `${Math.round((overview.complete_tasks / overview.total_tasks) * 100)}% completion rate` : undefined} color={T.colors.success.text} loading={loading} />
          <StatCard icon="⚡" label="In Progress"  value={overview?.doing_tasks}    color={T.colors.warning.text} loading={loading} />
          <StatCard icon="🔲" label="To Do"        value={overview?.todo_tasks}     color={T.colors.info.text}    loading={loading} />
          <StatCard icon="👥" label="Total Users"  value={overview?.total_users}    color={T.colors.teal?.DEFAULT || '#2dd4bf'} loading={loading} />
          <StatCard icon="🏢" label="Total Teams"  value={overview?.total_teams}    color="#f59e0b" loading={loading} />
        </div>

        {/* Mid row: status + priority breakdown */}
        <div className="an-mid-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Status breakdown */}
          <div className="an-card">
            <p style={{ fontFamily: T.fonts.mono, fontSize: 10, fontWeight: 600, color: T.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Status Breakdown</p>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <Skel key={i} h={24} />)}</div>
            ) : breakdown?.by_status?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {breakdown.by_status.map(s => (
                  <div key={s.status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="an-badge" style={{ background: STATUS_BG[s.status] || T.colors.bg.elevated, color: STATUS_COLOR[s.status] || T.colors.text.secondary }}>{s.status}</span>
                      <span style={{ fontFamily: T.fonts.mono, fontSize: 12, fontWeight: 700, color: T.colors.text.primary }}>{s.count}</span>
                    </div>
                    <Bar value={s.count} max={maxStatus} color={STATUS_COLOR[s.status] || T.colors.primary.DEFAULT} />
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: 13, color: T.colors.text.muted, textAlign: 'center', padding: '20px 0' }}>No data</p>}
          </div>

          {/* Priority breakdown */}
          <div className="an-card">
            <p style={{ fontFamily: T.fonts.mono, fontSize: 10, fontWeight: 600, color: T.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Priority Breakdown</p>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <Skel key={i} h={24} />)}</div>
            ) : breakdown?.by_priority?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {breakdown.by_priority.map(p => (
                  <div key={p.priority}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="an-badge" style={{ background: PRIORITY_BG[p.priority] || T.colors.bg.elevated, color: PRIORITY_COLOR[p.priority] || T.colors.text.secondary }}>{p.priority}</span>
                      <span style={{ fontFamily: T.fonts.mono, fontSize: 12, fontWeight: 700, color: T.colors.text.primary }}>{p.count}</span>
                    </div>
                    <Bar value={p.count} max={maxPriority} color={PRIORITY_COLOR[p.priority] || T.colors.primary.DEFAULT} />
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: 13, color: T.colors.text.muted, textAlign: 'center', padding: '20px 0' }}>No data</p>}
          </div>
        </div>

        {/* Team Performance */}
        <div className="an-card">
          <p style={{ fontFamily: T.fonts.mono, fontSize: 10, fontWeight: 600, color: T.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Team Performance</p>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <Skel key={i} h={20} />)}</div>
          ) : teamPerf?.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="an-table">
                <thead>
                  <tr>
                    {['Team', 'Total', 'Done', 'Doing', 'Todo', 'Completion'].map(h => <th key={h} className="an-th">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {teamPerf.map(t => (
                    <tr key={t.team_id} className="an-tr" style={{ cursor: 'pointer' }} onClick={() => navigate('/report')}>
                      <td className="an-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: T.radius.sm, background: `${T.colors.primary.DEFAULT}1a`, border: `1px solid ${T.colors.primary.DEFAULT}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display, fontWeight: 700, fontSize: 12, color: T.colors.primary.light, flexShrink: 0 }}>
                            {t.team_name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: T.colors.text.primary }}>{t.team_name}</span>
                        </div>
                      </td>
                      <td className="an-td" style={{ textAlign: 'center', fontWeight: 700, color: T.colors.text.primary }}>{t.total_tasks}</td>
                      <td className="an-td" style={{ textAlign: 'center', color: T.colors.success.text, fontWeight: 700 }}>{t.complete_tasks}</td>
                      <td className="an-td" style={{ textAlign: 'center', color: T.colors.warning.text, fontWeight: 700 }}>{t.doing_tasks}</td>
                      <td className="an-td" style={{ textAlign: 'center', color: T.colors.info.text, fontWeight: 700 }}>{t.todo_tasks}</td>
                      <td className="an-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
                          <Bar
                            value={t.completion_rate}
                            max={100}
                            color={t.completion_rate >= 70 ? T.colors.success.text : t.completion_rate >= 40 ? T.colors.warning.text : T.colors.danger.text}
                          />
                          <span style={{ fontFamily: T.fonts.mono, fontSize: 11, fontWeight: 700, color: T.colors.text.primary, minWidth: 36 }}>{t.completion_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p style={{ fontSize: 13, color: T.colors.text.muted, textAlign: 'center', padding: '24px 0' }}>No team data available</p>}
        </div>

        {/* User Workload — only shown when data exists (admin/manager only) */}
        {(loading || (workload && workload.length > 0)) && (
          <div className="an-card">
            <p style={{ fontFamily: T.fonts.mono, fontSize: 10, fontWeight: 600, color: T.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>User Workload</p>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>{[1,2,3,4].map(i => <Skel key={i} h={90} />)}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12 }}>
                {workload.map(u => {
                  const pct = u.total_tasks > 0 ? Math.round((u.complete_tasks / u.total_tasks) * 100) : 0
                  const initials = (u.user_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  return (
                    <div key={u.user_id} style={{ background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.md, padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display, fontWeight: 700, fontSize: 12, color: '#fff', flexShrink: 0 }}>{initials}</div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 13, color: T.colors.text.primary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.user_name}</p>
                          <p style={{ fontFamily: T.fonts.mono, fontSize: 10, color: T.colors.text.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.user_email}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        {[
                          { label: 'Total', val: u.total_tasks, color: T.colors.text.primary },
                          { label: 'Done',  val: u.complete_tasks, color: T.colors.success.text },
                          { label: 'Active', val: u.doing_tasks, color: T.colors.warning.text },
                        ].map(s => (
                          <div key={s.label} style={{ flex: 1, textAlign: 'center', background: T.colors.bg.card, borderRadius: T.radius.sm, padding: '7px 4px' }}>
                            <p style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 15, color: s.color, margin: 0 }}>{s.val}</p>
                            <p style={{ fontFamily: T.fonts.mono, fontSize: 9, color: T.colors.text.muted, margin: 0 }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bar value={pct} max={100} color={pct >= 70 ? T.colors.success.text : pct >= 40 ? T.colors.warning.text : T.colors.primary.DEFAULT} />
                        <span style={{ fontFamily: T.fonts.mono, fontSize: 10, color: T.colors.text.muted, minWidth: 30 }}>{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}