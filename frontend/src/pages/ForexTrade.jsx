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
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', textColor: '#848e9c', timeVisible: true, rightOffset: 5 },
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
        const { data } = await marketAPI.getCandles(symbol, interval, 1000);
        if (!active || !candleSeriesRef.current) return;
        const seen = new Set();
        const unique = data.filter(c => { if (seen.has(c.time)) return false; seen.add(c.time); return true; });
        candleSeriesRef.current.setData(unique);
        volSeriesRef.current?.setData(unique.map(c => ({
          time: c.time, value: c.volume,
          color: c.close >= c.open ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)',
        })));
        lastCandleRef.current = unique[unique.length - 1] || null;
        chartRef.current?.timeScale().scrollToRealTime();
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
        const { data } = await marketAPI.getCandles(symbol, interval, 1000);
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
  const [tab,        setTab]        = useState('chart');
  const [toast,      setToast]      = useState(null);

  const coinData     = prices[coin];
  const currentPrice = coinData?.price || 0;
  const change24h    = coinData?.change24h || 0;
  const balance      = user?.demo_balance || 0;
  const marketStats = [
    { label: '24h High', value: coinData?.high24h ? coinData.high24h.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '---' },
    { label: '24h Low', value: coinData?.low24h ? coinData.low24h.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '---' },
    { label: '24h Volume', value: coinData?.volume24h ? `${(coinData.volume24h / 1e6).toFixed(2)}M` : '---' },
  ];

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
    <div className="space-y-4 pb-40">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl text-sm font-bold shadow-xl pointer-events-none text-center"
          style={{ background: toast.type === 'success' ? '#0ecb81' : '#f6465d', color: '#000', minWidth: 200 }}>
          {toast.msg}
        </div>
      )}

      <div
        className="overflow-hidden rounded-[2rem]"
        style={{
          background: 'linear-gradient(180deg, #07151a 0%, #0b1e24 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 22px 50px rgba(6, 28, 33, 0.28)',
        }}
      >
        <div className="border-b border-white/6 px-4 pb-4 pt-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full bg-white/6 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                  onClick={() => setTab('chart')}
                >
                  {coin}/USDT
                </button>
                <span className={`text-sm font-semibold ${change24h >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
                  {change24h >= 0 ? '+' : '-'}{Math.abs(change24h).toFixed(2)}%
                </span>
              </div>
              <p className="mt-3 text-[2rem] font-bold leading-none text-white sm:text-[2.6rem]">
                ${currentPrice ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
              </p>
              <p className="mt-2 text-sm text-white/58">
                Balance ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} · Open {positions.length} position{positions.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-green-trade/30 bg-green-trade/10 px-3 py-1 text-xs font-semibold text-green-trade">
                <span className="h-1.5 w-1.5 rounded-full bg-green-trade animate-pulse" />
                Live
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {COINS.map(c => {
              const chg = prices[c]?.change24h || 0;
              const active = coin === c;
              return (
                <button
                  key={c}
                  onClick={() => setCoin(c)}
                  className={`flex-shrink-0 rounded-[1rem] border px-3 py-2 text-left transition-all ${active ? '-translate-y-0.5' : 'hover:-translate-y-0.5'}`}
                  style={{
                    minWidth: 88,
                    background: active ? 'rgba(238,130,103,0.14)' : 'rgba(255,255,255,0.05)',
                    borderColor: active ? 'rgba(238,130,103,0.35)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <p className={`text-sm font-bold ${active ? 'text-[#EE8267]' : 'text-white'}`}>{c}</p>
                  <p className={`mt-1 text-xs font-medium ${chg >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2 border-b border-white/6 pb-3 text-sm">
            {[
              { id: 'chart', label: 'Chart' },
              { id: 'positions', label: `Positions${positions.length ? ` (${positions.length})` : ''}` },
              { id: 'history', label: 'History' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-2 font-semibold transition-all ${tab === item.id ? 'bg-white text-[#091318]' : 'text-white/56 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

        </div>

        {tab === 'chart' && (
          <>
            <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-3 scrollbar-hide sm:px-5">
              {INTERVALS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setInterval(value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    interval === value ? 'bg-[#EE8267] text-[#fff]' : 'bg-white/6 text-white/60 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="h-[420px] px-1 pb-2 sm:h-[540px] lg:h-[680px]">
              <CandlestickChart key={`${coin}_${interval}`} symbol={coin} interval={interval} currentPrice={currentPrice} />
            </div>
          </>
        )}

        {tab === 'positions' && (
          <div className="px-4 py-4 sm:px-5">
            {positions.length === 0 ? (
              <div className="rounded-[1.8rem] border border-white/10 bg-white/4 px-6 py-12 text-center text-white/56">
                <p className="mb-2 text-3xl">📉</p>
                <p className="text-sm">No open positions</p>
                <p className="mt-1 text-xs">Place a Buy or Sell order from the trade dock below.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {positions.map(pos => (
                  <PositionCard key={pos._id} trade={pos} currentPrice={prices[pos.coin]?.price} onClose={handleClose} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="px-4 py-4 sm:px-5">
            {history.length === 0 ? (
              <div className="rounded-[1.8rem] border border-white/10 bg-white/4 px-6 py-12 text-center text-white/56">
                <p className="mb-2 text-3xl">📊</p>
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
            )}
          </div>
        )}
      </div>

      <div
        className="sticky bottom-20 z-30 rounded-[2rem] border border-white/8 px-3 py-3 backdrop-blur-xl sm:bottom-6 sm:px-4"
        style={{ background: 'rgba(7, 21, 26, 0.92)', boxShadow: '0 24px 50px rgba(6, 28, 33, 0.3)' }}
      >
        <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
          <div className="rounded-[1rem] bg-white/6 px-3 py-2">
            <p className="text-white/38">Leverage</p>
            <p className="mt-1 font-semibold text-[#EE8267]">{leverage}x</p>
          </div>
          <div className="rounded-[1rem] bg-white/6 px-3 py-2">
            <p className="text-white/38">Margin</p>
            <p className="mt-1 font-semibold text-white">${amount || '0'}</p>
          </div>
          <div className="rounded-[1rem] bg-white/6 px-3 py-2">
            <p className="text-white/38">Open</p>
            <p className="mt-1 font-semibold text-white">{positions.length}</p>
          </div>
        </div>

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

        <div className="mt-3">
          <p className="mb-2 text-xs text-white/42">Leverage</p>
          <div className="flex gap-1.5 flex-wrap">
            {LEVERAGE_OPTIONS.map(lev => (
              <button key={lev} onClick={() => setLeverage(lev)}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: leverage === lev ? '#EE8267' : 'rgba(255,255,255,0.06)',
                  color: leverage === lev ? '#1b1302' : 'rgba(255,255,255,0.72)',
                }}>
                {lev}x
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex justify-between">
            <p className="text-xs text-white/42">Margin (USDT)</p>
            <p className="text-xs text-white/42">Balance: <span className="font-semibold text-white">${balance.toFixed(2)}</span></p>
          </div>
          <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError(''); }}
            placeholder="Enter margin amount"
            className="w-full rounded-[1.15rem] border border-white/8 bg-white/6 px-4 py-3.5 text-sm font-semibold text-white outline-none placeholder:text-white/26" />
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {[10, 25, 50, 100, 200].map(q => (
              <button key={q} onClick={() => { setAmount(String(q)); setError(''); }}
                className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-medium text-white/68 transition-colors hover:text-white">
                ${q}
              </button>
            ))}
            <button onClick={() => { setAmount(String(Math.floor(balance * 100) / 100)); setError(''); }}
              className="rounded-full bg-[#EE8267]/14 px-3 py-1.5 text-xs font-medium text-[#EE8267]">
              Max
            </button>
          </div>
        </div>

        {parseFloat(amount) > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-[1.15rem] border border-white/8 bg-white/6 p-3 text-xs">
            <div>
              <p className="text-white/42">Position Size</p>
              <p className="font-bold text-white">${(parseFloat(amount) * leverage).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-white/42">Leverage</p>
              <p className="font-bold text-[#EE8267]">{leverage}x</p>
            </div>
          </div>
        )}

        <button onClick={() => setShowSlTp(p => !p)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-[#EE8267]">
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
          className="mt-3 w-full py-3.5 rounded-full font-bold text-sm transition-all active:scale-95 hover:-translate-y-0.5 disabled:opacity-50"
          style={{
            background: !tradeType ? 'rgba(255,255,255,0.1)'
              : tradeType === 'buy' ? 'linear-gradient(135deg,#0ecb81,#06a860)'
              : 'linear-gradient(135deg,#f6465d,#c9303f)',
            color: tradeType === 'buy' ? '#000' : !tradeType ? '#51636b' : '#fff',
          }}>
          {loading ? 'Opening...' : !tradeType ? 'Select Buy or Sell' : `Open ${tradeType === 'buy' ? '▲ Long' : '▼ Short'} · ${leverage}x`}
        </button>
      </div>
    </div>
  );
}
