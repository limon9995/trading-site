import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketPrices } from '../hooks/useMarketPrices';

const COIN_NAMES = {
  BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB', SOL: 'Solana', XRP: 'XRP',
  DOGE: 'Dogecoin', ADA: 'Cardano', MATIC: 'Polygon', DOT: 'Polkadot', LINK: 'Chainlink',
  AVAX: 'Avalanche', UNI: 'Uniswap', LTC: 'Litecoin', ATOM: 'Cosmos', TRX: 'TRON',
  FIL: 'Filecoin', NEAR: 'NEAR', APT: 'Aptos', OP: 'Optimism', ARB: 'Arbitrum',
  SAND: 'The Sandbox', MANA: 'Decentraland', CHZ: 'Chiliz', SHIB: 'Shiba Inu', PEPE: 'Pepe',
};

const COIN_COLORS = {
  BTC: '#f7931a', ETH: '#627eea', BNB: '#f3ba2f', SOL: '#9945ff', XRP: '#00aae4',
  DOGE: '#c2a633', ADA: '#0033ad', MATIC: '#8247e5', DOT: '#e6007a', LINK: '#2a5ada',
  AVAX: '#e84142', UNI: '#ff007a', LTC: '#345d9d', ATOM: '#2e3148', TRX: '#eb0029',
  FIL: '#0090ff', NEAR: '#00c08b', APT: '#21C55D', OP: '#ff0420', ARB: '#28a0f0',
  SAND: '#04adef', MANA: '#ff2d55', CHZ: '#cd0124', SHIB: '#ffa409', PEPE: '#4caf50',
};

const NEW_COIN_SYMBOLS = ['PEPE', 'ARB', 'OP', 'APT', 'NEAR', 'FIL'];

function formatPrice(price) {
  if (price === undefined || price === null) return '—';
  if (price < 0.0001) return price.toFixed(8);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 1000) return price.toFixed(2);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatVolume(v) {
  if (!v) return '—';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

export default function Trading() {
  const { prices, loading } = useMarketPrices();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const coins = useMemo(() => {
    let list = Object.values(prices).filter(c => c && c.price != null);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.symbol.toLowerCase().includes(q) ||
        (COIN_NAMES[c.symbol] || '').toLowerCase().includes(q)
      );
    }
    if (filter === 'Gainers') list = list.filter(c => (c.change24h || 0) > 0).sort((a, b) => b.change24h - a.change24h);
    else if (filter === 'Losers') list = list.filter(c => (c.change24h || 0) < 0).sort((a, b) => a.change24h - b.change24h);
    return list;
  }, [prices, filter, search]);

  return (
    <div className="space-y-5 pb-2">
      <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#0b2026_0%,#134952_52%,#1b6d71_100%)] px-5 py-4 text-white shadow-[0_20px_50px_rgba(8,32,38,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#97e4e5]">
              Live Markets
            </span>
            <h1 className="mt-1.5 text-[18px] font-light leading-[1.15] tracking-[-0.02em] md:text-[22px]">
              Explore the market like an exchange terminal, not a plain list.
            </h1>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Assets</p>
              <p className="mt-2 text-[28px] font-semibold text-white">{coins.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Gainers</p>
              <p className="mt-2 text-[28px] font-semibold text-white">{Object.values(prices).filter((c) => (c?.change24h || 0) > 0).length}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">Refresh</p>
              <p className="mt-2 text-[28px] font-semibold text-white">30s</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-[#d9e6e7] bg-white p-5 shadow-[0_24px_80px_rgba(8,35,41,0.08)]">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search coins..."
          className="w-full rounded-[22px] border border-[#d7e4e5] bg-[#f7fbfb] pl-9 pr-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-brand-primary/60"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs">✕</button>
        )}
      </div>

      <div className="flex gap-2">
        {['All', 'Gainers', 'Losers'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              filter === f
                ? 'bg-[#ee8267] text-white shadow-[0_12px_28px_rgba(238,130,103,0.22)]'
                : 'border border-[#d7e4e5] bg-[#f7fbfb] text-[#5a7377] hover:-translate-y-0.5'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto text-xs text-text-muted self-center">{coins.length} coins</div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-2 border-b border-light-border/40 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#789094]">
        <span>Coin</span>
        <span className="text-right">Price</span>
        <span className="text-right w-16">24h %</span>
      </div>

      <div className="space-y-0.5">
        {loading && coins.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-light-card/50 rounded-xl animate-pulse" />
          ))
        ) : coins.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm">No coins found</div>
        ) : (
          coins.map(coin => {
            const change = coin.change24h || 0;
            const isUp = change >= 0;
            const color = COIN_COLORS[coin.symbol] || '#0075bb';
            const isNew = NEW_COIN_SYMBOLS.includes(coin.symbol);
            return (
              <button
                key={coin.symbol}
                onClick={() => navigate(`/trading/${coin.symbol}`)}
                className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 rounded-[22px] px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:bg-[#f6fbfb] hover:shadow-[0_14px_30px_rgba(8,35,41,0.06)] active:bg-light-card"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: color + '22', border: `1px solid ${color}55`, color }}
                  >
                    {coin.symbol[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-text-primary leading-tight">{coin.symbol}</p>
                      {isNew && (
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-green-trade/20 text-green-trade uppercase leading-none">NEW</span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted truncate leading-tight">{COIN_NAMES[coin.symbol] || coin.coinId}</p>
                    <p className="text-[10px] text-text-muted/60 leading-tight">{formatVolume(coin.volume24h)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">${formatPrice(coin.price)}</p>
                </div>
                <div className="w-16 text-right">
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md ${
                    isUp ? 'bg-green-trade/15 text-green-trade' : 'bg-red-trade/15 text-red-trade'
                  }`}>
                    {isUp ? '+' : ''}{change.toFixed(2)}%
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
      </div>

      {!loading && coins.length > 0 && (
        <p className="text-center text-[10px] text-text-muted/40 pt-2">
          Prices update every 30s · Binance
        </p>
      )}
    </div>
  );
}
