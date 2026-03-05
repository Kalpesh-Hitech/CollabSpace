import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { THEME as T } from '../../config/theme.config'
import { selUser } from '../../redux/slices/authSlice'

/* ─── Icons ──────────────────────────────────────────────── */
const Ic = ({ size = 17, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: 'block' }}>{children}</svg>
)
const Icons = {
  Dashboard : () => <Ic><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ic>,
  Tasks     : () => <Ic><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Ic>,
  Teams     : () => <Ic><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ic>,
  Users     : () => <Ic><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ic>,
  Chart     : () => <Ic><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ic>,
  TrendUp   : () => <Ic><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Ic>,
  Settings  : () => <Ic><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Ic>,
  LogOut    : () => <Ic><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ic>,
  Bell      : () => <Ic><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ic>,
  Assign    : () => <Ic><circle cx="12" cy="12" r="3"/><path d="M20 12h-4"/><path d="M4 12h4"/><path d="M12 4v4"/><path d="M12 16v4"/></Ic>,
  Bell      : () => <Ic><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ic>,
  Assign    : () => <Ic><circle cx="12" cy="12" r="3"/><path d="M20 12h-4"/><path d="M4 12h4"/><path d="M12 4v4"/><path d="M12 16v4"/></Ic>,
}

const CSS = `
  .sb-wrap {
    display: flex; flex-direction: column; flex-shrink: 0;
    background: ${T.colors.bg.sidebar};
    border-right: 1px solid ${T.colors.bg.border};
    transition: width 0.25s cubic-bezier(.4,0,.2,1), transform 0.25s cubic-bezier(.4,0,.2,1);
    overflow: hidden;
  }
  .sb-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; }
  .sb-navitem {
    position: relative; display: flex; align-items: center; gap: 10px;
    border-radius: ${T.radius.md}; cursor: pointer; text-decoration: none;
    font-family: ${T.fonts.body}; font-size: 13.5px; font-weight: 400;
    color: ${T.colors.text.secondary}; transition: ${T.tr.fast};
    padding: 9px 12px; margin: 1px 6px; white-space: nowrap;
  }
  .sb-navitem:hover { background: ${T.colors.bg.hover}; color: ${T.colors.text.primary}; }
  .sb-navitem.active {
    background: rgba(99,102,241,0.12);
    color: ${T.colors.primary[400]}; font-weight: 600;
  }
  .sb-navitem.active::before {
    content: ''; position: absolute; left: 0; top: 50%;
    transform: translateY(-50%); width: 3px; height: 55%;
    background: ${T.colors.primary.DEFAULT}; border-radius: 0 3px 3px 0;
  }
  .sb-section {
    font-family: ${T.fonts.mono}; font-size: 10px; font-weight: 500;
    color: ${T.colors.text.muted}; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 14px 18px 4px;
  }
  .sb-divider { height: 1px; background: ${T.colors.bg.border}; margin: 6px 12px; }
  .sb-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.65); z-index: 149;
    backdrop-filter: blur(2px); animation: fadeIn 0.2s ease;
  }
  .sb-role-badge {
    font-family: ${T.fonts.mono}; font-size: 9px; font-weight: 600;
    border-radius: ${T.radius.full}; padding: 2px 7px;
    background: rgba(99,102,241,0.15); color: ${T.colors.primary[400]};
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  /* Tooltip for collapsed */
  .sb-navitem[data-tip]::after {
    content: attr(data-tip); position: absolute;
    left: calc(100% + 10px); top: 50%; transform: translateY(-50%);
    background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border};
    color: ${T.colors.text.primary}; font-family: ${T.fonts.body};
    font-size: 12px; font-weight: 500; padding: 5px 10px;
    border-radius: ${T.radius.sm}; white-space: nowrap;
    pointer-events: none; opacity: 0; z-index: 9999;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4); transition: opacity 0.15s ease;
  }
  .sb-navitem[data-tip]:hover::after { opacity: 1; }
  @media (min-width: 769px) {
    .sb-wrap { position: sticky; top: ${T.layout.headerH}; height: calc(100vh - ${T.layout.headerH}); }
    .sb-overlay { display: none !important; }
  }
  @media (max-width: 768px) {
    .sb-wrap {
      position: fixed !important; top: ${T.layout.headerH}; left: 0;
      height: calc(100vh - ${T.layout.headerH}); z-index: 200;
      width: 260px !important; box-shadow: 4px 0 32px rgba(0,0,0,0.6);
    }
    .sb-wrap.mobile-hidden { transform: translateX(-100%); }
    .sb-wrap.mobile-open   { transform: translateX(0); }
    .sb-overlay.active { display: block; }
    .sb-navitem[data-tip]::after { display: none; }
  }
`

function NavItem({ icon: Ico, label, to, active, collapsed }) {
  const navigate = useNavigate()
  const tip = collapsed ? label : undefined
  return (
    <div
      className={`sb-navitem${active ? ' active' : ''}`}
      data-tip={tip}
      onClick={() => navigate(to)}
      style={{
        justifyContent: collapsed ? 'center' : undefined,
        padding: collapsed ? '10px' : undefined,
        margin: collapsed ? '1px 10px' : undefined,
        gap: collapsed ? 0 : 10,
      }}
    >
      {collapsed && active && (
        <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: '55%', background: T.colors.primary.DEFAULT, borderRadius: '0 3px 3px 0' }} />
      )}
      {Ico && (
        <span style={{ color: active ? T.colors.primary[400] : 'currentColor', display: 'flex', flexShrink: 0 }}>
          <Ico />
        </span>
      )}
      {!collapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
    </div>
  )
}

export default function Sidebar({ collapsed, mobileOpen, onOverlayClick }) {
  const location = useLocation()
  const user     = useSelector(selUser)
  const role     = (user?.role || '').toLowerCase()
  const path     = location.pathname

  const name     = user?.name  || user?.email?.split('@')[0] || 'User'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  // Role-based nav items
  const mainNav = [
    { icon: Icons.Dashboard, label: 'Dashboard',    to: '/dashboard',    roles: ['admin','manager','employee'] },
    { icon: Icons.Tasks,     label: 'All Tasks',    to: '/tasks',        roles: ['admin','manager'] },
    { icon: Icons.Tasks,     label: 'My Tasks',     to: '/my-tasks',     roles: ['admin','manager','employee'] },
    { icon: Icons.Assign,    label: 'Assign Tasks', to: '/assign',       roles: ['admin','manager'] },
    { icon: Icons.Teams,     label: 'Teams',        to: '/teams',        roles: ['admin','manager','employee'] },
    { icon: Icons.Users,     label: 'Users',        to: '/users',        roles: ['admin','manager'] },
    { icon: Icons.Bell,      label: 'Notifications',to: '/notifications',roles: ['admin','manager','employee'] },
  ]

  const analyticsNav = [
    { icon: Icons.Chart,   label: 'Analytics', to: '/analytics', roles: ['admin','manager','employee'] },
    { icon: Icons.TrendUp, label: 'Reports',   to: '/report',    roles: ['admin','manager'] },
  ]

  const settingsNav = [
    { icon: Icons.Settings, label: 'Profile', to: '/profile', roles: ['admin','manager','employee'] },
  ]

  // Show all items if role not yet loaded; AuthSync in App.jsx will update
  const filtered = (items) => !role ? items : items.filter(i => i.roles.includes(role))

  return (
    <>
      <style>{CSS}</style>
      <div className={`sb-overlay${mobileOpen ? ' active' : ''}`} onClick={onOverlayClick} />

      <aside
        className={`sb-wrap${mobileOpen ? ' mobile-open' : ' mobile-hidden'}`}
        style={{ width: collapsed ? T.layout.sidebarCollW : T.layout.sidebarW }}
      >
        {/* Workspace header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
          padding: collapsed ? '12px 10px' : '12px 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: `1px solid ${T.colors.bg.border}`, flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: T.radius.md, background: T.gradients.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fonts.display, fontWeight: 700, fontSize: 13, color: '#fff',
            flexShrink: 0, boxShadow: T.shadows.glowS,
          }}>CS</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: T.fonts.display, fontSize: 13, fontWeight: 700, color: T.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>CollabSpace HQ</p>
              <p style={{ fontFamily: T.fonts.mono, fontSize: 10, color: T.colors.teal.DEFAULT, marginTop: 2 }}>Pro Plan</p>
            </div>
          )}
        </div>

        <div className="sb-scroll">
          {/* MAIN */}
          {!collapsed && <p className="sb-section">Main</p>}
          {filtered(mainNav).map(item => (
            <NavItem key={item.to} {...item} active={path === item.to} collapsed={collapsed} />
          ))}

          <div className="sb-divider" />

          {/* ANALYTICS */}
          {!collapsed && <p className="sb-section">Analytics</p>}
          {filtered(analyticsNav).map(item => (
            <NavItem key={item.to} {...item} active={path === item.to} collapsed={collapsed} />
          ))}

          <div className="sb-divider" />

          {/* SETTINGS */}
          {!collapsed && <p className="sb-section">Account</p>}
          {filtered(settingsNav).map(item => (
            <NavItem key={item.to} {...item} active={path === item.to} collapsed={collapsed} />
          ))}

          <div style={{ height: 12 }} />
        </div>

        {/* User card at bottom */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
          padding: collapsed ? '12px 10px' : '12px 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderTop: `1px solid ${T.colors.bg.border}`, flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: T.gradients.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fonts.display, fontWeight: 700, fontSize: 11, color: '#fff', flexShrink: 0,
          }}>{initials}</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: T.fonts.body, fontSize: 13, fontWeight: 600, color: T.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
              {role && <span className="sb-role-badge">{role}</span>}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}