import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { signinUser, selLoading } from '../redux/slices/authSlice'

const Ic = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>{children}</svg>
)
const EyeIco  = () => <Ic><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ic>
const EyeOffIco=() => <Ic><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></Ic>
const MailIco = () => <Ic><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Ic>
const LockIco = () => <Ic><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ic>

const CSS = `
  .lp-wrap{min-height:100vh;display:flex;background:${T.colors.bg.page};font-family:${T.fonts.body};position:relative;overflow:hidden;}
  .lp-blob1{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%);top:-200px;left:-200px;pointer-events:none;}
  .lp-blob2{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(20,184,166,0.08) 0%,transparent 70%);bottom:-150px;right:-150px;pointer-events:none;}
  .lp-left{flex:1;display:flex;align-items:center;justify-content:center;padding:40px;position:relative;z-index:1;}
  .lp-right{width:44%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 48px;background:linear-gradient(145deg,rgba(99,102,241,0.08) 0%,rgba(124,58,237,0.04) 100%);border-left:1px solid ${T.colors.bg.border};position:relative;overflow:hidden;}
  .lp-right-grid{position:absolute;inset:0;background-image:linear-gradient(${T.colors.bg.border} 1px,transparent 1px),linear-gradient(90deg,${T.colors.bg.border} 1px,transparent 1px);background-size:40px 40px;opacity:0.35;}
  .lp-card{width:100%;max-width:420px;background:${T.colors.bg.card};border:1px solid ${T.colors.bg.border};border-radius:${T.radius.xl};padding:40px;box-shadow:0 24px 80px rgba(0,0,0,0.5);animation:fadeUp 0.4s ease both;}
  .lp-input-wrap{position:relative;display:flex;align-items:center;}
  .lp-input-ico{position:absolute;left:14px;color:${T.colors.text.muted};pointer-events:none;display:flex;}
  .lp-input{width:100%;padding:11px 14px 11px 42px;background:${T.colors.bg.elevated};border:1px solid ${T.colors.bg.border};border-radius:${T.radius.md};outline:none;font-family:${T.fonts.body};font-size:14px;color:${T.colors.text.primary};transition:all 0.2s ease;}
  .lp-input:focus{border-color:${T.colors.primary.DEFAULT};box-shadow:0 0 0 3px rgba(99,102,241,0.14);}
  .lp-input::placeholder{color:${T.colors.text.muted};}
  .lp-input.error{border-color:${T.colors.danger.text};box-shadow:0 0 0 3px rgba(248,113,113,0.12);}
  .lp-eye{position:absolute;right:12px;background:none;border:none;cursor:pointer;color:${T.colors.text.muted};display:flex;padding:4px;}
  .lp-eye:hover{color:${T.colors.text.secondary};}
  .lp-submit{width:100%;padding:12px;background:${T.gradients.brand};color:#fff;border:none;border-radius:${T.radius.md};font-family:${T.fonts.body};font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;letter-spacing:0.01em;}
  .lp-submit:hover{opacity:0.9;box-shadow:${T.shadows.glow};transform:translateY(-1px);}
  .lp-submit:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
  .lp-divider{display:flex;align-items:center;gap:12px;color:${T.colors.text.muted};font-size:12px;}
  .lp-divider::before,.lp-divider::after{content:'';flex:1;height:1px;background:${T.colors.bg.border};}
  .lp-err{font-size:11px;color:${T.colors.danger.text};margin-top:4px;}
  .lp-chip{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border:1px solid ${T.colors.bg.border};border-radius:${T.radius.lg};padding:14px 18px;}
  @media(max-width:768px){.lp-right{display:none;}.lp-left{padding:24px 20px;}.lp-card{padding:28px 22px;}}
`
const FEATURES = [
  { emoji: '⚡', title: 'Real-time Collaboration', desc: 'Work together seamlessly across time zones' },
  { emoji: '📊', title: 'Powerful Analytics',      desc: 'Track progress with beautiful charts' },
  { emoji: '🔒', title: 'Enterprise Security',     desc: 'SOC2 compliant, end-to-end encrypted' },
]

export default function LoginPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const loading   = useSelector(selLoading)
  const [form,    setForm]   = useState({ email: '', password: '' })
  const [errors,  setErrors] = useState({})
  const [showPw,  setShowPw] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.email)                            e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Enter a valid email'
    if (!form.password)                         e.password = 'Password is required'
    return e
  }

  const handleSubmit = async ev => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const res = await dispatch(signinUser({ email: form.email, password: form.password }))
    if (res.meta.requestStatus === 'fulfilled') navigate('/dashboard')
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-wrap">
        <div className="lp-blob1" /><div className="lp-blob2" />
        <div className="lp-left">
          <div className="lp-card">
            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:T.gradients.brand, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/><rect x="10.5" y="1.5" width="6" height="6" rx="1.5" fill="white" opacity="0.65"/><rect x="1.5" y="10.5" width="6" height="6" rx="1.5" fill="white" opacity="0.65"/><rect x="10.5" y="10.5" width="6" height="6" rx="1.5" fill="white" opacity="0.4"/></svg>
              </div>
              <span style={{ fontFamily:T.fonts.display, fontWeight:700, fontSize:20, color:T.colors.text.primary, letterSpacing:'-0.02em' }}>Collab<span style={{ color:T.colors.teal.DEFAULT }}>Space</span></span>
            </div>
            <h1 style={{ fontFamily:T.fonts.display, fontWeight:800, fontSize:24, color:T.colors.text.primary, marginBottom:6, letterSpacing:'-0.02em' }}>Welcome back</h1>
            <p style={{ fontSize:14, color:T.colors.text.secondary, marginBottom:28 }}>Sign in to your workspace</p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:T.colors.text.secondary, marginBottom:6 }}>Email address</label>
                <div className="lp-input-wrap">
                  <span className="lp-input-ico"><MailIco /></span>
                  <input className={`lp-input${errors.email ? ' error' : ''}`} type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
                </div>
                {errors.email && <p className="lp-err">{errors.email}</p>}
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:T.colors.text.secondary, marginBottom:6 }}>Password</label>
                <div className="lp-input-wrap">
                  <span className="lp-input-ico"><LockIco /></span>
                  <input className={`lp-input${errors.password ? ' error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingRight:44 }} autoComplete="current-password" />
                  <button type="button" className="lp-eye" onClick={() => setShowPw(p => !p)}>{showPw ? <EyeOffIco /> : <EyeIco />}</button>
                </div>
                {errors.password && <p className="lp-err">{errors.password}</p>}
              </div>
              <button className="lp-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In →'}</button>
            </form>

            <div style={{ marginTop:24 }}>
              <div className="lp-divider" style={{ marginBottom:16 }}>need access?</div>
              <p style={{ textAlign:'center', fontSize:13, color:T.colors.text.secondary }}>Contact your administrator to get an account.</p>
            </div>
          </div>
        </div>

        <div className="lp-right">
          <div className="lp-right-grid" />
          <div style={{ position:'relative', zIndex:1, maxWidth:380 }}>
            <div style={{ marginBottom:40 }}>
              <p style={{ fontFamily:T.fonts.mono, fontSize:11, color:T.colors.primary[400], letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>Trusted by 12,000+ teams</p>
              <h2 style={{ fontFamily:T.fonts.display, fontWeight:800, fontSize:32, color:T.colors.text.primary, lineHeight:1.2, letterSpacing:'-0.02em' }}>Ship faster with your whole team on the same page</h2>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:40 }}>
              {FEATURES.map(f => (
                <div key={f.title} className="lp-chip">
                  <span style={{ fontSize:22, flexShrink:0 }}>{f.emoji}</span>
                  <div><p style={{ fontFamily:T.fonts.display, fontWeight:700, fontSize:14, color:T.colors.text.primary, marginBottom:2 }}>{f.title}</p><p style={{ fontSize:12, color:T.colors.text.secondary }}>{f.desc}</p></div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex' }}>
                {['RJ','SK','AM','PK','MK'].map((init, i) => (
                  <div key={init} style={{ width:32, height:32, borderRadius:'50%', background:T.gradients.brand, marginLeft:i===0?0:-8, border:`2px solid ${T.colors.bg.sidebar}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fonts.display, fontWeight:700, fontSize:10, color:'#fff' }}>{init}</div>
                ))}
              </div>
              <p style={{ fontSize:13, color:T.colors.text.secondary }}><strong style={{ color:T.colors.text.primary }}>2,400+</strong> teams joined this month</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}