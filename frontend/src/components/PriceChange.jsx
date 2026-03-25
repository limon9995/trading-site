import React from 'react';

export default function PriceChange({ value, suffix = '%', className = '' }) {
  const isPositive = value >= 0;
  return (
    <span className={`font-medium ${isPositive ? 'text-green-trade' : 'text-red-trade'} ${className}`}>
      {isPositive ? '▲' : '▼'} {Math.abs(value).toFixed(2)}{suffix}
    </span>
  );
}
