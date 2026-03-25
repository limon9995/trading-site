import React, { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from its previous value to a new value.
 * Highlights green/red briefly when value changes.
 */
export default function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2, className = '' }) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(null); // 'up' | 'down' | null
  const prevRef = useRef(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const prev = prevRef.current;
    const next = value;
    if (prev === next) return;

    setFlash(next > prev ? 'up' : 'down');
    setTimeout(() => setFlash(null), 800);

    // Animate count from prev → next over 600ms
    const start = performance.now();
    const duration = 600;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(prev + (next - prev) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(next);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    prevRef.current = next;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const flashClass = flash === 'up'
    ? 'text-green-trade'
    : flash === 'down'
    ? 'text-red-trade'
    : '';

  return (
    <span className={`transition-colors duration-300 ${flashClass || className}`}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}
