const fetch = require('node-fetch');

// Symbols to fetch (Binance USDT pairs) — 25+ coins
const SYMBOLS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP',
  'DOGE', 'ADA', 'MATIC', 'DOT', 'LINK',
  'AVAX', 'UNI', 'LTC', 'ATOM', 'TRX',
  'FIL', 'NEAR', 'APT', 'OP', 'ARB',
  'SAND', 'MANA', 'CHZ', 'SHIB', 'PEPE',
];

// Map symbol -> CoinGecko ID (kept for coinId field in responses)
const COIN_MAP = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  BNB:  'binancecoin',
  SOL:  'solana',
  XRP:  'ripple',
  ADA:  'cardano',
  DOGE: 'dogecoin',
  MATIC:'matic-network',
  DOT:  'polkadot',
  LINK: 'chainlink',
  AVAX: 'avalanche-2',
  UNI:  'uniswap',
  LTC:  'litecoin',
  ATOM: 'cosmos',
  TRX:  'tron',
  FIL:  'filecoin',
  NEAR: 'near',
  APT:  'aptos',
  OP:   'optimism',
  ARB:  'arbitrum',
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  CHZ:  'chiliz',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
};

// Cache
let priceCache = {};
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Fetch all prices from Binance public API (no key required)
 */
const getPrices = async () => {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL && Object.keys(priceCache).length > 0) {
    return priceCache;
  }

  try {
    // Fetch 24hr ticker stats for all USDT pairs at once
    const url = 'https://api.binance.com/api/v3/ticker/24hr';
    const res = await fetch(url, { timeout: 8000 });
    if (!res.ok) throw new Error(`Binance API ${res.status}`);
    const data = await res.json();

    // Build a quick lookup map: "BTCUSDT" -> ticker
    const tickerMap = {};
    for (const ticker of data) {
      tickerMap[ticker.symbol] = ticker;
    }

    const prices = {};
    for (const symbol of SYMBOLS) {
      const ticker = tickerMap[`${symbol}USDT`];
      if (ticker) {
        const price = parseFloat(ticker.lastPrice);
        const change24h = parseFloat(ticker.priceChangePercent);
        const volume24h = parseFloat(ticker.quoteVolume); // in USDT
        if (typeof price === 'number' && !isNaN(price)) {
          prices[symbol] = {
            symbol,
            coinId: COIN_MAP[symbol],
            price,
            change24h: isNaN(change24h) ? 0 : change24h,
            marketCap: 0, // Binance doesn't provide market cap
            volume24h: isNaN(volume24h) ? 0 : volume24h,
          };
        }
      }
    }

    if (Object.keys(prices).length === 0) throw new Error('No valid prices from Binance');
    priceCache = prices;
    lastFetch = now;
    console.log(`Prices updated from Binance (${Object.keys(prices).length} coins)`);
    return prices;
  } catch (error) {
    console.error('Binance price fetch error:', error.message);
    if (Object.keys(priceCache).length > 0) {
      console.log('Using cached prices');
      return priceCache;
    }
    console.log('Using fallback prices');
    return generateFallbackPrices();
  }
};

/**
 * Get price for a single coin symbol
 */
const getCoinPrice = async (symbol) => {
  const prices = await getPrices();
  return prices[symbol.toUpperCase()] || null;
};

/**
 * Realistic fallback prices (used only if API is completely unreachable)
 */
const generateFallbackPrices = () => {
  const base = {
    BTC:  84000, ETH:  1600,  BNB:   590,  SOL:  130,  XRP:   2.10,
    ADA:   0.68, DOGE:  0.17, MATIC: 0.22, DOT:  4.0,  LINK:  13,
    AVAX:  19,   UNI:   5.5,  LTC:   83,   ATOM: 4.5,  TRX:   0.24,
    FIL:   3.8,  NEAR:  2.1,  APT:   6.5,  OP:   1.4,  ARB:   0.55,
    SAND:  0.27, MANA:  0.25, CHZ:   0.065,SHIB: 0.00001, PEPE: 0.0000075,
  };
  const result = {};
  for (const [symbol, price] of Object.entries(base)) {
    result[symbol] = {
      symbol,
      coinId: COIN_MAP[symbol],
      price,
      change24h: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
      marketCap: 0,
      volume24h: price * 1e7,
    };
  }
  return result;
};

module.exports = { getPrices, getCoinPrice, COIN_MAP, SYMBOLS };
