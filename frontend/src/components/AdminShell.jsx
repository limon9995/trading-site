import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function AdminBrand({ isDark }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#f0b90b_0%,#d79d00_100%)] text-lg font-black text-[#241807] shadow-[0_12px_30px_rgba(240,185,11,0.28)]">
        A
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: isDark ? '#f0b90b' : '#9b771c' }}>Admin Console</p>
        <h1 className="text-xl font-semibold tracking-[-0.03em]" style={{ color: isDark ? '#fff8e5' : '#241807' }}>CEXBR Operations</h1>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen transition-colors"
      style={{
        background: isDark
          ? 'radial-gradient(circle at top left, rgba(240,185,11,0.10), transparent 24%), linear-gradient(180deg, #090805 0%, #100d07 100%)'
          : 'radial-gradient(circle at top left, rgba(240,185,11,0.16), transparent 24%), linear-gradient(180deg,#fffaf0 0%,#f7edd1 100%)',
      }}
    >
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          borderBottom: `1px solid ${isDark ? '#4b3a12' : '#ead18a'}`,
          background: isDark ? 'rgba(16,13,7,0.92)' : 'rgba(255,248,229,0.92)',
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <AdminBrand isDark={isDark} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                border: `1px solid ${isDark ? '#5a4512' : '#ead18a'}`,
                background: isDark ? '#19130a' : '#fff3cb',
                color: isDark ? '#f2d58a' : '#6f5012',
              }}
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <div
              className="rounded-full px-4 py-2 text-sm font-medium"
              style={{
                border: `1px solid ${isDark ? '#5a4512' : '#ead18a'}`,
                background: isDark ? '#19130a' : '#fff3cb',
                color: isDark ? '#f2d58a' : '#6f5012',
              }}
            >
              {user?.username || 'Admin'}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                border: `1px solid ${isDark ? '#5a4512' : '#ead18a'}`,
                background: isDark ? '#19130a' : '#fff8e5',
                color: isDark ? '#f2d58a' : '#6f5012',
              }}
            >
              Back To User App
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full bg-[#f0b90b] px-4 py-2 text-sm font-semibold text-[#241807] shadow-[0_14px_32px_rgba(240,185,11,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#dca70a]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
