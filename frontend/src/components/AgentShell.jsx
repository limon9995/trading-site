import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function AgentBrand({ isDark }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#0ea5e9_0%,#0369a1_100%)] text-lg font-black text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)]">
        AG
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>Agent Console</p>
        <h1 className="text-xl font-semibold tracking-[-0.03em]" style={{ color: isDark ? '#f0f9ff' : '#0c4a6e' }}>CEXBR Agent</h1>
      </div>
    </div>
  );
}

export default function AgentShell({ children }) {
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
          ? 'radial-gradient(circle at top left, rgba(14,165,233,0.10), transparent 24%), linear-gradient(180deg, #050a12 0%, #080e18 100%)'
          : 'radial-gradient(circle at top left, rgba(14,165,233,0.12), transparent 24%), linear-gradient(180deg,#f0f9ff 0%,#e0f2fe 100%)',
      }}
    >
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          borderBottom: `1px solid ${isDark ? '#0c3a58' : '#7dd3fc'}`,
          background: isDark ? 'rgba(5,10,18,0.92)' : 'rgba(240,249,255,0.92)',
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <AgentBrand isDark={isDark} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                border: `1px solid ${isDark ? '#0c4a6e' : '#7dd3fc'}`,
                background: isDark ? '#0c1829' : '#e0f2fe',
                color: isDark ? '#38bdf8' : '#0369a1',
              }}
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <div
              className="rounded-full px-4 py-2 text-sm font-medium"
              style={{
                border: `1px solid ${isDark ? '#0c4a6e' : '#7dd3fc'}`,
                background: isDark ? '#0c1829' : '#e0f2fe',
                color: isDark ? '#38bdf8' : '#0369a1',
              }}
            >
              {user?.username || 'Agent'}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                border: `1px solid ${isDark ? '#0c4a6e' : '#7dd3fc'}`,
                background: isDark ? '#0c1829' : '#f0f9ff',
                color: isDark ? '#38bdf8' : '#0369a1',
              }}
            >
              Back To User App
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(14,165,233,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#0284c7]"
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
