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
      <div className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0b2026_0%,#114850_48%,#1b6d71_100%)] px-6 py-7 text-white shadow-[0_28px_90px_rgba(8,32,38,0.28)] md:px-8">
        <h1 className="text-[34px] font-light tracking-[-0.03em]">Trading desk</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/68 md:text-base">Binary and forex tabs now sit inside the same exchange-style shell as the rest of the platform.</p>
      </div>
      {/* Tab switcher — sticky on mobile */}
      <div className="sticky top-0 z-20 mb-3 flex gap-1 rounded-[28px] border border-[#d9e6e7] bg-white p-1.5 shadow-[0_18px_50px_rgba(8,35,41,0.07)]">
        <button
          onClick={() => setTab('binary')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[22px] py-3 text-xs font-bold transition-all active:scale-95"
          style={{
            background: tab === 'binary' ? 'linear-gradient(135deg,#0E2026,#185B64)' : 'transparent',
            color: tab === 'binary' ? '#fff' : '#566367',
            boxShadow: tab === 'binary' ? '0 3px 10px rgba(14,32,38,0.2)' : 'none',
          }}>
          <span>⚡</span>
          <span>Binary</span>
        </button>
        <button
          onClick={() => setTab('forex')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[22px] py-3 text-xs font-bold transition-all active:scale-95"
          style={{
            background: tab === 'forex' ? 'linear-gradient(135deg,#EE8267,#E55D4E)' : 'transparent',
            color: tab === 'forex' ? '#fff' : '#566367',
            boxShadow: tab === 'forex' ? '0 3px 10px rgba(238,130,103,0.3)' : 'none',
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
