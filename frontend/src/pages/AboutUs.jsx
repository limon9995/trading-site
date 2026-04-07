import React from 'react';

const STATS = [
  { value: '5M+',    label: 'Registered Users',   color: '#EE8267' },
  { value: '180+',   label: 'Countries Supported', color: '#0ECB81' },
  { value: '$2B+',   label: 'Trading Volume',      color: '#185B64' },
  { value: '99.9%',  label: 'Platform Uptime',     color: '#a855f7' },
];

const FEATURES = [
  {
    color: '#EE8267',
    bg: '#EE826715',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
    ),
    title: 'Bank-Grade Security',
    desc: 'Your assets are protected with 256-bit SSL encryption, two-factor authentication, and cold storage for 95% of funds. We meet the highest security standards in the industry.',
  },
  {
    color: '#0ECB81',
    bg: '#0ECB8115',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
    title: 'Lightning Fast Trades',
    desc: 'Our matching engine processes over 1 million orders per second with sub-millisecond latency, ensuring you never miss a market opportunity.',
  },
  {
    color: '#185B64',
    bg: '#185B6415',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    title: 'Competitive Fees',
    desc: 'Enjoy some of the lowest trading fees in the industry — starting from just 0.1%. The more you trade, the more you save with our tiered fee structure.',
  },
  {
    color: '#06b6d4',
    bg: '#06b6d415',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
      </svg>
    ),
    title: '24/7 Live Support',
    desc: 'Our dedicated support team is available around the clock via live chat, email, and Telegram. Average response time under 5 minutes.',
  },
  {
    color: '#a855f7',
    bg: '#a855f715',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
    title: 'Advanced Trading Tools',
    desc: 'Access professional-grade charts, real-time market data, binary trading options, and automated investment plans to grow your portfolio.',
  },
  {
    color: '#f97316',
    bg: '#f9731615',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    title: 'Global Coverage',
    desc: 'Trade 200+ cryptocurrencies and access markets from 180+ countries. Multi-language support and local payment methods available worldwide.',
  },
];

const TIMELINE = [
  { year: '2017', title: 'Founded', desc: 'CEX Exchange was established with a vision to make crypto trading accessible to everyone.' },
  { year: '2018', title: '1M Users', desc: 'Reached 1 million registered users and expanded support to 50+ countries.' },
  { year: '2020', title: 'Mobile App', desc: 'Launched our award-winning mobile application for iOS and Android platforms.' },
  { year: '2022', title: '$1B Volume', desc: 'Crossed $1 billion in daily trading volume and introduced advanced investment plans.' },
  { year: '2024', title: '5M+ Users', desc: 'Serving over 5 million traders worldwide with 200+ trading pairs and cutting-edge features.' },
];

export default function AboutUs() {
  return (
    <div className="space-y-5 animate-fade-in pb-6">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="rounded-[28px] overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #071d23 0%, #0f545a 62%, #114147 100%)', boxShadow: '0 20px 50px rgba(14,32,38,0.25)' }}>
        {/* Glow */}
        <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(238,130,103,0.18) 0%, transparent 70%)', transform: 'translate(20%,-20%)' }} />
        <div className="absolute bottom-0 left-0 w-40 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(14,203,129,0.12) 0%, transparent 70%)', transform: 'translate(-20%,20%)' }} />

        <div className="relative p-6 sm:p-8">
          {/* Logo badge */}
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(238,130,103,0.15)', border: '1px solid rgba(238,130,103,0.3)' }}>
            <div className="w-2 h-2 rounded-full bg-[#EE8267] animate-pulse" />
            <span className="text-[#EE8267] text-xs font-semibold tracking-wide">Trusted Since 2017</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
            The World's Leading<br />
            <span style={{ color: '#EE8267' }}>Crypto Exchange</span>
          </h1>
          <p className="text-white/65 text-sm leading-relaxed max-w-sm">
            CEX Exchange is a globally trusted cryptocurrency trading platform offering secure, fast, and transparent digital asset trading for millions of users worldwide.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {STATS.map(s => (
              <div key={s.label} className="rounded-[16px] p-3.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mission ──────────────────────────────────────────────────── */}
      <div className="rounded-[24px] p-5 cex-surface">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #EE8267 0%, #f4927e 100%)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-text-primary dark:text-white text-base mb-1.5">Our Mission</h2>
            <p className="text-sm text-text-secondary dark:text-white/60 leading-relaxed">
              To democratize access to financial markets by providing a secure, transparent, and user-friendly cryptocurrency trading platform that empowers everyone — from beginners to professional traders — to participate in the digital economy.
            </p>
          </div>
        </div>
      </div>

      {/* ── Vision ───────────────────────────────────────────────────── */}
      <div className="rounded-[24px] p-5 cex-surface">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #185B64 0%, #0f545a 100%)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-text-primary dark:text-white text-base mb-1.5">Our Vision</h2>
            <p className="text-sm text-text-secondary dark:text-white/60 leading-relaxed">
              To become the world's most trusted and innovative cryptocurrency exchange — building a future where digital assets are as accessible, reliable, and secure as traditional banking for every person on the planet.
            </p>
          </div>
        </div>
      </div>

      {/* ── Why Choose Us ────────────────────────────────────────────── */}
      <div className="rounded-[24px] overflow-hidden cex-surface">
        <div className="px-5 pt-5 pb-3 border-b border-light-border dark:border-white/8">
          <h2 className="font-bold text-text-primary dark:text-white text-base">Why Choose CEX?</h2>
          <p className="text-xs text-text-muted dark:text-white/40 mt-0.5">Everything you need in one platform</p>
        </div>
        <div className="divide-y divide-light-border dark:divide-white/8">
          {FEATURES.map(f => (
            <div key={f.title} className="flex items-start gap-4 p-4">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
                style={{ background: f.bg, color: f.color, border: `1px solid ${f.color}30` }}>
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary dark:text-white text-sm">{f.title}</p>
                <p className="text-xs text-text-muted dark:text-white/50 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      <div className="rounded-[24px] overflow-hidden cex-surface">
        <div className="px-5 pt-5 pb-3 border-b border-light-border dark:border-white/8">
          <h2 className="font-bold text-text-primary dark:text-white text-base">Our Journey</h2>
          <p className="text-xs text-text-muted dark:text-white/40 mt-0.5">From startup to global leader</p>
        </div>
        <div className="p-4 space-y-0">
          {TIMELINE.map((item, i) => (
            <div key={item.year} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs text-white"
                  style={{ background: 'linear-gradient(135deg, #EE8267, #185B64)' }}>
                  {item.year.slice(2)}
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className="w-0.5 flex-1 my-1" style={{ background: 'linear-gradient(to bottom, #EE826740, transparent)' }} />
                )}
              </div>
              <div className={`flex-1 pb-4 ${i === TIMELINE.length - 1 ? '' : ''}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold" style={{ color: '#EE8267' }}>{item.year}</span>
                  <span className="font-semibold text-text-primary dark:text-white text-sm">{item.title}</span>
                </div>
                <p className="text-xs text-text-muted dark:text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Compliance & Trust ───────────────────────────────────────── */}
      <div className="rounded-[24px] p-5 cex-surface">
        <h2 className="font-bold text-text-primary dark:text-white text-base mb-4">Compliance & Trust</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🛡️', label: 'Regulated Exchange', sub: 'Fully licensed & compliant' },
            { icon: '🔒', label: 'Cold Storage', sub: '95% funds offline' },
            { icon: '✅', label: 'KYC / AML', sub: 'Identity verified' },
            { icon: '📋', label: 'Audited', sub: 'Regular security audits' },
          ].map(item => (
            <div key={item.label} className="rounded-[16px] p-3.5 text-center"
              style={{ background: 'rgba(24,91,100,0.06)', border: '1px solid rgba(24,91,100,0.12)' }}>
              <div className="text-2xl mb-1.5">{item.icon}</div>
              <p className="font-semibold text-text-primary dark:text-white text-xs">{item.label}</p>
              <p className="text-[11px] text-text-muted dark:text-white/40 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contact Banner ───────────────────────────────────────────── */}
      <div className="rounded-[24px] p-5 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(238,130,103,0.12) 0%, rgba(24,91,100,0.12) 100%)', border: '1px solid rgba(238,130,103,0.2)' }}>
        <p className="font-bold text-text-primary dark:text-white text-base mb-1">Have Questions?</p>
        <p className="text-xs text-text-muted dark:text-white/50 mb-4">Our team is here to help 24/7</p>
        <div className="flex gap-2 justify-center flex-wrap">
          <a href="https://t.me/cexsupport2067" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #0088cc, #0066aa)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.546c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.15 14.26l-2.95-.924c-.64-.203-.654-.64.136-.948l11.522-4.44c.534-.194 1.001.13.704.3z"/>
            </svg>
            Telegram
          </a>
          <a href="mailto:cexsupporthelp@gmail.com"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #EE8267, #E55D4E)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Email Us
          </a>
        </div>
      </div>

    </div>
  );
}
