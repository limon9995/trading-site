import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI, profileAPI } from '../services/api';


const DOC_TYPES = [
  { value: 'passport' },
  { value: 'national_id' },
  { value: 'driving_license' },
];

const PROFILE_INPUT =
  'w-full rounded-[16px] border border-[#b0c8cc] bg-[#f0f8f9] px-4 py-3 text-sm text-text-primary outline-none transition-all focus:border-[#0AE0D0] focus:ring-2 focus:ring-[#0AE0D0]/20 disabled:opacity-50';

function InputField({ label, icon, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-secondary mb-2 block flex items-center gap-1.5">
        <span className="text-[13px]">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function KycStatusBanner({ status, t }) {
  if (status === 'unverified') return null;
  const configs = {
    pending:  { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.35)',  icon: '🕐', titleKey: 'auth.kycUnderReviewBanner',   descKey: 'auth.kycUnderReviewDesc2', textColor: '#ca8a04' },
    verified: { bg: 'rgba(14,203,129,0.08)', border: 'rgba(14,203,129,0.35)', icon: '✅', titleKey: 'auth.kycVerifiedBannerTitle',  descKey: 'auth.kycVerifiedBannerDesc', textColor: '#0ECB81' },
    rejected: { bg: 'rgba(246,70,93,0.08)',  border: 'rgba(246,70,93,0.35)',  icon: '❌', titleKey: 'auth.kycRejectedBannerTitle',  descKey: 'auth.kycRejectedBannerDesc', textColor: '#f6465d' },
  };
  const c = configs[status];
  return (
    <div className="rounded-[20px] p-4 flex items-start gap-3.5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        {c.icon}
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: c.textColor }}>{t(c.titleKey)}</p>
        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t(c.descKey)}</p>
      </div>
    </div>
  );
}


function UploadBox({ label, icon, preview, onChange, disabled, tapLabel }) {
  const ref = useRef();
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
        <span>{icon}</span>{label}
      </p>
      <div
        onClick={() => !disabled && ref.current?.click()}
        className={`relative rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#0AE0D0]'
        } ${preview ? 'border-[#0ECB81]' : 'border-[#8ab5bc]'}`}
        style={{ minHeight: 90, background: preview ? '#e8f7f1' : '#edf5f6' }}
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover" style={{ maxHeight: 120 }} />
        ) : (
          <div className="flex flex-col items-center gap-1 py-4 px-2 text-center">
            <span className="text-2xl" style={{ opacity: 0.6 }}>📎</span>
            <span className="text-[10px] font-semibold text-text-secondary">{tapLabel}</span>
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
  const [tab, setTab] = useState('kyc');
  const [saving, setSaving] = useState(false);

  const [kycDocType, setKycDocType] = useState(user?.kycDocType || '');

  // Local-only previews — photos are NOT sent to server
  const [docPreviews, setDocPreviews] = useState({
    kycDocFront: null,
    kycDocBack:  null,
  });

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ cur: false, new: false, con: false });

  const kycStatus  = user?.kycStatus || 'unverified';
  const isVerified = kycStatus === 'verified';
  const isPending  = kycStatus === 'pending';
  const isDisabled = isVerified || isPending;

  const handleFileChange = (field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Aggressively resize for mobile uploads — keep max 1200px, quality 0.75
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        setDocPreviews(p => ({ ...p, [field]: compressed }));
      };
      img.onerror = () => {
        // Fallback: use raw base64 if image parsing fails
        setDocPreviews(p => ({ ...p, [field]: ev.target.result }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveKyc = async () => {
    if (!kycDocType) return toast.error(t('kyc.selectDocType'));
    if (!docPreviews.kycDocFront) return toast.error(t('auth.frontSideDoc'));
    if (!docPreviews.kycDocBack) return toast.error(t('auth.backSideDoc'));
    setSaving(true);
    try {
      // Only send document type — NO photos sent to server
      await profileAPI.submitKyc(kycDocType);
      await refreshUser();
      toast.success(t('auth.kycSubmitted'));
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit KYC';
      toast.error(msg, { duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error(t('auth.fillAllFields'));
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error(t('auth.passwordsMismatch'));
    if (pwForm.newPassword.length < 6) return toast.error(t('auth.minSixChars'));
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success(t('auth.passwordChanged'));
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
              KYC {kycStatus === 'verified' ? t('profile.kycVerifiedBadge') : kycStatus === 'pending' ? t('profile.kycPendingBadge') : t('profile.kycNotSubmitted')}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-white/40">{t('profile.planLabel')}</p>
            <p className="text-white font-bold text-sm mt-1">{user?.plan && user.plan !== 'none' ? user.plan.toUpperCase() : 'STANDARD'}</p>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="grid grid-cols-2 gap-1.5 rounded-[28px] border border-[#d9e6e7] bg-white p-1.5 shadow-[0_18px_50px_rgba(8,35,41,0.07)]">
        {[['kyc', `🪪  ${t('profile.kycTab')}`], ['password', `🔐  ${t('profile.passwordTab')}`]].map(([key, label]) => (
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
        <div className="rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)] p-5 space-y-4">

          {/* Status banner */}
          {kycStatus !== 'unverified' && <KycStatusBanner status={kycStatus} t={t} />}

          {/* Unverified intro */}
          {kycStatus === 'unverified' && (
            <div className="rounded-[20px] p-4 flex items-start gap-3" style={{ background: 'rgba(10,224,208,0.06)', border: '1px solid rgba(10,224,208,0.2)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(10,224,208,0.12)' }}>🛡️</div>
              <div>
                <p className="text-sm font-bold text-text-primary">{t('profile.identityRequired')}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t('profile.identityRequiredDesc')}</p>
              </div>
            </div>
          )}

          {/* Info notice */}
          <div className="rounded-[14px] px-4 py-3 flex items-start gap-2.5 text-xs text-text-secondary" style={{ background: 'rgba(10,224,208,0.1)', border: '1px solid rgba(10,224,208,0.3)' }}>
            <span className="text-base flex-shrink-0 mt-0.5">ℹ️</span>
            <span>{t('kyc.docUploadInfo')}</span>
          </div>

          {/* Clear photo warning */}
          <div className="rounded-[14px] px-4 py-3 flex items-start gap-2.5 text-xs font-semibold" style={{ background: 'rgba(238,130,103,0.12)', border: '1px solid rgba(238,130,103,0.4)', color: '#b94a2a' }}>
            <span className="text-base flex-shrink-0 mt-0.5">📸</span>
            <span>{t('kyc.clearPhotoNote')}</span>
          </div>

          {/* Document type */}
          <InputField label={t('kyc.documentType')} icon="🪪">
            <select
              value={kycDocType}
              onChange={e => setKycDocType(e.target.value)}
              className={PROFILE_INPUT}
              disabled={isDisabled}
            >
              <option value="">{t('kyc.selectDocType')}</option>
              {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{t(`kyc.docType.${d.value}`)}</option>)}
            </select>
          </InputField>

          {/* Front & Back upload */}
          <div className="grid grid-cols-2 gap-3">
            <UploadBox
              label={t('kyc.frontSide')}
              icon="🖼️"
              preview={docPreviews.kycDocFront}
              onChange={handleFileChange('kycDocFront')}
              disabled={isDisabled}
              tapLabel={t('profile.tapToUpload')}
            />
            <UploadBox
              label={t('kyc.backSide')}
              icon="🖼️"
              preview={docPreviews.kycDocBack}
              onChange={handleFileChange('kycDocBack')}
              disabled={isDisabled}
              tapLabel={t('profile.tapToUpload')}
            />
          </div>

          {/* Submit */}
          {!isDisabled && (
            <button onClick={handleSaveKyc} disabled={saving}
              className="w-full py-3.5 rounded-[18px] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#ee8267,#f4927e)', boxShadow: '0 12px 32px rgba(238,130,103,0.3)' }}>
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? t('profile.submitting') : `🚀 ${t('profile.submitKyc')}`}
            </button>
          )}

        </div>
      )}

      {/* ── Change Password Tab ── */}
      {tab === 'password' && (
        <div className="rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)] p-5 space-y-4">
          <div className="flex items-center gap-3 pb-2">
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-xl" style={{ background: '#ee826715' }}>🔐</div>
            <div>
              <p className="font-bold text-text-primary text-sm">{t('profile.changePassword')}</p>
              <p className="text-xs text-text-muted">{t('profile.keepSecure')}</p>
            </div>
          </div>

          {[
            { key: 'cur',  field: 'currentPassword', labelKey: 'profile.currentPassword', placeholder: '••••••••' },
            { key: 'new',  field: 'newPassword',      labelKey: 'profile.newPassword',     placeholder: t('auth.minChars') },
            { key: 'con',  field: 'confirmPassword',  labelKey: 'profile.confirmPassword', placeholder: t('auth.minChars') },
          ].map(({ key, field, labelKey, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-text-secondary mb-2 block">{t(labelKey)}</label>
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
                {pwForm.newPassword.length < 4 ? t('profile.weakPw') : pwForm.newPassword.length < 8 ? t('profile.fairPw') : pwForm.newPassword.length < 12 ? t('profile.goodPw') : t('profile.strongPw')}
              </span>
            </div>
          )}

          <button onClick={handleChangePassword} disabled={pwSaving}
            className="w-full py-3.5 rounded-[18px] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#ee8267,#f4927e)', boxShadow: '0 12px 32px rgba(238,130,103,0.3)' }}>
            {pwSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {pwSaving ? t('profile.saving') : t('profile.updatePassword')}
          </button>
        </div>
      )}
    </div>
  );
}
