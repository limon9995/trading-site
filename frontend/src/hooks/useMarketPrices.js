import { useState, useEffect, useRef } from 'react';
import { marketAPI } from '../services/api';

/**
 * Polls market prices every 30 seconds.
 * Returns { prices, loading, error }
 */
export function useMarketPrices(intervalMs = 30000) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const fetchPrices = async () => {
    try {
      const { data } = await marketAPI.getPrices();
      setPrices(data?.prices && typeof data.prices === 'object' ? data.prices : {});
      setError(null);
    } catch (err) {
      setPrices({});
      setError('Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    timerRef.current = setInterval(fetchPrices, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [intervalMs]);

  return { prices, loading, error, refetch: fetchPrices };
}
