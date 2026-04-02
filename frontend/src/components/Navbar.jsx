import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
];

const PAGE_TITLES = {
  '/dashboard':    'nav.dashboard',
  '/trading':      'nav.trading',
  '/transactions': 'nav.transactions',
  '/admin':        'nav.admin',
};

export default function Navbar({ onMenuClick }) {
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const [search, setSearch]     = useState('');
  const dropRef = useRef(null);

  const titleKey = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || null;
  const title = titleKey ? t(titleKey) : 'CEX.IO';

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleLangChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    setLangOpen(false);
    setSearch('');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setLangOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const filtered = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-30 border-b border-[#dbe7e8] bg-white/82 backdrop-blur-xl">
      <div className="flex h-[68px] items-center justify-between px-4 lg:px-6">

        {/* Left: hamburger + page title */}
        <div className="flex items-center gap-3.5">
          <button
            className="text-text-secondary transition-all hover:-translate-y-0.5 hover:bg-[#f7fbfb] lg:hidden p-2.5 rounded-[16px]"
            onClick={onMenuClick}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-[15px] sm:text-[16px] font-semibold tracking-[-0.03em] text-text-primary">{title}</h1>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">

          {/* Language selector */}
          <div ref={dropRef} className="relative">
            <button
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1.5 rounded-[14px] border border-[#d9e6e7] bg-[#f7fbfb] px-3 py-2 text-text-secondary transition-all hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="text-base leading-none">{currentLang.flag}</span>
              <span className="text-xs font-semibold text-text-primary hidden sm:block">{currentLang.code.toUpperCase()}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-text-muted">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {langOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-[20px] shadow-[0_20px_60px_rgba(8,35,41,0.18)]"
                style={{ background: '#0e1e24', border: '1px solid rgba(255,255,255,0.09)', zIndex: 50 }}
              >
                {/* Search */}
                <div className="px-3 pt-3 pb-2">
                  <div className="flex items-center gap-2 rounded-[12px] px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-white/40 flex-shrink-0">
                      <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search language..."
                      className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/35"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Language list */}
                <div className="pb-2">
                  {filtered.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{
                        background: lang.code === i18n.language ? 'rgba(238,130,103,0.15)' : 'transparent',
                      }}
                    >
                      <span className="text-xl leading-none">{lang.flag}</span>
                      <span className={`text-sm font-medium ${lang.code === i18n.language ? 'text-[#EE8267]' : 'text-white/80'}`}>
                        {lang.label}
                      </span>
                      {lang.code === i18n.language && (
                        <span className="ml-auto text-[#EE8267] text-xs">✓</span>
                      )}
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="px-4 py-3 text-xs text-white/40">No results</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-[16px] p-2.5 text-text-secondary transition-all hover:-translate-y-0.5 hover:bg-[#f7fbfb] hover:text-text-primary"
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Quick trade link */}
          <Link
            to="/trading"
            className="btn-primary hidden sm:inline-flex items-center gap-1 px-5 text-[13px]"
          >
            <span>{t('nav.trade')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
