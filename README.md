# CryptoTrade — Full-Stack Demo Trading Dashboard

> A realistic Binance-inspired crypto trading platform built with React, Node.js, and MongoDB.
> **All trades are 100% simulated. No real money or cryptocurrency is involved.**

---

## Features

### User Features
- **JWT Authentication** — Register/login with hashed passwords (bcrypt)
- **$10,000 Demo Balance** — Start trading immediately, no deposit needed
- **Live Market Prices** — Fetched from CoinGecko API (15 supported coins)
- **Simulated Trading** — Buy/sell 15 cryptocurrencies at real market prices
- **Portfolio Dashboard** — Live P&L, holdings breakdown, portfolio distribution chart
- **TradingView Charts** — Embedded professional candlestick charts
- **Transaction History** — Full ledger of all account activity
- **Referral System** — Unique referral codes, +$50 bonus per referral
- **Dark/Light Mode** — Persistent theme preference

### Admin Features
- **Admin Panel** — View all users, all trades, platform stats
- **Balance Modification** — Credit or debit any user's demo balance
- **Role Management** — Promote/demote users to admin

### UI/UX
- Binance-inspired dark theme with custom design system
- Animated number transitions on balance updates
- Skeleton loaders on every page
- Live demo notification feed (clearly labeled)
- Fully responsive (mobile + desktop)
- Toast notifications for all actions
- Rate limiting on all API routes

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Chart.js, Axios   |
| Backend    | Node.js, Express.js                             |
| Database   | MongoDB (Mongoose)                              |
| Auth       | JWT, bcryptjs                                   |
| Charts     | TradingView Widget, Chart.js (Doughnut + Line)  |
| Prices     | CoinGecko Public API                            |

---

## Project Structure

```
kafi web/
├── backend/
│   ├── server.js                  # Entry point
│   ├── .env.example               # Environment template
│   └── src/
│       ├── config/db.js           # MongoDB connection
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── walletController.js
│       │   ├── tradeController.js
│       │   ├── transactionController.js
│       │   ├── marketController.js
│       │   └── adminController.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Trade.js
│       │   └── Transaction.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── wallet.js
│       │   ├── trade.js
│       │   ├── transactions.js
│       │   ├── market.js
│       │   └── admin.js
│       ├── middleware/
│       │   ├── auth.js            # JWT guard
│       │   ├── adminAuth.js       # Admin role guard
│       │   └── rateLimiter.js     # express-rate-limit
│       └── utils/
│           └── priceService.js    # CoinGecko integration + cache
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env.example
    └── src/
        ├── main.jsx               # React entry
        ├── App.jsx                # Router + providers
        ├── index.css              # Tailwind + custom classes
        ├── context/
        │   ├── AuthContext.jsx    # Global auth state
        │   └── ThemeContext.jsx   # Dark/light mode
        ├── services/
        │   └── api.js             # Axios API layer
        ├── hooks/
        │   └── useMarketPrices.js # Polling hook
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Trading.jsx
        │   ├── Transactions.jsx
        │   └── Admin.jsx
        └── components/
            ├── Layout.jsx
            ├── Navbar.jsx
            ├── Sidebar.jsx
            ├── AnimatedNumber.jsx
            ├── PriceChange.jsx
            ├── SkeletonCard.jsx
            └── NotificationFeed.jsx
```

---

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB running locally or MongoDB Atlas connection string
- npm or yarn

### 1. Clone and set up environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Start the backend

```bash
cd backend
npm run dev   # Runs on http://localhost:5000
```

### 3. Start the frontend

```bash
cd frontend
npm run dev   # Runs on http://localhost:3001
```

Open [http://localhost:3001](http://localhost:3001) — register an account and start trading!

---

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Description                          | Default                            |
|------------------|--------------------------------------|------------------------------------|
| `PORT`           | Server port                          | `5000`                             |
| `NODE_ENV`       | Environment                          | `development`                      |
| `MONGODB_URI`    | MongoDB connection string            | `mongodb://localhost:27017/crypto_trading` |
| `JWT_SECRET`     | Secret for signing tokens            | *(required)*                       |
| `JWT_EXPIRES_IN` | Token expiry                         | `7d`                               |
| `DEFAULT_BALANCE`| Starting demo balance                | `10000`                            |
| `FRONTEND_URL`   | CORS allowed origin                  | `http://localhost:3001`            |

---

## API Endpoints

### Auth
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | `/api/auth/register`  | Register new user    |
| POST   | `/api/auth/login`     | Login                |
| GET    | `/api/auth/me`        | Get current user     |

### Wallet
| Method | Endpoint       | Description                    |
|--------|----------------|--------------------------------|
| GET    | `/api/wallet`  | Portfolio + balance + holdings |

### Trading
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| POST   | `/api/trade/buy`      | Simulate buy trade |
| POST   | `/api/trade/sell`     | Simulate sell trade|
| GET    | `/api/trade/history`  | User trade history |

### Transactions
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| GET    | `/api/transactions` | Transaction ledger   |

### Market (public)
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | `/api/market/prices`  | Live coin prices     |

### Admin (admin role required)
| Method | Endpoint                        | Description          |
|--------|---------------------------------|----------------------|
| GET    | `/api/admin/stats`              | Platform stats       |
| GET    | `/api/admin/users`              | List all users       |
| GET    | `/api/admin/trades`             | List all trades      |
| PATCH  | `/api/admin/users/:id/balance`  | Modify user balance  |
| PATCH  | `/api/admin/users/:id/role`     | Set user role        |

---

## Creating an Admin User

After registering normally, update the user role in MongoDB:

```js
// In MongoDB shell or Compass
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## Deployment

### Backend → Render / Railway

1. Set all environment variables in your hosting dashboard
2. Set build command: `npm install`
3. Set start command: `node server.js`

### Frontend → Vercel

1. Set `VITE_API_BASE_URL` to your backend URL
2. Update `vite.config.js` proxy for production (or use env var in `api.js`)
3. Deploy from `/frontend` directory

---

## Supported Coins

BTC, ETH, BNB, SOL, XRP, ADA, DOGE, MATIC, DOT, LINK, AVAX, UNI, LTC, ATOM, TRX

---

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens with configurable expiry
- Input validation via express-validator
- Rate limiting: 200 req/15min global, 20 req/15min auth, 30 req/min trading
- CORS restricted to frontend origin
- Admin routes protected by role middleware

---

> Built as a portfolio demo project. All trading is simulated.
