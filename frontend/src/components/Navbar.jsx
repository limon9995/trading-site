import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/trading': 'Trade',
  '/transactions': 'Transaction History',
  '/admin': 'Admin Panel',
};

export default function Navbar({ onMenuClick }) {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  // Match path (including dynamic trading/:symbol)
  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'CEX.IO';

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
        <div className="flex items-center gap-2.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-[16px] p-2.5 text-text-secondary transition-all hover:-translate-y-0.5 hover:bg-[#f7fbfb] hover:text-text-primary"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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
            <span>Trade Now</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
