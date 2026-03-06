import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../redux/slices/authSlice'
import { getAllTeams } from '../utils/api'
import { THEME as T } from '../config/theme.config'
import toast from 'react-hot-toast'

const CSS = `
  .rp-table  { width: 100%; border-collapse: collapse; }
  .rp-th     { font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; color: ${T.colors.text.muted}; text-transform: uppercase; letter-spacing: 0.08em; padding: 10px 14px; text-align: left; border-bottom: 1px solid ${T.colors.bg.border}; white-space: nowrap; }
  .rp-td     { padding: 12px 14px; border-bottom: 1px solid ${T.colors.bg.border}; font-size: 13px; color: ${T.colors.text.secondary}; }
  .rp-tr:hover .rp-td { background: ${T.colors.bg.hover}; }
  .rp-badge  { display: inline-flex; align-items: center; font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 600; border-radius: ${T.radius.full}; padding: 3px 9px; }
  .rp-input  { padding: 9px 13px; background: ${T.colors.bg.elevated}; border: 1.5px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; outline: none; font-family: ${T.fonts.body}; font-size: 13px; color: ${T.colors.text.primary}; transition: border-color 0.15s; box-sizing: border-box; }
  .rp-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .rp-input::placeholder { color: ${T.colors.text.muted}; }
  .rp-select { appearance: none; cursor: pointer; }
  .rp-btn    { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 18px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
  .rp-skel   { background: linear-gradient(90deg, ${T.colors.bg.elevated} 25%, ${T.colors.bg.hover} 50%, ${T.colors.bg.elevated} 75%); background-size: 200% 100%; animation: rp-shimmer 1.5s infinite; border-radius: ${T.radius.md}; }
  .rp-tab    { padding: 9px 20px; border-radius: ${T.radius.md}; border: none; font-family: ${T.fonts.body}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  @keyframes rp-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`

const STATUS_CFG = {
  todo:     { bg: T.colors.info.bg,    color: T.colors.info.text,    label: 'To Do' },
  doing:    { bg: T.colors.warning.bg, color: T.colors.warning.text, label: 'In Progress' },
  complete: { bg: T.colors.success.bg, color: T.colors.success.text, label: 'Done' },
}
const PRIORITY_CFG = {
  low:    { bg: T.colors.success.bg, color: T.colors.success.text },
  medium: { bg: T.colors.warning.bg, color: T.colors.warning.text },
  high:   { bg: T.colors.danger.bg,  color: T.colors.danger.text  },
}

function Skel({ h = 20, w = '100%' }) {
  return <div className="rp-skel" style={{ height: h, width: w }} />
}

// ── Task Report Tab ────────────────────────────────────────────────────────────
function TaskReport({ teams }) {
  const [tasks,    setTasks]   = useState([])
  const [loading,  setLoading] = useState(false)
  const [search,   setSearch]  = useState('')
  const [filters,  setFilters] = useState({ status: '', priority: '', team_id: '' })

  const fetchTasks = async (f = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.status)   params.set('status',   f.status)
      if (f.priority) params.set('priority', f.priority)
      if (f.team_id)  params.set('team_id',  f.team_id)
      const res = await api.get(`/reports/tasks?${params}`)
      setTasks(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to load task report')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const setFilter = (key, val) => {
    const next = { ...filters, [key]: val }
    setFilters(next)
    fetchTasks(next)
  }

  const displayed = tasks.filter(t =>
    !search ||
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.assignee_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.team_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input className="rp-input" style={{ flex: '1 1 200px', minWidth: 160 }} placeholder="🔍 Search title, assignee, team…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rp-input rp-select" style={{ minWidth: 130 }} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="doing">In Progress</option>
          <option value="complete">Done</option>
        </select>
        <select className="rp-input rp-select" style={{ minWidth: 130 }} value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select className="rp-input rp-select" style={{ minWidth: 150 }} value={filters.team_id} onChange={e => setFilter('team_id', e.target.value)}>
          <option value="">All Teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {(filters.status || filters.priority || filters.team_id || search) && (
          <button className="rp-btn" onClick={() => { setSearch(''); const reset = { status: '', priority: '', team_id: '' }; setFilters(reset); fetchTasks(reset) }}
            style={{ background: T.colors.bg.elevated, color: T.colors.text.muted, border: `1px solid ${T.colors.bg.border}` }}>
            ✕ Clear
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, color: T.colors.text.muted, margin: '0 0 12px' }}>
        {loading ? 'Loading…' : `${displayed.length} task${displayed.length !== 1 ? 's' : ''}`}
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table className="rp-table">
          <thead>
            <tr>
              {['Title', 'Status', 'Priority', 'Team', 'Assignee', 'Creator'].map(h => <th key={h} className="rp-th">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i}>{[1,2,3,4,5,6].map(j => <td key={j} className="rp-td"><Skel h={14} /></td>)}</tr>
              ))
            ) : displayed.length === 0 ? (
              <tr><td colSpan={6} className="rp-td" style={{ textAlign: 'center', padding: '40px', color: T.colors.text.muted }}>No tasks match your filters</td></tr>
            ) : displayed.map(t => {
              const sc = STATUS_CFG[t.status]   || { bg: T.colors.bg.elevated, color: T.colors.text.muted, label: t.status }
              const pc = PRIORITY_CFG[t.priority] || { bg: T.colors.bg.elevated, color: T.colors.text.muted }
              return (
                <tr key={t.id} className="rp-tr">
                  <td className="rp-td" style={{ maxWidth: 220 }}>
                    <span style={{ fontWeight: 600, color: T.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{t.title}</span>
                  </td>
                  <td className="rp-td"><span className="rp-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span></td>
                  <td className="rp-td"><span className="rp-badge" style={{ background: pc.bg, color: pc.color, textTransform: 'capitalize' }}>{t.priority}</span></td>
                  <td className="rp-td">{t.team_name || <span style={{ color: T.colors.text.muted }}>—</span>}</td>
                  <td className="rp-td">{t.assignee_name || <span style={{ color: T.colors.text.muted }}>—</span>}</td>
                  <td className="rp-td">{t.creator_name  || <span style={{ color: T.colors.text.muted }}>—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Team Report Tab ────────────────────────────────────────────────────────────
function TeamReport({ teams }) {
  const [selectedId, setSelectedId] = useState('')
  const [report,     setReport]     = useState(null)
  const [loading,    setLoading]    = useState(false)

  const fetchTeam = async (id) => {
    if (!id) { setReport(null); return }
    setLoading(true)
    try {
      const res = await api.get(`/reports/team/${id}`)
      setReport(res.data)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to load team report')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (id) => { setSelectedId(id); fetchTeam(id) }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="rp-input rp-select" style={{ flex: '1 1 240px', maxWidth: 360 }}
          value={selectedId} onChange={e => handleSelect(e.target.value)}>
          <option value="">— Select a team —</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {selectedId && (
          <button className="rp-btn" onClick={() => fetchTeam(selectedId)}
            style={{ background: T.colors.bg.elevated, color: T.colors.text.secondary, border: `1px solid ${T.colors.bg.border}` }}>
            ↻ Refresh
          </button>
        )}
      </div>

      {!selectedId && !loading && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: T.colors.text.muted }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>🏢</p>
          <p style={{ fontSize: 14, fontWeight: 500 }}>Select a team to view its detailed report</p>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skel h={80} /><Skel h={200} />
        </div>
      )}

      {report && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Team header */}
          <div style={{ background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.lg, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 50, height: 50, borderRadius: T.radius.md, background: T.gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display, fontWeight: 800, fontSize: 20, color: '#fff', flexShrink: 0 }}>
              {report.team_name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 20, color: T.colors.text.primary, margin: 0 }}>{report.team_name}</h2>
              <p style={{ fontSize: 12, color: T.colors.text.muted, margin: '3px 0 0' }}>
                Manager: <span style={{ color: T.colors.primary.light, fontWeight: 600 }}>{report.manager_name}</span> · {report.manager_email}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Tasks', val: report.total_tasks,    color: T.colors.primary.DEFAULT },
                { label: 'Completed',   val: report.complete_tasks, color: T.colors.success.text },
                { label: 'Members',     val: report.member_count,   color: T.colors.warning.text },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.md, padding: '10px 18px' }}>
                  <p style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 20, color: s.color, margin: 0 }}>{s.val}</p>
                  <p style={{ fontFamily: T.fonts.mono, fontSize: 9, color: T.colors.text.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Members table */}
          <div style={{ background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.lg, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.colors.bg.border}` }}>
              <p style={{ fontFamily: T.fonts.mono, fontSize: 10, fontWeight: 600, color: T.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                Member Workloads ({report.members?.length || 0})
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="rp-table">
                <thead>
                  <tr>
                    {['Member', 'Email', 'Total', 'Done', 'Active', 'Todo'].map(h => <th key={h} className="rp-th">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {report.members?.length === 0 ? (
                    <tr><td colSpan={6} className="rp-td" style={{ textAlign: 'center', color: T.colors.text.muted, padding: '32px' }}>No members in this team</td></tr>
                  ) : report.members?.map(m => {
                    const initials = (m.user_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    return (
                      <tr key={m.user_id} className="rp-tr">
                        <td className="rp-td">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display, fontWeight: 700, fontSize: 10, color: '#fff', flexShrink: 0 }}>{initials}</div>
                            <span style={{ fontWeight: 600, color: T.colors.text.primary }}>{m.user_name}</span>
                          </div>
                        </td>
                        <td className="rp-td" style={{ fontFamily: T.fonts.mono, fontSize: 11 }}>{m.user_email}</td>
                        <td className="rp-td" style={{ textAlign: 'center', fontWeight: 700, color: T.colors.text.primary }}>{m.total_tasks}</td>
                        <td className="rp-td" style={{ textAlign: 'center', fontWeight: 700, color: T.colors.success.text }}>{m.complete_tasks}</td>
                        <td className="rp-td" style={{ textAlign: 'center', fontWeight: 700, color: T.colors.warning.text }}>{m.doing_tasks}</td>
                        <td className="rp-td" style={{ textAlign: 'center', fontWeight: 700, color: T.colors.info.text }}>{m.todo_tasks}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const navigate = useNavigate()
  const [tab,   setTab]   = useState('tasks')
  const [teams, setTeams] = useState([])

  useEffect(() => {
    getAllTeams().then(r => setTeams(r.data || [])).catch(() => {})
  }, [])

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fonts.body }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>Reports</h1>
            <p style={{ fontSize: 14, color: T.colors.text.secondary }}>Detailed task and team reports</p>
          </div>
          <button
            onClick={() => navigate('/analytics')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: T.radius.md, border: `1px solid ${T.colors.bg.border}`, background: T.colors.bg.elevated, color: T.colors.text.secondary, fontFamily: T.fonts.body, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ← Analytics
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.lg, padding: 4, width: 'fit-content' }}>
          {[{ key: 'tasks', label: '📋 Task Report' }, { key: 'teams', label: '🏢 Team Report' }].map(t => (
            <button key={t.key} className="rp-tab" onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? T.colors.bg.card : 'transparent',
                color: tab === t.key ? T.colors.text.primary : T.colors.text.muted,
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`, borderRadius: T.radius.lg, padding: '22px 24px' }}>
          {tab === 'tasks' && <TaskReport teams={teams} />}
          {tab === 'teams' && <TeamReport teams={teams} />}
        </div>
      </div>
    </>
  )
}