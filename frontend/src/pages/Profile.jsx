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

const KYC_STATUS = {
  unverified: { label: 'Not Submitted',  cls: 'bg-light-border text-text-muted',          icon: '⬜' },
  pending:    { label: 'Under Review',   cls: 'bg-yellow-500/15 text-yellow-400',         icon: '🕐' },
  verified:   { label: 'Verified',       cls: 'bg-green-trade/15 text-green-trade',       icon: '✅' },
  rejected:   { label: 'Rejected',       cls: 'bg-red-trade/15 text-red-trade',           icon: '❌' },
};

const PROFILE_PANEL =
  'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';
const PROFILE_INPUT =
  'input-field rounded-[22px] border-[#d7e4e5] bg-[#f7fbfb]';

export default function Profile() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('kyc'); // 'kyc' | 'password'
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

  const kycStatus = user?.kycStatus || 'unverified';
  const kycConfig = KYC_STATUS[kycStatus];
  const isVerified = kycStatus === 'verified';
  const isPending  = kycStatus === 'pending';

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSaveKyc = async () => {
    if (!form.firstName || !form.lastName) return toast.error('First and last name are required');
    setSaving(true);
    try {
      await profileAPI.update(form);
      await refreshUser();
      toast.success('Profile updated! KYC is under review.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error('Fill in all fields');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 gap-1.5 rounded-[28px] border border-[#d9e6e7] bg-white p-1.5 shadow-[0_18px_50px_rgba(8,35,41,0.07)]">
        {[['kyc', t('profile.kyc')], ['password', t('profile.changePassword')]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-[22px] py-3 text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-[#ee8267] text-white shadow-[0_12px_28px_rgba(238,130,103,0.22)]'
                : 'text-text-secondary hover:-translate-y-0.5 hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KYC Tab */}
      {tab === 'kyc' && (
        <div className={`${PROFILE_PANEL} space-y-4 p-6`}>
          {/* Status banner */}
          {isPending && (
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
              <span className="text-2xl">🕐</span>
              <div>
                <p className="text-sm font-semibold text-yellow-400">{t('profile.kycUnderReview')}</p>
                <p className="text-xs text-text-muted mt-0.5">{t('profile.kycUnderReviewDesc')}</p>
              </div>
            </div>
          )}
          {isVerified && (
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.3)' }}>
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-green-trade">{t('profile.kycVerified')}</p>
                <p className="text-xs text-text-muted mt-0.5">{t('profile.kycVerifiedDesc')}</p>
              </div>
            </div>
          )}
          {kycStatus === 'rejected' && (
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(242,60,72,0.1)', border: '1px solid rgba(242,60,72,0.3)' }}>
              <span className="text-2xl">❌</span>
              <div>
                <p className="text-sm font-semibold text-red-trade">{t('profile.kycRejected')}</p>
                <p className="text-xs text-text-muted mt-0.5">{t('profile.kycRejectedDesc')}</p>
              </div>
            </div>
          )}

          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{t('profile.personalInfo')}</p>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">{t('profile.firstName')}</label>
              <input name="firstName" value={form.firstName} onChange={handleChange}
                className={PROFILE_INPUT} placeholder="John" disabled={isVerified || isPending} />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">{t('profile.lastName')}</label>
              <input name="lastName" value={form.lastName} onChange={handleChange}
                className={PROFILE_INPUT} placeholder="Doe" disabled={isVerified || isPending} />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">{t('profile.mobile')}</label>
            <input name="mobile" value={form.mobile} onChange={handleChange}
              className={PROFILE_INPUT} placeholder="+880 1XXX XXXXXX" type="tel"
              disabled={isVerified || isPending} />
          </div>

          <p className="text-xs text-text-muted font-medium uppercase tracking-wider pt-2">{t('profile.address')}</p>

          {/* Address */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">{t('profile.streetAddress')}</label>
            <input name="address" value={form.address} onChange={handleChange}
              className={PROFILE_INPUT} placeholder="House/Road/Area" disabled={isVerified || isPending} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">{t('profile.city')}</label>
              <input name="city" value={form.city} onChange={handleChange}
                className={PROFILE_INPUT} placeholder="Dhaka" disabled={isVerified || isPending} />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">{t('profile.zip')}</label>
              <input name="zipCode" value={form.zipCode} onChange={handleChange}
                className={PROFILE_INPUT} placeholder="1200" disabled={isVerified || isPending} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">{t('profile.state')}</label>
              <input name="state" value={form.state} onChange={handleChange}
                className={PROFILE_INPUT} placeholder="Dhaka" disabled={isVerified || isPending} />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">{t('profile.country')}</label>
              <select name="country" value={form.country} onChange={handleChange}
                className={PROFILE_INPUT} disabled={isVerified || isPending}
                style={{ fontSize: '16px' }}>
                <option value="">{t('profile.selectCountry')}</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {!isVerified && !isPending && (
            <button onClick={handleSaveKyc} disabled={saving}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#ee8267] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a]">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? t('common.loading') : t('profile.submit')}
            </button>
          )}
        </div>
      )}

      {/* Change Password Tab */}
      {tab === 'password' && (
        <div className={`${PROFILE_PANEL} space-y-4 p-6`}>
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{t('profile.changePassword')}</p>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">{t('profile.currentPassword')}</label>
            <input type="password" value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              className={PROFILE_INPUT} placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">{t('profile.newPassword')}</label>
            <input type="password" value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              className={PROFILE_INPUT} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">{t('profile.confirmPassword')}</label>
            <input type="password" value={pwForm.confirmPassword}
              onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className={PROFILE_INPUT} placeholder="Repeat new password" />
          </div>
          <button onClick={handleChangePassword} disabled={pwSaving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#ee8267] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a]">
            {pwSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {pwSaving ? t('common.loading') : t('profile.changePassword')}
          </button>
        </div>
      )}
    </div>
  );
}
