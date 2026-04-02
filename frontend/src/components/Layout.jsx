import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useMarketPrices } from '../hooks/useMarketPrices';
import NotificationFeed from './NotificationFeed';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English',   flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'zh', label: '中文',       flag: '🇨🇳' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
];

function ShellBrand() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-7 h-7">
        <div className="absolute inset-0 rounded-full border-[4px] border-cyan-500 opacity-90" />
        <div className="absolute inset-[5px] rounded-full border-[3px] border-cyan-500 opacity-90" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-[4px] rounded-full bg-cyan-500" />
      </div>
      <div className="leading-none" style={{ color: 'var(--cex-text)' }}>
        <span className="text-[16px] font-light tracking-tight">CEX</span>
        <span className="text-[16px] font-light opacity-60">.IO</span>
      </div>
    </div>
  );
}

const bottomNav = [
  { to: '/dashboard',    label: 'Home',    icon: HomeIcon },
  { to: '/trading',      label: 'Markets', icon: MarketIcon },
  { to: '/trade',        label: 'Trade',   icon: TradeIcon },
  { to: '/transactions', label: 'History', icon: HistoryIcon },
  { to: '/wallet',       label: 'Assets',  icon: WalletIcon },
];

const DRAWER_ICON_PATHS = {
  '/dashboard':    [['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6']],
  '/profile':      [['M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z']],
  '/deposit':      [['M12 4v16m0 0l-4-4m4 4l4-4']],
  '/transfer':     [['M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4']],
  '/withdraw':     [['M12 20V4m0 16l4-4m-4 4l-4-4']],
  '/wallet':       [['M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z']],
  '/plans':        [['M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z']],
  '/trading':      [['M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z']],
  '/new-coins':    [['M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z', 'M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z']],
  '/transactions': [['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z']],
  '/support':      [['M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z']],
  '/recovery':     [['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15']],
  '/settings':     [['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z']],
  '/admin':        [['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z']],
};

function DrawerSvgIcon({ paths, color }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" className="w-5 h-5">
      {paths.map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />)}
    </svg>
  );
}

const DRAWER_ROUTES = [
  { to: '/dashboard',    key: 'dashboard', color: '#EE8267' },
  { to: '/profile',      key: 'profile',   color: '#185B64' },
  { to: '/deposit',      key: 'deposit',   color: '#0ECB81' },
  { to: '/transfer',     key: 'transfer',  color: '#536DFE' },
  { to: '/withdraw',     key: 'withdraw',  color: '#f6465d' },
  { to: '/wallet',       key: 'wallet',    color: '#EE8267' },
  { to: '/plans',        key: 'plans',     color: '#a855f7' },
  { to: '/trading',      key: 'markets',   color: '#0ECB81' },
  { to: '/new-coins',    key: 'newCoins',  color: '#f97316' },
  { to: '/transactions', key: 'transactions', color: '#566367' },
  { to: '/support',      key: 'support',   color: '#06b6d4' },
  { to: '/recovery',     key: 'recovery',  color: '#f6465d' },
  { to: '/settings',     key: 'settings',  color: '#566367' },
];

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? '#EE8267' : 'none'} stroke={active ? '#EE8267' : '#9BA3A6'} strokeWidth="1.8" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function MarketIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#EE8267' : '#9BA3A6'} strokeWidth="1.8" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  );
}
function TradeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#EE8267' : '#9BA3A6'} strokeWidth="1.8" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function HistoryIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#EE8267' : '#9BA3A6'} strokeWidth="1.8" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function WalletIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#EE8267' : '#9BA3A6'} strokeWidth="1.8" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const { prices } = useMarketPrices();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const langRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleLangChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    setLangOpen(false);
    setLangSearch('');
  };

  const filteredLangs = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(langSearch.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery('');
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
        setLangSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  const priceEntries = Object.values(prices || {});

  const searchResults = searchQuery.trim().length > 0
    ? priceEntries.filter(c => c?.symbol?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
    : priceEntries.filter(c => c?.price != null).slice(0, 6);

  const handleSelectCoin = (symbol) => {
    navigate(`/trading/${symbol}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const tickerCoins = priceEntries.filter(c => c?.price != null).slice(0, 12);

  return (
    <div className="min-h-screen flex flex-col"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #071d23 0%, #0a2229 100%)'
          : 'radial-gradient(circle at top left, rgba(24,91,100,0.12), transparent 22%), linear-gradient(180deg, #fbfcfd 0%, #f2f3f5 100%)',
      }}>

      {/* ── Top Header — CEX.IO white ─────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl" style={{ background: isDark ? 'rgba(14,32,38,0.92)' : 'rgba(255,255,255,0.88)', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(232,234,237,0.95)', height: 72 }}>
        <div className="flex items-center justify-between px-4 h-full max-w-2xl mx-auto lg:max-w-6xl">

          {/* Left: Avatar → drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-[18px] flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #F4927E 0%, #EE8267 100%)' }}
          >
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </button>

          {/* Center: Logo + Search */}
          <div className="flex-1 mx-3 flex items-center gap-2">
            {/* Logo */}
            <div className="hidden xs:flex items-center mr-2 flex-shrink-0">
              <ShellBrand />
            </div>

            {/* Search */}
            <div className="flex-1 relative" ref={searchRef}>
              <div className={`flex items-center gap-2 rounded-[18px] px-3 h-11 border transition-colors ${searchOpen ? 'border-brand-primary/50 shadow-sm' : ''}`}
                style={{
                  background: isDark ? 'rgba(15,42,50,0.95)' : 'rgba(244,247,248,0.95)',
                  borderColor: searchOpen ? '#EE826780' : isDark ? 'rgba(255,255,255,0.08)' : '#E8EAED',
                }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--cex-text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search coins..."
                  className="bg-transparent text-xs w-full outline-none"
                  style={{ color: 'var(--cex-text)' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-xs" style={{ color: 'var(--cex-text-3)' }}>✕</button>
                )}
              </div>

              {/* Search Dropdown */}
              {searchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-[24px] overflow-hidden shadow-xl z-50"
                  style={{ background: isDark ? 'rgba(14,32,38,0.98)' : 'rgba(255,255,255,0.96)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E8EAED'}`, backdropFilter: 'blur(18px)' }}>
                  <div className="px-3 py-2" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E8EAED'}` }}>
                    <p className="text-xs" style={{ color: 'var(--cex-text-3)' }}>{searchQuery ? `Results for "${searchQuery}"` : 'Popular Coins'}</p>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs" style={{ color: 'var(--cex-text-3)' }}>No coins found</div>
                  ) : (
                    searchResults.map((coin) => (
                      <button key={coin.symbol} onClick={() => handleSelectCoin(coin.symbol)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left"
                        style={{ '&:hover': { background: 'var(--cex-hover)' } }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f0f1f3'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                          style={{ background: '#EE8267' }}>
                          {coin.symbol[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--cex-text)' }}>{coin.symbol}</p>
                          <p className="text-xs truncate capitalize" style={{ color: 'var(--cex-text-3)' }}>{coin.coinId?.replace(/-/g, ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold" style={{ color: 'var(--cex-text)' }}>
                            ${coin.price < 1 ? coin.price.toFixed(4) : coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                          <p className={`text-xs ${(coin.change24h || 0) >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
                            {(coin.change24h || 0) >= 0 ? '+' : ''}{(coin.change24h || 0).toFixed(2)}%
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Lang + Theme toggle + Bell + Admin */}
          <div className="flex items-center gap-1">

            {/* Language selector */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1 rounded-[14px] px-2 py-2 transition-colors"
                style={{ color: isDark ? '#9BA3A6' : '#566367' }}
              >
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className="text-xs font-semibold hidden sm:block" style={{ color: isDark ? '#dce2e4' : '#1a2a2e' }}>{currentLang.code.toUpperCase()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-[20px] shadow-[0_20px_60px_rgba(8,35,41,0.28)]"
                  style={{ background: '#0e1e24', border: '1px solid rgba(255,255,255,0.09)', zIndex: 60 }}
                >
                  <div className="px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2 rounded-[12px] px-3 py-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
                      </svg>
                      <input
                        value={langSearch}
                        onChange={e => setLangSearch(e.target.value)}
                        placeholder="Search language..."
                        className="flex-1 bg-transparent text-xs text-white outline-none"
                        style={{ '::placeholder': { color: 'rgba(255,255,255,0.35)' } }}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="pb-2">
                    {filteredLangs.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleLangChange(lang.code)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                        style={{ background: lang.code === i18n.language ? 'rgba(238,130,103,0.15)' : 'transparent' }}
                      >
                        <span className="text-xl leading-none">{lang.flag}</span>
                        <span className={`text-sm font-medium ${lang.code === i18n.language ? '' : ''}`}
                          style={{ color: lang.code === i18n.language ? '#EE8267' : 'rgba(255,255,255,0.8)' }}>
                          {lang.label}
                        </span>
                        {lang.code === i18n.language && (
                          <span className="ml-auto text-xs" style={{ color: '#EE8267' }}>✓</span>
                        )}
                      </button>
                    ))}
                    {filteredLangs.length === 0 && (
                      <p className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>No results</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-2xl flex items-center justify-center transition-colors"
              style={{ color: isDark ? '#9BA3A6' : '#566367' }}
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              )}
            </button>
            <button className="w-9 h-9 rounded-2xl flex items-center justify-center transition-colors" style={{ color: isDark ? '#9BA3A6' : '#566367' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="text-xs font-bold px-3 py-2 rounded-full text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #F4927E 0%, #EE8267 100%)' }}>
                Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Price Ticker — CEX.IO style ───────────────────────────────── */}
      {tickerCoins.length > 0 && (
        <div className="fixed left-0 right-0 z-30 ticker-wrap" style={{ top: 72, background: '#0E2026', borderBottom: '1px solid rgba(255,255,255,0.08)', height: 36 }}>
          <div className="ticker-inner items-center h-full">
            {[...tickerCoins, ...tickerCoins].map((coin, i) => (
              <button key={i} onClick={() => navigate(`/trading/${coin.symbol}`)}
                className="inline-flex items-center gap-1.5 px-4 h-full text-xs hover:bg-white/5 transition-colors flex-shrink-0">
                <span className="font-semibold text-white">{coin.symbol}</span>
                <span style={{ color: '#9BA3A6' }}>
                  ${coin.price < 1 ? coin.price.toFixed(4) : coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className={`font-medium ${(coin.change24h || 0) >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
                  {(coin.change24h || 0) >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h || 0).toFixed(2)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Left Drawer ───────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-72 h-full flex flex-col slide-in-right shadow-2xl"
            style={{ background: isDark ? 'rgba(14,32,38,0.98)' : 'rgba(255,255,255,0.95)', borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E8EAED'}`, backdropFilter: 'blur(18px)' }}>

            {/* User info */}
            <div className="px-5 pt-10 pb-5" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E8EAED'}` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #EE8267 0%, #F4927E 100%)' }}>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--cex-text)' }}>{user?.username}</p>
                  <p className="text-xs truncate max-w-[170px]" style={{ color: 'var(--cex-text-3)' }}>{user?.email}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block text-white"
                    style={{ background: 'linear-gradient(135deg, #EE8267 0%, #F4927E 100%)' }}>
                    {user?.plan !== 'none' ? user?.plan?.toUpperCase() : 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
              {DRAWER_ROUTES.map(({ to, key, color }) => (
                <NavLink key={to} to={to} onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'text-brand-primary bg-brand-primary/8' : 'hover:text-brand-primary'
                    }`
                  }
                  style={({ isActive }) => isActive ? {} : { color: 'var(--cex-text-2)' }}
                >
                  <>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: color + '15', border: `1px solid ${color}25` }}>
                      <DrawerSvgIcon paths={DRAWER_ICON_PATHS[to] || [[]]} color={color} />
                    </span>
                    {t(`layout.${key}`)}
                  </>
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink to="/admin" onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'text-brand-primary bg-brand-primary/8' : 'text-text-secondary hover:bg-light-hover hover:text-brand-primary'
                    }`
                  }
                >
                  <>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: '#EE826715', border: '1px solid #EE826730' }}>
                      <DrawerSvgIcon paths={DRAWER_ICON_PATHS['/admin'] || [[]]} color="#EE8267" />
                    </span>
                    {t('layout.admin')}
                  </>
                </NavLink>
              )}
            </nav>

            {/* Logout */}
            <div className="px-2 pb-6 pt-2" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E8EAED'}` }}>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-red-trade/8 hover:text-red-trade transition-all">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-trade/10 border border-red-trade/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#f6465d" strokeWidth="1.8" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                {t('layout.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-x-hidden animate-fade-in"
        style={{ paddingTop: tickerCoins.length > 0 ? 108 : 72, paddingBottom: 'calc(82px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="px-3 py-6 w-full max-w-xl mx-auto lg:max-w-5xl">
          <Outlet />
        </div>
      </main>

      {/* ── Bottom Navigation — CEX.IO style ──────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl"
        style={{
          background: isDark ? 'rgba(14,32,38,0.95)' : 'rgba(255,255,255,0.88)',
          borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(232,234,237,0.95)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          minHeight: 70,
        }}>
        <div className="grid grid-cols-5 h-[70px] max-w-2xl mx-auto">
          {bottomNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-all ${isActive ? '' : 'opacity-50 hover:opacity-75'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-brand-primary' : 'text-text-muted'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <NotificationFeed />
    </div>
  );
}
