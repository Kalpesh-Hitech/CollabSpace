import { useState, useEffect } from 'react'
import Header from '../common/Header'
import Sidebar from '../common/Sidebar'
import Footer from '../common/Footer'
import { THEME as T } from '../../config/theme.config'
import PropTypes from 'prop-types'
export default function Layout({ children }) {
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile,   setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      // Auto-close mobile sidebar on resize to desktop
      if (!mobile) setMobileOpen(false)
      // Auto-collapse sidebar on small desktop
      if (window.innerWidth < 1100 && window.innerWidth > 768) setCollapsed(true)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) setMobileOpen(o => !o)
    else setCollapsed(o => !o)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh',
      background: T.colors.bg.page,
      fontFamily: T.fonts.body,
    }}>
      {/* STICKY HEADER */}
      <Header onToggleSidebar={toggleSidebar} />

      {/* BODY: sidebar + main */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>

        {/* SIDEBAR */}
        <Sidebar
          collapsed={collapsed && !isMobile}
          mobileOpen={mobileOpen}
          onOverlayClick={() => setMobileOpen(false)}
        />

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <main className="anim-fade-up" style={{
            flex: 1,
            padding: '24px 20px',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {children}
          </main>
          <Footer />
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          main { padding: 28px 28px !important; }
        }
        @media (min-width: 1280px) {
          main { padding: 32px 36px !important; }
        }
      `}</style>
    </div>
  )
}
Layout.propTypes = {
  children: PropTypes.node.isRequired,
};