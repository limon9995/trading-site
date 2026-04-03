import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI, profileAPI } from '../services/api';

const COUNTRIES = [
  'Bangladesh','United States','United Kingdom','India','Pakistan','Canada','Australia',
  'Germany','France','UAE','Saudi Arabia','Singapore','Malaysia','Indonesia','Philippines',
  'Nigeria','South Africa','Brazil','Argentina','Mexico','Turkey','Egypt','Russia','China',
  'Japan','South Korea','Thailand','Vietnam',
];

const PROFILE_INPUT =
  'w-full rounded-[16px] border border-[#d7e4e5] bg-[#f7fbfb] px-4 py-3 text-sm text-text-primary outline-none transition-all focus:border-[#0AE0D0] focus:ring-2 focus:ring-[#0AE0D0]/10 disabled:opacity-50';

function InputField({ label, icon, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-muted mb-2 block flex items-center gap-1.5">
        <span className="text-[13px]">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function KycStatusBanner({ status }) {
  if (status === 'unverified') return null;
  const configs = {
    pending:  { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.35)',  icon: '🕐', title: 'Under Review',   desc: 'Your KYC is being reviewed. This usually takes 1–2 business days.', textColor: '#ca8a04' },
    verified: { bg: 'rgba(14,203,129,0.08)', border: 'rgba(14,203,129,0.35)', icon: '✅', title: 'KYC Verified',    desc: 'Your identity has been successfully verified.', textColor: '#0ECB81' },
    rejected: { bg: 'rgba(246,70,93,0.08)',  border: 'rgba(246,70,93,0.35)',  icon: '❌', title: 'KYC Rejected',    desc: 'Your submission was rejected. Please update and resubmit.', textColor: '#f6465d' },
  };
  const c = configs[status];
  return (
    <div className="rounded-[20px] p-4 flex items-start gap-3.5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        {c.icon}
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: c.textColor }}>{c.title}</p>
        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{c.desc}</p>
      </div>
    </div>
  );
}

function StepBadge({ step, label, active, done }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
        done  ? 'bg-[#0ECB81] text-white' :
        active ? 'bg-[#ee8267] text-white shadow-[0_4px_14px_rgba(238,130,103,0.4)]' :
        'bg-[#f0f4f5] text-text-muted'
      }`}>
        {done ? '✓' : step}
      </div>
      <span className={`text-[9px] font-semibold uppercase tracking-wide ${active ? 'text-[#ee8267]' : 'text-text-muted'}`}>{label}</span>
    </div>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [tab, setTab]   = useState('kyc');
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    mobile:    user?.mobile    || '',
    address:   user?.address   || '',
    city:      user?.city      || '',
    zipCode:   user?.zipCode   || '',
    state:     user?.state     || '',
    country:   user?.country   || '',
  });

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ cur: false, new: false, con: false });

  const kycStatus  = user?.kycStatus || 'unverified';
  const isVerified = kycStatus === 'verified';
  const isPending  = kycStatus === 'pending';
  const isDisabled = isVerified || isPending;

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleNextStep = () => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) return toast.error('First and last name are required');
      if (!form.mobile.trim()) return toast.error('Mobile number is required');
    }
    if (step === 2) {
      if (!form.address.trim() || !form.city.trim() || !form.country) return toast.error('Address, city and country are required');
    }
    setStep(s => s + 1);
  };

  const handleSaveKyc = async () => {
    setSaving(true);
    try {
      await profileAPI.update(form);
      await refreshUser();
      toast.success('KYC submitted! Under review.');
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit KYC');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error('Fill in all fields');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Min 6 characters');
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-4">

      {/* ── Profile Header Card ── */}
      <div className="rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(8,32,38,0.12)]"
        style={{ background: 'linear-gradient(135deg,#071d23 0%,#0f4e55 60%,#114147 100%)' }}>
        <div className="px-5 py-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-[20px] flex items-center justify-center font-bold text-2xl text-white flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#EE8267,#F4927E)' }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight truncate">{user?.username}</p>
            <p className="text-white/50 text-xs truncate">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide"
              style={{
                background: kycStatus === 'verified' ? 'rgba(14,203,129,0.2)' : kycStatus === 'pending' ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.1)',
                color: kycStatus === 'verified' ? '#0ECB81' : kycStatus === 'pending' ? '#eab308' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${kycStatus === 'verified' ? 'rgba(14,203,129,0.4)' : kycStatus === 'pending' ? 'rgba(234,179,8,0.4)' : 'rgba(255,255,255,0.15)'}`,
              }}>
              <span>{kycStatus === 'verified' ? '✓' : kycStatus === 'pending' ? '⏳' : '○'}</span>
              KYC {kycStatus === 'verified' ? 'Verified' : kycStatus === 'pending' ? 'Pending' : 'Not Submitted'}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Plan</p>
            <p className="text-white font-bold text-sm mt-1">{user?.plan && user.plan !== 'none' ? user.plan.toUpperCase() : 'STANDARD'}</p>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="grid grid-cols-2 gap-1.5 rounded-[28px] border border-[#d9e6e7] bg-white p-1.5 shadow-[0_18px_50px_rgba(8,35,41,0.07)]">
        {[['kyc', '🪪  KYC Verification'], ['password', '🔐  Change Password']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-[22px] py-3 text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-[#ee8267] text-white shadow-[0_12px_28px_rgba(238,130,103,0.22)]'
                : 'text-text-secondary hover:text-text-primary'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── KYC Tab ── */}
      {tab === 'kyc' && (
        <div className="rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)] overflow-hidden">

          {/* Status banner */}
          {kycStatus !== 'unverified' && (
            <div className="px-5 pt-5">
              <KycStatusBanner status={kycStatus} />
            </div>
          )}

          {/* Unverified intro */}
          {kycStatus === 'unverified' && (
            <div className="px-5 pt-5">
              <div className="rounded-[20px] p-4 flex items-start gap-3" style={{ background: 'rgba(10,224,208,0.06)', border: '1px solid rgba(10,224,208,0.2)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(10,224,208,0.12)' }}>
                  🛡️
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">Identity Verification Required</p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">Complete KYC to unlock higher withdrawal limits and full account features.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step indicator */}
          {!isDisabled && (
            <div className="px-5 pt-5">
              <div className="flex items-center gap-0">
                <StepBadge step={1} label="Personal" active={step === 1} done={step > 1} />
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${step > 1 ? 'bg-[#0ECB81]' : 'bg-[#e5eef0]'}`} />
                <StepBadge step={2} label="Address" active={step === 2} done={step > 2} />
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${step > 2 ? 'bg-[#0ECB81]' : 'bg-[#e5eef0]'}`} />
                <StepBadge step={3} label="Review" active={step === 3} done={false} />
              </div>
            </div>
          )}

          <div className="p-5 space-y-4">

            {/* ── Step 1: Personal Info ── */}
            {(step === 1 || isDisabled) && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ee8267] text-white flex items-center justify-center text-[9px]">1</span>
                  Personal Information
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="First Name" icon="👤">
                    <input name="firstName" value={form.firstName} onChange={handleChange}
                      className={PROFILE_INPUT} placeholder="John" disabled={isDisabled} />
                  </InputField>
                  <InputField label="Last Name" icon="👤">
                    <input name="lastName" value={form.lastName} onChange={handleChange}
                      className={PROFILE_INPUT} placeholder="Doe" disabled={isDisabled} />
                  </InputField>
                </div>

                <InputField label="Mobile Number" icon="📱">
                  <input name="mobile" value={form.mobile} onChange={handleChange}
                    className={PROFILE_INPUT} placeholder="+880 1XXX XXXXXX" type="tel" disabled={isDisabled} />
                </InputField>

                {!isDisabled && (
                  <button onClick={handleNextStep}
                    className="w-full py-3.5 rounded-[18px] text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#ee8267,#f4927e)', boxShadow: '0 12px_32px_rgba(238,130,103,0.3)' }}>
                    Continue →
                  </button>
                )}
              </>
            )}

            {/* ── Step 2: Address ── */}
            {(step === 2 || isDisabled) && (
              <>
                {isDisabled && <hr className="border-[#e5eef0]" />}
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#185B64] text-white flex items-center justify-center text-[9px]">2</span>
                  Address Details
                </p>

                <InputField label="Street Address" icon="🏠">
                  <input name="address" value={form.address} onChange={handleChange}
                    className={PROFILE_INPUT} placeholder="House / Road / Area" disabled={isDisabled} />
                </InputField>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="City" icon="🏙️">
                    <input name="city" value={form.city} onChange={handleChange}
                      className={PROFILE_INPUT} placeholder="Dhaka" disabled={isDisabled} />
                  </InputField>
                  <InputField label="ZIP / Postal" icon="📮">
                    <input name="zipCode" value={form.zipCode} onChange={handleChange}
                      className={PROFILE_INPUT} placeholder="1200" disabled={isDisabled} />
                  </InputField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="State / Division" icon="🗺️">
                    <input name="state" value={form.state} onChange={handleChange}
                      className={PROFILE_INPUT} placeholder="Dhaka" disabled={isDisabled} />
                  </InputField>
                  <InputField label="Country" icon="🌍">
                    <select name="country" value={form.country} onChange={handleChange}
                      className={PROFILE_INPUT} disabled={isDisabled}>
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </InputField>
                </div>

                {!isDisabled && (
                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)}
                      className="flex-1 py-3.5 rounded-[18px] text-sm font-bold text-text-secondary border border-[#d7e4e5] bg-[#f7fbfb] transition-all active:scale-95">
                      ← Back
                    </button>
                    <button onClick={handleNextStep}
                      className="flex-1 py-3.5 rounded-[18px] text-sm font-bold text-white transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#ee8267,#f4927e)' }}>
                      Continue →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Step 3: Review & Submit ── */}
            {step === 3 && !isDisabled && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0ECB81] text-white flex items-center justify-center text-[9px]">3</span>
                  Review & Submit
                </p>

                {/* Summary card */}
                <div className="rounded-[20px] p-4 space-y-3" style={{ background: '#f7fbfb', border: '1px solid #d9e6e7' }}>
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Personal</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-text-muted">First Name</span><p className="font-semibold text-text-primary mt-0.5">{form.firstName || '—'}</p></div>
                    <div><span className="text-text-muted">Last Name</span><p className="font-semibold text-text-primary mt-0.5">{form.lastName || '—'}</p></div>
                    <div className="col-span-2"><span className="text-text-muted">Mobile</span><p className="font-semibold text-text-primary mt-0.5">{form.mobile || '—'}</p></div>
                  </div>
                  <hr className="border-[#d9e6e7]" />
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Address</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2"><span className="text-text-muted">Street</span><p className="font-semibold text-text-primary mt-0.5">{form.address || '—'}</p></div>
                    <div><span className="text-text-muted">City</span><p className="font-semibold text-text-primary mt-0.5">{form.city || '—'}</p></div>
                    <div><span className="text-text-muted">ZIP</span><p className="font-semibold text-text-primary mt-0.5">{form.zipCode || '—'}</p></div>
                    <div><span className="text-text-muted">State</span><p className="font-semibold text-text-primary mt-0.5">{form.state || '—'}</p></div>
                    <div><span className="text-text-muted">Country</span><p className="font-semibold text-text-primary mt-0.5">{form.country || '—'}</p></div>
                  </div>
                </div>

                {/* Consent notice */}
                <div className="rounded-[16px] px-4 py-3 flex items-start gap-2.5 text-xs text-text-muted" style={{ background: 'rgba(10,224,208,0.06)', border: '1px solid rgba(10,224,208,0.15)' }}>
                  <span className="text-base flex-shrink-0 mt-0.5">ℹ️</span>
                  <span>By submitting, you confirm that all information is accurate and consent to identity verification.</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)}
                    className="flex-1 py-3.5 rounded-[18px] text-sm font-bold text-text-secondary border border-[#d7e4e5] bg-[#f7fbfb] transition-all active:scale-95">
                    ← Back
                  </button>
                  <button onClick={handleSaveKyc} disabled={saving}
                    className="flex-1 py-3.5 rounded-[18px] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#ee8267,#f4927e)', boxShadow: '0 12px 32px rgba(238,130,103,0.3)' }}>
                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {saving ? 'Submitting...' : '🚀 Submit KYC'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ── Change Password Tab ── */}
      {tab === 'password' && (
        <div className="rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)] p-5 space-y-4">
          <div className="flex items-center gap-3 pb-2">
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-xl" style={{ background: '#ee826715' }}>🔐</div>
            <div>
              <p className="font-bold text-text-primary text-sm">Change Password</p>
              <p className="text-xs text-text-muted">Keep your account secure</p>
            </div>
          </div>

          {[
            { key: 'cur',  field: 'currentPassword', label: 'Current Password', placeholder: '••••••••' },
            { key: 'new',  field: 'newPassword',      label: 'New Password',     placeholder: 'Min 6 characters' },
            { key: 'con',  field: 'confirmPassword',  label: 'Confirm Password', placeholder: 'Repeat new password' },
          ].map(({ key, field, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-text-muted mb-2 block">{label}</label>
              <div className="relative">
                <input
                  type={showPw[key] ? 'text' : 'password'}
                  value={pwForm[field]}
                  onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                  className={PROFILE_INPUT + ' pr-11'}
                  placeholder={placeholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-sm">
                  {showPw[key] ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          ))}

          {/* Password strength hint */}
          {pwForm.newPassword.length > 0 && (
            <div className="flex gap-1.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{
                  background: i < Math.min(Math.floor(pwForm.newPassword.length / 3), 4)
                    ? ['#f6465d','#eab308','#0ECB81','#0AE0D0'][Math.min(Math.floor(pwForm.newPassword.length / 3) - 1, 3)]
                    : '#e5eef0'
                }} />
              ))}
              <span className="text-[10px] text-text-muted ml-1 self-center">
                {pwForm.newPassword.length < 4 ? 'Weak' : pwForm.newPassword.length < 8 ? 'Fair' : pwForm.newPassword.length < 12 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}

          <button onClick={handleChangePassword} disabled={pwSaving}
            className="w-full py-3.5 rounded-[18px] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#ee8267,#f4927e)', boxShadow: '0 12px 32px rgba(238,130,103,0.3)' }}>
            {pwSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {pwSaving ? 'Saving...' : 'Update Password'}
          </button>
        </div>
      )}
    </div>
  );
}
