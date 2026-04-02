import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { withdrawAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const COINS = [
  { symbol: 'USDT', name: 'Tether',   networks: ['TRC20', 'ERC20', 'BEP20'] },
  { symbol: 'BTC',  name: 'Bitcoin',  networks: ['BTC'] },
  { symbol: 'ETH',  name: 'Ethereum', networks: ['ERC20'] },
  { symbol: 'BNB',  name: 'BNB',      networks: ['BEP20'] },
  { symbol: 'SOL',  name: 'Solana',   networks: ['SOL'] },
  { symbol: 'XRP',  name: 'XRP',      networks: ['XRP'] },
  { symbol: 'TRX',  name: 'TRON',     networks: ['TRC20'] },
  { symbol: 'DOGE', name: 'Dogecoin', networks: ['DOGE'] },
];

const COIN_COLORS = {
  USDT: '#26a17b', BTC: '#f7931a', ETH: '#627eea', BNB: '#f3ba2f',
  SOL: '#9945ff', XRP: '#00aae4', TRX: '#eb0029', DOGE: '#c2a633',
};

const WITHDRAW_FEE_RATE = 0.02;
const MIN_WITHDRAW = 10;

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  bg: 'bg-brand-yellow/15', text: 'text-brand-yellow' },
  approved: { label: 'Approved', bg: 'bg-green-trade/15',  text: 'text-green-trade'  },
  rejected: { label: 'Rejected', bg: 'bg-red-trade/15',    text: 'text-red-trade'    },
};

const WITHDRAW_PANEL =
  'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';

export default function Withdraw() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('withdraw');

  // Form state
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [selectedNetwork, setSelectedNetwork] = useState(COINS[0].networks[0]);
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  // OTP state
  const [otpStep, setOtpStep] = useState(false); // show OTP modal
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // History state
  const [history, setHistory] = useState([]);
  const [histPage, setHistPage] = useState(1);
  const [histPagination, setHistPagination] = useState({});
  const [histLoading, setHistLoading] = useState(false);

  const balance = user?.demo_balance || 0;
  const amt = parseFloat(amount) || 0;
  const fee = parseFloat((amt * WITHDRAW_FEE_RATE).toFixed(2));
  const netAmount = Math.max(0, parseFloat((amt - fee).toFixed(2)));

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer]);

  const handleCoinChange = (symbol) => {
    const coin = COINS.find(c => c.symbol === symbol);
    setSelectedCoin(coin);
    setSelectedNetwork(coin.networks[0]);
  };

  const fetchHistory = async () => {
    setHistLoading(true);
    try {
      const { data } = await withdrawAPI.history(histPage);
      setHistory(data.requests || []);
      setHistPagination(data.pagination || {});
    } catch { toast.error('Failed to load history'); }
    finally { setHistLoading(false); }
  };

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, histPage]);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!address.trim()) return toast.error('Enter wallet address');
    if (amt < MIN_WITHDRAW) return toast.error(`Minimum withdrawal is $${MIN_WITHDRAW}`);
    if (amt > balance) return toast.error('Insufficient balance');

    setSending(true);
    try {
      const { data } = await withdrawAPI.sendOtp({
        coin: selectedCoin.symbol,
        network: selectedNetwork,
        address: address.trim(),
        amount: amt,
      });
      setOtpEmail(data.email);
      setOtp(['', '', '', '', '', '']);
      setOtpStep(true);
      setResendTimer(60);
      toast.success(data.message);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally { setSending(false); }
  };

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Step 2: Verify OTP and submit
  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return toast.error('Enter the 6-digit OTP');
    setVerifying(true);
    try {
      const { data } = await withdrawAPI.verifyOtp(otpValue);
      toast.success(data.message);
      setOtpStep(false);
      setOtp(['', '', '', '', '', '']);
      setAmount('');
      setAddress('');
      if (refreshUser) refreshUser();
      setTab('history');
      setHistPage(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally { setVerifying(false); }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setSending(true);
    try {
      const { data } = await withdrawAPI.sendOtp({
        coin: selectedCoin.symbol,
        network: selectedNetwork,
        address: address.trim(),
        amount: amt,
      });
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      toast.success('New OTP sent');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between rounded-[30px] border border-[#12444b] p-5"
        style={{ background: 'linear-gradient(135deg, #0E2026, #185B64)' }}>
        <div>
          <p className="text-xs text-white/60 mb-0.5">Available Balance</p>
          <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
          <p className="text-xs text-white/50">USDT</p>
        </div>
        <div className="text-4xl opacity-60">💸</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-[28px] border border-[#d9e5e6] bg-white p-1.5 shadow-[0_18px_50px_rgba(8,35,41,0.07)]">
        <button onClick={() => setTab('withdraw')}
          className={`flex-1 rounded-[22px] py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-all ${tab === 'withdraw' ? 'bg-[#ee8267] text-white shadow-[0_12px_28px_rgba(238,130,103,0.22)]' : 'text-text-muted'}`}>
          {t('withdraw.title')}
        </button>
        <button onClick={() => setTab('history')}
          className={`flex-1 rounded-[22px] py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-all ${tab === 'history' ? 'bg-[#ee8267] text-white shadow-[0_12px_28px_rgba(238,130,103,0.22)]' : 'text-text-muted'}`}>
          {t('withdraw.history')}
        </button>
      </div>

      {/* ── Withdraw Form ── */}
      {tab === 'withdraw' && !otpStep && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          {/* Coin selector */}
          <div className={`${WITHDRAW_PANEL} space-y-3 p-5`}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('withdraw.selectCoin')}</p>
            <div className="grid grid-cols-4 gap-2">
              {COINS.map(c => {
                const color = COIN_COLORS[c.symbol] || '#EE8267';
                const active = selectedCoin.symbol === c.symbol;
                return (
                  <button key={c.symbol} type="button" onClick={() => handleCoinChange(c.symbol)}
                    className={`flex flex-col items-center gap-1 rounded-[20px] p-3 transition-all ${active ? 'opacity-100 shadow-[0_12px_28px_rgba(8,35,41,0.06)]' : 'opacity-60 hover:-translate-y-0.5 hover:opacity-90'}`}
                    style={{ background: active ? color + '20' : '#f7fbfb', border: active ? `1px solid ${color}60` : '1px solid #dde8e9' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: color + '25', color }}>
                      {c.symbol[0]}
                    </div>
                    <span className="text-[10px] font-semibold text-text-primary">{c.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Network selector */}
          <div className={`${WITHDRAW_PANEL} space-y-2 p-5`}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('withdraw.network')}</p>
            <div className="flex gap-2 flex-wrap">
              {selectedCoin.networks.map(net => (
                <button key={net} type="button" onClick={() => setSelectedNetwork(net)}
                  className={`rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${selectedNetwork === net ? 'bg-[#ee8267] text-white shadow-[0_12px_28px_rgba(238,130,103,0.2)]' : 'border border-[#d9e5e6] bg-[#f7fbfb] text-text-secondary'}`}>
                  {net}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-text-muted">⚠️ Ensure address supports <strong className="text-text-primary">{selectedNetwork}</strong></p>
          </div>

          {/* Wallet address */}
          <div className={`${WITHDRAW_PANEL} space-y-2 p-5`}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('withdraw.address')}</p>
            <textarea value={address} onChange={e => setAddress(e.target.value)}
              placeholder={`Enter ${selectedCoin.symbol} (${selectedNetwork}) address`} rows={2}
              className="w-full resize-none rounded-[22px] border border-[#d7e4e5] bg-[#f7fbfb] px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-brand-primary/60" />
          </div>

          {/* Amount */}
          <div className={`${WITHDRAW_PANEL} space-y-3 p-5`}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('withdraw.amount')}</p>
            <div className="relative">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={`Min $${MIN_WITHDRAW}`}
                className="input-field rounded-[22px] border-[#d7e4e5] bg-[#f7fbfb] pr-16"
                step="any" min={MIN_WITHDRAW} />
              <button type="button" onClick={() => setAmount(Math.max(0, balance).toFixed(2))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-primary">MAX</button>
            </div>
            {/* Fee breakdown */}
            <div className="space-y-1.5 pt-1 border-t border-light-border">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">{t('withdraw.amount')}</span>
                <span className="text-text-primary">${amt > 0 ? amt.toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">{t('withdraw.fee')}</span>
                <span className="text-red-trade">-${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold border-t border-light-border pt-1.5">
                <span className="text-text-primary">{t('withdraw.netAmount')}</span>
                <span className="text-green-trade">${netAmount > 0 ? netAmount.toFixed(2) : '0.00'} {selectedCoin.symbol}</span>
              </div>
            </div>
          </div>

          <button type="submit" disabled={sending || amt < MIN_WITHDRAW || amt > balance || !address.trim()}
            className="h-14 w-full rounded-full bg-[#ee8267] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a] disabled:opacity-40">
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending OTP...
              </span>
            ) : `Send OTP & Continue`}
          </button>
          <p className="text-center text-[10px] text-text-muted/50">An OTP will be sent to your registered email</p>
        </form>
      )}

      {/* ── OTP Verification Step ── */}
      {tab === 'withdraw' && otpStep && (
        <div className="space-y-5">
          {/* OTP Card */}
          <div className={`${WITHDRAW_PANEL} space-y-4 p-5`}>
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand-primary/40 bg-brand-primary/20 text-2xl">🔐</div>
              <h2 className="text-base font-bold text-text-primary">Verify Your Email</h2>
              <p className="text-xs text-text-muted">OTP sent to <span className="text-text-primary font-medium">{otpEmail}</span></p>
              <p className="text-xs text-text-muted">Withdraw: <span className="text-brand-primary font-bold">${amt.toFixed(2)} USDT</span></p>
            </div>

            {/* 6-digit OTP input */}
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-11 h-14 text-center text-xl font-bold text-text-primary rounded-xl outline-none transition-all"
                  style={{
                    background: digit ? '#EE826725' : '#f2f3f5',
                    border: digit ? '2px solid #EE8267' : '2px solid #E8EAED',
                  }}
                />
              ))}
            </div>

            {/* Verify button */}
            <button onClick={handleVerifyOtp} disabled={verifying || otp.join('').length !== 6}
              className="h-14 w-full rounded-full bg-[#ee8267] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a] disabled:opacity-40">
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : 'Confirm Withdrawal'}
            </button>

            {/* Resend */}
            <div className="text-center">
              <span className="text-xs text-text-muted">Didn't receive OTP? </span>
              <button onClick={handleResend} disabled={resendTimer > 0 || sending}
                className={`text-xs font-semibold transition-colors ${resendTimer > 0 ? 'text-text-muted' : 'text-brand-primary hover:underline'} disabled:opacity-60`}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </div>

          {/* Back button */}
          <button onClick={() => setOtpStep(false)}
            className="w-full rounded-full border border-[#d8e4e5] bg-white py-3 text-sm font-semibold text-[#506d72] transition-all hover:-translate-y-0.5">
            ← Back to Edit
          </button>
        </div>
      )}

      {/* ── History ── */}
      {tab === 'history' && (
        <div className="space-y-2">
          {histLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-[24px] border border-[#e4eded] bg-[#f6fbfb]" />
            ))
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">No withdrawals yet</div>
          ) : (
            history.map(req => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const color = COIN_COLORS[req.coin] || '#EE8267';
              return (
                <div key={req._id} className="rounded-[28px] border border-[#d9e6e7] bg-white p-4 shadow-[0_18px_60px_rgba(8,35,41,0.07)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: color + '22', border: `1px solid ${color}44`, color }}>
                        {req.coin[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">{req.coin} <span className="text-text-muted font-normal text-xs">· {req.network}</span></p>
                        <p className="text-[10px] text-text-muted">{new Date(req.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-primary">-${req.amount.toFixed(2)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    </div>
                  </div>
                  <div className="break-all rounded-[20px] border border-[#dde8e9] bg-[#f7fbfb] px-3 py-2 text-[11px] text-text-muted">→ {req.address}</div>
                  {req.adminNote && <p className="text-[10px] text-text-muted px-1">Note: {req.adminNote}</p>}
                </div>
              );
            })
          )}
          {histPagination.pages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setHistPage(p => Math.max(1, p - 1))} disabled={histPage === 1}
                className="rounded-full border border-[#d9e5e6] bg-white px-4 py-2 text-xs font-semibold text-[#506d72] disabled:opacity-40">← Prev</button>
              <span className="px-3 py-1.5 text-xs text-text-muted">{histPage}/{histPagination.pages}</span>
              <button onClick={() => setHistPage(p => Math.min(histPagination.pages, p + 1))} disabled={histPage === histPagination.pages}
                className="rounded-full border border-[#d9e5e6] bg-white px-4 py-2 text-xs font-semibold text-[#506d72] disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
