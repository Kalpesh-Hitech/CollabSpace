import { THEME as T } from '../config/theme.config'
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import PropTypes from 'prop-types';
/* ─── Static data ─────────────────────────────── */
const burndown = [
  { day: 'Day 1', remaining: 80, ideal: 80 }, { day: 'Day 3', remaining: 71, ideal: 64 },
  { day: 'Day 5', remaining: 59, ideal: 48 }, { day: 'Day 7', remaining: 52, ideal: 32 },
  { day: 'Day 9', remaining: 33, ideal: 16 }, { day: 'Day 11', remaining: 18, ideal: 0 },
  { day: 'Day 12', remaining: 8,  ideal: 0 },
]


const weeklyHours = [
  { week: 'W1', design: 24, dev: 48, pm: 16 },
  { week: 'W2', design: 30, dev: 52, pm: 18 },
  { week: 'W3', design: 18, dev: 60, pm: 22 },
  { week: 'W4', design: 28, dev: 44, pm: 20 },
  { week: 'W5', design: 35, dev: 58, pm: 15 },
  { week: 'W6', design: 22, dev: 70, pm: 25 },
]

const teamSkills = [
  { skill: 'Delivery',  team: 80, industry: 70 },
  { skill: 'Quality',   team: 72, industry: 65 },
  { skill: 'Speed',     team: 88, industry: 60 },
  { skill: 'Comms',     team: 65, industry: 75 },
  { skill: 'Planning',  team: 78, industry: 68 },
  { skill: 'Collab',    team: 90, industry: 72 },
]

const bugTrend = [
  { month: 'Sep', opened: 22, closed: 18 }, { month: 'Oct', opened: 18, closed: 24 },
  { month: 'Nov', opened: 30, closed: 26 }, { month: 'Dec', opened: 14, closed: 20 },
  { month: 'Jan', opened: 20, closed: 28 }, { month: 'Feb', opened: 16, closed: 22 },
]

const projectHealth = [
  { name: 'Website Redesign', health: 78, status: 'On Track',   color: T.colors.teal.DEFAULT },
  { name: 'Mobile App v2',    health: 55, status: 'At Risk',    color: T.colors.warning.text },
  { name: 'API Integration',  health: 92, status: 'Ahead',      color: T.colors.success.text },
  { name: 'Marketing Q1',     health: 40, status: 'Behind',     color: T.colors.danger.text },
  { name: 'Design System',    health: 67, status: 'On Track',   color: T.colors.teal.DEFAULT },
  { name: 'Backend Refactor', health: 30, status: 'Critical',   color: T.colors.danger.text },
]

const CSS = `
  .rp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .rp-card {
    background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border};
    border-radius: ${T.radius.lg}; padding: 20px;
  }
  .rp-title { font-family: ${T.fonts.display}; font-weight: 700; font-size: 15px; color: ${T.colors.text.primary}; margin-bottom: 4px; }
  .rp-sub   { font-size: 12px; color: ${T.colors.text.muted}; margin-bottom: 18px; font-family: ${T.fonts.mono}; }
  .rp-health-row {
    display: flex; align-items: center; gap: 12px; padding: 10px 0;
    border-bottom: 1px solid ${T.colors.bg.border};
  }
  .rp-health-row:last-child { border-bottom: none; }
  @media (max-width: 1024px) { .rp-grid2 { grid-template-columns: 1fr; } }
  @media (max-width: 640px)  {
    .rp-card { padding: 14px; }
    .rp-grid2 { gap: 12px; }
  }
`

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`,
      borderRadius: T.radius.md, padding: '10px 14px', boxShadow: T.shadows.md,
    }}>
      <p style={{ fontFamily: T.fonts.mono, fontSize: 11, color: T.colors.text.muted, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontFamily: T.fonts.body, fontSize: 12, color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      color: PropTypes.string,
      payload: PropTypes.object 
    })
  ),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const gridProps = { strokeDasharray: '3 3', stroke: T.colors.bg.border, vertical: false }
const axisStyle = { tick: { fill: T.colors.text.muted, fontSize: 11, fontFamily: T.fonts.mono }, axisLine: false, tickLine: false }

export default function ReportsPage() {
  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fonts.body }}>

        {/* Header */}
        <div className="anim-fade-up">
          <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Reports
          </h1>
          <p style={{ fontSize: 14, color: T.colors.text.secondary }}>
            Q1 2026 — Sprint & project health overview
          </p>
        </div>

        {/* Sprint burndown + Bug trend */}
        <div className="rp-grid2 anim-fade-up delay-1">
          <div className="rp-card">
            <p className="rp-title">Sprint Burndown</p>
            <p className="rp-sub">Sprint 20 · 12-day sprint</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={burndown} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="day" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: T.fonts.body, fontSize: 12, color: T.colors.text.secondary }} />
                <Line type="monotone" dataKey="remaining" name="Remaining" stroke={T.colors.primary.DEFAULT} strokeWidth={2.5} dot={{ r: 3, fill: T.colors.primary.DEFAULT }} />
                <Line type="monotone" dataKey="ideal"     name="Ideal"     stroke={T.colors.bg.border}        strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rp-card">
            <p className="rp-title">Bug Report Trend</p>
            <p className="rp-sub">Opened vs Closed — 6 months</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bugTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: T.fonts.body, fontSize: 12, color: T.colors.text.secondary }} />
                <Bar dataKey="opened" name="Opened" fill={T.colors.danger.text}    radius={[3,3,0,0]} />
                <Bar dataKey="closed" name="Closed" fill={T.colors.success.text}   radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly hours + Radar */}
        <div className="rp-grid2 anim-fade-up delay-2">
          <div className="rp-card">
            <p className="rp-title">Weekly Hours by Role</p>
            <p className="rp-sub">Design · Dev · PM — W1–W6</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyHours} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="week" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: T.fonts.body, fontSize: 12, color: T.colors.text.secondary }} />
                <Bar dataKey="design" name="Design" stackId="a" fill={T.colors.accent.DEFAULT}   />
                <Bar dataKey="dev"    name="Dev"    stackId="a" fill={T.colors.primary.DEFAULT}  />
                <Bar dataKey="pm"     name="PM"     stackId="a" fill={T.colors.teal.DEFAULT}     radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rp-card">
            <p className="rp-title">Team Skills Radar</p>
            <p className="rp-sub">vs Industry benchmark</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={teamSkills}>
                <PolarGrid stroke={T.colors.bg.border} />
                <PolarAngleAxis dataKey="skill" tick={{ fill: T.colors.text.muted, fontSize: 10, fontFamily: T.fonts.mono }} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                <Radar name="Team"     dataKey="team"     stroke={T.colors.primary.DEFAULT} fill={T.colors.primary.DEFAULT} fillOpacity={0.2} />
                <Radar name="Industry" dataKey="industry" stroke={T.colors.teal.DEFAULT}    fill={T.colors.teal.DEFAULT}    fillOpacity={0.1} strokeDasharray="4 4" />
                <Legend wrapperStyle={{ fontFamily: T.fonts.body, fontSize: 12, color: T.colors.text.secondary }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project health table */}
        <div className="rp-card anim-fade-up delay-3">
          <p className="rp-title">Project Health Scorecard</p>
          <p className="rp-sub">Overall health score (0–100) with status</p>
          <div>
            {projectHealth.map(p => (
              <div key={p.name} className="rp-health-row">
                <div style={{ flex: '0 0 160px', minWidth: 0 }}>
                  <span style={{ fontFamily: T.fonts.body, fontSize: 13, fontWeight: 500, color: T.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{p.name}</span>
                </div>
                {/* Bar */}
                <div style={{ flex: 1, height: 8, background: T.colors.bg.elevated, borderRadius: T.radius.full, overflow: 'hidden', minWidth: 60 }}>
                  <div className="progress-fill" style={{ height: '100%', width: `${p.health}%`, background: p.color, borderRadius: T.radius.full }} />
                </div>
                <span style={{ fontFamily: T.fonts.mono, fontSize: 12, fontWeight: 700, color: p.color, flex: '0 0 36px', textAlign: 'right' }}>{p.health}</span>
                <span style={{
                  fontFamily: T.fonts.mono, fontSize: 10, fontWeight: 600,
                  background: `${p.color}18`, color: p.color,
                  borderRadius: T.radius.full, padding: '2px 10px',
                  flex: '0 0 80px', textAlign: 'center', whiteSpace: 'nowrap',
                }}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}