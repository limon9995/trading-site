import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI, walletAPI } from '../services/api';

const SETTINGS_PANEL =
  'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';
const SETTINGS_INPUT =
  'input-field rounded-[22px] border-[#d7e4e5] bg-[#f7fbfb]';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [wallet, setWallet] = useState(null);
  const [copied, setCopied] = useState(false);

  // Change password form state
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    walletAPI.getWallet()
      .then(({ data }) => setWallet(data))
      .catch(() => {});
  }, []);

  const handleCopyReferral = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode).then(() => {
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }
    setPwLoading(true);
    try {
      const { data } = await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success(data.message);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0b2026_0%,#114850_48%,#1b6d71_100%)] px-6 py-7 text-white shadow-[0_28px_90px_rgba(8,32,38,0.28)] md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#96e5e6]">
              Account Settings
            </span>
            <h1 className="mt-4 text-[36px] font-light leading-[1.04] tracking-[-0.03em] md:text-[48px]">Manage profile, password, referrals and appearance in one place.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/68 md:text-base">This page now follows the same premium shell language as the rest of the platform, including softer panels and stronger CTA rhythm.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Theme</p>
              <p className="mt-2 text-[28px] font-semibold text-white">{isDark ? 'Dark' : 'Light'}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Joined</p>
              <p className="mt-2 text-[20px] font-semibold text-white">{joinedDate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${SETTINGS_PANEL} p-6`}>
        <h2 className="font-semibold text-text-primary mb-4">Profile Information</h2>
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-black text-2xl flex-shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-text-primary text-lg">{user?.username}</p>
            <p className="text-text-secondary text-sm">{user?.email}</p>
            <p className="text-text-muted text-xs mt-1">Joined {joinedDate}</p>
          </div>
          <div className="ml-auto">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              user?.role === 'admin'
                ? 'bg-brand-primary/20 text-brand-primary'
                : 'bg-light-hover text-text-secondary border border-light-border'
            }`}>
              {user?.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-4">
            <p className="text-xs text-text-muted mb-1">Username</p>
            <p className="text-text-primary font-medium">{user?.username}</p>
          </div>
          <div className="rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-4">
            <p className="text-xs text-text-muted mb-1">Email Address</p>
            <p className="text-text-primary font-medium">{user?.email}</p>
          </div>
          <div className="rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-4">
            <p className="text-xs text-text-muted mb-1">Account Role</p>
            <p className="text-text-primary font-medium capitalize">{user?.role}</p>
          </div>
          <div className="rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-4">
            <p className="text-xs text-text-muted mb-1">Member Since</p>
            <p className="text-text-primary font-medium">{joinedDate}</p>
          </div>
        </div>
      </div>

      {/* ── Account Stats ────────────────────────────────────────────── */}
      <div className={`${SETTINGS_PANEL} p-6`}>
        <h2 className="font-semibold text-text-primary mb-4">Account Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-4 text-center">
            <p className="text-xl font-bold text-brand-primary">
              ${(user?.totalTraded || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-text-muted mt-1">Total Traded</p>
          </div>
          <div className="rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-4 text-center">
            <p className={`text-xl font-bold ${(user?.totalPnl || 0) >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
              {(user?.totalPnl || 0) >= 0 ? '+' : ''}${Math.abs(user?.totalPnl || 0).toFixed(2)}
            </p>
            <p className="text-xs text-text-muted mt-1">Total P&L</p>
          </div>
          <div className="rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-4 text-center">
            <p className="text-xl font-bold text-text-primary capitalize">
              {user?.plan || 'none'}
            </p>
            <p className="text-xs text-text-muted mt-1">Current Plan</p>
          </div>
          <div className="rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-4 text-center">
            <p className="text-xl font-bold text-text-primary">
              {wallet?.referralCount || 0}
            </p>
            <p className="text-xs text-text-muted mt-1">Referrals</p>
          </div>
        </div>
      </div>

      {/* ── Referral Section ─────────────────────────────────────────── */}
      <div className={`${SETTINGS_PANEL} p-6`}>
        <h2 className="font-semibold text-text-primary mb-1">Referral Program</h2>
        <p className="text-sm text-text-secondary mb-4">
          Share your code and earn <span className="text-brand-primary font-semibold">$50 USDT</span> per referral.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] px-4 py-3">
            <p className="text-xs text-text-muted mb-0.5">Your Referral Code</p>
            <p className="text-xl font-black text-brand-primary tracking-widest">
              {user?.referralCode || '------'}
            </p>
          </div>
          <button
            onClick={handleCopyReferral}
            className={`self-stretch rounded-full border border-[#d6e2e4] bg-white px-5 py-3 text-sm font-semibold text-[#506d72] transition-all hover:-translate-y-0.5 flex items-center gap-2 ${
              copied ? 'border-green-trade text-green-trade' : ''
            }`}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-[20px] border border-[#dde8e9] bg-[#f7fbfb] p-3">
            <p className="text-lg font-bold text-text-primary">{wallet?.referralCount || 0}</p>
            <p className="text-xs text-text-muted">Total Referrals</p>
          </div>
          <div className="rounded-[20px] border border-[#dde8e9] bg-[#f7fbfb] p-3">
            <p className="text-lg font-bold text-brand-primary">
              ${((wallet?.referralCount || 0) * 50).toLocaleString()}
            </p>
            <p className="text-xs text-text-muted">USDT Earned</p>
          </div>
          <div className="rounded-[20px] border border-[#dde8e9] bg-[#f7fbfb] p-3">
            <p className="text-lg font-bold text-green-trade">$50</p>
            <p className="text-xs text-text-muted">Per Referral</p>
          </div>
        </div>
      </div>

      {/* ── Change Password ──────────────────────────────────────────── */}
      <div className={`${SETTINGS_PANEL} p-6`}>
        <h2 className="font-semibold text-text-primary mb-4">Change Password</h2>
        <form onSubmit={handlePwChange} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary block mb-1.5">Current Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className={SETTINGS_INPUT}
              placeholder="Enter current password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary block mb-1.5">New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className={SETTINGS_INPUT}
              placeholder="Min. 6 characters"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary block mb-1.5">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className={SETTINGS_INPUT}
              placeholder="Repeat new password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              required
            />
          </div>

          {/* Password strength indicator */}
          {pwForm.newPassword && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => {
                  const strength = [
                    pwForm.newPassword.length >= 6,
                    pwForm.newPassword.length >= 10,
                    /[A-Z]/.test(pwForm.newPassword),
                    /[0-9!@#$%^&*]/.test(pwForm.newPassword),
                  ];
                  const filled = strength.slice(0, i).every(Boolean);
                  return (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        filled
                          ? i <= 1 ? 'bg-red-trade' : i <= 2 ? 'bg-brand-primary' : 'bg-green-trade'
                          : 'bg-light-border'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-text-muted">
                {pwForm.newPassword.length < 6
                  ? 'Too short'
                  : pwForm.newPassword.length < 10
                  ? 'Weak password'
                  : /[A-Z]/.test(pwForm.newPassword) && /[0-9!@#$%^&*]/.test(pwForm.newPassword)
                  ? 'Strong password'
                  : 'Good password'}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {showPasswords ? '🙈 Hide passwords' : '👁 Show passwords'}
            </button>
          </div>

          <button
            type="submit"
            disabled={pwLoading || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#ee8267] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a]"
          >
            {pwLoading ? (
              <><div className="w-4 h-4 border-2 border-light-border/30 border-t-dark-bg rounded-full animate-spin" />Updating...</>
            ) : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ── Appearance ───────────────────────────────────────────────── */}
      <div className={`${SETTINGS_PANEL} p-6`}>
        <h2 className="font-semibold text-text-primary mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Theme</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Currently using {isDark ? 'dark' : 'light'} theme
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              isDark ? 'bg-brand-primary' : 'bg-light-border'
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 ${
                isDark ? 'translate-x-7' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => isDark && toggleTheme()}
            className={`p-3 rounded-lg border text-sm transition-all ${
              !isDark
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                : 'border-light-border text-text-secondary hover:border-text-muted/40'
            }`}
          >
            ☀️ Light Mode
          </button>
          <button
            onClick={() => !isDark && toggleTheme()}
            className={`p-3 rounded-lg border text-sm transition-all ${
              isDark
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                : 'border-light-border text-text-secondary hover:border-text-muted/40'
            }`}
          >
            🌙 Dark Mode
          </button>
        </div>
      </div>
    </div>
  );
}
