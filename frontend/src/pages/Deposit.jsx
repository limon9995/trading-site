import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { depositAPI } from '../services/api';

const COIN_ICONS = {
  USDT: '💵', BTC: '₿', ETH: 'Ξ', BNB: '🔶', TRX: '🔴', SOL: '◎',
};

const STATUS_CONFIG = {
  pending:  { label: 'Pending Review', cls: 'bg-yellow-500/10 text-yellow-400' },
  approved: { label: 'Approved',        cls: 'bg-green-trade/10 text-green-trade' },
  rejected: { label: 'Rejected',        cls: 'bg-red-trade/10 text-red-trade' },
};

const DEPOSIT_PANEL =
  'rounded-[32px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';

export default function Deposit() {
  const [addresses, setAddresses] = useState({});  // { USDT: [{network, address, minDeposit, note}] }
  const [selectedCoin, setSelectedCoin] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState(null); // { network, address, minDeposit }
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [voucherFile, setVoucherFile] = useState(null);
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef();

  useEffect(() => {
    fetchAddresses();
    fetchHistory();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [historyPage]);

  const fetchAddresses = async () => {
    try {
      const { data } = await depositAPI.getAddresses();
      setAddresses(data.addresses || {});
      const coins = Object.keys(data.addresses || {});
      if (coins.length > 0) {
        setSelectedCoin(coins[0]);
        const networks = data.addresses[coins[0]];
        if (networks?.length > 0) setSelectedNetwork(networks[0]);
      }
    } catch {
      toast.error('Failed to load deposit addresses');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await depositAPI.getHistory(historyPage);
      setHistory(data.records || []);
      setHistoryPagination(data.pagination || {});
    } catch {}
  };

  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin);
    const networks = addresses[coin] || [];
    setSelectedNetwork(networks[0] || null);
  };

  const handleCopyAddress = () => {
    if (!selectedNetwork?.address) return;
    navigator.clipboard.writeText(selectedNetwork.address).then(() => {
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }
    setVoucherFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setVoucherPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedCoin || !selectedNetwork) {
      return toast.error('Please select a coin and network');
    }
    if (!amount || parseFloat(amount) <= 0) {
      return toast.error('Please enter a valid deposit amount');
    }

    if (!voucherFile) {
      return toast.error('Please upload your payment voucher/screenshot');
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('coin', selectedCoin);
      formData.append('network', selectedNetwork.network);
      formData.append('depositAddress', selectedNetwork.address);
      formData.append('amount', amount);
      formData.append('txHash', txHash);
      formData.append('voucher', voucherFile);

      await depositAPI.submit(formData);
      toast.success('Deposit request submitted! Awaiting admin review.');

      setAmount('');
      setTxHash('');
      setVoucherFile(null);
      setVoucherPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const coins = Object.keys(addresses);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (coins.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Deposit</h2>
          <p className="text-sm text-text-secondary mt-0.5">Add funds to your account</p>
        </div>
        <div className={`${DEPOSIT_PANEL} p-10 text-center`}>
          <p className="text-4xl mb-4">🏗️</p>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Deposit Coming Soon</h3>
          <p className="text-text-secondary text-sm">
            Deposit addresses have not been configured yet. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className={`${DEPOSIT_PANEL} overflow-hidden`}>
        {/* Step 1: Select Coin */}
        <div className="border-b border-[#e3ecec] px-6 py-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-[#6c8185]">Step 1 — Select Coin</p>
          <div className="flex flex-wrap gap-2">
            {coins.map((coin) => (
              <button
                key={coin}
                onClick={() => handleCoinSelect(coin)}
                className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                  selectedCoin === coin
                    ? 'bg-[#ee8267] text-white shadow-[0_14px_34px_rgba(238,130,103,0.2)]'
                    : 'border border-[#d7e3e4] bg-[#f7fbfb] text-[#567175] hover:-translate-y-0.5 hover:text-[#102328]'
                }`}
              >
                <span>{COIN_ICONS[coin] || '🪙'}</span>
                {coin}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Network */}
        {selectedCoin && addresses[selectedCoin]?.length > 0 && (
          <div className="border-b border-[#e3ecec] px-6 py-5">
            <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-[#6c8185]">Step 2 — Select Network</p>
            <div className="flex flex-wrap gap-2">
              {addresses[selectedCoin].map((net) => (
                <button
                  key={net.network}
                  onClick={() => setSelectedNetwork(net)}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                    selectedNetwork?.network === net.network
                      ? 'border border-brand-primary bg-[#fff1ec] text-brand-primary'
                      : 'border border-[#d7e3e4] bg-[#f7fbfb] text-[#567175] hover:text-[#11262c]'
                  }`}
                >
                  {net.network}
                </button>
              ))}
            </div>
            {selectedNetwork?.note && (
              <p className="mt-2 rounded-[18px] bg-[#fff6db] px-3 py-2 text-xs text-[#8c731c]">
                ⚠️ {selectedNetwork.note}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Deposit Address + QR */}
        {selectedNetwork && (
          <div className="border-b border-[#e3ecec] px-6 py-5">
            <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[#6c8185]">Step 3 — Send to this Address</p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* QR Code */}
              <div className="flex-shrink-0 rounded-[26px] border border-[#e0ebec] bg-[#fbfefe] p-4 shadow-inner">
                <QRCodeSVG
                  value={selectedNetwork.address}
                  size={140}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>

              {/* Address info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Deposit Address</p>
                    <div className="flex items-center gap-2 rounded-[22px] border border-[#d9e5e6] bg-[#f7fbfb] px-4 py-3">
                      <p className="text-sm text-text-primary font-mono break-all flex-1">{selectedNetwork.address}</p>
                      <button
                        onClick={handleCopyAddress}
                        className="flex-shrink-0 rounded-full bg-[#fff1ec] px-3 py-1.5 text-xs font-semibold text-brand-primary transition-colors hover:bg-[#ffe3da]"
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-[22px] border border-[#e0eaeb] bg-[#f7fbfb] p-3">
                      <p className="text-xs text-text-muted mb-0.5">Network</p>
                      <p className="font-semibold text-text-primary">{selectedNetwork.network}</p>
                    </div>
                    <div className="rounded-[22px] border border-[#e0eaeb] bg-[#f7fbfb] p-3">
                      <p className="text-xs text-text-muted mb-0.5">Coin</p>
                      <p className="font-semibold text-text-primary">{selectedCoin}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Upload Voucher + Amount */}
        {selectedNetwork && (
          <div className="space-y-4 px-6 py-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#6c8185]">Step 4 — Confirm Your Transfer</p>

            {/* Amount */}
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Deposit Amount ({selectedCoin})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Enter amount (${selectedCoin})`}
                className="input-field rounded-[22px] border-[#d7e4e5] bg-[#f7fbfb]"
                step="any"
              />
            </div>

            {/* TX Hash (optional) */}
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Transaction Hash <span className="text-text-muted">(optional)</span></label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste TX ID / hash (optional)"
                className="input-field rounded-[22px] border-[#d7e4e5] bg-[#f7fbfb] font-mono text-sm"
              />
            </div>

            {/* Voucher Upload */}
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Payment Voucher / Screenshot <span className="text-red-trade">*</span></label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-[26px] border-2 border-dashed p-6 text-center transition-all ${
                  voucherPreview
                    ? 'border-brand-primary/40 bg-[#fff7f4]'
                    : 'border-[#d6e2e3] bg-[#fbfefe] hover:-translate-y-0.5 hover:border-brand-primary/40 hover:bg-[#f7fbfb]'
                }`}
              >
                {voucherPreview ? (
                  <div className="space-y-3">
                    <img
                      src={voucherPreview}
                      alt="Voucher preview"
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <p className="text-xs text-text-muted">{voucherFile?.name} · Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-3xl">📎</p>
                    <p className="text-sm text-text-secondary">Click to upload screenshot</p>
                    <p className="text-xs text-text-muted">JPG, PNG, GIF up to 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Warning */}
            <div className="space-y-1 rounded-[24px] border border-[#f0d8a7] bg-[#fffaf0] p-4 text-xs text-[#8f6c18]">
              <p className="font-semibold">⚠️ Important:</p>
              <p>• Only send <strong>{selectedCoin}</strong> via <strong>{selectedNetwork.network}</strong> network</p>
              <p>• Sending the wrong coin or using the wrong network will result in permanent loss</p>
              <p>• Deposit will be credited after admin review (usually within 30 minutes)</p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !voucherFile || !amount}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#ee8267] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#e8775a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <div className="w-4 h-4 border-2 border-light-border border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        )}
      </div>

      {/* Deposit History */}
      {history.length > 0 && (
        <div className={`${DEPOSIT_PANEL} overflow-hidden`}>
          <div className="border-b border-[#e3ecec] px-6 py-5">
            <h3 className="text-[24px] font-light tracking-[-0.03em] text-[#0d2127]">Deposit History</h3>
          </div>
          <div className="divide-y divide-light-border/50">
            {history.map((req) => {
              const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              return (
                <div key={req._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text-primary">{req.amount} {req.coin}</span>
                        <span className="text-xs text-text-muted">via {req.network}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted font-mono truncate max-w-[280px]">{req.depositAddress}</p>
                      {req.adminNote && (
                        <p className="text-xs text-text-secondary italic">Note: {req.adminNote}</p>
                      )}
                    </div>
                    <p className="text-xs text-text-muted whitespace-nowrap">{formatDate(req.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {historyPagination.pages > 1 && (
            <div className="px-5 py-3 border-t border-light-border flex justify-between items-center">
              <p className="text-xs text-text-muted">Page {historyPage} / {historyPagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="rounded-full border border-[#d6e2e4] bg-white px-4 py-2 text-xs font-semibold text-[#506d72] transition-all hover:-translate-y-0.5 disabled:opacity-40">← Prev</button>
                <button onClick={() => setHistoryPage(p => Math.min(historyPagination.pages, p + 1))} disabled={historyPage === historyPagination.pages} className="rounded-full border border-[#d6e2e4] bg-white px-4 py-2 text-xs font-semibold text-[#506d72] transition-all hover:-translate-y-0.5 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
