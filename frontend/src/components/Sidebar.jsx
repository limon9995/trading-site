import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavSvg({ paths, className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      {paths.map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />)}
    </svg>
  );
}

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',    icon: <NavSvg paths={['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6']} /> },
  { to: '/trading',      label: 'Trade',        icon: <NavSvg paths={['M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z']} /> },
  { to: '/deposit',      label: 'Deposit',      icon: <NavSvg paths={['M12 4v16m0 0l-4-4m4 4l4-4']} /> },
  { to: '/wallet',       label: 'Wallet',       icon: <NavSvg paths={['M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z']} /> },
  { to: '/plans',        label: 'Plans',        icon: <NavSvg paths={['M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z']} /> },
  { to: '/transactions', label: 'Transactions', icon: <NavSvg paths={['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z']} /> },
  { to: '/settings',     label: 'Settings',     icon: <NavSvg paths={['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z']} /> },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="border-b border-[#dbe7e8] px-6 py-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-brand-primary text-sm font-black text-text-inverse shadow-[0_12px_30px_rgba(238,130,103,0.2)]">CT</div>
          <div>
            <span className="text-[18px] font-semibold tracking-[-0.04em] text-text-primary">CEX.IO</span>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="border-b border-[#dbe7e8] px-4 py-4">
        <div className="flex items-center gap-3 rounded-[20px] border border-[#dde8e9] bg-[#f7fbfb] p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/20 text-sm font-bold text-brand-primary">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-[-0.02em] text-text-primary truncate">{user?.username}</p>
            <p className="text-xs text-text-secondary truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">Menu</p>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-[18px] px-3 py-3.5 text-sm font-medium tracking-[-0.01em] transition-all duration-150 ${
                isActive
                  ? 'bg-brand-primary/10 text-brand-primary shadow-[0_10px_24px_rgba(238,130,103,0.08)]'
                  : 'text-text-secondary hover:bg-[#f7fbfb] hover:text-text-primary'
              }`
            }
          >
            <span className="w-5 h-5 flex-shrink-0">{icon}</span>
            {label}
          </NavLink>
        ))}

        {/* Logout — Settings এর নিচে */}
        <div className="my-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-[18px] px-3 py-3.5 text-sm font-medium tracking-[-0.01em] text-text-secondary transition-all duration-150 hover:bg-red-trade/10 hover:text-red-trade"
          >
            <span className="w-5 h-5 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            Logout
          </button>
        </div>

        {/* Admin link (only for admins) */}
        {user?.role === 'admin' && (
          <>
            <div className="my-3 border-t border-[#dbe7e8]" />
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">Admin</p>
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[18px] px-3 py-3.5 text-sm font-medium tracking-[-0.01em] transition-all duration-150 ${
                  isActive
                    ? 'bg-red-trade/10 text-red-trade shadow-[0_10px_24px_rgba(239,68,68,0.08)]'
                    : 'text-text-secondary hover:bg-[#f7fbfb] hover:text-text-primary'
                }`
              }
            >
              <span className="w-5 h-5 flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      {/* Referral */}
      <div className="border-t border-[#dbe7e8] px-4 py-3">
        <div className="rounded-[20px] border border-brand-primary/20 bg-brand-primary/5 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary mb-1.5">Your Referral Code</p>
          <p className="text-brand-primary font-bold tracking-widest text-sm">{user?.referralCode}</p>
          <p className="text-xs text-text-muted mt-1">+$50 USDT per referral</p>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-60 border-r border-[#dbe7e8] bg-white lg:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={onClose} />
          <aside className="relative flex w-60 flex-col bg-white mobile-menu-open">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
