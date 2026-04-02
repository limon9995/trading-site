import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { planAPI, walletAPI } from '../services/api';
import { SkeletonCard } from '../components/SkeletonCard';

const PLAN_PANEL =
  'rounded-[30px] border border-[#d9e6e7] bg-white shadow-[0_24px_80px_rgba(8,35,41,0.08)]';

// VIP Level styles
const LEVEL_STYLES = {
  level1: {
    gradient: 'from-blue-600/30 via-blue-500/10 to-transparent',
    border: 'border-blue-500/40 hover:border-blue-400/70',
    activeBorder: 'border-blue-400',
    glow: '0 0 24px rgba(59,130,246,0.18)',
    badge: 'VIP 1',
    badgeBg: 'bg-blue-500',
    icon: '💎',
    levelColor: 'text-blue-400',
    priceColor: 'text-blue-300',
    statColor: 'text-blue-400',
    ring: '#3b82f6',
  },
  level2: {
    gradient: 'from-purple-600/30 via-purple-500/10 to-transparent',
    border: 'border-purple-500/40 hover:border-purple-400/70',
    activeBorder: 'border-purple-400',
    glow: '0 0 24px rgba(168,85,247,0.18)',
    badge: 'VIP 2',
    badgeBg: 'bg-purple-500',
    icon: '👑',
    levelColor: 'text-purple-400',
    priceColor: 'text-purple-300',
    statColor: 'text-purple-400',
    ring: '#a855f7',
  },
  level3: {
    gradient: 'from-yellow-600/30 via-yellow-500/10 to-transparent',
    border: 'border-yellow-500/40 hover:border-yellow-400/70',
    activeBorder: 'border-yellow-400',
    glow: '0 0 24px rgba(234,179,8,0.20)',
    badge: 'VIP 3',
    badgeBg: 'bg-yellow-500',
    icon: '🏆',
    levelColor: 'text-yellow-400',
    priceColor: 'text-yellow-300',
    statColor: 'text-yellow-400',
    ring: '#eab308',
  },
  level4: {
    gradient: 'from-red-600/30 via-rose-500/10 to-transparent',
    border: 'border-red-500/40 hover:border-red-400/70',
    activeBorder: 'border-red-400',
    glow: '0 0 28px rgba(239,68,68,0.22)',
    badge: 'VIP 4',
    badgeBg: 'bg-gradient-to-r from-red-500 to-rose-600',
    icon: '💠',
    levelColor: 'text-red-400',
    priceColor: 'text-red-300',
    statColor: 'text-red-400',
    ring: '#ef4444',
  },
};

// Default features if not provided by backend
const DEFAULT_FEATURES = {
  level1: [
    'Basic profit rate',
    'Standard withdrawal',
    'Email support',
    'Daily earnings credited',
  ],
  level2: [
    'Higher profit rate',
    'Fast withdrawal (24h)',
    'Priority support',
    'Trade bonus included',
    'Weekly performance report',
  ],
  level3: [
    'Premium profit rate',
    'Fast withdrawal (12h)',
    'VIP support line',
    'Higher trade bonus',
    'Special milestone bonus',
    'Dedicated account manager',
  ],
  level4: [
    'Maximum profit rate',
    'Instant withdrawal',
    '24/7 VIP support',
    'Max trade bonus',
    'Exclusive rewards program',
    'Diamond member badge',
    'Priority trade execution',
  ],
};

// Confirmation modal
function ConfirmModal({ plan, styles, onConfirm, onCancel, purchasing, usdtBalance }) {
  const hasEnough = usdtBalance >= plan.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`${PLAN_PANEL} max-w-md w-full animate-fade-in border p-6`}
        style={{ borderColor: styles.ring + '60' }}
      >
        <div className="text-center mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3"
            style={{ background: styles.ring + '22', border: `2px solid ${styles.ring}44` }}
          >
            {styles.icon}
          </div>
          <h3 className="text-xl font-bold text-text-primary">Confirm Purchase</h3>
          <p className="text-sm text-text-secondary mt-1">
            Purchasing <span className="font-semibold" style={{ color: styles.ring }}>{plan.displayName}</span>
          </p>
        </div>

        <div className="mb-5 space-y-2.5 rounded-[24px] border border-[#dde8e9] bg-[#f7fbfb] p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Plan</span>
            <span className="text-text-primary font-semibold">{plan.displayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Investment</span>
            <span className="text-text-primary">${plan.price.toLocaleString()} USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Daily Return</span>
            <span className="text-green-trade">{plan.dailyReturn}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Duration</span>
            <span className="text-text-primary">{plan.duration} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Max Return</span>
            <span className="text-green-trade">+{plan.maxReturn}%</span>
          </div>
          {plan.tradeBonus > 0 && (
            <div className="flex justify-between">
              <span className="text-text-muted">Trade Bonus</span>
              <span style={{ color: styles.ring }}>+{plan.tradeBonus}%</span>
            </div>
          )}
          <div className="flex justify-between pt-2 font-semibold border-t border-light-border">
            <span className="text-text-muted">Balance After</span>
            <span className={hasEnough ? 'text-text-primary' : 'text-red-trade'}>
              ${(usdtBalance - plan.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </div>
        </div>

        {!hasEnough && (
          <p className="text-sm text-red-trade text-center mb-4">
            Insufficient balance. You need ${plan.price.toLocaleString()} USDT.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-[#d6e2e4] bg-white py-3 text-sm font-semibold text-[#506d72] transition-all hover:-translate-y-0.5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={purchasing || !hasEnough}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: hasEnough ? styles.ring : '#9BA3A6' }}
          >
            {purchasing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : 'Confirm Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myPlan, setMyPlan] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const fetchData = async () => {
    try {
      const [plansRes, myPlanRes, walletRes] = await Promise.all([
        planAPI.getPlans(),
        planAPI.getMyPlan(),
        walletAPI.getWallet(),
      ]);
      setPlans(plansRes.data.plans || []);
      setMyPlan(myPlanRes.data);
      setWallet(walletRes.data);
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    try {
      const { data } = await planAPI.purchasePlan(selectedPlan.name);
      toast.success(data.message);
      setSelectedPlan(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} lines={8} />)}
        </div>
      </div>
    );
  }

  const usdtBalance = wallet?.usdtBalance || 0;
  const currentPlanName = myPlan?.currentPlan || 'none';
  const selectedStyles = selectedPlan ? (LEVEL_STYLES[selectedPlan.name] || LEVEL_STYLES.level1) : null;

  // Sort plans by level
  const sortedPlans = [...plans].sort((a, b) => (a.level || 0) - (b.level || 0));

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {/* Active Plan Banner */}
      {currentPlanName !== 'none' && myPlan?.isActive && (() => {
        const s = LEVEL_STYLES[currentPlanName];
        return s ? (
          <div
            className="rounded-2xl p-4 flex items-center gap-4 border"
            style={{ background: s.ring + '12', borderColor: s.ring + '50' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: s.ring + '22' }}
            >
              {s.icon}
            </div>
            <div className="flex-1">
              <p className="font-bold text-text-primary">{myPlan?.planDetails?.displayName || currentPlanName} — Active</p>
              <p className="text-sm text-text-secondary">
                {myPlan?.planDetails?.dailyReturn}% daily return &middot;
                Expires {new Date(myPlan?.expiresAt).toLocaleDateString()}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-trade/10 text-green-trade border border-green-trade/30">
              ACTIVE
            </span>
          </div>
        ) : null;
      })()}

      {myPlan?.isExpired && (
        <div className="rounded-xl p-4 bg-red-trade/10 border border-red-trade/30">
          <p className="text-sm text-red-trade">
            Your plan has expired. Purchase a new plan to continue earning returns.
          </p>
        </div>
      )}

      {/* Balance info */}
      <div className={`${PLAN_PANEL} flex items-center justify-between rounded-[28px] px-5 py-4`}>
        <span className="text-sm text-text-secondary">Available USDT Balance</span>
        <span className="text-green-trade font-bold text-lg">
          ${usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* VIP Plan Cards — 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {sortedPlans.map((plan) => {
          const styles = LEVEL_STYLES[plan.name] || LEVEL_STYLES.level1;
          const isActive = myPlan?.isActive && currentPlanName === plan.name;
          const canAfford = usdtBalance >= plan.price;
          const features = (plan.features && plan.features.length > 0)
            ? plan.features
            : (DEFAULT_FEATURES[plan.name] || []);

          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-5 flex flex-col border transition-all duration-300 hover:-translate-y-1 bg-white`}
              style={{
                borderColor: isActive ? styles.ring : styles.ring + '44',
                boxShadow: isActive ? styles.glow : '0 1px 3px rgba(0,0,0,0.07)',
              }}
            >
              {/* Level badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-xs font-black px-3 py-1 rounded-full text-white"
                  style={{ background: styles.ring }}
                >
                  {styles.badge}
                </span>
                {isActive && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-trade/10 text-green-trade border border-green-trade/30">
                    ACTIVE
                  </span>
                )}
              </div>

              {/* Icon + Name */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{styles.icon}</span>
                <div>
                  <h3 className="text-lg font-black text-text-primary">{plan.displayName}</h3>
                  <p className="text-xs text-text-muted">{plan.duration}-day investment</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-3xl font-black" style={{ color: styles.ring }}>
                  ${plan.price.toLocaleString()}
                </p>
                <p className="text-xs text-text-muted mt-0.5">one-time USDT investment</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-[20px] border border-[#dde8e9] bg-[#f7fbfb] p-3 text-center">
                  <p className="text-xl font-black" style={{ color: styles.ring }}>{plan.dailyReturn}%</p>
                  <p className="text-xs text-text-muted mt-0.5">Daily Return</p>
                </div>
                <div className="rounded-[20px] border border-[#dde8e9] bg-[#f7fbfb] p-3 text-center">
                  <p className="text-xl font-black text-green-trade">+{plan.maxReturn}%</p>
                  <p className="text-xs text-text-muted mt-0.5">Max Return</p>
                </div>
              </div>

              {/* Extra info row */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {plan.tradeBonus > 0 && (
                  <div className="rounded-xl p-2.5 text-center" style={{ background: styles.ring + '15' }}>
                    <p className="text-sm font-bold" style={{ color: styles.ring }}>+{plan.tradeBonus}%</p>
                    <p className="text-xs text-text-muted">Trade Bonus</p>
                  </div>
                )}
                <div className="rounded-[20px] border border-[#dde8e9] bg-[#f7fbfb] p-2.5 text-center">
                  <p className="text-sm font-bold text-text-primary capitalize">{plan.withdrawSpeed || 'normal'}</p>
                  <p className="text-xs text-text-muted">Withdraw</p>
                </div>
              </div>

              {/* Projected earnings */}
              <div className="mb-4 rounded-[22px] border border-[#dde8e9] bg-[#f7fbfb] p-3">
                <p className="text-xs text-text-muted mb-2">Projected Earnings</p>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Daily profit</span>
                  <span className="text-green-trade font-medium">
                    +${(plan.price * plan.dailyReturn / 100).toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-text-secondary">Total ({plan.duration}d)</span>
                  <span className="text-green-trade font-medium">
                    +${(plan.price * plan.maxReturn / 100).toFixed(2)} USDT
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-1.5 mb-5 flex-1">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                    <span className="text-green-trade mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isActive ? (
                <div className="w-full text-center py-3 rounded-xl text-sm font-bold bg-green-trade/10 border border-green-trade/30 text-green-trade">
                  Currently Active
                </div>
              ) : (
                <button
                  onClick={() => setSelectedPlan(plan)}
                  disabled={!canAfford}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                  style={{
                    background: canAfford
                      ? `linear-gradient(135deg, ${styles.ring} 0%, ${styles.ring}cc 100%)`
                      : '#9BA3A6',
                  }}
                >
                  {canAfford ? `Get ${plan.displayName}` : 'Insufficient Balance'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* How Plans Work */}
      <div className={`${PLAN_PANEL} rounded-[32px] p-6`}>
        <h3 className="font-bold text-text-primary mb-4">How VIP Investment Plans Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">1️⃣</span>
            <div>
              <p className="font-semibold text-text-primary mb-1">Choose Your VIP Level</p>
              <p className="text-text-secondary">Select the VIP plan that matches your investment goals and pay the one-time USDT fee.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">2️⃣</span>
            <div>
              <p className="font-semibold text-text-primary mb-1">Earn Daily Returns</p>
              <p className="text-text-secondary">Your plan generates daily returns credited to your account for the full plan duration.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">3️⃣</span>
            <div>
              <p className="font-semibold text-text-primary mb-1">Unlock VIP Benefits</p>
              <p className="text-text-secondary">Higher levels unlock faster withdrawals, trade bonuses, and priority VIP support.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedPlan && selectedStyles && (
        <ConfirmModal
          plan={selectedPlan}
          styles={selectedStyles}
          onConfirm={handlePurchase}
          onCancel={() => setSelectedPlan(null)}
          purchasing={purchasing}
          usdtBalance={usdtBalance}
        />
      )}
    </div>
  );
}
