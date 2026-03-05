// ═══════════════════════════════════════════════════════════════
//  COLLABSPACE — THEME CONFIGURATION
//  Single source of truth for ALL design tokens.
//  Import wherever you need colors, fonts, spacing.
// ═══════════════════════════════════════════════════════════════

export const THEME = {

  // ─── FONTS ───────────────────────────────────────────────────
  // Plus Jakarta Sans: warm, professional, highly readable SaaS font
  // Outfit: clean display weight for numbers and headings
  // Fira Code: mono for badges, tags, version numbers
  fonts: {
    heading : "'Plus Jakarta Sans', sans-serif",
    body    : "'Plus Jakarta Sans', sans-serif",
    display : "'Outfit', sans-serif",
    mono    : "'Fira Code', monospace",
  },

  // ─── COLORS ──────────────────────────────────────────────────
  colors: {
    primary: {
      50 : '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
      300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1',
      600: '#4f46e5', 700: '#4338ca', 800: '#3730a3',
      DEFAULT: '#6366f1',
    },
    accent   : { light: '#ddd6fe', DEFAULT: '#7c3aed', dark: '#5b21b6' },
    teal     : { DEFAULT: '#14b8a6', light: '#99f6e4' },
    success  : { bg: 'rgba(20,184,166,0.1)',  text: '#2dd4bf', border: 'rgba(20,184,166,0.2)'  },
    warning  : { bg: 'rgba(251,146,60,0.1)',  text: '#fb923c', border: 'rgba(251,146,60,0.2)'  },
    danger   : { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.2)' },
    info     : { bg: 'rgba(129,140,248,0.1)', text: '#818cf8', border: 'rgba(129,140,248,0.2)' },
    priority : { urgent: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#34d399' },
    bg: {
      page    : '#0f1117',
      sidebar : '#13151f',
      card    : '#1a1d2e',
      elevated: '#1f2235',
      hover   : '#252840',
      border  : '#2d3050',
      input   : '#1a1d2e',
    },
    text: {
      primary  : '#f8fafc',
      secondary: '#94a3b8',
      muted    : '#475569',
      disabled : '#334155',
      link     : '#818cf8',
    },
    projectDots: ['#6366f1','#14b8a6','#fb923c','#a855f7','#34d399','#f87171','#fbbf24','#ec4899'],
  },

  layout: {
    headerH     : '60px',
    sidebarW    : '256px',
    sidebarCollW: '64px',
    maxW        : '1440px',
  },

  radius: { sm: '6px', md: '10px', lg: '14px', xl: '18px', full: '9999px' },

  shadows: {
    sm   : '0 1px 4px rgba(0,0,0,0.4)',
    md   : '0 4px 20px rgba(0,0,0,0.45)',
    lg   : '0 8px 40px rgba(0,0,0,0.55)',
    glow : '0 0 20px rgba(99,102,241,0.3)',
    glowS: '0 0 12px rgba(99,102,241,0.2)',
  },

  gradients: {
    brand    : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
    brandSoft: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(124,58,237,0.06) 100%)',
    teal     : 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    glow     : 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
  },

  tr: {
    fast  : 'all 0.15s ease',
    normal: 'all 0.22s cubic-bezier(.4,0,.2,1)',
    slow  : 'all 0.35s cubic-bezier(.4,0,.2,1)',
  },
}

export default THEME