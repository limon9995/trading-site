import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChart, CrosshairMode, LineStyle, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { binaryAPI, marketAPI } from '../services/api';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

// ─── Candlestick Chart Component ──────────────────────────────────────────
function CandlestickChart({ symbol, interval, currentPrice }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const lastCandleRef   = useRef(null);
  const [showJump, setShowJump] = useState(false);

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
        rightOffset: 5,
        lockVisibleTimeRangeOnResize: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
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

    // Show jump button when user scrolls away from latest
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (!range || !candleSeriesRef.current) return;
      try {
        const barsInfo = candleSeriesRef.current.barsInLogicalRange(range);
        if (barsInfo && barsInfo.barsBefore < -3) {
          setShowJump(true);
        } else {
          setShowJump(false);
        }
      } catch {}
    });

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
        const { data } = await marketAPI.getCandles(symbol, interval, 1000);
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
        chartRef.current?.timeScale().applyOptions({ barSpacing: 8 });
        chartRef.current?.timeScale().scrollToRealTime();
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
        const { data } = await marketAPI.getCandles(symbol, interval, 1000);
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

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {showJump && (
        <button
          onClick={() => { chartRef.current?.timeScale().scrollToRealTime(); }}
          className="absolute bottom-10 right-3 z-10 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
          style={{ background: '#EE8267', color: '#fff', boxShadow: '0 4px 14px rgba(238,130,103,0.4)' }}
        >
          ›› Latest
        </button>
      )}
    </div>
  );
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
  const { t }                 = useTranslation();
  const { user, refreshUser } = useAuth();
  const { prices }            = useMarketPrices(3000);
  const navigate              = useNavigate();

  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [interval,     setInterval]     = useState('1m');
  const [settings,     setSettings]     = useState({
    tradingEnabled: true, maintenanceMode: false, payoutRate: 0.85, minTradeAmount: 1,
    maxTradeAmount: Infinity, expiryTimes: [20, 30, 60, 90, 180], availablePairs: COINS,
  });
  const [resultModal,  setResultModal]  = useState(null);
  const [activeTrades, setActiveTrades] = useState([]);
  const [history,      setHistory]      = useState([]);
  const [tradeView,    setTradeView]    = useState('active');
  const [toast,        setToast]        = useState(null);
  const [duration,     setDuration]     = useState(null);
  const [amount,       setAmount]       = useState('');
  const [tradeError,   setTradeError]   = useState('');
  const [placing,      setPlacing]      = useState(false);

  const coinData     = prices[selectedCoin];
  const currentPrice = coinData?.price || 0;
  const change24h    = coinData?.change24h || 0;

  useEffect(() => {
    binaryAPI.getSettings().then(({ data }) => {
      setSettings(data);
      if (data.expiryTimes?.length > 0) setDuration(data.expiryTimes[1] || data.expiryTimes[0]);
    }).catch(() => {});
    loadActiveTrades();
    loadHistory();
    if (refreshUser) refreshUser();
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

  const handlePlaceDirect = async (direction) => {
    const amt = parseFloat(amount);
    if (!duration) return setTradeError('Select a duration');
    if (!amt || amt <= 0) return setTradeError('Enter a valid amount');
    if (amt < (settings.minTradeAmount || 1)) return setTradeError(`Minimum $${settings.minTradeAmount || 1}`);
    if (amt > balance) return setTradeError('Insufficient balance');
    setTradeError('');
    setPlacing(true);
    try {
      await binaryAPI.place({ coin: selectedCoin, direction, amount: amt, duration });
      showToast(`${selectedCoin} ${direction === 'up' ? '▲ Up' : '▼ Down'} — $${amt} placed!`);
      setAmount('');
      await loadActiveTrades();
      if (refreshUser) refreshUser();
    } catch (e) {
      setTradeError(e.response?.data?.error || e.message || 'Failed to place trade');
    } finally {
      setPlacing(false);
    }
  };

  const handleTradeSettled = result => {
    setResultModal(result);
    loadActiveTrades();
    loadHistory();
    if (refreshUser) refreshUser();
  };

  const availablePairs = settings.availablePairs || COINS;
  const balance        = user?.demo_balance || 0;
  const marketStats = [
    { label: '24h High', value: coinData?.high24h ? coinData.high24h.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '---' },
    { label: '24h Low', value: coinData?.low24h ? coinData.low24h.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '---' },
    { label: '24h Volume', value: coinData?.volume24h ? `${(coinData.volume24h / 1e6).toFixed(2)}M` : '---' },
  ];

  if (!settings.tradingEnabled || settings.maintenanceMode) {
    return (
      <div className="animate-fade-in space-y-4 px-0 pb-20">
        <div
          className="relative overflow-hidden rounded-[2rem] px-5 py-6 sm:px-6 sm:py-7"
          style={{ background: 'linear-gradient(135deg, #2a1407 0%, #6e3d12 54%, #b86d17 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-[#ffd088]/15 blur-2xl" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ffd088]">Trading Status</p>
              <h1 className="mt-2 text-white text-[1.9rem] leading-[1.05] font-semibold sm:text-[2.6rem]">
                Trading is temporarily paused
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/72 sm:text-[15px]">
                Admin has turned on maintenance mode. New binary trades are blocked for now until operations resume.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/12 bg-white/8 px-5 py-4 text-white/92 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">Current Status</p>
              <p className="mt-2 text-xl font-bold text-[#ffd088]">Maintenance Mode</p>
              <p className="mt-1 text-xs text-white/62">Please check back later.</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-[1.8rem] border p-6 sm:p-8"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%)',
            borderColor: 'rgba(184,109,23,0.16)',
            boxShadow: '0 16px 36px rgba(6, 28, 33, 0.08)',
          }}
        >
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#fff3ea] text-4xl shadow-[0_18px_40px_rgba(184,109,23,0.12)]">
              🔧
            </div>
            <h2 className="mt-5 text-[1.6rem] font-semibold tracking-[-0.03em] text-text-primary">
              Binary trading is under maintenance
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary sm:text-[15px]">
              You can still browse the app, but opening new binary positions is disabled while admin performs updates.
              Once maintenance is turned off, this screen will disappear automatically.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.3rem] border border-light-border bg-[#f7fbfb] px-4 py-4 text-left">
                <p className="text-[11px] uppercase tracking-[0.22em] text-text-muted">New Trades</p>
                <p className="mt-2 text-sm font-semibold text-red-trade">Blocked</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">No new binary orders can be opened right now.</p>
              </div>
              <div className="rounded-[1.3rem] border border-light-border bg-[#f7fbfb] px-4 py-4 text-left">
                <p className="text-[11px] uppercase tracking-[0.22em] text-text-muted">Reason</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">Admin maintenance</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">This usually means updates or checks are being applied.</p>
              </div>
              <div className="rounded-[1.3rem] border border-light-border bg-[#f7fbfb] px-4 py-4 text-left">
                <p className="text-[11px] uppercase tracking-[0.22em] text-text-muted">Action</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">Wait and retry later</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">The page will work again automatically after maintenance is turned off.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-full border border-light-border bg-[#f7fbfb] px-5 py-3 text-sm font-semibold text-text-primary transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                Back To Dashboard
              </button>
              <button
                onClick={() => navigate('/wallet')}
                className="rounded-full bg-[#EE8267] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(238,130,103,0.28)] transition-all hover:-translate-y-0.5"
              >
                Go To Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in px-0 pb-6">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 max-w-sm -translate-x-1/2 rounded-2xl px-4 py-3 text-center text-sm font-semibold shadow-xl pointer-events-none"
          style={{ background: toast.type === 'success' ? '#0ecb81' : '#f6465d', color: '#000' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Chart Card ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[1.6rem]"
        style={{ background: 'linear-gradient(180deg, #07151a 0%, #0b1e24 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Coin tabs */}
        <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-2 scrollbar-hide border-b border-white/6">
          {availablePairs.map(coin => {
            const chg = prices[coin]?.change24h || 0;
            const active = selectedCoin === coin;
            return (
              <button key={coin} onClick={() => setSelectedCoin(coin)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                style={{
                  background: active ? '#EE8267' : 'rgba(255,255,255,0.07)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                }}>
                {coin}
                <span className={`${chg >= 0 ? 'text-green-trade' : 'text-red-trade'}`} style={active ? { opacity: 0.85 } : {}}>
                  {chg >= 0 ? '+' : ''}{chg.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Price + interval row */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">
              {currentPrice ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
            </span>
            <span className={`text-xs font-semibold ${change24h >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          </div>
          <div className="flex gap-1">
            {INTERVALS.map(({ label, value }) => (
              <button key={value} onClick={() => setInterval(value)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: interval === value ? '#EE8267' : 'rgba(255,255,255,0.07)',
                  color: interval === value ? '#fff' : 'rgba(255,255,255,0.55)',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[420px] px-1 pb-2 sm:h-[540px] lg:h-[680px]">
          <CandlestickChart key={`${selectedCoin}_${interval}`} symbol={selectedCoin} interval={interval} currentPrice={currentPrice} />
        </div>
      </div>

      {/* ── Short Term Trade Panel ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-[1.6rem]"
        style={{ background: 'linear-gradient(180deg, #0d1f26 0%, #0a1a20 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
          <div className="flex items-center gap-2">
            <span className="text-[#EE8267] text-base">⏱</span>
            <span className="text-white font-bold text-base">{t('trade.shortTermTrade')}</span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(238,130,103,0.14)', color: '#EE8267', border: '1px solid rgba(238,130,103,0.28)' }}>
            {selectedCoin}/USDT
          </span>
        </div>

        <div className="p-4 space-y-3">
          {/* Available Balance */}
          <div className="flex items-center justify-between rounded-[0.9rem] px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 text-white/55 text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
              <span>{t('trade.availableBalance')}</span>
            </div>
            <span className="text-white font-bold text-sm">{balance.toFixed(2)} USDT</span>
          </div>

          {/* Current Price */}
          <div className="flex items-center justify-between rounded-[0.9rem] px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-white/55 text-sm">Current Price</span>
            <span className="text-white font-bold text-xl">
              ${currentPrice ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
            </span>
          </div>

          {/* Select Duration */}
          <div>
            <p className="text-white/45 text-xs mb-2">{t('trade.selectDuration')}</p>
            <div className="flex gap-2 flex-wrap">
              {(settings.expiryTimes || [20, 30, 60, 90, 180]).map(t => (
                <button key={t} onClick={() => setDuration(t)}
                  className="px-4 py-2 rounded-[0.75rem] text-sm font-semibold transition-all active:scale-95"
                  style={{
                    background: duration === t ? '#EE8267' : 'rgba(255,255,255,0.07)',
                    color: duration === t ? '#fff' : 'rgba(255,255,255,0.65)',
                    border: duration === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}>
                  {t < 60 ? `${t}s` : `${t / 60}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className="text-white/45 text-xs mb-2">Amount (USDT)</p>
            <div className="flex items-center gap-2 rounded-[0.9rem] px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <input type="number" value={amount}
                onChange={e => { setAmount(e.target.value); setTradeError(''); }}
                placeholder="Enter amount"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/28" />
              <button onClick={() => { setAmount(String(Math.floor(balance * 100) / 100)); setTradeError(''); }}
                className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(238,130,103,0.18)', color: '#EE8267' }}>
                ALL
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              {[10, 25, 50, 100].map(q => (
                <button key={q} onClick={() => { setAmount(String(q)); setTradeError(''); }}
                  className="flex-1 py-2 rounded-[0.75rem] text-xs font-semibold transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  ${q}
                </button>
              ))}
            </div>
          </div>

          {tradeError && <p className="text-red-trade text-xs text-center">{tradeError}</p>}

          {/* Up / Down */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button onClick={() => handlePlaceDirect('up')} disabled={placing || !currentPrice}
              className="py-4 rounded-[1.1rem] font-bold text-base transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #0ecb81 0%, #06a860 100%)', color: '#02160c' }}>
              ↑ {t('trade.up')}
            </button>
            <button onClick={() => handlePlaceDirect('down')} disabled={placing || !currentPrice}
              className="py-4 rounded-[1.1rem] font-bold text-base transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #7b1a28 0%, #5e1220 100%)', color: '#fff' }}>
              ↓ {t('trade.down')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Active / History ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[1.6rem]"
        style={{ background: 'linear-gradient(180deg, #07151a 0%, #0b1e24 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-2 px-4 pt-3 pb-2 border-b border-white/6">
          {[
            { id: 'active', label: `${t('trade.active')}${activeTrades.length ? ` (${activeTrades.length})` : ''}` },
            { id: 'history', label: t('trade.history') },
          ].map(t => (
            <button key={t.id} onClick={() => setTradeView(t.id)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={tradeView === t.id ? { background: '#fff', color: '#091318' } : { color: 'rgba(255,255,255,0.45)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tradeView === 'active' && (
          <div className="px-4 py-4">
            {activeTrades.length === 0 ? (
              <div className="py-10 text-center text-white/40">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm">{t('trade.noActiveTrades')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeTrades.map(trade => (
                  <ActiveTradeCard key={trade._id} trade={trade} currentPrice={prices[trade.coin]?.price} onSettled={handleTradeSettled} />
                ))}
              </div>
            )}
          </div>
        )}

        {tradeView === 'history' && (
          <div className="px-4 py-4">
            {history.length === 0 ? (
              <div className="py-10 text-center text-white/40">
                <p className="text-3xl mb-2">📈</p>
                <p className="text-sm">No trade history</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(trade => {
                  const won = trade.status === 'won';
                  const isUp = trade.direction === 'up';
                  return (
                    <div key={trade._id} className="rounded-[1.4rem] p-4"
                      style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%)',
                        border: `1px solid ${won ? 'rgba(14,203,129,0.18)' : 'rgba(246,70,93,0.18)'}`,
                      }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold ${won ? 'bg-green-trade/20 text-green-trade' : 'bg-red-trade/20 text-red-trade'}`}>
                            {won ? '✓' : '✗'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{trade.coin}/USDT</p>
                            <p className={`mt-0.5 text-xs ${isUp ? 'text-green-trade' : 'text-red-trade'}`}>
                              {isUp ? '↑ Up' : '↓ Down'} · {trade.duration}s
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${won ? 'text-green-trade' : 'text-red-trade'}`}>
                            {won ? `+$${trade.profit?.toFixed(2)}` : `-$${trade.amount?.toFixed(2)}`}
                          </p>
                          <p className="text-xs text-text-muted">${trade.amount?.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap justify-between gap-1 text-xs text-text-muted">
                        <span>Entry: <span className="text-text-primary">${trade.entryPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
                        <span>Close: <span className="text-text-primary">${trade.closePrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
                        <span>{new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {resultModal && <ResultModal result={resultModal} onClose={() => setResultModal(null)} />}
    </div>
  );
}
