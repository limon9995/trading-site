import { Suspense, lazy, useState } from 'react';

const BinaryTrade = lazy(() => import('./BinaryTrade'));
const ForexTrade = lazy(() => import('./ForexTrade'));

const InlineTradeLoader = ({ label }) => (
  <div className="rounded-[30px] border border-[#d9e6e7] bg-white px-6 py-12 text-center shadow-[0_18px_50px_rgba(8,35,41,0.07)]">
    <div className="mx-auto h-10 w-10 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
    <p className="mt-4 text-sm text-text-secondary">{label}</p>
  </div>
);

export default function TradePage() {
  const [tab, setTab] = useState('binary');

  return (
    <div className="w-full max-w-7xl mx-auto px-0 space-y-4">
      <div className="sticky top-0 z-20 mb-3 flex gap-1 rounded-[28px] border border-white/8 bg-[#09171c]/92 p-1.5 backdrop-blur-xl shadow-[0_18px_50px_rgba(8,35,41,0.16)]">
        <button
          onClick={() => setTab('binary')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[22px] py-3 text-xs font-bold transition-all active:scale-95"
          style={{
            background: tab === 'binary' ? 'linear-gradient(135deg,#f0b90b,#da9d08)' : 'transparent',
            color: tab === 'binary' ? '#1d1402' : 'rgba(255,255,255,0.58)',
            boxShadow: tab === 'binary' ? '0 10px 24px rgba(240,185,11,0.22)' : 'none',
          }}>
          <span>⚡</span>
          <span>Binary</span>
        </button>
        <button
          onClick={() => setTab('forex')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[22px] py-3 text-xs font-bold transition-all active:scale-95"
          style={{
            background: tab === 'forex' ? 'linear-gradient(135deg,#0e2026,#175963)' : 'transparent',
            color: tab === 'forex' ? '#fff' : 'rgba(255,255,255,0.58)',
            boxShadow: tab === 'forex' ? '0 10px 24px rgba(14,32,38,0.24)' : 'none',
          }}>
          <span>📈</span>
          <span>Forex</span>
        </button>
      </div>

      <Suspense fallback={<InlineTradeLoader label={`Loading ${tab} trading...`} />}>
        {tab === 'binary' ? <BinaryTrade /> : <ForexTrade />}
      </Suspense>
    </div>
  );
}
