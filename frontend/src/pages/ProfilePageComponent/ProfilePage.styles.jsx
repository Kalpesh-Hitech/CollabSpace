import { THEME as T } from "../../config/theme.config";

export const CSS = `
  .pf-wrap { font-family: ${T.fonts.body}; max-width: 860px; margin: 0 auto; padding: 20px; }
  .pf-card { background: ${T.colors.bg.card}; border: 1px solid ${T.colors.bg.border}; border-radius: ${T.radius.xl}; overflow: hidden; margin-bottom: 20px; }
  .pf-card-header { padding: 20px 24px; border-bottom: 1px solid ${T.colors.bg.border}; display: flex; align-items: center; gap: 12px; }
  .pf-card-body { padding: 24px; }
  .pf-input-wrap { position: relative; display: flex; align-items: center; width: 100%; }
  .pf-input-ico { position: absolute; left: 14px; color: ${T.colors.text.muted}; pointer-events: none; display: flex; z-index: 1; }
  .pf-input {
    width: 100%; padding: 11px 14px 11px 42px;
    background: ${T.colors.bg.elevated}; border: 1px solid ${T.colors.bg.border};
    border-radius: ${T.radius.md}; outline: none;
    font-family: ${T.fonts.body}; font-size: 14px; color: ${T.colors.text.primary};
    transition: all 0.2s ease; box-sizing: border-box;
  }
  .pf-input:focus { border-color: ${T.colors.primary.DEFAULT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
  .pf-eye { position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: ${T.colors.text.muted}; display: flex; padding: 4px; z-index: 2; }
  .pf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border: none; border-radius: ${T.radius.md}; font-size: 13px; font-weight: 600; cursor: pointer; }
  .pf-btn-primary { background: ${T.gradients.brand}; color: #fff; }
  .pf-btn-outline { background: transparent; color: ${T.colors.text.secondary}; border: 1px solid ${T.colors.bg.border}; }
  .pf-label { display: block; font-size: 13px; font-weight: 500; color: ${T.colors.text.secondary}; margin-bottom: 6px; }
  .pf-field { margin-bottom: 18px; }
  .pf-otp-digit { width: 46px; height: 54px; text-align: center; background: ${T.colors.bg.elevated}; border: 2px solid ${T.colors.bg.border}; border-radius: ${T.radius.md}; font-size: 22px; font-weight: 700; color: ${T.colors.text.primary}; outline: none; }
  .pf-tag { display: inline-flex; align-items: center; gap: 6px; font-family: ${T.fonts.mono}; font-size: 11px; font-weight: 500; padding: 4px 10px; border-radius: ${T.radius.full}; }
`;

export const Ic = ({ size = 18, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
    {children}
  </svg>
);