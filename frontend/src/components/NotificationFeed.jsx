import React, { useState, useEffect } from 'react';

const USERS = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry', 'Isla', 'Jack'];
const COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE', 'AVAX', 'LINK'];
const ACTIONS = ['bought', 'sold'];

const generateNotification = () => {
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  const coin = COINS[Math.floor(Math.random() * COINS.length)];
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const amount = (Math.random() * 500 + 50).toFixed(0);
  return { id: Date.now(), user, coin, action, amount };
};

export default function NotificationFeed() {
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        const notif = generateNotification();
        setNotifications((prev) => [notif, ...prev].slice(0, 4));

        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        }, 5000);
      }, 4000 + Math.random() * 3000);

      return () => clearInterval(interval);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2 max-w-xs pointer-events-none">
      <button
        onClick={() => setVisible(false)}
        className="pointer-events-auto absolute -top-6 right-0 text-xs text-text-muted hover:text-text-secondary"
      >
        Hide
      </button>

      {notifications.map((n) => (
        <div
          key={n.id}
          className="bg-light-card border border-light-border rounded-xl px-4 py-3 shadow-lg animate-slide-up"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-trade animate-pulse flex-shrink-0" />
            <p className="text-xs text-text-secondary">
              <span className="text-text-primary font-medium">{n.user}</span>
              {' '}{n.action}{' '}
              <span className={n.action === 'bought' ? 'text-green-trade' : 'text-red-trade'}>
                ${n.amount}
              </span>
              {' of '}<span className="text-brand-primary font-medium">{n.coin}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
