import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useTranslation } from 'react-i18next';

const PANEL = 'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';

export default function CustomerService() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({ telegram_link: '', support_email: '', telegram_username: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.getSupport()
      .then(({ data }) => setSettings(data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const telegram = settings.telegram_link || 'https://t.me/cexsupport2067';
  const email    = settings.support_email || 'cexsupporthelp@gmail.com';
  const tgUser   = settings.telegram_username || 'cexsupport2067';

  return (
    <div className="space-y-4 animate-fade-in">
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className={`${PANEL} h-20 p-5 animate-pulse`} />)}
        </div>
      ) : (
        <div className="space-y-3">

          {/* Telegram */}
          {(telegram || tgUser) && (
            <a
              href={telegram || `https://t.me/${tgUser}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${PANEL} block p-5 flex items-center gap-4 hover:border-brand-primary/40 transition-colors active:scale-95`}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)' }}>
                ✈️
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary">{t('support.telegram')}</p>
                <p className="text-sm text-text-muted mt-0.5">
                  {tgUser ? `@${tgUser}` : 'Click to open Telegram'}
                </p>
                <p className="text-xs text-brand-primary mt-1">{t('support.tapMessage')}</p>
              </div>
              <span className="text-text-muted text-xl">›</span>
            </a>
          )}

          {/* Email */}
          {email && (
            <a
              href={`mailto:${email}`}
              className={`${PANEL} block p-5 flex items-center gap-4 hover:border-brand-primary/40 transition-colors active:scale-95`}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(14,203,129,0.15)', border: '1px solid rgba(14,203,129,0.3)' }}>
                📧
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary">{t('support.email')}</p>
                <p className="text-sm text-text-muted truncate mt-0.5">{email}</p>
                <p className="text-xs text-green-trade mt-1">{t('support.tapEmail')}</p>
              </div>
              <span className="text-text-muted text-xl">›</span>
            </a>
          )}

          {/* Info box */}
          <div className={`${PANEL} p-4 space-y-2`}>
            <p className="text-sm font-semibold text-text-primary">📌 {t('support.responseTimes')}</p>
            <div className="space-y-1.5 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Telegram</span><span className="text-green-trade font-medium">Usually within 1 hour</span>
              </div>
              <div className="flex justify-between">
                <span>Email</span><span className="text-yellow-400 font-medium">Within 24 hours</span>
              </div>
              <div className="flex justify-between">
                <span>Deposit approval</span><span className="text-brand-primary font-medium">Within 30 minutes</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
