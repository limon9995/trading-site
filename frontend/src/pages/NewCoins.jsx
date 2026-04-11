import React, { useState } from 'react';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { useTranslation } from 'react-i18next';

const PANEL = 'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';

const COIN_NAMES = {
  PEPE: 'Pepe', ARB: 'Arbitrum', OP: 'Optimism', APT: 'Aptos', NEAR: 'NEAR', FIL: 'Filecoin',
};

const COIN_COLORS = {
  PEPE: '#4caf50', ARB: '#28a0f0', OP: '#ff0420', APT: '#21C55D', NEAR: '#00c08b', FIL: '#0090ff',
};

// CoinGecko CDN — stable small-size logos
const COIN_LOGOS = {
  PEPE: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  ARB:  'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  OP:   'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
  APT:  'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  FIL:  'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
  WIF:  'https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg',
  JUP:  'https://assets.coingecko.com/coins/images/34188/small/jup.png',
  STRK: 'https://assets.coingecko.com/coins/images/26433/small/starknet.png',
  PYTH: 'https://assets.coingecko.com/coins/images/31924/small/pyth.png',
  TIA:  'https://assets.coingecko.com/coins/images/31967/small/tia.jpg',
  SEI:  'https://assets.coingecko.com/coins/images/28205/small/Sei_Logo_-_Transparent.png',
};

const NEW_COIN_SYMBOLS = ['PEPE', 'ARB', 'OP', 'APT', 'NEAR', 'FIL'];

const UPCOMING_COINS = [
  { symbol: 'WIF',  name: 'dogwifhat',    color: '#9945ff', launchDate: 'Apr 5, 2026',  description: 'Solana meme coin',       ieo: '$0.08', status: 'Coming Soon' },
  { symbol: 'JUP',  name: 'Jupiter',      color: '#00c9a7', launchDate: 'Apr 12, 2026', description: 'Solana DEX aggregator',  ieo: '$0.52', status: 'Coming Soon' },
  { symbol: 'STRK', name: 'Starknet',     color: '#ec796b', launchDate: 'Apr 20, 2026', description: 'Ethereum L2 scaling',    ieo: '$0.34', status: 'Coming Soon' },
  { symbol: 'PYTH', name: 'Pyth Network', color: '#7142cf', launchDate: 'May 1, 2026',  description: 'Oracle data network',    ieo: '$0.11', status: 'Upcoming'    },
  { symbol: 'TIA',  name: 'Celestia',     color: '#7B2FBE', launchDate: 'May 10, 2026', description: 'Modular blockchain',     ieo: '$2.80', status: 'Upcoming'    },
  { symbol: 'SEI',  name: 'Sei Network',  color: '#9d0208', launchDate: 'May 18, 2026', description: 'High-speed DeFi chain',  ieo: '$0.19', status: 'Upcoming'    },
];

// Coin avatar: real logo image with a graceful fallback to the first letter
function CoinAvatar({ symbol, color, size = 'w-11 h-11' }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const logoUrl = COIN_LOGOS[symbol];
  if (logoUrl && !imgFailed) {
    return (
      <div className={`${size} rounded-full overflow-hidden flex-shrink-0 border`}
        style={{ borderColor: color + '55', background: color + '18' }}>
        <img
          src={logoUrl}
          alt={symbol}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center text-base font-bold flex-shrink-0`}
      style={{ background: color + '25', border: `1px solid ${color}55`, color }}
    >
      {symbol[0]}
    </div>
  );
}

function formatPrice(price) {
  if (price === undefined || price === null) return '—';
  if (price < 0.0001) return price.toFixed(8);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 1000) return price.toFixed(2);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function NewCoins() {
  const { t } = useTranslation();
  const { prices } = useMarketPrices();
  const [tab, setTab] = useState('new');

  const newCoins = NEW_COIN_SYMBOLS.map(sym => prices[sym]).filter(Boolean);

  return (
    <div className="pb-2 space-y-4">
      <div className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0b2026_0%,#114850_48%,#1b6d71_100%)] px-6 py-7 text-white shadow-[0_28px_90px_rgba(8,32,38,0.28)] md:px-8">
        <h1 className="text-[34px] font-light tracking-[-0.03em]">{t('newCoins.title')}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/68 md:text-base">{t('newCoins.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className={`${PANEL} flex gap-2 rounded-[28px] p-1.5`}>
        <button
          onClick={() => setTab('new')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tab === 'new'
              ? 'bg-green-trade text-text-inverse shadow'
              : 'text-text-muted'
          }`}
        >
          🆕 {t('newCoins.newListing')}
        </button>
        <button
          onClick={() => setTab('upcoming')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tab === 'upcoming'
              ? 'bg-brand-yellow text-text-inverse shadow'
              : 'text-text-muted'
          }`}
        >
          🚀 {t('newCoins.upcoming')}
        </button>
      </div>

      {/* New Listing */}
      {tab === 'new' && (
        <div className="space-y-2">
          <p className="text-[11px] text-text-muted">{t('newCoins.recentlyListed')}</p>
          {newCoins.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-light-card/50 rounded-xl animate-pulse" />
            ))
          ) : (
            newCoins.map(coin => {
              const change = coin.change24h || 0;
              const isUp = change >= 0;
              const color = COIN_COLORS[coin.symbol] || '#0075bb';
              return (
                <div
                  key={coin.symbol}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: color + '10', border: `1px solid ${color}35` }}
                >
                  {/* Icon */}
                  <CoinAvatar symbol={coin.symbol} color={color} />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-text-primary">{coin.symbol}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-trade/25 text-green-trade uppercase tracking-wide">NEW</span>
                    </div>
                    <p className="text-[11px] text-text-muted">{COIN_NAMES[coin.symbol]}</p>
                  </div>
                  {/* Price + change */}
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary">${formatPrice(coin.price)}</p>
                    <span className={`text-xs font-semibold ${isUp ? 'text-green-trade' : 'text-red-trade'}`}>
                      {isUp ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Upcoming */}
      {tab === 'upcoming' && (
        <div className="space-y-2">
          <p className="text-[11px] text-text-muted">{t('newCoins.comingSoon')}</p>
          {UPCOMING_COINS.map(coin => (
            <div
              key={coin.symbol}
              className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ background: coin.color + '0d', border: `1px solid ${coin.color}30` }}
            >
              {/* Icon */}
              <CoinAvatar symbol={coin.symbol} color={coin.color} />
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-text-primary">{coin.symbol}</p>
                  <span className="text-[10px] text-text-muted">· {coin.name}</span>
                </div>
                <p className="text-[10px] text-text-muted">{coin.description}</p>
              </div>
              {/* Right */}
              <div className="text-right flex-shrink-0 space-y-0.5">
                <p className="text-xs font-semibold text-text-primary">IEO {coin.ieo}</p>
                <p className="text-[10px] text-text-muted">{coin.launchDate}</p>
                <div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    coin.status === 'Coming Soon'
                      ? 'bg-brand-yellow/20 text-brand-yellow'
                      : 'bg-brand-primary/20 text-brand-primary'
                  }`}>
                    {coin.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
