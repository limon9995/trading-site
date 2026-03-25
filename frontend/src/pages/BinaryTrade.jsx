import { useState, useEffect, useRef } from 'react';
import { createChart, CrosshairMode, LineStyle, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { binaryAPI, marketAPI } from '../services/api';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { useAuth } from '../context/AuthContext';

// ─── Candlestick Chart Component ──────────────────────────────────────────
function CandlestickChart({ symbol, interval, currentPrice }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const lastCandleRef   = useRef(null);

  // Create chart on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#848e9c',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#848e9c', style: LineStyle.Dashed, labelBackgroundColor: '#0E2026' },
        horzLine: { color: '#848e9c', style: LineStyle.Dashed, labelBackgroundColor: '#0E2026' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: '#848e9c',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: '#848e9c',
        timeVisible: true,
        secondsVisible: interval === '1m',
      },
      handleScroll: true,
      handleScale: true,
    });

    // Candlestick series (lightweight-charts v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:          '#0ecb81',
      downColor:        '#f6465d',
      borderUpColor:    '#0ecb81',
      borderDownColor:  '#f6465d',
      wickUpColor:      '#0ecb81',
      wickDownColor:    '#f6465d',
    });

    // Volume series (histogram at bottom)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat:   { type: 'volume' },
      priceScaleId:  'volume',
      color:         'rgba(14,203,129,0.2)',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current        = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current        = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // Fetch initial candles when symbol or interval changes
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    let active = true;

    const load = async () => {
      try {
        const { data } = await marketAPI.getCandles(symbol, interval, 200);
        if (!active || !candleSeriesRef.current) return;

        // Remove duplicate times (Binance sometimes sends the same candle twice)
        const seen = new Set();
        const unique = data.filter(c => {
          if (seen.has(c.time)) return false;
          seen.add(c.time);
          return true;
        });

        candleSeriesRef.current.setData(unique);
        volumeSeriesRef.current?.setData(
          unique.map(c => ({
            time:  c.time,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)',
          }))
        );
        lastCandleRef.current = unique[unique.length - 1] || null;
        chartRef.current?.timeScale().fitContent();
      } catch {}
    };

    load();
    return () => { active = false; };
  }, [symbol, interval]);

  // Update the last candle with live price every time currentPrice changes
  useEffect(() => {
    if (!candleSeriesRef.current || !currentPrice || !lastCandleRef.current) return;

    // Build an updated version of the last candle using live price
    const prev = lastCandleRef.current;
    const updated = {
      time:  prev.time,
      open:  prev.open,
      high:  Math.max(prev.high, currentPrice),
      low:   Math.min(prev.low,  currentPrice),
      close: currentPrice,
    };

    try {
      candleSeriesRef.current.update(updated);
      volumeSeriesRef.current?.update({
        time:  prev.time,
        value: prev.volume || 0,
        color: updated.close >= updated.open ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)',
      });
    } catch {}
  }, [currentPrice]);

  // Refresh full candle data every 15 seconds to get new candles
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!candleSeriesRef.current) return;
      try {
        const { data } = await marketAPI.getCandles(symbol, interval, 200);
        const seen = new Set();
        const unique = data.filter(c => {
          if (seen.has(c.time)) return false;
          seen.add(c.time);
          return true;
        });
        if (!candleSeriesRef.current) return;
        candleSeriesRef.current.setData(unique);
        volumeSeriesRef.current?.setData(
          unique.map(c => ({
            time:  c.time,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)',
          }))
        );
        lastCandleRef.current = unique[unique.length - 1] || null;
      } catch {}
    }, 15000);
    return () => clearInterval(timer);
  }, [symbol, interval]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// ─── Countdown Ring ────────────────────────────────────────────────────────
function CountdownRing({ secondsLeft, total }) {
  const r = 22, circ = 2 * Math.PI * r;
  const progress = Math.max(0, secondsLeft / total);
  const offset   = circ * (1 - progress);
  const color    = secondsLeft <= 5 ? '#f6465d' : secondsLeft <= 15 ? '#EE8267' : '#0ecb81';
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <circle cx="28" cy="28" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
      />
      <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="bold" fill={color}>
        {secondsLeft}
      </text>
    </svg>
  );
}

// ─── Order Modal ───────────────────────────────────────────────────────────
function OrderModal({ coin, direction, currentPrice, settings, balance, onConfirm, onClose }) {
  const [duration, setDuration] = useState(settings.expiryTimes?.[1] || 30);
  const [amount,   setAmount]   = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const isUp = direction === 'up';

  // Use per-duration win rate; fall back to global payoutRate
  const WIN_RATES_DEFAULT = { 20: 0.10, 30: 0.20, 60: 0.30, 90: 0.50, 180: 0.70 };
  const winRates = settings.winRates || WIN_RATES_DEFAULT;
  const currentRate = winRates[String(duration)] ?? winRates[duration] ?? settings.payoutRate ?? 0.85;
  const profit = amount ? (parseFloat(amount) * currentRate).toFixed(2) : '0.00';
  const profitPct = (currentRate * 100).toFixed(0);
  const quickAmounts = [10, 25, 50, 100, 200];

  const handleConfirm = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0)                         return setError('Please enter a valid amount');
    if (amt < (settings.minTradeAmount || 1))     return setError(`Minimum: $${settings.minTradeAmount}`);
    if (amt > (settings.maxTradeAmount || 1000))  return setError(`Maximum: $${settings.maxTradeAmount}`);
    if (amt > balance)                            return setError('Insufficient balance');
    setError('');
    setLoading(true);
    try {
      await onConfirm({ coin, direction, amount: amt, duration });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-4 sm:p-5 space-y-3 sm:space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f7fbfc 100%)',
          border: '1px solid rgba(64,191,201,0.18)',
          boxShadow: '0 28px 70px rgba(6, 28, 33, 0.34)',
        }}
      >

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-text-primary font-bold text-lg">{coin}/USDT</h3>
            <p className="text-text-muted text-xs mt-0.5">Confirm Order</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'rgba(13, 80, 86, 0.08)' }}
          >
            ✕
          </button>
        </div>

        {/* Direction badge */}
          <div className={`flex items-center gap-3 p-3 rounded-[1.15rem] ${isUp ? 'bg-green-trade/10 border border-green-trade/30' : 'bg-red-trade/10 border border-red-trade/30'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold ${isUp ? 'bg-green-trade/20 text-green-trade' : 'bg-red-trade/20 text-red-trade'}`}>
            {isUp ? '▲' : '▼'}
          </div>
          <div>
            <p className={`font-bold text-base ${isUp ? 'text-green-trade' : 'text-red-trade'}`}>
              {isUp ? 'Long / Buy Up' : 'Short / Sell Down'}
            </p>
            <p className="text-text-muted text-xs">
              Entry: ${currentPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </p>
          </div>
        </div>

        {/* Expiry time */}
        <div>
          <p className="text-text-muted text-xs mb-2 font-medium">Expiry Time</p>
          <div className="flex gap-2 flex-wrap">
            {(settings.expiryTimes || [30, 60, 90, 180]).map(t => (
              <button key={t} onClick={() => setDuration(t)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  duration === t ? (isUp ? 'bg-green-trade text-black' : 'bg-red-trade text-white')
                                 : 'text-text-muted hover:text-text-primary'
                }`}
                style={{ background: duration === t ? undefined : '#eef5f6' }}>
                {t < 60 ? `${t}s` : `${t / 60}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-text-muted text-xs font-medium">Amount (USDT)</p>
            <p className="text-text-muted text-xs">Balance: <span className="text-text-primary font-semibold">${balance?.toFixed(2)}</span></p>
          </div>
          <input type="number" value={amount}
            onChange={e => { setAmount(e.target.value); setError(''); }}
            placeholder={`Min $${settings.minTradeAmount || 1}`}
            className="input-field" />
          <div className="flex gap-1.5 mt-2 flex-wrap overflow-x-auto">
            {quickAmounts.map(q => (
              <button key={q} onClick={() => { setAmount(String(q)); setError(''); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                style={{ background: '#eef5f6' }}>
                ${q}
              </button>
            ))}
            <button onClick={() => { setAmount(String(Math.floor(balance * 100) / 100)); setError(''); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-brand-primary bg-brand-primary/10">
              Max
            </button>
          </div>
        </div>

        {parseFloat(amount) > 0 && (
          <div className="flex justify-between p-3 rounded-xl bg-light-input">
            <span className="text-text-muted text-sm">If Win:</span>
            <span className="text-green-trade font-bold text-sm">+${profit} profit</span>
          </div>
        )}

        {error && <p className="text-red-trade text-xs text-center">{error}</p>}

        <button onClick={handleConfirm} disabled={loading || !amount}
          className={`w-full py-4 rounded-full font-bold text-base transition-all active:scale-95 hover:-translate-y-0.5 ${
            isUp ? 'text-black' : 'text-white'
          } ${loading || !amount ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          style={{ background: isUp ? '#0ecb81' : '#f6465d' }}>
          {loading ? 'Placing...' : `Place ${isUp ? 'Long ▲' : 'Short ▼'} Order`}
        </button>

        <p className="text-center text-text-muted text-xs">
          Payout: <span className="text-text-primary font-semibold">{profitPct}%</span> profit on win
        </p>
      </div>
    </div>
  );
}

// ─── Result Modal ──────────────────────────────────────────────────────────
function ResultModal({ result, onClose }) {
  if (!result) return null;
  const won   = result.status === 'won';
  const color = won ? '#0ecb81' : '#f6465d';
  const isUp  = result.direction === 'up';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div
        className="w-full max-w-xs rounded-[2rem] p-5 text-center space-y-4 animate-slide-up sm:animate-scale-in"
        style={{
          border: `2px solid ${color}40`,
          background: 'linear-gradient(180deg, #ffffff 0%, #f7fbfc 100%)',
          boxShadow: '0 30px 70px rgba(6, 28, 33, 0.34)',
        }}
      >
        <p className="text-5xl">{won ? '🎉' : '😔'}</p>
        <p className="text-2xl font-bold" style={{ color }}>{won ? 'You Won!' : 'You Lost'}</p>

        <div className="space-y-2 text-sm rounded-xl p-4 bg-light-input">
          <div className="flex justify-between">
            <span className="text-text-muted">Pair</span>
            <span className="text-text-primary font-semibold">{result.coin}/USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Direction</span>
            <span style={{ color: isUp ? '#0ecb81' : '#f6465d' }} className="font-semibold">
              {isUp ? '▲ Long' : '▼ Short'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Entry Price</span>
            <span className="text-text-primary">${result.entryPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Close Price</span>
            <span className="text-text-primary">${result.closePrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Amount</span>
            <span className="text-text-primary">${result.amount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-light-border pt-2 mt-2">
            <span className="text-text-muted font-semibold">Result</span>
            <span className="font-bold text-base" style={{ color }}>
              {won ? `+$${result.profit?.toFixed(2)}` : `-$${result.amount?.toFixed(2)}`}
            </span>
          </div>
        </div>

        <button onClick={onClose}
          className="w-full py-3.5 rounded-full font-bold text-sm transition-all active:scale-95 hover:-translate-y-0.5"
          style={{ background: color, color: won ? '#000' : '#fff' }}>
          Continue Trading
        </button>
      </div>
    </div>
  );
}

// ─── Active Trade Card ─────────────────────────────────────────────────────
function ActiveTradeCard({ trade, currentPrice, onSettled }) {
  const [secsLeft, setSecsLeft] = useState(
    Math.max(0, Math.ceil((new Date(trade.expiresAt) - Date.now()) / 1000))
  );
  const settled = useRef(false);

  useEffect(() => {
    if (secsLeft <= 0) return;
    const t = setInterval(() => setSecsLeft(p => {
      const n = p - 1;
      if (n <= 0) { clearInterval(t); return 0; }
      return n;
    }), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (secsLeft > 0 || settled.current) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await binaryAPI.getActive();
        const still = (data.trades || []).find(t => t._id === trade._id);
        if (!still) {
          settled.current = true;
          clearInterval(interval);
          const hist = await binaryAPI.getHistory(1);
          const result = (hist.data.trades || []).find(t => t._id === trade._id);
          if (result) onSettled(result);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [secsLeft]);

  const isUp      = trade.direction === 'up';
  const pnl       = currentPrice ? (isUp ? currentPrice - trade.entryPrice : trade.entryPrice - currentPrice) : 0;
  const pnlPct    = trade.entryPrice ? (pnl / trade.entryPrice * 100) : 0;
  const isWinning = pnl > 0;

  return (
    <div
      className="rounded-[1.6rem] p-4"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%)',
        border: '1px solid rgba(64,191,201,0.16)',
        boxShadow: '0 16px 34px rgba(6, 28, 33, 0.08)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CountdownRing secondsLeft={secsLeft} total={trade.duration} />
          <div>
            <p className="text-text-primary font-semibold text-sm">{trade.coin}/USDT</p>
            <p className={`text-xs font-semibold mt-0.5 ${isUp ? 'text-green-trade' : 'text-red-trade'}`}>
              {isUp ? '▲ Long' : '▼ Short'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-text-primary font-bold">${trade.amount.toFixed(2)}</p>
          {currentPrice && (
            <p className={`text-xs font-semibold mt-0.5 ${isWinning ? 'text-green-trade' : 'text-red-trade'}`}>
              {isWinning ? '+' : ''}{pnlPct.toFixed(2)}%
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-between mt-3 text-xs text-text-muted gap-1 border-t border-[rgba(64,191,201,0.12)] pt-3">
        <span>Entry: <span className="text-text-primary">${trade.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
        <span>Now: <span className="text-text-primary">${currentPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '...'}</span></span>
        <span>Win: <span className="text-green-trade">+${(trade.amount * trade.payoutRate).toFixed(2)}</span></span>
      </div>
    </div>
  );
}

// ─── Interval selector ─────────────────────────────────────────────────────
const INTERVALS = [
  { label: '1m',  value: '1m'  },
  { label: '5m',  value: '5m'  },
  { label: '15m', value: '15m' },
  { label: '1h',  value: '1h'  },
  { label: '4h',  value: '4h'  },
];

const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE'];

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function BinaryTrade() {
  const { user, refreshUser } = useAuth();
  const { prices }            = useMarketPrices(3000);

  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [interval,     setInterval]     = useState('1m');
  const [settings,     setSettings]     = useState({
    tradingEnabled: true, payoutRate: 0.85, minTradeAmount: 1,
    maxTradeAmount: 1000, expiryTimes: [20, 30, 60, 90, 180], availablePairs: COINS,
  });
  const [modal,        setModal]        = useState(null);
  const [resultModal,  setResultModal]  = useState(null);
  const [activeTrades, setActiveTrades] = useState([]);
  const [history,      setHistory]      = useState([]);
  const [activeTab,    setActiveTab]    = useState('active');
  const [toast,        setToast]        = useState(null);

  const coinData     = prices[selectedCoin];
  const currentPrice = coinData?.price || 0;
  const change24h    = coinData?.change24h || 0;

  useEffect(() => {
    binaryAPI.getSettings().then(({ data }) => setSettings(data)).catch(() => {});
    loadActiveTrades();
    loadHistory();
  }, []);

  const loadActiveTrades = async () => {
    try { const { data } = await binaryAPI.getActive(); setActiveTrades(data.trades || []); } catch {}
  };

  const loadHistory = async () => {
    try { const { data } = await binaryAPI.getHistory(1); setHistory(data.trades || []); } catch {}
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePlaceTrade = async ({ coin, direction, amount, duration }) => {
    await binaryAPI.place({ coin, direction, amount, duration });
    setModal(null);
    showToast(`${coin} ${direction === 'up' ? '▲ Long' : '▼ Short'} — $${amount} placed!`);
    await loadActiveTrades();
    if (refreshUser) refreshUser();
  };

  const handleTradeSettled = result => {
    setResultModal(result);
    loadActiveTrades();
    loadHistory();
    if (refreshUser) refreshUser();
  };

  const availablePairs = settings.availablePairs || COINS;
  const balance        = user?.demo_balance || 0;

  if (!settings.tradingEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-6">
        <p className="text-5xl">🔧</p>
        <p className="text-text-primary font-bold text-xl">Trading Under Maintenance</p>
        <p className="text-text-muted text-sm">Temporarily unavailable. Please check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28 animate-fade-in px-0">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl max-w-sm text-center pointer-events-none"
          style={{ background: toast.type === 'success' ? '#0ecb81' : '#f6465d', color: '#000' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Balance strip ─────────────────────────────────────── */}
      <div
        className="rounded-[2rem] px-5 py-5 sm:px-6 sm:py-6"
        style={{ background: 'linear-gradient(135deg, #0E2026 0%, #145863 58%, #1f6f78 100%)' }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#71d4db]">Binary Trading</p>
            <h1 className="mt-2 text-white text-[1.9rem] leading-[1.05] font-semibold sm:text-[2.6rem]">
              Fixed-time trades with a cleaner CEX-style shell
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/68 sm:text-[15px]">
              Track live pairs, choose expiry, and manage active positions from one premium trading surface.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[290px]">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
              <p className="text-white/56 text-[11px] uppercase tracking-[0.22em]">Balance</p>
              <p className="mt-2 text-white font-bold text-lg sm:text-xl">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur text-right">
              <p className="text-white/56 text-[11px] uppercase tracking-[0.22em]">Win Profit</p>
              <p className="mt-2 text-[#ffd07d] font-bold text-lg sm:text-xl">{((settings.payoutRate || 0.85) * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-[1.8rem] p-3 sm:p-4"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%)',
          border: '1px solid rgba(64,191,201,0.14)',
          boxShadow: '0 16px 36px rgba(6, 28, 33, 0.08)',
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-text-muted">Pairs</p>
            <p className="text-sm font-semibold text-text-primary">Switch markets without leaving the trade view</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#eef5f6] px-3 py-1.5 text-xs text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3dc5ce]" />
            Live pricing
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {availablePairs.map(coin => {
          const p   = prices[coin];
          const chg = p?.change24h || 0;
          return (
            <button key={coin}
              onClick={() => setSelectedCoin(coin)}
              className={`flex-shrink-0 px-3 py-2.5 rounded-[1.15rem] transition-all ${selectedCoin === coin ? 'text-text-primary -translate-y-0.5' : 'text-text-muted hover:text-text-primary hover:-translate-y-0.5'}`}
              style={{
                background: selectedCoin === coin ? 'rgba(244,146,126,0.12)' : '#eef5f6',
                border: selectedCoin === coin ? '1px solid rgba(244,146,126,0.42)' : '1px solid rgba(13,80,86,0.08)',
                minWidth: 84,
              }}>
              <p className="text-xs font-bold">{coin}</p>
              <p className={`text-xs mt-0.5 ${chg >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
                {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
              </p>
            </button>
          );
        })}
        </div>
      </div>

      {/* ── Chart card ────────────────────────────────────────── */}
      <div className="rounded-[1.8rem] overflow-hidden" style={{ background: '#0E2026', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 22px 50px rgba(6, 28, 33, 0.24)' }}>

        {/* Price header */}
        <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-text-muted text-xs font-medium">{selectedCoin}/USDT</p>
            <p className="text-white font-bold text-xl sm:text-2xl mt-0.5 truncate">
              ${currentPrice ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
            </p>
            <p className={`text-xs sm:text-sm font-semibold mt-0.5 ${change24h >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
              {change24h >= 0 ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}% (24h)
            </p>
          </div>
          <div className="text-right flex-shrink-0 rounded-[1rem] bg-white/5 px-3 py-2">
            {coinData && <p className="text-text-muted text-xs">Vol: <span className="text-white">${(coinData.volume24h / 1e6).toFixed(1)}M</span></p>}
            <div className="flex items-center gap-1 justify-end mt-1">
              <div className="w-2 h-2 rounded-full bg-green-trade animate-pulse" />
              <span className="text-green-trade text-xs font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Interval selector */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {INTERVALS.map(({ label, value }) => (
            <button key={value}
              onClick={() => setInterval(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                interval === value ? 'text-white' : 'text-text-muted hover:text-white'
              }`}
              style={{ background: interval === value ? 'rgba(238,130,103,0.5)' : 'rgba(255,255,255,0.07)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Candlestick chart */}
        <div className="h-44 sm:h-64 px-1 pb-2">
          <CandlestickChart
            key={`${selectedCoin}_${interval}`}
            symbol={selectedCoin}
            interval={interval}
            currentPrice={currentPrice}
          />
        </div>
      </div>

      {/* ── UP / DOWN Buttons ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setModal('up')}
          disabled={!currentPrice}
          className="py-3.5 rounded-full flex items-center justify-center gap-1.5 font-bold text-sm transition-all active:scale-95 hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #0ecb81 0%, #06a860 100%)', color: '#000', boxShadow: '0 3px 12px rgba(14,203,129,0.3)' }}>
          <span className="text-base leading-none">▲</span>
          <span className="text-sm font-bold">Long / Up</span>
        </button>
        <button
          onClick={() => setModal('down')}
          disabled={!currentPrice}
          className="py-3.5 rounded-full flex items-center justify-center gap-1.5 font-bold text-sm transition-all active:scale-95 hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #f6465d 0%, #c9303f 100%)', color: '#fff', boxShadow: '0 3px 12px rgba(246,70,93,0.3)' }}>
          <span className="text-base leading-none">▼</span>
          <span className="text-sm font-bold">Short / Down</span>
        </button>
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-text-muted text-center">
        {[
          { label: 'Min',    value: `$${settings.minTradeAmount}`,                           color: 'text-text-primary' },
          { label: 'Payout', value: `${((settings.payoutRate||0.85)*100).toFixed(0)}%`,      color: 'text-brand-primary' },
          { label: 'Max',    value: `$${settings.maxTradeAmount}`,                           color: 'text-text-primary' },
          { label: 'Active', value: activeTrades.length,                                     color: 'text-brand-primary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-[1.2rem] p-3" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%)', border: '1px solid rgba(64,191,201,0.12)' }}>
            <p className={`font-bold ${color}`}>{value}</p>
            <p>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Trades Tabs ───────────────────────────────────────── */}
      <div>
        <div className="flex gap-1 p-1 rounded-full mb-3 bg-light-card border border-light-border">
          {['active', 'history'].map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all capitalize ${activeTab === tab ? 'bg-brand-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>
              {tab}
              {tab === 'active' && activeTrades.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-brand-primary text-white">
                  {activeTrades.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'active' ? (
          activeTrades.length === 0 ? (
            <div className="rounded-[1.8rem] border border-[rgba(64,191,201,0.12)] bg-white px-6 py-12 text-center text-text-muted shadow-[0_16px_34px_rgba(6,28,33,0.06)]">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm">No active trades</p>
              <p className="text-xs mt-1">Click Up or Down to start</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTrades.map(trade => (
                <ActiveTradeCard key={trade._id} trade={trade}
                  currentPrice={prices[trade.coin]?.price}
                  onSettled={handleTradeSettled} />
              ))}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div className="rounded-[1.8rem] border border-[rgba(64,191,201,0.12)] bg-white px-6 py-12 text-center text-text-muted shadow-[0_16px_34px_rgba(6,28,33,0.06)]">
              <p className="text-3xl mb-2">📈</p>
              <p className="text-sm">No trade history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(trade => {
                const won  = trade.status === 'won';
                const isUp = trade.direction === 'up';
                return (
                  <div
                    key={trade._id}
                    className="rounded-[1.6rem] p-4"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%)',
                      border: `1px solid ${won ? 'rgba(14,203,129,0.18)' : 'rgba(246,70,93,0.18)'}`,
                      boxShadow: '0 16px 34px rgba(6, 28, 33, 0.08)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${won ? 'bg-green-trade/20 text-green-trade' : 'bg-red-trade/20 text-red-trade'}`}>
                          {won ? '✓' : '✗'}
                        </div>
                        <div>
                          <p className="text-text-primary font-semibold text-sm">{trade.coin}/USDT</p>
                          <p className={`text-xs mt-0.5 ${isUp ? 'text-green-trade' : 'text-red-trade'}`}>
                            {isUp ? '▲ Long' : '▼ Short'} · {trade.duration}s
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${won ? 'text-green-trade' : 'text-red-trade'}`}>
                          {won ? `+$${trade.profit?.toFixed(2)}` : `-$${trade.amount?.toFixed(2)}`}
                        </p>
                        <p className="text-text-muted text-xs">${trade.amount?.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-between mt-2 text-xs text-text-muted gap-1">
                      <span>Entry: <span className="text-text-primary">${trade.entryPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
                      <span>Close: <span className="text-text-primary">${trade.closePrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
                      <span>{new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {modal && (
        <OrderModal coin={selectedCoin} direction={modal} currentPrice={currentPrice}
          settings={settings} balance={balance} onConfirm={handlePlaceTrade} onClose={() => setModal(null)} />
      )}

      {resultModal && (
        <ResultModal result={resultModal} onClose={() => setResultModal(null)} />
      )}
    </div>
  );
}
