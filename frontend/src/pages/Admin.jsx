import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminAPI, adminDepositAPI, adminWithdrawAPI, settingsAPI, profileAPI, planPurchaseAPI, binaryAPI, marketAPI } from '../services/api';
import { SkeletonCard, SkeletonTable } from '../components/SkeletonCard';

const ADMIN_PANEL =
  'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';
const ADMIN_BUTTON =
  'rounded-full border border-[#d6e2e4] bg-white px-4 py-2 text-xs font-semibold text-[#506d72] transition-all hover:-translate-y-0.5 disabled:opacity-40';
const ADMIN_INPUT =
  'input-field rounded-[22px] border-[#d7e4e5] bg-[#f7fbfb]';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Balance modifier modal state
  const [balanceModal, setBalanceModal] = useState(null); // { user }
  const [balanceCoin, setBalanceCoin] = useState('USDT');
  const [balanceCoinAmount, setBalanceCoinAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [coinPrices, setCoinPrices] = useState({});

  // Site settings state
  const [siteSettings, setSiteSettings] = useState({ telegram_link: '', telegram_username: '', support_email: '' });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // KYC state
  const [kycUsers, setKycUsers] = useState([]);
  const [kycLoading, setKycLoading] = useState(false);

  // Deposit addresses state
  const [depositAddresses, setDepositAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState({ coin: 'USDT', network: 'TRC20', address: '', minDeposit: 10, note: '' });
  const [editingAddr, setEditingAddr] = useState(null); // address object being edited
  const [addrLoading, setAddrLoading] = useState(false);

  // Deposit requests state
  const [depositRequests, setDepositRequests] = useState([]);
  const [depositReqPage, setDepositReqPage] = useState(1);
  const [depositReqPagination, setDepositReqPagination] = useState({});
  const [depositReqStatus, setDepositReqStatus] = useState('');
  const [reviewModal, setReviewModal] = useState(null); // { request, action }
  const [reviewNote, setReviewNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Withdraw requests state
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [withdrawReqPage, setWithdrawReqPage] = useState(1);
  const [withdrawReqPagination, setWithdrawReqPagination] = useState({});
  const [withdrawReqStatus, setWithdrawReqStatus] = useState('');
  const [withdrawReviewModal, setWithdrawReviewModal] = useState(null);
  const [withdrawReviewNote, setWithdrawReviewNote] = useState('');
  const [withdrawReviewLoading, setWithdrawReviewLoading] = useState(false);

  // Plan purchases state
  const [planPurchases, setPlanPurchases] = useState([]);
  const [planRevenue, setPlanRevenue] = useState(0);
  const [planPurchasesLoading, setPlanPurchasesLoading] = useState(false);

  // Binary trade settings state
  const [binarySettings, setBinarySettings] = useState({
    tradingEnabled: true, maintenanceMode: false, demoModeEnabled: false,
    payoutRate: 0.85, minTradeAmount: 1, maxTradeAmount: 1000,
    expiryTimes: [20, 30, 60, 90, 180],
    availablePairs: ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE'],
    drawBehavior: 'return_amount',
    forceResultMode: 'market',
    forceWinRates: { '20': 0.10, '30': 0.20, '60': 0.30, '90': 0.50, '180': 0.70 },
  });
  const [binarySettingsSaving, setBinarySettingsSaving] = useState(false);
  const [binaryTrades, setBinaryTrades] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await adminAPI.getStats();
      setStats(data);
    } catch { toast.error('Failed to load stats'); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers(page, search);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search]);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getTrades(page);
      setTrades(data.trades);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load trades'); }
    finally { setLoading(false); }
  }, [page]);

  const fetchSiteSettings = useCallback(async () => {
    try {
      const { data } = await settingsAPI.getAll();
      setSiteSettings(s => ({ ...s, ...data }));
    } catch {}
  }, []);

  const fetchKycUsers = useCallback(async () => {
    setKycLoading(true);
    try {
      const { data } = await adminAPI.getUsers(1, '');
      setKycUsers((data.users || []).filter(u => u.kycStatus && u.kycStatus !== 'unverified'));
    } catch {}
    finally { setKycLoading(false); }
  }, []);

  const fetchDepositAddresses = useCallback(async () => {
    try {
      const { data } = await adminDepositAPI.getAddresses();
      setDepositAddresses(data.addresses || []);
    } catch { toast.error('Failed to load deposit addresses'); }
  }, []);

  const fetchDepositRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminDepositAPI.getRequests(depositReqPage, depositReqStatus);
      setDepositRequests(data.requests || []);
      setDepositReqPagination(data.pagination || {});
    } catch { toast.error('Failed to load deposit requests'); }
    finally { setLoading(false); }
  }, [depositReqPage, depositReqStatus]);

  const fetchWithdrawRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminWithdrawAPI.getRequests(withdrawReqPage, withdrawReqStatus);
      setWithdrawRequests(data.requests || []);
      setWithdrawReqPagination(data.pagination || {});
    } catch { toast.error('Failed to load withdraw requests'); }
    finally { setLoading(false); }
  }, [withdrawReqPage, withdrawReqStatus]);

  const fetchPlanPurchases = useCallback(async () => {
    setPlanPurchasesLoading(true);
    try {
      const { data } = await planPurchaseAPI.getAll();
      setPlanPurchases(data.purchases || []);
      setPlanRevenue(data.totalRevenue || 0);
    } catch { toast.error('Failed to load plan purchases'); }
    finally { setPlanPurchasesLoading(false); }
  }, []);

  const fetchBinarySettings = useCallback(async () => {
    try {
      const { data } = await binaryAPI.adminGetSettings();
      setBinarySettings(data);
    } catch {}
  }, []);

  const fetchBinaryTrades = useCallback(async () => {
    try {
      const { data } = await binaryAPI.adminGetTrades(1);
      setBinaryTrades(data.trades || []);
    } catch {}
  }, []);

  const handleSaveBinarySettings = async () => {
    setBinarySettingsSaving(true);
    try {
      await binaryAPI.adminUpdateSettings(binarySettings);
      toast.success('Binary trade settings saved!');
    } catch { toast.error('Failed to save settings'); }
    finally { setBinarySettingsSaving(false); }
  };

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'trades') fetchTrades();
    if (activeTab === 'overview') setLoading(false);
    if (activeTab === 'deposit-addr') fetchDepositAddresses();
    if (activeTab === 'deposit-req') fetchDepositRequests();
    if (activeTab === 'settings') fetchSiteSettings();
    if (activeTab === 'kyc') fetchKycUsers();
    if (activeTab === 'plans') fetchPlanPurchases();
    if (activeTab === 'binary') { fetchBinarySettings(); fetchBinaryTrades(); }
    if (activeTab === 'withdrawals') fetchWithdrawRequests();
  }, [activeTab, page, fetchUsers, fetchTrades, fetchDepositAddresses, fetchDepositRequests, fetchPlanPurchases, fetchWithdrawRequests]);

  useEffect(() => {
    if (activeTab === 'deposit-req') fetchDepositRequests();
  }, [depositReqPage, depositReqStatus, fetchDepositRequests]);

  useEffect(() => {
    if (activeTab === 'withdrawals') fetchWithdrawRequests();
  }, [withdrawReqPage, withdrawReqStatus, fetchWithdrawRequests]);

  const getUsdtEquivalent = () => {
    const amt = parseFloat(balanceCoinAmount);
    if (isNaN(amt)) return 0;
    if (balanceCoin === 'USDT') return amt;
    const price = coinPrices[balanceCoin]?.price || 0;
    return amt * price;
  };

  const handleModifyBalance = async () => {
    if (!balanceCoinAmount) return toast.error('Enter an amount');
    const usdtAmount = getUsdtEquivalent();
    if (usdtAmount === 0) return toast.error('Invalid amount or coin price unavailable');
    setModalLoading(true);
    try {
      const reason = balanceReason || `Admin credit via ${balanceCoin}${balanceCoin !== 'USDT' ? ` (${balanceCoinAmount} ${balanceCoin} @ $${(coinPrices[balanceCoin]?.price || 0).toFixed(2)})` : ''}`;
      const { data } = await adminAPI.modifyBalance(balanceModal.user._id, usdtAmount, reason);
      toast.success(data.message);
      setBalanceModal(null);
      setBalanceCoin('USDT');
      setBalanceCoinAmount('');
      setBalanceReason('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to modify balance');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSetRole = async (userId, role) => {
    try {
      const { data } = await adminAPI.setRole(userId, role);
      toast.success(data.message);
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleSetTradeMode = async (userId, currentMode) => {
    const newMode = currentMode === 'win' ? 'loss' : 'win';
    try {
      await adminAPI.setTradeMode(userId, newMode);
      toast.success(`Trade mode set to ${newMode.toUpperCase()}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update trade mode');
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    const reason = isBanned ? '' : window.prompt('Ban reason (optional):') ?? '';
    if (!isBanned && reason === null) return; // cancelled
    try {
      const { data } = await adminAPI.banUser(userId, !isBanned, reason);
      toast.success(data.message);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update ban status');
    }
  };

  const handleWithdrawReview = async () => {
    if (!withdrawReviewModal) return;
    setWithdrawReviewLoading(true);
    try {
      if (withdrawReviewModal.action === 'approve') {
        await adminWithdrawAPI.approve(withdrawReviewModal.request._id, withdrawReviewNote);
        toast.success('Withdrawal approved');
      } else {
        await adminWithdrawAPI.reject(withdrawReviewModal.request._id, withdrawReviewNote);
        toast.success('Withdrawal rejected — balance refunded');
      }
      setWithdrawReviewModal(null);
      setWithdrawReviewNote('');
      fetchWithdrawRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally { setWithdrawReviewLoading(false); }
  };

  const handleSaveSetting = async (key) => {
    setSettingsSaving(true);
    try {
      await settingsAPI.save(key, siteSettings[key]);
      toast.success('Setting saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSettingsSaving(false); }
  };

  const handleSaveAllSettings = async () => {
    setSettingsSaving(true);
    try {
      await Promise.all([
        settingsAPI.save('telegram_link', siteSettings.telegram_link),
        settingsAPI.save('telegram_username', siteSettings.telegram_username),
        settingsAPI.save('support_email', siteSettings.support_email),
      ]);
      toast.success('All settings saved!');
    } catch { toast.error('Failed to save settings'); }
    finally { setSettingsSaving(false); }
  };

  const handleKycReview = async (userId, status) => {
    try {
      await profileAPI.reviewKyc(userId, status);
      toast.success(`KYC ${status}`);
      fetchKycUsers();
    } catch { toast.error('Failed to update KYC'); }
  };

  const handleSaveAddress = async () => {
    if (!addrForm.coin || !addrForm.network || !addrForm.address) {
      return toast.error('Coin, network, and address are required');
    }
    setAddrLoading(true);
    try {
      if (editingAddr) {
        await adminDepositAPI.updateAddress(editingAddr._id, addrForm);
        toast.success('Address updated');
        setEditingAddr(null);
      } else {
        await adminDepositAPI.addAddress(addrForm);
        toast.success('Address added');
      }
      setAddrForm({ coin: 'USDT', network: 'TRC20', address: '', minDeposit: 10, note: '' });
      fetchDepositAddresses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save address');
    } finally { setAddrLoading(false); }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Delete this deposit address?')) return;
    try {
      await adminDepositAPI.deleteAddress(id);
      toast.success('Address deleted');
      fetchDepositAddresses();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleAddress = async (addr) => {
    try {
      await adminDepositAPI.updateAddress(addr._id, { isActive: !addr.isActive });
      toast.success(addr.isActive ? 'Address disabled' : 'Address enabled');
      fetchDepositAddresses();
    } catch { toast.error('Failed to update'); }
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    setReviewLoading(true);
    try {
      if (reviewModal.action === 'approve') {
        await adminDepositAPI.approve(reviewModal.request._id, reviewNote);
        toast.success('Deposit approved — user balance updated');
      } else {
        await adminDepositAPI.reject(reviewModal.request._id, reviewNote);
        toast.success('Deposit rejected');
      }
      setReviewModal(null);
      setReviewNote('');
      fetchDepositRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to review deposit');
    } finally { setReviewLoading(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDateTime = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const STATUS_CONFIG = {
    pending:  { label: 'Pending',  cls: 'bg-yellow-500/10 text-yellow-400' },
    approved: { label: 'Approved', cls: 'bg-green-trade/10 text-green-trade' },
    rejected: { label: 'Rejected', cls: 'bg-red-trade/10 text-red-trade' },
  };

  const TABS = [
    { key: 'overview',     label: '📊', fullLabel: 'Overview' },
    { key: 'users',        label: '👥', fullLabel: 'Users' },
    { key: 'kyc',          label: '🪪', fullLabel: 'KYC' },
    { key: 'trades',       label: '📈', fullLabel: 'Trades' },
    { key: 'binary',       label: '⚡', fullLabel: 'Binary' },
    { key: 'deposit-addr', label: '💳', fullLabel: 'Addresses' },
    { key: 'deposit-req',  label: '📥', fullLabel: 'Deposits' },
    { key: 'withdrawals',  label: '💸', fullLabel: 'Withdrawals' },
    { key: 'plans',        label: '🚀', fullLabel: 'Plans' },
    { key: 'settings',     label: '⚙️', fullLabel: 'Settings' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0b2026_0%,#114850_50%,#1a6d71_100%)] px-6 py-7 text-white shadow-[0_30px_90px_rgba(8,32,38,0.28)] md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#97e4e5]">
              Restricted Console
            </span>
            <h2 className="mt-4 text-[36px] font-light leading-[1.04] tracking-[-0.03em] md:text-[48px]">
              Control the platform with the same premium shell.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/68 md:text-base">
              Admin tools now sit inside the same CTA, spacing and panel system as the public product instead of a plain utility screen.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[500px]">
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Users</p>
              <p className="mt-2 text-[28px] font-semibold text-white">{stats?.stats?.totalUsers?.toLocaleString?.() || '—'}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Trades</p>
              <p className="mt-2 text-[28px] font-semibold text-white">{stats?.stats?.totalTrades?.toLocaleString?.() || '—'}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Access</p>
              <p className="mt-2 text-[28px] font-semibold text-white">Admin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex w-max min-w-full gap-2 rounded-[28px] border border-[#d9e6e7] bg-white p-2 shadow-[0_18px_50px_rgba(8,35,41,0.07)] sm:w-fit">
          {TABS.map(({ key, label, fullLabel }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap rounded-[22px] px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === key
                  ? 'bg-[#ee8267] text-white shadow-[0_12px_28px_rgba(238,130,103,0.22)]'
                  : 'text-text-secondary hover:-translate-y-0.5 hover:bg-[#f7fbfb] hover:text-text-primary'
              }`}
            >
              <span className="sm:hidden">{label}</span>
              <span className="hidden sm:inline">{label} {fullLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat cards */}
          {!stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`${ADMIN_PANEL} p-6`}>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Users</p>
                <p className="text-[34px] font-semibold text-[#0d2127]">{stats.stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className={`${ADMIN_PANEL} p-6`}>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Trades</p>
                <p className="text-[34px] font-semibold text-brand-primary">{stats.stats.totalTrades.toLocaleString()}</p>
              </div>
              <div className={`${ADMIN_PANEL} p-6`}>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Volume</p>
                <p className="text-[34px] font-semibold text-green-trade">${stats.stats.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          )}

          {/* Recent trades */}
          {stats?.recentTrades?.length > 0 && (
            <div className={`${ADMIN_PANEL} overflow-hidden`}>
              <div className="border-b border-[#e3ecec] px-6 py-5">
                <h3 className="text-[24px] font-light tracking-[-0.03em] text-[#0d2127]">Recent Platform Trades</h3>
              </div>
              <div className="divide-y divide-light-border/50">
                {stats.recentTrades.map((t) => (
                  <div key={t._id} className="px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.type === 'buy' ? 'bg-green-trade/10 text-green-trade' : 'bg-red-trade/10 text-red-trade'}`}>
                      {t.type.toUpperCase()}
                    </span>
                    <span className="text-text-primary font-medium">{t.user?.username || 'Unknown'}</span>
                    <span className="text-text-secondary">{t.coin}/USDT</span>
                    <span className="text-text-secondary">{t.coinAmount.toFixed(6)} @ ${t.pricePerCoin.toLocaleString()}</span>
                    <span className="ml-auto text-text-muted text-xs">{formatDate(t.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Users Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search */}
          <div className={`${ADMIN_PANEL} max-w-sm p-4`}>
            <input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={ADMIN_INPUT}
            />
          </div>

          {loading ? <SkeletonTable rows={6} /> : (
            <div className={`${ADMIN_PANEL} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-light-border bg-[#f7fbfb] text-xs uppercase tracking-wider text-text-muted">
                      <th className="px-5 py-3 text-left">User</th>
                      <th className="px-5 py-3 text-right">Balance</th>
                      <th className="px-5 py-3 text-center">Role</th>
                      <th className="px-5 py-3 text-right">Joined</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className={`border-b border-light-border/50 transition-colors hover:bg-[#f6fbfb] ${u.isBanned ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${u.isBanned ? 'bg-red-trade/20 text-red-trade' : 'bg-brand-primary/10 text-brand-primary'}`}>
                              {u.isBanned ? '🚫' : u.username[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-text-primary">{u.username}</p>
                                {u.isBanned && (
                                  <span className="text-xs bg-red-trade/20 text-red-trade px-1.5 py-0.5 rounded font-semibold">BANNED</span>
                                )}
                              </div>
                              <p className="text-xs text-text-muted">{u.email}</p>
                              {u.isBanned && u.banReason && (
                                <p className="text-xs text-red-trade/70 mt-0.5">Reason: {u.banReason}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-text-primary">
                          ${u.demo_balance.toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.role === 'admin'
                              ? 'bg-red-trade/10 text-red-trade'
                              : 'bg-light-border text-text-secondary'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-xs text-text-muted">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {/* Modify balance */}
                            <button
                              onClick={async () => {
                                setBalanceModal({ user: u });
                                setBalanceCoin('USDT');
                                setBalanceCoinAmount('');
                                setBalanceReason('');
                                try {
                                  const { data } = await marketAPI.getPrices();
                                  setCoinPrices(data.prices || data || {});
                                } catch {}
                              }}
                              className="rounded-full bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary/20"
                            >
                              Balance
                            </button>
                            {/* Toggle role */}
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleSetRole(u._id, 'admin')}
                                className="rounded-full border border-light-border bg-[#f7fbfb] px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-light-border"
                              >
                                Make Admin
                              </button>
                            )}
                            {u.role === 'admin' && (
                              <button
                                onClick={() => handleSetRole(u._id, 'user')}
                                className="rounded-full border border-light-border bg-[#f7fbfb] px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-light-border"
                              >
                                Demote
                              </button>
                            )}
                            {/* Ban / Unban */}
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleBanUser(u._id, u.isBanned)}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  u.isBanned
                                  ? 'bg-green-trade/10 text-green-trade hover:bg-green-trade/20'
                                    : 'bg-red-trade/10 text-red-trade hover:bg-red-trade/20'
                                }`}
                              >
                                {u.isBanned ? '✓ Unban' : '🚫 Ban'}
                              </button>
                            )}
                            {/* Trade Mode toggle */}
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleSetTradeMode(u._id, u.tradeMode)}
                                title={u.tradeMode === 'win' ? 'Click to set LOSE mode' : 'Click to set WIN mode'}
                                className="rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
                                style={{
                                  background: u.tradeMode === 'win' ? 'rgba(14,203,129,0.15)' : 'rgba(246,70,93,0.12)',
                                  color:      u.tradeMode === 'win' ? '#0ecb81' : '#f6465d',
                                  borderColor: u.tradeMode === 'win' ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.25)',
                                }}
                              >
                                {u.tradeMode === 'win' ? '✅ WIN' : '❌ LOSE'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-text-muted">Page {pagination.page} / {pagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={ADMIN_BUTTON}>← Prev</button>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className={ADMIN_BUTTON}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Trades Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'trades' && (
        <div className="space-y-4">
          {loading ? <SkeletonTable rows={8} /> : (
            <div className={`${ADMIN_PANEL} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-light-border bg-[#f7fbfb] text-xs uppercase tracking-wider text-text-muted">
                      <th className="px-5 py-3 text-left">User</th>
                      <th className="px-5 py-3 text-center">Side</th>
                      <th className="px-5 py-3 text-left">Pair</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-right">Price</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3 text-right">P&L</th>
                      <th className="px-5 py-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t) => (
                      <tr key={t._id} className="border-b border-light-border/50 transition-colors hover:bg-[#f6fbfb]">
                        <td className="px-5 py-4 text-text-primary font-medium">{t.user?.username || '—'}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.type === 'buy' ? 'bg-green-trade/10 text-green-trade' : 'bg-red-trade/10 text-red-trade'}`}>
                            {t.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-text-primary">{t.coin}/USDT</td>
                        <td className="px-5 py-4 text-right text-text-secondary">{t.coinAmount.toFixed(6)}</td>
                        <td className="px-5 py-4 text-right text-text-primary">${t.pricePerCoin.toLocaleString()}</td>
                        <td className="px-5 py-4 text-right font-medium text-text-primary">${t.totalUsdt.toFixed(2)}</td>
                        <td className="px-5 py-4 text-right">
                          {t.type === 'sell'
                            ? <span className={t.pnl >= 0 ? 'text-green-trade' : 'text-red-trade'}>{t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}</span>
                            : <span className="text-text-muted">—</span>}
                        </td>
                        <td className="px-5 py-4 text-right text-xs text-text-muted whitespace-nowrap">{formatDate(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-text-muted">Page {pagination.page} / {pagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={ADMIN_BUTTON}>← Prev</button>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className={ADMIN_BUTTON}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KYC Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          {kycLoading ? <SkeletonTable rows={4} /> : (
            <>
              {kycUsers.length === 0 ? (
                <div className={`${ADMIN_PANEL} p-10 text-center text-text-muted`}>No KYC submissions yet.</div>
              ) : (
                kycUsers.map(u => {
                  const kycColors = { pending: 'text-yellow-400', verified: 'text-green-trade', rejected: 'text-red-trade' };
                  return (
                    <div key={u._id} className={`${ADMIN_PANEL} p-5`}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[#0d2127]">{u.username}</p>
                            <span className={`text-xs font-medium ${kycColors[u.kycStatus] || 'text-text-muted'}`}>● {u.kycStatus?.toUpperCase()}</span>
                          </div>
                          <p className="text-xs text-text-muted">{u.email}</p>
                          {u.firstName && <p className="text-sm text-text-primary">{u.firstName} {u.lastName}</p>}
                          {u.mobile && <p className="text-xs text-text-muted">📱 {u.mobile}</p>}
                          {u.country && <p className="text-xs text-text-muted">🌍 {u.city}{u.city && u.country ? ', ' : ''}{u.country}</p>}
                        </div>
                        {u.kycStatus === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleKycReview(u._id, 'verified')}
                              className="rounded-full bg-green-trade/10 px-4 py-2 text-sm font-medium text-green-trade transition-all hover:-translate-y-0.5 hover:bg-green-trade/20">
                              ✓ Verify
                            </button>
                            <button onClick={() => handleKycReview(u._id, 'rejected')}
                              className="rounded-full bg-red-trade/10 px-4 py-2 text-sm font-medium text-red-trade transition-all hover:-translate-y-0.5 hover:bg-red-trade/20">
                              ✗ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      )}

      {/* ── Withdrawals Tab ──────────────────────────────────────────────── */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Withdrawal Requests</h2>

          {/* Status filter */}
          <div className="flex gap-2">
            {['', 'pending', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => { setWithdrawReqStatus(s); setWithdrawReqPage(1); }}
                className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all ${withdrawReqStatus === s ? 'bg-[#ee8267] text-white shadow-[0_12px_28px_rgba(238,130,103,0.18)]' : 'border border-light-border/40 bg-[#f7fbfb] text-text-muted hover:-translate-y-0.5'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? <div className="text-center py-8 text-text-muted">Loading...</div> : withdrawRequests.length === 0 ? (
            <div className={`${ADMIN_PANEL} p-8 text-center text-text-muted`}>No withdrawal requests found.</div>
          ) : (
            <div className="space-y-3">
              {withdrawRequests.map(req => {
                const statusColors = { pending: 'text-brand-yellow bg-brand-yellow/10', approved: 'text-green-trade bg-green-trade/10', rejected: 'text-red-trade bg-red-trade/10' };
                return (
                  <div key={req._id} className={`${ADMIN_PANEL} p-4 space-y-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary">{req.user?.username} <span className="text-text-muted text-xs font-normal">· {req.user?.email}</span></p>
                        <p className="text-xs text-text-muted mt-0.5">{new Date(req.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-text-primary">${req.amount.toFixed(2)} {req.coin}</p>
                        <p className="text-xs text-text-muted">Net: ${req.netAmount.toFixed(2)}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[req.status]}`}>{req.status}</span>
                      </div>
                    </div>
                    <div className="space-y-1 rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-3 text-xs text-text-muted">
                      <p>Network: <span className="text-text-primary">{req.network}</span></p>
                      <div className="flex items-start gap-2">
                        <p className="font-mono break-all flex-1">Address: {req.address}</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(req.address); toast.success('Address copied!'); }}
                          className="flex-shrink-0 rounded-full bg-brand-primary/20 px-3 py-1.5 text-[10px] font-semibold text-brand-primary transition-all hover:bg-brand-primary/40"
                          title="Copy address"
                        >
                          📋 Copy
                        </button>
                      </div>
                      {req.adminNote && <p className="italic">Admin note: {req.adminNote}</p>}
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => { setWithdrawReviewModal({ request: req, action: 'approve' }); setWithdrawReviewNote(''); }}
                          className="flex-1 rounded-full bg-green-trade/15 py-2.5 text-xs font-bold text-green-trade transition-all hover:-translate-y-0.5 hover:bg-green-trade/25">✓ Approve</button>
                        <button onClick={() => { setWithdrawReviewModal({ request: req, action: 'reject' }); setWithdrawReviewNote(''); }}
                          className="flex-1 rounded-full bg-red-trade/15 py-2.5 text-xs font-bold text-red-trade transition-all hover:-translate-y-0.5 hover:bg-red-trade/25">✗ Reject</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {withdrawReqPagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setWithdrawReqPage(p => Math.max(1, p - 1))} disabled={withdrawReqPage === 1} className={ADMIN_BUTTON}>← Prev</button>
              <span className="px-3 py-1.5 text-xs text-text-muted">{withdrawReqPage}/{withdrawReqPagination.pages}</span>
              <button onClick={() => setWithdrawReqPage(p => Math.min(withdrawReqPagination.pages, p + 1))} disabled={withdrawReqPage === withdrawReqPagination.pages} className={ADMIN_BUTTON}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* ── Plan Purchases Tab ───────────────────────────────────────────── */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Revenue summary card */}
          <div className="rounded-[30px] p-6 shadow-[0_24px_80px_rgba(8,35,41,0.12)]"
            style={{ background: 'linear-gradient(135deg, #014670 0%, #0075bb 100%)' }}>
            <p className="text-white/70 text-sm">Total Plan Revenue (Master Wallet)</p>
            <p className="text-3xl font-bold text-white mt-1">
              ${planRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </p>
            <p className="text-white/60 text-xs mt-1">{planPurchases.length} total purchases</p>
          </div>

          {/* Purchases list */}
          <div className={`${ADMIN_PANEL} overflow-hidden`}>
            <div className="px-4 py-3 border-b border-light-border/40">
              <h3 className="text-sm font-semibold text-[#0d2127]">Plan Purchase History</h3>
            </div>

            {planPurchasesLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-light-border/40" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 bg-light-border/40 rounded" />
                      <div className="h-2.5 w-24 bg-light-border/30 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-light-border/40 rounded" />
                  </div>
                ))}
              </div>
            ) : planPurchases.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2">🚀</p>
                <p className="text-text-muted text-sm">No plan purchases yet</p>
              </div>
            ) : (
              <div className="divide-y divide-light-border/30">
                {planPurchases.map((p) => {
                  const planIcons = { level1: '🌱', level2: '🚀', level3: '👑', level4: '💠' };
                  return (
                    <div key={p._id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: '#0075bb22', border: '1px solid #0075bb44' }}>
                        {planIcons[p.planName] || '📊'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0d2127]">
                          {p.user?.username || 'Unknown'}
                          <span className="ml-2 text-xs font-normal text-text-muted">{p.user?.email}</span>
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {p.displayName} Plan · {p.dailyReturn}%/day · {p.duration} days
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-green-trade">+${p.price.toLocaleString()}</p>
                        <p className="text-xs text-text-muted">{formatDateTime(p.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Binary Trade Tab ─────────────────────────────────────────────── */}
      {activeTab === 'binary' && (
        <div className="space-y-4">
          {/* Trade Settings */}
          <div className={`${ADMIN_PANEL} p-5 space-y-4`}>
            <h3 className="text-[24px] font-light tracking-[-0.03em] text-[#0d2127]">⚡ Binary Trade Settings</h3>

            {/* Toggles row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'tradingEnabled',  label: 'Trading Enabled',   desc: 'Allow users to place trades' },
                { key: 'maintenanceMode', label: 'Maintenance Mode',  desc: 'Temporarily suspend trading' },
                { key: 'demoModeEnabled', label: 'Test Mode',         desc: 'Internal testing — disable for live users' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-4">
                  <div>
                    <p className="text-sm font-medium text-[#0d2127]">{label}</p>
                    <p className="text-text-muted text-xs mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setBinarySettings(s => ({ ...s, [key]: !s[key] }))}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ml-3 ${binarySettings[key] ? 'bg-green-trade' : 'bg-light-border'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${binarySettings[key] ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Numeric settings */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Payout Rate (%)</label>
                <input type="number" className={ADMIN_INPUT} min="1" max="200" step="1"
                  value={Math.round(binarySettings.payoutRate * 100)}
                  onChange={e => setBinarySettings(s => ({ ...s, payoutRate: parseFloat(e.target.value) / 100 }))}
                  placeholder="85" />
                <p className="text-xs text-text-muted mt-1">Profit on win. 85 = 85% profit</p>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Min Trade ($)</label>
                <input type="number" className={ADMIN_INPUT} min="1"
                  value={binarySettings.minTradeAmount}
                  onChange={e => setBinarySettings(s => ({ ...s, minTradeAmount: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Max Trade ($)</label>
                <input type="number" className={ADMIN_INPUT} min="1"
                  value={binarySettings.maxTradeAmount}
                  onChange={e => setBinarySettings(s => ({ ...s, maxTradeAmount: parseFloat(e.target.value) }))} />
              </div>
            </div>

            {/* Draw behavior */}
            <div>
              <label className="text-xs text-text-muted mb-1 block">Draw (Tie) Behavior</label>
              <select className={ADMIN_INPUT}
                value={binarySettings.drawBehavior}
                onChange={e => setBinarySettings(s => ({ ...s, drawBehavior: e.target.value }))}>
                <option value="return_amount">Return amount (no profit/loss)</option>
                <option value="loss">Count as loss</option>
              </select>
              <p className="text-xs text-text-muted mt-1">What happens when entry price = close price</p>
            </div>

            {/* ── Force Result Mode ─────────────────────────────── */}
            <div className="space-y-3 rounded-[24px] p-4"
              style={{
                background: binarySettings.forceResultMode === 'win'  ? 'rgba(14,203,129,0.08)'  :
                            binarySettings.forceResultMode === 'loss' ? 'rgba(246,70,93,0.08)'   :
                            '#f7fbfb',
                border: binarySettings.forceResultMode === 'win'  ? '1px solid rgba(14,203,129,0.3)'  :
                        binarySettings.forceResultMode === 'loss' ? '1px solid rgba(246,70,93,0.3)'   :
                        '1px solid #dde8e9',
              }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {binarySettings.forceResultMode === 'win'  ? '🟢' :
                   binarySettings.forceResultMode === 'loss' ? '🔴' : '⚪'}
                </span>
                <p className="text-sm font-bold text-[#0d2127]">Force Result Mode</p>
                {binarySettings.forceResultMode !== 'market' && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold animate-pulse"
                    style={{
                      background: binarySettings.forceResultMode === 'win' ? '#0ecb8130' : '#f6465d30',
                      color:      binarySettings.forceResultMode === 'win' ? '#0ecb81'   : '#f6465d',
                    }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-text-muted text-xs mb-3">
                Override market results. Applies to both Binary &amp; Forex trades.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'market', label: '📊 Market',    desc: 'Normal price-based result', color: '#848e9c' },
                  { value: 'win',    label: '✅ Force WIN',  desc: 'All trades win (fixed %)', color: '#0ecb81' },
                  { value: 'loss',   label: '❌ Force LOSE', desc: 'All trades lose 100%',      color: '#f6465d' },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => setBinarySettings(s => ({ ...s, forceResultMode: opt.value }))}
                    className="rounded-[20px] p-2.5 text-center transition-all hover:-translate-y-0.5 active:scale-95"
                    style={{
                      background: binarySettings.forceResultMode === opt.value ? `${opt.color}22` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${binarySettings.forceResultMode === opt.value ? opt.color : 'rgba(255,255,255,0.08)'}`,
                      color: binarySettings.forceResultMode === opt.value ? opt.color : '#848e9c',
                    }}>
                    <p className="font-bold text-xs">{opt.label}</p>
                    <p className="text-xs mt-0.5 opacity-70">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {/* Win profit rates */}
              {binarySettings.forceResultMode === 'win' && (
                <div className="mt-3">
                  <p className="text-xs text-text-muted mb-2 font-medium">Win Profit Rates by Duration</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { sec: '20',  label: '20s' },
                      { sec: '30',  label: '30s' },
                      { sec: '60',  label: '1m'  },
                      { sec: '90',  label: '90s' },
                      { sec: '180', label: '3m'  },
                    ].map(({ sec, label }) => (
                      <div key={sec} className="text-center">
                        <p className="text-text-muted text-xs mb-1">{label}</p>
                        <div className="flex items-center gap-0.5 overflow-hidden rounded-[18px]"
                          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(14,203,129,0.2)' }}>
                          <input
                            type="number" min="1" max="300" step="1"
                            className="w-full bg-transparent text-center text-xs text-green-400 font-bold py-1.5 outline-none"
                            value={Math.round(((binarySettings.forceWinRates || {})[sec] || 0) * 100)}
                            onChange={e => setBinarySettings(s => ({
                              ...s,
                              forceWinRates: {
                                ...(s.forceWinRates || {}),
                                [sec]: parseFloat(e.target.value) / 100,
                              },
                            }))}
                          />
                          <span className="text-xs text-text-muted pr-1.5">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-1.5">
                    💡 Example: 30s trade with $100 → wins ${Math.round(((binarySettings.forceWinRates || {})['30'] || 0.20) * 100)}
                  </p>
                </div>
              )}

              {binarySettings.forceResultMode === 'loss' && (
                <div className="mt-2 rounded-[18px] p-2.5 text-center"
                  style={{ background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.2)' }}>
                  <p className="text-red-400 text-xs font-semibold">
                    ⚠️ All trades will lose 100% of their amount
                  </p>
                </div>
              )}
            </div>

            {/* Available pairs */}
            <div>
              <label className="text-xs text-text-muted mb-2 block">Available Trading Pairs</label>
              <div className="flex flex-wrap gap-2">
                {['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'MATIC', 'LTC', 'AVAX'].map(coin => {
                  const isEnabled = (binarySettings.availablePairs || []).includes(coin);
                  return (
                    <button key={coin}
                      onClick={() => setBinarySettings(s => ({
                        ...s,
                        availablePairs: isEnabled
                          ? s.availablePairs.filter(c => c !== coin)
                          : [...(s.availablePairs || []), coin],
                      }))}
                      className={`rounded-[16px] px-3 py-1.5 text-xs font-bold transition-all ${isEnabled ? 'text-black' : 'text-text-muted'}`}
                      style={{ background: isEnabled ? '#0ecb81' : 'rgba(255,255,255,0.07)' }}>
                      {coin}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expiry times */}
            <div>
              <label className="text-xs text-text-muted mb-2 block">Available Expiry Times (seconds)</label>
              <div className="flex flex-wrap gap-2">
                {[20, 30, 60, 90, 120, 180, 300].map(t => {
                  const isEnabled = (binarySettings.expiryTimes || []).includes(t);
                  return (
                    <button key={t}
                      onClick={() => setBinarySettings(s => ({
                        ...s,
                        expiryTimes: isEnabled
                          ? s.expiryTimes.filter(x => x !== t)
                          : [...(s.expiryTimes || []), t].sort((a, b) => a - b),
                      }))}
                      className={`rounded-[16px] px-3 py-1.5 text-xs font-bold transition-all ${isEnabled ? 'text-black' : 'text-text-muted'}`}
                      style={{ background: isEnabled ? '#fcd535' : 'rgba(255,255,255,0.07)' }}>
                      {t < 60 ? `${t}s` : `${t/60}m`}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleSaveBinarySettings} disabled={binarySettingsSaving}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#ee8267] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a]">
              {binarySettingsSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save Binary Settings
            </button>
          </div>

          {/* Recent binary trades */}
          <div className={`${ADMIN_PANEL} p-5`}>
            <h3 className="mb-3 text-[24px] font-light tracking-[-0.03em] text-[#0d2127]">Recent Binary Trades</h3>
            {binaryTrades.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-6">No trades yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-text-muted border-b border-light-border">
                      <th className="text-left py-2 pr-3">User</th>
                      <th className="text-left py-2 pr-3">Pair</th>
                      <th className="text-left py-2 pr-3">Dir</th>
                      <th className="text-right py-2 pr-3">Amount</th>
                      <th className="text-right py-2 pr-3">Profit</th>
                      <th className="text-center py-2 pr-3">Status</th>
                      <th className="text-right py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-border/30">
                    {binaryTrades.map(t => (
                      <tr key={t._id}>
                        <td className="py-2 pr-3 text-[#0d2127]">{t.user?.username || '—'}</td>
                        <td className="py-2 pr-3 font-semibold text-[#0d2127]">{t.coin}/USDT</td>
                        <td className="py-2 pr-3">
                          <span className={t.direction === 'up' ? 'text-green-trade' : 'text-red-trade'}>
                            {t.direction === 'up' ? '▲' : '▼'} {t.direction}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right text-[#0d2127]">${t.amount?.toFixed(2)}</td>
                        <td className="py-2 pr-3 text-right">
                          <span className={t.status === 'won' ? 'text-green-trade' : t.status === 'lost' ? 'text-red-trade' : 'text-yellow-400'}>
                            {t.status === 'won' ? `+$${t.profit?.toFixed(2)}` : t.status === 'lost' ? `-$${t.amount?.toFixed(2)}` : '—'}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            t.status === 'won' ? 'bg-green-trade/10 text-green-trade' :
                            t.status === 'lost' ? 'bg-red-trade/10 text-red-trade' :
                            'bg-yellow-500/10 text-yellow-400'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2 text-right text-text-muted">
                          {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Settings Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className={`${ADMIN_PANEL} space-y-5 p-5`}>
            <h3 className="text-[24px] font-light tracking-[-0.03em] text-[#0d2127]">📞 Support Contacts</h3>
            <p className="text-xs text-text-muted -mt-3">These appear on the Customer Service page.</p>

            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Telegram Link (full URL)</label>
              <input className={ADMIN_INPUT} placeholder="https://t.me/yourchannel"
                value={siteSettings.telegram_link}
                onChange={e => setSiteSettings(s => ({ ...s, telegram_link: e.target.value }))} />
              <p className="text-xs text-text-muted mt-1">e.g. https://t.me/cryptotrade_support</p>
            </div>

            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Telegram Username (without @)</label>
              <input className={ADMIN_INPUT} placeholder="cryptotrade_support"
                value={siteSettings.telegram_username}
                onChange={e => setSiteSettings(s => ({ ...s, telegram_username: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Support Email</label>
              <input className={ADMIN_INPUT} type="email" placeholder="support@yoursite.com"
                value={siteSettings.support_email}
                onChange={e => setSiteSettings(s => ({ ...s, support_email: e.target.value }))} />
            </div>

            <button onClick={handleSaveAllSettings} disabled={settingsSaving}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#ee8267] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a]">
              {settingsSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ── Deposit Addresses Tab ────────────────────────────────────────── */}
      {activeTab === 'deposit-addr' && (
        <div className="space-y-6">
          {/* Add/Edit form */}
          <div className={`${ADMIN_PANEL} p-5`}>
            <h3 className="font-semibold text-text-primary mb-4">
              {editingAddr ? '✏️ Edit Address' : '➕ Add Deposit Address'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Coin (e.g. USDT, BTC, ETH)</label>
                <input
                  className={`${ADMIN_INPUT} uppercase`}
                  value={addrForm.coin}
                  onChange={(e) => setAddrForm(f => ({ ...f, coin: e.target.value.toUpperCase() }))}
                  placeholder="USDT"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Network (e.g. TRC20, ERC20, BEP20)</label>
                <input
                  className={ADMIN_INPUT}
                  value={addrForm.network}
                  onChange={(e) => setAddrForm(f => ({ ...f, network: e.target.value }))}
                  placeholder="TRC20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-text-muted mb-1.5 block">Deposit Address</label>
                <input
                  className={`${ADMIN_INPUT} font-mono text-sm`}
                  value={addrForm.address}
                  onChange={(e) => setAddrForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Wallet address..."
                />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Minimum Deposit</label>
                <input
                  type="number"
                  className={ADMIN_INPUT}
                  value={addrForm.minDeposit}
                  onChange={(e) => setAddrForm(f => ({ ...f, minDeposit: e.target.value }))}
                  placeholder="10"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Note (shown to user, optional)</label>
                <input
                  className={ADMIN_INPUT}
                  value={addrForm.note}
                  onChange={(e) => setAddrForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Only send USDT on TRC20 network"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              {editingAddr && (
                <button
                  onClick={() => { setEditingAddr(null); setAddrForm({ coin: 'USDT', network: 'TRC20', address: '', minDeposit: 10, note: '' }); }}
                  className={ADMIN_BUTTON}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveAddress}
                disabled={addrLoading}
                className="flex h-12 items-center gap-2 rounded-full bg-[#ee8267] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a]"
              >
                {addrLoading && <div className="w-4 h-4 border-2 border-light-border border-t-transparent rounded-full animate-spin" />}
                {editingAddr ? 'Update Address' : 'Add Address'}
              </button>
            </div>
          </div>

          {/* Addresses list */}
          <div className={`${ADMIN_PANEL} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-light-border">
              <h3 className="font-semibold text-text-primary">All Deposit Addresses ({depositAddresses.length})</h3>
            </div>
            {depositAddresses.length === 0 ? (
              <div className="p-8 text-center text-text-muted">No deposit addresses configured yet.</div>
            ) : (
              <div className="divide-y divide-light-border/50">
                {depositAddresses.map((addr) => (
                  <div key={addr._id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-brand-primary">{addr.coin}</span>
                          <span className="text-xs bg-light-hover text-text-secondary px-2 py-0.5 rounded-full border border-light-border">{addr.network}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${addr.isActive ? 'bg-green-trade/10 text-green-trade' : 'bg-red-trade/10 text-red-trade'}`}>
                            {addr.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-sm text-text-primary font-mono break-all">{addr.address}</p>
                        <p className="text-xs text-text-muted">Min: {addr.minDeposit} {addr.coin}{addr.note ? ` · ${addr.note}` : ''}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => { setEditingAddr(addr); setAddrForm({ coin: addr.coin, network: addr.network, address: addr.address, minDeposit: addr.minDeposit, note: addr.note || '' }); }}
                          className="rounded-full bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleAddress(addr)}
                          className="rounded-full border border-light-border bg-[#f7fbfb] px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-light-border"
                        >
                          {addr.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="rounded-full bg-red-trade/10 px-3 py-1.5 text-xs font-semibold text-red-trade transition-colors hover:bg-red-trade/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Deposit Requests Tab ──────────────────────────────────────────── */}
      {activeTab === 'deposit-req' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {[['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => { setDepositReqStatus(val); setDepositReqPage(1); }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  depositReqStatus === val
                    ? 'bg-[#ee8267] text-text-inverse shadow-[0_12px_28px_rgba(238,130,103,0.18)]'
                    : 'border border-light-border bg-[#f7fbfb] text-text-secondary hover:-translate-y-0.5 hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? <SkeletonTable rows={5} /> : (
            <>
              {depositRequests.length === 0 ? (
                <div className={`${ADMIN_PANEL} p-10 text-center text-text-muted`}>No deposit requests found.</div>
              ) : (
                <div className="space-y-3">
                  {depositRequests.map((req) => {
                    const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                    return (
                      <div key={req._id} className={`${ADMIN_PANEL} p-5`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-2 min-w-0">
                            {/* User + amount */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm">
                                  {req.user?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-text-primary">{req.user?.username}</p>
                                  <p className="text-xs text-text-muted">{req.user?.email}</p>
                                </div>
                              </div>
                              <div className="text-lg font-bold text-brand-primary">{req.amount} {req.coin}</div>
                              <span className="text-xs bg-light-hover text-text-secondary px-2 py-0.5 rounded-full border border-light-border">{req.network}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                            </div>

                            {/* Address */}
                            <p className="text-xs text-text-muted font-mono">To: {req.depositAddress}</p>

                            {/* TX Hash */}
                            {req.txHash && <p className="text-xs text-text-muted font-mono">TX: {req.txHash}</p>}

                            {/* Time */}
                            <p className="text-xs text-text-muted">Submitted: {formatDateTime(req.createdAt)}</p>

                            {/* Admin note */}
                            {req.adminNote && <p className="text-xs text-text-secondary italic">Note: {req.adminNote}</p>}
                          </div>

                          {/* Voucher + Actions */}
                          <div className="flex flex-col items-end gap-3">
                            {/* Voucher preview */}
                            <a
                              href={req.voucherImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={req.voucherImage}
                                alt="Voucher"
                                className="h-20 w-20 cursor-pointer rounded-[18px] border border-light-border object-cover transition-opacity hover:opacity-80"
                              />
                              <p className="text-xs text-text-muted text-center mt-1">View</p>
                            </a>

                            {/* Actions (only for pending) */}
                            {req.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setReviewModal({ request: req, action: 'approve' })}
                                  className="rounded-full bg-green-trade/10 px-4 py-2 text-sm font-medium text-green-trade transition-all hover:-translate-y-0.5 hover:bg-green-trade/20"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => setReviewModal({ request: req, action: 'reject' })}
                                  className="rounded-full bg-red-trade/10 px-4 py-2 text-sm font-medium text-red-trade transition-all hover:-translate-y-0.5 hover:bg-red-trade/20"
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {depositReqPagination.pages > 1 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-text-muted">Page {depositReqPage} / {depositReqPagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setDepositReqPage(p => Math.max(1, p - 1))} disabled={depositReqPage === 1} className={ADMIN_BUTTON}>← Prev</button>
                <button onClick={() => setDepositReqPage(p => Math.min(depositReqPagination.pages, p + 1))} disabled={depositReqPage === depositReqPagination.pages} className={ADMIN_BUTTON}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Review Modal ─────────────────────────────────────────────────── */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setReviewModal(null)}>
          <div className={`${ADMIN_PANEL} w-full max-w-sm animate-bounce-in p-6`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-1 ${reviewModal.action === 'approve' ? 'text-green-trade' : 'text-red-trade'}`}>
              {reviewModal.action === 'approve' ? '✓ Approve Deposit' : '✗ Reject Deposit'}
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              <span className="text-text-primary font-medium">{reviewModal.request.user?.username}</span> —{' '}
              <span className="font-semibold text-brand-primary">{reviewModal.request.amount} {reviewModal.request.coin}</span> via {reviewModal.request.network}
            </p>
            {reviewModal.action === 'approve' && (
              <div className="bg-green-trade/5 border border-green-trade/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-trade">
                  Approving will credit <strong>{reviewModal.request.amount} USDT</strong> to {reviewModal.request.user?.username}'s balance.
                </p>
              </div>
            )}
            <div className="mb-4">
              <label className="text-xs text-text-muted mb-1.5 block">Admin Note (optional)</label>
              <input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add a note for the user..."
                className={ADMIN_INPUT}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setReviewModal(null); setReviewNote(''); }} className={`${ADMIN_BUTTON} flex-1`}>Cancel</button>
              <button
                onClick={handleReview}
                disabled={reviewLoading}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                  reviewModal.action === 'approve'
                    ? 'bg-green-trade text-text-inverse hover:bg-green-trade/90'
                    : 'bg-red-trade text-white hover:bg-red-trade/90'
                }`}
              >
                {reviewLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Balance Modifier Modal ───────────────────────────────────────── */}
      {balanceModal && (() => {
        const COINS = ['USDT','BTC','ETH','BNB','SOL','XRP','DOGE','ADA','MATIC','DOT','LINK','AVAX','LTC','TRX','PEPE'];
        const usdtVal = getUsdtEquivalent();
        const coinPrice = coinPrices[balanceCoin]?.price || 0;
        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setBalanceModal(null)}>
            <div className={`${ADMIN_PANEL} w-full max-w-sm animate-bounce-in p-6`} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-text-primary mb-1">Add Balance (USDT)</h3>
              <p className="text-sm text-text-secondary mb-4">
                User: <span className="text-text-primary font-medium">{balanceModal.user.username}</span> —
                Current: <span className="text-brand-primary font-medium">${balanceModal.user.demo_balance.toFixed(2)} USDT</span>
              </p>

              <div className="space-y-4">
                {/* Coin selector */}
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Select Coin</label>
                  <select
                    value={balanceCoin}
                    onChange={(e) => setBalanceCoin(e.target.value)}
                    className={ADMIN_INPUT}
                  >
                    {COINS.map(c => (
                      <option key={c} value={c}>{c}{c !== 'USDT' && coinPrices[c] ? ` — $${coinPrices[c].price.toLocaleString(undefined,{maximumFractionDigits:2})}` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Coin amount */}
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Amount in {balanceCoin}</label>
                  <input
                    type="number"
                    value={balanceCoinAmount}
                    onChange={(e) => setBalanceCoinAmount(e.target.value)}
                    placeholder={`e.g. ${balanceCoin === 'USDT' ? '500' : '0.01'}`}
                    className={ADMIN_INPUT}
                    step="any"
                    min="0"
                  />
                </div>

                {/* USDT conversion preview */}
                <div className="rounded-xl p-3 text-sm" style={{ background: '#0075bb15', border: '1px solid #0075bb30' }}>
                  {balanceCoin !== 'USDT' && coinPrice > 0 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-text-muted text-xs">
                        <span>{balanceCoinAmount || '0'} {balanceCoin} × ${coinPrice.toLocaleString(undefined,{maximumFractionDigits:2})}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">USDT Equivalent</span>
                        <span className="font-bold text-green-trade">${usdtVal.toFixed(2)} USDT</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Will add to balance</span>
                      <span className="font-bold text-green-trade">${usdtVal.toFixed(2)} USDT</span>
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Reason (optional)</label>
                  <input
                    type="text"
                    value={balanceReason}
                    onChange={(e) => setBalanceReason(e.target.value)}
                    placeholder="Manual deposit, bonus, etc."
                    className={ADMIN_INPUT}
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setBalanceModal(null)} className={`${ADMIN_BUTTON} flex-1`}>Cancel</button>
                  <button
                    onClick={handleModifyBalance}
                    disabled={modalLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ee8267] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a]"
                  >
                    {modalLoading && <div className="w-4 h-4 border-2 border-light-border border-t-transparent rounded-full animate-spin" />}
                    Add ${usdtVal > 0 ? usdtVal.toFixed(2) : '0'} USDT
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Withdraw Review Modal ─────────────────────────────────────────── */}
      {withdrawReviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setWithdrawReviewModal(null)}>
          <div className={`${ADMIN_PANEL} w-full max-w-sm p-6`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-1 ${withdrawReviewModal.action === 'approve' ? 'text-green-trade' : 'text-red-trade'}`}>
              {withdrawReviewModal.action === 'approve' ? '✓ Approve Withdrawal' : '✗ Reject Withdrawal'}
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              <span className="text-text-primary font-medium">{withdrawReviewModal.request.user?.username}</span> —{' '}
              <span className="font-semibold text-brand-primary">${withdrawReviewModal.request.amount.toFixed(2)} {withdrawReviewModal.request.coin}</span> via {withdrawReviewModal.request.network}
            </p>
            {withdrawReviewModal.action === 'reject' && (
              <p className="text-xs text-brand-yellow bg-brand-yellow/10 rounded-xl px-3 py-2 mb-4">
                Rejecting will refund <strong>${withdrawReviewModal.request.amount.toFixed(2)}</strong> USDT back to user's balance.
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Admin Note (optional)</label>
                <input type="text" value={withdrawReviewNote} onChange={e => setWithdrawReviewNote(e.target.value)}
                  placeholder="Reason or transaction ID..." className={ADMIN_INPUT} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setWithdrawReviewModal(null); setWithdrawReviewNote(''); }} className={`${ADMIN_BUTTON} flex-1`}>Cancel</button>
                <button onClick={handleWithdrawReview} disabled={withdrawReviewLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${withdrawReviewModal.action === 'approve' ? 'bg-green-trade text-text-inverse hover:bg-green-trade/90' : 'bg-red-trade text-white hover:bg-red-trade/90'}`}>
                  {withdrawReviewLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  {withdrawReviewModal.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
