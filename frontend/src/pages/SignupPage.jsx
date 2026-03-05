import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { signupUser, selLoading } from '../redux/slices/authSlice'

const Ic = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, display:'block' }}>{children}</svg>
)
const EyeIco    = () => <Ic><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ic>
const EyeOffIco = () => <Ic><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></Ic>
const MailIco   = () => <Ic><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Ic>
const LockIco   = () => <Ic><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ic>
const UserIco   = () => <Ic><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ic>
const CheckIco  = () => <Ic size={12}><polyline points="20 6 9 17 4 12"/></Ic>
const BriefIco  = () => <Ic><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Ic>

const CSS = `
  .sp-wrap{min-height:100vh;display:flex;background:${T.colors.bg.page};font-family:${T.fonts.body};position:relative;overflow:hidden;}
  .sp-blob1{position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 70%);top:-300px;right:-200px;pointer-events:none;}
  .sp-blob2{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(20,184,166,0.07) 0%,transparent 70%);bottom:-200px;left:-150px;pointer-events:none;}
  .sp-left{width:40%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 48px;background:linear-gradient(145deg,rgba(99,102,241,0.07) 0%,rgba(20,184,166,0.03) 100%);border-right:1px solid ${T.colors.bg.border};position:relative;overflow:hidden;}
  .sp-left-grid{position:absolute;inset:0;background-image:linear-gradient(${T.colors.bg.border} 1px,transparent 1px),linear-gradient(90deg,${T.colors.bg.border} 1px,transparent 1px);background-size:40px 40px;opacity:0.3;}
  .sp-right{flex:1;display:flex;align-items:center;justify-content:center;padding:40px;position:relative;z-index:1;}
  .sp-card{width:100%;max-width:460px;background:${T.colors.bg.card};border:1px solid ${T.colors.bg.border};border-radius:${T.radius.xl};padding:40px;box-shadow:0 24px 80px rgba(0,0,0,0.5);animation:fadeUp 0.4s ease both;}
  .sp-input-wrap{position:relative;display:flex;align-items:center;}
  .sp-input-ico{position:absolute;left:14px;color:${T.colors.text.muted};pointer-events:none;display:flex;}
  .sp-input{width:100%;padding:11px 14px 11px 42px;background:${T.colors.bg.elevated};border:1px solid ${T.colors.bg.border};border-radius:${T.radius.md};outline:none;font-family:${T.fonts.body};font-size:14px;color:${T.colors.text.primary};transition:all 0.2s ease;}
  .sp-input:focus{border-color:${T.colors.primary.DEFAULT};box-shadow:0 0 0 3px rgba(99,102,241,0.14);}
  .sp-input::placeholder{color:${T.colors.text.muted};}
  .sp-input.error{border-color:${T.colors.danger.text};box-shadow:0 0 0 3px rgba(248,113,113,0.12);}
  .sp-select{appearance:none; cursor:pointer; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 14px center; background-size: 14px;}
  .sp-eye{position:absolute;right:12px;background:none;border:none;cursor:pointer;color:${T.colors.text.muted};display:flex;padding:4px;}
  .sp-submit{width:100%;padding:12px;background:${T.gradients.brand};color:#fff;border:none;border-radius:${T.radius.md};font-family:${T.fonts.body};font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;}
  .sp-submit:hover{opacity:0.9;box-shadow:${T.shadows.glow};transform:translateY(-1px);}
  .sp-submit:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
  .sp-err{font-size:11px;color:${T.colors.danger.text};margin-top:4px;}
  .sp-pw-rule{display:flex;align-items:center;gap:6px;font-size:11px;}
  .sp-step{flex:1;height:3px;border-radius:2px;transition:all 0.3s ease;}
  @media(max-width:768px){.sp-left{display:none;}.sp-right{padding:24px 20px;}.sp-card{padding:28px 22px;}}
`
const BENEFITS = [
  { emoji:'🚀', title:'Get started in 60 seconds', desc:'No credit card required' },
  { emoji:'🤝', title:'Invite your whole team',    desc:'Unlimited members on free plan' },
  { emoji:'📈', title:'See results immediately',   desc:'Charts and insights from day one' },
  { emoji:'🔐', title:'Your data stays yours',     desc:'GDPR compliant & encrypted at rest' },
]
const strengthColors = ['', T.colors.danger.text, T.colors.warning.text, T.colors.priority.medium, T.colors.success.text]
const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

function PwRule({ pass, label }) {
  return (
    <span className="sp-pw-rule" style={{ color: pass ? T.colors.success.text : T.colors.text.muted }}>
      <span style={{ width:14, height:14, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:pass ? T.colors.success.bg : T.colors.bg.elevated, border:`1px solid ${pass ? T.colors.success.text : T.colors.bg.border}` }}>
        {pass && <CheckIco />}
      </span>
      {label}
    </span>
  )
}

export default function SignupPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading  = useSelector(selLoading)
  
  // Added 'role' to initial state
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', role:'' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const pw = form.password
  const pwRules = { length: pw.length >= 8, upper: /[A-Z]/.test(pw), number: /[0-9]/.test(pw), special: /[^A-Za-z0-9]/.test(pw) }
  const pwStrength = Object.values(pwRules).filter(Boolean).length

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Full name (min 2 chars) required'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))  e.email = 'Valid email required'
    if (!form.role) e.role = 'Please select your role' // Role validation
    if (!pw || pw.length < 8) e.password = 'At least 8 characters'
    else if (!pwRules.upper)  e.password = 'Must include uppercase'
    else if (!pwRules.number) e.password = 'Must include a number'
    if (!form.confirm)           e.confirm = 'Please confirm password'
    else if (form.confirm !== pw) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async ev => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    
    // Passing all 4 items to dispatch
    const res = await dispatch(signupUser({ 
        name: form.name, 
        email: form.email, 
        password: form.password, 
        role: form.role 
    }))
    if (res.meta.requestStatus === 'fulfilled') navigate('/verify-email')
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="sp-wrap">
        <div className="sp-blob1" /><div className="sp-blob2" />
        <div className="sp-left">
          <div className="sp-left-grid" />
          <div style={{ position:'relative', zIndex:1, maxWidth:340 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:T.gradients.brand, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/><rect x="10.5" y="1.5" width="6" height="6" rx="1.5" fill="white" opacity="0.65"/><rect x="1.5" y="10.5" width="6" height="6" rx="1.5" fill="white" opacity="0.65"/><rect x="10.5" y="10.5" width="6" height="6" rx="1.5" fill="white" opacity="0.4"/></svg>
              </div>
              <span style={{ fontFamily:T.fonts.display, fontWeight:700, fontSize:20, color:T.colors.text.primary }}>Collab<span style={{ color:T.colors.teal.DEFAULT }}>Space</span></span>
            </div>
            <h2 style={{ fontFamily:T.fonts.display, fontWeight:800, fontSize:28, color:T.colors.text.primary, lineHeight:1.2, marginBottom:8, letterSpacing:'-0.02em' }}>Join 12,000+ teams shipping faster</h2>
            <p style={{ fontSize:14, color:T.colors.text.secondary, marginBottom:32, lineHeight:1.7 }}>Free forever for small teams.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {BENEFITS.map(b => (
                <div key={b.title} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <span style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{b.emoji}</span>
                  <div><p style={{ fontFamily:T.fonts.display, fontWeight:600, fontSize:14, color:T.colors.text.primary }}>{b.title}</p><p style={{ fontSize:12, color:T.colors.text.secondary }}>{b.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sp-right">
          <div className="sp-card">
            <h1 style={{ fontFamily:T.fonts.display, fontWeight:800, fontSize:22, color:T.colors.text.primary, marginBottom:4, letterSpacing:'-0.02em' }}>Create your account</h1>
            <p style={{ fontSize:13, color:T.colors.text.secondary, marginBottom:24 }}>Already have one?{' '}<Link to="/login" style={{ color:T.colors.primary[400], fontWeight:600, textDecoration:'none' }}>Sign in →</Link></p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:T.colors.text.secondary, marginBottom:6 }}>Full name</label>
                <div className="sp-input-wrap"><span className="sp-input-ico"><UserIco /></span><input className={`sp-input${errors.name?' error':''}`} type="text" placeholder="John Smith" value={form.name} onChange={e => set('name', e.target.value)} /></div>
                {errors.name && <p className="sp-err">{errors.name}</p>}
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:T.colors.text.secondary, marginBottom:6 }}>Work email</label>
                <div className="sp-input-wrap"><span className="sp-input-ico"><MailIco /></span><input className={`sp-input${errors.email?' error':''}`} type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
                {errors.email && <p className="sp-err">{errors.email}</p>}
              </div>

              {/* NEW ROLE DROPDOWN */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:T.colors.text.secondary, marginBottom:6 }}>Your Role</label>
                <div className="sp-input-wrap">
                  <span className="sp-input-ico"><BriefIco /></span>
                  <select 
                    className={`sp-input sp-select${errors.role?' error':''}`} 
                    value={form.role} 
                    onChange={e => set('role', e.target.value)}
                  >
                    <option value="" disabled>Select your role</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Developer</option>
                    <option value="Employee">Manager</option>
                  </select>
                </div>
                {errors.role && <p className="sp-err">{errors.role}</p>}
              </div>

              <div style={{ marginBottom:8 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:T.colors.text.secondary, marginBottom:6 }}>Password</label>
                <div className="sp-input-wrap"><span className="sp-input-ico"><LockIco /></span><input className={`sp-input${errors.password?' error':''}`} type={showPw?'text':'password'} placeholder="Create a strong password" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingRight:44 }} /><button type="button" className="sp-eye" onClick={() => setShowPw(p=>!p)}>{showPw?<EyeOffIco/>:<EyeIco/>}</button></div>
                {errors.password && <p className="sp-err">{errors.password}</p>}
              </div>

              {pw && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', gap:4, marginBottom:8 }}>{[1,2,3,4].map(i => <div key={i} className="sp-step" style={{ background: i<=pwStrength ? strengthColors[pwStrength] : T.colors.bg.border }} />)}</div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}><PwRule pass={pwRules.length} label="8+ chars" /><PwRule pass={pwRules.upper} label="Uppercase" /><PwRule pass={pwRules.number} label="Number" /><PwRule pass={pwRules.special} label="Symbol" /></div>
                </div>
              )}

              <div style={{ marginBottom:22 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:T.colors.text.secondary, marginBottom:6 }}>Confirm password</label>
                <div className="sp-input-wrap"><span className="sp-input-ico"><LockIco /></span><input className={`sp-input${errors.confirm?' error':''}`} type={showPw?'text':'password'} placeholder="Re-enter your password" value={form.confirm} onChange={e => set('confirm', e.target.value)} /></div>
                {errors.confirm && <p className="sp-err">{errors.confirm}</p>}
              </div>

              <button className="sp-submit" type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create Account →'}</button>
              <p style={{ textAlign:'center', fontSize:11, color:T.colors.text.muted, marginTop:14 }}>By signing up you agree to our <a href="#" style={{ color:T.colors.primary[400], textDecoration:'none' }}>Terms</a> & <a href="#" style={{ color:T.colors.primary[400], textDecoration:'none' }}>Privacy Policy</a>.</p>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}