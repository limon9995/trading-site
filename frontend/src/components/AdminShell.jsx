import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#f0b90b_0%,#d79d00_100%)] text-lg font-black text-[#241807] shadow-[0_12px_30px_rgba(240,185,11,0.28)]">
        A
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9b771c]">Admin Console</p>
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-[#241807]">CEXBR Operations</h1>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(240,185,11,0.16),transparent_24%),linear-gradient(180deg,#fffaf0_0%,#f7edd1_100%)]">
      <header className="sticky top-0 z-40 border-b border-[#ead18a] bg-[rgba(255,248,229,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <AdminBrand />

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-[#ead18a] bg-[#fff3cb] px-4 py-2 text-sm font-medium text-[#6f5012]">
              {user?.username || 'Admin'}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-full border border-[#ead18a] bg-[#fff8e5] px-4 py-2 text-sm font-semibold text-[#6f5012] transition-all hover:-translate-y-0.5 hover:bg-[#ffe8a1]"
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
