import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { walletAPI, tradeAPI } from '../services/api';
import { useMarketPrices } from '../hooks/useMarketPrices';
import AnimatedNumber from '../components/AnimatedNumber';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const SHORTCUTS = [
  { to: '/trade',       label: 'Trade',    color: '#EE8267', bg: '#EE826715',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> },
  { to: '/deposit',     label: 'Deposit',  color: '#0ECB81', bg: '#0ECB8115',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4"/></svg> },
  { to: '/withdraw',    label: 'Withdraw', color: '#f6465d', bg: '#f6465d15',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m0 0l4 4m-4-4L8 8"/></svg> },
  { to: '/wallet',      label: 'Assets',   color: '#185B64', bg: '#185B6415',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> },
  { to: '/new-coins',   label: 'New',      color: '#f97316', bg: '#f9731615',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/></svg> },
  { to: '/plans',       label: 'Invest',   color: '#a855f7', bg: '#a855f715',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
  { to: '/settings',    label: 'Referral', color: '#0ECB81', bg: '#0ECB8115',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  { to: '/transfer',    label: 'Transfer', color: '#06b6d4', bg: '#06b6d415',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg> },
  { to: '/deposit',     label: 'Recharge', color: '#EE8267', bg: '#EE826715',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> },
  { to: '/support',     label: 'Support',  color: '#566367', bg: '#56636715',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [recentTrades, setRecentTrades] = useState([]);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { prices } = useMarketPrices();

  useEffect(() => {
    walletAPI.getWallet()
      .then(({ data }) => setWallet(data))
      .catch(() => toast.error('Failed to load wallet'))
      .finally(() => setLoadingWallet(false));
    tradeAPI.getHistory(1, 5)
      .then(({ data }) => setRecentTrades(data.trades || []))
      .catch(() => {});
  }, []);

  const totalBalance = wallet?.totalBalance || 0;
  const usdtBalance = wallet?.usdtBalance || 0;
  const marketList = Object.values(prices || {}).filter(c => c?.price != null).slice(0, 10);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Balance Card — CEX.IO style ─────────────────────────────── */}
      <div className="rounded-[28px] p-5 sm:p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #071d23 0%, #0f545a 62%, #114147 100%)', boxShadow: '0 20px 50px rgba(14,32,38,0.25)' }}>
        {/* Coral glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(238,130,103,0.15) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white/70 text-[12px] uppercase tracking-[0.26em]">{t('dashboard.totalBalance')}</p>
            <button onClick={() => setBalanceVisible(v => !v)}
              className="text-white/50 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                {balanceVisible
                  ? <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                }
              </svg>
            </button>
          </div>

          {loadingWallet ? (
            <div className="h-10 w-44 bg-white/20 rounded animate-pulse mb-2" />
          ) : (
            <p className="text-[40px] sm:text-[48px] font-light tracking-[-0.04em] text-white mb-1">
              {balanceVisible ? <>$<AnimatedNumber value={totalBalance} decimals={2} /></> : '••••••'}
            </p>
          )}
          <p className="text-white/50 text-sm mb-5">
            ≈ ${balanceVisible ? usdtBalance.toFixed(2) : '••••'} available
          </p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              [t('dashboard.available'), `$${balanceVisible ? usdtBalance.toFixed(2) : '••••'}`],
              [t('dashboard.openTrades'), `${recentTrades.length}`],
              [t('dashboard.plan'), user?.plan && user.plan !== 'none' ? user.plan.toUpperCase() : 'STANDARD'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl px-3 py-3 bg-white/10 border border-white/10">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{label}</p>
                <p className="text-sm font-bold text-white mt-2">{value}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Link to="/deposit"
              className="flex-1 py-2.5 text-center text-sm font-bold rounded-full transition-all active:scale-95"
              style={{ background: '#EE8267', color: '#fff' }}>
              {t('dashboard.addFunds')}
            </Link>
            <Link to="/wallet"
              className="flex-1 py-2.5 text-center text-sm font-semibold rounded-full transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
              {t('dashboard.myWallet')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Shortcuts — CEX.IO style ────────────────────────────────── */}
      <div className="rounded-[30px] p-4 cex-surface">
        <div className="grid grid-cols-5 gap-2">
          {SHORTCUTS.slice(0, 5).map(({ to, label, color, bg, icon }) => (
            <Link key={to + label} to={to}
              className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group-active:scale-95"
                style={{ background: bg, border: `1px solid ${color}25`, color }}>
                {icon}
              </div>
              <span className="text-[10px] text-text-secondary text-center leading-tight group-hover:text-text-primary transition-colors font-medium">{label}</span>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2 mt-3">
          {SHORTCUTS.slice(5, 10).map(({ to, label, color, bg, icon }) => (
            <Link key={to + label} to={to}
              className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group-active:scale-95"
                style={{ background: bg, border: `1px solid ${color}25`, color }}>
                {icon}
              </div>
              <span className="text-[10px] text-text-secondary text-center leading-tight group-hover:text-text-primary transition-colors font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Hot Markets — CEX.IO style ──────────────────────────────── */}
      <div className="rounded-[30px] overflow-hidden cex-surface">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-light-border">
          <h3 className="font-bold text-text-primary text-sm">{t('dashboard.hotMarkets')}</h3>
          <Link to="/trading" className="text-xs font-semibold" style={{ color: '#EE8267' }}>{t('dashboard.viewAll')}</Link>
        </div>

        {/* Table header */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs text-text-muted font-medium">Name</span>
          <div className="flex items-center gap-6">
            <span className="text-xs text-text-muted font-medium">Price</span>
            <span className="text-xs text-text-muted font-medium w-16 text-right">24h Change</span>
          </div>
        </div>

        <div>
          {marketList.length === 0
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-t border-light-border">
                  <div className="w-9 h-9 rounded-full skeleton flex-shrink-0" />
                  <div className="flex-1 space-y-1.5"><div className="skeleton h-3 w-20" /><div className="skeleton h-2.5 w-14" /></div>
                  <div className="skeleton h-4 w-20" />
                </div>
              ))
            : marketList.map((coin) => (
                <Link key={coin.symbol} to={`/trading/${coin.symbol}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-light-hover transition-colors border-t border-light-border">
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-[#f0f1f3]">
                    <img
                      src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${coin.symbol.toLowerCase()}.svg`}
                      alt={coin.symbol}
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.parentNode.style.background = '#EE8267';
                        e.target.parentNode.innerHTML = `<span style="color:#fff;font-weight:700;font-size:14px">${coin.symbol[0]}</span>`;
                      }}
                    />
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm">{coin.symbol}<span className="text-text-muted font-normal">/USDT</span></p>
                    <p className="text-xs text-text-muted capitalize truncate">{coin.coinId?.replace(/-/g, ' ')}</p>
                  </div>
                  {/* Price + change */}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">
                      ${coin.price < 1
                        ? coin.price.toFixed(4)
                        : coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${(coin.change24h || 0) >= 0 ? 'text-green-trade bg-green-trade/10' : 'text-red-trade bg-red-trade/10'}`}>
                      {(coin.change24h || 0) >= 0 ? '+' : ''}{(coin.change24h || 0).toFixed(2)}%
                    </span>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>

      {/* ── Recent Trades — CEX.IO style ────────────────────────────── */}
      <div className="rounded-[30px] overflow-hidden cex-surface">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-light-border">
          <h3 className="font-bold text-text-primary text-sm">{t('dashboard.recentTrades')}</h3>
          <Link to="/transactions" className="text-xs font-semibold" style={{ color: '#EE8267' }}>{t('dashboard.viewAll')}</Link>
        </div>

        {recentTrades.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(238,130,103,0.1)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#EE8267" strokeWidth="1.5" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <p className="text-text-secondary text-sm font-medium">{t('dashboard.noTrades')}</p>
            <p className="text-text-muted text-xs mt-1 mb-4">{t('dashboard.startTrading')}</p>
            <Link to="/trading" className="btn-primary inline-flex text-xs px-5 py-2.5">{t('dashboard.startTrading')}</Link>
          </div>
        ) : (
          <div>
            {recentTrades.map((t) => (
              <div key={t._id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-light-hover transition-colors border-t border-light-border">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  t.type === 'buy' ? 'text-green-trade bg-green-trade/10' : 'text-red-trade bg-red-trade/10'
                }`}>
                  {t.type === 'buy'
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0-16l-4 4m4-4l4 4"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m0 16l4-4m-4 4l-4-4"/></svg>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{t.type === 'buy' ? 'Buy' : 'Sell'} {t.coin}</p>
                  <p className="text-xs text-text-muted">{(t.coinAmount || 0).toFixed(4)} {t.coin}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">${(t.totalUsdt || 0).toFixed(2)}</p>
                  {t.type === 'sell' && (t.pnl || 0) !== 0 && (
                    <p className={`text-xs font-medium ${(t.pnl || 0) >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
                      {(t.pnl || 0) >= 0 ? '+' : ''}${(t.pnl || 0).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
