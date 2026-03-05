import { useState } from 'react'
import { THEME as T } from '../../config/theme.config'

const LINKS = {
  Product  : [
    { label: 'Features',      badge: null },
    { label: 'Pricing',       badge: null },
    { label: 'Changelog',     badge: 'New' },
    { label: 'Roadmap',       badge: null },
    { label: 'Integrations',  badge: null },
    { label: 'API Docs',      badge: null },
  ],
  Resources: [
    { label: 'Documentation', badge: null },
    { label: 'Tutorials',     badge: null },
    { label: 'Blog',          badge: null },
    { label: 'Templates',     badge: 'Free' },
    { label: 'Community',     badge: null },
    { label: 'Open Source',   badge: null },
  ],
  Company  : [
    { label: 'About Us',      badge: null },
    { label: 'Careers',       badge: 'Hiring' },
    { label: 'Press Kit',     badge: null },
    { label: 'Partners',      badge: null },
    { label: 'Contact',       badge: null },
    { label: 'Security',      badge: null },
  ],
}

const SOCIAL = [
  { label: 'GitHub', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg> },
  { label: 'Twitter', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { label: 'LinkedIn', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { label: 'YouTube', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23.499 6.203A3.048 3.048 0 0 0 21.37 4.06C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.37.56A3.048 3.048 0 0 0 .501 6.203C0 8.05 0 11.9 0 11.9s0 3.85.501 5.697a3.048 3.048 0 0 0 2.129 2.143C4.46 20.3 12 20.3 12 20.3s7.54 0 9.37-.56a3.048 3.048 0 0 0 2.129-2.143C24 15.75 24 11.9 24 11.9s0-3.85-.501-5.697zM9.745 15.568V8.232l6.263 3.668-6.263 3.668z"/></svg> },
]

const FOOTER_CSS = `
  .ft-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
    gap: 40px;
    padding: 48px 32px 32px;
    max-width: ${T.layout.maxW}; margin: 0 auto;
  }
  .ft-link {
    display: flex; align-items: center; gap: 6px;
    color: ${T.colors.text.secondary}; font-family: ${T.fonts.body};
    font-size: 13px; text-decoration: none; transition: ${T.tr.fast};
    width: fit-content;
  }
  .ft-link:hover { color: ${T.colors.text.primary}; }
  .ft-social {
    width: 34px; height: 34px; display: flex; align-items: center;
    justify-content: center; border-radius: ${T.radius.md};
    background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border};
    color: ${T.colors.text.secondary}; text-decoration: none;
    transition: ${T.tr.fast}; flex-shrink: 0;
  }
  .ft-social:hover {
    background: ${T.colors.bg.hover};
    color: ${T.colors.text.primary};
    border-color: ${T.colors.primary.DEFAULT};
  }
  .ft-bottom {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
    padding: 16px 32px;
    max-width: ${T.layout.maxW}; margin: 0 auto;
    border-top: 1px solid ${T.colors.bg.border};
  }
  .ft-bottom-links { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }
  .ft-bottom-link {
    font-size: 12px; color: ${T.colors.text.muted};
    text-decoration: none; font-family: ${T.fonts.body}; transition: ${T.tr.fast};
  }
  .ft-bottom-link:hover { color: ${T.colors.text.secondary}; }
  .ft-nl-wrap {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
    padding: 18px 24px; border-radius: ${T.radius.lg};
    background: ${T.gradients.brandSoft};
    border: 1px solid rgba(99,102,241,0.18);
    margin: 0 32px 28px;
    max-width: calc(${T.layout.maxW} - 64px);
    margin-left: auto; margin-right: auto;
  }
  /* Tablet ≤ 1024 */
  @media (max-width: 1024px) {
    .ft-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
    .ft-brand-col { grid-column: span 2; }
  }
  /* Mobile ≤ 640px */
  @media (max-width: 640px) {
    .ft-grid { grid-template-columns: 1fr 1fr; gap: 24px; padding: 32px 20px 24px; }
    .ft-brand-col { grid-column: span 2; }
    .ft-bottom { flex-direction: column; align-items: flex-start; padding: 16px 20px; }
    .ft-bottom-links { gap: 14px; }
    .ft-nl-wrap { margin: 0 20px 24px; padding: 16px; flex-direction: column; align-items: flex-start; }
    .ft-nl-row { width: 100% !important; }
    .ft-nl-input { width: 100% !important; }
  }
  /* Very small ≤ 400px */
  @media (max-width: 400px) {
    .ft-grid { grid-template-columns: 1fr; }
    .ft-brand-col { grid-column: span 1; }
  }
`

function FtLink({ label, badge }) {
  return (
    <a href="#" className="ft-link" onClick={e => e.preventDefault()}>
      {label}
      {badge && (
        <span style={{
          fontFamily: T.fonts.mono, fontSize: 9, fontWeight: 600,
          background: ['New','Hiring'].includes(badge) ? 'rgba(20,184,166,0.15)' : 'rgba(99,102,241,0.15)',
          color: ['New','Hiring'].includes(badge) ? T.colors.teal.DEFAULT : T.colors.primary[400],
          borderRadius: T.radius.sm, padding: '2px 5px',
        }}>{badge}</span>
      )}
    </a>
  )
}

export default function Footer() {
  const [email, setEmail] = useState('')
  return (
    <>
      <style>{FOOTER_CSS}</style>
      <footer style={{
        background: T.colors.bg.sidebar,
        borderTop: `1px solid ${T.colors.bg.border}`,
        fontFamily: T.fonts.body,
      }}>

        {/* Main grid */}
        <div className="ft-grid">
          {/* Brand col */}
          <div className="ft-brand-col">
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, background: T.gradients.brand,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: T.shadows.glowS, flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                  <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" fill="white" opacity="0.65"/>
                  <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" fill="white" opacity="0.65"/>
                  <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" fill="white" opacity="0.4"/>
                </svg>
              </div>
              <span style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 17, color: T.colors.text.primary }}>
                Collab<span style={{ color: T.colors.teal.DEFAULT }}>Space</span>
              </span>
            </div>

            <p style={{ fontSize: 13, color: T.colors.text.secondary, lineHeight: 1.75, marginBottom: 18, maxWidth: 240 }}>
              The all-in-one platform for teams to manage projects, collaborate in real-time, and ship faster.
            </p>

            {/* Social links */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {SOCIAL.map(s => (
                <a key={s.label} href="#" className="ft-social" title={s.label} onClick={e => e.preventDefault()}>
                  {s.svg}
                </a>
              ))}
            </div>

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: T.fonts.mono, fontSize: 11, color: T.colors.text.muted }}>
              <span className="anim-status" style={{ width: 7, height: 7, borderRadius: '50%', background: T.colors.teal.DEFAULT, flexShrink: 0, display: 'block' }} />
              All systems operational
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <p style={{ fontFamily: T.fonts.display, fontSize: 13, fontWeight: 700, color: T.colors.text.primary, marginBottom: 16 }}>
                {section}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map(l => <FtLink key={l.label} {...l} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="ft-nl-wrap">
          <div>
            <p style={{ fontFamily: T.fonts.display, fontWeight: 700, fontSize: 15, color: T.colors.text.primary, marginBottom: 3 }}>
              Stay in the loop
            </p>
            <p style={{ fontSize: 13, color: T.colors.text.secondary }}>
              Weekly updates, tips & insights.
            </p>
          </div>
          <div className="ft-nl-row" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="ft-nl-input"
              style={{
                background: T.colors.bg.card, border: `1px solid ${T.colors.bg.border}`,
                borderRadius: T.radius.md, padding: '9px 14px',
                fontFamily: T.fonts.body, fontSize: 13, color: T.colors.text.primary,
                outline: 'none', width: 200,
              }}
              onFocus={e => e.target.style.borderColor = T.colors.primary.DEFAULT}
              onBlur={e => e.target.style.borderColor = T.colors.bg.border}
            />
            <button style={{
              background: T.gradients.brand, color: '#fff', border: 'none',
              borderRadius: T.radius.md, padding: '9px 18px',
              fontFamily: T.fonts.body, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: T.tr.fast, whiteSpace: 'nowrap', flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.boxShadow = T.shadows.glow }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = 'none' }}
            >Subscribe</button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="ft-bottom">
          <p style={{ fontSize: 12, color: T.colors.text.muted }}>
            © {new Date().getFullYear()}{' '}
            <a href="#" style={{ color: T.colors.primary[400], textDecoration: 'none' }}>CollabSpace Inc.</a>{' '}
            All rights reserved.
          </p>
          <div className="ft-bottom-links">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map(l => (
              <a key={l} href="#" className="ft-bottom-link" onClick={e => e.preventDefault()}>{l}</a>
            ))}
          </div>
          <span style={{
            fontFamily: T.fonts.mono, fontSize: 11, color: T.colors.text.muted,
            background: T.colors.bg.elevated, border: `1px solid ${T.colors.bg.border}`,
            borderRadius: T.radius.sm, padding: '3px 8px', whiteSpace: 'nowrap',
          }}>v2.4.1</span>
        </div>
      </footer>
    </>
  )
}