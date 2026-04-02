import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { depositAPI, withdrawAPI } from '../services/api';

const PANEL =
  'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';
const PAGE_BUTTON =
  'rounded-full border border-[#d6e2e4] bg-white px-4 py-2 text-xs font-semibold text-[#506d72] transition-all hover:-translate-y-0.5 disabled:opacity-40';

function StatusBadge({ status }) {
  const map = {
    pending:   { bg: '#f6c90e18', color: '#f6c90e', border: '#f6c90e44', label: 'Pending' },
    approved:  { bg: '#0ECB8118', color: '#0ECB81', border: '#0ECB8144', label: 'Approved' },
    completed: { bg: '#0ECB8118', color: '#0ECB81', border: '#0ECB8144', label: 'Completed' },
    rejected:  { bg: '#ef444418', color: '#ef4444', border: '#ef444440', label: 'Rejected' },
    failed:    { bg: '#ef444418', color: '#ef4444', border: '#ef444440', label: 'Failed' },
  };
  const s = map[status?.toLowerCase()] || map.pending;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className={`${PANEL} py-16 text-center`}>
      <span className="text-5xl">{icon}</span>
      <p className="mt-4 font-semibold text-text-primary">{title}</p>
      <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
    </div>
  );
}

// ── Deposit History Tab ────────────────────────────────────────────────────────
function DepositHistory() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDeposits = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await depositAPI.getHistory(p);
      setDeposits(data.deposits || data.records || []);
      const total = data.pagination?.total || (data.deposits || data.records || []).length;
      const limit = data.pagination?.limit || 15;
      setTotalPages(Math.ceil(total / limit) || 1);
    } catch {
      toast.error('Failed to load deposit history');
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeposits(page); }, [page, fetchDeposits]);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (deposits.length === 0) {
    return <EmptyState icon="📥" title="No deposit history" subtitle="Your deposit requests will appear here once submitted." />;
  }

  return (
    <div className="space-y-3">
      {deposits.map((dep) => (
        <div key={dep._id} className={`${PANEL} p-5`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-brand-primary/15 border border-brand-primary/30">
                💳
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">
                  {dep.coin || dep.currency || 'USDT'} Deposit
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {dep.network || dep.chain || '—'} Network
                </p>
              </div>
            </div>
            <StatusBadge status={dep.status} />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Amount</span>
              <span className="text-text-primary font-semibold">
                ${(dep.amount || dep.usdAmount || 0).toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Date</span>
              <span className="text-text-secondary">{formatDate(dep.createdAt)}</span>
            </div>
            {dep.txHash && (
              <div className="col-span-2 flex justify-between">
                <span className="text-text-muted">TX Hash</span>
                <span className="text-brand-primary truncate max-w-[150px]">{dep.txHash}</span>
              </div>
            )}
            {dep.adminNote && (
              <div className="col-span-2 flex justify-between">
                <span className="text-text-muted">Note</span>
                <span className="text-text-secondary">{dep.adminNote}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-text-muted">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={PAGE_BUTTON}
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={PAGE_BUTTON}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Withdraw History Tab ───────────────────────────────────────────────────────
function WithdrawHistory() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchWithdrawals = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await withdrawAPI.history(p);
      setWithdrawals(data.requests || []);
      setPagination(data.pagination || {});
    } catch {
      toast.error('Failed to load withdrawal history');
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWithdrawals(page); }, [page, fetchWithdrawals]);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return <EmptyState icon="📤" title="No withdrawal history" subtitle="Your withdrawal requests will appear here." />;
  }

  return (
    <div className="space-y-3">
      {withdrawals.map((tx) => (
        <div key={tx._id} className={`${PANEL} p-5`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-red-trade/15 border border-red-trade/30">
                📤
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">{tx.coin || 'USDT'} Withdrawal</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {tx.network} · {formatDate(tx.createdAt)}
                </p>
              </div>
            </div>
            <StatusBadge status={tx.status} />
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Amount</span>
              <span className="text-red-trade font-semibold">-${(tx.amount || 0).toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Fee (2%)</span>
              <span className="text-text-secondary">-${(tx.fee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">You Receive</span>
              <span className="text-green-trade font-semibold">${(tx.netAmount || 0).toFixed(2)} {tx.coin}</span>
            </div>
            {tx.address && (
              <div className="flex justify-between pt-1 border-t border-light-border">
                <span className="text-text-muted">Address</span>
                <span className="truncate max-w-[180px] text-text-secondary">{tx.address}</span>
              </div>
            )}
            {tx.adminNote && (
              <div className="flex justify-between">
                <span className="text-text-muted">Note</span>
                <span className="text-text-secondary">{tx.adminNote}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-text-muted">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={PAGE_BUTTON}
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className={PAGE_BUTTON}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Transactions Component ───────────────────────────────────────────────
export default function Transactions() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('deposit');

  const tabs = [
    { id: 'deposit', label: t('transactions.deposits'), icon: '📥' },
    { id: 'withdraw', label: t('transactions.withdrawals'), icon: '📤' },
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <div className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0b2026_0%,#114850_48%,#1b6d71_100%)] px-6 py-7 text-white shadow-[0_28px_90px_rgba(8,32,38,0.28)] md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#96e5e6]">
              Transfer History
            </span>
            <h1 className="mt-4 text-[36px] font-light leading-[1.04] tracking-[-0.03em] md:text-[48px]">
              Review every deposit and withdrawal in one premium ledger.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/68 md:text-base">
              Cleaner tabs, better status surfaces and polished history cards make the account timeline feel like the rest of the exchange.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[330px]">
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Sections</p>
              <p className="mt-2 text-[28px] font-semibold text-white">2</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Timeline</p>
              <p className="mt-2 text-[28px] font-semibold text-white">Live</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 rounded-[28px] border border-[#d9e6e7] bg-white p-1.5 shadow-[0_18px_50px_rgba(8,35,41,0.07)]">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-[22px] py-3 text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-[#ee8267] text-white shadow-[0_12px_28px_rgba(238,130,103,0.22)]'
                : 'text-text-secondary hover:-translate-y-0.5 hover:text-text-primary'
            }`}
          >
            <span>{icon}</span>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'deposit' && <DepositHistory />}
        {activeTab === 'withdraw' && <WithdrawHistory />}
      </div>
    </div>
  );
}
