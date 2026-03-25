const fetch = require('node-fetch');
const { getPrices } = require('../utils/priceService');

// GET /api/market/prices - public endpoint, no auth needed
const getPriceData = async (req, res) => {
  try {
    const prices = await getPrices();
    res.json({ prices, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market data.' });
  }
};

// Kline cache: { "BTCUSDT_1m": { data, lastFetch } }
const klineCache = {};

// GET /api/market/candles/:symbol?interval=1m&limit=100
const getCandles = async (req, res) => {
  try {
    const symbol   = (req.params.symbol || 'BTC').toUpperCase().replace('USDT', '') + 'USDT';
    const interval = req.query.interval || '1m';
    const limit    = Math.min(parseInt(req.query.limit) || 100, 300);
    const cacheKey = `${symbol}_${interval}`;
    const now      = Date.now();

    // Cache for 3 seconds (binary trade refresh rate)
    if (klineCache[cacheKey] && now - klineCache[cacheKey].lastFetch < 3000) {
      return res.json(klineCache[cacheKey].data);
    }

    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url, { timeout: 8000 });
    if (!response.ok) throw new Error(`Binance klines API ${response.status}`);
    const raw = await response.json();

    const candles = raw.map(k => ({
      time:  Math.floor(k[0] / 1000), // Unix seconds
      open:  parseFloat(k[1]),
      high:  parseFloat(k[2]),
      low:   parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    klineCache[cacheKey] = { data: candles, lastFetch: now };
    res.json(candles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getPriceData, getCandles };
