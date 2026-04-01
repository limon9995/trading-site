import { useState, useEffect, useRef } from 'react';
import { createChart, CrosshairMode, LineStyle, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { useAuth } from '../context/AuthContext';
import { marketAPI } from '../services/api';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(c => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const forexAPI = {
  open:    (d) => API.post('/forex/open', d),
  close:   (id) => API.post(`/forex/close/${id}`),
  getOpen: ()  => API.get('/forex/open'),
  history: ()  => API.get('/forex/history'),
};

// ── Candlestick Chart ────────────────────────────────────────────────────────
function CandlestickChart({ symbol, interval, currentPrice }) {
  const containerRef    = useRef(null);
  const chartRef        = useRef(null);
  const candleSeriesRef = useRef(null);
  const volSeriesRef    = useRef(null);
  const lastCandleRef   = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: { background: { color: 'transparent' }, textColor: '#848e9c' },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#848e9c', style: LineStyle.Dashed, labelBackgroundColor: '#0E2026' },
        horzLine: { color: '#848e9c', style: LineStyle.Dashed, labelBackgroundColor: '#0E2026' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)', textColor: '#848e9c' },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', textColor: '#848e9c', timeVisible: true },
      handleScroll: true, handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81', downColor: '#f6465d',
      borderUpColor: '#0ecb81', borderDownColor: '#f6465d',
      wickUpColor: '#0ecb81', wickDownColor: '#f6465d',
    });
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' }, priceScaleId: 'vol', color: 'rgba(14,203,129,0.2)',
    });
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    chartRef.current        = chart;
    candleSeriesRef.current = candleSeries;
    volSeriesRef.current    = volSeries;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current) return;
    let active = true;
    const load = async () => {
      try {
        const { data } = await marketAPI.getCandles(symbol, interval, 200);
        if (!active || !candleSeriesRef.current) return;
        const seen = new Set();
        const unique = data.filter(c => { if (seen.has(c.time)) return false; seen.add(c.time); return true; });
        candleSeriesRef.current.setData(unique);
        volSeriesRef.current?.setData(unique.map(c => ({
          time: c.time, value: c.volume,
          color: c.close >= c.open ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)',
        })));
        lastCandleRef.current = unique[unique.length - 1] || null;
        chartRef.current?.timeScale().fitContent();
      } catch {}
    };
    load();
    return () => { active = false; };
  }, [symbol, interval]);

  useEffect(() => {
    if (!candleSeriesRef.current || !currentPrice || !lastCandleRef.current) return;
    const prev = lastCandleRef.current;
    const updated = { time: prev.time, open: prev.open, high: Math.max(prev.high, currentPrice), low: Math.min(prev.low, currentPrice), close: currentPrice };
    try {
      candleSeriesRef.current.update(updated);
      volSeriesRef.current?.update({ time: prev.time, value: prev.volume || 0, color: updated.close >= updated.open ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)' });
    } catch {}
  }, [currentPrice]);

  useEffect(() => {
    const t = setInterval(async () => {
      if (!candleSeriesRef.current) return;
      try {
        const { data } = await marketAPI.getCandles(symbol, interval, 200);
        const seen = new Set();
        const unique = data.filter(c => { if (seen.has(c.time)) return false; seen.add(c.time); return true; });
        if (!candleSeriesRef.current) return;
        candleSeriesRef.current.setData(unique);
        volSeriesRef.current?.setData(unique.map(c => ({ time: c.time, value: c.volume, color: c.close >= c.open ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)' })));
        lastCandleRef.current = unique[unique.length - 1] || null;
      } catch {}
    }, 15000);
    return () => clearInterval(t);
  }, [symbol, interval]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// ── Open Position Card ───────────────────────────────────────────────────────
function PositionCard({ trade, currentPrice, onClose }) {
  const isBuy    = trade.type === 'buy';
  const priceDiff = (currentPrice || trade.entryPrice) - trade.entryPrice;
  const direction = isBuy ? 1 : -1;
  const pnl      = (priceDiff / trade.entryPrice) * trade.positionSize * direction;
  const pnlPct   = (pnl / trade.amount) * 100;
  const isProfit = pnl >= 0;
  const [closing, setClosing] = useState(false);

  const handleClose = async () => {
    setClosing(true);
    try { await onClose(trade._id); } finally { setClosing(false); }
  };

  return (
    <div
      className="rounded-[1.6rem] p-4"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%)',
        border: `1px solid ${isProfit ? 'rgba(14,203,129,0.22)' : 'rgba(246,70,93,0.22)'}`,
        boxShadow: '0 16px 34px rgba(6, 28, 33, 0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 rounded-lg text-xs font-bold ${isBuy ? 'bg-green-trade/20 text-green-trade' : 'bg-red-trade/20 text-red-trade'}`}>
            {isBuy ? '▲ BUY' : '▼ SELL'}
          </div>
          <span className="text-text-primary font-semibold text-sm">{trade.coin}/USDT</span>
          <span className="text-text-muted text-xs">{trade.leverage}x</span>
        </div>
        <button onClick={handleClose} disabled={closing}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: 'rgba(246,70,93,0.15)', color: '#f6465d', border: '1px solid rgba(246,70,93,0.3)' }}>
          {closing ? '...' : 'Close'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-xs">
        <div>
          <p className="text-text-muted">Margin</p>
          <p className="text-text-primary font-semibold">${trade.amount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-text-muted">Entry</p>
          <p className="text-text-primary font-semibold">${trade.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-text-muted">Current</p>
          <p className="text-text-primary font-semibold">${(currentPrice || trade.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(64,191,201,0.12)]">
        <div className="text-xs text-text-muted">
          Size: <span className="text-text-primary">${trade.positionSize.toFixed(2)}</span>
          {trade.takeProfit && <span className="ml-2">TP: <span className="text-green-trade">${trade.takeProfit}</span></span>}
          {trade.stopLoss   && <span className="ml-2">SL: <span className="text-red-trade">${trade.stopLoss}</span></span>}
        </div>
        <div className={`font-bold text-sm ${isProfit ? 'text-green-trade' : 'text-red-trade'}`}>
          {isProfit ? '+' : ''}{pnl.toFixed(2)} ({pnlPct.toFixed(1)}%)
        </div>
      </div>
    </div>
  );
}

// ── Order Panel ──────────────────────────────────────────────────────────────
const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100];
const INTERVALS = [{ label: '1m', value: '1m' }, { label: '5m', value: '5m' }, { label: '15m', value: '15m' }, { label: '1h', value: '1h' }, { label: '4h', value: '4h' }];
const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX'];

export default function ForexTrade() {
  const { user, refreshUser } = useAuth();
  const { prices }            = useMarketPrices(3000);

  const [coin,       setCoin]       = useState('BTC');
  const [interval,   setInterval]   = useState('1m');
  const [tradeType,  setTradeType]  = useState(null); // 'buy' | 'sell'
  const [leverage,   setLeverage]   = useState(10);
  const [amount,     setAmount]     = useState('');
  const [stopLoss,   setStopLoss]   = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [showSlTp,   setShowSlTp]   = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [positions,  setPositions]  = useState([]);
  const [history,    setHistory]    = useState([]);
  const [tab,        setTab]        = useState('positions');
  const [toast,      setToast]      = useState(null);

  const coinData     = prices[coin];
  const currentPrice = coinData?.price || 0;
  const change24h    = coinData?.change24h || 0;
  const balance      = user?.demo_balance || 0;

  useEffect(() => { loadPositions(); loadHistory(); }, []);

  const loadPositions = async () => {
    try { const { data } = await forexAPI.getOpen(); setPositions(data.trades || []); } catch {}
  };
  const loadHistory = async () => {
    try { const { data } = await forexAPI.history(); setHistory(data.trades || []); } catch {}
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpen = async () => {
    const amt = parseFloat(amount);
    if (!tradeType)           return setError('Select Buy or Sell first');
    if (!amt || amt <= 0)     return setError('Enter a valid amount');
    if (amt > balance)        return setError('Insufficient balance');
    if (!currentPrice)        return setError('Price not available');
    setError(''); setLoading(true);
    try {
      await forexAPI.open({
        coin, type: tradeType, amount: amt, leverage,
        stopLoss:    stopLoss    ? parseFloat(stopLoss)    : undefined,
        takeProfit:  takeProfit  ? parseFloat(takeProfit)  : undefined,
      });
      showToast(`${coin} ${tradeType === 'buy' ? '▲ Buy' : '▼ Sell'} opened · ${leverage}x`);
      setAmount(''); setStopLoss(''); setTakeProfit(''); setTradeType(null);
      await loadPositions();
      if (refreshUser) refreshUser();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  };

  const handleClose = async (id) => {
    try {
      await forexAPI.close(id);
      showToast('Position closed');
      await loadPositions(); await loadHistory();
      if (refreshUser) refreshUser();
    } catch (e) { showToast(e.response?.data?.error || 'Failed', 'error'); }
  };

  return (
    <div className="space-y-4 pb-28">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl text-sm font-bold shadow-xl pointer-events-none text-center"
          style={{ background: toast.type === 'success' ? '#0ecb81' : '#f6465d', color: '#000', minWidth: 200 }}>
          {toast.msg}
        </div>
      )}

      {/* Balance */}
      <div
        className="rounded-[2rem] px-5 py-5 sm:px-6 sm:py-6"
        style={{ background: 'linear-gradient(135deg, #0E2026 0%, #145863 58%, #1f6f78 100%)' }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#71d4db]">Forex Trading</p>
            <h1 className="mt-2 text-white text-[1.9rem] leading-[1.05] font-semibold sm:text-[2.6rem]">
              Leveraged positions in the same premium exchange shell
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/68 sm:text-[15px]">
              Open buy or sell positions, manage leverage, and monitor PnL from a cleaner unified interface.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[290px]">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
              <p className="text-white/56 text-[11px] uppercase tracking-[0.22em]">Balance</p>
              <p className="mt-2 text-white font-bold text-lg sm:text-xl">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur text-right">
              <p className="text-white/56 text-[11px] uppercase tracking-[0.22em]">Open Positions</p>
              <p className="mt-2 text-[#ffd07d] font-bold text-lg sm:text-xl">{positions.length}</p>
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
            <p className="text-[11px] uppercase tracking-[0.24em] text-text-muted">Markets</p>
            <p className="text-sm font-semibold text-text-primary">Rotate major pairs and keep the same order flow</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#eef5f6] px-3 py-1.5 text-xs text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3dc5ce]" />
            Live pricing
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {COINS.map(c => {
          const p = prices[c]; const chg = p?.change24h || 0;
          return (
            <button key={c} onClick={() => setCoin(c)}
              className={`flex-shrink-0 px-3 py-2.5 rounded-[1.15rem] transition-all ${coin === c ? 'text-text-primary -translate-y-0.5' : 'text-text-muted hover:text-text-primary hover:-translate-y-0.5'}`}
              style={{ background: coin === c ? 'rgba(244,146,126,0.12)' : '#eef5f6', border: coin === c ? '1px solid rgba(244,146,126,0.42)' : '1px solid rgba(13,80,86,0.08)', minWidth: 82 }}>
              <p className="text-xs font-bold">{c}</p>
              <p className={`text-xs mt-0.5 ${chg >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</p>
            </button>
          );
        })}
        </div>
      </div>

      {/* Chart card */}
      <div className="rounded-[2rem] overflow-hidden" style={{ background: '#0E2026', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 22px 50px rgba(6, 28, 33, 0.24)' }}>
        {/* Price header */}
        <div className="flex flex-col gap-4 px-4 pt-4 pb-3 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:pt-5">
          <div className="min-w-0">
            <p className="text-sm text-text-muted">{coin}/USDT · Forex</p>
            <p className="truncate text-[2rem] font-bold text-white sm:text-[2.4rem] lg:text-[2.8rem]">
              ${currentPrice ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
            </p>
            <p className={`mt-1 text-sm font-semibold sm:text-lg ${change24h >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
              {change24h >= 0 ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}% (24h)
            </p>
          </div>
          <div className="flex-shrink-0 rounded-[1.15rem] bg-white/5 px-4 py-3 sm:min-w-[160px]">
            {coinData && <p className="text-sm text-text-muted sm:text-base">Vol: <span className="font-semibold text-white">${(coinData.volume24h / 1e6).toFixed(1)}M</span></p>}
            <div className="mt-2 flex items-center gap-2 justify-start sm:justify-end">
              <div className="h-2.5 w-2.5 rounded-full bg-green-trade animate-pulse" />
              <span className="text-sm text-green-trade">Live</span>
            </div>
          </div>
        </div>

        {/* Interval selector */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide sm:px-5">
          {INTERVALS.map(({ label, value }) => (
            <button key={value} onClick={() => setInterval(value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${interval === value ? 'text-white' : 'text-text-muted hover:text-white'}`}
              style={{ background: interval === value ? 'rgba(238,130,103,0.5)' : 'rgba(255,255,255,0.07)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-[320px] px-2 pb-3 sm:h-[420px] lg:h-[560px]">
          <CandlestickChart key={`${coin}_${interval}`} symbol={coin} interval={interval} currentPrice={currentPrice} />
        </div>
      </div>

      {/* ── Order Panel ──────────────────────────────────────────── */}
      <div
        className="rounded-[1.8rem] p-4 space-y-4"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%)',
          border: '1px solid rgba(64,191,201,0.14)',
          boxShadow: '0 16px 36px rgba(6, 28, 33, 0.08)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-text-muted">Place Order</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">Choose direction, leverage, and optional protection</p>
          </div>
          <div className="rounded-full bg-[#eef5f6] px-3 py-1.5 text-xs font-medium text-text-secondary">
            Margin mode
          </div>
        </div>

        {/* Buy / Sell */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setTradeType('buy')}
            className="py-3.5 rounded-full text-sm font-bold transition-all active:scale-95 hover:-translate-y-0.5"
            style={{
              background: tradeType === 'buy' ? 'linear-gradient(135deg,#0ecb81,#06a860)' : 'rgba(14,203,129,0.1)',
              color: tradeType === 'buy' ? '#000' : '#0ecb81',
              border: '1px solid rgba(14,203,129,0.4)',
              boxShadow: tradeType === 'buy' ? '0 4px 16px rgba(14,203,129,0.3)' : 'none',
            }}>
            ▲ Buy / Long
          </button>
          <button onClick={() => setTradeType('sell')}
            className="py-3.5 rounded-full text-sm font-bold transition-all active:scale-95 hover:-translate-y-0.5"
            style={{
              background: tradeType === 'sell' ? 'linear-gradient(135deg,#f6465d,#c9303f)' : 'rgba(246,70,93,0.1)',
              color: tradeType === 'sell' ? '#fff' : '#f6465d',
              border: '1px solid rgba(246,70,93,0.4)',
              boxShadow: tradeType === 'sell' ? '0 4px 16px rgba(246,70,93,0.3)' : 'none',
            }}>
            ▼ Sell / Short
          </button>
        </div>

        {/* Leverage */}
        <div>
          <p className="text-text-muted text-xs mb-2">Leverage</p>
          <div className="flex gap-1.5 flex-wrap">
            {LEVERAGE_OPTIONS.map(lev => (
              <button key={lev} onClick={() => setLeverage(lev)}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: leverage === lev ? '#0075bb' : '#eef5f6',
                  color: leverage === lev ? '#fff' : '#51636b',
                }}>
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="flex justify-between mb-1.5">
            <p className="text-text-muted text-xs">Amount (USDT)</p>
            <p className="text-text-muted text-xs">Balance: <span className="text-white font-semibold">${balance.toFixed(2)}</span></p>
          </div>
          <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError(''); }}
            placeholder="Enter margin amount"
            className="w-full px-4 py-3.5 rounded-[1.15rem] text-text-primary text-sm font-semibold outline-none"
            style={{ background: '#eef5f6', border: '1px solid rgba(13,80,86,0.08)' }} />
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {[10, 25, 50, 100, 200].map(q => (
              <button key={q} onClick={() => { setAmount(String(q)); setError(''); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                style={{ background: '#eef5f6' }}>
                ${q}
              </button>
            ))}
            <button onClick={() => { setAmount(String(Math.floor(balance * 100) / 100)); setError(''); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-yellow-700"
              style={{ background: 'rgba(252,213,53,0.1)' }}>
              Max
            </button>
          </div>
        </div>

        {/* Position size preview */}
        {parseFloat(amount) > 0 && (
          <div className="grid grid-cols-2 gap-2 p-3 rounded-[1.15rem] text-xs" style={{ background: '#eef5f6', border: '1px solid rgba(13,80,86,0.08)' }}>
            <div>
              <p className="text-text-muted">Position Size</p>
              <p className="text-text-primary font-bold">${(parseFloat(amount) * leverage).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-text-muted">Leverage</p>
              <p className="text-yellow-400 font-bold">{leverage}x</p>
            </div>
          </div>
        )}

        {/* SL / TP toggle */}
        <button onClick={() => setShowSlTp(p => !p)}
          className="text-xs text-brand-primary flex items-center gap-1 font-medium">
          {showSlTp ? '▲' : '▼'} {showSlTp ? 'Hide' : 'Add'} Stop Loss / Take Profit
        </button>

        {showSlTp && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-text-muted text-xs mb-1">Stop Loss</p>
              <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)}
                placeholder="Price"
                className="w-full px-3 py-2.5 rounded-[1.1rem] text-text-primary text-sm outline-none"
                style={{ background: 'rgba(246,70,93,0.07)', border: '1px solid rgba(246,70,93,0.22)' }} />
            </div>
            <div>
              <p className="text-text-muted text-xs mb-1">Take Profit</p>
              <input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)}
                placeholder="Price"
                className="w-full px-3 py-2.5 rounded-[1.1rem] text-text-primary text-sm outline-none"
                style={{ background: 'rgba(14,203,129,0.07)', border: '1px solid rgba(14,203,129,0.22)' }} />
            </div>
          </div>
        )}

        {error && <p className="text-red-trade text-xs text-center">{error}</p>}

        <button onClick={handleOpen} disabled={loading || !tradeType || !amount}
          className="w-full py-3.5 rounded-full font-bold text-sm transition-all active:scale-95 hover:-translate-y-0.5 disabled:opacity-50"
          style={{
            background: !tradeType ? 'rgba(255,255,255,0.1)'
              : tradeType === 'buy' ? 'linear-gradient(135deg,#0ecb81,#06a860)'
              : 'linear-gradient(135deg,#f6465d,#c9303f)',
            color: tradeType === 'buy' ? '#000' : !tradeType ? '#51636b' : '#fff',
          }}>
          {loading ? 'Opening...' : !tradeType ? 'Select Buy or Sell' : `Open ${tradeType === 'buy' ? '▲ Long' : '▼ Short'} · ${leverage}x`}
        </button>
      </div>

      {/* ── Positions / History Tabs ──────────────────────────────── */}
      <div>
        <div className="flex gap-1 p-1 rounded-full mb-3 bg-light-card border border-light-border">
          {['positions', 'history'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold capitalize transition-all ${tab === t ? 'text-white' : 'text-text-muted'}`}
              style={{ background: tab === t ? 'rgba(0,117,187,0.72)' : 'transparent' }}>
              {t === 'positions' ? `Positions${positions.length > 0 ? ` (${positions.length})` : ''}` : 'History'}
            </button>
          ))}
        </div>

        {tab === 'positions' ? (
          positions.length === 0 ? (
            <div className="rounded-[1.8rem] border border-[rgba(64,191,201,0.12)] bg-white px-6 py-12 text-center text-text-muted shadow-[0_16px_34px_rgba(6,28,33,0.06)]">
              <p className="text-3xl mb-2">📉</p>
              <p className="text-sm">No open positions</p>
              <p className="text-xs mt-1">Place a Buy or Sell order above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {positions.map(pos => (
                <PositionCard key={pos._id} trade={pos}
                  currentPrice={prices[pos.coin]?.price}
                  onClose={handleClose} />
              ))}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div className="rounded-[1.8rem] border border-[rgba(64,191,201,0.12)] bg-white px-6 py-12 text-center text-text-muted shadow-[0_16px_34px_rgba(6,28,33,0.06)]">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm">No trade history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(trade => {
                const won = trade.pnl >= 0;
                const isBuy = trade.type === 'buy';
                return (
                  <div key={trade._id} className="rounded-[1.6rem] p-4"
                    style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%)', border: `1px solid ${won ? 'rgba(14,203,129,0.18)' : 'rgba(246,70,93,0.18)'}`, boxShadow: '0 16px 34px rgba(6, 28, 33, 0.08)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-0.5 rounded-lg text-xs font-bold ${isBuy ? 'bg-green-trade/20 text-green-trade' : 'bg-red-trade/20 text-red-trade'}`}>
                          {isBuy ? '▲ BUY' : '▼ SELL'}
                        </div>
                        <div>
                          <p className="text-text-primary font-semibold text-sm">{trade.coin}/USDT</p>
                          <p className="text-text-muted text-xs">{trade.leverage}x · {trade.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${won ? 'text-green-trade' : 'text-red-trade'}`}>
                          {won ? '+' : ''}{trade.pnl?.toFixed(2)} USDT
                        </p>
                        <p className="text-text-muted text-xs">${trade.amount?.toFixed(2)} margin</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-between mt-2 text-xs text-text-muted gap-1">
                      <span>Entry: <span className="text-text-primary">${trade.entryPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
                      <span>Close: <span className="text-text-primary">${trade.closePrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
                      <span>{new Date(trade.closedAt || trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
