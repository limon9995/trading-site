import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3.5 rounded-[20px] text-sm text-text-primary placeholder-text-muted outline-none transition-all";
  const inputStyle = { background: '#f4f7f8', border: '1px solid #E8EAED' };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(180deg, #fbfcfd 0%, #f4f7f8 100%)' }}>
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden xl:flex flex-col justify-between w-[46%] px-14 py-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #071d23 0%, #0f545a 55%, #114147 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(244,146,126,0.18), transparent 70%)' }} />
        <div className="absolute left-[-30px] bottom-16 w-40 h-40 rounded-full border-[10px] border-[#c7d5b6] bg-[#537969] opacity-90 hidden 2xl:block" />

        {/* Logo */}
        <div className="relative"><AuthBrand /></div>

        {/* Center content */}
        <div className="relative max-w-[520px]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'rgba(244,146,126,0.12)', border: '1px solid rgba(244,146,126,0.28)', color: '#F4927E' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F4927E' }} />
            Secure access to your exchange workspace
          </div>
          <h2 className="text-[52px] font-light text-white leading-[1.08] tracking-[-0.04em] mb-5">
            Access your<br /><span style={{ color: '#EE8267' }}>exchange dashboard</span>
          </h2>
          <p className="text-white/60 leading-8 mb-10 text-[18px]">
            Sign in to manage balances, review markets, track recent activity, and move through the platform with the same visual language as the new landing page.
          </p>
          <div className="grid gap-3">
            {[['Security', 'Bank-grade account protection'], ['Liquidity', 'Fast entry into active markets'], ['Access', '24/7 across devices']].map(([title, label]) => (
              <div key={title} className="rounded-[22px] px-4 py-4 border border-white/10 bg-white/[0.04]">
                <p className="text-white font-medium">{title}</p>
                <p className="text-sm text-white/60 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/30 relative">© {new Date().getFullYear()} CEX.IO. All rights reserved.</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 xl:p-10">
        {/* Mobile logo */}
        <div className="mb-8 xl:hidden">
          <div className="flex items-center gap-3 text-text-primary">
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

        <div className="w-full max-w-[520px] animate-bounce-in">
          <div className="rounded-[32px] cex-surface p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h2 className="text-[34px] font-light text-text-primary leading-none mb-2">Welcome back</h2>
              <p className="text-text-secondary text-[15px]">Sign in to continue trading and managing your assets</p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #0E2026 0%, #185B64 100%)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Email Address</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" required
                className={inputCls} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#EE8267'}
                onBlur={e => e.target.style.borderColor = '#E8EAED'}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-text-primary">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: '#EE8267' }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                  placeholder="••••••••" required
                  className={`${inputCls} pr-10`} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#EE8267'}
                  onBlur={e => e.target.style.borderColor = '#E8EAED'}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  {showPass
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-[56px] rounded-full font-semibold text-[16px] text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-3 hover:brightness-105"
              style={{ background: '#F4927E' }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Promo */}
          <div className="mt-5 p-4 rounded-[24px] flex items-start gap-3"
            style={{ background: 'rgba(244,146,126,0.08)', border: '1px solid rgba(244,146,126,0.16)' }}>
            <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#0E2026] font-bold" style={{ background: '#F4927E' }}>+</span>
            <p className="text-sm text-text-secondary leading-6">
              New here? <span style={{ color: '#EE8267' }} className="font-semibold">Register</span> and get <span className="text-text-primary font-bold">$10,000 USDT</span> demo credit to explore the dashboard.
            </p>
          </div>

          <p className="text-center text-sm text-text-secondary mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold hover:underline" style={{ color: '#EE8267' }}>Create one free</Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
