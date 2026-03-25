import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const PANEL = 'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';

const ISSUE_TYPES = [
  {
    icon: '💰',
    title: 'Deposit Issue',
    description: 'Deposit not credited to your account after sending funds.',
    color: '#0ECB81',
    bgColor: '#0ECB8118',
    borderColor: '#0ECB8140',
    detail: 'If your deposit hasn\'t been credited within 24 hours, our team will investigate and resolve it promptly.',
  },
  {
    icon: '🔑',
    title: 'Account Issue',
    description: 'Can\'t login, access your account, or security concerns.',
    color: '#0075bb',
    bgColor: '#0075bb18',
    borderColor: '#0075bb40',
    detail: 'Issues with login, password recovery, 2FA, or account security are handled with highest priority.',
  },
  {
    icon: '📊',
    title: 'Trade Issue',
    description: 'Trade problem, wrong result, or balance discrepancy.',
    color: '#fcd535',
    bgColor: '#fcd53518',
    borderColor: '#fcd53540',
    detail: 'Trading disputes and balance discrepancies are reviewed within 12 hours by our trading team.',
  },
];

const STEPS = [
  {
    num: '1',
    title: 'Describe Your Issue',
    desc: 'Provide a clear and detailed description of the problem you\'re facing.',
  },
  {
    num: '2',
    title: 'Provide Transaction ID',
    desc: 'If applicable, include your transaction hash, trade ID, or deposit reference.',
  },
  {
    num: '3',
    title: 'Wait for Response',
    desc: 'Our support team typically responds within 24-48 hours on business days.',
  },
];

export default function Recovery() {
  const [supportLinks, setSupportLinks] = useState(null);
  const [loadingLinks, setLoadingLinks] = useState(true);

  useEffect(() => {
    const fetchSupport = async () => {
      try {
        const { data } = await settingsAPI.getSupport();
        setSupportLinks(data);
      } catch (_) {
        setSupportLinks(null);
      } finally {
        setLoadingLinks(false);
      }
    };
    fetchSupport();
  }, []);

  const handleContactSupport = (type) => {
    // If support link exists, open it; otherwise navigate to /support
    if (supportLinks?.telegramLink) {
      window.open(supportLinks.telegramLink, '_blank');
    } else if (supportLinks?.whatsappLink) {
      window.open(supportLinks.whatsappLink, '_blank');
    } else {
      window.location.href = '/support';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      <div className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0b2026_0%,#114850_48%,#1b6d71_100%)] px-6 py-7 text-white shadow-[0_28px_90px_rgba(8,32,38,0.28)] md:px-8">
        <h1 className="text-[36px] font-light leading-[1.04] tracking-[-0.03em] md:text-[46px]">Recovery and issue resolution center.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/68 md:text-base">Support paths, issue cards and direct contact options now match the same exchange-style visual system.</p>
      </div>

      {/* Issue Type Cards */}
      <div className="grid grid-cols-1 gap-4">
        {ISSUE_TYPES.map((issue) => (
          <div
            key={issue.title}
            className={`${PANEL} p-5`}
            style={{ borderColor: issue.borderColor }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: issue.bgColor, border: `1px solid ${issue.borderColor}` }}
              >
                {issue.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-text-primary text-base">{issue.title}</h3>
                <p className="text-sm text-text-secondary mt-1">{issue.description}</p>
                <p className="text-xs text-text-muted mt-2">{issue.detail}</p>
                <button
                  onClick={() => handleContactSupport(issue.title)}
                  className="mt-3 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: issue.bgColor,
                    color: issue.color,
                    border: `1px solid ${issue.borderColor}`,
                  }}
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How to Get Help Section */}
      <div className={`${PANEL} p-5`}>
        <h3 className="font-bold text-text-primary mb-4">How to Get Help Fast</h3>
        <div className="space-y-4">
          {STEPS.map((step) => (
            <div key={step.num} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 bg-brand-primary/15 text-brand-primary border-2 border-brand-primary/30">
                {step.num}
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">{step.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support Links */}
      <div className={`${PANEL} border-brand-primary/20 bg-brand-primary/5 p-5`}>
        <h3 className="font-bold text-text-primary mb-1">Reach Us Directly</h3>
        <p className="text-sm text-text-secondary mb-4">
          Our support team is available to assist you across multiple channels.
        </p>

        {loadingLinks ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {supportLinks?.telegramLink && (
              <a
                href={supportLinks.telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`${PANEL} flex items-center gap-3 rounded-[22px] p-4 transition-all hover:border-brand-primary/40 active:scale-95`}
              >
                <span className="text-2xl">✈️</span>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Telegram</p>
                  <p className="text-xs text-text-secondary">Live chat support</p>
                </div>
              </a>
            )}
            {supportLinks?.whatsappLink && (
              <a
                href={supportLinks.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`${PANEL} flex items-center gap-3 rounded-[22px] p-4 transition-all hover:border-green-trade/40 active:scale-95`}
              >
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-semibold text-text-primary text-sm">WhatsApp</p>
                  <p className="text-xs text-text-secondary">Message us directly</p>
                </div>
              </a>
            )}
            {supportLinks?.email && (
              <a
                href={`mailto:${supportLinks.email}`}
                className={`${PANEL} flex items-center gap-3 rounded-[22px] p-4 transition-all hover:border-brand-primary/40 active:scale-95`}
              >
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Email</p>
                  <p className="text-xs text-text-secondary truncate">{supportLinks.email}</p>
                </div>
              </a>
            )}
            <a
              href="/support"
              className={`${PANEL} flex items-center gap-3 rounded-[22px] p-4 transition-all hover:border-brand-primary/40 active:scale-95`}
            >
              <span className="text-2xl">🎧</span>
              <div>
                <p className="font-semibold text-text-primary text-sm">Support Center</p>
                <p className="text-xs text-text-secondary">View all options</p>
              </div>
            </a>
          </div>
        )}
      </div>

      {/* Response Time Info */}
      <div className={`${PANEL} flex items-center gap-3 rounded-[24px] px-5 py-4`}>
        <span className="text-xl flex-shrink-0">⏱️</span>
        <p className="text-sm text-text-secondary">
          Average response time: <span className="text-text-primary font-semibold">24-48 hours</span>.
          Urgent issues are prioritized and resolved faster.
        </p>
      </div>
    </div>
  );
}
