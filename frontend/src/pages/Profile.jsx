import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI, profileAPI } from '../services/api';

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Azerbaijan',
  'Bahrain','Bangladesh','Belgium','Bolivia','Brazil','Cambodia','Canada','Chile',
  'China','Colombia','Croatia','Czech Republic','Denmark','Ecuador','Egypt',
  'Estonia','Ethiopia','Finland','France','Germany','Ghana','Greece','Guatemala',
  'Hong Kong','Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel',
  'Italy','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Latvia','Lebanon',
  'Lithuania','Malaysia','Mexico','Morocco','Myanmar','Nepal','Netherlands',
  'New Zealand','Nigeria','Norway','Oman','Pakistan','Panama','Peru','Philippines',
  'Poland','Portugal','Qatar','Romania','Russia','Saudi Arabia','Singapore',
  'South Africa','South Korea','Spain','Sri Lanka','Sweden','Switzerland',
  'Taiwan','Thailand','Turkey','UAE','Uganda','Ukraine','United Kingdom',
  'United States','Uzbekistan','Venezuela','Vietnam','Yemen','Zimbabwe',
];

const DIAL_CODES = [
  { code: '+1',   flag: '🇺🇸', name: 'US/CA' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+30',  flag: '🇬🇷', name: 'Greece' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+36',  flag: '🇭🇺', name: 'Hungary' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+40',  flag: '🇷🇴', name: 'Romania' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+51',  flag: '🇵🇪', name: 'Peru' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+84',  flag: '🇻🇳', name: 'Vietnam' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+886', flag: '🇹🇼', name: 'Taiwan' },
  { code: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+93',  flag: '🇦🇫', name: 'Afghanistan' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+95',  flag: '🇲🇲', name: 'Myanmar' },
  { code: '+98',  flag: '🇮🇷', name: 'Iran' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+218', flag: '🇱🇾', name: 'Libya' },
  { code: '+220', flag: '🇬🇲', name: 'Gambia' },
  { code: '+221', flag: '🇸🇳', name: 'Senegal' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+251', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+386', flag: '🇸🇮', name: 'Slovenia' },
  { code: '+385', flag: '🇭🇷', name: 'Croatia' },
  { code: '+420', flag: '🇨🇿', name: 'Czech Rep.' },
  { code: '+421', flag: '🇸🇰', name: 'Slovakia' },
  { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+507', flag: '🇵🇦', name: 'Panama' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+7',   flag: '🇰🇿', name: 'Kazakhstan' },
  { code: '+855', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+856', flag: '🇱🇦', name: 'Laos' },
  { code: '+960', flag: '🇲🇻', name: 'Maldives' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+963', flag: '🇸🇾', name: 'Syria' },
  { code: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+967', flag: '🇾🇪', name: 'Yemen' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: '+992', flag: '🇹🇯', name: 'Tajikistan' },
  { code: '+994', flag: '🇦🇿', name: 'Azerbaijan' },
  { code: '+998', flag: '🇺🇿', name: 'Uzbekistan' },
];

const DOC_TYPES = [
  { value: 'passport' },
  { value: 'national_id' },
  { value: 'driving_license' },
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

function UploadBox({ label, icon, preview, onChange, disabled }) {
  const ref = useRef();
  return (
    <div>
      <p className="text-xs font-semibold text-text-muted mb-1.5 flex items-center gap-1.5">
        <span>{icon}</span>{label}
      </p>
      <div
        onClick={() => !disabled && ref.current?.click()}
        className={`relative rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#0AE0D0]'
        } ${preview ? 'border-[#0ECB81]' : 'border-[#d7e4e5]'}`}
        style={{ minHeight: 90, background: preview ? '#f0faf6' : '#f7fbfb' }}
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover" style={{ maxHeight: 120 }} />
        ) : (
          <div className="flex flex-col items-center gap-1 py-4 px-2 text-center">
            <span className="text-2xl opacity-40">📎</span>
            <span className="text-[10px] text-text-muted">Tap to upload</span>
            <span className="text-[9px] text-text-muted opacity-70">JPG, PNG — max 5MB</span>
          </div>
        )}
        {preview && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0ECB81] flex items-center justify-center text-white text-[10px] font-bold">✓</div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [tab, setTab]   = useState('kyc');
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Parse existing mobile: try to detect dial code
  const detectDialCode = (mobile) => {
    if (!mobile) return { dialCode: '+1', number: '' };
    for (const d of DIAL_CODES.sort((a, b) => b.code.length - a.code.length)) {
      if (mobile.startsWith(d.code)) {
        return { dialCode: d.code, number: mobile.slice(d.code.length).trim() };
      }
    }
    return { dialCode: '+1', number: mobile };
  };

  const { dialCode: initDial, number: initNumber } = detectDialCode(user?.mobile || '');

  const [dialCode, setDialCode] = useState(initDial);
  const [phoneNumber, setPhoneNumber] = useState(initNumber);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    address:   user?.address   || '',
    city:      user?.city      || '',
    zipCode:   user?.zipCode   || '',
    state:     user?.state     || '',
    country:   user?.country   || '',
    kycDocType:  user?.kycDocType  || '',
  });

  const [docPreviews, setDocPreviews] = useState({
    kycDocFront: user?.kycDocFront || null,
    kycDocBack:  user?.kycDocBack  || null,
    kycDocSelfie:user?.kycDocSelfie|| null,
  });

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ cur: false, new: false, con: false });

  const kycStatus  = user?.kycStatus || 'unverified';
  const isVerified = kycStatus === 'verified';
  const isPending  = kycStatus === 'pending';
  const isDisabled = isVerified || isPending;

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleFileChange = (field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('File too large. Max 5MB.');
    const reader = new FileReader();
    reader.onload = (ev) => setDocPreviews(p => ({ ...p, [field]: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) return toast.error('First and last name are required');
      if (!phoneNumber.trim()) return toast.error('Phone number is required');
    }
    if (step === 2) {
      if (!form.address.trim() || !form.city.trim() || !form.country) return toast.error('Address, city and country are required');
    }
    if (step === 3) {
      if (!form.kycDocType) return toast.error('Please select a document type');
      if (!docPreviews.kycDocFront) return toast.error('Front side of document is required');
      if (!docPreviews.kycDocSelfie) return toast.error('Selfie with document is required');
    }
    setStep(s => s + 1);
  };

  const handleSaveKyc = async () => {
    setSaving(true);
    try {
      const mobile = `${dialCode}${phoneNumber.trim()}`;
      await profileAPI.update({
        ...form,
        mobile,
        kycDocFront:  docPreviews.kycDocFront  || '',
        kycDocBack:   docPreviews.kycDocBack   || '',
        kycDocSelfie: docPreviews.kycDocSelfie || '',
      });
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

  const docTypeLabel = form.kycDocType ? t(`kyc.docType.${form.kycDocType}`) : '—';

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
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">Complete KYC to unlock higher limits and full trading features. Verification typically takes 1–2 business days.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step indicator — 4 steps */}
          {!isDisabled && (
            <div className="px-5 pt-5">
              <div className="flex items-center gap-0">
                <StepBadge step={1} label="Personal" active={step === 1} done={step > 1} />
                <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${step > 1 ? 'bg-[#0ECB81]' : 'bg-[#e5eef0]'}`} />
                <StepBadge step={2} label="Address"  active={step === 2} done={step > 2} />
                <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${step > 2 ? 'bg-[#0ECB81]' : 'bg-[#e5eef0]'}`} />
                <StepBadge step={3} label="Document" active={step === 3} done={step > 3} />
                <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${step > 3 ? 'bg-[#0ECB81]' : 'bg-[#e5eef0]'}`} />
                <StepBadge step={4} label="Review"   active={step === 4} done={false} />
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
                      className={PROFILE_INPUT} placeholder="Smith" disabled={isDisabled} />
                  </InputField>
                </div>

                {/* Phone with dial code */}
                <InputField label="Phone Number" icon="📱">
                  <div className="flex gap-2">
                    <select
                      value={dialCode}
                      onChange={e => setDialCode(e.target.value)}
                      disabled={isDisabled}
                      className="rounded-[16px] border border-[#d7e4e5] bg-[#f7fbfb] px-2 py-3 text-sm text-text-primary outline-none transition-all focus:border-[#0AE0D0] focus:ring-2 focus:ring-[#0AE0D0]/10 disabled:opacity-50 flex-shrink-0"
                      style={{ maxWidth: 110 }}
                    >
                      {DIAL_CODES.map((d, i) => (
                        <option key={`${d.code}-${i}`} value={d.code}>
                          {d.flag} {d.code}
                        </option>
                      ))}
                    </select>
                    <input
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className={PROFILE_INPUT}
                      placeholder="712 345 6789"
                      type="tel"
                      disabled={isDisabled}
                    />
                  </div>
                </InputField>

                {/* Nationality */}
                <InputField label="Nationality / Country" icon="🌍">
                  <select name="country" value={form.country} onChange={handleChange}
                    className={PROFILE_INPUT} disabled={isDisabled}>
                    <option value="">Select your country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </InputField>

                {!isDisabled && (
                  <button onClick={handleNextStep}
                    className="w-full py-3.5 rounded-[18px] text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#ee8267,#f4927e)', boxShadow: '0 12px 32px rgba(238,130,103,0.3)' }}>
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
                  Residential Address
                </p>

                <InputField label="Street Address" icon="🏠">
                  <input name="address" value={form.address} onChange={handleChange}
                    className={PROFILE_INPUT} placeholder="123 Main Street, Apt 4B" disabled={isDisabled} />
                </InputField>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="City" icon="🏙️">
                    <input name="city" value={form.city} onChange={handleChange}
                      className={PROFILE_INPUT} placeholder="New York" disabled={isDisabled} />
                  </InputField>
                  <InputField label="ZIP / Postal Code" icon="📮">
                    <input name="zipCode" value={form.zipCode} onChange={handleChange}
                      className={PROFILE_INPUT} placeholder="10001" disabled={isDisabled} />
                  </InputField>
                </div>

                <InputField label="State / Province / Region" icon="🗺️">
                  <input name="state" value={form.state} onChange={handleChange}
                    className={PROFILE_INPUT} placeholder="New York" disabled={isDisabled} />
                </InputField>

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

            {/* ── Step 3: Document Upload ── */}
            {(step === 3 || isDisabled) && (
              <>
                {isDisabled && <hr className="border-[#e5eef0]" />}
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0AE0D0] text-white flex items-center justify-center text-[9px]">3</span>
                  Identity Document
                </p>

                {/* Info notice */}
                <div className="rounded-[14px] px-4 py-3 flex items-start gap-2.5 text-xs text-text-muted" style={{ background: 'rgba(10,224,208,0.06)', border: '1px solid rgba(10,224,208,0.15)' }}>
                  <span className="text-base flex-shrink-0 mt-0.5">ℹ️</span>
                  <span>{t('kyc.docUploadInfo')}</span>
                </div>
                {/* Clear photo warning */}
                <div className="rounded-[14px] px-4 py-3 flex items-start gap-2.5 text-xs font-semibold" style={{ background: 'rgba(238,130,103,0.08)', border: '1px solid rgba(238,130,103,0.25)', color: '#c45a38' }}>
                  <span className="text-base flex-shrink-0 mt-0.5">📸</span>
                  <span>{t('kyc.clearPhotoNote')}</span>
                </div>

                <InputField label="Document Type" icon="🪪">
                  <select name="kycDocType" value={form.kycDocType} onChange={handleChange}
                    className={PROFILE_INPUT} disabled={isDisabled}>
                    <option value="">{t('kyc.selectDocType')}</option>
                    {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{t(`kyc.docType.${d.value}`)}</option>)}
                  </select>
                </InputField>

                <div className="grid grid-cols-2 gap-3">
                  <UploadBox
                    label="Front Side"
                    icon="🖼️"
                    preview={docPreviews.kycDocFront}
                    onChange={handleFileChange('kycDocFront')}
                    disabled={isDisabled}
                  />
                  <UploadBox
                    label="Back Side"
                    icon="🖼️"
                    preview={docPreviews.kycDocBack}
                    onChange={handleFileChange('kycDocBack')}
                    disabled={isDisabled}
                  />
                </div>

                <UploadBox
                  label="Selfie Holding Document"
                  icon="🤳"
                  preview={docPreviews.kycDocSelfie}
                  onChange={handleFileChange('kycDocSelfie')}
                  disabled={isDisabled}
                />

                {!isDisabled && (
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)}
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

            {/* ── Step 4: Review & Submit ── */}
            {step === 4 && !isDisabled && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0ECB81] text-white flex items-center justify-center text-[9px]">4</span>
                  Review & Submit
                </p>

                {/* Summary card */}
                <div className="rounded-[20px] p-4 space-y-3" style={{ background: '#f7fbfb', border: '1px solid #d9e6e7' }}>
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Personal</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-text-muted">First Name</span><p className="font-semibold text-text-primary mt-0.5">{form.firstName || '—'}</p></div>
                    <div><span className="text-text-muted">Last Name</span><p className="font-semibold text-text-primary mt-0.5">{form.lastName || '—'}</p></div>
                    <div className="col-span-2"><span className="text-text-muted">Phone</span><p className="font-semibold text-text-primary mt-0.5">{dialCode} {phoneNumber || '—'}</p></div>
                    <div className="col-span-2"><span className="text-text-muted">Nationality</span><p className="font-semibold text-text-primary mt-0.5">{form.country || '—'}</p></div>
                  </div>
                  <hr className="border-[#d9e6e7]" />
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Address</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2"><span className="text-text-muted">Street</span><p className="font-semibold text-text-primary mt-0.5">{form.address || '—'}</p></div>
                    <div><span className="text-text-muted">City</span><p className="font-semibold text-text-primary mt-0.5">{form.city || '—'}</p></div>
                    <div><span className="text-text-muted">ZIP</span><p className="font-semibold text-text-primary mt-0.5">{form.zipCode || '—'}</p></div>
                    <div className="col-span-2"><span className="text-text-muted">State / Region</span><p className="font-semibold text-text-primary mt-0.5">{form.state || '—'}</p></div>
                  </div>
                  <hr className="border-[#d9e6e7]" />
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Documents</p>
                  <div className="text-xs space-y-1">
                    <div><span className="text-text-muted">{t('kyc.documentType')}</span><p className="font-semibold text-text-primary mt-0.5">{docTypeLabel}</p></div>
                    <div className="flex gap-2 mt-2">
                      {docPreviews.kycDocFront && (
                        <div className="flex-1 rounded-[10px] overflow-hidden" style={{ maxHeight: 70 }}>
                          <img src={docPreviews.kycDocFront} className="w-full h-full object-cover" alt="Front" />
                        </div>
                      )}
                      {docPreviews.kycDocBack && (
                        <div className="flex-1 rounded-[10px] overflow-hidden" style={{ maxHeight: 70 }}>
                          <img src={docPreviews.kycDocBack} className="w-full h-full object-cover" alt="Back" />
                        </div>
                      )}
                      {docPreviews.kycDocSelfie && (
                        <div className="flex-1 rounded-[10px] overflow-hidden" style={{ maxHeight: 70 }}>
                          <img src={docPreviews.kycDocSelfie} className="w-full h-full object-cover" alt="Selfie" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Consent notice */}
                <div className="rounded-[16px] px-4 py-3 flex items-start gap-2.5 text-xs text-text-muted" style={{ background: 'rgba(10,224,208,0.06)', border: '1px solid rgba(10,224,208,0.15)' }}>
                  <span className="text-base flex-shrink-0 mt-0.5">ℹ️</span>
                  <span>By submitting, you confirm that all information is accurate and truthful, and you consent to identity verification in accordance with international compliance standards.</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(3)}
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
