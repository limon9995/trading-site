import React from 'react';

export const SkeletonLine = ({ w = 'w-full', h = 'h-4' }) => (
  <div className={`skeleton ${w} ${h}`} />
);

export const SkeletonCard = ({ lines = 3, className = '' }) => (
  <div className={`card p-6 space-y-3.5 ${className}`}>
    <SkeletonLine w="w-1/3" h="h-3" />
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine key={i} w={i % 2 === 0 ? 'w-full' : 'w-3/4'} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="card overflow-hidden">
    <div className="border-b border-light-border px-5 py-3.5 flex gap-4">
      {['w-20', 'w-16', 'w-24', 'w-20', 'w-16'].map((w, i) => (
        <SkeletonLine key={i} w={w} h="h-3" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-5 py-4 border-b border-light-border/50 flex gap-4 items-center">
        <div className="w-8 h-8 skeleton rounded-full" />
        {['w-24', 'w-20', 'w-28', 'w-20'].map((w, j) => (
          <SkeletonLine key={j} w={w} h="h-3" />
        ))}
      </div>
    ))}
  </div>
);
