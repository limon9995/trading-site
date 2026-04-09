import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { agentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ─── Shared style constants ────────────────────────────────────────────────────
const PANEL   = 'rounded-[30px] border border-[var(--ag-border)] bg-[var(--ag-panel)] shadow-[var(--ag-panel-shadow)]';
const BTN     = 'rounded-full border border-[var(--ag-btn-border)] bg-[var(--ag-btn-bg)] px-4 py-2 text-xs font-semibold text-[var(--ag-btn-text)] transition-all hover:-translate-y-0.5 hover:bg-[var(--ag-btn-hover)] disabled:opacity-40';
const INPUT   = 'w-full rounded-[20px] border border-[var(--ag-input-border)] bg-[var(--ag-input-bg)] px-4 py-2.5 text-sm text-[var(--ag-input-text)] placeholder:text-[var(--ag-muted)] outline-none focus:ring-2 focus:ring-sky-400/30';
const SECTION = 'rounded-[28px] border border-[var(--ag-border)] bg-[var(--ag-section-bg)] shadow-[var(--ag-section-shadow)]';
const LABEL   = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ag-label)]';

const ALL_AGENT_TABS = [
  { key: 'users',       label: '👥', fullLabel: 'Users',       perm: 'view_users',          desc: 'View user accounts' },
  { key: 'kyc',         label: '🪪', fullLabel: 'KYC',         perm: 'kyc_approve',         desc: 'Approve or reject KYC' },
  { key: 'trades',      label: '⚡', fullLabel: 'Force Trade',  perm: 'force_trade',         desc: 'Set force win / lose per user' },
  { key: 'deposits',    label: '📥', fullLabel: 'Deposits',     perm: 'manage_deposits',     desc: 'Approve / reject deposit requests' },
  { key: 'withdrawals', label: '💸', fullLabel: 'Withdrawals',  perm: 'manage_withdrawals',  desc: 'Approve / reject withdrawal requests' },
  { key: 'balance',     label: '💰', fullLabel: 'Balance',      perm: 'manage_balance',      desc: 'Credit or debit user balance' },
];

const TAB_TONES = {
  users:       { accent: '#0ea5e9', glow: 'rgba(14,165,233,0.18)' },
  kyc:         { accent: '#06b6d4', glow: 'rgba(6,182,212,0.18)' },
  trades:      { accent: '#38bdf8', glow: 'rgba(56,189,248,0.18)' },
  deposits:    { accent: '#0284c7', glow: 'rgba(2,132,199,0.18)' },
  withdrawals: { accent: '#0369a1', glow: 'rgba(3,105,161,0.18)' },
  balance:     { accent: '#f59e0b', glow: 'rgba(245,158,11,0.18)' },
};

function KycBadge({ status }) {
  const MAP = {
    unverified: 'bg-gray-500/10 text-gray-400',
    pending:    'bg-yellow-400/10 text-yellow-400',
    verified:   'bg-green-500/10 text-green-400',
    rejected:   'bg-red-500/10 text-red-400',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${MAP[status] || MAP.unverified}`}>
      {status}
    </span>
  );
}

function StatusBadge({ status }) {
  const MAP = {
    pending:  'bg-yellow-400/10 text-yellow-400',
    approved: 'bg-green-500/10 text-green-400',
    rejected: 'bg-red-500/10 text-red-400',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${MAP[status] || 'bg-gray-500/10 text-gray-400'}`}>
      {status}
    </span>
  );
}

// ─── Review modal (deposits & withdrawals) ────────────────────────────────────
function ReviewModal({ item, type, onClose, onConfirm, loading }) {
  const [note, setNote] = useState('');
  const [action, setAction] = useState('approve');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[28px] bg-[var(--ag-panel)] border border-[var(--ag-border)] p-6 shadow-2xl space-y-4">
        <h3 className="text-lg font-semibold text-[var(--ag-title)]">Review {type}</h3>
        <div className="rounded-[18px] bg-[var(--ag-section-bg)] p-4 text-sm space-y-1 text-[var(--ag-muted)]">
          <p><span className="font-medium text-[var(--ag-title)]">User:</span> {item?.user?.username || '—'}</p>
          <p><span className="font-medium text-[var(--ag-title)]">Amount:</span> ${item?.amount}</p>
          {item?.coin && <p><span className="font-medium text-[var(--ag-title)]">Coin:</span> {item.coin} / {item.network}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setAction('approve')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold border transition-all ${action === 'approve' ? 'bg-green-500 text-white border-green-500' : 'bg-transparent text-green-400 border-green-500/40'}`}
          >Approve</button>
          <button
            onClick={() => setAction('reject')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold border transition-all ${action === 'reject' ? 'bg-red-500 text-white border-red-500' : 'bg-transparent text-red-400 border-red-500/40'}`}
          >Reject</button>
        </div>
        <div>
          <label className={LABEL}>Note (optional)</label>
          <textarea className={INPUT} rows={2} placeholder="Add a note..." value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-1">
          <button className={BTN + ' flex-1'} onClick={onClose} disabled={loading}>Cancel</button>
          <button
            onClick={() => onConfirm(action, note)}
            disabled={loading}
            className="flex-1 rounded-full py-2 text-sm font-semibold text-white bg-[#0ea5e9] hover:bg-[#0284c7] transition-all disabled:opacity-40"
          >
            {loading ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Agent Page ──────────────────────────────────────────────────────────
export default function Agent() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const perms = user?.agentPermissions || [];
  const TABS = ALL_AGENT_TABS.filter(t => perms.includes(t.perm));
  const [activeTab, setActiveTab] = useState(TABS[0]?.key || '');

  // Users state
  const [users, setUsers]           = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage]     = useState(1);
  const [userPagination, setUserPagination] = useState({});

  // KYC state
  const [kycUsers, setKycUsers]     = useState([]);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycModal, setKycModal]     = useState(null); // { user }
  const [kycModalLoading, setKycModalLoading] = useState(false);

  // Trade mode state
  const [tradeModeLoading, setTradeModeLoading] = useState({});

  // Deposits state
  const [deposits, setDeposits]         = useState([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [depositPage, setDepositPage]   = useState(1);
  const [depositPagination, setDepositPagination] = useState({});
  const [depositFilter, setDepositFilter] = useState('');
  const [depositModal, setDepositModal] = useState(null);
  const [depositModalLoading, setDepositModalLoading] = useState(false);

  // Withdrawals state
  const [withdrawals, setWithdrawals]   = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawPage, setWithdrawPage] = useState(1);
  const [withdrawPagination, setWithdrawPagination] = useState({});
  const [withdrawFilter, setWithdrawFilter] = useState('');
  const [withdrawModal, setWithdrawModal] = useState(null);
  const [withdrawModalLoading, setWithdrawModalLoading] = useState(false);

  // Balance state
  const [balanceUsers, setBalanceUsers]         = useState([]);
  const [balanceUsersLoading, setBalanceUsersLoading] = useState(false);
  const [balanceSearch, setBalanceSearch]       = useState('');
  const [balancePage, setBalancePage]           = useState(1);
  const [balancePagination, setBalancePagination] = useState({});
  const [balanceModal, setBalanceModal]         = useState(null); // { user }
  const [balanceModalLoading, setBalanceModalLoading] = useState(false);
  const [balanceAmount, setBalanceAmount]       = useState('');
  const [balanceReason, setBalanceReason]       = useState('');

  // ─── Fetchers ──────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await agentAPI.getUsers(userPage, userSearch);
      setUsers(data.users || []);
      setUserPagination(data.pagination || {});
    } catch { toast.error('Failed to load users'); }
    finally { setUsersLoading(false); }
  }, [userPage, userSearch]);

  const fetchKycUsers = useCallback(async () => {
    setKycLoading(true);
    try {
      const { data } = await agentAPI.getUsers(1, '');
      setKycUsers((data.users || []).filter(u => u.kycStatus && u.kycStatus !== 'unverified'));
    } catch { toast.error('Failed to load KYC users'); }
    finally { setKycLoading(false); }
  }, []);

  const fetchDeposits = useCallback(async () => {
    setDepositsLoading(true);
    try {
      const { data } = await agentAPI.getDepositRequests(depositPage, depositFilter);
      setDeposits(data.requests || []);
      setDepositPagination(data.pagination || {});
    } catch { toast.error('Failed to load deposit requests'); }
    finally { setDepositsLoading(false); }
  }, [depositPage, depositFilter]);

  const fetchWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true);
    try {
      const { data } = await agentAPI.getWithdrawRequests(withdrawPage, withdrawFilter);
      setWithdrawals(data.requests || []);
      setWithdrawPagination(data.pagination || {});
    } catch { toast.error('Failed to load withdrawal requests'); }
    finally { setWithdrawalsLoading(false); }
  }, [withdrawPage, withdrawFilter]);

  const fetchBalanceUsers = useCallback(async () => {
    setBalanceUsersLoading(true);
    try {
      const { data } = await agentAPI.getUsers(balancePage, balanceSearch);
      setBalanceUsers(data.users || []);
      setBalancePagination(data.pagination || {});
    } catch { toast.error('Failed to load users'); }
    finally { setBalanceUsersLoading(false); }
  }, [balancePage, balanceSearch]);

  useEffect(() => {
    if (activeTab === 'users')       fetchUsers();
    if (activeTab === 'kyc')         fetchKycUsers();
    if (activeTab === 'trades')      fetchUsers();
    if (activeTab === 'deposits')    fetchDeposits();
    if (activeTab === 'withdrawals') fetchWithdrawals();
    if (activeTab === 'balance')     fetchBalanceUsers();
  }, [activeTab, fetchUsers, fetchKycUsers, fetchDeposits, fetchWithdrawals, fetchBalanceUsers]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleKycReview = async (status) => {
    if (!kycModal) return;
    setKycModalLoading(true);
    try {
      await agentAPI.reviewKyc(kycModal._id, status);
      toast.success(`KYC ${status} for ${kycModal.username}`);
      setKycModal(null);
      fetchKycUsers();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update KYC');
    } finally {
      setKycModalLoading(false);
    }
  };

  const handleTradeMode = async (userId, tradeMode) => {
    setTradeModeLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await agentAPI.setTradeMode(userId, tradeMode);
      toast.success(tradeMode === 'win' ? 'Force Win enabled' : 'Force Loss enabled');
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to set trade mode');
    } finally {
      setTradeModeLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDepositReview = async (action, note) => {
    if (!depositModal) return;
    setDepositModalLoading(true);
    try {
      if (action === 'approve') await agentAPI.approveDeposit(depositModal._id, note);
      else await agentAPI.rejectDeposit(depositModal._id, note);
      toast.success(`Deposit ${action}d`);
      setDepositModal(null);
      fetchDeposits();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to review deposit');
    } finally {
      setDepositModalLoading(false);
    }
  };

  const handleWithdrawReview = async (action, note) => {
    if (!withdrawModal) return;
    setWithdrawModalLoading(true);
    try {
      if (action === 'approve') await agentAPI.approveWithdraw(withdrawModal._id, note);
      else await agentAPI.rejectWithdraw(withdrawModal._id, note);
      toast.success(`Withdrawal ${action}d`);
      setWithdrawModal(null);
      fetchWithdrawals();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to review withdrawal');
    } finally {
      setWithdrawModalLoading(false);
    }
  };

  const handleModifyBalance = async () => {
    if (!balanceModal) return;
    const delta = parseFloat(balanceAmount);
    if (!balanceAmount || isNaN(delta) || delta === 0) return toast.error('Enter a valid non-zero amount');
    setBalanceModalLoading(true);
    try {
      const { data } = await agentAPI.modifyBalance(balanceModal._id, delta, balanceReason || undefined);
      toast.success(data.message);
      setBalanceModal(null);
      setBalanceAmount('');
      setBalanceReason('');
      fetchBalanceUsers();
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to modify balance');
    } finally {
      setBalanceModalLoading(false);
    }
  };

  // ─── CSS vars (blue/teal theme) ───────────────────────────────────────────
  const agentVars = isDark ? {
    '--ag-border': '#0c3a58',
    '--ag-panel': '#050a12',
    '--ag-panel-shadow': '0 24px 80px rgba(0,0,0,0.42)',
    '--ag-btn-border': '#0c4a6e',
    '--ag-btn-bg': '#0c1829',
    '--ag-btn-text': '#38bdf8',
    '--ag-btn-hover': '#0e2540',
    '--ag-input-border': '#0c3a58',
    '--ag-input-bg': '#080e18',
    '--ag-input-text': '#e0f2fe',
    '--ag-section-bg': '#060c16',
    '--ag-section-shadow': '0 18px 50px rgba(0,0,0,0.34)',
    '--ag-label': '#38bdf8',
    '--ag-eyebrow': '#7dd3fc',
    '--ag-title': '#f0f9ff',
    '--ag-muted': '#7dd3fc',
  } : {
    '--ag-border': '#bae6fd',
    '--ag-panel': '#f0f9ff',
    '--ag-panel-shadow': '0 24px 80px rgba(14,165,233,0.10)',
    '--ag-btn-border': '#7dd3fc',
    '--ag-btn-bg': '#e0f2fe',
    '--ag-btn-text': '#0369a1',
    '--ag-btn-hover': '#bae6fd',
    '--ag-input-border': '#7dd3fc',
    '--ag-input-bg': '#f0f9ff',
    '--ag-input-text': '#0c4a6e',
    '--ag-section-bg': '#f8fcff',
    '--ag-section-shadow': '0 18px 50px rgba(14,165,233,0.08)',
    '--ag-label': '#0369a1',
    '--ag-eyebrow': '#0284c7',
    '--ag-title': '#0c4a6e',
    '--ag-muted': '#0284c7',
  };

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (TABS.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center" style={agentVars}>
        <div className="text-5xl">🔐</div>
        <h2 className="text-2xl font-light text-[var(--ag-title)]">No permissions assigned yet</h2>
        <p className="text-sm text-[var(--ag-muted)]">Contact your administrator to get access to agent features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[var(--ag-title)]" style={agentVars}>
      {/* ─── Hero banner ────────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden rounded-[34px] px-6 py-6 text-white shadow-[0_30px_90px_rgba(14,165,233,0.24)] md:px-8"
        style={{ background: isDark ? 'linear-gradient(135deg,#050a12_0%,#0c2d4a_45%,#0369a1_100%)' : 'linear-gradient(135deg,#0c4a6e_0%,#0369a1_45%,#0ea5e9_100%)' }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full border border-sky-400/40 bg-sky-400/18 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200">
              Agent Console
            </span>
            <h2 className="mt-4 text-[28px] font-light leading-[1.05] tracking-[-0.03em] md:text-[36px]">
              Welcome, {user?.username}
            </h2>
            <p className="mt-2 text-sm text-white/68 leading-6">
              You have access to {TABS.length} feature{TABS.length !== 1 ? 's' : ''}:{' '}
              {TABS.map(t => t.fullLabel).join(', ')}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
              >
                {t.label} {t.fullLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tab pills ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {TABS.map(({ key, label, fullLabel, desc }) => {
          const tone = TAB_TONES[key] || { accent: '#0ea5e9', glow: 'rgba(14,165,233,0.18)' };
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="rounded-[20px] border p-4 text-left transition-all hover:-translate-y-0.5"
              style={{
                borderColor: activeTab === key ? tone.accent : 'var(--ag-border)',
                background: activeTab === key
                  ? `radial-gradient(circle at 30% 30%, ${tone.glow}, transparent 70%), var(--ag-section-bg)`
                  : 'var(--ag-section-bg)',
                boxShadow: activeTab === key ? `0 8px 32px ${tone.glow}` : 'none',
                minWidth: '130px',
              }}
            >
              <span className="text-2xl">{label}</span>
              <p className="mt-2 text-[13px] font-semibold" style={{ color: activeTab === key ? tone.accent : 'var(--ag-title)' }}>
                {fullLabel}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--ag-muted)]">{desc}</p>
            </button>
          );
        })}
      </div>

      {/* ═══ USERS TAB ════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className={`${SECTION} p-5`}>
            <h3 className="text-[22px] font-light text-[var(--ag-title)]">User Accounts</h3>
            <p className="mt-1 text-sm text-[var(--ag-muted)]">View registered users on the platform.</p>
          </div>
          <div className={`${PANEL} p-5`}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className={INPUT + ' sm:max-w-xs'}
                placeholder="Search by username or email…"
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
              />
            </div>
            {usersLoading ? (
              <p className="text-sm text-[var(--ag-muted)]">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--ag-border)]">
                      {['Username', 'Email', 'KYC', 'Balance', 'Status', 'Joined'].map(h => (
                        <th key={h} className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ag-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-[var(--ag-border)]/40 hover:bg-[var(--ag-section-bg)] transition-colors">
                        <td className="py-3 pr-4 font-medium text-[var(--ag-title)]">{u.username}</td>
                        <td className="py-3 pr-4 text-[var(--ag-muted)]">{u.email}</td>
                        <td className="py-3 pr-4"><KycBadge status={u.kycStatus} /></td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[var(--ag-title)]">${(u.demo_balance || 0).toFixed(2)}</span>
                            {perms.includes('manage_balance') && (
                              <button
                                title="Edit balance"
                                className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/25 transition-all"
                                onClick={() => { setBalanceModal(u); setBalanceAmount(''); setBalanceReason(''); }}
                              >✏️ Edit</button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          {u.isBanned
                            ? <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">Banned</span>
                            : <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-400">Active</span>
                          }
                        </td>
                        <td className="py-3 pr-4 text-[var(--ag-muted)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-sm text-[var(--ag-muted)]">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {userPagination.pages > 1 && (
              <div className="mt-4 flex items-center gap-3">
                <button className={BTN} disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>← Prev</button>
                <span className="text-sm text-[var(--ag-muted)]">Page {userPage} / {userPagination.pages}</span>
                <button className={BTN} disabled={userPage >= userPagination.pages} onClick={() => setUserPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ KYC TAB ══════════════════════════════════════════════════════════ */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          <div className={`${SECTION} p-5`}>
            <h3 className="text-[22px] font-light text-[var(--ag-title)]">KYC Review</h3>
            <p className="mt-1 text-sm text-[var(--ag-muted)]">Approve or reject identity verification requests.</p>
          </div>
          {kycModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-[28px] bg-[var(--ag-panel)] border border-[var(--ag-border)] p-6 shadow-2xl space-y-4">
                <h3 className="text-lg font-semibold text-[var(--ag-title)]">Review KYC</h3>
                <div className="rounded-[18px] bg-[var(--ag-section-bg)] p-4 text-sm space-y-1 text-[var(--ag-muted)]">
                  <p><span className="font-medium text-[var(--ag-title)]">Name:</span> {kycModal.firstName} {kycModal.lastName}</p>
                  <p><span className="font-medium text-[var(--ag-title)]">Username:</span> {kycModal.username}</p>
                  <p><span className="font-medium text-[var(--ag-title)]">Email:</span> {kycModal.email}</p>
                  <p><span className="font-medium text-[var(--ag-title)]">Mobile:</span> {kycModal.mobile || '—'}</p>
                  <p><span className="font-medium text-[var(--ag-title)]">Address:</span> {[kycModal.address, kycModal.city, kycModal.state, kycModal.country].filter(Boolean).join(', ') || '—'}</p>
                  <p><span className="font-medium text-[var(--ag-title)]">Status:</span> <KycBadge status={kycModal.kycStatus} /></p>
                </div>
                <div className="flex gap-3">
                  <button className={BTN + ' flex-1'} onClick={() => setKycModal(null)} disabled={kycModalLoading}>Cancel</button>
                  <button
                    onClick={() => handleKycReview('rejected')}
                    disabled={kycModalLoading}
                    className="flex-1 rounded-full py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-40"
                  >Reject</button>
                  <button
                    onClick={() => handleKycReview('verified')}
                    disabled={kycModalLoading}
                    className="flex-1 rounded-full py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 transition-all disabled:opacity-40"
                  >{kycModalLoading ? '…' : 'Approve'}</button>
                </div>
              </div>
            </div>
          )}
          <div className={`${PANEL} p-5`}>
            {kycLoading ? (
              <p className="text-sm text-[var(--ag-muted)]">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--ag-border)]">
                      {['User', 'Name', 'KYC Status', 'Submitted', 'Action'].map(h => (
                        <th key={h} className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ag-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kycUsers.map(u => (
                      <tr key={u._id} className="border-b border-[var(--ag-border)]/40 hover:bg-[var(--ag-section-bg)] transition-colors">
                        <td className="py-3 pr-4 font-medium text-[var(--ag-title)]">{u.username}<br /><span className="text-[11px] text-[var(--ag-muted)]">{u.email}</span></td>
                        <td className="py-3 pr-4 text-[var(--ag-muted)]">{u.firstName} {u.lastName}</td>
                        <td className="py-3 pr-4"><KycBadge status={u.kycStatus} /></td>
                        <td className="py-3 pr-4 text-[var(--ag-muted)]">{u.kycSubmittedAt ? new Date(u.kycSubmittedAt).toLocaleDateString() : '—'}</td>
                        <td className="py-3 pr-4">
                          {u.kycStatus === 'pending' && (
                            <button className={BTN} onClick={() => setKycModal(u)}>Review</button>
                          )}
                          {u.kycStatus !== 'pending' && (
                            <span className="text-[11px] text-[var(--ag-muted)]">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {kycUsers.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-sm text-[var(--ag-muted)]">No KYC submissions yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TRADES (FORCE WIN/LOSE) TAB ══════════════════════════════════════ */}
      {activeTab === 'trades' && (
        <div className="space-y-4">
          <div className={`${SECTION} p-5`}>
            <h3 className="text-[22px] font-light text-[var(--ag-title)]">Force Trade Mode</h3>
            <p className="mt-1 text-sm text-[var(--ag-muted)]">Set forced win or forced loss per user for binary trades.</p>
          </div>
          <div className={`${PANEL} p-5`}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className={INPUT + ' sm:max-w-xs'}
                placeholder="Search users…"
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
              />
            </div>
            {usersLoading ? (
              <p className="text-sm text-[var(--ag-muted)]">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--ag-border)]">
                      {['User', 'Email', 'Current Mode', 'Action'].map(h => (
                        <th key={h} className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ag-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-[var(--ag-border)]/40 hover:bg-[var(--ag-section-bg)] transition-colors">
                        <td className="py-3 pr-4 font-medium text-[var(--ag-title)]">{u.username}</td>
                        <td className="py-3 pr-4 text-[var(--ag-muted)]">{u.email}</td>
                        <td className="py-3 pr-4">
                          {u.tradeMode === 'win'
                            ? <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-400">Force Win</span>
                            : <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">Force Loss</span>
                          }
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-2">
                            <button
                              className="rounded-full bg-green-500/10 border border-green-500/30 px-3 py-1.5 text-[11px] font-semibold text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-40"
                              disabled={u.tradeMode === 'win' || tradeModeLoading[u._id]}
                              onClick={() => handleTradeMode(u._id, 'win')}
                            >Force Win</button>
                            <button
                              className="rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
                              disabled={u.tradeMode === 'loss' || tradeModeLoading[u._id]}
                              onClick={() => handleTradeMode(u._id, 'loss')}
                            >Force Loss</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-sm text-[var(--ag-muted)]">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {userPagination.pages > 1 && (
              <div className="mt-4 flex items-center gap-3">
                <button className={BTN} disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>← Prev</button>
                <span className="text-sm text-[var(--ag-muted)]">Page {userPage} / {userPagination.pages}</span>
                <button className={BTN} disabled={userPage >= userPagination.pages} onClick={() => setUserPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ DEPOSITS TAB ═════════════════════════════════════════════════════ */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className={`${SECTION} p-5`}>
            <h3 className="text-[22px] font-light text-[var(--ag-title)]">Deposit Requests</h3>
            <p className="mt-1 text-sm text-[var(--ag-muted)]">Review and approve or reject user deposit vouchers.</p>
          </div>
          {depositModal && (
            <ReviewModal
              item={depositModal}
              type="Deposit"
              onClose={() => setDepositModal(null)}
              onConfirm={handleDepositReview}
              loading={depositModalLoading}
            />
          )}
          <div className={`${PANEL} p-5`}>
            <div className="mb-4 flex flex-wrap gap-3">
              {['', 'pending', 'approved', 'rejected'].map(s => (
                <button
                  key={s || 'all'}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${depositFilter === s ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]' : `${BTN}`}`}
                  onClick={() => { setDepositFilter(s); setDepositPage(1); }}
                >{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}</button>
              ))}
            </div>
            {depositsLoading ? (
              <p className="text-sm text-[var(--ag-muted)]">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--ag-border)]">
                      {['User', 'Amount', 'Coin/Network', 'Status', 'Submitted', 'Action'].map(h => (
                        <th key={h} className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ag-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map(d => (
                      <tr key={d._id} className="border-b border-[var(--ag-border)]/40 hover:bg-[var(--ag-section-bg)] transition-colors">
                        <td className="py-3 pr-4 font-medium text-[var(--ag-title)]">{d.user?.username || '—'}<br /><span className="text-[11px] text-[var(--ag-muted)]">{d.user?.email}</span></td>
                        <td className="py-3 pr-4 font-mono text-[var(--ag-title)]">${d.amount}</td>
                        <td className="py-3 pr-4 text-[var(--ag-muted)]">{d.coin} / {d.network}</td>
                        <td className="py-3 pr-4"><StatusBadge status={d.status} /></td>
                        <td className="py-3 pr-4 text-[var(--ag-muted)]">{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pr-4">
                          {d.status === 'pending'
                            ? <button className={BTN} onClick={() => setDepositModal(d)}>Review</button>
                            : <span className="text-[11px] text-[var(--ag-muted)]">Reviewed</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {deposits.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-sm text-[var(--ag-muted)]">No deposit requests found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {depositPagination.pages > 1 && (
              <div className="mt-4 flex items-center gap-3">
                <button className={BTN} disabled={depositPage <= 1} onClick={() => setDepositPage(p => p - 1)}>← Prev</button>
                <span className="text-sm text-[var(--ag-muted)]">Page {depositPage} / {depositPagination.pages}</span>
                <button className={BTN} disabled={depositPage >= depositPagination.pages} onClick={() => setDepositPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ WITHDRAWALS TAB ══════════════════════════════════════════════════ */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className={`${SECTION} p-5`}>
            <h3 className="text-[22px] font-light text-[var(--ag-title)]">Withdrawal Requests</h3>
            <p className="mt-1 text-sm text-[var(--ag-muted)]">Approve payouts or reject and refund users.</p>
          </div>
          {withdrawModal && (
            <ReviewModal
              item={withdrawModal}
              type="Withdrawal"
              onClose={() => setWithdrawModal(null)}
              onConfirm={handleWithdrawReview}
              loading={withdrawModalLoading}
            />
          )}
          <div className={`${PANEL} p-5`}>
            <div className="mb-4 flex flex-wrap gap-3">
              {['', 'pending', 'approved', 'rejected'].map(s => (
                <button
                  key={s || 'all'}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${withdrawFilter === s ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]' : `${BTN}`}`}
                  onClick={() => { setWithdrawFilter(s); setWithdrawPage(1); }}
                >{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}</button>
              ))}
            </div>
            {withdrawalsLoading ? (
              <p className="text-sm text-[var(--ag-muted)]">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--ag-border)]">
                      {['User', 'Amount', 'Address', 'Status', 'Submitted', 'Action'].map(h => (
                        <th key={h} className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ag-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map(w => (
                      <tr key={w._id} className="border-b border-[var(--ag-border)]/40 hover:bg-[var(--ag-section-bg)] transition-colors">
                        <td className="py-3 pr-4 font-medium text-[var(--ag-title)]">{w.user?.username || '—'}<br /><span className="text-[11px] text-[var(--ag-muted)]">{w.user?.email}</span></td>
                        <td className="py-3 pr-4 font-mono text-[var(--ag-title)]">${w.amount}</td>
                        <td className="py-3 pr-4 text-[var(--ag-muted)] max-w-[150px] truncate">{w.address || '—'}</td>
                        <td className="py-3 pr-4"><StatusBadge status={w.status} /></td>
                        <td className="py-3 pr-4 text-[var(--ag-muted)]">{new Date(w.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pr-4">
                          {w.status === 'pending'
                            ? <button className={BTN} onClick={() => setWithdrawModal(w)}>Review</button>
                            : <span className="text-[11px] text-[var(--ag-muted)]">Reviewed</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {withdrawals.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-sm text-[var(--ag-muted)]">No withdrawal requests found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {withdrawPagination.pages > 1 && (
              <div className="mt-4 flex items-center gap-3">
                <button className={BTN} disabled={withdrawPage <= 1} onClick={() => setWithdrawPage(p => p - 1)}>← Prev</button>
                <span className="text-sm text-[var(--ag-muted)]">Page {withdrawPage} / {withdrawPagination.pages}</span>
                <button className={BTN} disabled={withdrawPage >= withdrawPagination.pages} onClick={() => setWithdrawPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ BALANCE TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'balance' && (
        <div className="space-y-4">
          <div className={`${SECTION} p-5`}>
            <h3 className="text-[22px] font-light text-[var(--ag-title)]">Edit User Balance</h3>
            <p className="mt-1 text-sm text-[var(--ag-muted)]">Credit or debit a customer's USDT balance. Use a negative amount to debit.</p>
          </div>

          <div className={`${PANEL} p-5`}>
            <div className="mb-4">
              <input
                className={INPUT + ' sm:max-w-xs'}
                placeholder="Search by username or email…"
                value={balanceSearch}
                onChange={e => { setBalanceSearch(e.target.value); setBalancePage(1); }}
              />
            </div>
            {balanceUsersLoading ? (
              <p className="text-sm text-[var(--ag-muted)]">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--ag-border)]">
                      {['Username', 'Email', 'Balance (USDT)', 'Status', 'Action'].map(h => (
                        <th key={h} className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ag-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {balanceUsers.map(u => (
                      <tr key={u._id} className="border-b border-[var(--ag-border)]/40 hover:bg-[var(--ag-section-bg)] transition-colors">
                        <td className="py-3 pr-4 font-medium text-[var(--ag-title)]">{u.username}</td>
                        <td className="py-3 pr-4 text-[var(--ag-muted)]">{u.email}</td>
                        <td className="py-3 pr-4 font-mono text-amber-400">${(u.demo_balance || 0).toFixed(2)}</td>
                        <td className="py-3 pr-4">
                          {u.isBanned
                            ? <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">Banned</span>
                            : <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-400">Active</span>
                          }
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/20 transition-all"
                            onClick={() => { setBalanceModal(u); setBalanceAmount(''); setBalanceReason(''); }}
                          >Edit Balance</button>
                        </td>
                      </tr>
                    ))}
                    {balanceUsers.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-sm text-[var(--ag-muted)]">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {balancePagination.pages > 1 && (
              <div className="mt-4 flex items-center gap-3">
                <button className={BTN} disabled={balancePage <= 1} onClick={() => setBalancePage(p => p - 1)}>← Prev</button>
                <span className="text-sm text-[var(--ag-muted)]">Page {balancePage} / {balancePagination.pages}</span>
                <button className={BTN} disabled={balancePage >= balancePagination.pages} onClick={() => setBalancePage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ BALANCE MODAL — rendered outside tabs so works from any tab ══════ */}
      {balanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[28px] bg-[var(--ag-panel)] border border-[var(--ag-border)] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-[var(--ag-title)]">Edit Balance</h3>
            <div className="rounded-[18px] bg-[var(--ag-section-bg)] p-4 text-sm space-y-1 text-[var(--ag-muted)]">
              <p><span className="font-medium text-[var(--ag-title)]">User:</span> {balanceModal.username}</p>
              <p><span className="font-medium text-[var(--ag-title)]">Email:</span> {balanceModal.email}</p>
              <p><span className="font-medium text-[var(--ag-title)]">Current Balance:</span> <span className="font-mono text-amber-400">${(balanceModal.demo_balance || 0).toFixed(2)}</span></p>
            </div>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Amount (USDT) — negative to debit</label>
                <input
                  type="number"
                  className={INPUT}
                  placeholder="e.g. 100 or -50"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                />
                {balanceAmount && !isNaN(parseFloat(balanceAmount)) && parseFloat(balanceAmount) !== 0 && (
                  <p className="mt-1 text-[11px] text-[var(--ag-muted)]">
                    New balance: <span className="font-mono text-amber-400">${Math.max(0, (balanceModal.demo_balance || 0) + parseFloat(balanceAmount)).toFixed(2)}</span>
                  </p>
                )}
              </div>
              <div>
                <label className={LABEL}>Reason (optional)</label>
                <input
                  type="text"
                  className={INPUT}
                  placeholder="e.g. Bonus credit, manual correction…"
                  value={balanceReason}
                  onChange={e => setBalanceReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                className={BTN + ' flex-1'}
                onClick={() => { setBalanceModal(null); setBalanceAmount(''); setBalanceReason(''); }}
                disabled={balanceModalLoading}
              >Cancel</button>
              <button
                onClick={handleModifyBalance}
                disabled={balanceModalLoading || !balanceAmount || isNaN(parseFloat(balanceAmount)) || parseFloat(balanceAmount) === 0}
                className="flex flex-1 items-center justify-center rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(245,158,11,0.3)] transition-all hover:-translate-y-0.5 hover:bg-amber-600 disabled:opacity-40"
              >
                {balanceModalLoading
                  ? 'Saving…'
                  : parseFloat(balanceAmount) >= 0
                    ? `Credit $${Math.abs(parseFloat(balanceAmount) || 0).toFixed(2)}`
                    : `Debit $${Math.abs(parseFloat(balanceAmount) || 0).toFixed(2)}`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
