import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { transferAPI, walletAPI } from '../services/api';

const QUICK_AMOUNTS = [10, 50, 100, 500];
const PANEL = 'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';

function StatusBadge({ status }) {
  const map = {
    completed: { bg: '#0ECB8118', color: '#0ECB81', border: '#0ECB8140', label: 'Completed' },
    pending:   { bg: '#f6c90e18', color: '#f6c90e', border: '#f6c90e40', label: 'Pending' },
    failed:    { bg: '#ef444418', color: '#ef4444', border: '#ef444440', label: 'Failed' },
  };
  const s = map[status] || map.pending;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

export default function Transfer() {
  const { t } = useTranslation();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [balance, setBalance] = useState(0);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      const { data } = await walletAPI.getWallet();
      setBalance(data.usdtBalance || 0);
    } catch (_) {}
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await transferAPI.history();
      setHistory(data.transfers || []);
    } catch (_) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, [fetchBalance, fetchHistory]);

  const handleQuickAmount = (amt) => {
    setAmount(String(amt));
  };

  const handleConfirm = () => {
    if (!recipient.trim()) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    if (amt < 1) return;
    if (amt > balance) return;
    setShowConfirm(true);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const { data } = await transferAPI.send({
        recipient: recipient.trim(),
        amount: parseFloat(amount),
        note: note.trim() || undefined,
      });
      toast.success(data.message);
      setBalance(data.newBalance);
      setRecipient('');
      setAmount('');
      setNote('');
      setShowConfirm(false);
      await fetchHistory();
    } catch {
      setShowConfirm(false);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {/* Balance banner */}
      <div className="rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #0E2026, #185B64)', border: '1px solid #E8EAED' }}
      >
        <div>
          <p className="text-xs text-white/60">{t('transfer.balance')}</p>
          <p className="text-2xl font-black text-white mt-0.5">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <span className="text-3xl">💸</span>
      </div>

      {/* Transfer Form */}
      <div className={`${PANEL} p-6 space-y-4`}>
        <h3 className="font-bold text-text-primary text-base">{t('transfer.sendToUser')}</h3>

        {/* Recipient */}
        <div className="space-y-1.5">
          <label className="text-sm text-text-secondary">{t('transfer.recipient')}</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter username or email..."
            className="input-field"
          />
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-sm text-text-secondary">{t('transfer.amount')}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-sm text-text-muted">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="1"
              className="input-field pl-8"
            />
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-2 flex-wrap">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => handleQuickAmount(amt)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  parseFloat(amount) === amt
                    ? 'bg-brand-primary/20 border-brand-primary text-brand-primary'
                    : 'border-light-border text-text-secondary hover:border-text-muted/40 hover:text-text-primary'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Note (optional) */}
        <div className="space-y-1.5">
          <label className="text-sm text-text-secondary">{t('transfer.note')}</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a message..."
            maxLength={100}
            className="input-field"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleConfirm}
          disabled={!recipient.trim() || !amount || parseFloat(amount) <= 0}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('transfer.confirm')}
        </button>
      </div>

      {/* Transfer History */}
      <div className={`${PANEL} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-light-border">
          <h3 className="font-bold text-text-primary">{t('transfer.history')}</h3>
        </div>

        {historyLoading ? (
          <div className="px-5 py-10 text-center">
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <span className="text-4xl">↕️</span>
            <p className="text-sm text-text-secondary mt-3">{t('transfer.noHistory')}</p>
            <p className="text-xs text-text-muted mt-1">Your transfer history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-light-border">
            {history.map((tx) => {
              const isSent = tx.description?.startsWith('Transfer to');
              return (
                <div key={tx._id} className="px-5 py-4 flex items-center gap-3 hover:bg-light-hover transition-colors">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{
                      background: isSent ? '#ef444418' : '#0ECB8118',
                    }}
                  >
                    {isSent ? '↗' : '↙'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {tx.description || '—'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm ${isSent ? 'text-red-trade' : 'text-green-trade'}`}>
                      {isSent ? '-' : '+'}${Math.abs(tx.amount || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Bal: ${(tx.balanceAfter || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${PANEL} max-w-sm w-full animate-fade-in p-6`}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-brand-primary/15 border-2 border-brand-primary/30 flex items-center justify-center text-3xl mx-auto mb-3">
                💸
              </div>
              <h3 className="text-xl font-bold text-text-primary">Confirm Transfer</h3>
              <p className="text-sm text-text-secondary mt-1">
                Please review before sending
              </p>
            </div>

            <div className="bg-light-input rounded-xl p-4 space-y-2.5 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-text-muted">To</span>
                <span className="text-text-primary font-semibold">@{recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Amount</span>
                <span className="text-text-primary font-bold">${parseFloat(amount).toFixed(2)} USDT</span>
              </div>
              {note && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Note</span>
                  <span className="text-text-primary truncate max-w-[180px]">{note}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 font-semibold border-t border-light-border">
                <span className="text-text-muted">Balance After</span>
                <span className="text-text-primary">
                  ${(balance - parseFloat(amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary flex-1 py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
