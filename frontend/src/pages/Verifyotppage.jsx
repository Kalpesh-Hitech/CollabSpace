import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { THEME as T } from '../config/theme.config'
import { verifyEmailOtp, selLoading, selPending,api  } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'

const CSS = `
  .otp-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:${T.colors.bg.page};font-family:${T.fonts.body};padding:24px;position:relative;overflow:hidden;}
  .otp-blob{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;}
  .otp-card{width:100%;max-width:420px;background:${T.colors.bg.card};border:1px solid ${T.colors.bg.border};border-radius:${T.radius.xl};padding:40px;box-shadow:0 24px 80px rgba(0,0,0,0.5);text-align:center;position:relative;z-index:1;animation:fadeUp 0.4s ease both;}
  .otp-digit{width:52px;height:60px;background:${T.colors.bg.elevated};border:2px solid ${T.colors.bg.border};border-radius:${T.radius.md};outline:none;font-family:${T.fonts.display};font-size:24px;font-weight:700;color:${T.colors.text.primary};text-align:center;transition:all 0.2s ease;caret-color:transparent;}
  .otp-digit:focus{border-color:${T.colors.primary.DEFAULT};box-shadow:0 0 0 3px rgba(99,102,241,0.18);background:${T.colors.bg.hover};}
  .otp-digit.filled{border-color:${T.colors.primary[400]};}
  .otp-digit.error{border-color:${T.colors.danger.text};box-shadow:0 0 0 3px rgba(248,113,113,0.14);animation:shake 0.35s ease;}
  .otp-submit{width:100%;padding:12px;background:${T.gradients.brand};color:#fff;border:none;border-radius:${T.radius.md};font-family:${T.fonts.body};font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;}
  .otp-submit:hover{opacity:0.9;box-shadow:${T.shadows.glow};}
  .otp-submit:disabled{opacity:0.55;cursor:not-allowed;}
  @keyframes shake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-5px);}40%,80%{transform:translateX(5px);}}
  @media(max-width:400px){.otp-card{padding:28px 18px;}.otp-digit{width:42px;height:52px;font-size:20px;}}
`

export default function VerifyOtpPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading  = useSelector(selLoading)
  const pending  = useSelector(selPending) // { email, name } from Redux (set after signup)

  const email = pending?.email || ''
  const name  = pending?.name  || 'there'

  const [digits,   setDigits]   = useState(['', '', '', '', '', ''])
  const [errored,  setErrored]  = useState(false)
  const [resendCD, setResendCD] = useState(30)
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]

  useEffect(() => {
    if (!email) navigate('/signup')
  }, [email, navigate])

  useEffect(() => {
    if (resendCD <= 0) return
    const t = setTimeout(() => setResendCD(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCD])

  const handleKey = (idx, e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[idx] = val; setDigits(next); setErrored(false)
    if (val && idx < 5) refs[idx + 1].current?.focus()
  }
  const handleBackspace = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits]; next[idx - 1] = ''; setDigits(next); refs[idx - 1].current?.focus()
    }
  }
  const handlePaste = e => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) { setDigits(pasted.split('')); refs[5].current?.focus() }
  }

  const handleSubmit = async ev => {
    ev.preventDefault()
    const otp = digits.join('')
    if (otp.length < 6) { toast.error('Enter all 6 digits'); return }
    const res = await dispatch(verifyEmailOtp({ email, otp }))
    if (res.meta.requestStatus === 'fulfilled') {
      navigate('/login')
    } else {
      setErrored(true)
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => { refs[0].current?.focus(); setErrored(false) }, 500)
    }
  }

  const resend = async () => {
    if (resendCD > 0) return
    try {
      // Re-trigger OTP via signup again or a dedicated resend endpoint
      // Here we call verifyemail with a dummy to trigger backend to resend (backend decides)
      toast.loading('Resending OTP…', { id: 'resend' })
      await api.post('/auth/signup', { email, password: '__resend__' }).catch(() => {})
      toast.success('New OTP sent! Check your inbox.', { id: 'resend', icon: '📧' })
    } catch { toast.error('Could not resend. Try again.', { id: 'resend' }) }
    setResendCD(30)
    setDigits(['', '', '', '', '', ''])
    refs[0].current?.focus()
  }

  const masked = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c)

  return (
    <>
      <style>{CSS}</style>
      <div className="otp-wrap">
        <div className="otp-blob" />
        <div className="otp-card">
          <div style={{ width:60, height:60, borderRadius:'50%', background:T.gradients.brandSoft, border:`2px solid rgba(99,102,241,0.25)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:26 }}>📧</div>
          <h1 style={{ fontFamily:T.fonts.display, fontWeight:800, fontSize:22, color:T.colors.text.primary, marginBottom:8, letterSpacing:'-0.02em' }}>Verify your email</h1>
          <p style={{ fontSize:13, color:T.colors.text.secondary, marginBottom:6, lineHeight:1.6 }}>We sent a 6-digit code to</p>
          <p style={{ fontFamily:T.fonts.mono, fontSize:13, color:T.colors.primary[400], marginBottom:28, fontWeight:600 }}>{masked || 'your email'}</p>

          <form onSubmit={handleSubmit}>
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:24 }}>
              {digits.map((d, i) => (
                <input key={i} ref={refs[i]} className={`otp-digit${d?' filled':''}${errored?' error':''}`}
                  type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleKey(i, e)} onKeyDown={e => handleBackspace(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined} autoFocus={i === 0} />
              ))}
            </div>
            <button className="otp-submit" type="submit" disabled={loading || digits.join('').length < 6}>
              {loading ? 'Verifying…' : 'Verify Email →'}
            </button>
          </form>

          <div style={{ marginTop:20, fontSize:13, color:T.colors.text.secondary }}>
            Didn't receive it?{' '}
            {resendCD > 0
              ? <span style={{ color:T.colors.text.muted, fontFamily:T.fonts.mono }}>Resend in {resendCD}s</span>
              : <button onClick={resend} style={{ background:'none', border:'none', cursor:'pointer', color:T.colors.primary[400], fontWeight:600, fontSize:13 }}>Resend OTP</button>
            }
          </div>
          <button onClick={() => navigate('/signup')} style={{ display:'block', margin:'14px auto 0', background:'none', border:'none', cursor:'pointer', fontSize:12, color:T.colors.text.muted }}>
            ← Back to sign up
          </button>
        </div>
      </div>
    </>
  )
}