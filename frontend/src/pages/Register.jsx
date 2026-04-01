import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';

function AuthBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-11 h-11">
        <div className="absolute inset-0 rounded-full border-[5px] border-cyan-400 opacity-90" />
        <div className="absolute inset-[8px] rounded-full border-[4px] border-cyan-400 opacity-90" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-[5px] rounded-full bg-cyan-400" />
      </div>
      <div className="text-white">
        <span className="text-[26px] font-light tracking-tight">CEX</span>
        <span className="text-[26px] font-light opacity-70">.IO</span>
      </div>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [form, setForm] = useState({ username: '', email: '', password: '', referralCode: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const passwordStrength = () => {
    const p = form.password;
    if (p.length === 0) return null;
    if (p.length < 6) return { label: 'Too short', color: '#f6465d', width: 'w-1/4' };
    if (p.length < 8) return { label: 'Weak', color: '#f97316', width: 'w-1/2' };
    if (p.length < 12) return { label: 'Good', color: '#EE8267', width: 'w-3/4' };
    return { label: 'Strong', color: '#0ECB81', width: 'w-full' };
  };
  const strength = passwordStrength();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await authAPI.sendRegisterOtp(form);
      toast.success('OTP sent to your email!');
      setStep(2);
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((t) => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await authAPI.sendRegisterOtp(form);
      toast.success('OTP resent!');
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      await register({ email: form.email, otp: otpStr });
      toast.success('Account created! Welcome to CEX.IO');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3.5 rounded-[20px] text-sm outline-none transition-all";
  const inputStyle = {
    background: isDark ? '#0f2a32' : '#f4f7f8',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E8EAED'}`,
    color: isDark ? '#e8f0f2' : '#0E2026',
  };
  const blurBorderColor = isDark ? 'rgba(255,255,255,0.1)' : '#E8EAED';

  const textPrimary = { color: isDark ? '#e8f0f2' : '#0E2026' };
  const textSecondary = { color: isDark ? '#9BA3A6' : '#566367' };
  const textMuted = { color: isDark ? '#566367' : '#9BA3A6' };

  return (
    <div className="min-h-screen flex relative"
      style={{ background: isDark ? 'linear-gradient(180deg, #071d23 0%, #0a2229 100%)' : 'linear-gradient(180deg, #fbfcfd 0%, #f4f7f8 100%)' }}>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(14,32,38,0.06)', color: isDark ? '#9BA3A6' : '#566367' }}
      >
        {isDark ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        )}
      </button>

      {/* Left panel */}
      <div className="hidden xl:flex flex-col justify-between w-[44%] px-14 py-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #071d23 0%, #0f545a 55%, #114147 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(244,146,126,0.15), transparent 70%)' }} />
        <div className="relative"><AuthBrand /></div>
        <div className="relative max-w-[520px]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'rgba(244,146,126,0.12)', border: '1px solid rgba(244,146,126,0.28)', color: '#F4927E' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F4927E' }} />
            Create a full exchange account
          </div>
          <h2 className="text-[52px] font-light text-white leading-[1.08] tracking-[-0.04em] mb-5">
            Build your<br /><span style={{ color: '#EE8267' }}>crypto account</span>
          </h2>
          <p className="text-white/60 leading-8 mb-10 text-[18px]">
            Launch into the same design system as the landing page with a clean onboarding flow, OTP verification, and a polished dashboard waiting after signup.
          </p>
          <div className="grid gap-3">
            {[['Reward', 'Get $10,000 USDT demo balance'], ['Flow', 'Simple onboarding and OTP verification'], ['Access', 'Your dashboard is ready after verification']].map(([title, label]) => (
              <div key={title} className="rounded-[22px] px-4 py-4 border border-white/10 bg-white/[0.04]">
                <p className="text-white font-medium">{title}</p>
                <p className="text-sm text-white/60 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/30 relative">© {new Date().getFullYear()} CEX.IO. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 xl:p-10">
        {/* Mobile logo */}
        <div className="mb-8 xl:hidden">
          <div className="flex items-center gap-3" style={textPrimary}>
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-[5px] border-cyan-500 opacity-90" />
              <div className="absolute inset-[7px] rounded-full border-[4px] border-cyan-500 opacity-90" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-[5px] rounded-full bg-cyan-500" />
            </div>
            <div>
              <span className="text-[24px] font-light tracking-tight">CEX</span>
              <span className="text-[24px] font-light opacity-60">.IO</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[540px] animate-bounce-in">
          <div className="rounded-[32px] p-6 sm:p-8"
            style={{
              background: isDark ? 'rgba(14,32,38,0.92)' : 'rgba(255,255,255,0.88)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(217,230,231,0.92)'}`,
              boxShadow: isDark ? '0 24px 80px rgba(0,0,0,0.4)' : '0 24px 80px rgba(8,35,41,0.08)',
              backdropFilter: 'blur(18px)',
            }}>

            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[34px] font-light leading-none mb-2" style={textPrimary}>Create your account</h2>
                <p className="text-[15px]" style={textSecondary}>Fast, secure, and consistent with the new exchange-style front page</p>
              </div>
              <div className="hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #0E2026 0%, #185B64 100%)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{ background: step >= s ? '#EE8267' : isDark ? 'rgba(255,255,255,0.08)' : '#E8EAED', color: step >= s ? '#fff' : isDark ? '#566367' : '#9BA3A6' }}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < 2 && <div className="flex-1 h-0.5 transition-all rounded-full" style={{ background: step > s ? '#EE8267' : isDark ? 'rgba(255,255,255,0.08)' : '#E8EAED' }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <>
                <h3 className="text-xl font-bold mb-1" style={textPrimary}>Your details</h3>
                <p className="text-sm mb-5" style={textSecondary}>Fast, secure, and free to join</p>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={textPrimary}>Username</label>
                    <input type="text" name="username" value={form.username} onChange={handleChange}
                      placeholder="satoshi" required minLength={3} maxLength={20}
                      className={inputCls} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#EE8267'}
                      onBlur={e => e.target.style.borderColor = blurBorderColor} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={textPrimary}>Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange}
                      placeholder="you@example.com" required
                      className={inputCls} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#EE8267'}
                      onBlur={e => e.target.style.borderColor = blurBorderColor} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={textPrimary}>Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                        onChange={handleChange} placeholder="Min. 6 characters" required
                        className={`${inputCls} pr-10`} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#EE8267'}
                        onBlur={e => e.target.style.borderColor = blurBorderColor} />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={textMuted}>
                        {showPass
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        }
                      </button>
                    </div>
                    {strength && (
                      <div className="mt-2">
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#E8EAED' }}>
                          <div className={`h-full ${strength.width} transition-all duration-300`} style={{ background: strength.color }} />
                        </div>
                        <p className="text-xs mt-1 font-medium" style={{ color: strength.color }}>{strength.label}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={textPrimary}>
                      Referral Code <span className="font-normal" style={textMuted}>(optional)</span>
                    </label>
                    <input type="text" name="referralCode" value={form.referralCode} onChange={handleChange}
                      placeholder="ABC123" maxLength={6}
                      className={`${inputCls} uppercase`} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#EE8267'}
                      onBlur={e => e.target.style.borderColor = blurBorderColor} />
                    <p className="text-xs mt-1" style={textMuted}>Enter your referrer's code to earn them rewards</p>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full h-[56px] rounded-full font-semibold text-[16px] text-white mt-3 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 hover:brightness-105"
                    style={{ background: '#F4927E' }}>
                    {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending OTP...</> : 'Send OTP to Email'}
                  </button>
                </form>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <h3 className="text-xl font-bold mb-1" style={textPrimary}>Verify Your Email</h3>
                <p className="text-sm mb-6" style={textSecondary}>
                  We sent a 6-digit code to <span className="font-semibold" style={{ color: '#EE8267' }}>{form.email}</span>
                </p>
                <form onSubmit={handleVerifyAndRegister} className="space-y-5">
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input key={idx} ref={(el) => (otpRefs.current[idx] = el)}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                        style={{
                          background: isDark ? '#0f2a32' : '#f2f3f5',
                          border: `2px solid ${digit ? '#EE8267' : isDark ? 'rgba(255,255,255,0.1)' : '#E8EAED'}`,
                          color: isDark ? '#e8f0f2' : '#0E2026',
                        }}
                      />
                    ))}
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full h-[56px] rounded-full font-semibold text-[16px] text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 hover:brightness-105"
                    style={{ background: '#F4927E' }}>
                    {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</> : 'Verify & Create Account'}
                  </button>

                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-sm" style={textMuted}>Resend OTP in <span className="font-semibold" style={{ color: '#EE8267' }}>{resendTimer}s</span></p>
                    ) : (
                      <button type="button" onClick={handleResend} disabled={loading} className="text-sm font-semibold hover:underline" style={{ color: '#EE8267' }}>
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button type="button" onClick={() => setStep(1)} className="text-sm w-full text-center transition-colors" style={textMuted}>
                    ← Edit details
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-sm mt-6" style={textSecondary}>
              Already have an account?{' '}
              <Link to="/login" className="font-bold hover:underline" style={{ color: '#EE8267' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
