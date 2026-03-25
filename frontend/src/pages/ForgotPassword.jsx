import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3, DONE: 4 };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // ── Step 1: Send OTP ──────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      toast.success('OTP sent to your email!');
      setStep(STEPS.OTP);
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
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      toast.success('OTP resent!');
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ────────────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const lastFilled = Math.min(digits.length, 5);
    otpRefs.current[lastFilled]?.focus();
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      await authAPI.verifyResetOtp(email.trim(), otpStr);
      toast.success('OTP verified!');
      setStep(STEPS.PASSWORD);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await authAPI.resetPassword(email.trim(), otp.join(''), newPassword);
      toast.success('Password reset successfully!');
      setStep(STEPS.DONE);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-text-primary placeholder-text-muted outline-none transition-all";
  const inputStyle = { background: '#f2f3f5', border: '1px solid #E8EAED' };
  const btnPrimary = "w-full py-3.5 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f2f3f5' }}>
      <div className="w-full max-w-md animate-bounce-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm" style={{ background: '#EE8267' }}>C</div>
          <span className="text-xl font-extrabold text-text-primary tracking-tight">CEX.IO</span>
        </div>

        <div className="rounded-2xl p-8 bg-white shadow-sm" style={{ border: '1px solid #E8EAED' }}>

          {/* Progress */}
          {step !== STEPS.DONE && (
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{ background: step >= s ? '#EE8267' : '#E8EAED', color: step >= s ? '#fff' : '#9BA3A6' }}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < 3 && <div className="flex-1 h-0.5 transition-all rounded-full" style={{ background: step > s ? '#EE8267' : '#E8EAED' }} />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Step 1: Email */}
          {step === STEPS.EMAIL && (
            <>
              <h2 className="text-2xl font-extrabold text-text-primary mb-1">Forgot Password</h2>
              <p className="text-sm text-text-secondary mb-6">Enter your registered email to receive an OTP</p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required className={inputCls} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#EE8267'}
                    onBlur={e => e.target.style.borderColor = '#E8EAED'} />
                </div>
                <button type="submit" disabled={loading} className={btnPrimary} style={{ background: '#EE8267' }}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</> : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP */}
          {step === STEPS.OTP && (
            <>
              <h2 className="text-2xl font-extrabold text-text-primary mb-1">Enter OTP</h2>
              <p className="text-sm text-text-secondary mb-6">
                We sent a 6-digit code to <span className="font-semibold" style={{ color: '#EE8267' }}>{email}</span>
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input key={idx} ref={(el) => (otpRefs.current[idx] = el)}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl text-text-primary outline-none transition-all"
                      style={{ background: '#f2f3f5', border: `2px solid ${digit ? '#EE8267' : '#E8EAED'}` }}
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading} className={btnPrimary} style={{ background: '#EE8267' }}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</> : 'Verify OTP'}
                </button>
                <div className="text-center">
                  {resendTimer > 0
                    ? <p className="text-sm text-text-muted">Resend in <span className="font-semibold" style={{ color: '#EE8267' }}>{resendTimer}s</span></p>
                    : <button type="button" onClick={handleResend} disabled={loading} className="text-sm font-semibold hover:underline" style={{ color: '#EE8267' }}>Resend OTP</button>
                  }
                </div>
                <button type="button" onClick={() => setStep(STEPS.EMAIL)} className="text-sm text-text-muted hover:text-text-primary w-full text-center transition-colors">← Change email</button>
              </form>
            </>
          )}

          {/* Step 3: New Password */}
          {step === STEPS.PASSWORD && (
            <>
              <h2 className="text-2xl font-extrabold text-text-primary mb-1">Set New Password</h2>
              <p className="text-sm text-text-secondary mb-6">Choose a strong password for your account</p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">New Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters" required className={`${inputCls} pr-10`} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#EE8267'}
                      onBlur={e => e.target.style.borderColor = '#E8EAED'} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-sm">{showPass ? '🙈' : '👁️'}</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">Confirm Password</label>
                  <input type={showPass ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password" required className={inputCls} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#EE8267'}
                    onBlur={e => e.target.style.borderColor = '#E8EAED'} />
                </div>
                <button type="submit" disabled={loading} className={btnPrimary} style={{ background: '#EE8267' }}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting...</> : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Done */}
          {step === STEPS.DONE && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.3)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0ECB81" strokeWidth="2.5" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="text-xl font-extrabold text-text-primary mb-2">Password Reset!</h2>
              <p className="text-sm text-text-secondary mb-6">Your password has been updated. You can now log in.</p>
              <button onClick={() => navigate('/login')} className={btnPrimary} style={{ background: '#EE8267' }}>Go to Login</button>
            </div>
          )}

          {step !== STEPS.DONE && (
            <p className="text-center text-sm text-text-secondary mt-6">
              Remember your password?{' '}
              <Link to="/login" className="font-bold hover:underline" style={{ color: '#EE8267' }}>Sign in</Link>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-4">© {new Date().getFullYear()} CEX.IO. All rights reserved.</p>
      </div>
    </div>
  );
}
