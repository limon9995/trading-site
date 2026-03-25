import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { binaryAPI, walletAPI } from '../services/api';
import { useMarketPrices } from '../hooks/useMarketPrices';
import AnimatedNumber from '../components/AnimatedNumber';
import PriceChange from '../components/PriceChange';
import { SkeletonCard } from '../components/SkeletonCard';

const SUPPORTED_COINS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP',
  'ADA', 'DOGE', 'MATIC', 'DOT', 'LINK',
  'AVAX', 'UNI', 'LTC', 'ATOM', 'TRX',
];

const DURATIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 300, label: '5m' },
];

const PAYOUT_RATE = 0.85;

const formatPrice = (price = 0) => (
  price < 1
    ? price.toFixed(4)
    : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
);

const formatCountdown = (expiresAt) => {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export default function BinaryTrading() {
  const { symbol: paramSymbol } = useParams();
  const navigate = useNavigate();
  const [selectedCoin, setSelectedCoin] = useState(paramSymbol?.toUpperCase() || 'BTC');
  const [direction, setDirection] = useState('up');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(30);
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());
  const { prices, loading: pricesLoading } = useMarketPrices(5000);

  const coin = prices[selectedCoin];
  const availableBalance = wallet?.usdtBalance || 0;
  const expectedProfit = amount ? parseFloat(amount || 0) * PAYOUT_RATE : 0;
  const totalPayout = amount ? parseFloat(amount || 0) + expectedProfit : 0;

  const fetchWallet = useCallback(async () => {
    try {
      const { data } = await walletAPI.getWallet();
      setWallet(data);
    } catch (_) {}
  }, []);

  const fetchBinaryHistory = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const { data } = await binaryAPI.getHistory(30);
      setActiveTrades(data.activeTrades || []);
      setHistory(data.history || []);
    } catch (err) {
      if (initial) toast.error(err.response?.data?.error || 'Failed to load binary trades');
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchBinaryHistory(true);
  }, [fetchWallet, fetchBinaryHistory]);

  useEffect(() => {
    if (paramSymbol) setSelectedCoin(paramSymbol.toUpperCase());
  }, [paramSymbol]);

  useEffect(() => {
    const countdownTimer = setInterval(() => setTick(Date.now()), 1000);
    const refreshTimer = setInterval(() => {
      fetchBinaryHistory(false);
      fetchWallet();
    }, 5000);

    return () => {
      clearInterval(countdownTimer);
      clearInterval(refreshTimer);
    };
  }, [fetchBinaryHistory, fetchWallet]);

  const coinList = useMemo(
    () => SUPPORTED_COINS.map((sym) => ({ sym, data: prices[sym] })).filter(({ data }) => data && data.price != null),
    [prices]
  );

  const handleCoinSelect = (symbol) => {
    setSelectedCoin(symbol);
    navigate(`/binary/${symbol}`, { replace: true });
  };

  const handleQuickStake = (quick) => {
    if (availableBalance <= 0) return;
    setAmount(Math.min(quick, availableBalance).toFixed(2));
  };

  const handlePlaceTrade = async () => {
    const parsedAmount = parseFloat(amount);
    if (!coin) return toast.error('Live market price is not ready yet');
    if (!parsedAmount || parsedAmount <= 0) return toast.error('Enter a valid stake amount');
    if (parsedAmount > availableBalance) return toast.error('Insufficient USDT balance');

    setPlacing(true);
    try {
      const { data } = await binaryAPI.place({
        symbol: selectedCoin,
        direction,
        amount: parsedAmount,
        duration,
      });
      toast.success(data.message);
      setAmount('');
      await Promise.all([fetchWallet(), fetchBinaryHistory(false)]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place binary trade');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-2xl p-5 overflow-hidden relative border border-brand-yellow/20"
        style={{ background: 'linear-gradient(135deg, #3b2501 0%, #6d4c00 48%, #014670 100%)' }}>
        <div className="absolute inset-y-0 right-0 w-44 opacity-20"
          style={{ background: 'radial-gradient(circle at center, #fcd535 0%, transparent 70%)' }} />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-brand-yellow text-xs uppercase tracking-[0.2em] font-bold">Binary Trading</p>
            <h1 className="text-2xl font-black text-white mt-1">Predict the next move</h1>
            <p className="text-white/70 text-sm mt-2 max-w-xl">
              Choose a coin, select `UP` or `DOWN`, and lock in a short expiry trade with 85% payout on wins.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-80">
            <div className="bg-black/20 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-xs text-white/60">Available</p>
              <p className="text-lg font-bold text-white">${availableBalance.toFixed(2)}</p>
            </div>
            <div className="bg-black/20 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-xs text-white/60">Payout Rate</p>
              <p className="text-lg font-bold text-brand-yellow">85%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-4">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-light-border/40 flex items-center justify-between">
              <p className="font-semibold text-white text-sm">Coins</p>
              <p className="text-xs text-text-muted">Auto-refresh every 5s</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-3">
              {coinList.map(({ sym, data }) => {
                const active = sym === selectedCoin;
                return (
                  <button
                    key={sym}
                    onClick={() => handleCoinSelect(sym)}
                    className={`rounded-xl p-3 text-left border transition-all ${
                      active
                        ? 'border-brand-yellow bg-brand-yellow/10'
                        : 'border-light-border/40 bg-light-input hover:border-brand-primary/40'
                    }`}
                  >
                    <p className={`font-bold text-sm ${active ? 'text-brand-yellow' : 'text-white'}`}>{sym}</p>
                    <p className="text-xs text-text-secondary mt-1">${formatPrice(data.price)}</p>
                    <PriceChange value={data.change24h || 0} className="text-[11px] mt-1 inline-block" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-text-muted">{selectedCoin}/USDT</p>
                {coin && coin.price != null ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl font-black text-white">
                      $<AnimatedNumber value={coin.price} decimals={coin.price < 1 ? 4 : 2} />
                    </span>
                    <PriceChange value={coin.change24h || 0} />
                  </div>
                ) : (
                  <div className="skeleton h-8 w-40 mt-2" />
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Estimated payout</p>
                <p className="text-xl font-bold text-brand-yellow">${totalPayout ? totalPayout.toFixed(2) : '0.00'}</p>
                <p className="text-xs text-text-secondary">Profit ${expectedProfit ? expectedProfit.toFixed(2) : '0.00'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDirection('up')}
                className={`rounded-2xl p-4 border text-left transition-all ${
                  direction === 'up'
                    ? 'border-green-trade bg-green-trade/10'
                    : 'border-light-border/40 bg-light-input hover:border-green-trade/40'
                }`}
              >
                <p className="text-2xl font-black text-green-trade">UP</p>
                <p className="text-xs text-text-secondary mt-1">Close higher than entry</p>
              </button>
              <button
                onClick={() => setDirection('down')}
                className={`rounded-2xl p-4 border text-left transition-all ${
                  direction === 'down'
                    ? 'border-red-trade bg-red-trade/10'
                    : 'border-light-border/40 bg-light-input hover:border-red-trade/40'
                }`}
              >
                <p className="text-2xl font-black text-red-trade">DOWN</p>
                <p className="text-xs text-text-secondary mt-1">Close lower than entry</p>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-muted block">Stake Amount (USDT)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                placeholder="Enter your stake"
              />
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => handleQuickStake(quick)}
                    className="text-xs py-2 rounded-lg bg-light-input hover:bg-light-hover text-text-secondary hover:text-white transition-colors"
                  >
                    ${quick}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-muted block">Expiry</label>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDuration(option.value)}
                    className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                      duration === option.value
                        ? 'bg-brand-primary text-white'
                        : 'bg-light-input text-text-secondary hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-light-input rounded-2xl p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-text-muted text-xs">Direction</p>
                <p className={direction === 'up' ? 'text-green-trade font-bold' : 'text-red-trade font-bold'}>
                  {direction.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Potential profit</p>
                <p className="text-brand-yellow font-bold">${expectedProfit ? expectedProfit.toFixed(2) : '0.00'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Potential loss</p>
                <p className="text-red-trade font-bold">-${amount ? parseFloat(amount).toFixed(2) : '0.00'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Duration</p>
                <p className="text-white font-bold">{DURATIONS.find((item) => item.value === duration)?.label}</p>
              </div>
            </div>

            <button
              onClick={handlePlaceTrade}
              disabled={placing || pricesLoading || !coin}
              className={`w-full rounded-2xl py-3.5 font-bold text-white transition-all ${
                direction === 'up' ? 'bg-green-trade hover:opacity-90' : 'bg-red-trade hover:opacity-90'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {placing ? 'Placing trade...' : `Place ${direction.toUpperCase()} Trade`}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-light-border/40 flex items-center justify-between">
              <p className="font-semibold text-white text-sm">Active Positions</p>
              <p className="text-xs text-text-muted">{activeTrades.length} live</p>
            </div>
            {loading ? (
              <div className="p-4"><SkeletonCard lines={4} /></div>
            ) : activeTrades.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-3xl mb-2">⏱️</p>
                <p className="text-sm text-text-secondary">No active binary trades</p>
              </div>
            ) : (
              <div className="divide-y divide-light-border/30">
                {activeTrades.map((trade) => {
                  const livePrice = prices[trade.coin]?.price;
                  const winningNow = livePrice == null
                    ? null
                    : trade.direction === 'up'
                    ? livePrice > trade.entryPrice
                    : livePrice < trade.entryPrice;

                  return (
                    <div key={`${trade._id}-${tick}`} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{trade.coin}/USDT</p>
                          <p className="text-xs text-text-muted">
                            {trade.direction.toUpperCase()} · ${trade.amount.toFixed(2)}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          trade.direction === 'up' ? 'bg-green-trade/10 text-green-trade' : 'bg-red-trade/10 text-red-trade'
                        }`}>
                          {trade.direction.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-light-input rounded-xl p-3">
                          <p className="text-text-muted">Entry</p>
                          <p className="text-white font-semibold">${formatPrice(trade.entryPrice)}</p>
                        </div>
                        <div className="bg-light-input rounded-xl p-3">
                          <p className="text-text-muted">Live</p>
                          <p className="text-white font-semibold">${livePrice ? formatPrice(livePrice) : '—'}</p>
                        </div>
                        <div className="bg-light-input rounded-xl p-3">
                          <p className="text-text-muted">Time Left</p>
                          <p className="text-brand-yellow font-semibold">{formatCountdown(trade.expiresAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">Current state</span>
                        <span className={
                          winningNow == null
                            ? 'text-text-secondary'
                            : winningNow
                            ? 'text-green-trade font-semibold'
                            : 'text-red-trade font-semibold'
                        }>
                          {winningNow == null ? 'Waiting for price' : winningNow ? 'Currently winning' : 'Currently losing'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-light-border/40 flex items-center justify-between">
              <p className="font-semibold text-white text-sm">Recent Results</p>
              <p className="text-xs text-text-muted">Last 30 settled trades</p>
            </div>
            {loading ? (
              <div className="p-4"><SkeletonCard lines={4} /></div>
            ) : history.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-3xl mb-2">📜</p>
                <p className="text-sm text-text-secondary">No settled trades yet</p>
              </div>
            ) : (
              <div className="divide-y divide-light-border/30">
                {history.map((trade) => (
                  <div key={trade._id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{trade.coin}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          trade.status === 'won' ? 'bg-green-trade/10 text-green-trade' : 'bg-red-trade/10 text-red-trade'
                        }`}>
                          {trade.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        {`${trade.direction.toUpperCase()} · $${trade.amount.toFixed(2)} · Entry $${formatPrice(trade.entryPrice)} to Exit $${formatPrice(trade.closePrice || 0)}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold ${trade.profit >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
                        {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                      </p>
                      <p className="text-xs text-text-muted">{new Date(trade.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
