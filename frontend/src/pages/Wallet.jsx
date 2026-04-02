import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { walletAPI, rechargeAPI } from '../services/api';
import { useMarketPrices } from '../hooks/useMarketPrices';
import AnimatedNumber from '../components/AnimatedNumber';
import { SkeletonCard, SkeletonTable } from '../components/SkeletonCard';

const PANEL =
  'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';

// Balance card component
function BalanceCard({ icon, label, amount, usdValue, color = 'text-text-primary', subtitle }) {
  return (
    <div className={`${PANEL} p-5 transition-transform duration-300 hover:-translate-y-1`}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#6c8084]">{label}</p>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef7f7] text-2xl shadow-inner">{icon}</span>
      </div>
      <p className={`text-[30px] font-semibold leading-none ${color}`}>
        <AnimatedNumber value={amount || 0} decimals={label === 'BTC' ? 6 : label === 'ETH' ? 4 : 2} />
        {label !== 'USDT' && label !== 'BONUS' && <span className="ml-1 text-sm font-normal text-[#7d8f93]">{label}</span>}
      </p>
      {usdValue !== undefined && (
        <p className="mt-2 text-xs text-[#567176]">
          ≈ ${(usdValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </p>
      )}
      {subtitle && <p className="mt-2 text-xs text-[#567176]">{subtitle}</p>}
    </div>
  );
}

// Recharge quick-select amounts
const QUICK_AMOUNTS = [50, 100, 500, 1000, 5000, 10000];

export default function Wallet() {
  const { t } = useTranslation();
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { prices } = useMarketPrices(30000);

  const fetchWallet = useCallback(async () => {
    try {
      const { data } = await walletAPI.getWallet();
      setWallet(data);
    } catch (err) {
      toast.error('Failed to load wallet');
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const { data } = await rechargeAPI.getHistory(page);
      setHistory(data.records || []);
      setHistoryTotal(data.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load recharge history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchHistory(1);
  }, [fetchWallet, fetchHistory]);

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount < 10) {
      return toast.error('Minimum recharge is $10 USDT');
    }
    setRecharging(true);
    try {
      const { data } = await rechargeAPI.recharge(amount);
      toast.success(data.message);
      setRechargeAmount('');
      await fetchWallet();
      await fetchHistory(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Recharge failed');
    } finally {
      setRecharging(false);
    }
  };

  const handleCopyReferral = () => {
    if (!wallet?.referralCode) return;
    navigator.clipboard.writeText(wallet.referralCode).then(() => {
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleHistoryPageChange = (page) => {
    setHistoryPage(page);
    fetchHistory(page);
  };

  // Calculate bonus threshold label
  const bonusLabel = () => {
    const amt = parseFloat(rechargeAmount) || 0;
    if (amt >= 5000) return `+${(amt * 0.10).toFixed(2)} bonus (10%)`;
    if (amt >= 1000) return `+${(amt * 0.05).toFixed(2)} bonus (5%)`;
    return 'Deposit $1,000+ for 5% bonus';
  };

  if (loadingWallet) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
        <SkeletonCard lines={5} />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  const holdings = wallet?.holdings || [];
  const totalPages = Math.ceil(historyTotal / 10);

  const btcChange = prices?.BTC?.change24h || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#0b2026_0%,#11454f_48%,#1b6d71_100%)] px-5 py-4 text-white shadow-[0_20px_50px_rgba(8,32,38,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#91dde2]">
              {t('wallet.title')}
            </span>
            <h1 className="mt-1.5 max-w-xl text-[18px] font-light leading-[1.15] tracking-[-0.02em] md:text-[22px]">
              Manage balances, rewards and funding in one premium wallet.
            </h1>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <div className="rounded-[26px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">{t('wallet.totalBalance')}</p>
              <p className="mt-2 text-[28px] font-semibold text-white">${(wallet?.totalBalance || 0).toFixed(2)}</p>
              <p className="mt-1 text-xs text-white/58">All balances combined</p>
            </div>
            <div className="rounded-[26px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">{t('wallet.referral')}</p>
              <p className="mt-2 text-[28px] font-semibold text-white">{wallet?.referralCount || 0}</p>
              <p className="mt-1 text-xs text-white/58">${(wallet?.referralEarnings || 0).toFixed(2)} earned</p>
            </div>
            <div className="rounded-[26px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">BTC 24h</p>
              <p className="mt-2 text-[28px] font-semibold text-white">{btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%</p>
              <p className="mt-1 text-xs text-white/58">Live market pulse</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Balance Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BalanceCard
          icon="💵"
          label="USDT"
          amount={wallet?.usdtBalance || 0}
          usdValue={wallet?.usdtBalance || 0}
          color="text-green-trade"
          subtitle="Available to trade"
        />
        <BalanceCard
          icon="₿"
          label="BTC"
          amount={wallet?.btcBalance || 0}
          usdValue={wallet?.btcUsdValue || 0}
          color="text-brand-primary"
        />
        <BalanceCard
          icon="⟠"
          label="ETH"
          amount={wallet?.ethBalance || 0}
          usdValue={wallet?.ethUsdValue || 0}
          color="text-blue-400"
        />
        <BalanceCard
          icon="🎁"
          label="BONUS"
          amount={wallet?.bonusBalance || 0}
          color="text-purple-400"
          subtitle="Accumulated bonuses"
        />
      </div>

      {/* ── Portfolio Summary ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${PANEL} p-6`}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-[#6d8185]">Total Portfolio</p>
          <p className="text-[34px] font-semibold text-[#0d2127]">
            $<AnimatedNumber value={wallet?.totalBalance || 0} decimals={2} />
          </p>
          <p className="mt-2 text-xs text-[#567176]">USDT + all holdings</p>
        </div>
        <div className={`${PANEL} p-6`}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-[#6d8185]">Total P&amp;L</p>
          <p className={`text-[34px] font-semibold ${(wallet?.totalPnl || 0) >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
            {(wallet?.totalPnl || 0) >= 0 ? '+' : ''}$<AnimatedNumber value={Math.abs(wallet?.totalPnl || 0)} decimals={2} />
          </p>
          <p className="mt-2 text-xs text-[#567176]">
            {(wallet?.totalPnlPercent || 0) >= 0 ? '+' : ''}{(wallet?.totalPnlPercent || 0).toFixed(2)}% all time
          </p>
        </div>
        <div className={`${PANEL} p-6`}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-[#6d8185]">Active Plan</p>
          <p className="text-[34px] font-semibold capitalize text-brand-primary">
            {wallet?.plan === 'none' ? '—' : wallet?.plan || '—'}
          </p>
          {wallet?.planIsActive ? (
            <p className="mt-2 text-xs text-green-trade">
              Active · Expires {new Date(wallet?.planExpiresAt).toLocaleDateString()}
            </p>
          ) : (
            <Link to="/plans" className="mt-2 block text-xs font-semibold text-brand-primary hover:underline">
              View Plans →
            </Link>
          )}
        </div>
      </div>

      {/* ── Add Funds Section ───────────────────────────────────────── */}
      <div className={`${PANEL} p-6 md:p-7`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[28px] font-light tracking-[-0.03em] text-[#0d2127]">{t('wallet.recharge')}</h3>
            <p className="mt-1 text-sm text-[#567176]">Fast internal top-up flow with bonus preview and clean credit summary.</p>
          </div>
          <span className="rounded-full border border-[#b9d0d2] bg-[#f2fbfb] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1b7578]">
            Instant Credit
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#456368]">Amount (USDT)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">$</span>
              <input
                type="number"
                className="input-field rounded-[22px] border-[#d7e4e5] bg-[#f7fbfb] pl-7"
                placeholder="Enter amount..."
                min="10"
                step="10"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
              />
            </div>

            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setRechargeAmount(String(amt))}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                    parseFloat(rechargeAmount) === amt
                      ? 'border-brand-primary bg-brand-primary text-white shadow-[0_10px_24px_rgba(238,130,103,0.24)]'
                      : 'border-[#d7e3e4] bg-white text-[#557175] hover:-translate-y-0.5 hover:border-[#b5cfd1] hover:text-[#102328]'
                  }`}
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Bonus preview */}
            {rechargeAmount && (
              <p className={`text-xs ${parseFloat(rechargeAmount) >= 1000 ? 'text-green-trade' : 'text-text-muted'}`}>
                {bonusLabel()}
              </p>
            )}
          </div>

          {/* Summary + CTA */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#456368]">Summary</label>
            <div className="space-y-2 rounded-[24px] border border-[#dce8e9] bg-[linear-gradient(180deg,#f8fcfc_0%,#eef7f7_100%)] p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Amount</span>
                <span className="text-text-primary">${parseFloat(rechargeAmount || 0).toFixed(2)} USDT</span>
              </div>
              {parseFloat(rechargeAmount) >= 1000 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Bonus</span>
                  <span className="text-green-trade">
                    +${(parseFloat(rechargeAmount) >= 5000
                      ? parseFloat(rechargeAmount) * 0.10
                      : parseFloat(rechargeAmount) * 0.05).toFixed(2)} USDT
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-light-border pt-2 font-medium">
                <span className="text-text-muted">Total Credit</span>
                <span className="text-brand-primary">
                  ${(parseFloat(rechargeAmount) >= 5000
                    ? parseFloat(rechargeAmount) * 1.10
                    : parseFloat(rechargeAmount) >= 1000
                    ? parseFloat(rechargeAmount) * 1.05
                    : parseFloat(rechargeAmount) || 0).toFixed(2)} USDT
                </span>
              </div>
            </div>

              <button
                onClick={handleRecharge}
                disabled={recharging || !rechargeAmount || parseFloat(rechargeAmount) < 10}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#ee8267] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a] disabled:cursor-not-allowed disabled:opacity-50"
              >
              {recharging ? (
                <><div className="w-4 h-4 border-2 border-light-border/30 border-t-dark-bg rounded-full animate-spin" />Processing...</>
              ) : 'Add Funds'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Holdings Table ───────────────────────────────────────────── */}
      <div className={`${PANEL} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[#e4ecec] px-6 py-5">
          <div>
            <h3 className="text-[26px] font-light tracking-[-0.03em] text-[#0d2127]">{t('wallet.holdings')}</h3>
            <p className="mt-1 text-sm text-[#5b7377]">A clearer exchange-style snapshot of your active crypto positions.</p>
          </div>
          <Link to="/trade" className="rounded-full border border-[#bed3d5] bg-[#f4fbfb] px-4 py-2 text-sm font-semibold text-[#1a7578] transition-all hover:-translate-y-0.5">Trade →</Link>
        </div>

        {holdings.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <span className="text-4xl">🪙</span>
            <p className="text-text-secondary mt-3 text-sm">No holdings yet. Start trading to build your portfolio.</p>
            <Link to="/trading" className="mt-4 inline-flex rounded-full bg-[#ee8267] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.22)] transition-all hover:-translate-y-0.5">Trade Now</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-light-border">
                  <th className="px-5 py-3 text-left">Asset</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Avg Buy</th>
                  <th className="px-5 py-3 text-right">Current Price</th>
                  <th className="px-5 py-3 text-right">Value</th>
                  <th className="px-5 py-3 text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.symbol} className="border-b border-light-border/50 transition-colors hover:bg-[#f6fbfb]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-brand-primary">
                          {h.symbol[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{h.symbol}</p>
                          <p className="text-xs text-text-muted capitalize">{h.coinId?.replace(/-/g, ' ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-text-primary">{h.amount.toFixed(6)}</td>
                    <td className="px-5 py-4 text-right text-text-secondary">
                      ${(h.avgBuyPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right text-text-primary">
                      ${(h.currentPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-text-primary">
                      ${(h.currentValue || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={h.pnl >= 0 ? 'text-green-trade' : 'text-red-trade'}>
                        {h.pnl >= 0 ? '+' : ''}${(h.pnl || 0).toFixed(2)}
                      </span>
                      <br />
                      <span className={`text-xs ${(h.pnlPercent || 0) >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
                        ({(h.pnlPercent || 0) >= 0 ? '+' : ''}{(h.pnlPercent || 0).toFixed(2)}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recharge History ─────────────────────────────────────────── */}
      <div className={`${PANEL} overflow-hidden`}>
        <div className="border-b border-[#e4ecec] px-6 py-5">
          <h3 className="text-[24px] font-light tracking-[-0.03em] text-[#0d2127]">Recharge History</h3>
        </div>

        {historyLoading ? (
          <SkeletonTable rows={4} />
        ) : history.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-text-muted text-sm">No recharge history yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-light-border">
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Bonus</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                  <tr key={r._id} className="border-b border-light-border/50 transition-colors hover:bg-[#f6fbfb]">
                      <td className="px-5 py-3 text-text-secondary text-xs">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-text-primary">
                        ${(r.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {r.bonus > 0 ? (
                          <span className="text-green-trade">+${r.bonus.toFixed(2)}</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-brand-primary">
                        ${((r.amount || 0) + (r.bonus || 0)).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.status === 'completed'
                            ? 'bg-green-trade/10 text-green-trade'
                            : r.status === 'failed'
                            ? 'bg-red-trade/10 text-red-trade'
                            : 'bg-brand-primary/10 text-brand-primary'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 flex items-center justify-between border-t border-light-border">
                <p className="text-xs text-text-muted">{historyTotal} total records</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleHistoryPageChange(historyPage - 1)}
                    disabled={historyPage <= 1}
                    className="rounded-full border border-[#d6e2e4] bg-white px-4 py-2 text-xs font-semibold text-[#506d72] transition-all hover:-translate-y-0.5 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-text-secondary self-center">
                    {historyPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handleHistoryPageChange(historyPage + 1)}
                    disabled={historyPage >= totalPages}
                    className="rounded-full border border-[#d6e2e4] bg-white px-4 py-2 text-xs font-semibold text-[#506d72] transition-all hover:-translate-y-0.5 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Referral Section ─────────────────────────────────────────── */}
      <div className="rounded-[32px] border border-[#c5dbde] bg-[linear-gradient(135deg,#eef8f8_0%,#ffffff_48%,#f6fcfc_100%)] p-6 shadow-[0_24px_70px_rgba(8,35,41,0.06)]">
        <h3 className="mb-1 text-[28px] font-light tracking-[-0.03em] text-[#0d2127]">Referral Program</h3>
        <p className="text-xs text-text-muted mb-4">Earn <span className="text-brand-primary font-semibold">5% commission</span> on every trade fee your referred users pay</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <p className="text-sm text-text-secondary mb-3">
              Share your referral code. When your friends trade, you earn automatically.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-[22px] border border-[#dbe8e9] bg-white px-4 py-3">
                <p className="text-lg font-bold text-brand-primary tracking-widest">
                  {wallet?.referralCode || '------'}
                </p>
              </div>
              <button
                onClick={handleCopyReferral}
                className={`rounded-full border border-[#cfdddf] bg-white px-5 py-3 text-sm font-semibold text-[#4f6d72] transition-all hover:-translate-y-0.5 ${copied ? 'border-green-trade text-green-trade' : ''}`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[24px] border border-[#dbe7e8] bg-white p-4 text-center">
              <p className="text-[28px] font-semibold text-[#0d2127]">{wallet?.referralCount || 0}</p>
              <p className="text-xs text-text-muted mt-1">Total Referrals</p>
            </div>
            <div className="rounded-[24px] border border-[#dbe7e8] bg-white p-4 text-center">
              <p className="text-[28px] font-semibold text-brand-primary">
                ${(wallet?.referralEarnings || 0).toFixed(2)}
              </p>
              <p className="text-xs text-text-muted mt-1">Commission Earned</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
