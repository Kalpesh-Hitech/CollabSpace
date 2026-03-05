import { THEME as T } from '../config/theme.config'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'

/* ─── Static chart data ───────────────────────── */
const tasksTrend = [
  { month: 'Sep', completed: 48, created: 65, overdue: 8 },
  { month: 'Oct', completed: 72, created: 80, overdue: 5 },
  { month: 'Nov', completed: 61, created: 74, overdue: 12 },
  { month: 'Dec', completed: 55, created: 60, overdue: 4 },
  { month: 'Jan', completed: 89, created: 95, overdue: 7 },
  { month: 'Feb', completed: 97, created: 104, overdue: 6 },
]

const teamVelocity = [
  { sprint: 'S-14', points: 42 }, { sprint: 'S-15', points: 58 },
  { sprint: 'S-16', points: 51 }, { sprint: 'S-17', points: 73 },
  { sprint: 'S-18', points: 65 }, { sprint: 'S-19', points: 80 },
  { sprint: 'S-20', points: 88 },
]

const projectDist = [
  { name: 'Website Redesign', value: 34, color: T.colors.primary.DEFAULT },
  { name: 'Mobile App v2',    value: 22, color: T.colors.teal.DEFAULT },
  { name: 'API Integration',  value: 18, color: '#fb923c' },
  { name: 'Design System',    value: 14, color: '#a855f7' },
  { name: 'Others',           value: 12, color: '#475569' },
]

const memberOutput = [
  { name: 'Raj J.',   tasks: 38, reviews: 12, comments: 24 },
  { name: 'Sneha K.', tasks: 45, reviews: 18, comments: 31 },
  { name: 'Arjun M.', tasks: 29, reviews: 8,  comments: 16 },
  { name: 'Priya K.', tasks: 52, reviews: 22, comments: 40 },
  { name: 'Mohan K.', tasks: 33, reviews: 14, comments: 19 },
]

const CSS = `
  .an-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .an-grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .an-card {
    background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border};
    border-radius: ${T.radius.lg}; padding: 20px;
  }
  .an-card-title {
    font-family: ${T.fonts.display}; font-weight: 700; font-size: 15px;
    color: ${T.colors.text.primary}; margin-bottom: 4px;
  }
  .an-card-sub {
    font-size: 12px; color: ${T.colors.text.muted}; margin-bottom: 18px;
    font-family: ${T.fonts.mono};
  }
  .an-stat-val {
    font-family: ${T.fonts.display}; font-weight: 800; font-size: 32px;
    color: ${T.colors.text.primary}; line-height: 1;
  }
  .an-stat-label { font-size: 12px; color: ${T.colors.text.secondary}; margin-top: 4px; }
  .an-stat-change { font-family: ${T.fonts.mono}; font-size: 11px; font-weight: 600;
                    border-radius: 20px; padding: 2px 8px; }
  @media (max-width: 1024px) {
    .an-grid2 { grid-template-columns: 1fr; }
    .an-grid3 { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .an-grid3 { grid-template-columns: 1fr; }
    .an-grid2 { gap: 12px; }
    .an-card  { padding: 14px; }
  }
`

/* ─── Custom tooltip ──────────────────────────── */
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

function Card({ title, sub, children }) {
  return (
    <div className="an-card">
      <p className="an-card-title">{title}</p>
      {sub && <p className="an-card-sub">{sub}</p>}
      {children}
    </div>
  )
}

function StatCard({ value, label, change, up }) {
  return (
    <div className="an-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="an-stat-val">{value}</p>
          <p className="an-stat-label">{label}</p>
        </div>
        <span className="an-stat-change" style={{
          background: up ? T.colors.success.bg : T.colors.danger.bg,
          color: up ? T.colors.success.text : T.colors.danger.text,
        }}>
          {up ? '↑' : '↓'} {change}
        </span>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const gridProps = {
    strokeDasharray: '3 3',
    stroke: T.colors.bg.border,
    vertical: false,
  }
  const axisStyle = {
    tick: { fill: T.colors.text.muted, fontSize: 11, fontFamily: T.fonts.mono },
    axisLine: false, tickLine: false,
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fonts.body }}>

        {/* Header */}
        <div className="anim-fade-up">
          <h1 style={{ fontFamily: T.fonts.display, fontWeight: 800, fontSize: 24, color: T.colors.text.primary, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: T.colors.text.secondary }}>
            Team performance insights — last 6 months
          </p>
        </div>

        {/* KPI Stats */}
        <div className="an-grid3 anim-fade-up delay-1">
          <StatCard value="97"  label="Tasks Completed (Feb)" change="18%"   up />
          <StatCard value="88"  label="Sprint Velocity (pts)" change="11pts" up />
          <StatCard value="4.2" label="Avg. Days to Close"    change="0.8d"  up={false} />
          <StatCard value="284" label="Total Active Tasks"    change="12%"   up />
          <StatCard value="14"  label="Team Members"          change="2"     up />
          <StatCard value="6"   label="Overdue Tasks"         change="3"     up={false} />
        </div>

        {/* Tasks trend — full width */}
        <div className="anim-fade-up delay-2">
          <Card title="Task Activity Trend" sub="Completed vs Created vs Overdue">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={tasksTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.colors.primary.DEFAULT} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={T.colors.primary.DEFAULT} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.colors.teal.DEFAULT} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={T.colors.teal.DEFAULT} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: T.fonts.body, fontSize: 12, color: T.colors.text.secondary }} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke={T.colors.primary.DEFAULT} fill="url(#gCompleted)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="created"   name="Created"   stroke={T.colors.teal.DEFAULT}    fill="url(#gCreated)"    strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="overdue"   name="Overdue"   stroke={T.colors.danger.text}     strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* 2-col row */}
        <div className="an-grid2 anim-fade-up delay-3">
          {/* Sprint velocity */}
          <Card title="Sprint Velocity" sub="Story points delivered per sprint">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={teamVelocity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="sprint" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="points" name="Points" fill={T.colors.primary.DEFAULT} radius={[4,4,0,0]}>
                  {teamVelocity.map((_, i) => (
                    <Cell key={i} fill={i === teamVelocity.length - 1 ? T.colors.teal.DEFAULT : T.colors.primary.DEFAULT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Project distribution */}
          <Card title="Task Distribution" sub="By project — current quarter">
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <ResponsiveContainer width="50%" height={180} style={{ minWidth: 140 }}>
                <PieChart>
                  <Pie data={projectDist} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                    dataKey="value" paddingAngle={3}>
                    {projectDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projectDist.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.fonts.body, fontSize: 12, color: T.colors.text.secondary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                    <span style={{ fontFamily: T.fonts.mono, fontSize: 11, color: T.colors.text.muted }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Member output bar chart */}
        <div className="anim-fade-up">
          <Card title="Team Member Output" sub="Tasks · Reviews · Comments — Feb 2026">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={memberOutput} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: T.fonts.body, fontSize: 12, color: T.colors.text.secondary }} />
                <Bar dataKey="tasks"    name="Tasks"    fill={T.colors.primary.DEFAULT}    radius={[3,3,0,0]} />
                <Bar dataKey="reviews"  name="Reviews"  fill={T.colors.teal.DEFAULT}        radius={[3,3,0,0]} />
                <Bar dataKey="comments" name="Comments" fill={T.colors.accent.DEFAULT}      radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

      </div>
    </>
  )
}