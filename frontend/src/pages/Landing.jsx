import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PAY_OPTIONS = [
  { code: 'USD', icon: '$', label: 'US Dollar',       color: '#22c55e' },
  { code: 'EUR', icon: '€', label: 'Euro',             color: '#3b82f6' },
  { code: 'GBP', icon: '£', label: 'British Pound',   color: '#8b5cf6' },
];

const RECEIVE_OPTIONS = [
  { code: 'BTC',  icon: '₿', label: 'Bitcoin',  color: '#f7931a', rate: 0.000014 },
  { code: 'ETH',  icon: 'Ξ', label: 'Ethereum', color: '#627eea', rate: 0.00025  },
  { code: 'USDT', icon: '₮', label: 'Tether',   color: '#26a17b', rate: 1        },
];

const HEADER_LINKS = ['Products', 'Prices', 'University', 'Company'];

const MARKET_TABS = ['Top gainers', 'Top decliners', 'New markets', 'Top by market cap'];

const PROMO_CARDS = [
  { emoji: '☘️', label: 'Up 20% fee rebate in BTC', body: 'Get up to 100% fee rebate on BTC/USD trades this week.', cta: 'Claim now' },
  { emoji: '🔥', label: '$300K Competition is LIVE', body: 'Join the live trading competition and win your share of the prize pool.', cta: 'Join now' },
  { emoji: '🤩', label: 'Swap for free!', body: 'Swap USDT ↔ USDC with zero fees. Available for all users.', cta: 'Swap now' },
  { emoji: '🤑', label: 'Earn 30% on your friends', body: 'Invite friends and earn 30% commission on every trade they make.', cta: 'Invite friends' },
];

const MARKETS = [
  { pair: 'BTC / USD', price: '$67,432.50', change: '+2.34%', up: true,  spark: 'M0 28 L8 22 L16 25 L24 15 L32 18 L40 10 L48 14 L56 8 L64 12' },
  { pair: 'ETH / USD', price: '$3,521.80',  change: '+1.87%', up: true,  spark: 'M0 24 L8 20 L16 22 L24 14 L32 17 L40 11 L48 15 L56 8 L64 10' },
  { pair: 'SOL / USD', price: '$182.45',    change: '-0.54%', up: false, spark: 'M0 10 L8 14 L16 11 L24 18 L32 15 L40 22 L48 19 L56 26 L64 24' },
  { pair: 'XRP / USD', price: '$0.6234',    change: '+3.12%', up: true,  spark: 'M0 26 L8 20 L16 23 L24 14 L32 16 L40 9 L48 12 L56 6 L64 8' },
];

const OPPORTUNITIES = [
  {
    eyebrow: 'Earn',
    title: 'Receive up to 15% in annual crypto rewards',
    body: 'Flexible savings and staking products designed to help users grow balances with minimal friction.',
    cta: 'Try now',
    bg: 'linear-gradient(135deg, #ffffff 0%, #f3f6f6 100%)',
    text: '#0e2026',
  },
  {
    eyebrow: 'CEX.IO App',
    title: 'Your assets. On your terms. At your fingertips.',
    body: 'Manage portfolio activity and move across your wallet faster with a mobile-first exchange experience.',
    cta: 'Try now',
    bg: 'linear-gradient(135deg, #f4927e 0%, #ee8267 100%)',
    text: '#0e2026',
  },
  {
    eyebrow: 'Spot Trading',
    title: 'Dive into deep liquidity and trade like a pro',
    body: 'A cleaner trading environment with market discovery, pro tools, and a fast route into active pairs.',
    cta: 'Try now',
    bg: 'linear-gradient(135deg, #0e2026 0%, #185b64 100%)',
    text: '#ffffff',
  },
  {
    eyebrow: 'Instant Buy',
    title: 'Start building your portfolio in a heartbeat',
    body: 'Choose your asset, enter your amount, and move from fiat to crypto with a minimal step flow.',
    cta: 'Try now',
    bg: 'linear-gradient(135deg, #40bfc9 0%, #1a7c7a 100%)',
    text: '#ffffff',
  },
];

const STEPS = [
  { n: '1', title: 'Create account', body: 'Open your profile and unlock the core platform in minutes.' },
  { n: '2', title: 'Verify identity', body: 'Finish verification quickly and raise account capabilities.' },
  { n: '3', title: 'Buy or deposit crypto', body: 'Add funds so you can access trading, wallet, and earn products.' },
  { n: '4', title: 'Start your journey', body: 'Explore the ecosystem and move across all services from one home.' },
];

const EARN_ROWS = [
  { icon: '◎', name: 'SOL', subtitle: 'Staking',  reward: 'Calculate earnings', color: '#9945ff' },
  { icon: '₮', name: 'USDT', subtitle: 'Savings', reward: 'Annual reward 4%',   color: '#26a17b' },
  { icon: '⬡', name: 'USDC', subtitle: 'Savings', reward: 'Annual reward 4%',   color: '#2775ca' },
  { icon: 'Ξ', name: 'ETH',  subtitle: 'Savings', reward: 'Annual reward 2%',   color: '#627eea' },
  { icon: '₿', name: 'BTC',  subtitle: 'Savings', reward: 'Annual reward 0.25%',color: '#f7931a' },
];

const ECOSYSTEM = [
  {
    title: 'Spot trading',
    body: 'Deep liquidity. Advanced order types. Pro-level trading in one place.',
    bg: 'linear-gradient(135deg, #0e2026 0%, #185b64 100%)',
    text: '#ffffff',
  },
  {
    title: 'Exchange App',
    body: 'Your assets, on your terms, with a stronger portfolio view and fast actions.',
    bg: 'linear-gradient(135deg, #f4927e 0%, #ee8267 100%)',
    text: '#0e2026',
  },
  {
    title: 'Trading API',
    body: 'Take your strategy further with a dedicated API product lane and platform tooling.',
    bg: 'linear-gradient(135deg, #40bfc9 0%, #1a7c7a 100%)',
    text: '#ffffff',
  },
];

const RECOGNITION = [
  { title: '"A" rating', meta: 'CCData Exchange Benchmark' },
  { title: 'Vetted Exchange', meta: 'Digital Asset Research' },
  { title: 'Best Overall Platform', meta: 'Industry awards' },
  { title: 'Top ranked exchange', meta: 'Global market reviews' },
];

const TRUST = [
  {
    title: 'Fully regulated and audited',
    body: 'Built with a trust-first posture and designed to present your platform like a mature, established exchange.',
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    title: 'Global availability',
    body: 'A broad product-language system that feels accessible to both new users and experienced traders.',
    iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'For beginners and pros',
    body: 'Simple first actions, deeper product cards, and clear pathways into more advanced tools.',
    iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
];

const PRODUCT_MENU = [
  { title: 'Instant Buy', desc: 'Simple fiat-to-crypto purchase flow', action: 'hero', tone: '#f4927e' },
  { title: 'Markets', desc: 'Track top gainers and active pairs', action: 'markets', tone: '#40bfc9' },
  { title: 'Earn', desc: 'Savings and staking style blocks', action: 'earn', tone: '#d8f0e7' },
  { title: 'Ecosystem', desc: 'Explore product lanes and cards', action: 'ecosystem', tone: '#15353d' },
];

const COMPANY_MENU = [
  { title: 'Recognition', desc: 'Awards and product credibility blocks', action: 'recognition' },
  { title: 'Trust', desc: 'Regulation and reliability messaging', action: 'trust' },
  { title: 'Support', desc: 'Help users find the right next step', action: 'footer' },
];

const CTA_PRIMARY = {
  background: '#F4927E',
  color: '#FFFFFF',
};

const CTA_SECONDARY = {
  background: '#FFFFFF',
  color: '#0E2026',
};

function BrandMark() {
  return (
    <div className="flex items-center gap-[10px]">
      <div className="relative h-[50px] w-[50px]">
        <div className="absolute inset-0 rounded-full border-[5px] border-cyan-400 opacity-90" />
        <div className="absolute inset-[9px] rounded-full border-[4px] border-cyan-400 opacity-90" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-[5px] rounded-full bg-cyan-400" />
      </div>
      <div className="text-white">
        <span className="text-[22px] font-light tracking-[-0.04em]">CEX</span>
        <span className="text-[22px] font-light tracking-[-0.04em] opacity-70">.IO</span>
      </div>
    </div>
  );
}

function CurrencySelect({ value, options, onChange, light = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const selected = options.find((o) => o.code === value) || options[0];
  const filtered = options.filter(
    (o) =>
      o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setOpen((v) => !v)}>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-[20px] font-bold md:h-11 md:w-11 md:text-[22px] xl:h-12 xl:w-12 xl:text-[24px]"
        style={{ background: selected.color || '#fff', color: '#fff' }}
      >
        {selected.icon}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[18px] font-semibold text-white md:text-[19px] xl:text-[20px]">{selected.code}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`w-4 h-4 text-white/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+12px)] z-50 w-[240px] rounded-[20px] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          style={{ background: '#0d3840', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search */}
          <div className="flex items-center gap-2 rounded-[12px] px-3 py-2.5 mb-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white/40 shrink-0">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-white placeholder-white/35 outline-none"
              style={{ fontSize: '14px' }}
            />
          </div>
          {/* Options */}
          <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
            {filtered.map((option) => (
              <button
                key={option.code}
                onClick={() => { onChange(option.code); setOpen(false); setSearch(''); }}
                className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 transition-all duration-150 ${value === option.code ? 'bg-white/15' : 'hover:bg-white/[0.07]'}`}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
                  style={{ background: option.color || '#555', color: '#fff' }}
                >
                  {option.icon}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-white leading-none">{option.code}</p>
                  <p className="text-[11px] text-white/45 mt-0.5 truncate">{option.label}</p>
                </div>
                {value === option.code && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-[#4ac2cb] ml-auto shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-white/40 py-4">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuIconGrid() {
  return (
    <span className="grid grid-cols-2 gap-1 mr-3">
      <span className="w-1.5 h-1.5 rounded-[2px] bg-white/85" />
      <span className="w-1.5 h-1.5 rounded-[2px] bg-white/85" />
      <span className="w-1.5 h-1.5 rounded-[2px] bg-white/85" />
      <span className="w-1.5 h-1.5 rounded-[2px] bg-white/85" />
    </span>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [payCode, setPayCode] = useState('USD');
  const [receiveCode, setReceiveCode] = useState('BTC');
  const [amount, setAmount] = useState('550');
  const [activeMarketTab, setActiveMarketTab] = useState(MARKET_TABS[0]);
  const [productsOpen, setProductsOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [desktopMenuMounted, setDesktopMenuMounted] = useState('none');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState('none');
  const [mobilePanelMounted, setMobilePanelMounted] = useState('none');
  const desktopCloseTimer = useRef(null);
  const mobileCloseTimer = useRef(null);

  const selectedPay = PAY_OPTIONS.find((item) => item.code === payCode) || PAY_OPTIONS[0];
  const selectedReceive = RECEIVE_OPTIONS.find((item) => item.code === receiveCode) || RECEIVE_OPTIONS[0];

  const receiveAmount = useMemo(() => {
    const numericAmount = Number(amount) || 0;
    const converted = numericAmount * selectedReceive.rate;
    if (selectedReceive.code === 'USDT') return converted.toFixed(2);
    if (selectedReceive.code === 'ETH') return converted.toFixed(4);
    return converted.toFixed(4);
  }, [amount, selectedReceive]);

  const visibleMarkets = useMemo(() => {
    if (activeMarketTab === 'Top decliners') return MARKETS.filter((market) => !market.up);
    if (activeMarketTab === 'New markets') return [...MARKETS].reverse();
    if (activeMarketTab === 'Top by market cap') return [MARKETS[0], MARKETS[1], MARKETS[3], MARKETS[2]];
    return MARKETS.filter((market) => market.up);
  }, [activeMarketTab]);

  useEffect(() => {
    return () => {
      if (desktopCloseTimer.current) clearTimeout(desktopCloseTimer.current);
      if (mobileCloseTimer.current) clearTimeout(mobileCloseTimer.current);
    };
  }, []);

  const clearDesktopCloseTimer = () => {
    if (desktopCloseTimer.current) {
      clearTimeout(desktopCloseTimer.current);
      desktopCloseTimer.current = null;
    }
  };

  const clearMobileCloseTimer = () => {
    if (mobileCloseTimer.current) {
      clearTimeout(mobileCloseTimer.current);
      mobileCloseTimer.current = null;
    }
  };

  const openDesktopMenu = (menu) => {
    clearDesktopCloseTimer();
    setDesktopMenuMounted(menu);
    setProductsOpen(menu === 'products');
    setCompanyOpen(menu === 'company');
  };

  const closeDesktopMenus = (delay = 0) => {
    clearDesktopCloseTimer();
    setProductsOpen(false);
    setCompanyOpen(false);
    desktopCloseTimer.current = setTimeout(() => {
      setDesktopMenuMounted('none');
    }, delay);
  };

  const toggleMobilePanel = (panel) => {
    clearMobileCloseTimer();
    if (mobilePanel === panel) {
      setMobilePanel('none');
      mobileCloseTimer.current = setTimeout(() => {
        setMobilePanelMounted('none');
      }, 140);
      return;
    }
    setMobilePanelMounted(panel);
    setMobilePanel(panel);
  };

  const scrollToSection = (id) => {
    setProductsOpen(false);
    setCompanyOpen(false);
    setDesktopMenuMounted('none');
    setMobileMenuOpen(false);
    setMobilePanel('none');
    setMobilePanelMounted('none');
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleHeaderAction = (link) => {
    if (link === 'Prices') return scrollToSection('markets');
    if (link === 'University') return scrollToSection('steps');
    if (link === 'Company') return setCompanyOpen((prev) => !prev);
  };

  const goToAuth = (path = '/register') => {
    setProductsOpen(false);
    setCompanyOpen(false);
    setDesktopMenuMounted('none');
    setMobileMenuOpen(false);
    setMobilePanel('none');
    setMobilePanelMounted('none');
    navigate(path);
  };

  return (
    <div className="min-h-screen" style={{ background: '#081317', color: '#ffffff' }}>
      <section style={{ background: 'linear-gradient(135deg, #185B64 0%, #114147 60%, #0a2e33 100%)' }}>
        <header className="border-b border-white/5" style={{ background: '#071d23' }}>
          <div className="mx-auto flex h-[84px] max-w-[1460px] items-center justify-between gap-4 px-4 md:px-6 xl:h-[98px] xl:px-10">
            <div className="flex items-center gap-[42px]">
              <Link to="/"><BrandMark /></Link>
              <nav className="hidden xl:flex items-center gap-[26px] text-white">
                {HEADER_LINKS.map((link, index) => (
                  <div
                    key={link}
                    className="relative flex items-center gap-[26px]"
                    onMouseEnter={() => {
                      if (link === 'Products') openDesktopMenu('products');
                      if (link === 'Company') openDesktopMenu('company');
                    }}
                    onMouseLeave={() => {
                      if (link === 'Products' || link === 'Company') closeDesktopMenus(120);
                    }}
                  >
                    {(() => {
                      const isProducts = link === 'Products';
                      const isCompany = link === 'Company';
                      const isOpen = (isProducts && productsOpen) || (isCompany && companyOpen);
                      return (
                    <button
                      className={`text-[15px] font-medium leading-none tracking-[-0.01em] transition-all duration-200 hover:text-white flex items-center ${isOpen ? 'text-white' : 'text-white/90'}`}
                      onClick={() => {
                        if (link === 'Products') {
                          openDesktopMenu('products');
                        } else if (link === 'Company') {
                          openDesktopMenu('company');
                        } else {
                          handleHeaderAction(link);
                        }
                      }}
                    >
                      {link}
                      {index === 0 || index === 3 ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`ml-2 w-3.5 h-3.5 opacity-70 transition-transform duration-200 inline-block ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : null}
                    </button>
                      );
                    })()}
                    {link === 'Products' && desktopMenuMounted === 'products' ? (
                      <div className={`absolute left-0 top-[70px] z-30 w-[610px] rounded-[30px] border border-white/10 bg-[#0d2a31] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.32)] transition-all duration-150 ${productsOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'}`}>
                        <div className="grid grid-cols-[1.08fr_0.92fr] gap-5">
                          <div className="grid gap-2">
                            <div className="px-3 pb-2">
                              <p className="text-[11px] uppercase tracking-[0.26em] text-white/40">Products</p>
                              <p className="text-sm text-white/60 mt-2">Structured and visual like a real exchange navigation panel.</p>
                            </div>
                            {PRODUCT_MENU.map((item) => (
                              <button
                                key={item.title}
                                onClick={() => scrollToSection(item.action)}
                                className={`group w-full rounded-[22px] px-4 py-4 text-left transition-all duration-200 ${productsOpen ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'} hover:bg-white/[0.06] hover:-translate-y-0.5`}
                                style={{ background: `linear-gradient(135deg, ${item.tone}16 0%, transparent 100%)`, transitionDelay: `${productsOpen ? 45 + PRODUCT_MENU.indexOf(item) * 36 : 0}ms` }}
                              >
                                <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center text-[12px] font-bold text-white/90" style={{ background: `${item.tone}25` }}>
                                      {item.title.charAt(0)}
                                    </span>
                                    <p className="font-semibold text-white">{item.title}</p>
                                  </div>
                                  <p className="text-sm text-white/55 mt-1 leading-6">{item.desc}</p>
                                </div>
                                  <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/65 group-hover:text-white group-hover:bg-white/10 transition-all">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                          <div className="rounded-[24px] p-5 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, #123840 0%, #0b2026 100%)' }}>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.26em] text-white/40">Featured</p>
                              <h3 className="text-white text-2xl font-light leading-tight mt-3">A richer product panel</h3>
                              <p className="text-white/55 text-sm leading-6 mt-3">Closer to CEX.IO behavior: grouped choices, strong visual cards, and a secondary highlight pane.</p>
                            </div>
                            <button
                              onClick={() => goToAuth('/register')}
                              className="mt-6 rounded-full px-5 py-3 text-sm font-semibold text-[#0e2026] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                            >
                              Create account
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {link === 'Company' && desktopMenuMounted === 'company' ? (
                      <div className={`absolute left-0 top-[70px] z-30 w-[452px] rounded-[30px] border border-white/10 bg-[#0d2a31] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.32)] transition-all duration-150 ${companyOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'}`}>
                        <div className="px-3 pb-3">
                          <p className="text-[11px] uppercase tracking-[0.26em] text-white/40">Company</p>
                          <p className="text-sm text-white/60 mt-2">Soft-panel navigation with descriptions instead of plain menu rows.</p>
                        </div>
                        <div className="space-y-2">
                          {COMPANY_MENU.map((item) => (
                            <button
                              key={item.title}
                              onClick={() => scrollToSection(item.action)}
                              className={`group w-full rounded-[22px] px-4 py-4 text-left text-white transition-all duration-200 ${companyOpen ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'} hover:bg-white/[0.06] hover:-translate-y-0.5`}
                              style={{ transitionDelay: `${companyOpen ? 40 + COMPANY_MENU.indexOf(item) * 34 : 0}ms` }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[12px] font-bold text-white/85">
                                      {item.title.charAt(0)}
                                    </span>
                                    <p className="font-semibold">{item.title}</p>
                                  </div>
                                  <p className="text-sm text-white/50 mt-1 leading-6">{item.desc}</p>
                                </div>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white/45 group-hover:text-white transition-colors"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-[18px] text-white">
              <button className="hidden h-10 w-10 items-center justify-center rounded-full text-white/92 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white md:flex">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18"/></svg>
              </button>
              <button className="hidden h-10 w-10 items-center justify-center rounded-full text-white/92 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white md:flex">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </button>
              <Link to="/login" className="hidden sm:inline-flex h-[40px] items-center rounded-full px-6 text-[14px] font-semibold transition-all duration-200 hover:bg-white/[0.07]" style={{ border: '0.5px solid #747c7d' }}>Sign In</Link>
              <Link to="/register" className="hidden sm:inline-flex h-[40px] items-center rounded-full px-6 text-[14px] font-semibold transition-all duration-200 hover:brightness-105" style={CTA_PRIMARY}>Get Started</Link>
              <button
                className="xl:hidden flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition-all duration-200 hover:bg-white/[0.08]"
                onClick={() => {
                  setMobileMenuOpen((prev) => !prev);
                  setMobilePanel('none');
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {mobileMenuOpen ? (
            <div className="xl:hidden border-t border-white/5 px-4 md:px-6 pb-5 pt-4 text-white">
              <div className="space-y-3">
                <button
                  className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-left"
                  onClick={() => toggleMobilePanel('products')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Products</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`w-4 h-4 text-white/60 transition-transform duration-200 ${mobilePanel === 'products' ? 'rotate-180' : 'rotate-0'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </button>
                {mobilePanelMounted === 'products' ? (
                  <div className={`space-y-2 rounded-[24px] border border-white/10 bg-[#0d2a31] p-3 transition-all duration-150 ${mobilePanel === 'products' ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'}`}>
                    {PRODUCT_MENU.map((item, idx) => (
                      <button
                        key={item.title}
                        onClick={() => scrollToSection(item.action)}
                        className={`w-full rounded-[20px] px-4 py-4 text-left transition-all duration-200 ${mobilePanel === 'products' ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'} hover:bg-white/[0.06]`}
                        style={{ background: `linear-gradient(135deg, ${item.tone}16 0%, transparent 100%)`, transitionDelay: `${mobilePanel === 'products' ? 35 + idx * 30 : 0}ms` }}
                      >
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-white/55 mt-1">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                ) : null}

                <button className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-left font-semibold" onClick={() => scrollToSection('markets')}>
                  Prices
                </button>
                <button className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-left font-semibold" onClick={() => scrollToSection('steps')}>
                  University
                </button>
                <button
                  className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-left"
                  onClick={() => toggleMobilePanel('company')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Company</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`w-4 h-4 text-white/60 transition-transform duration-200 ${mobilePanel === 'company' ? 'rotate-180' : 'rotate-0'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </button>
                {mobilePanelMounted === 'company' ? (
                  <div className={`space-y-2 rounded-[24px] border border-white/10 bg-[#0d2a31] p-3 transition-all duration-150 ${mobilePanel === 'company' ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'}`}>
                    {COMPANY_MENU.map((item, idx) => (
                      <button
                        key={item.title}
                        onClick={() => scrollToSection(item.action)}
                        className={`w-full rounded-[20px] px-4 py-4 text-left transition-all duration-200 ${mobilePanel === 'company' ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'} hover:bg-white/[0.06]`}
                        style={{ transitionDelay: `${mobilePanel === 'company' ? 35 + idx * 30 : 0}ms` }}
                      >
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-white/55 mt-1">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button className="rounded-full border border-white/20 px-4 py-3 font-semibold" onClick={() => goToAuth('/login')}>
                    Sign In
                  </button>
                  <button className="rounded-full h-[44px] px-4 font-semibold transition-all duration-200 hover:brightness-105" style={CTA_PRIMARY} onClick={() => goToAuth('/register')}>
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </header>

        <div id="hero" className="mx-auto max-w-[1460px] px-4 pb-16 pt-5 md:px-6 md:pb-20 md:pt-7 xl:px-10 xl:pb-28 xl:pt-8">
          <div className="grid min-h-[calc(100vh-160px)] items-start gap-10 xl:min-h-[calc(100vh-172px)] xl:grid-cols-[0.95fr_1.05fr] xl:gap-2">
            <section className="pt-8 text-white md:pt-10 xl:pt-[150px]">
              <div className="max-w-[610px]">
                <h1 className="text-[40px] font-semibold leading-[1.03] tracking-[-0.035em] sm:text-[52px] md:text-[60px] lg:text-[66px] xl:text-[72px]">
                  <span className="block">Your all-in-one crypto</span>
                  <span className="block">platform to buy, sell,</span>
                  <span className="block">trade, hold and earn</span>
                  <span className="block">cryptocurrencies<sup className="ml-1 align-top text-[16px] opacity-70 sm:text-[18px] xl:text-[22px]">1</sup></span>
                </h1>
                <p className="mt-8 max-w-[500px] text-[18px] leading-[1.34] text-white/62 sm:text-[20px] md:text-[21px] xl:text-[23px]">
                  Since 2013, we&apos;ve guided millions of global users on their digital assets journey
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-4 xl:mt-12">
                <button
                  className="h-[56px] px-8 rounded-full text-[16px] font-semibold transition-all duration-200 hover:brightness-105 hover:shadow-[0_18px_35px_rgba(244,146,126,0.28)] hover:-translate-y-0.5"
                  style={CTA_PRIMARY}
                  onClick={() => goToAuth('/register')}
                >
                  Get started
                </button>
                <button
                  className="h-[56px] px-8 rounded-full text-[16px] font-semibold border border-white/25 text-white bg-white/[0.05] transition-all duration-200 hover:bg-white/[0.1] hover:-translate-y-0.5"
                  onClick={() => scrollToSection('products')}
                >
                  Explore products
                </button>
              </div>

              <div className="mt-14 flex flex-wrap gap-10 text-white/60 md:mt-16 xl:mt-[88px] xl:gap-12">
                <div>
                  <p className="text-[14px] xl:text-[15px] mb-4 xl:mb-5">Real-time audit by</p>
                  <div className="flex items-center gap-3 text-[20px] md:text-[22px] xl:text-[24px] text-white/90 font-semibold">
                    <div className="w-11 h-11 rounded-lg border border-white/30 flex items-center justify-center text-base">B</div>
                    BitDegree
                  </div>
                </div>
                <div>
                  <p className="text-[14px] xl:text-[15px] mb-4 xl:mb-5">Positive review on</p>
                  <div className="flex items-center gap-3 text-[20px] md:text-[22px] xl:text-[24px] text-white/90 font-semibold">
                    <div className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-base">C</div>
                    coinweb
                  </div>
                </div>
              </div>
            </section>

            <section className="relative flex justify-center pt-1 md:pt-3 xl:justify-end xl:pt-[44px]">
              <div className="absolute -right-[22px] top-[24%] hidden 2xl:block h-[196px] w-[196px] rounded-full border-[9px] border-[#d39c4f] bg-[#8c6731] shadow-[0_0_0_9px_rgba(255,255,255,0.08)] opacity-95">
                <div className="flex h-full w-full items-center justify-center rounded-full text-[84px] font-black text-[#f7e0a5]">B</div>
              </div>
              <div className="absolute left-[18px] bottom-[15%] hidden 2xl:block h-[156px] w-[156px] rounded-full border-[9px] border-[#c7d5b6] bg-[#537969] shadow-[0_0_0_9px_rgba(255,255,255,0.08)] opacity-95">
                <div className="flex h-full w-full items-center justify-center rounded-full text-[76px] font-black text-[#d8f1de]">T</div>
              </div>

              <div className="relative z-10 w-full max-w-[582px] rounded-[32px] px-5 py-6 text-white sm:px-7 sm:py-7 md:rounded-[36px] md:px-8 md:py-8 xl:min-h-[676px] xl:max-w-[586px] xl:px-10 xl:py-10" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 35px 80px rgba(3,22,27,0.28)' }}>
                <h2 className="mb-7 text-[28px] font-medium sm:text-[32px] md:mb-8 md:text-[36px] xl:mb-10 xl:text-[38px]">Buy cryptocurrency</h2>
                <div className="space-y-7 md:space-y-8 xl:space-y-[34px]">
                  <div>
                    <label className="block text-[15px] md:text-[16px] xl:text-[17px] text-white/82 mb-3 xl:mb-4">You pay</label>
                    <div className="flex items-center gap-3 rounded-[20px] px-4 py-3 md:gap-4 md:px-5 md:py-4 xl:h-[84px] xl:rounded-[22px]" style={{ background: '#123f46' }}>
                      <div className="flex min-w-[150px] items-center border-r border-white/10 pr-3 sm:min-w-[160px] md:min-w-[170px] md:pr-4">
                        <CurrencySelect value={payCode} options={PAY_OPTIONS} onChange={setPayCode} />
                      </div>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent text-[26px] font-light outline-none sm:text-[28px] md:text-[30px] xl:text-[34px]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[15px] md:text-[16px] xl:text-[17px] text-white/82 mb-3 xl:mb-4">You get</label>
                    <div className="flex items-center gap-3 rounded-[20px] px-4 py-3 md:gap-4 md:px-5 md:py-4 xl:h-[84px] xl:rounded-[22px]" style={{ background: '#123f46' }}>
                      <div className="flex min-w-[150px] items-center border-r border-white/10 pr-3 sm:min-w-[160px] md:min-w-[170px] md:pr-4">
                        <CurrencySelect value={receiveCode} options={RECEIVE_OPTIONS} onChange={setReceiveCode} />
                      </div>
                      <div className="w-full text-[26px] font-light sm:text-[28px] md:text-[30px] xl:text-[34px]">{receiveAmount}</div>
                    </div>
                  </div>

                  <div className="rounded-[20px] py-4 text-center text-[15px] text-white/80 md:py-5 md:text-[16px] xl:h-[66px] xl:rounded-[22px] xl:py-0 xl:text-[17px] xl:leading-[66px]" style={{ background: '#1b4f56' }}>
                    The price will be recalculated in <span className="font-medium">13:01</span>
                  </div>
                  <div className="pt-5 text-center xl:pt-8"><button onClick={() => scrollToSection('trust')} className="text-[16px] text-white/88 underline md:text-[17px] xl:text-[18px]">Terms and Conditions</button></div>
                  <button className="h-[62px] w-full rounded-full text-[20px] font-medium transition-all duration-200 hover:brightness-105 active:scale-[0.99] md:h-[66px] md:text-[21px] xl:mt-6 xl:h-[72px] xl:text-[22px]" style={CTA_PRIMARY} onClick={() => goToAuth('/register')}>Buy now</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* ── Promo cards (below hero, glassmorphism — matches CEX.io exactly) ── */}
      <div style={{ background: '#081317' }}>
        <div className="max-w-[1460px] mx-auto px-4 md:px-6 xl:px-10 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROMO_CARDS.map((card) => (
              <button
                key={card.label}
                onClick={() => scrollToSection('hero')}
                className="rounded-[24px] p-5 text-left text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <p className="text-2xl mb-2">{card.emoji}</p>
                <p className="text-[13px] font-bold leading-none">{card.label}</p>
                <p className="text-[12px] text-white/55 mt-2 leading-5">{card.body}</p>
                <span className="mt-3 inline-block text-[11px] font-semibold text-[#ee8267]">{card.cta} →</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section id="markets" className="max-w-[1460px] mx-auto px-5 lg:px-10 py-20">
        <div className="flex items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-[13px] uppercase tracking-[0.28em] text-white/40">Markets</p>
            <h2 className="text-[34px] font-semibold mt-2 text-white">Find your next crypto opportunity</h2>
          </div>
          <button className="h-[40px] rounded-full px-6 text-sm font-semibold transition-all duration-200 hover:brightness-105" style={{ background: '#EE8267', color: '#fff' }} onClick={() => goToAuth('/register')}>More markets</button>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {MARKET_TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveMarketTab(tab)}
              className={`h-[48px] px-5 rounded-full text-sm font-semibold transition-all duration-200 ${activeMarketTab === tab || (idx === 0 && activeMarketTab === MARKET_TABS[0]) ? 'bg-white text-[#081317]' : 'text-white/70 hover:text-white hover:-translate-y-0.5'}`}
              style={activeMarketTab === tab || (idx === 0 && activeMarketTab === MARKET_TABS[0]) ? {} : { background: '#192226', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {visibleMarkets.map((market) => (
            <button key={market.pair} className="rounded-[26px] p-5 text-left transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02]" style={{ background: '#192226', border: '1px solid rgba(255,255,255,0.06)' }} onClick={() => goToAuth('/register')}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-lg text-white">{market.pair}</p>
                  <p className="text-2xl font-semibold mt-1 text-white">{market.price}</p>
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${market.up ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {market.change}
                </span>
              </div>
              <svg viewBox="0 0 64 36" fill="none" className="w-full h-[36px]" preserveAspectRatio="none">
                <path d={market.spark} stroke={market.up ? '#4ade80' : '#f87171'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </section>

      <section id="products" className="max-w-[1460px] mx-auto px-5 lg:px-10 pb-20">
        <div className="mb-10">
          <p className="text-[13px] uppercase tracking-[0.28em] text-white/40">Products</p>
          <h2 className="text-[34px] font-semibold mt-2 text-white">Find your next crypto opportunity</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {OPPORTUNITIES.map((item) => (
            <div key={item.title} className="rounded-[30px] p-7 min-h-[260px] flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:scale-[1.01]" style={{ background: item.bg, color: item.text }}>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] opacity-60">{item.eyebrow}</p>
                <h3 className="text-[34px] leading-tight font-semibold mt-4 max-w-[420px]">{item.title}</h3>
                <p className="mt-4 text-base leading-7 opacity-80 max-w-[480px]">{item.body}</p>
              </div>
              <button className="mt-8 inline-flex items-center gap-3 text-sm font-semibold group" onClick={() => goToAuth('/register')}>
                {item.cta}
                <span className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1" style={{ background: item.text === '#ffffff' ? 'rgba(255,255,255,0.14)' : 'rgba(14,32,38,0.08)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="steps" style={{ background: '#192226' }}>
        <div className="max-w-[1460px] mx-auto px-5 lg:px-10 py-20">
          <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <p className="text-[13px] uppercase tracking-[0.28em] text-white/45">How to get started</p>
              <h2 className="text-[34px] font-light mt-2 text-white">A simple 4-step onboarding flow</h2>
            </div>
            <button
              className="shrink-0 h-[52px] px-7 rounded-full font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105"
              style={CTA_PRIMARY}
              onClick={() => goToAuth('/register')}
            >
              Create account
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {STEPS.map((step) => (
              <div key={step.n} className="rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.005]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-12 h-12 rounded-full text-white text-lg font-bold flex items-center justify-center" style={{ background: '#273032' }}>{step.n}</div>
                <h3 className="text-xl font-semibold mt-5 text-white">{step.title}</h3>
                <p className="mt-3 text-white/55 leading-7">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="earn" className="max-w-[1460px] mx-auto px-5 lg:px-10 py-20" style={{ background: 'transparent' }}>
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-start">
          <div className="rounded-[34px] p-8 text-white" style={{ background: 'linear-gradient(135deg, #0e2026 0%, #185b64 100%)' }}>
            <p className="text-[13px] uppercase tracking-[0.28em] text-white/55">Earn crypto flexibly</p>
            <h2 className="text-[38px] leading-tight font-semibold mt-3">Earn crypto flexibly with CEX.IO</h2>
            <p className="mt-5 text-white/72 leading-8 text-lg">
              Keep the same clean, premium direction across reward products, portfolio tools, and the rest of the landing flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="h-[52px] px-7 rounded-full font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" style={CTA_SECONDARY} onClick={() => scrollToSection('recognition')}>Learn More</button>
              <button className="h-[52px] px-7 rounded-full border border-white/20 bg-white/10 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15" onClick={() => goToAuth('/register')}>Start saving</button>
            </div>
          </div>

          <div className="space-y-3">
            {EARN_ROWS.map((row, index) => (
              <div key={row.name + index} className="rounded-[24px] p-5 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:scale-[1.005]" style={{ background: '#192226', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[20px] font-bold shrink-0" style={{ background: row.color }}>{row.icon}</div>
                  <div>
                    <p className="font-semibold text-lg text-white">{row.name}</p>
                    <p className="text-white/50 text-sm">{row.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: row.color }}>{row.reward}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ecosystem" className="max-w-[1460px] mx-auto px-5 lg:px-10 pb-20">
        <div className="mb-10">
          <p className="text-[13px] uppercase tracking-[0.28em] text-white/40">Ecosystem</p>
          <h2 className="text-[34px] font-semibold mt-2 text-white">For traders, for everyone, and for businesses</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {ECOSYSTEM.map((item) => (
            <div key={item.title} className="rounded-[30px] p-8 min-h-[280px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:scale-[1.01]" style={{ background: item.bg, color: item.text }}>
              <div>
                <h3 className="text-[34px] font-semibold">{item.title}</h3>
                <p className="mt-4 leading-8 opacity-80 max-w-[320px]">{item.body}</p>
              </div>
              <button className="inline-flex items-center gap-3 font-semibold text-left group" onClick={() => goToAuth('/register')}>
                Explore
                <span className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1" style={{ background: item.text === '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(14,32,38,0.08)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="recognition" style={{ background: '#192226', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-[1460px] mx-auto px-5 lg:px-10 py-16">
          <div className="mb-10">
            <p className="text-[13px] uppercase tracking-[0.28em] text-white/40">Recognition</p>
            <h2 className="text-[34px] font-semibold mt-2 text-white">Products that look established and trustworthy</h2>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {RECOGNITION.map((item, i) => (
              <div key={item.title} className="rounded-[26px] p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: i % 2 === 0 ? 'linear-gradient(135deg,#0e2026,#185b64)' : 'linear-gradient(135deg,#ee8267,#c94d2f)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" className="w-7 h-7">
                    {i === 0 && <><path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14v10a7 7 0 01-14 0V3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 3H3v4a3 3 0 003 3M19 3h2v4a3 3 0 01-3 3M12 20v-3M9 21h6" /></>}
                    {i === 1 && <><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></>}
                    {i === 2 && <><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></>}
                    {i === 3 && <><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></>}
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mt-5 text-white">{item.title}</h3>
                <p className="mt-2 text-white/50 leading-7">{item.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="max-w-[1460px] mx-auto px-5 lg:px-10 py-20">
        <div className="mb-10">
          <p className="text-[13px] uppercase tracking-[0.28em] text-white/40">Trust</p>
          <h2 className="text-[34px] font-semibold mt-2 text-white">We&apos;ve been around the block</h2>
          <p className="mt-4 text-lg text-white/55 max-w-[760px] leading-8">
            Since 2013, we&apos;ve operated with transparency, regulatory compliance, and a security-first approach to protect every user.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {TRUST.map((item) => (
            <div key={item.title} className="rounded-[28px] p-7 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]" style={{ background: '#192226', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-12 h-12 rounded-2xl mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#185b64,#0e2026)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                </svg>
              </div>
              <h3 className="text-[28px] font-semibold leading-tight text-white">{item.title}</h3>
              <p className="mt-4 text-white/55 leading-8">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer id="footer" style={{ background: '#071d23', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Newsletter row */}
        <div style={{ background: '#0a252d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-[1460px] mx-auto px-5 lg:px-10 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-white font-semibold text-lg">Stay in the loop</p>
              <p className="text-white/55 text-sm mt-1">Get weekly market insights, product updates, and exchange news.</p>
            </div>
            <form className="flex gap-3 w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-[260px] rounded-full px-5 py-3 text-sm bg-white/[0.06] border border-white/12 text-white placeholder-white/35 outline-none focus:border-[#ee8267] transition-colors"
                style={{ fontSize: '14px' }}
              />
              <button type="submit" className="shrink-0 h-[46px] px-6 rounded-full font-semibold text-sm transition-all duration-200 hover:brightness-105" style={CTA_PRIMARY}>
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Nav columns */}
        <div className="max-w-[1460px] mx-auto px-5 lg:px-10 py-14">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <BrandMark />
              <p className="mt-4 text-white/50 text-sm leading-7 max-w-[260px]">
                A trusted cryptocurrency exchange platform operating since 2013. Buy, sell, trade, and earn crypto.
              </p>
              <div className="mt-6 flex gap-3">
                {[
                  { label: 'X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                  { label: 'Li', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
                  { label: 'Tg', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.7 8.02c-.12.58-.46.72-.94.45l-2.6-1.92-1.25 1.2c-.14.14-.26.25-.52.25l.19-2.68 4.83-4.36c.21-.19-.05-.29-.33-.1L7.67 14.8l-2.56-.8c-.56-.17-.57-.56.12-.83l10.01-3.86c.46-.17.87.11.71.83' },
                  { label: 'Yt', path: 'M22.54 6.42a2.78 2.78 0 00-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.94 1.96C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM10 15.5v-7l6 3.5-6 3.5z' },
                ].map((s) => (
                  <button key={s.label} className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/70">
                      <path d={s.path} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Products */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35 mb-5">Products</p>
              <ul className="space-y-3">
                {['Instant Buy', 'Spot Trading', 'Trading API', 'Earn & Staking', 'CEX.IO App'].map((l) => (
                  <li key={l}><button onClick={() => scrollToSection('products')} className="text-sm text-white/60 hover:text-[#EE8267] transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>

            {/* Learn */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35 mb-5">Learn</p>
              <ul className="space-y-3">
                {['University', 'Blog', 'Help Centre', 'FAQ', 'Glossary'].map((l) => (
                  <li key={l}><button onClick={() => scrollToSection('steps')} className="text-sm text-white/60 hover:text-[#EE8267] transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35 mb-5">Company</p>
              <ul className="space-y-3">
                {['About Us', 'Careers', 'Press', 'Partners', 'Contact'].map((l) => (
                  <li key={l}><button onClick={() => scrollToSection('recognition')} className="text-sm text-white/60 hover:text-[#EE8267] transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35 mb-5">Legal</p>
              <ul className="space-y-3">
                {['Privacy Policy', 'Terms of Use', 'Cookie Policy', 'Licenses', 'AML Policy'].map((l) => (
                  <li key={l}><button onClick={() => scrollToSection('trust')} className="text-sm text-white/60 hover:text-[#EE8267] transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-[1460px] mx-auto px-5 lg:px-10 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-white/40">© 2026 CEX.IO Ltd. All rights reserved.</p>
            <div className="flex flex-wrap gap-2">
              {['Visa', 'MC', 'SEPA', 'SWIFT', 'USDT', 'BTC'].map((pm) => (
                <span key={pm} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white/50" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>{pm}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
